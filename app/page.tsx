"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  title: string;
  completed: boolean;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  status: "active" | "inactive" | "archived" | "completed";
  dueDate?: string;
  tasks: Task[];
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalProjects: number;
  activeProjects: number;
  overdue: number;
  totalTasks: number;
}

type ProjectForm = {
  name: string;
  description: string;
  status: Project["status"];
  active: boolean;
  dueDate: string;
  tasks: { id: string; title: string; completed: boolean }[];
};

// ─── Colour palette per status ────────────────────────────────────────────────

const STATUS_COLOR: Record<Project["status"], string> = {
  active:    "#3ab57a",
  completed: "#3a8fb5",
  inactive:  "#aaa9a0",
  archived:  "#d4873a",
};

const PROJECT_PALETTE = ["#d4873a", "#3a8fb5", "#b53a72", "#3ab57a", "#7a3ab5", "#b5a03a"];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return Date.parse(dueDate) < Date.now();
}

function completionRate(projects: Project[]) {
  const total = projects.reduce((a, p) => a + (p.tasks?.length ?? p.tasksCount ?? 0), 0);
  const done  = projects.reduce((a, p) => a + (p.tasks?.filter((t) => t.completed).length ?? 0), 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function completedTaskCount(projects: Project[]) {
  return projects.reduce((a, p) => a + (p.tasks?.filter((t) => t.completed).length ?? 0), 0);
}

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(current);
    }, 18);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── RingChart ────────────────────────────────────────────────────────────────

