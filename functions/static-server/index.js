const { onRequest } = require('@cloudbase/functions-framework');
const fs = require('fs');
const path = require('path');

// 适配CloudBase云函数格式
async function main(event, context) {
  const req = event;
  const pathname = req.path || '/';
  
  // 处理静态文件请求
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, '../../dist', filePath);
  
  try {
    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 根据文件扩展名设置Content-Type
      let contentType = 'text/html';
      if (filePath.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (filePath.endsWith('.css')) {
        contentType = 'text/css';
      } else if (filePath.endsWith('.json')) {
        contentType = 'application/json';
      } else if (filePath.endsWith('.png')) {
        contentType = 'image/png';
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (filePath.endsWith('.gif')) {
        contentType = 'image/gif';
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        },
        body: content
      };
    } else {
      // 如果文件不存在，返回index.html（用于单页应用）
      const indexPath = path.join(__dirname, '../../dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
          },
          body: indexContent
        };
      } else {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          },
          body: 'File not found'
        };
      }
    }
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
