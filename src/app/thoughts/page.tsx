"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import type { Thought } from "@/lib/types";
import toast from "react-hot-toast";

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchThoughts = useCallback(async () => {
    const uid = getUserId();
    const { data } = await supabase.from("thoughts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(80);
    if (data) setThoughts(data);
  }, []);

  useEffect(() => { fetchThoughts(); }, [fetchThoughts]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const uid = getUserId();
      await supabase.from("thoughts").insert({ user_id: uid, text: input.trim(), date: new Date().toISOString().slice(0, 10) });
      setInput(""); toast.success("已记录"); fetchThoughts();
    } catch { toast.error("记录失败"); }
    setLoading(false);
  };

  const startEdit = (t: Thought) => { setEditingId(t.id); setEditText(t.text); };
  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from("thoughts").update({ text: editText }).eq("id", editingId);
    setEditingId(null); toast.success("已更新"); fetchThoughts();
  };
  const deleteThought = async (id: string) => { await supabase.from("thoughts").delete().eq("id", id); toast.success("已删除"); fetchThoughts(); setEditingId(null); };
  const promoteToTodo = async (thought: Thought) => {
    try {
      const uid = getUserId();
      await supabase.from("todos").insert({ user_id: uid, text: thought.text.slice(0, 120), source: "thought", thought_id: thought.id });
      await supabase.from("thoughts").update({ promoted_to_todo: true }).eq("id", thought.id);
      toast.success("已转为待办"); fetchThoughts();
    } catch { toast.error("操作失败"); }
  };

  const grouped: Record<string, Thought[]> = {};
  thoughts.forEach((t) => { if (!grouped[t.date]) grouped[t.date] = []; grouped[t.date].push(t); });

  return (
    <div className="space-y-4">
      {/* flomo-style input */}
      <textarea value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="想到什么写什么... 像聊天一样记录"
        rows={2}
        className="w-full bg-white border border-[#f0ebe3] rounded-xl px-4 py-3 text-sm text-[#555] placeholder:text-[#c4b9a8] outline-none focus:border-[#c4a07a] transition-colors resize-none shadow-sm" />
      <button onClick={handleSubmit} disabled={loading || !input.trim()}
        className="w-full bg-[#c4a07a] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 transition-opacity shadow-sm">
        {loading ? "···" : "记下想法"}
      </button>

      {/* Thought stream */}
      <div className="space-y-5">
        {Object.keys(grouped).length === 0 && <p className="text-sm text-[#c4b9a8] text-center py-10">还没有想法，在上方记下第一条吧</p>}
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
          const dateLabel = new Date(date).toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
          return (
            <div key={date}>
              <h3 className="text-xs text-[#c4b9a8] mb-2.5 ml-1">{dateLabel}</h3>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id}>
                    <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 group cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => editingId === t.id ? setEditingId(null) : startEdit(t)}>
                      {editingId === t.id ? (
                        <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-[#faf8f5] rounded-lg px-3 py-2 text-sm text-[#555] outline-none resize-none border border-[#f0ebe3]" rows={3} autoFocus />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => deleteThought(t.id)} className="text-xs text-[#e8a2a2] px-2 py-1">删除</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-[#b0a89c] px-2 py-1">取消</button>
                            <button onClick={saveEdit} className="text-xs bg-[#c4a07a] text-white rounded-lg px-4 py-1.5 font-medium">保存</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[#555] leading-relaxed whitespace-pre-wrap">{t.text}</p>
                          <div className="flex items-center justify-between mt-2.5">
                            <span className="text-[11px] text-[#c4b9a8]">
                              {new Date(t.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!t.promoted_to_todo ? (
                              <button onClick={(e) => { e.stopPropagation(); promoteToTodo(t); }}
                                className="text-[11px] text-[#c4a07a] opacity-0 group-hover:opacity-100 transition-opacity">转为待办</button>
                            ) : <span className="text-[11px] text-[#a0c4a0]">已转待办</span>}
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