function RingChart({ percent, color, size = 88 }: { percent: number; color: string; size?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#ede7dc" strokeWidth="7" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

// ─── ProjectFormModal (create + edit) ─────────────────────────────────────────

function ProjectFormModal({
  initial,
  onClose,
  onDone,
}: {
  initial?: Project;
  onClose: () => void;
  onDone: (p: Project) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ProjectForm>({
    name:        initial?.name ?? "",
    description: initial?.description ?? "",
    status:      initial?.status ?? "active",
    active:      initial?.active ?? true,
    dueDate:     initial?.dueDate ? initial.dueDate.slice(0, 10) : "",
    tasks:       initial?.tasks?.map((t, i) => ({ id: String(i), ...t })) ?? [],
  });
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState<string | null>(null);

  function setF<K extends keyof ProjectForm>(k: K, v: ProjectForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setF("tasks", [...form.tasks, { id: crypto.randomUUID(), title, completed: false }]);
    setNewTask("");
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        status:      form.status,
        active:      form.active,
        dueDate:     form.dueDate || undefined,
        tasks:       form.tasks.map(({ title, completed }) => ({ title, completed })),
      };
      const { data } = isEdit
        ? await axios.put<Project>(`/api/projects?id=${initial!._id}`, payload)
        : await axios.post<Project>("/api/projects", payload);
      onDone(data);
    } catch (e: unknown) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.details ?? e.message) : String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1a1612]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[8px] bg-[#fdfaf5] border border-[#e2dbd0] shadow-2xl overflow-hidden">
        {/* header accent */}
        <div className="h-[3px] w-full bg-[#d4873a]" />

        <div className="px-7 py-6 border-b border-[#ede7dc] flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[3px] uppercase text-[#d4873a]">{isEdit ? "Edit Project" : "New Project"}</p>
            <h2 className="font-['Libre_Baskerville',serif] text-[1.3rem] text-[#1a1612] mt-[2px]">
              {isEdit ? initial!.name : "Create a Project"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#3a3228] transition-colors text-[1.4rem] leading-none">&times;</button>
        </div>

        <div className="px-7 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="text-[11px] text-[#c0503a] bg-[#c0503a0d] border border-[#c0503a33] rounded-[4px] px-4 py-2.5">{error}</p>
          )}

          {/* Name */}
          <div>
            <label className="block text-[9px] tracking-[3px] uppercase text-[#aaa] mb-[6px]">Name *</label>
            <input
              value={form.name} onChange={(e) => setF("name", e.target.value)}
              placeholder="e.g. Brand Redesign"
              className="w-full bg-[#f5f0e8] border border-[#ddd5c8] rounded-[4px] px-[14px] py-[10px] text-[12px] text-[#3a3228] placeholder-[#ccc] focus:outline-none focus:border-[#d4873a] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[9px] tracking-[3px] uppercase text-[#aaa] mb-[6px]">Description</label>
            <textarea
              rows={2} value={form.description} onChange={(e) => setF("description", e.target.value)}
              placeholder="What is this project about?"
              className="w-full bg-[#f5f0e8] border border-[#ddd5c8] rounded-[4px] px-[14px] py-[10px] text-[12px] text-[#3a3228] placeholder-[#ccc] focus:outline-none focus:border-[#d4873a] transition-colors resize-none"
            />
          </div>

          {/* Status + Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#aaa] mb-[6px]">Status</label>
              <select
                value={form.status} onChange={(e) => setF("status", e.target.value as Project["status"])}
                className="w-full bg-[#f5f0e8] border border-[#ddd5c8] rounded-[4px] px-[14px] py-[10px] text-[12px] text-[#3a3228] focus:outline-none focus:border-[#d4873a] transition-colors"
              >
                {(["active", "inactive", "completed", "archived"] as const).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] tracking-[3px] uppercase text-[#aaa] mb-[6px]">Due Date</label>
              <input
                type="date" value={form.dueDate} onChange={(e) => setF("dueDate", e.target.value)}
                className="w-full bg-[#f5f0e8] border border-[#ddd5c8] rounded-[4px] px-[14px] py-[10px] text-[12px] text-[#3a3228] focus:outline-none focus:border-[#d4873a] transition-colors"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-[#f5f0e8] border border-[#ddd5c8] rounded-[4px] px-[14px] py-[10px]">
            <span className="text-[11px] text-[#3a3228]">Mark as active</span>
            <div
              onClick={() => setF("active", !form.active)}
              className="relative w-[36px] h-[18px] rounded-full cursor-pointer transition-colors duration-200"
              style={{ background: form.active ? "#d4873a" : "#ddd5c8" }}
            >
              <span className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-200 ${form.active ? "translate-x-[18px]" : ""}`} />
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-[8px]">
              <label className="text-[9px] tracking-[3px] uppercase text-[#aaa]">Tasks</label>
              {form.tasks.length > 0 && (
                <span className="text-[9px] text-[#bbb]">
                  {form.tasks.filter((t) => t.completed).length}/{form.tasks.length} done
                </span>
              )}
            </div>
            {form.tasks.length > 0 && (
              <div className="border border-[#e0d9ce] rounded-[4px] divide-y divide-[#f0ebe2] mb-[8px] overflow-hidden">
                {form.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-[9px] bg-[#fdfaf5] hover:bg-[#f5f0e8] transition-colors group">
                    <button
                      onClick={() => setF("tasks", form.tasks.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                      className="h-[14px] w-[14px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{ borderColor: task.completed ? "#3ab57a" : "#ddd5c8", background: task.completed ? "#3ab57a" : "transparent" }}
                    >
                      {task.completed && <svg className="h-[8px] w-[8px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`flex-1 text-[11px] ${task.completed ? "line-through text-[#bbb]" : "text-[#3a3228]"}`}>{task.title}</span>
                    <button
                      onClick={() => setF("tasks", form.tasks.filter((t) => t.id !== task.id))}
                      className="text-[#ddd] hover:text-[#c0503a] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="h-[12px] w-[12px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={newTask} onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                placeholder="Add a task, press Enter…"
                className="flex-1 bg-[#f5f0e8] border border-[#ddd5c8] rounded-[4px] px-[12px] py-[8px] text-[11px] text-[#3a3228] placeholder-[#ccc] focus:outline-none focus:border-[#d4873a] transition-colors"
              />
              <button
                onClick={addTask} disabled={!newTask.trim()}
                className="px-[14px] py-[8px] text-[10px] tracking-[1px] uppercase border border-[#d4873a55] text-[#d4873a] rounded-[4px] hover:bg-[#d4873a10] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Add</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-7 py-4 bg-[#f5f0e8] border-t border-[#ede7dc]">
          <button onClick={onClose} className="flex-1 rounded-[4px] border border-[#ddd5c8] py-[10px] text-[10px] tracking-[1px] uppercase text-[#999] hover:text-[#3a3228] hover:border-[#c8b99e] transition-colors bg-[#fdfaf5]">
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-[4px] py-[10px] text-[10px] tracking-[1px] uppercase text-white font-medium transition-all disabled:opacity-50"
            style={{ background: "#d4873a" }}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({
  project,
  onClose,
  onDone,
}: {
  project: Project;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true); setError(null);
    try {
      await axios.delete(`/api/projects?id=${project._id}`);
      onDone(project._id);
    } catch (e: unknown) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.details ?? e.message) : String(e));
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1a1612]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-[8px] bg-[#fdfaf5] border border-[#e2dbd0] shadow-2xl overflow-hidden">
        <div className="h-[3px] w-full bg-[#c0503a]" />
        <div className="px-7 py-7 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#c0503a0d] border border-[#c0503a22]">
            <svg className="h-5 w-5 text-[#c0503a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="font-['Libre_Baskerville',serif] text-[1rem] text-[#1a1612]">Delete &quot;{project.name}&quot;?</p>
          <p className="text-[11px] text-[#bbb] leading-relaxed">This action is permanent and cannot be undone.</p>
          {error && <p className="text-[11px] text-[#c0503a]">{error}</p>}
        </div>
        <div className="flex gap-3 px-7 pb-6">
          <button onClick={onClose} className="flex-1 rounded-[4px] border border-[#ddd5c8] py-[10px] text-[10px] tracking-[1px] uppercase text-[#999] hover:text-[#3a3228] transition-colors bg-[#fdfaf5]">Cancel</button>
          <button
            onClick={handleDelete} disabled={deleting}
            className="flex-1 rounded-[4px] py-[10px] text-[10px] tracking-[1px] uppercase text-white disabled:opacity-50 transition-colors"
            style={{ background: "#c0503a" }}
          >{deleting ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [projects, setProjects]     = useState<Project[]>([]);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mounted, setMounted]       = useState(false);

  const [showCreate, setShowCreate]           = useState(false);
  const [editTarget, setEditTarget]           = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<Project | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const { data } = await axios.get<{ projects: Project[]; summary: Summary }>("/api/projects");
      setProjects(data.projects);
      setSummary(data.summary);
    } catch (e: unknown) {
      setFetchError(axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [fetchData]);

  function handleCreated(p: Project) {
    setProjects((prev) => [p, ...prev]);
    setSummary((s) => s ? { ...s, totalProjects: s.totalProjects + 1 } : s);
    setShowCreate(false);
  }

  function handleUpdated(p: Project) {
    setProjects((prev) => prev.map((x) => x._id === p._id ? p : x));
    setEditTarget(null);
  }

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p._id !== id));
    setSummary((s) => s ? { ...s, totalProjects: s.totalProjects - 1 } : s);
    setDeleteTarget(null);
  }

  const rate      = completionRate(projects);
  const doneCount = completedTaskCount(projects);
  const today     = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  const totalTasks  = summary?.totalTasks  ?? 0;
  const activeCount = summary?.activeProjects ?? 0;
  const overdueCount = summary?.overdue ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Mono:wght@300;400&display=swap');
        @keyframes dbFadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="min-h-screen bg-[#f5f0e8] text-[#1a1612] font-['DM_Mono',monospace] px-[52px] py-[48px] relative before:fixed before:inset-0 before:pointer-events-none before:z-0 before:bg-[radial-gradient(circle_at_10%_15%,#d4873a12_0%,transparent_50%),radial-gradient(circle_at_88%_82%,#3a8fb510_0%,transparent_50%)]">
        <div className="relative z-10 max-w-[1200px] mx-auto">

          {/* ── HEADER ── */}
          <div className="flex justify-between items-end mb-[36px]">
            <div>
              <p className="text-[10px] tracking-[4px] uppercase text-[#d4873a] mb-[10px]">Analytics Overview</p>
              <h1 className="font-['Libre_Baskerville',serif] text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[#1a1612]">
                Task Intelligence<br />Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-[10px]">
              <div className="text-[10px] tracking-[2px] uppercase text-[#999] border border-[#ddd5c8] px-[16px] py-[8px] rounded-[2px] bg-[#fdfaf5]">{today}</div>
              <button
                onClick={fetchData}
                className="text-[10px] tracking-[2px] uppercase text-[#d4873a] border border-[#d4873a55] px-[14px] py-[8px] rounded-[2px] bg-[#fdfaf5] hover:bg-[#d4873a0d] transition-colors flex items-center gap-[6px]"
              >
                <svg className={`h-[11px] w-[11px] ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="text-[10px] tracking-[2px] uppercase text-white px-[16px] py-[8px] rounded-[2px] transition-colors flex items-center gap-[6px]"
                style={{ background: "#d4873a" }}
              >
                <svg className="h-[11px] w-[11px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-[linear-gradient(90deg,#d4873a55,transparent)] mb-[32px]" />

          {/* ── FETCH ERROR ── */}
          {fetchError && (
            <div className="mb-[20px] rounded-[4px] bg-[#c0503a0d] border border-[#c0503a33] px-[16px] py-[12px] text-[11px] text-[#c0503a]">
              {fetchError}
            </div>
          )}

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-3 gap-[16px] mb-[20px]">
            {[
              { label: "Total Tasks",      value: totalTasks,   suffix: "",  accent: "#d4873a", sub: `Across ${activeCount} active projects`, tag: "All time" },
              { label: "Completion Rate",  value: rate,         suffix: "%", accent: "#3ab57a", sub: `${doneCount} of ${totalTasks} done`,    tag: "Current sprint" },
              { label: "Active Projects",  value: activeCount,  suffix: "",  accent: "#3a8fb5", sub: `${overdueCount} tasks overdue`,         tag: "In progress" },
            ].map((card, i) => (
              <div
                key={card.label}
                className="bg-[#fdfaf5] border border-[#e2dbd0] rounded-[6px] p-[28px] relative overflow-hidden transition-[box-shadow,transform,border-color] duration-250 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] hover:-translate-y-[3px] hover:border-[#c8b99e] opacity-0 translate-y-[16px] animate-[dbFadeUp_0.5s_forwards]"
                style={{ animationDelay: `${0.08 + i * 0.1}s` }}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px]" style={{ background: card.accent }} />
                <p className="text-[9px] tracking-[3px] uppercase text-[#aaa] mb-[14px]">{card.label}</p>
                {loading ? (
                  <div className="h-[58px] w-[80px] bg-[#ede7dc] rounded-[4px] animate-pulse" />
                ) : (
                  <p className="font-['Libre_Baskerville',serif] text-[3.8rem] font-normal leading-none" style={{ color: card.accent }}>
                    {mounted ? <AnimatedNumber value={card.value} suffix={card.suffix} /> : "—"}
                  </p>
                )}
                <p className="text-[10px] text-[#bbb] mt-[10px]">{card.sub}</p>
                <span className="absolute bottom-[18px] right-[20px] text-[8px] tracking-[2px] uppercase text-[#ccc]">{card.tag}</span>
              </div>
            ))}
          </div>

          {/* ── LOWER GRID ── */}
          <div className="grid grid-cols-[1.4fr_1fr] gap-[16px]">

            {/* LEFT — Project Breakdown + Recent Activity */}
            <div className="bg-[#fdfaf5] border border-[#e2dbd0] rounded-[6px] p-[28px] opacity-0 translate-y-[16px] animate-[dbFadeUp_0.5s_forwards]" style={{ animationDelay: "0.42s" }}>
              <div className="flex items-center justify-between mb-[20px] pb-[14px] border-b border-[#ede7dc]">
                <p className="text-[9px] tracking-[4px] uppercase text-[#d4873a]">Project Breakdown</p>
                <span className="text-[9px] text-[#bbb]">{projects.length} total</span>
              </div>

              {loading && (
                <div className="space-y-[18px]">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-[7px]">
                      <div className="h-[10px] w-[40%] bg-[#ede7dc] rounded animate-pulse" />
                      <div className="h-[3px] w-full bg-[#ede7dc] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && projects.length === 0 && (
                <div className="py-[32px] text-center">
                  <p className="text-[11px] text-[#bbb] mb-[14px]">No projects yet.</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-[10px] tracking-[2px] uppercase text-[#d4873a] border border-[#d4873a55] px-[14px] py-[7px] rounded-[2px] hover:bg-[#d4873a0d] transition-colors"
                  >+ Create First Project</button>
                </div>
              )}

              {!loading && projects.map((p, i) => {
                const taskTotal = p.tasks?.length ?? p.tasksCount ?? 0;
                const taskDone  = p.tasks?.filter((t) => t.completed).length ?? 0;
                const pct       = taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100);
                const color     = PROJECT_PALETTE[i % PROJECT_PALETTE.length];
                const overdue   = isOverdue(p.dueDate) && p.status !== "completed";

                return (
                  <div key={p._id} className="mb-[18px] group">
                    <div className="flex justify-between items-baseline mb-[7px]">
                      <span className="text-[11px] tracking-[0.5px] text-[#3a3228]">{p.name}</span>
                      <div className="flex items-center gap-[10px]">
                        <span className="text-[9px] text-[#bbb]">{pct}% · {taskTotal} tasks</span>
                        {overdue && <span className="text-[8px] uppercase tracking-[1px] text-[#c0503a]">overdue</span>}
                        <button onClick={() => setEditTarget(p)} className="text-[9px] tracking-[1px] uppercase text-[#ccc] hover:text-[#d4873a] opacity-0 group-hover:opacity-100 transition-all">Edit</button>
                        <button onClick={() => setDeleteTarget(p)} className="text-[9px] tracking-[1px] uppercase text-[#ccc] hover:text-[#c0503a] opacity-0 group-hover:opacity-100 transition-all">Del</button>
                      </div>
                    </div>
                    <div className="h-[3px] bg-[#ede7dc] rounded-[2px] overflow-hidden">
                      <div className="h-full rounded-[2px] transition-[width] duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                        style={{ width: mounted ? `${pct}%` : "0%", background: color }} />
                    </div>
                  </div>
                );
              })}

              {/* Recent Activity */}
              <div className="mt-[26px]">
                <p className="text-[9px] tracking-[4px] uppercase text-[#d4873a] mb-[20px] pb-[14px] border-b border-[#ede7dc]">Recent Activity</p>
                {loading && (
                  <div className="space-y-[11px]">
                    {[1, 2, 3].map((i) => <div key={i} className="h-[10px] bg-[#ede7dc] rounded animate-pulse" />)}
                  </div>
                )}
                {!loading && projects.flatMap((p) =>
                  (p.tasks ?? []).slice(0, 2).map((t, ti) => ({ task: t.title, project: p.name, done: t.completed, key: `${p._id}-${ti}` }))
                ).slice(0, 5).map((item) => (
                  <div key={item.key} className="flex items-start gap-[12px] py-[11px] border-b border-[#f0ebe2] last:border-b-0">
                    <div className="w-[6px] h-[6px] rounded-full mt-[3px] shrink-0" style={{ background: item.done ? "#3ab57a" : "#d9d2c5" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-[11px] text-[#3a3228] mb-[2px]">{item.task}</p>
                      <p className="text-[9px] text-[#bbb] tracking-[1px]">{item.project}</p>
                    </div>
                    {item.done
                      ? <span className="ml-auto text-[8px] tracking-[2px] uppercase text-[#3ab57a] border border-[#3ab57a33] px-[8px] py-[2px] rounded-[2px] shrink-0 bg-[#3ab57a08]">Done</span>
                      : <span className="ml-auto text-[8px] tracking-[2px] uppercase text-[#bbb] border border-[#e0d9ce] px-[8px] py-[2px] rounded-[2px] shrink-0">Open</span>
                    }
                  </div>
                ))}
                {!loading && projects.flatMap((p) => p.tasks ?? []).length === 0 && (
                  <p className="text-[11px] text-[#bbb] py-[12px]">No tasks across projects yet.</p>
                )}
              </div>
            </div>

            {/* RIGHT — Completion + mini stats */}
            <div className="bg-[#fdfaf5] border border-[#e2dbd0] rounded-[6px] p-[28px] opacity-0 translate-y-[16px] animate-[dbFadeUp_0.5s_forwards]" style={{ animationDelay: "0.52s" }}>
              <p className="text-[9px] tracking-[4px] uppercase text-[#d4873a] mb-[20px] pb-[14px] border-b border-[#ede7dc]">Completion Overview</p>

              <div className="flex items-center gap-[22px] mb-[24px]">
                <div className="relative w-[88px] h-[88px] shrink-0">
                  <RingChart percent={mounted && !loading ? rate : 0} color="#d4873a" size={88} />
                  <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#d4873a] tracking-[1px]">
                    {loading ? "…" : `${rate}%`}
                  </div>
                </div>
                <div>
                  <p className="font-['Libre_Baskerville',serif] text-[3rem] font-normal text-[#d4873a] leading-none">
                    {loading ? "—" : (mounted ? <AnimatedNumber value={doneCount} /> : doneCount)}
                  </p>
                  <p className="text-[10px] text-[#bbb] mt-[6px] leading-[1.7]">Tasks completed<br />across all projects</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px] mb-[20px]">
                {[
                  { val: totalTasks - doneCount,  label: "Remaining",  color: "#3a3228" },
                  { val: overdueCount,             label: "Overdue",    color: "#c0503a" },
                  { val: summary?.totalProjects ?? 0, label: "Projects", color: "#3ab57a" },
                  { val: activeCount,              label: "Active",     color: "#3a8fb5" },
                ].map((m) => (
                  <div key={m.label} className="bg-[#f5f0e8] border border-[#e0d9ce] rounded-[4px] p-[14px]">
                    {loading
                      ? <div className="h-[28px] w-[40px] bg-[#ede7dc] rounded animate-pulse mb-[5px]" />
                      : <p className="font-['Libre_Baskerville',serif] text-[1.7rem] font-normal leading-none" style={{ color: m.color }}>
                          {mounted ? <AnimatedNumber value={m.val} /> : m.val}
                        </p>
                    }
                    <p className="text-[8px] tracking-[2px] uppercase text-[#bbb] mt-[5px]">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Status breakdown */}
              <div className="border border-[#e0d9ce] rounded-[4px] p-[16px] bg-[#f9f5ee]">
                <p className="text-[9px] tracking-[3px] uppercase text-[#d4873a] mb-[14px]">Status Breakdown</p>
                {(["active", "completed", "inactive", "archived"] as const).map((s) => {
                  const count = projects.filter((p) => p.status === s).length;
                  const pct   = projects.length === 0 ? 0 : Math.round((count / projects.length) * 100);
                  return (
                    <div key={s} className="mb-[10px] last:mb-0">
                      <div className="flex justify-between text-[9px] text-[#bbb] mb-[4px]">
                        <span className="capitalize">{s}</span>
                        <span>{count} · {pct}%</span>
                      </div>
                      <div className="h-[2px] bg-[#e0d9ce] rounded overflow-hidden">
                        <div className="h-full rounded transition-[width] duration-[1000ms] ease-out"
                          style={{ width: mounted && !loading ? `${pct}%` : "0%", background: STATUS_COLOR[s] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <ProjectFormModal onClose={() => setShowCreate(false)} onDone={handleCreated} />
      )}
      {editTarget && (
        <ProjectFormModal initial={editTarget} onClose={() => setEditTarget(null)} onDone={handleUpdated} />
      )}
      {deleteTarget && (
        <DeleteModal project={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={handleDeleted} />
      )}
    </>
  );
}
