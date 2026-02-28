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
  { name: "Brand Redesign", progress: 88, tasks: 14, color: "#c8a96e" },
  { name: "API Integration", progress: 62, tasks: 9, color: "#7eb8c9" },
  { name: "Mobile App", progress: 45, tasks: 16, color: "#c97e9a" },
  { name: "Data Pipeline", progress: 30, tasks: 6, color: "#7ec9a0" },
];

const recentActivity = [
  { task: "Wireframe review completed", project: "Brand Redesign", time: "2h ago", done: true },
  { task: "Set up OAuth endpoints", project: "API Integration", time: "4h ago", done: true },
  { task: "Push notifications research", project: "Mobile App", time: "6h ago", done: false },
  { task: "ETL pipeline draft", project: "Data Pipeline", time: "1d ago", done: false },
  { task: "Color system finalized", project: "Brand Redesign", time: "1d ago", done: true },
];

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 18);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

function RingChart({ percent, color, size = 80 }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        .dash-root {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e8e2d9;
          font-family: 'DM Mono', monospace;
          position: relative;
          overflow: hidden;
          padding: 48px 52px;
        }
        .bg-orb {
          position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0;
        }
        .orb1 { width: 600px; height: 600px; background: radial-gradient(circle, #c8a96e18 0%, transparent 70%); top: -200px; left: -100px; }
        .orb2 { width: 500px; height: 500px; background: radial-gradient(circle, #7eb8c915 0%, transparent 70%); bottom: -100px; right: -100px; }
        .content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 52px; }
        .eyebrow {
          font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
          color: #c8a96e; margin-bottom: 10px; opacity: 0.9;
        }
        .headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          font-weight: 300; line-height: 1.05;
          letter-spacing: -0.02em; color: #f0ead9;
        }
        .date-badge {
          font-size: 11px; letter-spacing: 2px; color: #888;
          border: 1px solid #2a2a35; padding: 8px 16px; border-radius: 2px;
          text-transform: uppercase;
        }
        .divider { height: 1px; background: linear-gradient(90deg, #c8a96e44, transparent); margin-bottom: 40px; }

        /* STAT CARDS */
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
        @media(max-width:768px) { .stat-grid { grid-template-columns: 1fr; } }

        .stat-card {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #13131a 0%, #0f0f15 100%);
          border: 1px solid #1e1e2a;
          border-radius: 4px; padding: 28px 28px 24px;
          transition: border-color 0.3s, transform 0.3s;
          opacity: 0; transform: translateY(20px);
          animation: fadeUp 0.5s forwards;
        }
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:hover { border-color: #c8a96e44; transform: translateY(-2px); }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent, #c8a96e), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .stat-card:hover::before { opacity: 1; }
        .stat-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 16px; }
        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem; font-weight: 300; line-height: 1;
          color: var(--accent, #e8e2d9);
          filter: drop-shadow(0 0 20px var(--accent, transparent));
        }
        .stat-sub { font-size: 10px; color: #555; margin-top: 12px; letter-spacing: 1px; }
        .stat-corner {
          position: absolute; bottom: 20px; right: 24px;
          font-size: 9px; letter-spacing: 2px; color: #333; text-transform: uppercase;
        }

        /* PROGRESS SECTION */
        .lower-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
        @media(max-width:900px) { .lower-grid { grid-template-columns: 1fr; } }

        .card {
          background: linear-gradient(135deg, #13131a, #0f0f15);
          border: 1px solid #1e1e2a; border-radius: 4px; padding: 28px;
          opacity: 0; transform: translateY(20px); animation: fadeUp 0.5s forwards;
        }
        .card:nth-child(1) { animation-delay: 0.45s; }
        .card:nth-child(2) { animation-delay: 0.55s; }
        .card-title {
          font-size: 9px; letter-spacing: 4px; text-transform: uppercase;
          color: #c8a96e; margin-bottom: 24px; padding-bottom: 16px;
          border-bottom: 1px solid #1e1e2a;
        }

        /* PROJECT ROWS */
        .project-row { margin-bottom: 22px; }
        .project-meta { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .project-name { font-size: 12px; letter-spacing: 1px; color: #ccc; }
        .project-stat { font-size: 10px; color: #555; }
        .progress-track {
          height: 2px; background: #1a1a25; border-radius: 1px; overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 1px;
          transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 8px var(--color);
        }

        /* ACTIVITY */
        .activity-item {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 12px 0; border-bottom: 1px solid #13131f;
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-dot {
          width: 6px; height: 6px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
        }
        .activity-task { font-size: 11px; color: #bbb; margin-bottom: 3px; letter-spacing: 0.5px; }
        .activity-meta { font-size: 9px; color: #444; letter-spacing: 1px; }
        .done-tag {
          margin-left: auto; font-size: 8px; letter-spacing: 2px; text-transform: uppercase;
          color: #7ec9a0; border: 1px solid #7ec9a033; padding: 2px 8px; border-radius: 1px; flex-shrink: 0;
        }
        .pending-tag {
          margin-left: auto; font-size: 8px; letter-spacing: 2px; text-transform: uppercase;
          color: #888; border: 1px solid #2a2a35; padding: 2px 8px; border-radius: 1px; flex-shrink: 0;
        }

        /* COMPLETION RING CARD */
        .ring-card-inner { display: flex; align-items: center; gap: 28px; margin-bottom: 28px; }
        .ring-label { font-family: 'Cormorant Garamond', serif; font-size: 3rem; font-weight: 300; color: #c8a96e; }
        .ring-desc { font-size: 10px; color: #555; letter-spacing: 1px; margin-top: 4px; }
        .mini-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mini-stat {
          background: #0f0f15; border: 1px solid #1a1a25; border-radius: 3px; padding: 14px;
        }
        .mini-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 300; }
        .mini-stat-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-top: 4px; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="dash-root">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />

        <div className="content">
          {/* HEADER */}
          <div className="header">
            <div>
              <p className="eyebrow">Analytics Overview</p>
              <h1 className="headline">Task Intelligence<br/>Dashboard</h1>
            </div>
            <div className="date-badge">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="divider" />

          {/* TOP STAT CARDS */}
          <div className="stat-grid">
            <div className="stat-card" style={{ "--accent": "#c8a96e" }}>
              <p className="stat-label">Total Tasks</p>
              <p className="stat-value">{mounted ? <AnimatedNumber value={stats.totalTasks} /> : "—"}</p>
              <p className="stat-sub">Across {stats.activeProjects} active projects</p>
              <span className="stat-corner">All time</span>
            </div>
            <div className="stat-card" style={{ "--accent": "#7ec9a0" }}>
              <p className="stat-label">Completion Rate</p>
              <p className="stat-value">{mounted ? <AnimatedNumber value={stats.completionRate} suffix="%" /> : "—"}</p>
              <p className="stat-sub">{stats.completedTasks} of {stats.totalTasks} tasks done</p>
              <span className="stat-corner">↑ 4% vs last week</span>
            </div>
            <div className="stat-card" style={{ "--accent": "#7eb8c9" }}>
              <p className="stat-label">Active Projects</p>
              <p className="stat-value">{mounted ? <AnimatedNumber value={stats.activeProjects} /> : "—"}</p>
              <p className="stat-sub">{stats.overdue} tasks overdue</p>
              <span className="stat-corner">In progress</span>
            </div>
          </div>

          {/* LOWER SECTION */}
          <div className="lower-grid">
            {/* PROJECT PROGRESS */}
            <div className="card">
              <p className="card-title">Project Breakdown</p>
              {projects.map((p) => (
                <div className="project-row" key={p.name}>
                  <div className="project-meta">
                    <span className="project-name">{p.name}</span>
                    <span className="project-stat">{p.progress}% · {p.tasks} tasks</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: mounted ? `${p.progress}%` : "0%", background: p.color, "--color": p.color }}
                    />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 32 }}>
                <p className="card-title" style={{ marginBottom: 18 }}>Recent Activity</p>
                {recentActivity.map((item, i) => (
                  <div className="activity-item" key={i}>
                    <div className="activity-dot" style={{ background: item.done ? "#7ec9a0" : "#333" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="activity-task">{item.task}</p>
                      <p className="activity-meta">{item.project} · {item.time}</p>
                    </div>
                    <span className={item.done ? "done-tag" : "pending-tag"}>{item.done ? "Done" : "Open"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RING + MINI STATS */}
            <div className="card">
              <p className="card-title">Completion Overview</p>

              <div className="ring-card-inner">
                <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                  <RingChart percent={mounted ? stats.completionRate : 0} color="#c8a96e" />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", fontFamily: "'DM Mono', monospace",
                    fontSize: 13, color: "#c8a96e"
                  }}>
                    {stats.completionRate}%
                  </div>
                </div>
                <div>
                  <p className="ring-label">{stats.completedTasks}</p>
                  <p className="ring-desc">Tasks completed<br/>this sprint</p>
                </div>
              </div>

              <div className="mini-stats">
                {[
                  { val: stats.thisWeek, label: "This week", color: "#7eb8c9" },
                  { val: stats.overdue, label: "Overdue", color: "#c97e7e" },
                  { val: stats.totalTasks - stats.completedTasks, label: "Remaining", color: "#888" },
                  { val: stats.activeProjects, label: "Projects", color: "#7ec9a0" },
                ].map((m) => (
                  <div className="mini-stat" key={m.label}>
                    <p className="mini-stat-val" style={{ color: m.color }}>
                      {mounted ? <AnimatedNumber value={m.val} /> : "—"}
                    </p>
                    <p className="mini-stat-label">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Subtle decorative element */}
              <div style={{
                marginTop: 28, padding: 16,
                border: "1px solid #1e1e2a", borderRadius: 3,
                background: "linear-gradient(135deg, #0f0f18, #0a0a12)",
                fontFamily: "'DM Mono', monospace",
              }}>
                <p style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#c8a96e", marginBottom: 8 }}>
                  Weekly Pulse
                </p>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36 }}>
                  {[40, 60, 35, 80, 55, 90, 71].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, borderRadius: 1,
                      background: i === 6 ? "#c8a96e" : "#1e1e2a",
                      height: `${h}%`,
                      transition: `height 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.07}s`,
                      boxShadow: i === 6 ? "0 0 8px #c8a96e66" : "none",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <span key={i} style={{ fontSize: 8, color: i === 6 ? "#c8a96e" : "#333", letterSpacing: 1 }}>{d}</span>
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
