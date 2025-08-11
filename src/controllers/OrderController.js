const OrderSync = require('../services/OrderSync');
const logger = require('../utils/logger');

/**
 * 订单控制器
 */
class OrderController {
  /**
   * 同步订单数据
   */
  async sync(req, res) {
    try {
      logger.info('开始执行订单同步操作...');
      await OrderSync.syncOrder();

      logger.success('订单同步操作完成');
      res.json({
        success: true,
        message: '订单数据同步完成'
      });
    } catch (error) {
      // {{ AURA-X: 改进控制器错误日志记录 }}
      logger.error('订单同步操作失败:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({
        success: false,
        message: '订单同步操作失败',
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();
