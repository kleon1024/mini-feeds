"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "../lib/utils"

interface DocsSidebarProps {
  categories: Record<string, any[]>
}

export function DocsSidebar({ categories }: DocsSidebarProps) {
  const pathname = usePathname()

  // 类别顺序映射
  const categoryOrder: Record<string, number> = {
    "基础架构": 1,
    "核心功能": 2,
    "推荐系统": 3,
    "搜索与广告": 4,
    "商城与营销": 5,
    "大模型应用": 6,
    "高级主题": 7,
    "附录": 8,
  }

  // 按顺序排序类别
  const sortedCategories = Object.keys(categories).sort(
    (a, b) => (categoryOrder[a] || 99) - (categoryOrder[b] || 99)
  )

  return (
    <div className="w-full">
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-2">
            <h4 className="font-medium text-muted-foreground">{category}</h4>
            <div className="grid grid-flow-row auto-rows-max text-sm">
              {categories[category].map((doc) => (
                <Link
                  key={doc.slug}
                  href={doc.slug}
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-2 hover:underline",
                    pathname === doc.slug
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {doc.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}