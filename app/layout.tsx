import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout"; // Gọi logic xử lý giao diện từ file khác

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nguyen Tam Auto - CRM",
  description: "Hệ thống quản trị doanh nghiệp mua bán xe tải",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full text-gray-900 bg-gray-50" suppressHydrationWarning>
        {/* Chỉ truyền children vào ClientLayout, không code Sidebar ở đây nữa */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}