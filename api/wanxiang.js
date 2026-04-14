import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: '只支持 POST' });

  const apiKey = process.env.DASHSCOPE_API_KEY;
  console.log('DASHSCOPE_API_KEY:', apiKey ? '已配置' : '未配置');
  if (!apiKey) return res.status(500).json({ error: '未配置 DASHSCOPE_API_KEY' });

  // === 推荐用于 wan2.7-image 的异步端点（北京地域）===
  const targetUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation';

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable'   // 必须保留异步，否则报错
    };

    console.log('提交请求到:', targetUrl);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });

    console.log('响应状态:', response.status);
    const data = await response.text();
    console.log('响应数据:', data);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(data);
  } catch (error) {
    console.error('wanxiang error:', error);
    res.status(500).json({ error: '代理请求失败', details: error.message });
  }
}