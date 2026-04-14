import fetch from 'node-fetch';
import crypto from 'crypto';

class Tencent3dService {
  constructor() {
    this.secretId = process.env.TENCENT_SECRET_ID;
    this.secretKey = process.env.TENCENT_SECRET_KEY;
    this.endpoint = 'ai3d.tencentcloudapi.com';
    this.region = 'ap-guangzhou';
  }

  async generate3D(params) {
    if (!this.secretId || !this.secretKey) {
      throw new Error('未配置腾讯云密钥');
    }

    const { imageUrl, version = 'rapid' } = params;
    if (!imageUrl) {
      throw new Error('缺少imageUrl参数');
    }

    const config = {
      endpoint: this.endpoint,
      region: this.region,
      action: version === 'pro' ? 'SubmitHunyuanTo3DProJob' : 'SubmitHunyuanTo3DRapidJob',
      version: '2025-05-13',
      service: 'ai3d'
    };

    // 构建请求体
    let requestBody = {};
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      requestBody.ImageBase64 = base64Data;
    } else {
      requestBody.ImageUrl = imageUrl;
    }

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000000);
    const signature = this.generateSignature(config, timestamp, nonce, requestBody);

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
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`腾讯云API错误: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (data.Response && data.Response.Error) {
      throw new Error(`腾讯云API错误: ${data.Response.Error.Code} ${data.Response.Error.Message}`);
    }

    return data.Response || data;
  }

  async getTaskStatus(taskId) {
    // 腾讯云智创3D的任务查询API实现
    // 具体实现需要参考腾讯云API文档
    throw new Error('任务查询功能暂未实现');
  }

  // 生成腾讯云API签名
  generateSignature(config, timestamp, nonce, requestBody) {
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json\nhost:${config.endpoint}\n`;
    const signedHeaders = 'content-type;host';
    const payload = JSON.stringify(requestBody);
    const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');

    const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const credentialScope = `${date}/${config.service}/tc3_request`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

    const kDate = crypto.createHmac('sha256', `TC3${this.secretKey}`).update(date).digest();
    const kService = crypto.createHmac('sha256', kDate).update(config.service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest();

    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `TC3-HMAC-SHA256 Credential=${this.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }
}

export default new Tencent3dService();
