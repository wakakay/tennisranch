const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch (error) {
        console.error('创建日志目录失败:', error);
    }
}

const logFile = path.join(logDir, 'app.log');

/**
 * 写入日志到文件
 * @param {string} level - 日志级别
 * @param {string} message - 日志信息
 * @param {any} [data] - 额外数据
 */
function writeLog(level, message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${level}] ${timestamp} - ${message}`;
    
    // 控制台输出
    if (level === 'ERROR') {
        console.error(logMessage);
        if (data) {
            console.error(data);
        }
    } else {
        console.log(logMessage);
    }
    
    // 文件输出
    try {
    const fileMessage = data ? 
        `${logMessage}\n${JSON.stringify(data, null, 2)}\n` : 
        `${logMessage}\n`;
    
        // 检查文件权限
        try {
            fs.accessSync(logDir, fs.constants.W_OK);
        } catch (error) {
            console.error('日志目录没有写入权限:', error);
            return;
        }
        
        // 确保文件存在
        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, '');
        }
        
    fs.appendFileSync(logFile, fileMessage);
    } catch (error) {
        console.error('写入日志文件失败:', error);
    }
}

/**
 * 简单的日志工具
 */
const logger = {
    /**
     * 信息日志
     * @param {string} message - 日志信息
     * @param {any} [data] - 额外数据
     */
    info: (message, data) => {
        writeLog('INFO', message, data);
    },

    /**
     * 错误日志
     * @param {string} message - 错误信息
     * @param {any} [error] - 错误对象
     */
    error: (message, error) => {
        writeLog('ERROR', message, error);
    },

    /**
     * 成功日志
     * @param {string} message - 成功信息
     * @param {any} [data] - 额外数据
     */
    success: (message, data) => {
        writeLog('SUCCESS', message, data);
    }
};

module.exports = logger; 