const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');
const util = require('util');
const TaxSync = require('./TaxSync');

/**
 * 同步分类数据
 * @returns {Promise<void>}
 */
async function syncCategory() {
    let sourceConnection;
    let targetConnection;

    try {
        // 获取数据库连接
        sourceConnection = await sourcePool.getConnection();
        targetConnection = await targetPool.getConnection();

        // 开始事务
        await targetConnection.beginTransaction();

        try {
            // 1. 同步主分类表
            await syncMainCategory(sourceConnection, targetConnection);
            
            // 2. 同步分类描述表
            await syncCategoryDescription(sourceConnection, targetConnection);
            
            // 3. 同步分类筛选表
            await syncCategoryFilter(sourceConnection, targetConnection);
            
            // 4. 同步分类路径表
            await syncCategoryPath(sourceConnection, targetConnection);
            
            // 5. 同步分类布局表
            await syncCategoryToLayout(sourceConnection, targetConnection);
            
            // 6. 同步分类商店关联表
            await syncCategoryToStore(sourceConnection, targetConnection);

            // 提交事务
            await targetConnection.commit();
            logger.success('所有分类数据同步完成');
        } catch (error) {
            // 回滚事务
            await targetConnection.rollback();
            throw error;
        }
    } catch (error) {
        logger.error('同步分类数据时发生错误', error);
        throw error;
    } finally {
        // 释放数据库连接
        if (sourceConnection) sourceConnection.release();
        if (targetConnection) targetConnection.release();
    }
}

/**
 * 同步主分类表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncMainCategory(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_category');

    // 获取源数据
    const [categories] = await sourceConnection.query('SELECT * FROM category');

    // 插入数据到目标表
    if (categories.length > 0) {
        const values = categories.map(category => [
            category.category_id,
            category.image,
            category.parent_id,
            category.sort_order,
            category.status
        ]);

        await targetConnection.query(
            'INSERT INTO oc_category (category_id, image, parent_id, sort_order, status) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${categories.length} 条主分类数据`);
}

/**
 * 同步分类描述表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncCategoryDescription(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_category_description');

    // 获取源数据
    const [descriptions] = await sourceConnection.query('SELECT * FROM category_description');

    // 插入数据到目标表
    if (descriptions.length > 0) {
        const values = descriptions.map(desc => [
            desc.category_id,
            desc.language_id,
            desc.name,
            desc.description,
            desc.meta_title,
            desc.meta_description,
            desc.meta_keyword
        ]);

        await targetConnection.query(
            'INSERT INTO oc_category_description (category_id, language_id, name, description, meta_title, meta_description, meta_keyword) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${descriptions.length} 条分类描述数据`);
}

/**
 * 同步分类筛选表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncCategoryFilter(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_category_filter');

    // 获取源数据
    const [filters] = await sourceConnection.query('SELECT * FROM category_filter');

    // 插入数据到目标表
    if (filters.length > 0) {
        const values = filters.map(filter => [
            filter.category_id,
            filter.filter_id
        ]);

        await targetConnection.query(
            'INSERT INTO oc_category_filter (category_id, filter_id) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${filters.length} 条分类筛选关联数据`);
}

/**
 * 同步分类路径表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncCategoryPath(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_category_path');

    // 获取源数据
    const [paths] = await sourceConnection.query('SELECT * FROM category_path');

    // 插入数据到目标表
    if (paths.length > 0) {
        const values = paths.map(path => [
            path.category_id,
            path.path_id,
            path.level
        ]);

        await targetConnection.query(
            'INSERT INTO oc_category_path (category_id, path_id, level) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${paths.length} 条分类路径数据`);
}

/**
 * 同步分类布局表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncCategoryToLayout(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_category_to_layout');

    // 获取源数据
    const [layouts] = await sourceConnection.query('SELECT * FROM category_to_layout');

    // 插入数据到目标表
    if (layouts.length > 0) {
        const values = layouts.map(layout => [
            layout.category_id,
            layout.store_id,
            layout.layout_id
        ]);

        await targetConnection.query(
            'INSERT INTO oc_category_to_layout (category_id, store_id, layout_id) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${layouts.length} 条分类布局数据`);
}

/**
 * 同步分类商店关联表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncCategoryToStore(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_category_to_store');

    // 获取源数据
    const [stores] = await sourceConnection.query('SELECT * FROM category_to_store');

    // 插入数据到目标表
    if (stores.length > 0) {
        const values = stores.map(store => [
            store.category_id,
            store.store_id
        ]);

        await targetConnection.query(
            'INSERT INTO oc_category_to_store (category_id, store_id) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${stores.length} 条分类商店关联数据`);
}

/**
 * 同步SEO数据（url_alias -> oc_seo_url）
 * @returns {Promise<void>}
 */
