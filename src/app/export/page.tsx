"use client";
import { useState } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import type { Memo } from "@/lib/types";
import toast from "react-hot-toast";

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  const fetchMemos = async () => {
    const uid = getUserId();
    const { data } = await supabase.from("memos").select("*").eq("user_id", uid).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false });
    return (data || []) as Memo[];
  };

  const exportMD = async () => {
    setExporting(true);
    const memos = await fetchMemos();
    let md = `# 学习记录 ${dateFrom} ~ ${dateTo}\n\n`;
    const byDate: Record<string, Memo[]> = {};
    memos.forEach((m) => { if (!byDate[m.date]) byDate[m.date] = []; byDate[m.date].push(m); });
    Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).forEach(([date, items]) => {
      md += `### ${date}\n\n`;
      items.forEach((m) => { md += `- ${m.tags.map((t) => `#${t}`).join(" ")} ${m.text}${m.output ? ` → ${m.output}` : ""}\n`; });
      md += "\n";
    });
    const domains: Record<string, number> = {};
    memos.forEach((m) => { const d = m.domain || "未分类"; domains[d] = (domains[d] || 0) + 1; });
    md += "## 领域统计\n\n"; Object.entries(domains).sort(([, a], [, b]) => b - a).forEach(([d, c]) => (md += `- ${d}: ${c} 条\n`));
    download(md, `study-log-${dateFrom}-${dateTo}.md`, "text/markdown");
    toast.success("导出完成"); setExporting(false);
  };

  const exportJSON = async () => {
    setExporting(true);
    const memos = await fetchMemos();
    download(JSON.stringify({ memos, range: { from: dateFrom, to: dateTo } }, null, 2), `study-log-${dateFrom}-${dateTo}.json`, "application/json");
    toast.success("导出完成"); setExporting(false);
  };

  const download = (c: string, f: string, t: string) => { const b = new Blob([c], { type: t }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = f; a.click(); URL.revokeObjectURL(u); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">导出数据给 AI 做深度分析</p>
      <div className="flex gap-3">
        <div className="flex-1"><label className="text-[11px] text-zinc-500">从</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm outline-none text-zinc-200" /></div>
        <div className="flex-1"><label className="text-[11px] text-zinc-500">至</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm outline-none text-zinc-200" /></div>
      </div>
      <button onClick={exportMD} disabled={exporting} className="w-full bg-emerald-700/80 text-white py-2.5 rounded-md text-sm font-medium disabled:opacity-30">导出 Markdown</button>
      <button onClick={exportJSON} disabled={exporting} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 py-2.5 rounded-md text-sm font-medium disabled:opacity-30">导出 JSON</button>
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
        <p className="text-xs text-zinc-400 mb-2 font-medium">如何用 AI 深度分析</p>
        <p className="text-xs text-zinc-500 mb-2">1. 导出 Markdown<br/>2. 复制给 Claude / DeepSeek<br/>3. 使用以下 Prompt：</p>
        <div className="bg-zinc-900 rounded-md p-3 text-xs text-zinc-500 whitespace-pre-wrap">分析我这段时期的学习记录：
- 哪些领域投入最多/最少？
- 有没有被冷落但仍值得关注的方向？
- 想法里有没有反复出现但还没行动的主题？
- 从记录中推导出下一个具体的行动建议。</div>
      </div>
    </div>
  );
}
