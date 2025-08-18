const OrderMainSync = require('../services/OrderMainSync');
const logger = require('../utils/logger');

/**
 * 订单控制器
 */
class OrderController {
  /**
   * 同步订单主表数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await OrderMainSync.syncOrderMain();
      res.json({
        success: true,
        message: '订单主表数据同步成功'
      });
    } catch (error) {
      logger.error('订单主表数据同步失败:', error);
      res.status(500).json({
        success: false,
        message: '订单主表数据同步失败',
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();
