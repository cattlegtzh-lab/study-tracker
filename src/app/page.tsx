"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import type { Memo } from "@/lib/types";
import toast from "react-hot-toast";

function extractTags(text: string): string[] {
  const m = text.match(/#([\w一-鿿]+)/g);
  if (!m) return [];
  return [...new Set(m.map((t) => t.slice(1)))];
}

function renderText(t: string) {
  return t.split(/(#[\w一-鿿]+)/g).map((p, i) =>
    p.startsWith("#") ? <span key={i} className="text-blue-300 bg-blue-900/30 rounded-full px-1.5 py-0.5 text-xs font-medium mx-0.5 inline-block">{p}</span> : <span key={i}>{p}</span>
  );
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<"today" | "all">("today");
  const [reviewMemo, setReviewMemo] = useState<Memo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchMemos = useCallback(async () => {
    const uid = getUserId();
    let q = supabase.from("memos").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (dateFilter === "today") q = q.eq("date", new Date().toISOString().slice(0, 10));
    const { data } = await q.limit(100);
    if (data) setMemos(data);
  }, [dateFilter]);

  useEffect(() => { fetchMemos(); }, [fetchMemos]);

  const dailyReview = async () => {
    const uid = getUserId();
    const { data } = await supabase.from("memos").select("*").eq("user_id", uid).lt("date", new Date().toISOString().slice(0, 10)).order("created_at", { ascending: true }).limit(100);
    if (data && data.length > 0) setReviewMemo(data[Math.floor(Math.random() * data.length)]);
    else toast("还没有足够的历史记录", { icon: "📭" });
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const tags = extractTags(input);
      await supabase.from("memos").insert({ user_id: getUserId(), text: input.trim(), tags, date: new Date().toISOString().slice(0, 10) });
      setInput(""); toast.success("已记录"); fetchMemos();
    } catch { toast.error("记录失败"); }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    const tags = extractTags(editText);
    await supabase.from("memos").update({ text: editText, tags, updated_at: new Date().toISOString() }).eq("id", editingId);
    setEditingId(null); toast.success("已更新"); fetchMemos();
  };
  const handleDelete = async (id: string) => { await supabase.from("memos").delete().eq("id", id); setEditingId(null); fetchMemos(); };

  const aiProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/process", { method: "POST" });
      const data = await res.json();
      toast.success(data.count ? `已处理 ${data.count} 条` : data.message || "没有待处理的卡片");
      fetchMemos();
    } catch { toast.error("处理失败"); }
    setProcessing(false);
  };

  const promoteToTodo = async (m: Memo) => {
    await supabase.from("todos").insert({ user_id: getUserId(), text: m.text.slice(0, 120), source: "memo" });
    toast.success("已转为待办");
  };

  const grouped: Record<string, Memo[]> = {};
  memos.forEach((m) => { if (!grouped[m.date]) grouped[m.date] = []; grouped[m.date].push(m); });

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-zinc-400 cursor-pointer">
          <span>全部笔记</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={dailyReview} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">回顾</button>
          <button onClick={aiProcess} disabled={processing} className="text-xs bg-emerald-700/80 text-white px-3 py-1.5 rounded-md disabled:opacity-30 hover:bg-emerald-700 transition-colors">{processing ? "分析中" : "AI分析"}</button>
        </div>
      </div>

      {/* Input card */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="记下任何事情... 用 #标签 分类"
          rows={3}
          className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none resize-none" />
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-3 text-zinc-600">
            <button className="hover:text-zinc-300 transition-colors text-sm" title="标签">#</button>
            <button className="hover:text-zinc-300 transition-colors text-sm" title="格式">Aa</button>
            <button className="hover:text-zinc-300 transition-colors text-sm" title="列表">≡</button>
          </div>
          <button onClick={handleSubmit} disabled={loading || !input.trim()}
            className="text-zinc-400 hover:text-emerald-400 disabled:opacity-20 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5 w-fit">
        <button onClick={() => setDateFilter("today")} className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === "today" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}>今天</button>
        <button onClick={() => setDateFilter("all")} className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === "all" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}>全部</button>
      </div>

      {/* Review modal */}
      {reviewMemo && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 relative">
          <button onClick={() => setReviewMemo(null)} className="absolute top-2 right-3 text-zinc-500 hover:text-zinc-300 text-lg">&times;</button>
          <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wide">每日回顾 · {reviewMemo.date}</p>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{reviewMemo.text}</p>
          {reviewMemo.tags.length > 0 && <div className="flex gap-1.5 mt-2 flex-wrap">{reviewMemo.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300">#{t}</span>)}</div>}
        </div>
      )}

      {/* Card stream */}
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 && <p className="text-sm text-zinc-500 text-center py-16">还没有记录<br/><span className="text-xs">在上方输入第一条吧</span></p>}
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
          <div key={date}>
            <p className="text-xs text-zinc-600 mb-3 ml-1">{date}</p>
            <div className="space-y-3">
              {items.map((m) => (
                <div key={m.id} className="bg-zinc-800 rounded-lg p-4 group cursor-pointer transition-colors hover:bg-zinc-800/80"
                  onClick={() => editingId === m.id ? setEditingId(null) : (setEditingId(m.id), setEditText(m.text))}>
                  {editingId === m.id ? (
                    <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-zinc-900 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none resize-none border border-zinc-700" rows={3} autoFocus />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 px-2 py-1">删除</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-zinc-500 px-2 py-1">取消</button>
                        <button onClick={handleEdit} className="text-xs bg-emerald-700/80 text-white rounded-md px-3 py-1 font-medium">保存</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-zinc-500">{m.created_at.slice(0, 16).replace("T", " ")}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); promoteToTodo(m); }} className="text-[11px] text-blue-400 hover:text-blue-300">转为待办</button>
                          <button className="text-zinc-600 hover:text-zinc-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button>
                        </div>
                      </div>
                      {/* Tags */}
                      {m.tags.length > 0 && (
                        <div className="flex gap-1.5 mb-2 flex-wrap">
                          {m.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300">#{t}</span>)}
                          {m.is_processed && m.domain && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">{m.domain}</span>}
                        </div>
                      )}
                      {/* Content */}
                      <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{renderText(m.text)}</p>
                      {/* Output */}
                      {m.output && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400"/>产出: {m.output}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating help */}
      <button className="hidden md:flex fixed bottom-6 right-6 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors shadow-lg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </button>
    </div>
  );
}
