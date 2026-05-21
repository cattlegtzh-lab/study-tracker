"use client";
import { type Memo, DOMAINS } from "@/lib/types";
import { format, subMonths, eachDayOfInterval, startOfWeek } from "date-fns";

const barColors: Record<string, string> = { "政经": "#e8b4a2", "西语": "#a2c4e8", "史学": "#e8d4a2", "写作": "#c4a2e8", "RA": "#a2e8c4", "专四": "#e8a2c4", "其他": "#71717a" };

export function DomainBar({ records }: { records: Memo[] }) {
  const domainCount: Record<string, number> = {};
  records.forEach((r) => { const d = r.domain || "其他"; domainCount[d] = (domainCount[d] || 0) + 1; });
  const total = records.length || 1;
  const sorted = DOMAINS.filter((d) => domainCount[d]).map((d) => ({ name: d, count: domainCount[d] || 0 })).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) return <p className="text-xs text-zinc-500 text-center py-4">暂无数据</p>;

  return (
    <div className="space-y-2">
      {sorted.map(({ name, count }) => (
        <div key={name} className="flex items-center gap-2"><span className="text-xs text-zinc-300 w-12 shrink-0">{name}</span>
          <div className="flex-1 bg-zinc-900 rounded-full h-5 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, backgroundColor: barColors[name] || "#71717a" }} /></div>
          <span className="text-xs text-zinc-500 w-6 text-right">{count}</span></div>
      ))}
    </div>
  );
}

export function ActivityHeatmap({ records }: { records: Memo[] }) {
  const today = new Date();
  const ago = subMonths(today, 3);
  const days = eachDayOfInterval({ start: ago, end: today });
  const dayCounts: Record<string, number> = {};
  records.forEach((r) => { dayCounts[r.date] = (dayCounts[r.date] || 0) + 1; });

  const weeks: { label: string; days: { date: string; count: number }[] }[] = [];
  let cw: { date: string; count: number }[] = [];
  let ws = startOfWeek(days[0]);
  days.forEach((d) => {
    const ds = format(d, "yyyy-MM-dd");
    cw.push({ date: ds, count: dayCounts[ds] || 0 });
    if (format(d, "E") === "Sat" || d.getTime() === days[days.length - 1].getTime()) { weeks.push({ label: format(ws, "M/d"), days: cw }); cw = []; ws = d; }
  });

  const hc = (c: number) => {
    if (c === 0) return "#27272a";
    if (c <= 2) return "#064e3b";
    if (c <= 5) return "#047857";
    return "#10b981";
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: "max-content" }}>
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <span className="text-[8px] text-zinc-600 text-center">{w.label}</span>
              <div className="flex flex-col gap-1">
                {w.days.map((d) => (
                  <div key={d.date} className="w-3 h-3 rounded-sm" style={{ backgroundColor: hc(d.count) }} title={`${d.date}: ${d.count}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-600">
        <span>少</span><div className="w-3 h-3 rounded-sm bg-zinc-800" /><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#064e3b" }} /><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#047857" }} /><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#10b981" }} /><span>多</span>
      </div>
    </div>
  );
}
