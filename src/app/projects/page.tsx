"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId } from "@/lib/supabase";
import { DOMAIN_COLORS, DOMAINS, type Project, type Todo } from "@/lib/types";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTodo, setShowNewTodo] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDomain, setNewProjectDomain] = useState("其他");
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoProjectId, setNewTodoProjectId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const uid = getUserId();
    const [{ data: projs }, { data: tds }] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("todos").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    if (projs) setProjects(projs);
    if (tds) setTodos(tds);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const uid = getUserId();
    await supabase.from("projects").insert({ user_id: uid, name: newProjectName.trim(), domain: newProjectDomain });
    setNewProjectName("");
    setShowNewProject(false);
    toast.success("项目已创建");
    fetchData();
  };

  const createTodo = async () => {
    if (!newTodoText.trim()) return;
    const uid = getUserId();
    await supabase.from("todos").insert({ user_id: uid, text: newTodoText.trim(), project_id: newTodoProjectId });
    setNewTodoText("");
    setNewTodoProjectId(null);
    setShowNewTodo(false);
    toast.success("待办已添加");
    fetchData();
  };

  const updateTodoStatus = async (id: string, status: Todo["status"]) => {
    const newStatus = status === "done" ? "pending" : "done";
    await supabase.from("todos").update({ status: newStatus }).eq("id", id);
    fetchData();
  };

  const updateProjectStatus = async (id: string, status: Project["status"]) => {
    const next: Project["status"] = status === "active" ? "paused" : status === "paused" ? "completed" : "active";
    await supabase.from("projects").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  };

  const statusLabel: Record<string, string> = { active: "进行中", paused: "暂停", completed: "完成" };
  const statusColor: Record<string, string> = { active: "#a6e3a1", paused: "#f9e2af", completed: "#6c7086" };

  const getProjectName = (pid: string | null) => projects.find((p) => p.id === pid)?.name || "";

  const pendingTodos = todos.filter((t) => t.status !== "done");
  const doneTodos = todos.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6c7086]">项目与待办</p>
        <div className="flex gap-2">
          <button onClick={() => setShowNewTodo(true)} className="text-xs text-[#a6e3a1]">+待办</button>
          <button onClick={() => setShowNewProject(true)} className="text-xs text-[#cba6f7]">+项目</button>
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProject && (
        <div className="bg-[#313244] rounded-lg p-3 space-y-2">
          <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createProject()} placeholder="项目名" className="w-full bg-[#1e1e2e] rounded px-2 py-1.5 text-sm outline-none" />
          <select value={newProjectDomain} onChange={(e) => setNewProjectDomain(e.target.value)} className="w-full bg-[#1e1e2e] rounded px-2 py-1.5 text-sm outline-none">
            {DOMAINS.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
          <div className="flex gap-2">
            <button onClick={createProject} className="bg-[#cba6f7] text-[#1e1e2e] px-3 py-1 rounded text-xs font-medium">创建</button>
            <button onClick={() => setShowNewProject(false)} className="text-xs text-[#6c7086]">取消</button>
          </div>
        </div>
      )}

      {/* New Todo Dialog */}
      {showNewTodo && (
        <div className="bg-[#313244] rounded-lg p-3 space-y-2">
          <input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createTodo()} placeholder="待办内容" className="w-full bg-[#1e1e2e] rounded px-2 py-1.5 text-sm outline-none" />
          <select value={newTodoProjectId || ""} onChange={(e) => setNewTodoProjectId(e.target.value || null)} className="w-full bg-[#1e1e2e] rounded px-2 py-1.5 text-sm outline-none">
            <option value="">不关联项目</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <div className="flex gap-2">
            <button onClick={createTodo} className="bg-[#a6e3a1] text-[#1e1e2e] px-3 py-1 rounded text-xs font-medium">添加</button>
            <button onClick={() => setShowNewTodo(false)} className="text-xs text-[#6c7086]">取消</button>
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-[#a6adc8]">项目</h3>
        {projects.length === 0 && <p className="text-xs text-[#6c7086]">暂无项目</p>}
        {projects.map((p) => (
          <div key={p.id} className="bg-[#313244] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[p.domain as keyof typeof DOMAIN_COLORS] || "#6b7280" }} />
              <div>
                <p className="text-sm text-[#cdd6f4]">{p.name}</p>
                {p.progress && <p className="text-[10px] text-[#6c7086]">{p.progress}</p>}
              </div>
            </div>
            <button onClick={() => updateProjectStatus(p.id, p.status)} className="text-[10px] px-2 py-0.5 rounded" style={{ color: statusColor[p.status], backgroundColor: statusColor[p.status] + "20" }}>
              {statusLabel[p.status]}
            </button>
          </div>
        ))}
      </div>

      {/* Todos */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-[#a6adc8]">待办 ({pendingTodos.length})</h3>
        {pendingTodos.length === 0 && <p className="text-xs text-[#6c7086]">没有待办</p>}
        {pendingTodos.map((t) => (
          <div key={t.id} className="bg-[#313244] rounded-lg p-3 flex items-center gap-3 cursor-pointer" onClick={() => updateTodoStatus(t.id, t.status)}>
            <div className="w-4 h-4 rounded border border-[#45475a] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#cdd6f4] truncate">{t.text}</p>
              <div className="flex gap-2 mt-0.5">
                {t.project_id && <span className="text-[10px] text-[#cba6f7]">{getProjectName(t.project_id)}</span>}
                {t.source && <span className="text-[10px] text-[#6c7086]">来自{t.source === "thought" ? "想法" : t.source}</span>}
              </div>
            </div>
          </div>
        ))}

        {doneTodos.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-[#6c7086] mt-4">已完成 ({doneTodos.length})</h3>
            {doneTodos.map((t) => (
              <div key={t.id} className="bg-[#313244] rounded-lg p-3 flex items-center gap-3 opacity-50 cursor-pointer" onClick={() => updateTodoStatus(t.id, t.status)}>
                <div className="w-4 h-4 rounded bg-[#a6e3a1] border border-[#a6e3a1] shrink-0 flex items-center justify-center text-[10px] text-[#1e1e2e]">✓</div>
                <p className="text-sm text-[#cdd6f4] truncate">{t.text}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
