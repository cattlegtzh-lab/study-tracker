"use client";
import { useState, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import type { DailyRecord, Thought } from "@/lib/types";
import toast from "react-hot-toast";

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  const exportMD = useCallback(async () => {
    setExporting(true);
    try {
      const uid = getUserId();
      const [{ data: records }, { data: thoughts }] = await Promise.all([
        supabase.from("daily_records").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false }),
        supabase.from("thoughts").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false }),
      ]);

      const dr = records as DailyRecord[];
      const th = thoughts as Thought[];

      let md = `# 学习记录导出\n\n${dateFrom} 至 ${dateTo}\n\n`;

      // Group records by date
      const byDate: Record<string, DailyRecord[]> = {};
      dr.forEach((r) => {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push(r);
      });

      md += "## 每日记录\n\n";
      Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([date, items]) => {
          md += `### ${date}\n\n`;
          items.forEach((r) => {
            const parts = [r.domain, r.project_name, r.content].filter(Boolean).join(" | ");
            md += `- ${parts}`;
            if (r.output) md += ` → ${r.output}`;
            md += "\n";
          });
          md += "\n";
        });

      // Thoughts
      const thoughtByDate: Record<string, Thought[]> = {};
      th.forEach((t) => {
        if (!thoughtByDate[t.date]) thoughtByDate[t.date] = [];
        thoughtByDate[t.date].push(t);
      });

      md += "## 想法日记\n\n";
      Object.entries(thoughtByDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([date, items]) => {
          md += `### ${date}\n\n`;
          items.forEach((t) => md += `- ${t.text}\n`);
          md += "\n";
        });

      // Domain stats
      const domains: Record<string, number> = {};
      dr.forEach((r) => { const d = r.domain || "其他"; domains[d] = (domains[d] || 0) + 1; });
      md += "## 领域统计\n\n";
      Object.entries(domains)
        .sort(([, a], [, b]) => b - a)
        .forEach(([d, c]) => (md += `- ${d}: ${c} 条\n`));

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `study-log-${dateFrom}-${dateTo}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("导出完成");
    } catch (e) {
      toast.error("导出失败");
    }
    setExporting(false);
  }, [dateFrom, dateTo]);

  const exportJSON = useCallback(async () => {
    setExporting(true);
    try {
      const uid = getUserId();
      const [{ data: records }, { data: thoughts }] = await Promise.all([
        supabase.from("daily_records").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false }),
        supabase.from("thoughts").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false }),
      ]);

      const json = JSON.stringify({ daily_records: records, thoughts, export_range: { from: dateFrom, to: dateTo } }, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `study-log-${dateFrom}-${dateTo}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("导出完成");
    } catch (e) {
      toast.error("导出失败");
    }
    setExporting(false);
  }, [dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6c7086]">导出数据喂给 AI 做深度分析</p>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-[#6c7086]">从</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-[#313244] rounded px-2 py-1.5 text-sm outline-none" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-[#6c7086]">至</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-[#313244] rounded px-2 py-1.5 text-sm outline-none" />
        </div>
      </div>

      <button onClick={exportMD} disabled={exporting} className="w-full bg-[#cba6f7] text-[#1e1e2e] py-2.5 rounded-lg text-sm font-medium disabled:opacity-40">
        导出 Markdown
      </button>
      <button onClick={exportJSON} disabled={exporting} className="w-full bg-[#a6e3a1] text-[#1e1e2e] py-2.5 rounded-lg text-sm font-medium disabled:opacity-40">
        导出 JSON
      </button>

      <div className="bg-[#313244] rounded-lg p-4 text-xs text-[#a6adc8] space-y-2">
        <p className="font-medium text-[#cdd6f4]">如何用 AI 分析？</p>
        <p>1. 导出 Markdown 文件</p>
        <p>2. 将文件内容复制给 Claude / DeepSeek</p>
        <p>3. 用以下 Prompt：</p>
        <div className="bg-[#1e1e2e] rounded p-2 text-[#6c7086] whitespace-pre-wrap">分析我这段时期的学习记录：
- 哪些领域投入最多/最少？
- 有没有被冷落但仍值得关注的方向？
- 想法日记里有没有反复出现但还没行动的主题？
- 从记录中推导出 3 个具体的下一步行动建议。</div>
      </div>
    </div>
  );
}
