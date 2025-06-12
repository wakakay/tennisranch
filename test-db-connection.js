const { sourcePool, targetPool } = require('./src/config/database');
const logger = require('./src/utils/logger');

async function testConnections() {
    let sourceConn;
    let targetConn;

    try {
        // 测试源数据库连接
        logger.info('正在测试源数据库连接...');
        sourceConn = await sourcePool.getConnection();
        const [sourceResult] = await sourceConn.query('SELECT DATABASE() as db');
        logger.success(`源数据库连接成功！当前数据库: ${sourceResult[0].db}`);

        // 测试目标数据库连接
        logger.info('正在测试目标数据库连接...');
        targetConn = await targetPool.getConnection();
        const [targetResult] = await targetConn.query('SELECT DATABASE() as db');
        logger.success(`目标数据库连接成功！当前数据库: ${targetResult[0].db}`);

        // 测试源数据库表
        logger.info('正在检查源数据库表...');
        const [sourceTables] = await sourceConn.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '${sourceResult[0].db}'
            AND table_name IN ('tax_class', 'tax_rate', 'tax_rate_to_customer_group', 'tax_rule')
        `);
        logger.info('源数据库表检查结果:', sourceTables);

        // 测试目标数据库表
        logger.info('正在检查目标数据库表...');
        const [targetTables] = await targetConn.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '${targetResult[0].db}'
            AND table_name IN ('oc_tax_class', 'oc_tax_rate', 'oc_tax_rate_to_customer_group', 'oc_tax_rule')
        `);
        logger.info('目标数据库表检查结果:', targetTables);

    } catch (error) {
        logger.error('数据库连接测试失败:', error);
    } finally {
        if (sourceConn) sourceConn.release();
        if (targetConn) targetConn.release();
        process.exit();
    }
}

testConnections(); 