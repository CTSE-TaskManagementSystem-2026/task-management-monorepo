// this is server component because its inside the app folder so we use 'use client' to make it client component.
"use client";
import { useState, useEffect } from "react";

const stats = {
  totalTasks: 45,
  completedTasks: 32,
  completionRate: 71,
  activeProjects: 4,
  overdue: 5,
  thisWeek: 12,
};

const projects = [
  { name: "Brand Redesign", progress: 88, tasks: 14, color: "#d4873a" },
  { name: "API Integration", progress: 62, tasks: 9, color: "#3a8fb5" },
  { name: "Mobile App", progress: 45, tasks: 16, color: "#b53a72" },
  { name: "Data Pipeline", progress: 30, tasks: 6, color: "#3ab57a" },
];

const recentActivity = [
  { task: "Wireframe review completed", project: "Brand Redesign", time: "2h ago", done: true },
  { task: "Set up OAuth endpoints", project: "API Integration", time: "4h ago", done: true },
  { task: "Push notifications research", project: "Mobile App", time: "6h ago", done: false },
  { task: "ETL pipeline draft", project: "Data Pipeline", time: "1d ago", done: false },
  { task: "Color system finalized", project: "Brand Redesign", time: "1d ago", done: true },
];

const weeklyData = [40, 60, 35, 80, 55, 90, 71];
const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, 18);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

