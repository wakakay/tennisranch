const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Banner同步服务类
 */
class BannerSync {
    /**
     * 同步banner_image表
     * @returns {Promise<void>}
     */
    static async syncBannerImage() {
        let sourceConn;
        let targetConn;

        try {
            // 获取数据库连接
            sourceConn = await sourcePool.getConnection();
            targetConn = await targetPool.getConnection();

            // 开始事务
            await targetConn.beginTransaction();

            try {
                // 清空目标表
                await targetConn.query('TRUNCATE TABLE oc_banner_image');

                // 获取源数据
                const [rows] = await sourceConn.query('SELECT * FROM banner_image');

                if (rows.length > 0) {
                    // 获取所有字段
                    const fields = Object.keys(rows[0]);
                    // 构造批量插入数据
                    const values = rows.map(row => fields.map(field => row[field]));

                    // 批量插入数据
                    await targetConn.query(
                        `INSERT INTO oc_banner_image (${fields.join(',')}) VALUES ?`,
                        [values]
                    );
                }

                // 提交事务
                await targetConn.commit();
                logger.success(`成功同步 ${rows.length} 条banner_image数据`);
            } catch (error) {
                // 回滚事务
                await targetConn.rollback();
                throw error;
            }
        } catch (error) {
            logger.error('同步banner_image数据失败:', error);
            throw error;
        } finally {
            // 释放数据库连接
            if (sourceConn) sourceConn.release();
            if (targetConn) targetConn.release();
        }
    }

    /**
     * 同步banner表
     * @returns {Promise<void>}
     */
    static async syncBanner() {
        let sourceConn;
        let targetConn;

        try {
            // 获取数据库连接
            sourceConn = await sourcePool.getConnection();
            targetConn = await targetPool.getConnection();

            // 开始事务
            await targetConn.beginTransaction();

            try {
                // 清空目标表
                await targetConn.query('TRUNCATE TABLE oc_banner');

                // 获取源数据
                const [rows] = await sourceConn.query('SELECT * FROM banner');

                if (rows.length > 0) {
                    // 获取所有字段
                    const fields = Object.keys(rows[0]);
                    // 构造批量插入数据
                    const values = rows.map(row => fields.map(field => row[field]));

                    // 批量插入数据
                    await targetConn.query(
                        `INSERT INTO oc_banner (${fields.join(',')}) VALUES ?`,
                        [values]
                    );
                }

                // 提交事务
                await targetConn.commit();
                logger.success(`成功同步 ${rows.length} 条banner数据`);
            } catch (error) {
                // 回滚事务
                await targetConn.rollback();
                throw error;
            }
        } catch (error) {
            logger.error('同步banner数据失败:', error);
            throw error;
        } finally {
            // 释放数据库连接
            if (sourceConn) sourceConn.release();
            if (targetConn) targetConn.release();
        }
    }

    /**
     * 同步所有banner相关数据
     * @returns {Promise<void>}
     */
    static async syncAll() {
        try {
            // 同步banner表
            await this.syncBanner();
            // 同步banner_image表
            await this.syncBannerImage();
            logger.success('所有banner数据同步完成');
        } catch (error) {
            logger.error('同步banner数据失败:', error);
            throw error;
        }
    }
}

module.exports = BannerSync; 