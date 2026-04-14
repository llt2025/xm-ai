import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 配置CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-DashScope-Async']
}));

// 解析JSON请求体
app.use(express.json());

// 导入API处理函数
import proxyHandler from './api/proxy.js';
import wanxiangHandler from './api/wanxiang.js';
import wanxiangTaskHandler from './api/wanxiang-task.js';
import tencent3dHandler from './api/tencent3d.js';

// 导入API网关
import gatewayRouter from './gateway/index.js';

// API路由
app.post('/api/proxy', proxyHandler);
app.post('/api/wanxiang', wanxiangHandler);
app.get('/api/wanxiang-task', wanxiangTaskHandler);
app.post('/api/tencent3d', tencent3dHandler);

// API网关路由
app.use('/api/gateway', gatewayRouter);

// 提供静态文件服务
app.use(express.static(__dirname));

// 处理所有其他路由，返回index.html（用于单页应用）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
