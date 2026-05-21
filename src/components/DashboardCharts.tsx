"use client";
import { type DailyRecord, DOMAINS } from "@/lib/types";

const domainBarColors: Record<string, string> = {
  "政经": "#e8b4a2", "西语": "#a2c4e8", "史学": "#e8d4a2",
  "写作": "#c4a2e8", "RA": "#a2e8c4", "专四": "#e8a2c4", "其他": "#b0a89c",
};
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
            <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, backgroundColor: domainBarColors[name as keyof typeof domainBarColors] || "#6b7280" }} />
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
    if (c === 0) return "#f0ebe3";
    if (c <= 2) return "#d4c4a8";
    if (c <= 5) return "#c4a07a";
    return "#a07850";
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: "max-content" }}>
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <span className="text-[8px] text-[#c4b9a8] text-center">{w.label}</span>
              <div className="flex flex-col gap-1">
                {w.days.map((d) => (
                  <div key={d.date} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(d.count) }} title={`${d.date}: ${d.count}条`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-[#c4b9a8]">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-[#f0ebe3]" /><div className="w-3 h-3 rounded-sm bg-[#d4c4a8]" /><div className="w-3 h-3 rounded-sm bg-[#c4a07a]" /><div className="w-3 h-3 rounded-sm bg-[#a07850]" />
        <span>多</span>
      </div>
    </div>
  );
}
