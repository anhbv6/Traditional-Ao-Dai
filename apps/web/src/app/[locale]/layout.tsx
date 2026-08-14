import type { Metadata } from "next";
import { Dancing_Script, Lora, Playfair_Display, Geist } from "next/font/google";
import "../globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  variable: "--font-dancing",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Traditional Ao Dai",
  description: "Áo dài truyền thống Việt Nam",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${lora.variable} ${playfair.variable} ${dancingScript.variable} ${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              <SmoothScrollProvider>
                {children}
                <ToastProvider />
              </SmoothScrollProvider>
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
