import type { Metadata } from "next";
import { Varela_Round, Nunito_Sans } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const varelaRound = Varela_Round({
  variable: "--font-varela-round",
  weight: "400",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PinDou 拼豆图纸生成器 | Free Bead Pattern Generator",
  description: "免费在线拼豆图纸生成器。上传图片，CIEDE2000 感知色差算法精准匹配 1600+ 种 Perler / Hama / Artkal / MARD / COCO 等 8 大品牌真实拼豆颜色，导出 PNG/PDF 图纸。浏览器端处理，无需注册。",
  keywords: "拼豆,图纸生成器,perler beads,hama beads,artkal beads,pixel art,bead pattern,拼豆图纸,像素画",
  manifest: "/manifest.json",
  openGraph: {
    title: "PinDou 拼豆图纸生成器",
    description: "图片秒变拼豆图纸 — 8 大品牌 1600+ 色 CIEDE2000 精准匹配",
    type: "website",
  },
  other: {
    "theme-color": "#F472B6",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${varelaRound.variable} ${nunitoSans.variable} antialiased`}
      >
        <I18nProvider>{children}</I18nProvider>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js')` }} />
      </body>
    </html>
  );
}
