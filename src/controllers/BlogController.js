const BlogSync = require('../services/BlogSync');
const logger = require('../utils/logger');

class BlogController {
  /**
   * 同步博客数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async sync(req, res) {
    try {
      await BlogSync.syncBlog();
      res.json({ 
        success: true,
        message: '博客数据同步成功' 
      });
    } catch (error) {
      logger.error('博客数据同步失败:', error);
      res.status(500).json({ 
        success: false,
        message: '博客数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = new BlogController();