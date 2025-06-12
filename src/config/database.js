const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

/**
 * 源数据库配置
 */
const sourceConfig = {
  host: '8.219.238.63',
  port: 3306,
  user: 'tennisranch_2x_t',
  password: 'YwxAa4Pb7jWd5jGe',
  database: 'tennisranch_2x_t',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * 目标数据库配置
 */
const targetConfig = {
  host: '8.219.238.63',
  port: 3306,
  user: 'tennisranch_4x',
  password: 'YwxAa4Pb7jWd5jGe',
  database: 'tennisranch_4x',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * 创建数据库连接池
 * @param {Object} config - 数据库配置
 * @returns {Promise<mysql.Pool>} 数据库连接池
 */
const createPool = (config) => {
  return mysql.createPool(config);
};

/**
 * 源数据库连接池
 */
const sourcePool = createPool(sourceConfig);

/**
 * 目标数据库连接池
 */
const targetPool = createPool(targetConfig);

// 测试数据库连接
async function testConnection() {
  let sourceConn;
  let targetConn;
  
  try {
    // 测试源数据库连接
    sourceConn = await sourcePool.getConnection();
    await sourceConn.query('SELECT 1');
    logger.info('源数据库连接成功');
    
    // 测试目标数据库连接
    targetConn = await targetPool.getConnection();
    await targetConn.query('SELECT 1');
    logger.info('目标数据库连接成功');
    
  } catch (error) {
    logger.error('数据库连接测试失败:', error);
    throw error;
  } finally {
    if (sourceConn) sourceConn.release();
    if (targetConn) targetConn.release();
  }
}

module.exports = {
  sourcePool,
  targetPool,
  testConnection
}; 