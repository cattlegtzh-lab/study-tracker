"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import { DOMAINS, type Project, type Todo } from "@/lib/types";
import toast from "react-hot-toast";

const domainColors: Record<string, string> = {
  "政经": "#e8b4a2", "西语": "#a2c4e8", "史学": "#e8d4a2",
  "写作": "#c4a2e8", "RA": "#a2e8c4", "专四": "#e8a2c4", "其他": "#b0a89c",
};
const statusLabel: Record<string, string> = { active: "进行中", paused: "暂停", completed: "完成" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTodo, setShowNewTodo] = useState(false);
  const [npName, setNpName] = useState(""); const [npDomain, setNpDomain] = useState("其他");
  const [ntText, setNtText] = useState(""); const [ntPid, setNtPid] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const uid = getUserId();
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("todos").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    if (p) setProjects(p); if (t) setTodos(t);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createProject = async () => {
    if (!npName.trim()) return;
    await supabase.from("projects").insert({ user_id: getUserId(), name: npName.trim(), domain: npDomain });
    setNpName(""); setShowNewProject(false); toast.success("已创建"); fetchData();
  };
  const createTodo = async () => {
    if (!ntText.trim()) return;
    await supabase.from("todos").insert({ user_id: getUserId(), text: ntText.trim(), project_id: ntPid });
    setNtText(""); setNtPid(null); setShowNewTodo(false); toast.success("已添加"); fetchData();
  };
  const toggleTodo = async (id: string, status: string) => {
    await supabase.from("todos").update({ status: status === "done" ? "pending" : "done" }).eq("id", id);
    fetchData();
  };
  const cycleProject = async (id: string, status: string) => {
    const next = status === "active" ? "paused" : status === "paused" ? "completed" : "active";
    await supabase.from("projects").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  };

  const getProjectName = (pid: string | null) => projects.find((p) => p.id === pid)?.name || "";
  const pendingTodos = todos.filter((t) => t.status !== "done");
  const doneTodos = todos.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#b0a89c]">项目与待办</span>
        <div className="flex gap-3">
          <button onClick={() => setShowNewTodo(true)} className="text-xs text-[#a0c4a0]">+ 待办</button>
          <button onClick={() => setShowNewProject(true)} className="text-xs text-[#c4a07a]">+ 项目</button>
        </div>
      </div>

      {showNewProject && (
        <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 space-y-2">
          <input value={npName} onChange={(e) => setNpName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createProject()} placeholder="项目名" className="w-full bg-[#faf8f5] rounded-lg px-3 py-2 text-sm outline-none border border-[#f0ebe3]" />
          <select value={npDomain} onChange={(e) => setNpDomain(e.target.value)} className="w-full bg-[#faf8f5] rounded-lg px-3 py-2 text-sm outline-none border border-[#f0ebe3]">{DOMAINS.map((d) => (<option key={d} value={d}>{d}</option>))}</select>
          <div className="flex gap-2"><button onClick={createProject} className="bg-[#c4a07a] text-white px-4 py-1.5 rounded-lg text-xs font-medium">创建</button><button onClick={() => setShowNewProject(false)} className="text-xs text-[#b0a89c]">取消</button></div>
        </div>
      )}

      {showNewTodo && (
        <div className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 space-y-2">
          <input value={ntText} onChange={(e) => setNtText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createTodo()} placeholder="待办内容" className="w-full bg-[#faf8f5] rounded-lg px-3 py-2 text-sm outline-none border border-[#f0ebe3]" />
          <select value={ntPid || ""} onChange={(e) => setNtPid(e.target.value || null)} className="w-full bg-[#faf8f5] rounded-lg px-3 py-2 text-sm outline-none border border-[#f0ebe3]"><option value="">不关联项目</option>{projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <div className="flex gap-2"><button onClick={createTodo} className="bg-[#a0c4a0] text-white px-4 py-1.5 rounded-lg text-xs font-medium">添加</button><button onClick={() => setShowNewTodo(false)} className="text-xs text-[#b0a89c]">取消</button></div>
        </div>
      )}

      {projects.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domainColors[p.domain || "其他"] }} />
            <div>
              <p className="text-sm text-[#555]">{p.name}</p>
              {p.progress && <p className="text-[11px] text-[#c4b9a8]">{p.progress}</p>}
            </div>
          </div>
          <button onClick={() => cycleProject(p.id, p.status)} className="text-[11px] px-2.5 py-1 rounded-full border border-[#f0ebe3] text-[#b0a89c]">{statusLabel[p.status]}</button>
        </div>
      ))}

      {pendingTodos.length > 0 && <h3 className="text-xs text-[#b0a89c] mt-2">待办 ({pendingTodos.length})</h3>}
      {pendingTodos.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-[#f0ebe3] shadow-sm p-4 flex items-center gap-3 cursor-pointer" onClick={() => toggleTodo(t.id, t.status)}>
          <div className="w-4 h-4 rounded-full border-2 border-[#e0d8cc] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#555] truncate">{t.text}</p>
            {t.project_id && <span className="text-[10px] text-[#c4a07a]">{getProjectName(t.project_id)}</span>}
          </div>
        </div>
      ))}

      {doneTodos.length > 0 && (
        <div className="mt-4 opacity-50">
          <h3 className="text-xs text-[#b0a89c]">已完成 ({doneTodos.length})</h3>
          {doneTodos.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-[#f0ebe3] p-4 flex items-center gap-3 mt-1.5 cursor-pointer" onClick={() => toggleTodo(t.id, t.status)}>
              <div className="w-4 h-4 rounded-full bg-[#a0c4a0] border-2 border-[#a0c4a0] flex items-center justify-center text-[10px] text-white shrink-0">✓</div>
              <p className="text-sm text-[#555] truncate line-through">{t.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
