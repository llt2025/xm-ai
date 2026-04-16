const express = require('express');
const { createLogger } = require('./logger.js');
const { createCache } = require('./cache.js');
const { createProxy } = require('./proxy.js');
const wanxiangService = require('./services/wanxiang.js').default;
const tencent3dService = require('./services/tencent3d.js').default;

const router = express.Router();
const logger = createLogger();
const cache = createCache();
const proxy = createProxy();

// 统一API网关接口
router.post('/generate', async (req, res) => {
  const { type, params } = req.body;
  
  try {
    logger.info('API Gateway: 接收请求', { type, params });
    
    // 检查缓存
    const cacheKey = `generate:${type}:${JSON.stringify(params)}`;
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      logger.info('API Gateway: 命中缓存', { cacheKey });
      return res.json(cachedResult);
    }
    
    let result;
    
    switch (type) {
      case 'image':
        result = await wanxiangService.generateImage(params);
        break;
      case 'multimodal':
        result = await wanxiangService.generateMultimodal(params);
        break;
      case '3d':
        result = await tencent3dService.generate3D(params);
        break;
      default:
        return res.status(400).json({ error: '不支持的生成类型' });
    }
    
    // 缓存结果
    await cache.set(cacheKey, result, 3600); // 缓存1小时
    
    logger.info('API Gateway: 请求成功', { type, result });
    res.json(result);
  } catch (error) {
    logger.error('API Gateway: 请求失败', { type, error: error.message });
    res.status(500).json({ error: '网关处理失败', details: error.message });
  }
});

// 任务查询接口
router.get('/task', async (req, res) => {
  const { taskId, type } = req.query;
  
  try {
    logger.info('API Gateway: 任务查询', { taskId, type });
    
    let result;
    
    switch (type) {
      case 'wanxiang':
        result = await wanxiangService.getTaskStatus(taskId);
        break;
      case 'tencent3d':
        result = await tencent3dService.getTaskStatus(taskId);
        break;
      default:
        return res.status(400).json({ error: '不支持的任务类型' });
    }
    
    logger.info('API Gateway: 任务查询成功', { taskId, type, result });
    res.json(result);
  } catch (error) {
    logger.error('API Gateway: 任务查询失败', { taskId, type, error: error.message });
    res.status(500).json({ error: '任务查询失败', details: error.message });
  }
});

// 本地调试代理接口
router.post('/proxy', async (req, res) => {
  const { target, method, headers, body } = req.body;
  
  try {
    logger.info('API Gateway: 本地调试代理', { target, method });
    
    const result = await proxy.request(target, {
      method,
      headers,
      body
    });
    
    logger.info('API Gateway: 代理请求成功', { target, status: result.status });
    res.json(result);
  } catch (error) {
    logger.error('API Gateway: 代理请求失败', { target, error: error.message });
    res.status(500).json({ error: '代理请求失败', details: error.message });
  }
});

module.exports = {
  default: router
};
