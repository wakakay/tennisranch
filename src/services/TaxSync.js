/**
 * TaxSync 服务类 - 处理税率相关表的同步
 * @class TaxSync
 */

const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class TaxSync {
  /**
   * 同步tax_class表
   * @returns {Promise<void>}
   */
  async syncTaxClass() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      // 开始事务
      await targetConn.beginTransaction();
      
      // 获取源数据
      logger.info('开始获取tax_class源数据...');
      const [rows] = await conn.query(
        'SELECT tax_class_id, title, description FROM tax_class'
      );
      logger.info(`获取到 ${rows.length} 条tax_class数据`);
      
      // 同步到目标数据库
      for (const row of rows) {
        logger.info(`正在同步tax_class记录: ${row.tax_class_id}`);
        await targetConn.query(
          'REPLACE INTO oc_tax_class (tax_class_id, title, description) VALUES (?, ?, ?)',
          [row.tax_class_id, row.title, row.description]
        );
      }
      
      // 验证同步结果
      const [targetRows] = await targetConn.query('SELECT COUNT(*) as count FROM oc_tax_class');
      logger.info(`目标数据库现有 ${targetRows[0].count} 条tax_class记录`);
      
      // 提交事务
      await targetConn.commit();
      logger.info('tax_class 表同步完成');
      
    } catch (error) {
      // 发生错误时回滚
      await targetConn.rollback();
      logger.error('tax_class 表同步失败:', error);
      throw error;
      
    } finally {
      // 释放连接
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步tax_rate表
   * @returns {Promise<void>}
   */
  async syncTaxRate() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info('开始获取tax_rate源数据...');
      const [rows] = await conn.query(
        'SELECT tax_rate_id, geo_zone_id, name, rate, type FROM tax_rate'
      );
      logger.info(`获取到 ${rows.length} 条tax_rate数据`);
      
      for (const row of rows) {
        logger.info(`正在同步tax_rate记录: ${row.tax_rate_id}`);
        await targetConn.query(
          'REPLACE INTO oc_tax_rate (tax_rate_id, geo_zone_id, name, rate, type) VALUES (?, ?, ?, ?, ?)',
          [row.tax_rate_id, row.geo_zone_id, row.name, row.rate, row.type]
        );
      }
      
      // 验证同步结果
      const [targetRows] = await targetConn.query('SELECT COUNT(*) as count FROM oc_tax_rate');
      logger.info(`目标数据库现有 ${targetRows[0].count} 条tax_rate记录`);
      
      await targetConn.commit();
      logger.info('tax_rate 表同步完成');
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('tax_rate 表同步失败:', error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步tax_rate_to_customer_group表
   * @returns {Promise<void>}
   */
  async syncTaxRateToCustomerGroup() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info('开始获取tax_rate_to_customer_group源数据...');
      const [rows] = await conn.query(
        'SELECT tax_rate_id, customer_group_id FROM tax_rate_to_customer_group'
      );
      logger.info(`获取到 ${rows.length} 条tax_rate_to_customer_group数据`);
      
      // 清空目标表
      logger.info('清空目标表oc_tax_rate_to_customer_group...');
      await targetConn.query('DELETE FROM oc_tax_rate_to_customer_group');
      
      for (const row of rows) {
        logger.info(`正在同步tax_rate_to_customer_group记录: ${row.tax_rate_id}_${row.customer_group_id}`);
        await targetConn.query(
          'INSERT INTO oc_tax_rate_to_customer_group (tax_rate_id, customer_group_id) VALUES (?, ?)',
          [row.tax_rate_id, row.customer_group_id]
        );
      }
      
      // 验证同步结果
      const [targetRows] = await targetConn.query('SELECT COUNT(*) as count FROM oc_tax_rate_to_customer_group');
      logger.info(`目标数据库现有 ${targetRows[0].count} 条tax_rate_to_customer_group记录`);
      
      await targetConn.commit();
      logger.info('tax_rate_to_customer_group 表同步完成');
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('tax_rate_to_customer_group 表同步失败:', error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步tax_rule表
   * @returns {Promise<void>}
   */
  async syncTaxRule() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info('开始获取tax_rule源数据...');
      const [rows] = await conn.query(
        'SELECT tax_rule_id, tax_class_id, tax_rate_id, based, priority FROM tax_rule'
      );
      logger.info(`获取到 ${rows.length} 条tax_rule数据`);
      
      for (const row of rows) {
        logger.info(`正在同步tax_rule记录: ${row.tax_rule_id}`);
        await targetConn.query(
          'REPLACE INTO oc_tax_rule (tax_rule_id, tax_class_id, tax_rate_id, based, priority) VALUES (?, ?, ?, ?, ?)',
          [row.tax_rule_id, row.tax_class_id, row.tax_rate_id, row.based, row.priority]
        );
      }
      
      // 验证同步结果
      const [targetRows] = await targetConn.query('SELECT COUNT(*) as count FROM oc_tax_rule');
      logger.info(`目标数据库现有 ${targetRows[0].count} 条tax_rule记录`);
      
      await targetConn.commit();
      logger.info('tax_rule 表同步完成');
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('tax_rule 表同步失败:', error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步所有tax相关表
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async syncAll() {
    try {
      logger.info('开始同步所有tax相关表...');
      
      // 同步前检查数据库连接
      await this.testConnection();
      
      await this.syncTaxClass();
      await this.syncTaxRate();
      await this.syncTaxRateToCustomerGroup();
      await this.syncTaxRule();
      
      // 同步后验证数据
      await this.verifySync();
      
      return {
        success: true,
        message: '所有tax相关表同步完成'
      };
      
    } catch (error) {
      logger.error('tax同步过程出错:', error);
      
      return {
        success: false,
        message: `同步失败: ${error.message}`
      };
    }
  }

  /**
   * 测试数据库连接
   * @returns {Promise<void>}
   */
  async testConnection() {
    let sourceConn, targetConn;
    try {
      sourceConn = await sourcePool.getConnection();
      targetConn = await targetPool.getConnection();

      // 测试源数据库连接
      await sourceConn.query('SELECT 1');
      logger.info('源数据库连接测试成功');

      // 测试目标数据库连接
      await targetConn.query('SELECT 1');
      logger.info('目标数据库连接测试成功');

    } catch (error) {
      logger.error('数据库连接测试失败:', error);
      throw error;
    } finally {
      if (sourceConn) sourceConn.release();
      if (targetConn) targetConn.release();
    }
  }

  /**
   * 验证同步结果
   * @returns {Promise<void>}
   */
  async verifySync() {
    let sourceConn, targetConn;
    try {
      sourceConn = await sourcePool.getConnection();
      targetConn = await targetPool.getConnection();

      // 验证各表的记录数
      const tables = [
        { source: 'tax_class', target: 'oc_tax_class' },
        { source: 'tax_rate', target: 'oc_tax_rate' },
        { source: 'tax_rate_to_customer_group', target: 'oc_tax_rate_to_customer_group' },
        { source: 'tax_rule', target: 'oc_tax_rule' }
      ];

      for (const table of tables) {
        const [sourceCount] = await sourceConn.query(`SELECT COUNT(*) as count FROM ${table.source}`);
        const [targetCount] = await targetConn.query(`SELECT COUNT(*) as count FROM ${table.target}`);
        
        logger.info(`${table.source} -> ${table.target} 同步结果:`,
          `源数据: ${sourceCount[0].count}条`,
          `目标数据: ${targetCount[0].count}条`
        );

        if (sourceCount[0].count !== targetCount[0].count) {
          throw new Error(`${table.source} 表同步数据不一致: 源=${sourceCount[0].count}, 目标=${targetCount[0].count}`);
        }
      }

      logger.info('所有表数据验证通过');

    } catch (error) {
      logger.error('同步验证失败:', error);
      throw error;
    } finally {
      if (sourceConn) sourceConn.release();
      if (targetConn) targetConn.release();
    }
  }
}

module.exports = new TaxSync(); 