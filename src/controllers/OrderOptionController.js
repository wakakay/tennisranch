const OrderOptionSync = require('../services/OrderOptionSync');
const logger = require('../utils/logger');

class OrderOptionController {
  /**
   * 同步订单选项数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await OrderOptionSync.syncOrderOption();
      res.json({ 
        success: true,
        message: '订单选项数据同步成功' 
      });
    } catch (error) {
      logger.error('订单选项数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: '订单选项数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new OrderOptionController();
