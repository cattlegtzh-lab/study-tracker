"use client";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { path: "/", label: "卡片", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
  )},
  { path: "/projects", label: "项目", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { path: "/dashboard", label: "看板", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
  )},
  { path: "/export", label: "导出", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  )},
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe3] z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {tabs.map((t) => {
          const active = t.path === "/" ? pathname === "/" : pathname.startsWith(t.path);
          return (
            <button key={t.path} onClick={() => router.push(t.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${active ? "text-[#c4a07a]" : "text-[#c4b9a8]"}`}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
