const CustomerOtherSync = require('../services/CustomerOtherSync');
const logger = require('../utils/logger');

/**
 * CustomerOtherController 控制器
 * 用于处理其他客户相关表的同步请求
 */
class CustomerOtherController {
  /**
   * 同步其他客户相关表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  static async sync(req, res) {
    try {
      const result = await CustomerOtherSync.syncAll();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      logger.error('处理其他客户相关表同步请求时出错:', error);
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = CustomerOtherController; 