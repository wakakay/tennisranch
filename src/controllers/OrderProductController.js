const OrderProductSync = require('../services/OrderProductSync');
const logger = require('../utils/logger');

class OrderProductController {
  /**
   * 同步订单产品数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await OrderProductSync.syncOrderProduct();
      res.json({ 
        success: true,
        message: '订单产品数据同步成功' 
      });
    } catch (error) {
      logger.error('订单产品数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: '订单产品数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new OrderProductController();
