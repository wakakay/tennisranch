const InformationSync = require('../services/InformationSync');
const logger = require('../utils/logger');

class InformationController {
  /**
   * 同步Information数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await InformationSync.syncInformation();
      res.json({ 
        success: true,
        message: 'Information数据同步成功' 
      });
    } catch (error) {
      logger.error('Information数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: 'Information数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new InformationController();