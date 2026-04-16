// 创建日志记录器
export function createLogger() {
  return {
    info: async (message, data = {}) => {
      console.log('INFO:', message, data);
    },
    error: async (message, data = {}) => {
      console.error('ERROR:', message, data);
    }
  };
}
