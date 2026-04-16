#!/bin/bash

# CloudBase部署脚本
echo "开始部署到腾讯云开发 CloudBase..."

# 构建前端项目
echo "构建前端项目..."
npm run build

# 部署到CloudBase
echo "部署到CloudBase..."
npm run deploy

echo "部署完成！"
