const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 同步订单数据
 */
class OrderSync {
  /**
   * 同步订单数据（方案三：注册用户创建地址记录，游客保持0）
   * @returns {Promise<void>}
   */
  async syncOrder() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步订单数据...');

      // 清空目标表 - 使用安全清空方法
      logger.info('清空目标表...');
      await this.safeTruncateTable(targetConn, 'order'); // {{ AURA-X: 移除反引号，统一表名格式 }}
      await this.safeTruncateTable(targetConn, 'order_product');
      await this.safeTruncateTable(targetConn, 'order_option');
      await this.safeTruncateTable(targetConn, 'order_voucher');
      await this.safeTruncateTable(targetConn, 'order_total');
      await this.safeTruncateTable(targetConn, 'order_history');
      await this.safeTruncateTable(targetConn, 'paypal_checkout_integration_order');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      const orderExists = await this.checkTableExists(targetConn, 'order');
      if (orderExists) {
        await targetConn.query('ALTER TABLE tennisranch_4x.`order` AUTO_INCREMENT = 1'); // {{ AURA-X: 确保order表自增ID重置 }}
        logger.info('order表自增ID重置为1');
      }

      // 同步订单主表
      await this.syncOrderTable(sourceConn, targetConn);

      // 处理地址关联（方案三）
      await this.processAddressAssociation(sourceConn, targetConn);

      // 处理PayPal订单
      await this.processPayPalOrders(sourceConn, targetConn);

      // 同步关联表 - 也需要检查表存在性
      await this.syncOrderProductSafe(sourceConn, targetConn);
      await this.syncOrderOptionSafe(sourceConn, targetConn);
      await this.syncOrderVoucherSafe(sourceConn, targetConn);
      await this.syncOrderTotalSafe(sourceConn, targetConn);
      await this.syncOrderHistorySafe(sourceConn, targetConn);

