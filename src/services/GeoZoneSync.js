const { sourceConfig, sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class GeoZoneSync {
  /**
   * 创建geo_zone表
   * @returns {Promise<void>}
   */
  async createTable() {
    const conn = await targetPool.getConnection();

    try {
      await conn.beginTransaction();

      logger.info('开始创建geo_zone表...');

      // 创建 geo_zone 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS geo_zone (
          geo_zone_id int(11) NOT NULL AUTO_INCREMENT,
          name varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          description varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          PRIMARY KEY (geo_zone_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 geo_zone 表完成');

      await conn.commit();
      logger.info('geo_zone表创建完成');

    } catch (error) {
      await conn.rollback();
      logger.error('创建geo_zone表失败:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 验证表结构
   * @param {mysql.Connection} conn - 数据库连接
   * @param {string} tableName - 表名
   * @returns {Promise<boolean>}
   */
  async validateTableStructure(conn, tableName) {
    try {
      const [result] = await conn.query(`SHOW TABLES LIKE '${tableName}'`);
      return result.length > 0;
    } catch (error) {
      logger.error(`验证表 ${tableName} 结构失败:`, error);
      return false;
    }
  }

  /**
   * 同步geo_zone数据（覆盖式迁移）
   * @returns {Promise<void>}
   */
  async sync() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步geo_zone数据...');

      // 验证源数据库表结构
      const exists = await this.validateTableStructure(sourceConn, 'geo_zone');
      if (!exists) {
        throw new Error('源数据库表 geo_zone 不存在');
      }

      // 确保目标表存在
      await this.createTable();

      // 清空目标表
      logger.info('清空目标表geo_zone...');
      await targetConn.query('DELETE FROM tennisranch_4x.geo_zone');
      logger.info('目标表geo_zone清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.geo_zone AUTO_INCREMENT = 1');
      logger.info('geo_zone表自增ID重置为1');

      // 同步 geo_zone 表
      logger.info('开始同步 geo_zone 表...');
      const [geoZones] = await sourceConn.query(`
        SELECT 
          geo_zone_id, name, description
        FROM geo_zone
      `);
      logger.info(`从源数据库读取到 ${geoZones.length} 条geo_zone数据`);

      if (geoZones.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.geo_zone (
            geo_zone_id, name, description
          ) VALUES ?
        `, [geoZones.map(geoZone => Object.values(geoZone))]);
        logger.info('geo_zone 表同步完成');
      } else {
        logger.info('源库无geo_zone数据，无需同步');
      }

      await targetConn.commit();
      logger.success('geo_zone数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('geo_zone数据同步失败:', error);
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }

  /**
   * 数据库连接测试
   * @returns {Promise<void>}
   */
  async testConnection() {
    let sourceConn;
    let targetConn;

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
      const requiredTables = ['geo_zone'];
      
      for (const table of requiredTables) {
        const [result] = await sourceConn.query(`SHOW TABLES LIKE '${table}'`);
        if (result.length === 0) {
          throw new Error(`源数据库中缺少必要的表: ${table}`);
        }
      }
      logger.info('源数据库表结构验证成功');

      // 验证目标数据库中必要的表是否存在
      for (const table of requiredTables) {
        const [result] = await targetConn.query(`SHOW TABLES LIKE '${table}'`);
        if (result.length === 0) {
          throw new Error(`目标数据库中缺少必要的表: ${table}`);
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
}

module.exports = GeoZoneSync;
