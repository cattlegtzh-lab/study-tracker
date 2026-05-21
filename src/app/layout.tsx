import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = { title: "学习追踪", description: "卡片笔记 · 学习追踪", manifest: "/manifest.json" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-zinc-900 min-h-screen text-zinc-100">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar — desktop only */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-semibold text-zinc-200">学习追踪</span>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-5 pb-24 md:py-6">{children}</div>
            </main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden"><Navbar /></div>

        <Toaster position="top-center" toastOptions={{ style: { background: "#27272a", color: "#e4e4e7", borderRadius: 12, fontSize: 13 } }} />
      </body>
    </html>
  );
}
