"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import { DOMAIN_COLORS, type Memo } from "@/lib/types";
import toast from "react-hot-toast";

function extractTags(text: string): string[] {
  const matches = text.match(/#([\w一-鿿㐀-䶿豈-﫿]+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((t) => t.slice(1)))];
}

function renderText(text: string) {
  const parts = text.split(/(#[\w一-鿿㐀-䶿豈-﫿]+)/g);
  return parts.map((p, i) => {
    if (p.startsWith("#")) {
      return <span key={i} className="text-[#c4a07a] font-medium">{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

const tagColors: Record<string, string> = { "政经": "#e8b4a2", "西语": "#a2c4e8", "史学": "#e8d4a2", "写作": "#c4a2e8", "RA": "#a2e8c4", "专四": "#e8a2c4" };

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
    let query = supabase.from("memos").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (dateFilter === "today") {
      query = query.eq("date", new Date().toISOString().slice(0, 10));
    }
    const { data } = await query.limit(100);
    if (data) setMemos(data);
  }, [dateFilter]);

  useEffect(() => { fetchMemos(); }, [fetchMemos]);

  // Daily review: random old memo
  const dailyReview = async () => {
    const uid = getUserId();
    const { data } = await supabase.from("memos").select("*").eq("user_id", uid).lt("date", new Date().toISOString().slice(0, 10)).order("created_at", { ascending: true }).limit(100);
    if (data && data.length > 0) {
      setReviewMemo(data[Math.floor(Math.random() * data.length)]);
    } else {
      toast("还没有足够的历史记录", { icon: "📭" });
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const tags = extractTags(input);
      const { error } = await supabase.from("memos").insert({
        user_id: getUserId(), text: input.trim(), tags,
        date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
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

  const handleDelete = async (id: string) => {
    await supabase.from("memos").delete().eq("id", id);
    setEditingId(null); toast.success("已删除"); fetchMemos();
  };

  // AI batch process unprocessed memos
  const aiProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/process", { method: "POST" });
      const data = await res.json();
      toast.success(`已处理 ${data.count || 0} 条`);
      fetchMemos();
    } catch { toast.error("处理失败"); }
    setProcessing(false);
  };

  const promoteToTodo = async (memo: Memo) => {
    await supabase.from("todos").insert({ user_id: getUserId(), text: memo.text.slice(0, 120), source: "memo" });
    toast.success("已转为待办");
  };

  const grouped: Record<string, Memo[]> = {};
  memos.forEach((m) => { if (!grouped[m.date]) grouped[m.date] = []; grouped[m.date].push(m); });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 bg-white rounded-lg border border-[#f0ebe3] p-0.5">
          <button onClick={() => setDateFilter("today")} className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === "today" ? "bg-[#f0ebe3] text-[#555]" : "text-[#c4b9a8]"}`}>今天</button>
          <button onClick={() => setDateFilter("all")} className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === "all" ? "bg-[#f0ebe3] text-[#555]" : "text-[#c4b9a8]"}`}>全部</button>
        </div>
        <div className="flex gap-2">
          <button onClick={dailyReview} className="text-xs text-[#c4a07a] px-2 py-1">回顾</button>
          <button onClick={aiProcess} disabled={processing} className="text-xs bg-[#c4a07a] text-white px-3 py-1 rounded-lg disabled:opacity-30">{processing ? "分析中" : "AI 分析"}</button>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-1 flex gap-0.5">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="记下任何事情... 用 #标签 分类"
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-[#c4b9a8]" autoFocus />
        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="px-4 m-0.5 rounded-lg bg-[#c4a07a] text-white text-sm font-medium disabled:opacity-30">记</button>
      </div>

      {/* Daily Review Modal */}
      {reviewMemo && (
        <div className="bg-[#faf8f5] border border-[#f0ebe3] rounded-xl p-4 relative">
          <button onClick={() => setReviewMemo(null)} className="absolute top-2 right-3 text-[#c4b9a8] text-lg">&times;</button>
          <p className="text-[10px] text-[#c4b9a8] mb-1 uppercase tracking-wide">每日回顾 · {reviewMemo.date}</p>
          <p className="text-sm text-[#555] leading-relaxed">{reviewMemo.text}</p>
          {reviewMemo.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {reviewMemo.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (tagColors[t] || "#b0a89c") + "30", color: tagColors[t] || "#b0a89c" }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card stream */}
      <div className="space-y-3">
        {Object.keys(grouped).length === 0 && <p className="text-sm text-[#c4b9a8] text-center py-12">还没有记录<br/>在上方输入第一条吧</p>}
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
          const dateLabel = new Date(date).toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
          return (
            <div key={date}>
              <h3 className="text-xs text-[#c4b9a8] mb-2 ml-1">{dateLabel}</h3>
              <div className="space-y-2">
                {items.map((m) => (
                  <div key={m.id}>
                    <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 group cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => editingId === m.id ? setEditingId(null) : (setEditingId(m.id), setEditText(m.text))}>
                      {editingId === m.id ? (
                        <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-[#faf8f5] rounded-lg px-3 py-2 text-sm text-[#555] outline-none resize-none border border-[#f0ebe3]" rows={3} autoFocus />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleDelete(m.id)} className="text-xs text-[#e8a2a2] px-2 py-1">删除</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-[#b0a89c] px-2 py-1">取消</button>
                            <button onClick={handleEdit} className="text-xs bg-[#c4a07a] text-white rounded-lg px-3 py-1 font-medium">保存</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[#555] leading-relaxed whitespace-pre-wrap">{renderText(m.text)}</p>
                          {/* Tags + meta */}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            {m.tags.length > 0 && m.tags.map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: (tagColors[t] || "#b0a89c") + "30", color: tagColors[t] || "#b0a89c" }}>#{t}</span>
                            ))}
                            {m.is_processed && m.domain && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0ebe3] text-[#888]">{m.domain}</span>
                            )}
                            {m.output && <span className="text-[10px] text-[#a0c4a0] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#a0c4a0]"/>{m.output}</span>}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-[#c4b9a8]">
                              {new Date(m.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); promoteToTodo(m); }}
                              className="text-[11px] text-[#c4a07a] opacity-0 group-hover:opacity-100 transition-opacity">转为待办</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