function RingChart({ percent, color, size = 88 }: { percent: number; color: string; size?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#ede7dc" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Mono:wght@300;400&display=swap');
        @keyframes dbFadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="min-h-screen bg-[#f5f0e8] text-[#1a1612] font-['DM_Mono',monospace] px-[52px] py-[48px] relative before:fixed before:inset-0 before:pointer-events-none before:z-0 before:bg-[radial-gradient(circle_at_10%_15%,#d4873a12_0%,transparent_50%),radial-gradient(circle_at_88%_82%,#3a8fb510_0%,transparent_50%)]">
        <div className="relative z-10 max-w-[1200px] mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-end mb-[36px]">
            <div>
              <p className="text-[10px] tracking-[4px] uppercase text-[#d4873a] mb-[10px]">Analytics Overview</p>
              <h1 className="font-['Libre_Baskerville',serif] text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[#1a1612]">Task Intelligence<br />Dashboard</h1>
            </div>
            <div className="text-[10px] tracking-[2px] uppercase text-[#999] border border-[#ddd5c8] px-[16px] py-[8px] rounded-[2px] bg-[#fdfaf5]">{today}</div>
          </div>

          <div className="h-[1px] bg-[linear-gradient(90deg,#d4873a55,transparent)] mb-[32px]" />

          {/* STAT CARDS */}
          <div className="grid grid-cols-3 gap-[16px] mb-[20px]">
            {[
              { label: "Total Tasks", value: stats.totalTasks, suffix: "", accent: "#d4873a", sub: `Across ${stats.activeProjects} active projects`, tag: "All time" },
              { label: "Completion Rate", value: stats.completionRate, suffix: "%", accent: "#3ab57a", sub: `${stats.completedTasks} of ${stats.totalTasks} done`, tag: "↑ 4% vs last week" },
              { label: "Active Projects", value: stats.activeProjects, suffix: "", accent: "#3a8fb5", sub: `${stats.overdue} tasks overdue`, tag: "In progress" },
            ].map((card, i) => (
              <div 
                className="bg-[#fdfaf5] border border-[#e2dbd0] rounded-[6px] p-[28px] relative overflow-hidden transition-[box-shadow,transform,border-color] duration-250 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] hover:-translate-y-[3px] hover:border-[#c8b99e] opacity-0 translate-y-[16px] animate-[dbFadeUp_0.5s_forwards]" 
                key={card.label}
                style={{ animationDelay: `${0.08 + i * 0.1}s` }}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px]" style={{ background: card.accent }} />
                <p className="text-[9px] tracking-[3px] uppercase text-[#aaa] mb-[14px]">{card.label}</p>
                <p className="font-['Libre_Baskerville',serif] text-[3.8rem] font-normal leading-none" style={{ color: card.accent }}>
                  {mounted ? <AnimatedNumber value={card.value} suffix={card.suffix} /> : "—"}
                </p>
                <p className="text-[10px] text-[#bbb] mt-[10px]">{card.sub}</p>
                <span className="absolute bottom-[18px] right-[20px] text-[8px] tracking-[2px] uppercase text-[#ccc]">{card.tag}</span>
              </div>
            ))}
          </div>

          {/* LOWER */}
          <div className="grid grid-cols-[1.4fr_1fr] gap-[16px]">
            {/* LEFT */}
            <div className="bg-[#fdfaf5] border border-[#e2dbd0] rounded-[6px] p-[28px] opacity-0 translate-y-[16px] animate-[dbFadeUp_0.5s_forwards]" style={{ animationDelay: '0.42s' }}>
              <p className="text-[9px] tracking-[4px] uppercase text-[#d4873a] mb-[20px] pb-[14px] border-b border-[#ede7dc]">Project Breakdown</p>
              {projects.map((p) => (
                <div className="mb-[18px]" key={p.name}>
                  <div className="flex justify-between items-baseline mb-[7px]">
                    <span className="text-[11px] tracking-[0.5px] text-[#3a3228]">{p.name}</span>
                    <span className="text-[10px] text-[#bbb]">{p.progress}% · {p.tasks} tasks</span>
                  </div>
                  <div className="h-[3px] bg-[#ede7dc] rounded-[2px] overflow-hidden">
                    <div className="h-full rounded-[2px] transition-[width] duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ width: mounted ? `${p.progress}%` : "0%", background: p.color }} />
                  </div>
                </div>
              ))}

              <div className="mt-[26px]">
                <p className="text-[9px] tracking-[4px] uppercase text-[#d4873a] mb-[20px] pb-[14px] border-b border-[#ede7dc]">Recent Activity</p>
                {recentActivity.map((item, i) => (
                  <div className="flex items-start gap-[12px] py-[11px] border-b border-[#f0ebe2] last:border-b-0" key={i}>
                    <div className="w-[6px] h-[6px] rounded-full mt-[3px] shrink-0" style={{ background: item.done ? "#3ab57a" : "#d9d2c5" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-[11px] text-[#3a3228] mb-[2px]">{item.task}</p>
                      <p className="text-[9px] text-[#bbb] tracking-[1px]">{item.project} · {item.time}</p>
                    </div>
                    {item.done
                      ? <span className="ml-auto text-[8px] tracking-[2px] uppercase text-[#3ab57a] border border-[#3ab57a33] px-[8px] py-[2px] rounded-[2px] shrink-0 bg-[#3ab57a08]">Done</span>
                      : <span className="ml-auto text-[8px] tracking-[2px] uppercase text-[#bbb] border border-[#e0d9ce] px-[8px] py-[2px] rounded-[2px] shrink-0">Open</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-[#fdfaf5] border border-[#e2dbd0] rounded-[6px] p-[28px] opacity-0 translate-y-[16px] animate-[dbFadeUp_0.5s_forwards]" style={{ animationDelay: '0.52s' }}>
              <p className="text-[9px] tracking-[4px] uppercase text-[#d4873a] mb-[20px] pb-[14px] border-b border-[#ede7dc]">Completion Overview</p>

              <div className="flex items-center gap-[22px] mb-[24px]">
                <div className="relative w-[88px] h-[88px] shrink-0">
                  <RingChart percent={mounted ? stats.completionRate : 0} color="#d4873a" size={88} />
                  <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#d4873a] tracking-[1px]">{stats.completionRate}%</div>
                </div>
                <div>
                  <p className="font-['Libre_Baskerville',serif] text-[3rem] font-normal text-[#d4873a] leading-none">{stats.completedTasks}</p>
                  <p className="text-[10px] text-[#bbb] mt-[6px] leading-[1.7]">Tasks completed<br />this sprint</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[10px] mb-[20px]">
                {[
                  { val: stats.thisWeek, label: "This week", color: "#3a8fb5" },
                  { val: stats.overdue, label: "Overdue", color: "#c0503a" },
                  { val: stats.totalTasks - stats.completedTasks, label: "Remaining", color: "#3a3228" },
                  { val: stats.activeProjects, label: "Projects", color: "#3ab57a" },
                ].map((m) => (
                  <div className="bg-[#f5f0e8] border border-[#e0d9ce] rounded-[4px] p-[14px]" key={m.label}>
                    <p className="font-['Libre_Baskerville',serif] text-[1.7rem] font-normal leading-none" style={{ color: m.color }}>
                      {mounted ? <AnimatedNumber value={m.val} /> : "—"}
                    </p>
                    <p className="text-[8px] tracking-[2px] uppercase text-[#bbb] mt-[5px]">{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="border border-[#e0d9ce] rounded-[4px] p-[16px] bg-[#f9f5ee]">
                <p className="text-[9px] tracking-[3px] uppercase text-[#d4873a] mb-[12px]">Weekly Pulse</p>
                <div className="flex gap-[5px] items-end h-[40px]">
                  {weeklyData.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-[2px]"
                      style={{
                        height: mounted ? `${h}%` : "0%",
                        background: i === 6 ? "#d4873a" : "#e0d9ce",
                        transition: `height 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.07}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-[6px]">
                  {weekDays.map((d, i) => (
                    <span key={i} className={i === 6 ? "text-[8px] text-[#d4873a] tracking-[1px]" : "text-[8px] text-[#ccc] tracking-[1px]"}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
