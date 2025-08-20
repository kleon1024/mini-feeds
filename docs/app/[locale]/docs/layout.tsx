import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getDocsByCategory } from "../../../lib/mdx"
import { useTranslations } from 'next-intl';

import { DocsSidebar } from "../../../components/docs-sidebar"
import { ThemeToggle } from "../../../components/theme-toggle"
import LanguageSwitcher from "../../../components/language-switcher";

interface DocsLayoutProps {
  children: React.ReactNode
  params: {
    locale: string;
  }
}

export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  // 获取所有文档并按类别分组
  const categories = await getDocsByCategory()

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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Mini Feeds</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>
      <div className="container flex-1">
        <div className="flex-1 md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
            <div className="h-full py-6 pr-2 pl-8 lg:py-8">
              <DocsSidebar categories={categories} />
            </div>
          </aside>
          <main className="relative py-6 lg:gap-10 lg:py-8">
            <div className="mx-auto w-full min-w-0">
              <div className="pb-12">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}