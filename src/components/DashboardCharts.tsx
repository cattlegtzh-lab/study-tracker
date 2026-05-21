"use client";
import { type DailyRecord, DOMAIN_COLORS, DOMAINS } from "@/lib/types";
import { format, subMonths, eachDayOfInterval, startOfWeek } from "date-fns";

export function DomainBar({ records }: { records: DailyRecord[] }) {
  const domainCount: Record<string, number> = {};
  records.forEach((r) => {
    const d = r.domain || "其他";
    domainCount[d] = (domainCount[d] || 0) + 1;
  });
  const total = records.length || 1;
  const sorted = DOMAINS.filter((d) => domainCount[d]).map((d) => ({ name: d, count: domainCount[d] || 0 })).sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return <p className="text-xs text-[#6c7086] text-center py-8">暂无数据</p>;

  return (
    <div className="space-y-1.5">
      {sorted.map(({ name, count }) => (
        <div key={name} className="flex items-center gap-2">
          <span className="text-xs text-[#cdd6f4] w-12 shrink-0">{name}</span>
          <div className="flex-1 bg-[#313244] rounded-full h-4 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, backgroundColor: DOMAIN_COLORS[name as keyof typeof DOMAIN_COLORS] || "#6b7280" }} />
          </div>
          <span className="text-xs text-[#6c7086] w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityHeatmap({ records }: { records: DailyRecord[] }) {
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  const days = eachDayOfInterval({ start: threeMonthsAgo, end: today });
  const dayCounts: Record<string, number> = {};
  records.forEach((r) => { dayCounts[r.date] = (dayCounts[r.date] || 0) + 1; });

  const weeks: { label: string; days: { date: string; count: number }[] }[] = [];
  let currentWeek: { date: string; count: number }[] = [];
  let weekStart = startOfWeek(days[0]);

  days.forEach((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    currentWeek.push({ date: dateStr, count: dayCounts[dateStr] || 0 });
    if (format(d, "E") === "Sat" || d.getTime() === days[days.length - 1].getTime()) {
      weeks.push({ label: format(weekStart, "M/d"), days: currentWeek });
      currentWeek = [];
      weekStart = d;
    }
  });

  const getColor = (c: number) => {
    if (c === 0) return "#313244";
    if (c <= 2) return "#a6e3a1";
    if (c <= 5) return "#74c7ec";
    return "#cba6f7";
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: "max-content" }}>
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <span className="text-[8px] text-[#6c7086] text-center">{w.label}</span>
              <div className="flex flex-col gap-1">
                {w.days.map((d) => (
                  <div key={d.date} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(d.count) }} title={`${d.date}: ${d.count}条`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-[#6c7086]">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-[#313244]" /><div className="w-3 h-3 rounded-sm bg-[#a6e3a1]" /><div className="w-3 h-3 rounded-sm bg-[#74c7ec]" /><div className="w-3 h-3 rounded-sm bg-[#cba6f7]" />
        <span>多</span>
      </div>
    </div>
  );
}
