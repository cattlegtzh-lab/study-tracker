"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import { parseDailyInput } from "@/lib/ai";
import { DOMAIN_COLORS, DOMAINS, type DailyRecord, type ParsedInput } from "@/lib/types";
import toast from "react-hot-toast";

const domainColors: Record<string, string> = {
  "政经": "#e8b4a2", "西语": "#a2c4e8", "史学": "#e8d4a2",
  "写作": "#c4a2e8", "RA": "#a2e8c4", "专四": "#e8a2c4", "其他": "#b0a89c",
};

export default function Home() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ domain: "", content: "", output: "" });

  const fetchRecords = useCallback(async () => {
    const uid = getUserId();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("daily_records").select("*").eq("user_id", uid).eq("date", today).order("created_at", { ascending: false });
    if (data) setRecords(data);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const uid = getUserId();
      const { data: projData } = await supabase.from("projects").select("name").eq("user_id", uid);
      const projectNames = (projData || []).map((p: { name: string }) => p.name);
      const parsed = await parseDailyInput(input.trim(), projectNames);
      const { error } = await supabase.from("daily_records").insert({
        user_id: uid, raw_input: input.trim(), domain: parsed.domain,
        project_name: parsed.project_name || null, content: parsed.content,
        output: parsed.output || null, date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      setInput(""); toast.success("已记录"); fetchRecords();
    } catch (e: any) { toast.error("记录失败"); }
    setLoading(false);
  };

  const startEdit = (r: DailyRecord) => { setEditingId(r.id); setEditForm({ domain: r.domain || "", content: r.content || r.raw_input, output: r.output || "" }); };
  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from("daily_records").update({ domain: editForm.domain || null, content: editForm.content, output: editForm.output || null }).eq("id", editingId);
    setEditingId(null); toast.success("已更新"); fetchRecords();
  };
  const deleteRecord = async (id: string) => { await supabase.from("daily_records").delete().eq("id", id); toast.success("已删除"); fetchRecords(); setEditingId(null); };

  return (
    <div className="space-y-4">
      {/* flomo-style input */}
      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-1 flex gap-0.5">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="今天做了什么？输入后回车记录..."
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-[#c4b9a8]" autoFocus />
        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="px-4 m-0.5 rounded-lg bg-[#c4a07a] text-white text-sm font-medium disabled:opacity-30 transition-opacity">
          {loading ? "···" : "记"}
        </button>
      </div>

      {/* Records as cards */}
      <div className="space-y-2">
        {records.length === 0 && <p className="text-sm text-[#c4b9a8] text-center py-10">今天还没有记录，在上方输入一条吧</p>}
        {records.map((r) => (
          <div key={r.id}>
            <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => editingId === r.id ? setEditingId(null) : startEdit(r)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {r.domain && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: domainColors[r.domain] + "30", color: domainColors[r.domain] }}>{r.domain}</span>}
                    {r.project_name && <span className="text-[11px] text-[#b0a89c]">· {r.project_name}</span>}
                  </div>
                  <p className="text-sm text-[#555] leading-relaxed">{r.content || r.raw_input}</p>
                  {r.output && <p className="text-xs text-[#a0c4a0] mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-[#a0c4a0]"/>产出: {r.output}</p>}
                </div>
                <span className="text-[11px] text-[#c4b9a8] ml-3 mt-0.5">
                  {new Date(r.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Edit panel */}
            {editingId === r.id && (
              <div className="bg-[#faf8f5] rounded-b-xl border border-t-0 border-[#f0ebe3] px-4 py-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 items-center"><span className="text-[11px] text-[#b0a89c] w-8">领域</span>
                  <select value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} className="flex-1 bg-white border border-[#f0ebe3] rounded-lg px-2 py-1.5 text-xs outline-none">{DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="flex gap-2 items-center"><span className="text-[11px] text-[#b0a89c] w-8">内容</span>
                  <input value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} className="flex-1 bg-white border border-[#f0ebe3] rounded-lg px-2 py-1.5 text-xs outline-none" /></div>
                <div className="flex gap-2 items-center"><span className="text-[11px] text-[#b0a89c] w-8">产出</span>
                  <input value={editForm.output} onChange={(e) => setEditForm({ ...editForm, output: e.target.value })} className="flex-1 bg-white border border-[#f0ebe3] rounded-lg px-2 py-1.5 text-xs outline-none" /></div>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => deleteRecord(r.id)} className="text-xs text-[#e8a2a2] px-2 py-1">删除</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-[#b0a89c] px-2 py-1">取消</button>
                  <button onClick={saveEdit} className="text-xs bg-[#c4a07a] text-white rounded-lg px-4 py-1.5 font-medium">保存</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
