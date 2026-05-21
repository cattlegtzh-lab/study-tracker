"use client";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { path: "/", label: "每日", icon: "=" },
  { path: "/thoughts", label: "想法", icon: "#" },
  { path: "/projects", label: "项目", icon: "口" },
  { path: "/dashboard", label: "看板", icon: "◫" },
  { path: "/export", label: "导出", icon: "↑" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e2e] border-t border-[#313244] z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {tabs.map((t) => {
          const active = t.path === "/" ? pathname === "/" : pathname.startsWith(t.path);
          return (
            <button
              key={t.path}
              onClick={() => router.push(t.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                active ? "text-[#cba6f7]" : "text-[#6c7086]"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
