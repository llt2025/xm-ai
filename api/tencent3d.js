export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: '只支持 POST' });

  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  
  console.log('TENCENT_SECRET_ID:', secretId ? '已配置' : '未配置');
  console.log('TENCENT_SECRET_KEY:', secretKey ? '已配置' : '未配置');
  
  if (!secretId || !secretKey) {
    return res.status(500).json({ error: '未配置腾讯云密钥' });
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: '缺少imageUrl参数' });
  }

  // 腾讯云智创3D API配置
  const config = {
    endpoint: 'api.cloud.tencent.com',
    region: 'ap-guangzhou',
    action: 'Create3DModel',
    version: '2024-01-01',
    service: 'ai'
  };

  try {
    // 构建请求参数
    const params = {
      SecretId: secretId,
      Action: config.action,
      Version: config.version,
      Region: config.region,
      ImageUrl: imageUrl,
      Timestamp: Math.floor(Date.now() / 1000),
      Nonce: Math.floor(Math.random() * 1000000000)
    };

    // 生成签名
    const signature = await generateSignature(params, secretKey, config);
    params.Signature = signature;

    // 构建请求URL
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `https://${config.endpoint}/?${queryString}`;
    console.log('腾讯云API请求URL:', url);

    // 发送请求
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status);
    const data = await response.json();
    console.log('响应数据:', data);

    // 处理响应
    if (data.Response && data.Response.Error) {
      return res.status(500).json({ error: data.Response.Error.Message });
    }

    // 返回腾讯云的响应结果
    res.status(200).json(data.Response || data);

  } catch (error) {
    console.error('tencent3d error:', error);
    res.status(500).json({ error: '代理请求失败', details: error.message });
  }
}

// 生成腾讯云API 3.0签名
async function generateSignature(params, secretKey, config) {
  // 1. 对参数按字典序排序
  const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
    obj[key] = params[key];
    return obj;
  }, {});

  // 2. 构建签名字符串
  const signStr = `GET${config.endpoint}/?` + 
    Object.entries(sortedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

  console.log('签名字符串:', signStr);

  // 3. 使用HMAC-SHA1算法计算签名
  const crypto = await import('crypto');
  const hmac = crypto.default.createHmac('sha1', secretKey);
  hmac.update(signStr);
  const signature = hmac.digest('base64');

  return signature;
}
