"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { supabase, getUserId } from "@/lib/supabase";
import type { Memo } from "@/lib/types";
import { subMonths } from "date-fns";

const DomainBar = dynamic(() => import("@/components/DashboardCharts").then((m) => m.DomainBar), { ssr: false });
const ActivityHeatmap = dynamic(() => import("@/components/DashboardCharts").then((m) => m.ActivityHeatmap), { ssr: false });

export default function DashboardPage() {
  const [records, setRecords] = useState<Memo[]>([]);
  const [mode, setMode] = useState<"month" | "all">("month");
  const [mounted, setMounted] = useState(false);

  const fetchRecords = useCallback(async () => {
    const uid = getUserId();
    const startDate = mode === "month" ? subMonths(new Date(), 1).toISOString().slice(0, 10) : "2020-01-01";
    const { data } = await supabase.from("memos").select("*").eq("user_id", uid).gte("date", startDate).order("date", { ascending: false });
    if (data) setRecords(data);
  }, [mode]);

  useEffect(() => { setMounted(true); fetchRecords(); }, [fetchRecords]);

  const monthCounts: Record<string, number> = {};
  records.forEach((r) => { const m = r.date.slice(0, 7); monthCounts[m] = (monthCounts[m] || 0) + 1; });
  const trendData = Object.entries(monthCounts).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#b0a89c]">统计看板</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as "month" | "all")} className="text-xs bg-white border border-[#f0ebe3] rounded-lg px-2.5 py-1.5 outline-none text-[#555]">
          <option value="month">近一个月</option><option value="all">全部</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-5">
        <p className="text-2xl font-semibold text-[#c4a07a]">{records.length}</p>
        <p className="text-xs text-[#c4b9a8] mt-1">总记录数</p>
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-5">
        <h3 className="text-xs text-[#b0a89c] mb-3 font-medium">活动热度</h3>
        {mounted && <ActivityHeatmap records={records} />}
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-5">
        <h3 className="text-xs text-[#b0a89c] mb-3 font-medium">领域分布</h3>
        {mounted && <DomainBar records={records} />}
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-5">
        <h3 className="text-xs text-[#b0a89c] mb-3 font-medium">月度趋势</h3>
        {trendData.length > 0 ? (
          <div className="space-y-2">
            {trendData.map(({ month, count }) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs text-[#b0a89c] w-20">{month}</span>
                <div className="flex-1 bg-[#faf8f5] rounded-full h-6 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (count / Math.max(...trendData.map((t) => t.count))) * 100)}%`, backgroundColor: "#c4a07a", minWidth: count > 0 ? "4px" : "0" }} />
                </div>
                <span className="text-xs text-[#555] w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-[#c4b9a8] text-center py-4">暂无数据</p>}
      </div>
    </div>
  );
}
