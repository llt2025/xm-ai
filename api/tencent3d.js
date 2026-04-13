import crypto from 'crypto';

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

  // 腾讯云智创3D API配置（2026年最新）
  const config = {
    endpoint: 'ai3d.tencentcloudapi.com',
    region: 'ap-guangzhou',
    action: 'SubmitHunyuanT3DProJob', // 专业版
    // action: 'SubmitHunyuanT3DRapidJob', // 快速版
    version: '2025-05-13',
    service: 'ai3d'
  };

  try {
    // 构建请求体
    const requestBody = {
      ImageUrl: imageUrl
    };

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000000);
    const signature = generateSignature(secretId, secretKey, config, timestamp, nonce, requestBody);

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'X-TC-Action': config.action,
      'X-TC-Region': config.region,
      'X-TC-Version': config.version,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Nonce': nonce.toString(),
      'Authorization': signature
    };

    const url = `https://${config.endpoint}`;
    console.log('腾讯云API请求URL:', url);
    console.log('请求头:', headers);
    console.log('请求体:', requestBody);

    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    console.log('响应状态:', response.status);
    const text = await response.text();
    console.log('响应文本:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("腾讯云返回非JSON:", text);
      throw new Error(`腾讯云API错误: ${response.status} ${text.substring(0, 200)}`);
    }
    
    console.log('响应数据:', data);

    // 处理响应
    if (!response.ok || (data.Response && data.Response.Error)) {
      const errorMessage = data.Response?.Error?.Message || `HTTP错误: ${response.status}`;
      return res.status(500).json({ error: errorMessage });
    }

    // 返回腾讯云的响应结果
    res.status(200).json(data.Response || data);

  } catch (error) {
    console.error('tencent3d error:', error);
    res.status(500).json({ error: '代理请求失败', details: error.message });
  }
}

// 生成腾讯云API 3.0签名（TC3-HMAC-SHA256）
function generateSignature(secretId, secretKey, config, timestamp, nonce, requestBody) {
  // 1. 构建规范请求串
  const httpRequestMethod = 'POST';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:application/json\nhost:${config.endpoint}\n`;
  const signedHeaders = 'content-type;host';
  const payload = JSON.stringify(requestBody);
  const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  
  // 2. 构建签名串
  const date = new Date(timestamp * 1000).toISOString().split('T')[0];
  const credentialScope = `${date}/${config.service}/tc3_request`;
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  
  // 3. 计算签名
  const kDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const kService = crypto.createHmac('sha256', kDate).update(config.service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  
  // 4. 构建Authorization头
  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return authorization;
}
