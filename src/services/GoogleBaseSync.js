const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 同步Google Base数据
 */
class GoogleBaseSync {
  /**
   * 同步Google Base数据
   * @returns {Promise<void>}
   */
  async syncGoogleBase() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      // 1. 同步Google Base分类表
      await this.syncGoogleBaseCategory(sourceConn, targetConn);

      // 2. 同步Google Base分类与商品分类关联表
      await this.syncGoogleBaseCategoryToCategory(sourceConn, targetConn);

      await targetConn.commit();
      logger.success('Google Base数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('Google Base数据同步失败:', error);
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }

  /**
   * 同步Google Base分类表
   * @param {mysql.Connection} sourceConn - 源数据库连接
   * @param {mysql.Connection} targetConn - 目标数据库连接
   * @returns {Promise<void>}
   */
  async syncGoogleBaseCategory(sourceConn, targetConn) {
    // 清空目标表
    logger.info('清空目标表 oc_google_base_category...');
    await targetConn.query('DELETE FROM tennisranch_4x.oc_google_base_category');

    // 重置自增ID计数器
    await targetConn.query('ALTER TABLE tennisranch_4x.oc_google_base_category AUTO_INCREMENT = 1');

    // 获取源数据
    logger.info('获取源表 google_base_category 数据...');
    const [rows] = await sourceConn.query(`
      SELECT 
        google_base_category_id, name
      FROM google_base_category
    `);
    logger.info(`从源数据库读取到 ${rows.length} 条 google_base_category 数据`);

    // 插入数据到目标表
    if (rows.length > 0) {
      const values = rows.map(row => [
        row.google_base_category_id,
        row.name
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.oc_google_base_category (
          google_base_category_id, name
        ) VALUES ?
      `, [values]);

      logger.info(`成功同步 ${rows.length} 条 google_base_category 数据`);
    }
  }

  /**
   * 同步Google Base分类与商品分类关联表
   * @param {mysql.Connection} sourceConn - 源数据库连接
   * @param {mysql.Connection} targetConn - 目标数据库连接
   * @returns {Promise<void>}
   */
  async syncGoogleBaseCategoryToCategory(sourceConn, targetConn) {
    // 清空目标表
    logger.info('清空目标表 oc_google_base_category_to_category...');
    await targetConn.query('DELETE FROM tennisranch_4x.oc_google_base_category_to_category');

    // 重置自增ID计数器（如果有自增ID）
    const [columns] = await targetConn.query('SHOW COLUMNS FROM tennisranch_4x.oc_google_base_category_to_category');
    const hasAutoIncrement = columns.some(col => col.Extra === 'auto_increment');
    if (hasAutoIncrement) {
      await targetConn.query('ALTER TABLE tennisranch_4x.oc_google_base_category_to_category AUTO_INCREMENT = 1');
    }

    // 获取源数据
    logger.info('获取源表 google_base_category_to_category 数据...');
    const [rows] = await sourceConn.query(`
      SELECT 
        google_base_category_id, category_id
      FROM google_base_category_to_category
    `);
    logger.info(`从源数据库读取到 ${rows.length} 条 google_base_category_to_category 数据`);

    // 插入数据到目标表
    if (rows.length > 0) {
      const values = rows.map(row => [
        row.google_base_category_id,
        row.category_id
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.oc_google_base_category_to_category (
          google_base_category_id, category_id
        ) VALUES ?
      `, [values]);

      logger.info(`成功同步 ${rows.length} 条 google_base_category_to_category 数据`);
    }
  }
}

module.exports = new GoogleBaseSync();
