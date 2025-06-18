const GoogleBaseSync = require('../services/GoogleBaseSync');
const logger = require('../utils/logger');

class GoogleBaseController {
  /**
   * 同步Google Base数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await GoogleBaseSync.syncGoogleBase();
      res.json({ 
        success: true,
        message: 'Google Base数据同步成功' 
      });
    } catch (error) {
      logger.error('Google Base数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: 'Google Base数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new GoogleBaseController();