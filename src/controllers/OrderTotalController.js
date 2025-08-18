const OrderTotalSync = require('../services/OrderTotalSync');
const logger = require('../utils/logger');

class OrderTotalController {
  /**
   * 同步订单总计数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await OrderTotalSync.syncOrderTotal();
      res.json({ 
        success: true,
        message: '订单总计数据同步成功' 
      });
    } catch (error) {
      logger.error('订单总计数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: '订单总计数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new OrderTotalController();
