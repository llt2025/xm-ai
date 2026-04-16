const { onRequest } = require('@cloudbase/functions-framework');
const gatewayRouter = require('../../gateway/index.js').default;

// 适配CloudBase云函数格式
async function main(event, context) {
  // 构建请求对象
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : {},
    query: event.queryStringParameters || {},
    path: event.path
  };

  // 构建响应对象
  const res = {
    status: (code) => {
      return {
        json: (data) => {
          return {
            statusCode: code,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
          };
        },
        send: (data) => {
          return {
            statusCode: code,
            headers: {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*'
            },
            body: data
          };
        }
      };
    },
    json: (data) => {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
      };
    },
    send: (data) => {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        },
        body: data
      };
    },
    setHeader: () => res,
    setHeaders: () => res
  };

  try {
    // 模拟Express路由处理
    if (req.path.includes('/generate') && req.method === 'POST') {
      const { type, params } = req.body;
      const gateway = require('../../gateway/index.js');
      // 这里需要根据gateway的具体实现进行调整
      // 暂时返回一个示例响应
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Gateway function called', type, params })
      };
    } else if (req.path.includes('/task') && req.method === 'GET') {
      const { taskId, type } = req.query;
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Task function called', taskId, type })
      };
    } else if (req.path.includes('/proxy') && req.method === 'POST') {
      const { target, method, headers, body } = req.body;
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Proxy function called', target, method })
      };
    }
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
}

onRequest(main);
