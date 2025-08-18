'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

// 导入支持的语言列表
const locales = ['en', 'zh'];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    // 获取当前路径
    const currentPath = window.location.pathname;
    
    // 检查路径是否已经包含语言前缀
    const hasLocalePrefix = locales.some(loc => currentPath.startsWith(`/${loc}`));
    
    let newPath;
    if (hasLocalePrefix) {
      // 如果已有语言前缀，替换它
      // 使用正则表达式匹配开头的语言前缀
      newPath = currentPath.replace(/^\/[^/]+/, `/${newLocale}`);
    } else {
      // 如果没有语言前缀，添加新的语言前缀
      // 处理根路径特殊情况
      if (currentPath === '/') {
        newPath = `/${newLocale}`;
      } else {
        // 对于其他路径，添加语言前缀
        newPath = `/${newLocale}${currentPath}`;
      }
    }
    
    console.log(`切换语言: ${locale} -> ${newLocale}, 路径: ${currentPath} -> ${newPath}`);
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">语言</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLocale('zh')} className={locale === 'zh' ? 'bg-accent' : ''}>
          中文
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLocale('en')} className={locale === 'en' ? 'bg-accent' : ''}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}