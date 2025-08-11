const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class OrderHistorySync {
  /**
   * 同步订单历史数据
   * @returns {Promise<void>}
   */
  async syncOrderHistory() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步订单历史数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.order_history');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.order_history AUTO_INCREMENT = 1');

      // 同步 order_history 表
      logger.info('开始同步 order_history 表...');
      
      // 查询源数据库的order_history数据，并关联order表获取date_added
      const [orderHistories] = await sourceConn.query(`
        SELECT 
          oh.order_history_id,
          oh.order_id,
          oh.order_status_id,
          oh.notify,
          oh.comment,
          o.date_added
        FROM order_history oh
        LEFT JOIN \`order\` o ON oh.order_id = o.order_id
      `);
      
      logger.info(`从源数据库读取到 ${orderHistories.length} 条订单历史数据`);

      if (orderHistories.length > 0) {
        // 处理数据，确保date_added字段有值
        const values = orderHistories.map(history => [
          history.order_history_id,
          history.order_id,
          history.order_status_id || 0,
          history.notify || 0,
          history.comment || '',
          history.date_added || new Date().toISOString().slice(0, 19).replace('T', ' ')
        ]);

        await targetConn.query(`
          INSERT INTO tennisranch_4x.order_history (
            order_history_id, order_id, order_status_id, notify, comment, date_added
          ) VALUES ?
        `, [values]);
        
        logger.info('order_history 表同步完成');
      }

      await targetConn.commit();
      logger.info('订单历史数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('订单历史数据同步失败:', error);
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

module.exports = new OrderHistorySync();
