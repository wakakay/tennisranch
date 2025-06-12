/**
 * Banner控制器 - 处理banner相关的请求
 * @class BannerController
 */

const BannerSync = require('../services/BannerSync');
const logger = require('../utils/logger');

class BannerController {
    /**
     * 同步banner数据
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     * @returns {Promise<void>}
     */
    async sync(req, res) {
        try {
            await BannerSync.syncAll();
            res.json({ success: true, message: 'Banner数据同步成功' });
        } catch (error) {
            logger.error('同步Banner数据失败:', error);
            res.status(500).json({ 
                success: false, 
                message: '同步Banner数据失败: ' + error.message 
            });
        }
    }
}

module.exports = new BannerController(); 