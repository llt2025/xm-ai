const fetch = require('node-fetch');

class WanxiangService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  }

  async generateImage(params) {
    if (!this.apiKey) {
      throw new Error('未配置DASHSCOPE_API_KEY');
    }

    const url = `${this.baseUrl}/services/aigc/image-generation/generation`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-DashScope-Async': 'enable'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`万象API错误: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async generateMultimodal(params) {
    if (!this.apiKey) {
      throw new Error('未配置DASHSCOPE_API_KEY');
    }

    const url = `${this.baseUrl}/services/aigc/multimodal-generation/generation`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-DashScope-Async': 'enable'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`万象API错误: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async getTaskStatus(taskId) {
    if (!this.apiKey) {
      throw new Error('未配置DASHSCOPE_API_KEY');
    }

    const url = `${this.baseUrl}/tasks/${taskId}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`万象任务查询错误: ${response.status} ${errorText}`);
    }

    return await response.json();
  }
}

module.exports = {
  default: new WanxiangService()
};
