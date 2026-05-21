import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "学习追踪器",
  description: "追踪每日学习、想法和项目进度",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#1e1e2e] text-[#cdd6f4] min-h-screen">
        <div className="max-w-lg mx-auto min-h-screen flex flex-col">
          <header className="px-4 py-3 border-b border-[#313244]">
            <h1 className="text-lg font-semibold text-[#cba6f7]">学习追踪</h1>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-3 pb-20">{children}</main>
          <Navbar />
        </div>
        <Toaster position="top-center" toastOptions={{ style: { background: "#313244", color: "#cdd6f4" } }} />
      </body>
    </html>
  );
}