async function syncSeo() {
    let sourceConnection;
    let targetConnection;
    try {
        sourceConnection = await sourcePool.getConnection();
        targetConnection = await targetPool.getConnection();
        await targetConnection.beginTransaction();
        // 清空目标表
        await targetConnection.query('TRUNCATE TABLE oc_seo_url');
        // 获取源数据
        const [rows] = await sourceConnection.query('SELECT * FROM url_alias');
        if (rows.length > 0) {
            const values = rows.map(row => {
                const [key, value] = row.query.split('=');
                // 如果key等于category_id，则改为path
                const finalKey = key === 'category_id' ? 'path' : key;
                return [
                    // seo_url_id 自增，插入时可用NULL
                    null,
                    finalKey || '',
                    value || '',
                    row.keyword,
                    0, // store_id
                    1, // language_id
                    1  // sort_order
                ];
            });
            await targetConnection.query(
                'INSERT INTO oc_seo_url (seo_url_id, `key`, `value`, keyword, store_id, language_id, sort_order) VALUES ?',[values]
            );
        }
        await targetConnection.commit();
        logger.info(`成功同步 ${rows.length} 条SEO数据`);
    } catch (error) {
        if (targetConnection) await targetConnection.rollback();
        logger.error('同步SEO数据时发生错误', error);
        throw error;
    } finally {
        if (sourceConnection) sourceConnection.release();
        if (targetConnection) targetConnection.release();
    }
}

/**
 * 同步Option数据
 * @returns {Promise<void>}
 */
async function syncOption() {
    let sourceConnection;
    let targetConnection;
    try {
        sourceConnection = await sourcePool.getConnection();
        targetConnection = await targetPool.getConnection();
        await targetConnection.beginTransaction();

        // 1. 同步主表
        await syncMainOption(sourceConnection, targetConnection);
        
        // 2. 同步描述表
        await syncOptionDescription(sourceConnection, targetConnection);
        
        // 3. 同步值表
        await syncOptionValue(sourceConnection, targetConnection);
        
        // 4. 同步值描述表
        await syncOptionValueDescription(sourceConnection, targetConnection);

        await targetConnection.commit();
        logger.info('所有Option数据同步完成');
    } catch (error) {
        if (targetConnection) await targetConnection.rollback();
        logger.error('同步Option数据时发生错误', error);
        throw error;
    } finally {
        if (sourceConnection) sourceConnection.release();
        if (targetConnection) targetConnection.release();
    }
}

/**
 * 同步Option扩展字段
 * @returns {Promise<void>}
 */
