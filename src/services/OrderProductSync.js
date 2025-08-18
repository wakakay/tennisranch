const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class OrderProductSync {
  /**
   * 同步订单产品数据
   * @returns {Promise<void>}
   */
  async syncOrderProduct() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步订单产品数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.order_product');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.order_product AUTO_INCREMENT = 1');

      // 同步 order_product 表
      logger.info('开始同步 order_product 表...');
      
      // 查询源数据库的order_product数据
      const [orderProducts] = await sourceConn.query(`
        SELECT 
          order_product_id,
          order_id,
          product_id,
          name,
          model,
          quantity,
          price,
          total,
          tax,
          reward
        FROM order_product
      `);
      
      logger.info(`从源数据库读取到 ${orderProducts.length} 条订单产品数据`);

      if (orderProducts.length > 0) {
        // 处理数据，添加master_id字段（默认为0）
        const values = orderProducts.map(product => [
          product.order_product_id,
          product.order_id,
          product.product_id,
          0, // master_id 默认为0
          product.name || '',
          product.model || '',
          product.quantity || 1,
          product.price || 0.0000,
          product.total || 0.0000,
          product.tax || 0.0000,
          product.reward || 0
        ]);

        await targetConn.query(`
          INSERT INTO tennisranch_4x.order_product (
            order_product_id, order_id, product_id, master_id, name, model,
            quantity, price, total, tax, reward
          ) VALUES ?
        `, [values]);
        
        logger.info('order_product 表同步完成');
      }

      await targetConn.commit();
      logger.info('订单产品数据同步完成');

      return {
        success: true,
        message: '订单产品数据同步成功',
        count: orderProducts.length
      };

    } catch (error) {
      await targetConn.rollback();
      logger.error('订单产品数据同步失败:', error);
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new OrderProductSync();
