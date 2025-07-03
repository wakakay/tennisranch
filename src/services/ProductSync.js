const { targetPool } = require('../config/database');
const logger = require('../utils/logger');
const ProductService = require('./ProductService');

class ProductSync {
  /**
   * 同步产品数据
   * @returns {Promise<Object>} 同步结果
   */
  async syncProduct() {
    try {
      // 调用ProductService中的同步方法
      return await ProductService.syncProduct();
    } catch (error) {
      logger.error('产品数据同步失败:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;
    }
  }

  /**
   * 清理无效的产品选项值数据
   * @returns {Promise<void>}
   */
  async clearInvalidProductOptionValues() {
    const conn = await targetPool.getConnection();

    try {
      await conn.beginTransaction();

      logger.info('开始清理无效的产品选项值数据...');

      // 获取需要删除的数据
      const [invalidData] = await conn.query(`
        SELECT pov.*, p.product_id 
        FROM oc_product_option_value pov
        LEFT JOIN oc_product_option po ON pov.product_option_id = po.product_option_id
        LEFT JOIN oc_product p ON po.product_id = p.product_id
        WHERE pov.option_value_id NOT IN (
          SELECT option_value_id FROM oc_option_value
        )
      `);

      if (invalidData.length === 0) {
        logger.info('没有发现无效的产品选项值数据');
        await conn.commit();
        return;
      }

      // 统计受影响的product_id
      const affectedProductIds = new Set(invalidData.map(item => item.product_id));

      // 删除无效数据
      const [result] = await conn.query(`
        DELETE pov FROM oc_product_option_value pov
        WHERE pov.option_value_id NOT IN (
          SELECT option_value_id FROM oc_option_value
        )
      `);

      await conn.commit();

      logger.info(`清理完成：
        - 共删除 ${result.affectedRows} 条无效的产品选项值数据
        - 涉及 ${affectedProductIds.size} 个产品
        - 受影响的product_id: ${Array.from(affectedProductIds).join(', ')}
      `);

    } catch (error) {
      await conn.rollback();
      logger.error('清理无效产品选项值数据失败:', error);
      throw error;

    } finally {
      conn.release();
    }
  }
}

module.exports = new ProductSync();