      await targetConn.commit();
      logger.info('订单数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      // {{ AURA-X: 改进错误日志记录，确保捕获完整的错误信息 }}
      logger.error('订单数据同步失败:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;
    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }

  /**
   * 同步订单主表
   */
  async syncOrderTable(sourceConn, targetConn) {
    logger.info('开始同步 order 表...');

    const [orders] = await sourceConn.query(`
      SELECT
        order_id, invoice_no, invoice_prefix, store_id, store_name, store_url,
        customer_id, customer_group_id, firstname, lastname, email, telephone,
        payment_firstname, payment_lastname, payment_company, payment_address_1, payment_address_2,
        payment_city, payment_postcode, payment_country, payment_country_id, payment_zone,
        payment_zone_id, payment_address_format, payment_custom_field, payment_method,
        shipping_firstname, shipping_lastname, shipping_company, shipping_address_1, shipping_address_2,
        shipping_city, shipping_postcode, shipping_country, shipping_country_id, shipping_zone,
        shipping_zone_id, shipping_address_format, shipping_custom_field, shipping_method,
        comment, total, order_status_id, affiliate_id, commission, tracking,
        language_id, currency_id, currency_code, currency_value, ip, forwarded_ip, user_agent,
        accept_language, date_added, date_modified
      FROM \`order\`
    `);

    logger.info(`从源数据库读取到 ${orders.length} 条订单数据`);

    if (orders.length > 0) {
      const values = orders.map(order => [
        order.order_id,
        order.invoice_no,
        order.invoice_prefix,
        order.store_id,
        order.store_name,
        order.store_url,
        order.customer_id,
        order.customer_group_id,
        order.firstname,
        order.lastname,
        order.email,
        order.telephone,
        order.payment_firstname,
        order.payment_lastname,
        order.payment_company,
        order.payment_address_1,
        order.payment_address_2,
        order.payment_city,
        order.payment_postcode,
        order.payment_country,
        order.payment_country_id,
        order.payment_zone,
        order.payment_zone_id,
        order.payment_address_format,
        order.payment_custom_field,
        order.payment_method,
        0, // payment_address_id - 稍后处理
        order.shipping_firstname,
        order.shipping_lastname,
        order.shipping_company,
        order.shipping_address_1,
        order.shipping_address_2,
        order.shipping_city,
        order.shipping_postcode,
        order.shipping_country,
        order.shipping_country_id,
        order.shipping_zone,
        order.shipping_zone_id,
        order.shipping_address_format,
        order.shipping_custom_field,
        order.shipping_method,
        0, // shipping_address_id - 稍后处理
        order.comment,
        order.total,
        order.order_status_id,
        order.affiliate_id,
        order.commission,
        0, // marketing_id 默认为 0
        order.tracking || '',
        order.language_id,
        order.currency_id,
        order.currency_code,
        order.currency_value,
        order.ip,
        order.forwarded_ip,
        order.user_agent,
        order.accept_language,
        order.date_added,
        order.date_modified
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.\`order\` (
          order_id, invoice_no, invoice_prefix, store_id, store_name, store_url,
          customer_id, customer_group_id, firstname, lastname, email, telephone,
          payment_firstname, payment_lastname, payment_company, payment_address_1, payment_address_2,
          payment_city, payment_postcode, payment_country, payment_country_id, payment_zone,
          payment_zone_id, payment_address_format, payment_custom_field, payment_method,
          payment_address_id,
          shipping_firstname, shipping_lastname, shipping_company, shipping_address_1, shipping_address_2,
          shipping_city, shipping_postcode, shipping_country, shipping_country_id, shipping_zone,
          shipping_zone_id, shipping_address_format, shipping_custom_field, shipping_method,
          shipping_address_id,
          comment, total, order_status_id, affiliate_id, commission, marketing_id, tracking,
          language_id, currency_id, currency_code, currency_value, ip, forwarded_ip, user_agent,
          accept_language, date_added, date_modified
        ) VALUES ?
      `, [values]);

      logger.info('order 表同步完成');
    }
  }

  /**
   * 处理地址关联（方案三核心逻辑）
   */
  async processAddressAssociation(sourceConn, targetConn) {
    logger.info('开始处理地址关联（方案三）...');

    // 获取注册用户订单
    const [registeredOrders] = await targetConn.query(`
      SELECT order_id, customer_id,
             payment_firstname, payment_lastname, payment_company, payment_address_1, payment_address_2,
             payment_city, payment_postcode, payment_country_id, payment_zone_id, payment_custom_field,
             shipping_firstname, shipping_lastname, shipping_company, shipping_address_1, shipping_address_2,
             shipping_city, shipping_postcode, shipping_country_id, shipping_zone_id, shipping_custom_field
      FROM tennisranch_4x.\`order\`
      WHERE customer_id > 0
    `);

    logger.info(`找到 ${registeredOrders.length} 个注册用户订单需要处理地址关联`);

    for (const order of registeredOrders) {
      let paymentAddressId = null;
      let shippingAddressId = null;

      // 处理付款地址
      if (order.payment_firstname) {
        // {{ AURA-X: 检查是否已存在相同的付款地址 }}
        const [existingPaymentAddress] = await targetConn.query(`
          SELECT address_id FROM tennisranch_4x.address
          WHERE customer_id = ? AND firstname = ? AND lastname = ?
          AND address_1 = ? AND city = ? AND postcode = ?
          AND country_id = ? AND zone_id = ?
          LIMIT 1
        `, [
          order.customer_id, order.payment_firstname, order.payment_lastname,
          order.payment_address_1, order.payment_city, order.payment_postcode,
          order.payment_country_id, order.payment_zone_id
        ]);

        if (existingPaymentAddress.length > 0) {
          paymentAddressId = existingPaymentAddress[0].address_id;
        } else {
          // 创建新的付款地址记录
        const [paymentResult] = await targetConn.query(`
          INSERT INTO tennisranch_4x.address (
            customer_id, firstname, lastname, company, address_1, address_2,
            city, postcode, country_id, zone_id, custom_field, \`default\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          order.customer_id, order.payment_firstname, order.payment_lastname,
          order.payment_company, order.payment_address_1, order.payment_address_2,
          order.payment_city, order.payment_postcode, order.payment_country_id,
          order.payment_zone_id, order.payment_custom_field || '{}', 0
        ]);
          paymentAddressId = paymentResult.insertId;
        }

        // 更新订单的payment_address_id
        await targetConn.query(`
          UPDATE tennisranch_4x.\`order\`
          SET payment_address_id = ?
          WHERE order_id = ?
        `, [paymentAddressId, order.order_id]);
      }

      // 处理配送地址
      if (order.shipping_firstname &&
          (order.shipping_firstname !== order.payment_firstname ||
           order.shipping_address_1 !== order.payment_address_1 ||
           order.shipping_city !== order.payment_city)) {

        // {{ AURA-X: 检查是否已存在相同的配送地址 }}
        const [existingShippingAddress] = await targetConn.query(`
          SELECT address_id FROM tennisranch_4x.address
          WHERE customer_id = ? AND firstname = ? AND lastname = ?
          AND address_1 = ? AND city = ? AND postcode = ?
          AND country_id = ? AND zone_id = ?
          LIMIT 1
        `, [
          order.customer_id, order.shipping_firstname, order.shipping_lastname,
          order.shipping_address_1, order.shipping_city, order.shipping_postcode,
          order.shipping_country_id, order.shipping_zone_id
        ]);

        if (existingShippingAddress.length > 0) {
          shippingAddressId = existingShippingAddress[0].address_id;
        } else {
          // 创建新的配送地址记录
        const [shippingResult] = await targetConn.query(`
          INSERT INTO tennisranch_4x.address (
            customer_id, firstname, lastname, company, address_1, address_2,
            city, postcode, country_id, zone_id, custom_field, \`default\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          order.customer_id, order.shipping_firstname, order.shipping_lastname,
          order.shipping_company, order.shipping_address_1, order.shipping_address_2,
          order.shipping_city, order.shipping_postcode, order.shipping_country_id,
          order.shipping_zone_id, order.shipping_custom_field || '{}', 0
        ]);
          shippingAddressId = shippingResult.insertId;
        }

        // 更新订单的shipping_address_id
        await targetConn.query(`
          UPDATE tennisranch_4x.\`order\`
          SET shipping_address_id = ?
          WHERE order_id = ?
        `, [shippingAddressId, order.order_id]);
      } else {
        // 配送地址与付款地址相同，使用相同的address_id
        shippingAddressId = paymentAddressId;
        await targetConn.query(`
          UPDATE tennisranch_4x.\`order\`
          SET shipping_address_id = ?
          WHERE order_id = ?
        `, [shippingAddressId, order.order_id]);
      }
    }

    logger.info('地址关联处理完成');
  }

  /**
   * 处理PayPal订单
   */
  async processPayPalOrders(sourceConn, targetConn) {
    logger.info('开始处理PayPal订单...');

    const [paypalOrders] = await targetConn.query(`
      SELECT order_id, total, currency_code, order_status_id, payment_method
      FROM tennisranch_4x.\`order\`
      WHERE payment_method IN ('PayPal', 'paypal_express')
    `);

    logger.info(`找到 ${paypalOrders.length} 个PayPal订单`);

    if (paypalOrders.length > 0) {
      const paypalData = paypalOrders.map((order, index) => [
        order.order_id,
        index + 1, // {{ AURA-X: paypal_order_id从1开始自增 }}
        null, // transaction_id
        this.mapTransactionStatus(order.order_status_id), // transaction_status
        'paypal', // payment_method
        order.total,
        order.currency_code,
        'live' // environment
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.paypal_checkout_integration_order (
          order_id, paypal_order_id, transaction_id, transaction_status,
          payment_method, total, currency_code, environment
        ) VALUES ?
      `, [paypalData]);

      logger.info('PayPal订单处理完成');
    }
  }

  /**
   * 映射交易状态
   */
  mapTransactionStatus(orderStatusId) {
    const statusMap = {
      1: 'PENDING',     // Pending
      2: 'COMPLETED',   // Processing
      3: 'COMPLETED',   // Shipped
      5: 'COMPLETED',   // Complete
      7: 'CANCELLED',   // Canceled
      8: 'DENIED',      // Denied
      10: 'FAILED',     // Failed
      11: 'REFUNDED',   // Refunded
      12: 'REVERSED',   // Reversed
      13: 'CANCELLED'   // Chargeback
    };

    return statusMap[orderStatusId] || 'PENDING';
  }

  /**
   * 安全同步订单产品表
   */
  async syncOrderProductSafe(sourceConn, targetConn) {
    const exists = await this.checkTableExists(targetConn, 'order_product');
    if (!exists) {
      logger.info('order_product 表不存在，跳过同步');
      return;
    }
    await this.syncOrderProduct(sourceConn, targetConn);
  }

  /**
   * 安全同步订单选项表
   */
  async syncOrderOptionSafe(sourceConn, targetConn) {
    const exists = await this.checkTableExists(targetConn, 'order_option');
    if (!exists) {
      logger.info('order_option 表不存在，跳过同步');
      return;
    }
    await this.syncOrderOption(sourceConn, targetConn);
  }

  /**
   * 安全同步订单代金券表
   */
  async syncOrderVoucherSafe(sourceConn, targetConn) {
    const exists = await this.checkTableExists(targetConn, 'order_voucher');
    if (!exists) {
      logger.info('order_voucher 表不存在，跳过同步');
      return;
    }
    await this.syncOrderVoucher(sourceConn, targetConn);
  }

  /**
   * 安全同步订单总计表
   */
  async syncOrderTotalSafe(sourceConn, targetConn) {
    const exists = await this.checkTableExists(targetConn, 'order_total');
    if (!exists) {
      logger.info('order_total 表不存在，跳过同步');
      return;
    }
    await this.syncOrderTotal(sourceConn, targetConn);
  }

  /**
   * 安全同步订单历史表
   */
  async syncOrderHistorySafe(sourceConn, targetConn) {
    const exists = await this.checkTableExists(targetConn, 'order_history');
    if (!exists) {
      logger.info('order_history 表不存在，跳过同步');
      return;
    }
    await this.syncOrderHistory(sourceConn, targetConn);
  }

  /**
   * 同步订单产品表
   */
  async syncOrderProduct(sourceConn, targetConn) {
    logger.info('开始同步 order_product 表...');

    const [products] = await sourceConn.query(`
      SELECT * FROM ${this.sourceDbName}.order_product
    `);

    logger.info(`从源数据库读取到 ${products.length} 条订单产品数据`);

    if (products.length > 0) {
      // {{ AURA-X: 批量插入，提高性能 }}
      const batchSize = 1000;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const values = batch.map(product => [
        product.order_product_id,
        product.order_id,
        product.product_id,
        product.name,
        product.model,
        product.quantity,
        product.price,
        product.total,
          product.tax || 0,
          product.reward || 0
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.order_product (
          order_product_id, order_id, product_id, name, model,
          quantity, price, total, tax, reward
        ) VALUES ?
      `, [values]);

        logger.info(`order_product 表批次 ${Math.floor(i/batchSize) + 1} 同步完成`);
      }
    }

      logger.info('order_product 表同步完成');
    }

  /**
   * 同步订单选项表
   */
  async syncOrderOption(sourceConn, targetConn) {
    logger.info('开始同步 order_option 表...');

    const [options] = await sourceConn.query(`
      SELECT * FROM ${this.sourceDbName}.order_option
    `);

    logger.info(`从源数据库读取到 ${options.length} 条订单选项数据`);

    if (options.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < options.length; i += batchSize) {
        const batch = options.slice(i, i + batchSize);
        const values = batch.map(option => [
        option.order_option_id,
        option.order_id,
        option.order_product_id,
        option.product_option_id,
          option.product_option_value_id || 0,
        option.name,
        option.value,
          option.type || 'select' // {{ AURA-X: 4x版本新增字段 }}
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.order_option (
          order_option_id, order_id, order_product_id, product_option_id,
          product_option_value_id, name, value, type
        ) VALUES ?
      `, [values]);

        logger.info(`order_option 表批次 ${Math.floor(i/batchSize) + 1} 同步完成`);
      }
    }

      logger.info('order_option 表同步完成');
    }

  /**
   * 同步订单代金券表
   */
  async syncOrderVoucher(sourceConn, targetConn) {
    logger.info('开始同步 order_voucher 表...');

    const [vouchers] = await sourceConn.query(`
      SELECT * FROM ${this.sourceDbName}.order_voucher
    `);

    logger.info(`从源数据库读取到 ${vouchers.length} 条订单代金券数据`);

    if (vouchers.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < vouchers.length; i += batchSize) {
        const batch = vouchers.slice(i, i + batchSize);
        const values = batch.map(voucher => [
        voucher.order_voucher_id,
        voucher.order_id,
        voucher.voucher_id,
        voucher.description,
        voucher.code,
        voucher.from_name,
        voucher.from_email,
        voucher.to_name,
        voucher.to_email,
          voucher.voucher_theme_id || 1,
          voucher.message || '',
        voucher.amount
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.order_voucher (
          order_voucher_id, order_id, voucher_id, description, code,
          from_name, from_email, to_name, to_email, voucher_theme_id,
          message, amount
        ) VALUES ?
      `, [values]);

        logger.info(`order_voucher 表批次 ${Math.floor(i/batchSize) + 1} 同步完成`);
      }
    }

      logger.info('order_voucher 表同步完成');
    }

  /**
   * 同步订单总计表
   */
  async syncOrderTotal(sourceConn, targetConn) {
    logger.info('开始同步 order_total 表...');

    const [totals] = await sourceConn.query(`
      SELECT * FROM ${this.sourceDbName}.order_total
    `);

    logger.info(`从源数据库读取到 ${totals.length} 条订单总计数据`);

    if (totals.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < totals.length; i += batchSize) {
        const batch = totals.slice(i, i + batchSize);
        const values = batch.map(total => [
        total.order_total_id,
        total.order_id,
          total.extension || '', // {{ AURA-X: 4x版本新增字段 }}
        total.code,
        total.title,
        total.value,
        total.sort_order
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.order_total (
          order_total_id, order_id, extension, code, title, value, sort_order
        ) VALUES ?
      `, [values]);

        logger.info(`order_total 表批次 ${Math.floor(i/batchSize) + 1} 同步完成`);
      }
    }

      logger.info('order_total 表同步完成');
    }

  /**
   * 同步订单历史表
   */
  async syncOrderHistory(sourceConn, targetConn) {
    logger.info('开始同步 order_history 表...');

    const [histories] = await sourceConn.query(`
      SELECT * FROM ${this.sourceDbName}.order_history
    `);

    logger.info(`从源数据库读取到 ${histories.length} 条订单历史数据`);

    if (histories.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < histories.length; i += batchSize) {
        const batch = histories.slice(i, i + batchSize);
        const values = batch.map(history => [
        history.order_history_id,
        history.order_id,
        history.order_status_id,
          history.notify || 0,
          history.comment || '',
          history.date_added || new Date().toISOString().slice(0, 19).replace('T', ' ')
      ]);

      await targetConn.query(`
        INSERT INTO tennisranch_4x.order_history (
          order_history_id, order_id, order_status_id, notify, comment, date_added
        ) VALUES ?
      `, [values]);

        logger.info(`order_history 表批次 ${Math.floor(i/batchSize) + 1} 同步完成`);
      }
    }

      logger.info('order_history 表同步完成');
    }

  /**
   * 检查表是否存在
   */
  async checkTableExists(connection, tableName) {
    try {
      const [result] = await connection.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'tennisranch_4x'
        AND table_name = ?
      `, [tableName]);

      return result[0].count > 0;
    } catch (error) {
      logger.error(`检查表 ${tableName} 是否存在时出错:`, error);
      return false;
    }
  }

  /**
   * 安全清空表数据
   */
  async safeTruncateTable(connection, tableName) {
    const exists = await this.checkTableExists(connection, tableName);
    if (exists) {
      // {{ AURA-X: 使用DELETE而不是TRUNCATE，避免自增ID问题 }}
      await connection.query(`DELETE FROM tennisranch_4x.\`${tableName}\``);
      logger.info(`已清空表: ${tableName}`);
    } else {
      logger.info(`表不存在，跳过清空: ${tableName}`);
    }
  }
}

module.exports = new OrderSync();
