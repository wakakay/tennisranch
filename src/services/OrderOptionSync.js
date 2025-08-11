const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class OrderOptionSync {
  /**
   * 同步订单选项数据
   * @returns {Promise<void>}
   */
  async syncOrderOption() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步订单选项数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.order_option');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.order_option AUTO_INCREMENT = 1');

      // 同步 order_option 表
      logger.info('开始同步 order_option 表...');
      
      // 查询源数据库的order_option数据，并关联option表获取type字段
      // 根据需求：order_option.value = option.option_id，取option.type作为type
      const [orderOptions] = await sourceConn.query(`
        SELECT
          oo.order_option_id,
          oo.order_id,
          oo.order_product_id,
          oo.product_option_id,
          oo.product_option_value_id,
          oo.name,
          oo.value,
          COALESCE(o.type, 'select') as type
        FROM order_option oo
        LEFT JOIN \`option\` o ON CAST(oo.value AS UNSIGNED) = o.option_id
      `);
      
      logger.info(`从源数据库读取到 ${orderOptions.length} 条订单选项数据`);

      if (orderOptions.length > 0) {
        // 处理数据，确保所有字段都有合适的默认值
        const values = orderOptions.map(option => [
          option.order_option_id,
          option.order_id,
          option.order_product_id,
          option.product_option_id,
          option.product_option_value_id || 0,
          option.name || '',
          option.value || '',
          option.type || 'select'
        ]);

        await targetConn.query(`
          INSERT INTO tennisranch_4x.order_option (
            order_option_id, order_id, order_product_id, product_option_id,
            product_option_value_id, name, value, type
          ) VALUES ?
        `, [values]);
        
        logger.info('order_option 表同步完成');
      }

      await targetConn.commit();
      logger.info('订单选项数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('订单选项数据同步失败:', error);
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

module.exports = new OrderOptionSync();
