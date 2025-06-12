const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 产品数据同步服务
 */
class ProductService {
    /**
     * 同步产品数据
     * @returns {Promise<Object>} 同步结果
     */
    static async syncProduct() {
        let sourceConn;
        let targetConn;
        const result = {
            success: true,
            details: {}
        };

        try {
            // 获取数据库连接
            sourceConn = await sourcePool.getConnection();
            targetConn = await targetPool.getConnection();

            // 开始事务
            await targetConn.beginTransaction();

            try {
                // 1. 同步基础表
                await this.syncBaseTables(sourceConn, targetConn);
                
                // 2. 同步特殊表
                await this.syncSpecialTables(sourceConn, targetConn);
                
                // 3. 同步关联表
                await this.syncRelatedTables(sourceConn, targetConn);

                // 提交事务
                await targetConn.commit();
                logger.success('产品数据同步完成');
                return result;
            } catch (error) {
                // 回滚事务
                await targetConn.rollback();
                throw error;
            }
        } catch (error) {
            logger.error('产品数据同步失败:', error);
            throw error;
        } finally {
            // 释放数据库连接
            if (sourceConn) sourceConn.release();
            if (targetConn) targetConn.release();
        }
    }

    /**
     * 同步基础表（中转模式）
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncBaseTables(sourceConn, targetConn) {
        logger.info('开始同步基础表...');
        // 1. 查源库所有产品数据
        const [rows] = await sourceConn.query('SELECT * FROM product');
        if (!rows.length) {
            logger.info('源库无产品数据');
            return;
        }

        // 2. 处理 viewed 数据
        const viewedData = rows.map(row => [row.product_id, row.viewed || 0]);
        if (viewedData.length > 0) {
            await targetConn.query('TRUNCATE TABLE oc_product_viewed');
            await targetConn.query(
                'INSERT INTO oc_product_viewed (product_id, viewed) VALUES ?',
                [viewedData]
            );
            logger.info(`同步 viewed 数据到 oc_product_viewed: ${viewedData.length} 条`);
        }

        // 3. 构造批量插入SQL（排除 viewed 字段）
        const fields = Object.keys(rows[0]).filter(f => f !== 'viewed');
        const values = rows.map(row => fields.map(f => row[f]));
        
        // 4. 清空并批量插入目标库
        await targetConn.query('TRUNCATE TABLE oc_product');
        const sql = `INSERT INTO oc_product (${fields.join(',')}) VALUES ?`;
        await targetConn.query(sql, [values]);
        logger.info(`基础表同步完成，共同步 ${rows.length} 条数据`);
    }

    /**
     * 同步特殊表（中转模式）
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncSpecialTables(sourceConn, targetConn) {
        logger.info('开始同步特殊表...');
        // 清空目标表
        await targetConn.query('TRUNCATE TABLE oc_product_discount');

        // 1. product_discount
        const [discountRows] = await sourceConn.query('SELECT * FROM product_discount');
        if (discountRows.length) {
            // 排除 product_discount_id 字段
            const fields = Object.keys(discountRows[0]).filter(f => f !== 'product_discount_id');
            const values = discountRows.map(row => fields.map(f => row[f]));
            const sql = `INSERT INTO oc_product_discount (${fields.join(',')},type,special) VALUES ?`;
            // 增加 type/special 字段
            const valuesWithType = values.map(v => v.concat(['discount', 0]));
            await targetConn.query(sql, [valuesWithType]);
            logger.info(`同步 product_discount -> oc_product_discount: ${discountRows.length} 条`);
        }
        // 2. product_special
        const [specialRows] = await sourceConn.query('SELECT * FROM product_special');
        if (specialRows.length) {
            // 排除 product_special_id 字段
            const fields = Object.keys(specialRows[0]).filter(f => f !== 'product_special_id');
            const values = specialRows.map(row => fields.map(f => row[f]));
            const sql = `INSERT INTO oc_product_discount (${fields.join(',')},type,special) VALUES ?`;
            // 增加 type/special 字段
            const valuesWithType = values.map(v => v.concat(['special', 1]));
            await targetConn.query(sql, [valuesWithType]);
            logger.info(`同步 product_special -> oc_product_discount: ${specialRows.length} 条`);
        }
        logger.info('特殊表同步完成');
    }

    /**
     * 同步关联表（中转模式）
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncRelatedTables(sourceConn, targetConn) {
        logger.info('开始同步关联表...');
        const tables = [
            { source: 'product_attribute', target: 'oc_product_attribute' },
            { source: 'product_description', target: 'oc_product_description' },
            { source: 'product_filter', target: 'oc_product_filter' },
            { source: 'product_image', target: 'oc_product_image' },
            { source: 'product_option', target: 'oc_product_option' },
            { source: 'product_option_value', target: 'oc_product_option_value' },
            { source: 'product_related', target: 'oc_product_related' },
            { source: 'product_reward', target: 'oc_product_reward' },
            { source: 'product_to_category', target: 'oc_product_to_category' },
            { source: 'product_to_download', target: 'oc_product_to_download' },
            { source: 'product_to_layout', target: 'oc_product_to_layout' },
            { source: 'product_to_store', target: 'oc_product_to_store' }
        ];

        for (const table of tables) {
            logger.info(`正在同步 ${table.source} 表...`);
            // 清空目标表
            await targetConn.query(`TRUNCATE TABLE ${table.target}`);
            
            const [rows] = await sourceConn.query(`SELECT * FROM ${table.source}`);
            if (!rows.length) {
                logger.info(`源库 ${table.source} 无数据`);
                continue;
            }
            const fields = Object.keys(rows[0]);
            const values = rows.map(row => fields.map(f => row[f]));
            // 构造批量插入SQL
            const sql = `INSERT INTO ${table.target} (${fields.join(',')}) VALUES ?`;
            await targetConn.query(sql, [values]);
            logger.info(`${table.source} -> ${table.target} 同步完成，共 ${rows.length} 条`);
        }
        logger.info('所有关联表同步完成');
    }

    /**
     * 获取更新字段
     * @param {string} tableName - 表名
     * @returns {string} 更新字段
     */
    static getUpdateFields(tableName) {
        switch (tableName) {
            case 'product_attribute':
                return 'text = VALUES(text)';
            case 'product_description':
                return 'name = VALUES(name), description = VALUES(description), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), meta_keyword = VALUES(meta_keyword), tag = VALUES(tag)';
            case 'product_filter':
            case 'product_image':
            case 'product_related':
            case 'product_to_category':
            case 'product_to_download':
            case 'product_to_layout':
            case 'product_to_store':
                return '';
            case 'product_option':
                return 'value = VALUES(value), required = VALUES(required)';
            case 'product_option_value':
                return 'quantity = VALUES(quantity), subtract = VALUES(subtract), price = VALUES(price), price_prefix = VALUES(price_prefix), points = VALUES(points), points_prefix = VALUES(points_prefix), weight = VALUES(weight), weight_prefix = VALUES(weight_prefix)';
            case 'product_reward':
                return 'points = VALUES(points)';
            default:
                return '';
        }
    }
}

module.exports = ProductService; 