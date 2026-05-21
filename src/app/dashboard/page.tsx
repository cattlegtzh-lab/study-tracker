"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { supabase, getUserId } from "@/lib/supabase";
import type { DailyRecord } from "@/lib/types";
import { subMonths } from "date-fns";

const DomainBar = dynamic(() => import("@/components/DashboardCharts").then((m) => m.DomainBar), { ssr: false });
const ActivityHeatmap = dynamic(() => import("@/components/DashboardCharts").then((m) => m.ActivityHeatmap), { ssr: false });

export default function DashboardPage() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [mode, setMode] = useState<"month" | "all">("month");
  const [mounted, setMounted] = useState(false);

  const fetchRecords = useCallback(async () => {
    const uid = getUserId();
    const startDate = mode === "month" ? subMonths(new Date(), 1).toISOString().slice(0, 10) : "2020-01-01";
    const { data } = await supabase
      .from("daily_records")
      .select("*")
      .eq("user_id", uid)
      .gte("date", startDate)
      .order("date", { ascending: false });
    if (data) setRecords(data);
  }, [mode]);

  useEffect(() => { setMounted(true); fetchRecords(); }, [fetchRecords]);

  // Monthly trend (no Recharts needed, pure CSS)
  const monthCounts: Record<string, number> = {};
  records.forEach((r) => {
    const m = r.date.slice(0, 7);
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  });
  const trendData = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6c7086]">学习看板</p>
        <select value={mode} onChange={(e) => setMode(e.target.value as "month" | "all")} className="text-xs bg-[#313244] rounded px-2 py-1 outline-none">
          <option value="month">近一个月</option>
          <option value="all">全部</option>
        </select>
      </div>

      <p className="text-xs text-[#a6adc8]">总计: {records.length} 条记录</p>

      {/* Heatmap */}
      <div>
        <h3 className="text-xs font-medium text-[#a6adc8] mb-2">活动热度</h3>
        {mounted && <ActivityHeatmap records={records} />}
      </div>

      {/* Domain Distribution */}
      <div>
        <h3 className="text-xs font-medium text-[#a6adc8] mb-2">领域分布</h3>
        {mounted && <DomainBar records={records} />}
      </div>

      {/* Monthly trend (pure CSS, no Recharts) */}
      <div>
        <h3 className="text-xs font-medium text-[#a6adc8] mb-2">月度趋势</h3>
        {trendData.length > 0 ? (
          <div className="space-y-1">
            {trendData.map(({ month, count }) => (
              <div key={month} className="flex items-center gap-2">
                <span className="text-xs text-[#6c7086] w-16">{month}</span>
                <div className="flex-1 bg-[#313244] rounded-full h-5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (count / Math.max(...trendData.map((t) => t.count))) * 100)}%`, backgroundColor: "#cba6f7" }} />
                </div>
                <span className="text-xs text-[#cdd6f4]">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6c7086] text-center py-8">暂无数据</p>
        )}
      </div>
    </div>
  );
}
