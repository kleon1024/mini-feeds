# Mini-Feeds 文档站点

这是基于Next.js和shadcn/ui构建的Mini-Feeds项目文档站点，提供了丰富的交互式文档体验。

## 特性

- **现代化技术栈**：使用Next.js 15、React 19和TypeScript构建
- **美观的UI**：基于shadcn/ui组件，支持暗/亮主题切换
- **MDX支持**：在Markdown中直接使用React组件
- **内容管理**：使用Contentlayer管理文档内容
- **代码高亮**：使用rehype-pretty-code提供美观的代码高亮
- **响应式设计**：适配各种屏幕尺寸

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

或者使用脚本：

```bash
./start_docs.sh
```

访问 [http://localhost:3000](http://localhost:3000) 查看文档站点。

### 构建生产版本

```bash
npm run build
```

## 添加文档

在`content`目录下创建新的MDX文件，按照以下格式添加前置元数据：

```mdx
---
title: 文档标题
description: 文档描述
date: 2023-04-01
published: true
category: 分类名称
order: 1
---

# 内容标题

这里是文档内容...
```

## 在MDX中使用组件

你可以在MDX文件中直接使用shadcn/ui组件：

```mdx
<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述</CardDescription>
  </CardHeader>
  <CardContent>
    卡片内容
  </CardContent>
</Card>
```

## 自定义组件

在`components/mdx-components.tsx`文件中添加新的组件，然后就可以在MDX中使用它们。

## 目录结构

```
/app               # Next.js应用目录
  /docs            # 文档页面
  /globals.css     # 全局样式
  /layout.tsx      # 根布局
  /page.tsx        # 首页
/components        # React组件
  /ui              # UI组件
  /mdx-components.tsx # MDX组件
/content           # 文档内容
/lib               # 工具函数
/public            # 静态资源
```

## 许可证

MIT