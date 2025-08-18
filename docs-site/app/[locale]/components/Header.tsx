'use client';

import Link from "next/link";
import { Button } from "../../../components/ui/button";
import LanguageSwitcher from "../../../components/language-switcher";
import { ThemeToggle } from "../../../components/theme-toggle";

type HeaderProps = {
  translations: {
    docs: string;
    faq: string;
    [key: string]: string;
  };
  navTranslations: {
    browseDocs: string;
    [key: string]: string;
  };
};

export default function Header({ translations, navTranslations }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl">Mini Feeds</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/docs/1-architecture/overview" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {translations.docs}
            </Link>
            <Link href="/docs/appendix/index" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {translations.faq}
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/docs/1-architecture/overview" className="hidden md:block">
            <Button variant="outline">{navTranslations.browseDocs}</Button>
          </Link>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}