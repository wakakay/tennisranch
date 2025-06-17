const CartSync = require('../services/CartSync');
const logger = require('../utils/logger');

class CartController {
  /**
   * 同步购物车数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await CartSync.syncCart();
      res.json({ 
        success: true,
        message: '购物车数据同步成功' 
      });
    } catch (error) {
      logger.error('购物车数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: '购物车数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new CartController();