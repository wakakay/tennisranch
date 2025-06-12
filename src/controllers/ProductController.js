const ProductSync = require('../services/ProductSync');
const logger = require('../utils/logger');

/**
 * 产品数据同步控制器
 */
class ProductController {
    /**
     * 同步产品数据
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    static async syncProduct(req, res) {
        try {
            const result = await ProductSync.syncProduct();
            res.json({
                success: true,
                message: '产品数据同步成功',
                data: result
            });
        } catch (error) {
            logger.error('产品数据同步失败:', error);
            res.status(500).json({
                success: false,
                message: '产品数据同步失败',
                error: error.message
            });
        }
    }

    /**
     * 清理无效的产品选项值数据
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     */
    static async clearInvalidProductOptionValues(req, res) {
        try {
            await ProductSync.clearInvalidProductOptionValues();
            res.json({ success: true, message: '清理无效产品选项值数据完成' });
        } catch (error) {
            logger.error('清理无效产品选项值数据失败:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ProductController; 