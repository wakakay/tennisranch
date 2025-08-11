const OrderOptionSync = require('./src/services/OrderOptionSync');
const logger = require('./src/utils/logger');

/**
 * 测试订单选项同步功能
 */
async function testOrderOptionSync() {
  try {
    logger.info('开始测试订单选项同步功能...');
    
    await OrderOptionSync.syncOrderOption();
    
    logger.success('订单选项同步测试完成！');
  } catch (error) {
    logger.error('订单选项同步测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testOrderOptionSync();
