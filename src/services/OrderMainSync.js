const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class OrderMainSync {
  /**
   * 同步订单主表数据
   * @returns {Promise<void>}
   */
  async syncOrderMain() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      // 设置事务超时时间为 30 分钟
      await targetConn.query('SET SESSION wait_timeout = 1800');
      await targetConn.query('SET SESSION interactive_timeout = 1800');

      // 临时禁用外键检查
      await targetConn.query('SET FOREIGN_KEY_CHECKS = 0');

      await targetConn.beginTransaction();

      logger.info('开始同步订单主表数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.`order`');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.`order` AUTO_INCREMENT = 1');

      // 同步 order 表
      logger.info('开始同步 order 表...');
      
      // 查询源数据库的order数据，排除不需要的字段fax和shipping_code
      const [orders] = await sourceConn.query(`
        SELECT 
          order_id,
          invoice_no,
          invoice_prefix,
          store_id,
          store_name,
          store_url,
          customer_id,
          customer_group_id,
          firstname,
          lastname,
          email,
          telephone,
          custom_field,
          payment_firstname,
          payment_lastname,
          payment_company,
          payment_address_1,
          payment_address_2,
          payment_city,
          payment_postcode,
          payment_country,
          payment_country_id,
          payment_zone,
          payment_zone_id,
          payment_address_format,
          payment_custom_field,
          payment_method,
          shipping_firstname,
          shipping_lastname,
          shipping_company,
          shipping_address_1,
          shipping_address_2,
          shipping_city,
          shipping_postcode,
          shipping_country,
          shipping_country_id,
          shipping_zone,
          shipping_zone_id,
          shipping_address_format,
          shipping_custom_field,
          shipping_method,
          comment,
          total,
          order_status_id,
          affiliate_id,
          commission,
          marketing_id,
          tracking,
          language_id,
          currency_id,
          currency_code,
          currency_value,
          ip,
          forwarded_ip,
          user_agent,
          accept_language,
          date_added,
          date_modified
        FROM \`order\`
      `);
      
      logger.info(`从源数据库读取到 ${orders.length} 条订单数据`);

      if (orders.length > 0) {
        // 使用批量处理，每批处理500条记录
        const batchSize = 500;
        for (let i = 0; i < orders.length; i += batchSize) {
          const batch = orders.slice(i, i + batchSize);

          // 处理数据，添加目标数据库的新字段
          const values = batch.map(order => [
            order.order_id,
            0, // subscription_id 默认值
            order.invoice_no || 0,
            order.invoice_prefix || '',
            null, // transaction_id 默认值
            order.store_id || 0,
            order.store_name || '',
            order.store_url || '',
            order.customer_id || 0,
            order.customer_group_id || 0,
            order.firstname || '',
            order.lastname || '',
            order.email || '',
            order.telephone || '',
            order.custom_field || '',
            0, // payment_address_id 默认值
            order.payment_firstname || '',
            order.payment_lastname || '',
            order.payment_company || '',
            order.payment_address_1 || '',
            order.payment_address_2 || '',
            order.payment_city || '',
            order.payment_postcode || '',
            order.payment_country || '',
            order.payment_country_id || 0,
            order.payment_zone || '',
            order.payment_zone_id || 0,
            order.payment_address_format || '',
            order.payment_custom_field || '',
            order.payment_method || '',
            0, // shipping_address_id 默认值
            order.shipping_firstname || '',
            order.shipping_lastname || '',
            order.shipping_company || '',
            order.shipping_address_1 || '',
            order.shipping_address_2 || '',
            order.shipping_city || '',
            order.shipping_postcode || '',
            order.shipping_country || '',
            order.shipping_country_id || 0,
            order.shipping_zone || '',
            order.shipping_zone_id || 0,
            order.shipping_address_format || '',
            order.shipping_custom_field || '',
            order.shipping_method || '',
            order.comment || '',
            order.total || 0.0000,
            order.order_status_id || 0,
            order.affiliate_id || 0,
            order.commission || null,
            order.marketing_id || 0,
            order.tracking || '',
            order.language_id || null,
            'en-gb', // language_code 默认值
            order.currency_id || null,
            order.currency_code || '',
            order.currency_value || 1.00000000,
            order.ip || '',
            order.forwarded_ip || '',
            order.user_agent || '',
            order.accept_language || '',
            order.date_added || new Date().toISOString().slice(0, 19).replace('T', ' '),
            order.date_modified || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);

          await targetConn.query(`
            INSERT INTO tennisranch_4x.\`order\` (
              order_id, subscription_id, invoice_no, invoice_prefix, transaction_id,
              store_id, store_name, store_url, customer_id, customer_group_id,
              firstname, lastname, email, telephone, custom_field,
              payment_address_id, payment_firstname, payment_lastname, payment_company,
              payment_address_1, payment_address_2, payment_city, payment_postcode,
              payment_country, payment_country_id, payment_zone, payment_zone_id,
              payment_address_format, payment_custom_field, payment_method,
              shipping_address_id, shipping_firstname, shipping_lastname, shipping_company,
              shipping_address_1, shipping_address_2, shipping_city, shipping_postcode,
              shipping_country, shipping_country_id, shipping_zone, shipping_zone_id,
              shipping_address_format, shipping_custom_field, shipping_method,
              comment, total, order_status_id, affiliate_id, commission,
              marketing_id, tracking, language_id, language_code, currency_id,
              currency_code, currency_value, ip, forwarded_ip, user_agent,
              accept_language, date_added, date_modified
            ) VALUES ?
          `, [values]);

          logger.info(`order 表批次 ${Math.floor(i/batchSize) + 1} 同步完成`);
        }

        logger.info('order 表同步完成');
      }

      await targetConn.commit();
      logger.info('订单主表数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('订单主表数据同步失败:', error);
      logger.error('错误详情:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;

    } finally {
      // 确保外键检查被重新启用
      try {
        await targetConn.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        logger.error('重新启用外键检查失败:', e);
      }
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new OrderMainSync();
