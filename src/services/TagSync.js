const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class TagSync {
  /**
   * 创建tag表（如不存在）
   * @returns {Promise<void>}
   */
  async createTable() {
    const conn = await targetPool.getConnection();
    try {
      await conn.beginTransaction();
      logger.info('开始检查/创建 oc_tag 表...');
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_tag (
          tag_id int(11) NOT NULL AUTO_INCREMENT,
          name varchar(64) NOT NULL COMMENT '标签',
          status tinyint(1) NOT NULL DEFAULT '1',
          PRIMARY KEY (tag_id)
        ) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
      `);
      await conn.commit();
      logger.info('oc_tag 表检查/创建完成');
    } catch (error) {
      await conn.rollback();
      logger.error('创建tag表失败:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 同步tag数据（覆盖式迁移）
   * @returns {Promise<void>}
   */
  async syncTag() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    try {
      await this.createTable();
      await targetConn.beginTransaction();
      logger.info('清空目标库tag表...');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_tag');
      logger.info('目标库tag表清空完成');
      logger.info('读取源库tag数据...');
      const [tags] = await sourceConn.query('SELECT tag_id, name, status FROM tennisranch_2x_t.tag');
      logger.info(`读取到${tags.length}条tag数据`);
      if (tags.length > 0) {
        await targetConn.query(
          'INSERT INTO tennisranch_4x.oc_tag (tag_id, name, status) VALUES ?',
          [tags.map(tag => [tag.tag_id, tag.name, tag.status])]
        );
        logger.info('tag数据同步完成');
      } else {
        logger.info('源库无tag数据，无需同步');
      }
      await targetConn.commit();
      logger.info('tag数据迁移流程完成');
    } catch (error) {
      await targetConn.rollback();
      logger.error('tag数据同步失败:', error);
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new TagSync(); 