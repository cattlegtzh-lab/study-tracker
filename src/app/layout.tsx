import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "学习追踪",
  description: "追踪每日学习、想法和项目进度",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#faf8f5] min-h-screen text-[#333]">
        <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-white shadow-sm">
          <header className="px-5 py-4 flex items-center justify-between border-b border-[#f0ebe3]">
            <span className="text-lg font-semibold tracking-tight text-[#c4a07a]">学习追踪</span>
            <span className="text-xs text-[#b0a89c]">{new Date().toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" })}</span>
          </header>
          <main className="flex-1 overflow-y-auto px-5 py-4 pb-20">{children}</main>
          <Navbar />
        </div>
        <Toaster position="top-center" toastOptions={{ style: { background: "#333", color: "#fff", borderRadius: 12, fontSize: 13 } }} />
      </body>
    </html>
  );
}
