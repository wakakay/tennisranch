const GeoZoneSync = require('../services/GeoZoneSync');
const logger = require('../utils/logger');

class GeoZoneController {
  /**
   * 同步geo_zone数据
   * @param {import('express').Request} req - 请求对象
   * @param {import('express').Response} res - 响应对象
   */
  async sync(req, res) {
    try {
      logger.info('开始执行geo_zone数据同步...');
      const geoZoneSync = new GeoZoneSync();
      
      // 执行数据库连接测试
      await geoZoneSync.testConnection();
      
      // 执行同步
      await geoZoneSync.sync();
      
      logger.success('geo_zone数据同步完成');
      res.json({ 
        success: true, 
        message: 'geo_zone数据同步成功' 
      });
    } catch (error) {
      logger.error('geo_zone数据同步失败', error);
      res.status(500).json({ 
        success: false, 
        message: 'geo_zone数据同步失败',
        error: error.message 
      });
    }
  }
}

module.exports = GeoZoneController;
