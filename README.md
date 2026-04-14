# 鞋魔AI - 基于通义万相的鞋款设计工具

## 项目简介
鞋魔AI是一个基于通义万相的鞋款设计工具，允许用户通过文本描述生成鞋款设计。

## 技术栈
- 前端：HTML5, CSS3, JavaScript
- 后端：Node.js, Express
- API：通义万相, 腾讯云智创3D

## 部署步骤

### 1. 准备工作
- 阿里云轻量应用服务器（推荐：2核4G以上）
- Node.js 16.x 或更高版本
- 通义万相 API Key
- 腾讯云 API 密钥（可选，用于3D建模功能）

### 2. 服务器配置
1. 登录阿里云轻量应用服务器
2. 安装Node.js：
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
   apt-get install -y nodejs
   ```
3. 安装Git：
   ```bash
   apt-get install -y git
   ```

### 3. 部署项目
1. 克隆项目：
   ```bash
   git clone <项目仓库地址>
   cd xm-ai
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 配置环境变量：
   ```bash
   # 复制环境变量配置示例
   cp .env.example .env
   # 编辑环境变量文件
   nano .env
   ```
   添加以下内容：
   ```
   # 通义万相 API Key
   DASHSCOPE_API_KEY=your_dashscope_api_key
   
   # 腾讯云 API 密钥（可选）
   TENCENT_SECRET_ID=your_tencent_secret_id
   TENCENT_SECRET_KEY=your_tencent_secret_key
   
   # 阿里云 SLS 配置（可选，用于日志收集）
   ALIYUN_SLS_ENDPOINT=your_sls_endpoint
   ALIYUN_SLS_ACCESS_KEY=your_sls_access_key
   ALIYUN_SLS_SECRET_KEY=your_sls_secret_key
   ALIYUN_SLS_PROJECT=xm-ai
   ALIYUN_SLS_LOGSTORE=api-gateway
   ```
4. 启动应用：
   ```bash
   npm start
   ```

### 4. 配置防火墙
- 打开服务器防火墙，允许3000端口访问

### 5. 访问应用
在浏览器中访问：`http://<服务器IP>:3000`

## 项目结构
```
xm-ai/
├── api/             # 旧API处理函数（保留兼容）
│   ├── proxy.js     # 通义万相代理
│   ├── wanxiang.js  # 万相图片生成
│   ├── wanxiang-task.js # 万相任务查询
│   └── tencent3d.js # 腾讯云3D建模
├── gateway/         # 统一API网关层
│   ├── index.js     # 网关主入口
│   ├── logger.js    # 日志收集（集成SLS）
│   ├── cache.js     # 本地缓存
│   ├── proxy.js     # 本地调试代理
│   └── services/    # 服务封装
│       ├── wanxiang.js    # 万象API封装
│       └── tencent3d.js   # 腾讯云3D API封装
├── index.html       # 前端页面
├── server.js        # Express服务器
├── package.json     # 项目配置
├── start.sh         # 启动脚本
└── .env.example     # 环境变量配置示例
```

## API网关使用说明

### 统一生成接口
- **POST** `/api/gateway/generate`
- **参数**:
  ```json
  {
    "type": "image", // 生成类型：image, multimodal, 3d
    "params": { /* 具体参数 */ }
  }
  ```
- **响应**:
  ```json
  {
    "task_id": "...",
    "status": "...",
    "result": "..."
  }
  ```

### 任务查询接口
- **GET** `/api/gateway/task`
- **参数**:
  - `taskId`: 任务ID
  - `type`: 任务类型：wanxiang, tencent3d
- **响应**:
  ```json
  {
    "task_id": "...",
    "status": "...",
    "result": "..."
  }
  ```

### 本地调试代理接口
- **POST** `/api/gateway/proxy`
- **参数**:
  ```json
  {
    "target": "https://api.example.com",
    "method": "POST",
    "headers": { /* 请求头 */ },
    "body": { /* 请求体 */ }
  }
  ```
- **响应**:
  ```json
  {
    "status": 200,
    "statusText": "OK",
    "data": { /* 响应数据 */ }
  }
  ```

## 注意事项
- 确保服务器有足够的内存和CPU资源
- 定期更新依赖包
- 监控应用运行状态
