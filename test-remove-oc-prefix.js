const RemoveOcPrefixService = require('./src/services/RemoveOcPrefixService');
const logger = require('./src/utils/logger');

async function testRemoveOcPrefix() {
    try {
        logger.info('=== 测试去除oc_前缀功能 ===');
        
        const service = new RemoveOcPrefixService();
        
        // 测试获取oc_表名
        logger.info('1. 测试获取oc_表名...');
        const ocTables = await service.getOcTables();
        logger.info(`找到 ${ocTables.length} 个oc_前缀的表`);
        logger.info('前10个表名:', ocTables.slice(0, 10));
        
        // 测试获取需要更新的文件列表
        logger.info('2. 测试获取需要更新的文件列表...');
        const filesToUpdate = service.getCodeFilesToUpdate();
        logger.info(`需要更新 ${filesToUpdate.length} 个文件`);
        logger.info('文件列表:', filesToUpdate);
        
        logger.info('=== 测试完成 ===');
        logger.info('如需执行实际操作，请通过Web界面或调用 service.removeOcPrefix()');
        
    } catch (error) {
        logger.error('测试失败:', error);
    } finally {
        process.exit();
    }
}

testRemoveOcPrefix();
