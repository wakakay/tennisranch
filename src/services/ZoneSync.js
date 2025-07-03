const { sourceConfig, sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class ZoneSync {
  /**
   * 创建区域相关表
   * @returns {Promise<void>}
   */
  async createTables() {
    const conn = await targetPool.getConnection();

    try {
      await conn.beginTransaction();

      logger.info('开始创建区域相关表...');

      // 创建 oc_zone 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_zone (
          zone_id int(11) NOT NULL AUTO_INCREMENT,
          country_id int(11) DEFAULT NULL,
          code varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          status tinyint(1) DEFAULT '1',
          PRIMARY KEY (zone_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_zone 表完成');

      // 创建 oc_zone_description 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_zone_description (
          zone_id int(11) NOT NULL,
          language_id int(11) NOT NULL,
          name varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          PRIMARY KEY (zone_id,language_id),
          KEY name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_zone_description 表完成');

      // 创建 oc_zone_to_geo_zone 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_zone_to_geo_zone (
          zone_to_geo_zone_id int(11) NOT NULL AUTO_INCREMENT,
          geo_zone_id int(11) DEFAULT NULL,
          country_id int(11) DEFAULT NULL,
          zone_id int(11) DEFAULT '0',
          PRIMARY KEY (zone_to_geo_zone_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_zone_to_geo_zone 表完成');

      await conn.commit();
      logger.info('区域相关表创建完成');

    } catch (error) {
      await conn.rollback();
      logger.error('创建区域相关表失败:', error);
      logger.error('错误详情:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;

    } finally {
      conn.release();
    }
  }

  /**
   * 验证表结构
   * @param {Object} conn - 数据库连接
   * @param {string} tableName - 表名
   * @returns {Promise<boolean>}
   */
  async validateTableStructure(conn, tableName) {
    try {
      const [rows] = await conn.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = '${sourceConfig.database}'
        AND table_name = ?
      `, [tableName]);

      return rows[0].count > 0;
    } catch (error) {
      logger.error(`验证表 ${sourceConfig.database} ${tableName} 结构失败:`, error);
      return false;
    }
  }

  /**
   * 同步区域数据
   * @returns {Promise<void>}
   */
  async syncZone() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步区域数据...');

      // 验证源数据库表结构
      const tables = ['zone', 'zone_to_geo_zone'];
      for (const table of tables) {
        const exists = await this.validateTableStructure(sourceConn, table);
        if (!exists) {
          throw new Error(`源数据库表 ${table} 不存在`);
        }
      }

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_zone');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_zone_description');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_zone_to_geo_zone');
      logger.info('目标表清空完成');

      // 同步 zone 表到 oc_zone
      logger.info('开始同步 zone 表到 oc_zone...');
      const [zones] = await sourceConn.query(`
        SELECT 
          zone_id, country_id, code, status
        FROM zone
      `);
      logger.info(`从源数据库读取到 ${zones.length} 条区域数据`);

      if (zones.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_zone (
            zone_id, country_id, code, status
          ) VALUES ?
        `, [zones.map(zone => Object.values(zone))]);
        logger.info('oc_zone 表同步完成');
      }

      // 同步 zone 表的 name 到 oc_zone_description
      logger.info('开始同步 zone 表的 name 到 oc_zone_description...');
      const [zoneDescriptions] = await sourceConn.query(`
        SELECT 
          zone_id, name
        FROM zone
      `);
      logger.info(`从源数据库读取到 ${zoneDescriptions.length} 条区域描述数据`);

      if (zoneDescriptions.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_zone_description (
            zone_id, language_id, name
          ) VALUES ?
        `, [zoneDescriptions.map(desc => [desc.zone_id, 1, desc.name])]);
        logger.info('oc_zone_description 表同步完成');
      }

      // 同步 zone_to_geo_zone 表到 oc_zone_to_geo_zone
      logger.info('开始同步 zone_to_geo_zone 表到 oc_zone_to_geo_zone...');
      const [zoneToGeoZones] = await sourceConn.query(`
        SELECT 
          zone_to_geo_zone_id, geo_zone_id, country_id, zone_id
        FROM zone_to_geo_zone
      `);
      logger.info(`从源数据库读取到 ${zoneToGeoZones.length} 条区域地理区域关联数据`);

      if (zoneToGeoZones.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_zone_to_geo_zone (
            zone_to_geo_zone_id, geo_zone_id, country_id, zone_id
          ) VALUES ?
        `, [zoneToGeoZones.map(zone => Object.values(zone))]);
        logger.info('oc_zone_to_geo_zone 表同步完成');
      }

      await targetConn.commit();
      logger.info('区域数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('区域数据同步失败:', error);
      logger.error('错误详情:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql
      });
      throw error;

    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new ZoneSync();
