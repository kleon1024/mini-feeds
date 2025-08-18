#!/bin/bash

# 安装依赖
npm install

# 清理.next和.contentlayer目录
rm -rf .next .contentlayer/generated

# 启动开发服务器
npm run dev