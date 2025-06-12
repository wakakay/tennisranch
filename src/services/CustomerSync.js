const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * CustomerSync 服务类
 * 用于同步 customer 和 address 表数据
 */
class CustomerSync {
  /**
   * 同步 address 表
   * @returns {Promise<void>}
   */
  async syncAddress() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      await targetConn.beginTransaction();
      
      logger.info('开始获取 address 源数据...');
      const [rows] = await conn.query(
        'SELECT * FROM address'
      );
      logger.info(`获取到 ${rows.length} 条 address 数据`);
      
      // 清空目标表
      logger.info('清空目标表 oc_address...');
      await targetConn.query('DELETE FROM oc_address');
      
      // 批量插入数据
      if (rows.length > 0) {
        const values = rows.map(row => [
          row.address_id,
          row.customer_id,
          row.firstname,
          row.lastname,
          row.company,
          row.address_1,
          row.address_2,
          row.city,
          row.postcode,
          row.country_id,
          row.zone_id,
          row.custom_field,
          0 // default = 0
        ]);

        await targetConn.query(
          `INSERT INTO oc_address (
            address_id, customer_id, firstname, lastname, company,
            address_1, address_2, city, postcode, country_id,
            zone_id, custom_field, \`default\`
          ) VALUES ?`,
          [values]
        );
      }
      
      await targetConn.commit();
      logger.info(`成功同步 ${rows.length} 条 address 数据`);
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('address 表同步失败:', error);
      throw error;
      
    } finally {
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步 customer 表
   * @returns {Promise<void>}
   */
  async syncCustomer() {
    const conn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      // 设置事务超时时间为 30 分钟
      await targetConn.query('SET SESSION wait_timeout = 1800');
      await targetConn.beginTransaction();
      
      logger.info('开始获取 customer 源数据...');
      const [rows] = await conn.query(
        'SELECT * FROM customer'
      );
      logger.info(`获取到 ${rows.length} 条 customer 数据`);
      
      // 检查 IP 字段
      const ipCount = rows.filter(row => row.ip && row.ip.trim() !== '').length;
      logger.info(`源数据中有 ${ipCount} 条记录的 IP 字段有值`);
      
      // 临时禁用外键检查
      logger.info('临时禁用外键检查...');
      await targetConn.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // 清空目标表
      logger.info('清空目标表 oc_customer...');
      await targetConn.query('TRUNCATE TABLE oc_customer');
      
      // 批量插入数据
      if (rows.length > 0) {
        // 分批处理数据，每批 500 条
        const batchSize = 500;
        let successCount = 0;
        let retryCount = 0;
        const maxRetries = 3;

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const values = batch.map(row => {
            // 处理 IP 字段
            let ip = row.ip;
            if (!ip || ip.trim() === '') {
              ip = '0.0.0.0';
            }
            
            return [
              row.customer_id,
              row.customer_group_id,
              row.store_id,
              row.language_id,
              row.firstname,
              row.lastname,
              row.email,
              row.telephone,
              row.password,
              row.custom_field,
              row.newsletter,
              ip,
              row.status,
              row.safe,
              row.commenter || 0,
              row.token,
              row.code,
              row.date_added,
              row.salt,
              row.fax
            ];
          });

          let success = false;
          while (!success && retryCount < maxRetries) {
            try {
              await targetConn.query(
                `INSERT INTO oc_customer (
                  customer_id, customer_group_id, store_id, language_id,
                  firstname, lastname, email, telephone, password,
                  custom_field, newsletter, ip, status, safe,
                  commenter, token, code, date_added,
                  salt, fax
                ) VALUES ?`,
                [values]
              );
              success = true;
              successCount += batch.length;
              logger.info(`已插入 ${successCount}/${rows.length} 条 customer 数据`);
            } catch (error) {
              retryCount++;
              logger.error(`插入第 ${i + 1} 到 ${i + batch.length} 条数据失败，重试 ${retryCount}/${maxRetries}:`, error);
              if (retryCount >= maxRetries) {
                throw new Error(`插入数据失败，已重试 ${maxRetries} 次: ${error.message}`);
              }
              // 等待 1 秒后重试
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          retryCount = 0; // 重置重试计数
        }

        // 处理 address_id 关联
        logger.info('开始处理 address_id 关联...');
        let addressCount = 0;
        for (const row of rows) {
          if (row.address_id) {
            try {
              await targetConn.query(
                'UPDATE oc_address SET `default` = 1 WHERE address_id = ? AND customer_id = ?',
                [row.address_id, row.customer_id]
              );
              addressCount++;
              if (addressCount % 100 === 0) {
                logger.info(`已处理 ${addressCount} 条 address 关联`);
              }
            } catch (error) {
              logger.error(`更新 address_id ${row.address_id} 失败:`, error);
            }
          }
        }
        logger.info(`完成处理 ${addressCount} 条 address 关联`);
      }
      
      // 重新启用外键检查
      logger.info('重新启用外键检查...');
      await targetConn.query('SET FOREIGN_KEY_CHECKS = 1');
      
      await targetConn.commit();
      logger.info(`成功同步 ${rows.length} 条 customer 数据`);
      
    } catch (error) {
      await targetConn.rollback();
      logger.error('customer 表同步失败:', error);
      throw error;
      
    } finally {
      // 确保外键检查被重新启用
      try {
        await targetConn.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        logger.error('重新启用外键检查失败:', e);
      }
      conn.release();
      targetConn.release();
    }
  }

  /**
   * 同步所有 customer 相关表
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async syncAll() {
    try {
      logger.info('开始同步所有 customer 相关表...');
      
      // 同步前检查数据库连接
      await this.testConnection();
      
      // 先同步 address 表
      await this.syncAddress();
      
      // 再同步 customer 表
      await this.syncCustomer();
      
      // 同步后验证数据
      await this.verifySync();
      
      return {
        success: true,
        message: '所有 customer 相关表同步完成'
      };
      
    } catch (error) {
      logger.error('customer 同步过程出错:', error);
      
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
      const requiredTables = ['customer', 'address'];
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
        { source: 'customer', target: 'oc_customer' },
        { source: 'address', target: 'oc_address' }
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

module.exports = new CustomerSync(); 