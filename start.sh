#!/bin/bash

# 启动脚本

echo "正在启动鞋魔AI应用..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 启动应用
echo "启动应用服务器..."
npm start
