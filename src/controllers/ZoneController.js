const ZoneSync = require('../services/ZoneSync');
const logger = require('../utils/logger');

class ZoneController {
  /**
   * 同步区域数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await ZoneSync.syncZone();
      res.json({ 
        success: true,
        message: '区域数据同步成功' 
      });
    } catch (error) {
      logger.error('区域数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: '区域数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new ZoneController(); 