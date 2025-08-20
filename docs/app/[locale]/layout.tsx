import { NextIntlClientProvider } from 'next-intl';
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "../../components/theme-provider";
import { notFound } from 'next/navigation';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}