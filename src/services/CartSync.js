const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 同步购物车数据
 */
class CartSync {
  /**
   * 同步购物车数据
   * @returns {Promise<void>}
   */
  async syncCart() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_cart');
      logger.info('目标表清空完成');

      // 同步 cart 表到 oc_cart
      logger.info('开始同步 cart 表到 oc_cart...');
      const [carts] = await sourceConn.query(`
        SELECT 
          cart_id, customer_id, session_id, product_id, \`option\`, quantity, date_added, recurring_id
        FROM cart
      `);
      logger.info(`从源数据库读取到 ${carts.length} 条购物车数据`);

      if (carts.length > 0) {
        // 转换数据，添加新字段默认值
        const values = carts.map(cart => [
          cart.cart_id,
          cart.customer_id,
          cart.session_id,
          cart.product_id,
          cart.option,
          cart.quantity,
          null, // price 默认为 null
          0,    // store_id 默认为 0
          '[]', // override 默认为空数组
          cart.recurring_id, // subscription_plan_id = recurring_id
          cart.date_added
        ]);

        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_cart (
            cart_id, customer_id, session_id, product_id, \`option\`, quantity, 
            price, store_id, override, subscription_plan_id, date_added
          ) VALUES ?
        `, [values]);
        logger.info('oc_cart 表同步完成');
      }

      await targetConn.commit();
      logger.info('购物车数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('购物车数据同步失败:', error);
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new CartSync();
