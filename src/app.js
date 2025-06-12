const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const syncRoutes = require('./routes/sync');
const logger = require('./utils/logger');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/sync', syncRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    logger.error('应用错误', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: err.message
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '未找到请求的资源'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app; 