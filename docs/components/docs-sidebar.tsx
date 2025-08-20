"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconBook, IconBookmark, IconFileText, IconFolder } from "@tabler/icons-react"
import { useEffect, useRef } from "react"

import { cn } from "../lib/utils"

interface DocsSidebarProps {
  categories: Record<string, any[]>
}

// 为文档类别分配图标
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    "基础架构": IconFolder,
    "基础功能": IconFolder,
    "推荐系统": IconFolder,
    "搜索与广告": IconFolder,
    "商城与营销": IconFolder,
    "大模型应用": IconFolder,
    "高级主题": IconFolder,
    "附录": IconFolder,
  }
  
  return iconMap[category] || IconFolder
}

// 确保链接以 /docs 开头
const ensureDocsPrefix = (slug: string) => {
  if (slug.startsWith('/')) {
    return slug.startsWith('/docs') ? slug : `/docs${slug}`
  }
  return slug.startsWith('docs') ? `/${slug}` : `/docs/${slug}`
}

// 类别名称与目录名称的映射
const categoryToDirectoryMap: Record<string, string> = {
  "基础架构": "1-architecture",
  "基础功能": "2-basic-features",
  "推荐系统": "3-recommendation",
  "搜索与广告": "4-search-ads",
  "商城与营销": "5-commerce-marketing",
  "大模型应用": "6-llm-applications",
  "高级主题": "7-advanced-topics",
  "附录": "appendix"
}

// 从目录名称中提取排序前缀
const extractOrderFromCategory = (category: string): number => {
  const dirName = categoryToDirectoryMap[category] || "";
  const match = dirName.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 99;
}

export function DocsSidebar({ categories }: DocsSidebarProps) {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // 按目录名称中的数字前缀排序类别
  const sortedCategories = Object.keys(categories).sort((a, b) => {
    const orderA = extractOrderFromCategory(a);
    const orderB = extractOrderFromCategory(b);
    return orderA - orderB;
  })

  // 添加滚动支持
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    sidebar.style.overflowY = 'auto';
    sidebar.style.maxHeight = 'calc(100vh - 4rem)';
    sidebar.style.paddingRight = '0.5rem';
  }, []);

  return (
    <div className="w-full" ref={sidebarRef}>
      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const CategoryIcon = getCategoryIcon(category)
          
          return (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-muted-foreground flex items-center gap-2">
                <CategoryIcon className="h-4 w-4" />
                <span>{category}</span>
              </h4>
              <div className="grid grid-flow-row auto-rows-max text-sm">
                {categories[category].map((doc) => {
                  const docHref = ensureDocsPrefix(doc.slug)
                  const isActive = pathname === doc.slug || pathname === docHref
                  
                  return (
                    <Link
                      key={doc.slug}
                      href={docHref}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-accent/50",
                        isActive
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <IconFileText className="h-4 w-4 shrink-0" />
                      <span>{doc.title}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}