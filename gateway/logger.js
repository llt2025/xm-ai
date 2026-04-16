import * as sls from '@alicloud/sls';

let slsClient = null;

// 初始化SLS客户端
if (process.env.ALIYUN_SLS_ENDPOINT && process.env.ALIYUN_SLS_ACCESS_KEY && process.env.ALIYUN_SLS_SECRET_KEY) {
  slsClient = new sls.Client({
    accessKeyId: process.env.ALIYUN_SLS_ACCESS_KEY,
    secretAccessKey: process.env.ALIYUN_SLS_SECRET_KEY,
    endpoint: process.env.ALIYUN_SLS_ENDPOINT,
    project: process.env.ALIYUN_SLS_PROJECT || 'xm-ai',
    logStore: process.env.ALIYUN_SLS_LOGSTORE || 'api-gateway'
  });
}

// 创建日志记录器
export function createLogger() {
  return {
    info: async (message, data = {}) => {
      const logEntry = {
        timestamp: Date.now(),
        level: 'INFO',
        message,
        data,
        environment: process.env.NODE_ENV || 'development'
      };
      
      console.log('INFO:', message, data);
      
      if (slsClient) {
        try {
          await slsClient.putLogs({
            logItems: [{
              time: Math.floor(Date.now() / 1000),
              contents: Object.entries(logEntry).map(([key, value]) => ({
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
              }))
            }]
          });
        } catch (error) {
          console.error('SLS日志发送失败:', error);
        }
      }
    },
    error: async (message, data = {}) => {
      const logEntry = {
        timestamp: Date.now(),
        level: 'ERROR',
        message,
        data,
        environment: process.env.NODE_ENV || 'development'
      };
      
      console.error('ERROR:', message, data);
      
      if (slsClient) {
        try {
          await slsClient.putLogs({
            logItems: [{
              time: Math.floor(Date.now() / 1000),
              contents: Object.entries(logEntry).map(([key, value]) => ({
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
              }))
            }]
          });
        } catch (error) {
          console.error('SLS日志发送失败:', error);
        }
      }
    }
  };
}
