const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * CustomerOtherSync 服务类
 * 用于同步其他客户相关表数据
 */
class CustomerOtherSync {
  /**
   * 同步指定表数据
   * @param {string} sourceTable - 源表名
   * @param {string} targetTable - 目标表名
   * @param {Object} options - 同步选项
   * @param {boolean} [options.truncate=true] - 是否清空目标表
   * @param {Function} [options.transform] - 数据转换函数
   * @returns {Promise<void>}
   */
  async syncTable(sourceTable, targetTable, options = {}) {
    const { truncate = true, transform } = options;
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info(`开始获取 ${sourceTable} 源数据...`);
      const [rows] = await conn.query(`SELECT * FROM ${sourceTable}`);
      logger.info(`获取到 ${rows.length} 条 ${sourceTable} 数据`);
      
      if (truncate) {
        // 清空目标表
        logger.info(`清空目标表 ${targetTable}...`);
        await targetConn.query(`TRUNCATE TABLE ${targetTable}`);
      }
      
      // 批量插入数据
      if (rows.length > 0) {
        const values = transform ? rows.map(transform) : rows.map(row => Object.values(row));
        
        await targetConn.query(
          `INSERT INTO ${targetTable} VALUES ?`,
          [values]
        );
      }
      
      await targetConn.commit();
      logger.info(`成功同步 ${rows.length} 条 ${sourceTable} 数据`);
      
    } catch (error) {
      await targetConn.rollback();
      logger.error(`${sourceTable} 表同步失败:`, error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步 customer_activity 表
   * @returns {Promise<void>}
   */
  async syncCustomerActivity() {
    await this.syncTable('customer_activity', 'oc_customer_activity');
  }

  /**
   * 同步 customer_group 表
   * @returns {Promise<void>}
   */
  async syncCustomerGroup() {
    await this.syncTable('customer_group', 'oc_customer_group');
  }

  /**
   * 同步 customer_group_description 表
   * @returns {Promise<void>}
   */
  async syncCustomerGroupDescription() {
    await this.syncTable('customer_group_description', 'oc_customer_group_description');
  }

  /**
   * 同步 customer_login 表
   * @returns {Promise<void>}
   */
  async syncCustomerLogin() {
    await this.syncTable('customer_login', 'oc_customer_login');
  }

  /**
   * 同步 customer_online 表
   * @returns {Promise<void>}
   */
  async syncCustomerOnline() {
    await this.syncTable('customer_online', 'oc_customer_online');
  }

  /**
   * 同步 customer_reward 表
   * @returns {Promise<void>}
   */
  async syncCustomerReward() {
    await this.syncTable('customer_reward', 'oc_customer_reward');
  }

  /**
   * 同步 customer_transaction 表
   * @returns {Promise<void>}
   */
  async syncCustomerTransaction() {
    await this.syncTable('customer_transaction', 'oc_customer_transaction');
  }

  /**
   * 同步 customer_search 表
   * @returns {Promise<void>}
   */
  async syncCustomerSearch() {
    await this.syncTable('customer_search', 'oc_customer_search');
  }

  /**
   * 同步 customer_ip 表
   * @returns {Promise<void>}
   */
  async syncCustomerIp() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info('开始获取 customer_ip 源数据...');
      const [rows] = await conn.query('SELECT * FROM customer_ip');
      logger.info(`获取到 ${rows.length} 条 customer_ip 数据`);
      
      // 清空目标表
      logger.info('清空目标表 oc_customer_ip...');
      await targetConn.query('TRUNCATE TABLE oc_customer_ip');
      
      // 批量插入数据
      if (rows.length > 0) {
        // 分批处理数据，每批 500 条
        const batchSize = 500;
        let successCount = 0;
        
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const values = batch.map(row => {
            // 确保所有字段都是正确的类型
            return [
              parseInt(row.customer_ip_id) || 0,
              parseInt(row.customer_id) || 0,
              row.ip || '',
              parseInt(row.store_id) || 0, // 确保是整数
              row.country || null,
              row.date_added || new Date().toISOString().slice(0, 19).replace('T', ' ') // 如果没有日期，使用当前时间
            ];
          });

          try {
            await targetConn.query(
              `INSERT INTO oc_customer_ip (
                customer_ip_id,
                customer_id,
                ip,
                store_id,
                country,
                date_added
              ) VALUES ?`,
              [values]
            );
            successCount += batch.length;
            logger.info(`已插入 ${successCount}/${rows.length} 条 customer_ip 数据`);
          } catch (error) {
            logger.error(`插入第 ${i + 1} 到 ${i + batch.length} 条数据失败:`, error);
            throw error;
          }
        }
      }
      
      await targetConn.commit();
      logger.info(`成功同步 ${rows.length} 条 customer_ip 数据`);
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('customer_ip 表同步失败:', error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步 customer_wishlist 表
   * @returns {Promise<void>}
   */
  async syncCustomerWishlist() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info('开始获取 customer_wishlist 源数据...');
      const [rows] = await conn.query('SELECT * FROM customer_wishlist');
      logger.info(`获取到 ${rows.length} 条 customer_wishlist 数据`);
      
      // 清空目标表
      logger.info('清空目标表 oc_customer_wishlist...');
      await targetConn.query('TRUNCATE TABLE oc_customer_wishlist');
      
      // 批量插入数据
      if (rows.length > 0) {
        // 分批处理数据，每批 500 条
        const batchSize = 500;
        let successCount = 0;
        
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const values = batch.map(row => {
            // 确保所有字段都是正确的类型
            return [
              parseInt(row.customer_id) || 0,
              parseInt(row.product_id) || 0,
              parseInt(row.store_id) || 0, // 新增字段，默认值为 0
              row.date_added || new Date().toISOString().slice(0, 19).replace('T', ' ') // 如果没有日期，使用当前时间
            ];
          });

          try {
            await targetConn.query(
              `INSERT INTO oc_customer_wishlist (
                customer_id,
                product_id,
                store_id,
                date_added
              ) VALUES ?`,
              [values]
            );
            successCount += batch.length;
            logger.info(`已插入 ${successCount}/${rows.length} 条 customer_wishlist 数据`);
          } catch (error) {
            logger.error(`插入第 ${i + 1} 到 ${i + batch.length} 条数据失败:`, error);
            throw error;
          }
        }
      }
      
      await targetConn.commit();
      logger.info(`成功同步 ${rows.length} 条 customer_wishlist 数据`);
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('customer_wishlist 表同步失败:', error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步所有其他客户相关表
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async syncAll() {
    try {
      logger.info('开始同步所有其他客户相关表...');
      
      // 同步前检查数据库连接
      await this.testConnection();
      
      // 同步所有表
      await this.syncCustomerActivity();
      await this.syncCustomerGroup();
      await this.syncCustomerGroupDescription();
      await this.syncCustomerLogin();
      await this.syncCustomerOnline();
      await this.syncCustomerReward();
      await this.syncCustomerTransaction();
      await this.syncCustomerSearch();
      await this.syncCustomerIp();
      await this.syncCustomerWishlist();
      
      // 同步后验证数据
      await this.verifySync();
      
      return {
        success: true,
        message: '所有其他客户相关表同步完成'
      };
      
    } catch (error) {
      logger.error('其他客户相关表同步过程出错:', error);
      
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
      // 测试源数据库连接
      sourceConn = await sourcePool.getConnection();
      await sourceConn.query('SELECT 1');
      logger.info('源数据库连接测试成功');

      // 测试目标数据库连接
      targetConn = await targetPool.getConnection();
      await targetConn.query('SELECT 1');
      logger.info('目标数据库连接测试成功');

      // 验证源数据库中必要的表是否存在
      const requiredTables = [
        'customer_activity',
        'customer_group',
        'customer_group_description',
        'customer_login',
        'customer_online',
        'customer_reward',
        'customer_transaction',
        'customer_search',
        'customer_ip',
        'customer_wishlist'
      ];
      
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
        { source: 'customer_activity', target: 'oc_customer_activity' },
        { source: 'customer_group', target: 'oc_customer_group' },
        { source: 'customer_group_description', target: 'oc_customer_group_description' },
        { source: 'customer_login', target: 'oc_customer_login' },
        { source: 'customer_online', target: 'oc_customer_online' },
        { source: 'customer_reward', target: 'oc_customer_reward' },
        { source: 'customer_transaction', target: 'oc_customer_transaction' },
        { source: 'customer_search', target: 'oc_customer_search' },
        { source: 'customer_ip', target: 'oc_customer_ip' },
        { source: 'customer_wishlist', target: 'oc_customer_wishlist' }
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

module.exports = new CustomerOtherSync(); 