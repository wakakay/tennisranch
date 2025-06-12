const syncService = require('../services/syncService');
const logger = require('../utils/logger');
const { sourcePool, targetPool } = require('../config/database');
const ReturnSync = require('../services/ReturnSync');
const ReviewSync = require('../services/ReviewSync');
const CustomerSync = require('../services/CustomerSync');

/**
 * 同步分类数据
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
async function syncCategory(req, res) {
    try {
        logger.info('开始同步分类数据...');
        await syncService.syncCategory();
        logger.success('分类数据同步完成');
        res.json({ success: true, message: '分类数据同步成功' });
    } catch (error) {
        logger.error('分类数据同步失败', error);
        res.status(500).json({ 
            success: false, 
            message: '分类数据同步失败',
            error: error.message 
        });
    }
}

/**
 * 同步SEO数据
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function syncSeo(req, res) {
    try {
        logger.info('开始同步SEO数据...');
        await syncService.syncSeo();
        logger.success('SEO数据同步完成');
        res.json({ success: true, message: 'SEO数据同步成功' });
    } catch (error) {
        logger.error('SEO数据同步失败', error);
        res.status(500).json({
            success: false,
            message: 'SEO数据同步失败',
            error: error.message
        });
    }
}

/**
 * 同步Option数据
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function syncOption(req, res) {
    try {
        logger.info('开始同步Option数据...');
        await syncService.syncOption();
        logger.success('Option数据同步完成');
        res.json({ success: true, message: 'Option数据同步成功' });
    } catch (error) {
        logger.error('Option数据同步失败', error);
        res.status(500).json({
            success: false,
            message: 'Option数据同步失败',
            error: error.message
        });
    }
}

/**
 * 同步Option扩展字段
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function syncOptionExtended(req, res) {
    try {
        logger.info('开始同步Option扩展字段...');
        await syncService.syncOptionExtended();
        logger.success('Option扩展字段同步完成');
        res.json({ success: true, message: 'Option扩展字段同步成功' });
    } catch (error) {
        logger.error('Option扩展字段同步失败', error);
        res.status(500).json({
            success: false,
            message: 'Option扩展字段同步失败',
            error: error.message
        });
    }
}

/**
 * 同步筛选数据
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function syncFilter(req, res) {
    try {
        logger.info('开始同步筛选数据...');
        await syncService.syncFilter();
        logger.success('筛选数据同步完成');
        res.json({ success: true, message: '筛选数据同步成功' });
    } catch (error) {
        logger.error('筛选数据同步失败', error);
        res.status(500).json({
            success: false,
            message: '筛选数据同步失败',
            error: error.message
        });
    }
}

/**
 * 同步制造商数据
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
async function syncManufacturer(req, res) {
    try {
        logger.info('开始同步制造商数据...');
        await syncService.syncManufacturer();
        logger.success('制造商数据同步完成');
        res.json({ success: true, message: '制造商数据同步成功' });
    } catch (error) {
        logger.error('制造商数据同步失败', error);
        res.status(500).json({
            success: false,
            message: '制造商数据同步失败',
            error: error.message
        });
    }
}

/**
 * 同步税率数据
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
async function syncTax(req, res) {
    try {
        logger.info('开始同步税率数据...');
        // 测试数据库连接
        await testDatabaseConnections();
        // 执行同步
        await syncService.syncTax();
        logger.success('税率数据同步完成');
        res.json({ success: true, message: '税率数据同步成功' });
    } catch (error) {
        logger.error('税率数据同步失败', {
            message: error.message,
            stack: error.stack,
            details: error.details || '无详细信息'
        });
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.details || '无详细信息'
        });
    }
}

/**
 * 测试数据库连接
 * @returns {Promise<void>}
 */
async function testDatabaseConnections() {
    let sourceConn, targetConn;

    try {
        // 测试源数据库连接
        sourceConn = await sourcePool.getConnection();
        await sourceConn.query('SELECT 1');
        logger.info('源数据库连接测试成功');

        // 测试目标数据库连接
        targetConn = await targetPool.getConnection();
        await targetConn.query('SELECT 1');
        logger.info('目标数据库连接测试成功');

        // 验证源数据库中必要的表是否存在
        const requiredTables = ['tax_class', 'tax_rate', 'tax_rate_to_customer_group', 'tax_rule'];
        for (const table of requiredTables) {
            const [result] = await sourceConn.query(`SHOW TABLES LIKE '${table}'`);
            if (result.length === 0) {
                throw new Error(`源数据库中缺少必要的表: ${table}`);
            }
        }
        logger.info('源数据库表结构验证成功');

        // 验证目标数据库中必要的表是否存在
        for (const table of requiredTables) {
            const [result] = await targetConn.query(`SHOW TABLES LIKE 'oc_${table}'`);
            if (result.length === 0) {
                throw new Error(`目标数据库中缺少必要的表: oc_${table}`);
            }
        }
        logger.info('目标数据库表结构验证成功');

    } catch (error) {
        throw new Error(`数据库连接测试失败: ${error.message}`);
    } finally {
        if (sourceConn) sourceConn.release();
        if (targetConn) targetConn.release();
    }
}

/**
 * 同步退货数据
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
async function syncReturn(req, res) {
    let sourceConn;
    let targetConn;
    try {
        sourceConn = await sourcePool.getConnection();
        targetConn = await targetPool.getConnection();
        await targetConn.beginTransaction();
        
        await ReturnSync.syncAll(sourceConn, targetConn);
        
        await targetConn.commit();
        res.json({ success: true, message: '退货数据同步完成' });
    } catch (error) {
        if (targetConn) await targetConn.rollback();
        logger.error('同步退货数据时发生错误', error);
        res.status(500).json({ success: false, message: '退货数据同步失败: ' + error.message });
    } finally {
        if (sourceConn) sourceConn.release();
        if (targetConn) targetConn.release();
    }
}

/**
 * 同步评论数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function syncReview(req, res) {
  try {
    await ReviewSync.syncReview();
    res.json({ success: true, message: '评论数据同步成功' });
  } catch (error) {
    console.error('同步评论数据失败:', error);
    res.status(500).json({ success: false, message: '评论数据同步失败: ' + error.message });
  }
}

/**
 * 同步客户数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function syncCustomer(req, res) {
    try {
        const result = await CustomerSync.syncAll();
        if (!result.success) {
            throw new Error(result.message);
        }
        res.json({ success: true, message: result.message });
    } catch (error) {
        logger.error('同步客户数据失败:', error);
        res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
    syncCategory,
    syncSeo,
    syncOption,
    syncOptionExtended,
    syncFilter,
    syncManufacturer,
    syncTax,
    syncReturn,
    syncReview,
    syncCustomer
}; 