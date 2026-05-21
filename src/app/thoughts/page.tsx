"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import type { Thought } from "@/lib/types";
import toast from "react-hot-toast";

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchThoughts = useCallback(async () => {
    const uid = getUserId();
    const { data } = await supabase
      .from("thoughts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setThoughts(data);
  }, []);

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const uid = getUserId();
      const { error } = await supabase.from("thoughts").insert({
        user_id: uid,
        text: input.trim(),
        date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      setInput("");
      toast.success("想法已记录");
      fetchThoughts();
    } catch (e) {
      toast.error("记录失败");
    }
    setLoading(false);
  };

  const promoteToTodo = async (thought: Thought) => {
    try {
      const uid = getUserId();
      await supabase.from("todos").insert({
        user_id: uid,
        text: thought.text.slice(0, 100),
        source: "thought",
        thought_id: thought.id,
      });
      await supabase.from("thoughts").update({ promoted_to_todo: true }).eq("id", thought.id);
      toast.success("已转为待办");
      fetchThoughts();
    } catch (e) {
      toast.error("操作失败");
    }
  };

  // Group thoughts by date
  const grouped: Record<string, Thought[]> = {};
  thoughts.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  const todayStr = new Date().toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" });

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6c7086]">{todayStr}</p>

      {/* Input */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="想到什么写什么..."
        rows={3}
        className="w-full bg-[#313244] border border-[#45475a] rounded-lg px-3 py-2.5 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none focus:border-[#f5c2e7] transition-colors resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !input.trim()}
        className="w-full bg-[#f5c2e7] text-[#1e1e2e] py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
      >
        {loading ? "..." : "记下"}
      </button>

      {/* Thought stream */}
      <div className="space-y-6">
        {Object.keys(grouped).length === 0 && <p className="text-xs text-[#6c7086] text-center py-6">还没有想法</p>}
        {Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, items]) => {
            const d = new Date(date);
            const dateLabel = d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" });
            return (
              <div key={date}>
                <h3 className="text-xs text-[#6c7086] mb-2">{dateLabel}</h3>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="bg-[#313244] rounded-lg p-3 group">
                      <p className="text-sm text-[#cdd6f4] leading-relaxed whitespace-pre-wrap">{t.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[#6c7086]">
                          {new Date(t.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {!t.promoted_to_todo && (
                          <button
                            onClick={() => promoteToTodo(t)}
                            className="text-[10px] text-[#a6adc8] hover:text-[#f5c2e7] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            转为待办
                          </button>
                        )}
                        {t.promoted_to_todo && <span className="text-[10px] text-[#a6e3a1]">已转待办</span>}
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
