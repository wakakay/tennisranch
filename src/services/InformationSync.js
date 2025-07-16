const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 同步Information数据
 */
class InformationSync {
  /**
   * 同步Information数据
   * @returns {Promise<void>}
   */
  async syncInformation() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      // 1. 同步主表 information
      await this.syncMainInformation(sourceConn, targetConn);

      // 2. 同步描述表 information_description
      await this.syncInformationDescription(sourceConn, targetConn);

      // 3. 同步布局关联表 information_to_layout
      await this.syncInformationToLayout(sourceConn, targetConn);

      // 4. 同步商店关联表 information_to_store
      await this.syncInformationToStore(sourceConn, targetConn);

      await targetConn.commit();
      logger.success('Information数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('Information数据同步失败:', error);
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }

  /**
   * 同步主表 information
   * @param {mysql.Connection} sourceConn - 源数据库连接
   * @param {mysql.Connection} targetConn - 目标数据库连接
   * @returns {Promise<void>}
   */
  async syncMainInformation(sourceConn, targetConn) {
    // 清空目标表
    logger.info('清空目标表 information...');
    await targetConn.query('DELETE FROM tennisranch_4x.information');

    // 重置自增ID计数器
    await targetConn.query('ALTER TABLE tennisranch_4x.information AUTO_INCREMENT = 1');

    // 获取源数据
    logger.info('获取源表 information 数据...');
    const [rows] = await sourceConn.query(`
      SELECT 
        information_id, sort_order, status
      FROM information
    `);
    logger.info(`从源数据库读取到 ${rows.length} 条 information 数据`);

    // 插入数据到目标表
    if (rows.length > 0) {
      const values = rows.map(row => [
        row.information_id,
        row.sort_order,
        row.status
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.information (
          information_id, sort_order, status
        ) VALUES ?
      `, [values]);

      logger.info(`成功同步 ${rows.length} 条 information 数据`);
    }
  }

  /**
   * 同步描述表 information_description
   * @param {mysql.Connection} sourceConn - 源数据库连接
   * @param {mysql.Connection} targetConn - 目标数据库连接
   * @returns {Promise<void>}
   */
  async syncInformationDescription(sourceConn, targetConn) {
    // 清空目标表
    logger.info('清空目标表 information_description...');
    await targetConn.query('DELETE FROM tennisranch_4x.information_description');

    // 重置自增ID计数器（如果有自增ID）
    const [columns] = await targetConn.query('SHOW COLUMNS FROM tennisranch_4x.information_description');
    const hasAutoIncrement = columns.some(col => col.Extra === 'auto_increment');
    if (hasAutoIncrement) {
      await targetConn.query('ALTER TABLE tennisranch_4x.information_description AUTO_INCREMENT = 1');
    }

    // 获取源数据
    logger.info('获取源表 information_description 数据...');
    const [rows] = await sourceConn.query(`
      SELECT 
        information_id, language_id, title, description, meta_title, meta_description, meta_keyword
      FROM information_description
    `);
    logger.info(`从源数据库读取到 ${rows.length} 条 information_description 数据`);

    // 插入数据到目标表
    if (rows.length > 0) {
      const values = rows.map(row => [
        row.information_id,
        row.language_id,
        row.title,
        row.description,
        row.meta_title,
        row.meta_description,
        row.meta_keyword
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.information_description (
          information_id, language_id, title, description, meta_title, meta_description, meta_keyword
        ) VALUES ?
      `, [values]);

      logger.info(`成功同步 ${rows.length} 条 information_description 数据`);
    }
  }

  /**
   * 同步布局关联表 information_to_layout
   * @param {mysql.Connection} sourceConn - 源数据库连接
   * @param {mysql.Connection} targetConn - 目标数据库连接
   * @returns {Promise<void>}
   */
  async syncInformationToLayout(sourceConn, targetConn) {
    // 清空目标表
    logger.info('清空目标表 information_to_layout...');
    await targetConn.query('DELETE FROM tennisranch_4x.information_to_layout');

    // 重置自增ID计数器（如果有自增ID）
    const [columns] = await targetConn.query('SHOW COLUMNS FROM tennisranch_4x.information_to_layout');
    const hasAutoIncrement = columns.some(col => col.Extra === 'auto_increment');
    if (hasAutoIncrement) {
      await targetConn.query('ALTER TABLE tennisranch_4x.information_to_layout AUTO_INCREMENT = 1');
    }

    // 获取源数据
    logger.info('获取源表 information_to_layout 数据...');
    const [rows] = await sourceConn.query(`
      SELECT 
        information_id, store_id, layout_id
      FROM information_to_layout
    `);
    logger.info(`从源数据库读取到 ${rows.length} 条 information_to_layout 数据`);

    // 插入数据到目标表
    if (rows.length > 0) {
      const values = rows.map(row => [
        row.information_id,
        row.store_id,
        row.layout_id
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.information_to_layout (
          information_id, store_id, layout_id
        ) VALUES ?
      `, [values]);

      logger.info(`成功同步 ${rows.length} 条 information_to_layout 数据`);
    }
  }

  /**
   * 同步商店关联表 information_to_store
   * @param {mysql.Connection} sourceConn - 源数据库连接
   * @param {mysql.Connection} targetConn - 目标数据库连接
   * @returns {Promise<void>}
   */
  async syncInformationToStore(sourceConn, targetConn) {
    // 清空目标表
    logger.info('清空目标表 information_to_store...');
    await targetConn.query('DELETE FROM tennisranch_4x.information_to_store');

    // 重置自增ID计数器（如果有自增ID）
    const [columns] = await targetConn.query('SHOW COLUMNS FROM tennisranch_4x.information_to_store');
    const hasAutoIncrement = columns.some(col => col.Extra === 'auto_increment');
    if (hasAutoIncrement) {
      await targetConn.query('ALTER TABLE tennisranch_4x.information_to_store AUTO_INCREMENT = 1');
    }

    // 获取源数据
    logger.info('获取源表 information_to_store 数据...');
    const [rows] = await sourceConn.query(`
      SELECT 
        information_id, store_id
      FROM information_to_store
    `);
    logger.info(`从源数据库读取到 ${rows.length} 条 information_to_store 数据`);

    // 插入数据到目标表
    if (rows.length > 0) {
      const values = rows.map(row => [
        row.information_id,
        row.store_id
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.information_to_store (
          information_id, store_id
        ) VALUES ?
      `, [values]);

      logger.info(`成功同步 ${rows.length} 条 information_to_store 数据`);
    }
  }
}

module.exports = new InformationSync();
