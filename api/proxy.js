// api/proxy.js —— CommonJS 格式
const fetch = require('node-fetch');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const body = req.body;
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

    if (!DASHSCOPE_API_KEY) {
      return res.status(500).json({ error: 'API Key 未配置' });
    }

    // === 修改为北京地域 + 万相推荐端点 ===
    const targetUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/json');
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: '代理请求失败', details: error.message });
  }
}

module.exports = {
  default: handler
};