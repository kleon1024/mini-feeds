import Link from "next/link";
import { Server } from "lucide-react";

type FooterProps = {
  translations: {
    footer: string;
    docs: string;
    faq: string;
    [key: string]: string;
  };
};

export default function Footer({ translations }: FooterProps) {
  return (
    <footer className="w-full border-t py-6 md:py-0 bg-muted/10">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1 w-8 h-8 flex items-center justify-center">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left font-medium">
            &copy; {new Date().getFullYear()} Mini Feeds. {translations.footer}
          </p>
        </div>
        <div className="flex gap-6">
          <Link href="/docs/1-architecture/overview" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {translations.docs}
          </Link>
          <Link href="/docs/appendix/index" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {translations.faq}
          </Link>
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}