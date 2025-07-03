const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class NewCustomerCouponSync {
  /**
   * 创建新客户优惠券表
   * @returns {Promise<void>}
   */
  async createTables() {
    const conn = await targetPool.getConnection();

    try {
      await conn.beginTransaction();

      logger.info('开始创建新客户优惠券表...');

      // 创建 oc_new_customer_coupon 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_new_customer_coupon (
          coupon_id int(11) NOT NULL AUTO_INCREMENT,
          name varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          code varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          type char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          discount decimal(15,4) DEFAULT NULL,
          logged tinyint(1) DEFAULT '0',
          shipping tinyint(1) DEFAULT '0',
          is_special_product int(1) DEFAULT NULL,
          is_include int(1) DEFAULT NULL,
          total decimal(15,4) DEFAULT NULL,
          date_start date DEFAULT NULL,
          date_end date DEFAULT NULL,
          uses_total int(11) DEFAULT '0',
          uses_customer int(11) DEFAULT '0',
          status tinyint(1) DEFAULT '0',
          date_added datetime DEFAULT NULL,
          PRIMARY KEY (coupon_id)
        ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_new_customer_coupon 表完成');

      // 创建 oc_new_customer_coupon_product 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_new_customer_coupon_product (
          coupon_product_id int(11) NOT NULL AUTO_INCREMENT,
          coupon_id int(11) DEFAULT NULL,
          product_id int(11) DEFAULT NULL,
          PRIMARY KEY (coupon_product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_new_customer_coupon_product 表完成');

      // 创建 oc_new_customer_coupon_category 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_new_customer_coupon_category (
          coupon_id int(11) NOT NULL,
          category_id int(11) NOT NULL,
          PRIMARY KEY (coupon_id,category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_new_customer_coupon_category 表完成');

      // 创建 oc_new_customer_coupon_history 表
      await conn.query(`
        CREATE TABLE IF NOT EXISTS oc_new_customer_coupon_history (
          coupon_history_id int(11) NOT NULL AUTO_INCREMENT,
          coupon_id int(11) DEFAULT NULL,
          order_id int(11) DEFAULT '0',
          customer_id int(11) DEFAULT '0',
          amount decimal(15,4) DEFAULT NULL,
          date_added datetime DEFAULT NULL,
          PRIMARY KEY (coupon_history_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC
      `);
      logger.info('创建 oc_new_customer_coupon_history 表完成');

      await conn.commit();
      logger.info('新客户优惠券表创建完成');

    } catch (error) {
      await conn.rollback();
      logger.error('创建新客户优惠券表失败:', error);
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
        WHERE table_schema = 'tennisranch_2x_t' 
        AND table_name = ?
      `, [tableName]);

      return rows[0].count > 0;
    } catch (error) {
      logger.error(`验证表 ${tableName} 结构失败:`, error);
      return false;
    }
  }

  /**
   * 同步新客户优惠券数据
   * @returns {Promise<void>}
   */
  async syncNewCustomerCoupon() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步新客户优惠券数据...');

      // 验证源数据库表结构
      const tables = [
        'new_customer_coupon',
        'new_customer_coupon_product',
        'new_customer_coupon_category',
        'new_customer_coupon_history'
      ];

      for (const table of tables) {
        const exists = await this.validateTableStructure(sourceConn, table);
        if (!exists) {
          throw new Error(`源数据库表 ${table} 不存在`);
        }
      }

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_new_customer_coupon');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_new_customer_coupon_product');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_new_customer_coupon_category');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_new_customer_coupon_history');
      logger.info('目标表清空完成');

      // 同步 new_customer_coupon 表
      logger.info('开始同步 new_customer_coupon 表...');
      const [coupons] = await sourceConn.query(`
        SELECT 
          coupon_id, name, code, type, discount, logged, shipping, total, 
          date_start, date_end, uses_total, uses_customer, status, date_added,
          is_special_product, is_include
        FROM new_customer_coupon
      `);
      logger.info(`从源数据库读取到 ${coupons.length} 条新客户优惠券数据`);

      if (coupons.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_new_customer_coupon (
            coupon_id, name, code, type, discount, logged, shipping, total, 
            date_start, date_end, uses_total, uses_customer, status, date_added,
            is_special_product, is_include
          ) VALUES ?
        `, [coupons.map(coupon => Object.values(coupon))]);
        logger.info('new_customer_coupon 表同步完成');
      }

      // 同步 new_customer_coupon_product 表
      logger.info('开始同步 new_customer_coupon_product 表...');
      const [couponProducts] = await sourceConn.query(`
        SELECT 
          coupon_product_id, coupon_id, product_id
        FROM new_customer_coupon_product
      `);
      logger.info(`从源数据库读取到 ${couponProducts.length} 条新客户优惠券产品关联数据`);

      if (couponProducts.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_new_customer_coupon_product (
            coupon_product_id, coupon_id, product_id
          ) VALUES ?
        `, [couponProducts.map(product => Object.values(product))]);
        logger.info('new_customer_coupon_product 表同步完成');
      }

      // 同步 new_customer_coupon_category 表
      logger.info('开始同步 new_customer_coupon_category 表...');
      const [couponCategories] = await sourceConn.query(`
        SELECT 
          coupon_id, category_id
        FROM new_customer_coupon_category
      `);
      logger.info(`从源数据库读取到 ${couponCategories.length} 条新客户优惠券分类关联数据`);

      if (couponCategories.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_new_customer_coupon_category (
            coupon_id, category_id
          ) VALUES ?
        `, [couponCategories.map(category => Object.values(category))]);
        logger.info('new_customer_coupon_category 表同步完成');
      }

      // 同步 new_customer_coupon_history 表
      logger.info('开始同步 new_customer_coupon_history 表...');
      const [couponHistories] = await sourceConn.query(`
        SELECT 
          coupon_history_id, coupon_id, order_id, customer_id, 
          amount, date_added
        FROM new_customer_coupon_history
      `);
      logger.info(`从源数据库读取到 ${couponHistories.length} 条新客户优惠券使用历史数据`);

      if (couponHistories.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_new_customer_coupon_history (
            coupon_history_id, coupon_id, order_id, customer_id, 
            amount, date_added
          ) VALUES ?
        `, [couponHistories.map(history => Object.values(history))]);
        logger.info('new_customer_coupon_history 表同步完成');
      }

      await targetConn.commit();
      logger.info('新客户优惠券数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('新客户优惠券数据同步失败:', error);
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

module.exports = new NewCustomerCouponSync();
