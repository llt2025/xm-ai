const fetch = require('node-fetch');

async function handler(req, res) {
  // 1. 基础校验保持不变
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  
  // 处理图片下载请求
  if (req.query.action === 'download' && req.query.url) {
    return handleImageDownload(req, res);
  }
  
  // 处理图片代理请求（解决跨域问题）
  if (req.query.action === 'proxy' && req.query.url) {
    return handleImageProxy(req, res);
  }
  
  const taskId = req.query.taskId || req.query.task_id;
  if (!taskId) {
    return res.status(400).json({ error: "Missing taskId query parameter." });
  }

  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    console.log('DASHSCOPE_API_KEY:', apiKey ? '已配置' : '未配置');
    if (!apiKey) return res.status(500).json({ error: '未配置 DASHSCOPE_API_KEY' });

    // 2. 发起请求获取任务状态
    const apiUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    console.log('查询任务状态:', apiUrl);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });
    
    console.log('响应状态:', response.status);
    const data = await response.json();
    console.log('响应数据:', data);

    let finalStatus = data.output?.task_status ? String(data.output.task_status).toUpperCase() : 'UNKNOWN';
    let resultMessage = data.output?.message || 'No specific message provided.';
    
    // 3. 提取图片数据（100%适配 wan2.7-image 最新返回结构）
    const images = [];
    if (finalStatus === 'SUCCEEDED') {
        let items = [];
        if (data.output?.choices) {
            items = data.output.choices;
            console.log('使用choices数组，长度:', items.length);
            console.log('第一个choice完整结构:', JSON.stringify(items[0], null, 2));
        } else {
            console.log('未找到choices数组');
            console.log('output完整结构:', JSON.stringify(data.output, null, 2));
        }
        
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            let imageUrl = '';
            let imageType = '';
            
            // === 唯一正确的字段：image（不是image_url！）===
            if (item.message?.content?.[0]?.type === 'image' && item.message.content[0].image) {
                const originalImageUrl = item.message.content[0].image;
                console.log('✅ 找到wan2.7-image图片URL:', originalImageUrl);
                
                // 使用后端代理方式处理图片，解决跨域问题
                imageUrl = `/api/wanxiang-task?action=proxy&url=${encodeURIComponent(originalImageUrl)}`;
                imageType = 'proxy';
                console.log('✅ 图片代理链接:', imageUrl);
            }
            
            if (imageUrl) {
                images.push({
                    id: index + 1,
                    url: imageUrl,
                    type: imageType
                });
            }
        }
        resultMessage = `Successfully retrieved ${images.length} image(s).`;
        console.log('✅ 最终返回的图片数组:', JSON.stringify(images, null, 2));
    } else if (finalStatus === 'FAILED') {
        resultMessage = data.output?.message || "Processing failed. Please check the details.";
    } else if (finalStatus === 'RUNNING') {
        resultMessage = "Still processing.";
    } else if (finalStatus === 'UNKNOWN') {
        resultMessage = "Unknown status received from the service.";
    }

    // 4. 返回结构化数据
    return res.status(200).json({
        taskId: taskId,
        status: finalStatus,
        message: resultMessage,
        images: images,
        imageCount: images.length,
        output: data.output
    });

  } catch (error) {
    console.error("API Processing Error:", error);
    // 5. 捕获所有运行时错误并返回给前端
    return res.status(500).json({ 
        error: "Internal Server Error", 
        details: error.message || "An unknown server error occurred while processing the request."
    });
  }
}

// 处理图片下载请求
async function handleImageDownload(req, res) {
  try {
    const imageUrl = req.query.url;
    const apiKey = process.env.DASHSCOPE_API_KEY;
    
    console.log('处理图片下载请求:', imageUrl);
    
    if (!apiKey) {
      return res.status(500).json({ error: '未配置 DASHSCOPE_API_KEY' });
    }
    
    // 下载图片，添加认证头
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000 // 30秒超时
    });
    
    console.log('图片下载状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`图片下载失败: ${response.status}, 响应: ${errorText}`);
    }
    
    // 获取图片数据
    const buffer = await response.arrayBuffer();
    console.log('下载到的图片大小:', buffer.byteLength);
    
    // 设置响应头并返回图片
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/png');
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent('image.png')}"`);
    
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('图片下载处理失败:', error);
    return res.status(500).json({ 
        error: "Image Download Error", 
        details: error.message || "An unknown error occurred while downloading the image."
    });
  }
}

// 处理图片代理请求（解决跨域问题）
async function handleImageProxy(req, res) {
  try {
    const imageUrl = req.query.url;
    const apiKey = process.env.DASHSCOPE_API_KEY;
    
    console.log('处理图片代理请求:', imageUrl);
    
    if (!apiKey) {
      return res.status(500).json({ error: '未配置 DASHSCOPE_API_KEY' });
    }
    
    // 下载图片，添加认证头
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000 // 30秒超时
    });
    
    console.log('图片代理状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`图片代理失败: ${response.status}, 响应: ${errorText}`);
    }
    
    // 获取图片数据
    const buffer = await response.arrayBuffer();
    console.log('代理的图片大小:', buffer.byteLength);
    
    // 设置响应头并返回图片，添加 CORS 头
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/png');
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('图片代理处理失败:', error);
    return res.status(500).json({ 
        error: "Image Proxy Error", 
        details: error.message || "An unknown error occurred while proxying the image."
    });
  }
}

module.exports = {
  default: handler
};