async function syncOptionExtended() {
    let targetConnection;
    try {
        targetConnection = await targetPool.getConnection();
        await targetConnection.beginTransaction();

        logger.info('开始修改 oc_option_description 表...');
        // 1. 修改 oc_option_description 表，添加 related_children_option_id 字段
        await targetConnection.query(`
            ALTER TABLE oc_option_description
            ADD COLUMN related_children_option_id int(11) DEFAULT NULL AFTER name
        `);
        logger.info('oc_option_description 表修改成功');

        logger.info('开始修改 oc_option_value 表...');
        // 2. 修改 oc_option_value 表，添加 price_prefix, price, related_option_value_ids 字段
        await targetConnection.query(`
            ALTER TABLE oc_option_value
            ADD COLUMN price_prefix varchar(1) DEFAULT NULL AFTER option_id,
            ADD COLUMN price decimal(15,4) DEFAULT NULL AFTER price_prefix,
            ADD COLUMN related_option_value_ids text COLLATE utf8mb4_unicode_ci AFTER price
        `);
        logger.info('oc_option_value 表修改成功');

        logger.info('开始修改 oc_option_value_description 表...');
        // 3. 修改 oc_option_value_description 表，添加 linkage_option_id 字段
        await targetConnection.query(`
            ALTER TABLE oc_option_value_description
            ADD COLUMN linkage_option_id int(11) DEFAULT NULL AFTER name
        `);
        logger.info('oc_option_value_description 表修改成功');

        await targetConnection.commit();
        logger.info('Option扩展字段同步完成');
    } catch (error) {
        if (targetConnection) await targetConnection.rollback();
        logger.error('同步Option扩展字段时发生错误', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        throw error;
    } finally {
        if (targetConnection) targetConnection.release();
    }
}

/**
 * 同步主表
 * @param {mysql.Connection} sourceConnection
 * @param {mysql.Connection} targetConnection
 */
async function syncMainOption(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_option');
    
    // 获取源数据
    const [rows] = await sourceConnection.query('SELECT * FROM `option`');
    
    if (rows.length > 0) {
        const values = rows.map(row => [
            row.option_id,
            row.type,
            null, // validation
            row.sort_order
        ]);
        
        await targetConnection.query(
            'INSERT INTO oc_option (option_id, type, validation, sort_order) VALUES ?',
            [values]
        );
    }
    
    logger.info(`成功同步 ${rows.length} 条主表数据`);
}

/**
 * 同步描述表
 * @param {mysql.Connection} sourceConnection
 * @param {mysql.Connection} targetConnection
 */
async function syncOptionDescription(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_option_description');
    
    // 获取源数据
    const [rows] = await sourceConnection.query('SELECT * FROM `option_description`');
    
    if (rows.length > 0) {
        const values = rows.map(row => [
            row.option_id,
            row.language_id,
            row.name,
            row.related_children_option_id || null
        ]);
        
        await targetConnection.query(
            'INSERT INTO oc_option_description (option_id, language_id, name, related_children_option_id) VALUES ?',
            [values]
        );
    }
    
    logger.info(`成功同步 ${rows.length} 条描述表数据`);
}

/**
 * 同步值表
 * @param {mysql.Connection} sourceConnection
 * @param {mysql.Connection} targetConnection
 */
async function syncOptionValue(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_option_value');
    
    // 获取源数据
    const [rows] = await sourceConnection.query('SELECT * FROM `option_value`');
    
    if (rows.length > 0) {
        const values = rows.map(row => [
            row.option_value_id,
            row.option_id,
            row.price_prefix || null,
            row.price || null,
            row.related_option_value_ids || null,
            row.image,
            row.sort_order
        ]);
        
        await targetConnection.query(
            'INSERT INTO oc_option_value (option_value_id, option_id, price_prefix, price, related_option_value_ids, image, sort_order) VALUES ?',
            [values]
        );
    }
    
    logger.info(`成功同步 ${rows.length} 条值表数据`);
}

/**
 * 同步值描述表
 * @param {mysql.Connection} sourceConnection
 * @param {mysql.Connection} targetConnection
 */
async function syncOptionValueDescription(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_option_value_description');
    
    // 获取源数据
    const [rows] = await sourceConnection.query('SELECT * FROM `option_value_description`');
    
    if (rows.length > 0) {
        const values = rows.map(row => [
            row.option_value_id,
            row.language_id,
            row.option_id,
            row.name,
            row.linkage_option_id || null
        ]);
        
        await targetConnection.query(
            'INSERT INTO oc_option_value_description (option_value_id, language_id, option_id, name, linkage_option_id) VALUES ?',
            [values]
        );
    }
    
    logger.info(`成功同步 ${rows.length} 条值描述表数据`);
}

/**
 * 同步筛选数据
 * @returns {Promise<void>}
 */
async function syncAllFilters() {
    let sourceConnection;
    let targetConnection;

    try {
        // 获取数据库连接
        sourceConnection = await sourcePool.getConnection();
        targetConnection = await targetPool.getConnection();

        // 开始事务
        await targetConnection.beginTransaction();

        try {
            // 1. 同步筛选组
            await syncFilterGroup(sourceConnection, targetConnection);
            
            // 2. 同步筛选组描述
            await syncFilterGroupDescription(sourceConnection, targetConnection);
            
            // 3. 同步筛选
            await syncFilterData(sourceConnection, targetConnection);
            
            // 4. 同步筛选描述
            await syncFilterDescription(sourceConnection, targetConnection);
            
            // 5. 同步分类筛选关联
            await syncCategoryFilter(sourceConnection, targetConnection);
            
            // 6. 同步产品筛选关联
            await syncProductFilter(sourceConnection, targetConnection);

            // 提交事务
            await targetConnection.commit();
            logger.success('所有筛选数据同步完成');
        } catch (error) {
            // 回滚事务
            await targetConnection.rollback();
            throw error;
        }
    } catch (error) {
        logger.error('同步筛选数据时发生错误', error);
        throw error;
    } finally {
        // 释放数据库连接
        if (sourceConnection) sourceConnection.release();
        if (targetConnection) targetConnection.release();
    }
}

/**
 * 同步筛选数据
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncFilterData(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_filter');

    // 获取源数据
    const [filters] = await sourceConnection.query('SELECT * FROM filter');

    // 插入数据到目标表
    if (filters.length > 0) {
        const values = filters.map(filter => [
            filter.filter_id,
            filter.filter_group_id,
            filter.sort_order
        ]);

        await targetConnection.query(
            'INSERT INTO oc_filter (filter_id, filter_group_id, sort_order) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${filters.length} 条筛选数据`);
}

/**
 * 同步筛选组
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncFilterGroup(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_filter_group');

    // 获取源数据
    const [groups] = await sourceConnection.query('SELECT * FROM filter_group');

    // 插入数据到目标表
    if (groups.length > 0) {
        const values = groups.map(group => [
            group.filter_group_id,
            group.sort_order
        ]);

        await targetConnection.query(
            'INSERT INTO oc_filter_group (filter_group_id, sort_order) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${groups.length} 条筛选组数据`);
}

/**
 * 同步筛选组描述
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncFilterGroupDescription(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_filter_group_description');

    // 获取源数据
    const [descriptions] = await sourceConnection.query('SELECT * FROM filter_group_description');

    // 插入数据到目标表
    if (descriptions.length > 0) {
        const values = descriptions.map(desc => [
            desc.filter_group_id,
            desc.language_id,
            desc.name
        ]);

        await targetConnection.query(
            'INSERT INTO oc_filter_group_description (filter_group_id, language_id, name) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${descriptions.length} 条筛选组描述数据`);
}

/**
 * 同步筛选描述
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncFilterDescription(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_filter_description');

    // 获取源数据
    const [descriptions] = await sourceConnection.query('SELECT * FROM filter_description');

    // 插入数据到目标表
    if (descriptions.length > 0) {
        const values = descriptions.map(desc => [
            desc.filter_id,
            desc.language_id,
            desc.name
        ]);

        await targetConnection.query(
            'INSERT INTO oc_filter_description (filter_id, language_id, name) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${descriptions.length} 条筛选描述数据`);
}

/**
 * 同步产品筛选关联
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncProductFilter(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_product_filter');

    // 获取源数据
    const [filters] = await sourceConnection.query('SELECT * FROM product_filter');

    // 插入数据到目标表
    if (filters.length > 0) {
        const values = filters.map(filter => [
            filter.product_id,
            filter.filter_id
        ]);

        await targetConnection.query(
            'INSERT INTO oc_product_filter (product_id, filter_id) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${filters.length} 条产品筛选关联数据`);
}

/**
 * 同步制造商相关表（全量覆盖式）
 * @returns {Promise<void>}
 */
async function syncManufacturer() {
    let sourceConnection;
    let targetConnection;

    try {
        // 获取数据库连接
        sourceConnection = await sourcePool.getConnection();
        targetConnection = await targetPool.getConnection();

        // 开始事务
        await targetConnection.beginTransaction();

        try {
            // 1. 同步制造商表
            await syncManufacturerTable(sourceConnection, targetConnection);
            
            // 2. 同步制造商商店关联表
            await syncManufacturerToStoreTable(sourceConnection, targetConnection);

            // 提交事务
            await targetConnection.commit();
            logger.success('所有制造商数据同步完成');
        } catch (error) {
            // 回滚事务
            await targetConnection.rollback();
            throw error;
        }
    } catch (error) {
        logger.error('同步制造商数据时发生错误', error);
        throw error;
    } finally {
        // 释放数据库连接
        if (sourceConnection) sourceConnection.release();
        if (targetConnection) targetConnection.release();
    }
}

/**
 * 同步制造商表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncManufacturerTable(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_manufacturer');

    // 获取源数据
    const [manufacturers] = await sourceConnection.query('SELECT * FROM manufacturer');

    // 插入数据到目标表
    if (manufacturers.length > 0) {
        const values = manufacturers.map(manufacturer => [
            manufacturer.manufacturer_id,
            manufacturer.name,
            manufacturer.image,
            manufacturer.sort_order
        ]);

        await targetConnection.query(
            'INSERT INTO oc_manufacturer (manufacturer_id, name, image, sort_order) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${manufacturers.length} 条制造商数据`);
}

/**
 * 同步制造商商店关联表
 * @param {mysql.Connection} sourceConnection - 源数据库连接
 * @param {mysql.Connection} targetConnection - 目标数据库连接
 */
async function syncManufacturerToStoreTable(sourceConnection, targetConnection) {
    // 清空目标表
    await targetConnection.query('TRUNCATE TABLE oc_manufacturer_to_store');

    // 获取源数据
    const [stores] = await sourceConnection.query('SELECT * FROM manufacturer_to_store');

    // 插入数据到目标表
    if (stores.length > 0) {
        const values = stores.map(store => [
            store.manufacturer_id,
            store.store_id
        ]);

        await targetConnection.query(
            'INSERT INTO oc_manufacturer_to_store (manufacturer_id, store_id) VALUES ?',
            [values]
        );
    }

    logger.info(`成功同步 ${stores.length} 条制造商商店关联数据`);
}

/**
 * 同步税率相关数据
 * @returns {Promise<void>}
 */
async function syncTax() {
    const result = await TaxSync.syncAll();
    if (!result.success) {
        throw new Error(result.message);
    }
}

module.exports = {
    syncCategory,
    syncSeo,
    syncOption,
    syncOptionExtended,
    syncFilter: syncAllFilters,
    syncManufacturer,
    syncTax
}; 