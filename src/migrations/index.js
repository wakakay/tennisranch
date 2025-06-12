const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 测试数据库连接
 * @param {mysql.Pool} pool - 数据库连接池
 * @param {string} name - 数据库名称
 * @returns {Promise<void>}
 */
async function testConnection(pool, name) {
  try {
    const connection = await pool.getConnection();
    logger.success(`成功连接到数据库: ${name}`);
    connection.release();
  } catch (error) {
    logger.error(`连接数据库失败: ${name}`, error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('开始测试数据库连接...');
    
    // 测试源数据库连接
    await testConnection(sourcePool, 'tennisranch_2x_t');
    
    // 测试目标数据库连接
    await testConnection(targetPool, 'tennisranch_4x');
    
    logger.success('所有数据库连接测试完成！');
  } catch (error) {
    logger.error('数据库连接测试失败', error);
    process.exit(1);
  } finally {
    // 关闭所有连接池
    await sourcePool.end();
    await targetPool.end();
  }
}

// 运行主函数
main(); 