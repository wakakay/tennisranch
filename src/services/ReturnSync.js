const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class ReturnSync {
    /**
     * 同步退货主表
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncReturn(sourceConn, targetConn) {
        logger.info('开始同步退货主表...');
        // 清空目标表
        await targetConn.query('TRUNCATE TABLE oc_return');
        // 获取源数据
        const [rows] = await sourceConn.query('SELECT * FROM `return`');
        // 批量插入
        if (rows.length > 0) {
            const fields = Object.keys(rows[0]);
            const values = rows.map(row => fields.map(f => row[f]));
            await targetConn.query(
                `INSERT INTO oc_return (${fields.join(',')}) VALUES ?`,
                [values]
            );
            logger.info(`成功同步 ${rows.length} 条退货数据`);
        } else {
            logger.info('源库无退货数据');
        }
    }

    /**
     * 同步退货操作表
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncReturnAction(sourceConn, targetConn) {
        logger.info('开始同步退货操作表...');
        await targetConn.query('TRUNCATE TABLE oc_return_action');
        const [rows] = await sourceConn.query('SELECT * FROM `return_action`');
        if (rows.length > 0) {
            const fields = Object.keys(rows[0]);
            const values = rows.map(row => fields.map(f => row[f]));
            await targetConn.query(
                `INSERT INTO oc_return_action (${fields.join(',')}) VALUES ?`,
                [values]
            );
            logger.info(`成功同步 ${rows.length} 条退货操作数据`);
        } else {
            logger.info('源库无退货操作数据');
        }
    }

    /**
     * 同步退货历史表
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncReturnHistory(sourceConn, targetConn) {
        logger.info('开始同步退货历史表...');
        await targetConn.query('TRUNCATE TABLE oc_return_history');
        const [rows] = await sourceConn.query('SELECT * FROM `return_history`');
        if (rows.length > 0) {
            const fields = Object.keys(rows[0]);
            const values = rows.map(row => fields.map(f => row[f]));
            await targetConn.query(
                `INSERT INTO oc_return_history (${fields.join(',')}) VALUES ?`,
                [values]
            );
            logger.info(`成功同步 ${rows.length} 条退货历史数据`);
        } else {
            logger.info('源库无退货历史数据');
        }
    }

    /**
     * 同步退货原因表
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncReturnReason(sourceConn, targetConn) {
        logger.info('开始同步退货原因表...');
        await targetConn.query('TRUNCATE TABLE oc_return_reason');
        const [rows] = await sourceConn.query('SELECT * FROM `return_reason`');
        if (rows.length > 0) {
            const fields = Object.keys(rows[0]);
            const values = rows.map(row => fields.map(f => row[f]));
            await targetConn.query(
                `INSERT INTO oc_return_reason (${fields.join(',')}) VALUES ?`,
                [values]
            );
            logger.info(`成功同步 ${rows.length} 条退货原因数据`);
        } else {
            logger.info('源库无退货原因数据');
        }
    }

    /**
     * 同步退货状态表
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncReturnStatus(sourceConn, targetConn) {
        logger.info('开始同步退货状态表...');
        await targetConn.query('TRUNCATE TABLE oc_return_status');
        const [rows] = await sourceConn.query('SELECT * FROM `return_status`');
        if (rows.length > 0) {
            const fields = Object.keys(rows[0]);
            const values = rows.map(row => fields.map(f => row[f]));
            await targetConn.query(
                `INSERT INTO oc_return_status (${fields.join(',')}) VALUES ?`,
                [values]
            );
            logger.info(`成功同步 ${rows.length} 条退货状态数据`);
        } else {
            logger.info('源库无退货状态数据');
        }
    }

    /**
     * 同步所有退货相关表
     * @param {mysql.Connection} sourceConn - 源数据库连接
     * @param {mysql.Connection} targetConn - 目标数据库连接
     * @returns {Promise<void>}
     */
    static async syncAll(sourceConn, targetConn) {
        try {
            await this.syncReturn(sourceConn, targetConn);
            await this.syncReturnAction(sourceConn, targetConn);
            await this.syncReturnHistory(sourceConn, targetConn);
            await this.syncReturnReason(sourceConn, targetConn);
            await this.syncReturnStatus(sourceConn, targetConn);
            logger.success('所有退货数据同步完成');
        } catch (error) {
            logger.error('同步退货数据时发生错误', error);
            throw error;
        }
    }
}

module.exports = ReturnSync; 