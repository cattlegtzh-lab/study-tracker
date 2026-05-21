"use client";
import { useState } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import type { DailyRecord, Thought } from "@/lib/types";
import toast from "react-hot-toast";

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    const uid = getUserId();
    const [{ data: records }, { data: thoughts }] = await Promise.all([
      supabase.from("daily_records").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false }),
      supabase.from("thoughts").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false }),
    ]);
    return { records: records as DailyRecord[], thoughts: thoughts as Thought[] };
  };

  const exportMD = async () => {
    setExporting(true);
    const { records: dr, thoughts: th } = await fetchData();
    let md = `# 学习记录 ${dateFrom} ~ ${dateTo}\n\n## 每日记录\n\n`;
    const byDate: Record<string, DailyRecord[]> = {};
    dr.forEach((r) => { if (!byDate[r.date]) byDate[r.date] = []; byDate[r.date].push(r); });
    Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).forEach(([date, items]) => {
      md += `### ${date}\n\n`;
      items.forEach((r) => {
        const parts = [r.domain, r.project_name, r.content].filter(Boolean).join(" | ");
        md += `- ${parts}${r.output ? ` → ${r.output}` : ""}\n`;
      });
      md += "\n";
    });
    const thoughtByDate: Record<string, Thought[]> = {};
    th.forEach((t) => { if (!thoughtByDate[t.date]) thoughtByDate[t.date] = []; thoughtByDate[t.date].push(t); });
    md += "## 想法日记\n\n";
    Object.entries(thoughtByDate).sort(([a], [b]) => b.localeCompare(a)).forEach(([date, items]) => {
      md += `### ${date}\n\n`; items.forEach((t) => md += `- ${t.text}\n`); md += "\n";
    });
    const domains: Record<string, number> = {};
    dr.forEach((r) => { const d = r.domain || "其他"; domains[d] = (domains[d] || 0) + 1; });
    md += "## 领域统计\n\n";
    Object.entries(domains).sort(([, a], [, b]) => b - a).forEach(([d, c]) => (md += `- ${d}: ${c} 条\n`));

    download(md, `study-log-${dateFrom}-${dateTo}.md`, "text/markdown");
    toast.success("导出完成"); setExporting(false);
  };

  const exportJSON = async () => {
    setExporting(true);
    const data = await fetchData();
    download(JSON.stringify({ ...data, export_range: { from: dateFrom, to: dateTo } }, null, 2), `study-log-${dateFrom}-${dateTo}.json`, "application/json");
    toast.success("导出完成"); setExporting(false);
  };

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#b0a89c]">导出数据给 AI 做深度分析</p>

      <div className="flex gap-3">
        <div className="flex-1"><label className="text-[11px] text-[#c4b9a8]">从</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-white border border-[#f0ebe3] rounded-lg px-3 py-2 text-sm outline-none text-[#555]" /></div>
        <div className="flex-1"><label className="text-[11px] text-[#c4b9a8]">至</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-white border border-[#f0ebe3] rounded-lg px-3 py-2 text-sm outline-none text-[#555]" /></div>
      </div>

      <button onClick={exportMD} disabled={exporting} className="w-full bg-[#c4a07a] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 shadow-sm">导出 Markdown</button>
      <button onClick={exportJSON} disabled={exporting} className="w-full bg-white border border-[#f0ebe3] text-[#555] py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 shadow-sm">导出 JSON</button>

      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4">
        <p className="text-xs text-[#b0a89c] mb-2 font-medium">如何用 AI 分析</p>
        <p className="text-xs text-[#b0a89c] mb-2">1. 导出 Markdown 文件<br/>2. 复制内容发给 Claude / DeepSeek<br/>3. 用以下 Prompt：</p>
        <div className="bg-[#faf8f5] rounded-lg p-3 text-xs text-[#888] whitespace-pre-wrap">分析我这段时期的学习记录：
- 哪些领域投入最多/最少？
- 有没有被冷落但仍值得关注的方向？
- 想法日记里有没有反复出现但还没行动的主题？
- 从记录中推导出 3 个具体的下一步行动建议。</div>
      </div>
    </div>
  );
}
