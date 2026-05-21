"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import { parseDailyInput } from "@/lib/ai";
import { DOMAIN_COLORS, type DailyRecord, type ParsedInput } from "@/lib/types";
import toast from "react-hot-toast";

export default function Home() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    const uid = getUserId();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("daily_records")
      .select("*")
      .eq("user_id", uid)
      .eq("date", today)
      .order("created_at", { ascending: false });
    if (data) setRecords(data);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const uid = getUserId();
      const { data: projData } = await supabase.from("projects").select("name").eq("user_id", uid);
      const projectNames = (projData || []).map((p: { name: string }) => p.name);
      const parsed: ParsedInput = await parseDailyInput(input.trim(), projectNames);

      const { error } = await supabase.from("daily_records").insert({
        user_id: uid,
        raw_input: input.trim(),
        domain: parsed.domain,
        project_name: parsed.project_name || null,
        content: parsed.content,
        output: parsed.output || null,
        date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      setInput("");
      toast.success("已记录");
      fetchRecords();
    } catch (e: any) {
      const msg = e?.message || e?.toString() || "未知错误";
      toast.error(`记录失败: ${msg.slice(0, 50)}`);
      console.error(e);
    }
    setLoading(false);
  };

  const todayStr = new Date().toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" });

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6c7086]">{todayStr}</p>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="今天做了什么？"
          className="flex-1 bg-[#313244] border border-[#45475a] rounded-lg px-3 py-2.5 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none focus:border-[#cba6f7] transition-colors"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="bg-[#cba6f7] text-[#1e1e2e] px-4 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          {loading ? "..." : "+"}
        </button>
      </div>

      {/* Today's Records */}
      <div className="space-y-2.5">
        {records.length === 0 && <p className="text-xs text-[#6c7086] text-center py-6">还没有记录</p>}
        {records.map((r) => (
          <div key={r.id} className="bg-[#313244] rounded-lg p-3 flex items-start gap-3">
            <div
              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: DOMAIN_COLORS[r.domain as keyof typeof DOMAIN_COLORS] || "#6b7280" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {r.domain && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: DOMAIN_COLORS[r.domain as keyof typeof DOMAIN_COLORS], backgroundColor: DOMAIN_COLORS[r.domain as keyof typeof DOMAIN_COLORS] + "20" }}>
                    {r.domain}
                  </span>
                )}
                {r.project_name && <span className="text-[10px] text-[#a6adc8]">{r.project_name}</span>}
              </div>
              <p className="text-sm text-[#cdd6f4] mt-0.5">{r.content || r.raw_input}</p>
              {r.output && <p className="text-xs text-[#a6e3a1] mt-0.5">产出: {r.output}</p>}
            </div>
            <span className="text-[10px] text-[#6c7086] shrink-0">
              {new Date(r.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
