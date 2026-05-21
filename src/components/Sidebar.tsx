"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, getUserId } from "@/lib/supabase";
import { format, subMonths, eachDayOfInterval } from "date-fns";

const navItems = [
  { path: "/", label: "全部笔记", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  )},
  { path: "/projects", label: "项目", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  )},
  { path: "/dashboard", label: "看板", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
  )},
  { path: "/export", label: "导出", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  )},
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [memoCount, setMemoCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);
  const [dayCount, setDayCount] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  useEffect(() => {
    const uid = getUserId();
    supabase.from("memos").select("id, tags, date").eq("user_id", uid).then(({ data }) => {
      if (!data) return;
      setMemoCount(data.length);

      const days = new Set(data.map((m: { date: string }) => m.date));
      setDayCount(days.size);

      const allTags = new Set<string>();
      const dayCounts: Record<string, number> = {};
      data.forEach((m: { tags: string[]; date: string }) => {
        (m.tags || []).forEach((t: string) => allTags.add(t));
        dayCounts[m.date] = (dayCounts[m.date] || 0) + 1;
      });
      setTagCount(allTags.size);
      setTags([...allTags].slice(0, 8));
      setHeatmapData(dayCounts);
    });
  }, []);

  // Heatmap for last 6 weeks
  const today = new Date();
  const sixWeeksAgo = subMonths(today, 3);
  const days = eachDayOfInterval({ start: sixWeeksAgo, end: today });
  const weeks: { date: string; count: number }[][] = [];
  let week: { date: string; count: number }[] = [];
  days.forEach((d) => {
    const ds = format(d, "yyyy-MM-dd");
    week.push({ date: ds, count: heatmapData[ds] || 0 });
    if (format(d, "E") === "Sat") { weeks.push(week); week = []; }
  });
  if (week.length) weeks.push(week);

  const heatColor = (c: number) => {
    if (c === 0) return "bg-zinc-800";
    if (c <= 2) return "bg-emerald-800/60";
    if (c <= 5) return "bg-emerald-600/80";
    return "bg-emerald-500";
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-zinc-900 border-r border-zinc-800/50 h-full overflow-y-auto">
      <div className="p-5 flex flex-col h-full">
        {/* User */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-bold text-zinc-100">cogito</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">PRO</span>
        </div>

        {/* Stats */}
        <div className="flex justify-between mb-6">
          <div className="flex flex-col items-center"><span className="text-lg font-semibold text-zinc-100">{memoCount}</span><span className="text-[11px] text-zinc-500">笔记</span></div>
          <div className="flex flex-col items-center"><span className="text-lg font-semibold text-zinc-100">{tagCount}</span><span className="text-[11px] text-zinc-500">标签</span></div>
          <div className="flex flex-col items-center"><span className="text-lg font-semibold text-zinc-100">{dayCount}</span><span className="text-[11px] text-zinc-500">天</span></div>
        </div>

        {/* Heatmap */}
        <div className="mb-6">
          <div className="flex flex-col gap-1 items-start">
            {weeks.slice(-12).map((w, wi) => (
              <div key={wi} className="flex gap-1">
                {w.map((d) => (
                  <div key={d.date} className={`w-3 h-3 rounded-sm ${heatColor(d.count)}`} title={`${d.date}: ${d.count}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[10px] text-zinc-600 mt-1.5">
            <span>三月</span><span>四月</span><span>五月</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 mb-6">
          {navItems.map((item) => {
            const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => router.push(item.path)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${active ? "bg-emerald-700/60 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"}`}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tags */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-[11px] text-zinc-600 mb-2">全部标签</h4>
          <div className="flex flex-col gap-0.5">
            {tags.length === 0 && <span className="text-xs text-zinc-600">暂无标签</span>}
            {tags.map((t) => (
              <button key={t} onClick={() => router.push("/")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                <span className="text-zinc-600">#</span>
                <span className="truncate">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
