const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class OrderTotalSync {
  /**
   * 同步订单总计数据
   * @returns {Promise<void>}
   */
  async syncOrderTotal() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步订单总计数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.order_total');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.order_total AUTO_INCREMENT = 1');

      // 同步 order_total 表
      logger.info('开始同步 order_total 表...');
      
      // 查询源数据库的order_total数据
      const [orderTotals] = await sourceConn.query(`
        SELECT 
          order_total_id,
          order_id,
          code,
          title,
          value,
          sort_order
        FROM order_total
      `);
      
      logger.info(`从源数据库读取到 ${orderTotals.length} 条订单总计数据`);

      if (orderTotals.length > 0) {
        // 处理数据，添加extension字段（默认为'opencart'）
        const values = orderTotals.map(total => [
          total.order_total_id,
          total.order_id,
          'opencart', // extension字段默认值
          total.code || '',
          total.title || '',
          total.value || 0.0000,
          total.sort_order || 0
        ]);

        await targetConn.query(`
          INSERT INTO tennisranch_4x.order_total (
            order_total_id, order_id, extension, code, title, value, sort_order
          ) VALUES ?
        `, [values]);
        
        logger.info('order_total 表同步完成');
      }

      await targetConn.commit();
      logger.info('订单总计数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('订单总计数据同步失败:', error);
      logger.error('错误详情:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;

    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new OrderTotalSync();
