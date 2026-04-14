import crypto from 'crypto';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('=== 腾讯云智创3D API 调用开始 ===');
  
  if (req.method !== 'POST') {
    console.error('请求方法错误:', req.method);
    return res.status(405).json({ error: '只支持 POST' });
  }

  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  
  console.log('TENCENT_SECRET_ID:', secretId ? '已配置' : '未配置');
  console.log('TENCENT_SECRET_KEY:', secretKey ? '已配置' : '未配置');
  
  if (!secretId || !secretKey) {
    console.error('腾讯云密钥未配置');
    return res.status(500).json({ error: '未配置腾讯云密钥' });
  }

  console.log('请求体:', req.body);
  const { imageUrl, version = 'rapid' } = req.body; // 默认使用极速版
  if (!imageUrl) {
    console.error('缺少imageUrl参数');
    return res.status(400).json({ error: '缺少imageUrl参数' });
  }
  console.log('图片URL:', imageUrl);
  console.log('API版本:', version);

  // 腾讯云智创3D API配置（2026年最新）
  const config = {
    endpoint: 'ai3d.tencentcloudapi.com',
    region: 'ap-guangzhou',
    action: version === 'pro' ? 'SubmitHunyuanTo3DProJob' : 'SubmitHunyuanTo3DRapidJob',
    version: '2025-05-13',
    service: 'ai3d'
  };
  console.log('API配置:', config);

  try {
    // 构建请求体
    let requestBody = {};
    
    // 检查是否为base64格式的图片
    if (imageUrl.startsWith('data:image')) {
      // 提取base64数据（去掉data:image/xxx;base64,前缀）
      const base64Data = imageUrl.split(',')[1];
      requestBody.ImageBase64 = base64Data;
      console.log('使用ImageBase64参数（base64图片）');
    } else {
      // 普通URL
      requestBody.ImageUrl = imageUrl;
      console.log('使用ImageUrl参数（普通URL）');
    }
    console.log('构建请求体:', requestBody);

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000000);
    console.log('生成签名参数 - timestamp:', timestamp, 'nonce:', nonce);
    
    const signature = generateSignature(secretId, secretKey, config, timestamp, nonce, requestBody);
    console.log('签名生成成功:', signature.substring(0, 50) + '...');

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
    console.log('构建请求头:', {
      ...headers,
      'Authorization': headers.Authorization.substring(0, 50) + '...'
    });

    const url = `https://${config.endpoint}`;
    console.log('腾讯云API请求URL:', url);

    // 发送请求
    console.log('开始发送请求...');
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('响应文本:', text);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('JSON解析成功:', data);
    } catch (e) {
      console.error('腾讯云返回非JSON格式:', text);
      console.error('JSON解析错误:', e);
      throw new Error(`腾讯云API错误: ${response.status} ${text.substring(0, 200)}`);
    }
    
    // 检查是否有JobId
    const jobId = data.Response?.JobId;
    if (jobId) {
      console.log('任务提交成功，JobId:', jobId);
    }

    // 处理响应
    if (!response.ok || (data.Response && data.Response.Error)) {
      const errorCode = data.Response?.Error?.Code;
      const errorMessage = data.Response?.Error?.Message || `HTTP错误: ${response.status}`;
      console.error('腾讯云API错误 - 状态码:', response.status, '错误码:', errorCode, '错误信息:', errorMessage);
      return res.status(500).json({ 
        error: errorMessage,
        code: errorCode,
        status: response.status
      });
    }

    // 返回腾讯云的响应结果
    console.log('API调用成功，返回结果:', data.Response || data);
    res.status(200).json(data.Response || data);

  } catch (error) {
    console.error('tencent3d error:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      error: '代理请求失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    console.log('=== 腾讯云智创3D API 调用结束 ===');
  }
}

// 生成腾讯云API 3.0签名（TC3-HMAC-SHA256）
function generateSignature(secretId, secretKey, config, timestamp, nonce, requestBody) {
  console.log('=== 开始生成腾讯云API签名 ===');
  
  try {
    // 1. 构建规范请求串
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json\nhost:${config.endpoint}\n`;
    const signedHeaders = 'content-type;host';
    const payload = JSON.stringify(requestBody);
    const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
    
    console.log('签名步骤1 - 构建规范请求串:');
    console.log('  HTTP方法:', httpRequestMethod);
    console.log('  规范URI:', canonicalUri);
    console.log('  规范查询字符串:', canonicalQueryString);
    console.log('  规范头部:', canonicalHeaders.trim());
    console.log('  签名头部:', signedHeaders);
    console.log('  载荷哈希:', hashedPayload);
    
    const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
    console.log('  规范请求串:', canonicalRequest);
    
    // 2. 构建签名串
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const credentialScope = `${date}/${config.service}/tc3_request`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
    
    console.log('签名步骤2 - 构建签名串:');
    console.log('  日期:', date);
    console.log('  凭证范围:', credentialScope);
    console.log('  规范请求串哈希:', hashedCanonicalRequest);
    console.log('  待签名字符串:', stringToSign);
    
    // 3. 计算签名
    console.log('签名步骤3 - 计算签名:');
    const kDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
    console.log('  kDate:', kDate.toString('hex'));
    
    const kService = crypto.createHmac('sha256', kDate).update(config.service).digest();
    console.log('  kService:', kService.toString('hex'));
    
    const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest();
    console.log('  kSigning:', kSigning.toString('hex'));
    
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    console.log('  签名:', signature);
    
    // 4. 构建Authorization头
    const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    console.log('签名步骤4 - 构建Authorization头:');
    console.log('  Authorization:', authorization.substring(0, 100) + '...');
    
    console.log('=== 签名生成完成 ===');
    return authorization;
  } catch (error) {
    console.error('签名生成失败:', error);
    throw error;
  }
}
