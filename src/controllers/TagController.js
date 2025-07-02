const TagSync = require('../services/TagSync');
const logger = require('../utils/logger');

class TagController {
  /**
   * 同步tag数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await TagSync.syncTag();
      res.json({ 
        success: true,
        message: 'tag数据同步成功' 
      });
    } catch (error) {
      logger.error('tag数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: 'tag数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new TagController(); 