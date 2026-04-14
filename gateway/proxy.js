import fetch from 'node-fetch';

// 本地调试代理实现
class Proxy {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: options.headers || {
          'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        timeout: options.timeout || 30000
      });

      const data = await response.json();

      return {
        status: response.status,
        statusText: response.statusText,
        data
      };
    } catch (error) {
      throw new Error(`代理请求失败: ${error.message}`);
    }
  }

  // 重试机制
  async requestWithRetry(url, options = {}, retries = 3) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        lastError = error;
        console.log(`请求失败，正在重试 (${i + 1}/${retries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw lastError;
  }
}

// 创建代理实例
export function createProxy() {
  return new Proxy();
}
