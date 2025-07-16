const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class CouponSync {
  /**
   * 同步优惠券数据
   * @returns {Promise<void>}
   */
  async syncCoupon() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步优惠券数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.coupon');
      await targetConn.query('DELETE FROM tennisranch_4x.coupon_product');
      await targetConn.query('DELETE FROM tennisranch_4x.coupon_category');
      await targetConn.query('DELETE FROM tennisranch_4x.coupon_history');
      logger.info('目标表清空完成');

      // 同步 coupon 表
      logger.info('开始同步 coupon 表...');
      const [coupons] = await sourceConn.query(`
        SELECT 
          coupon_id, name, code, type, discount, logged, shipping, total, 
          date_start, date_end, uses_total, uses_customer, status, date_added,
          is_special_product, is_include
        FROM coupon
      `);
      logger.info(`从源数据库读取到 ${coupons.length} 条优惠券数据`);

      if (coupons.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.coupon (
            coupon_id, name, code, type, discount, logged, shipping, total, 
            date_start, date_end, uses_total, uses_customer, status, date_added,
            is_special_product, is_include
          ) VALUES ?
        `, [coupons.map(coupon => Object.values(coupon))]);
        logger.info('coupon 表同步完成');
      }

      // 同步 coupon_product 表
      logger.info('开始同步 coupon_product 表...');
      const [couponProducts] = await sourceConn.query(`
        SELECT 
          coupon_product_id, coupon_id, product_id
        FROM coupon_product
      `);
      logger.info(`从源数据库读取到 ${couponProducts.length} 条优惠券产品关联数据`);

      if (couponProducts.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.coupon_product (
            coupon_product_id, coupon_id, product_id
          ) VALUES ?
        `, [couponProducts.map(product => Object.values(product))]);
        logger.info('coupon_product 表同步完成');
      }

      // 同步 coupon_category 表
      logger.info('开始同步 coupon_category 表...');
      const [couponCategories] = await sourceConn.query(`
        SELECT 
          coupon_id, category_id
        FROM coupon_category
      `);
      logger.info(`从源数据库读取到 ${couponCategories.length} 条优惠券分类关联数据`);

      if (couponCategories.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.coupon_category (
            coupon_id, category_id
          ) VALUES ?
        `, [couponCategories.map(category => Object.values(category))]);
        logger.info('coupon_category 表同步完成');
      }

      // 同步 coupon_history 表
      logger.info('开始同步 coupon_history 表...');
      const [couponHistories] = await sourceConn.query(`
        SELECT 
          coupon_history_id, coupon_id, order_id, customer_id, 
          amount, date_added
        FROM coupon_history
      `);
      logger.info(`从源数据库读取到 ${couponHistories.length} 条优惠券使用历史数据`);

      if (couponHistories.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.coupon_history (
            coupon_history_id, coupon_id, order_id, customer_id, 
            amount, date_added
          ) VALUES ?
        `, [couponHistories.map(history => Object.values(history))]);
        logger.info('coupon_history 表同步完成');
      }

      await targetConn.commit();
      logger.info('优惠券数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('优惠券数据同步失败:', error);
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

module.exports = new CouponSync();
