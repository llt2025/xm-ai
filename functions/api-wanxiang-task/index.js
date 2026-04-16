const { onRequest } = require('@cloudbase/functions-framework');
const wanxiangTaskHandler = require('../../api/wanxiang-task.js').default;

// 适配CloudBase云函数格式
async function main(event, context) {
  // 构建请求对象
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : {},
    query: event.queryStringParameters || {}
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
    return await wanxiangTaskHandler(req, res);
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
