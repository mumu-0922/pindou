import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PinDou 拼豆图纸生成器 | Free Bead Pattern Generator",
  description: "免费在线拼豆图纸生成器。上传图片，CIEDE2000 感知色差算法精准匹配 155 种 Perler / Hama / Artkal 真实拼豆颜色，导出 PNG/PDF 图纸。浏览器端处理，无需注册。",
  keywords: "拼豆,图纸生成器,perler beads,hama beads,artkal beads,pixel art,bead pattern,拼豆图纸,像素画",
  openGraph: {
    title: "PinDou 拼豆图纸生成器",
    description: "图片秒变拼豆图纸 — 155色 CIEDE2000 精准匹配",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
