import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n";
import { AuthProvider } from "./contexts/AuthContext";
import { headers } from "next/headers";
import ChatWidgetLoader from "./components/ChatWidgetLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isYimei = host.includes("yimeimeigong.com");

  if (isYimei) {
    return {
      title: "鹏哥工具箱 - 医生IP的AI工具包",
      description: "专为医生打造的AI工具平台，助力个人IP打造、内容创作与私域变现。",
      keywords: ["医生IP", "医生AI工具", "AI医生", "医生内容创作", "鹏哥工具箱"],
      openGraph: {
        title: "鹏哥工具箱 - 医生IP的AI工具包",
        description: "专为医生打造的AI工具平台，助力个人IP打造",
        type: "website",
        locale: "zh_CN",
      },
    };
  }

  return {
    title: "鹏哥 - 医生流量合伙人 | 专注医生IP流量运营",
    description: "10年医疗行业深耕，从医药销售到AI创业。专注医生IP流量运营，提供IP代运营、AI+流量培训、医生AI助理等服务。",
    keywords: ["医生IP", "医疗流量", "AI医疗工具", "医生个人品牌", "IP运营", "医疗AI"],
    authors: [{ name: "鹏哥" }],
    openGraph: {
      title: "鹏哥 - 医生流量合伙人",
      description: "专注医生IP流量运营，10年医疗行业深耕",
      type: "website",
      locale: "zh_CN",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <ChatWidgetLoader />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
