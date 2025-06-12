/**
 * Tax控制器 - 处理tax相关的请求
 * @class TaxController
 */

const TaxSync = require('../services/TaxSync');
const logger = require('../utils/logger');

class TaxController {
  /**
   * 同步tax相关表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      const result = await TaxSync.syncAll();
      
      res.json(result);
      
    } catch (error) {
      logger.error('处理tax同步请求时出错:', error);
      
      res.status(500).json({
        success: false,
        message: '同步过程发生错误'
      });
    }
  }
}

module.exports = new TaxController(); 