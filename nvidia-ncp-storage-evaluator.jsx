import { useState, useEffect, useRef } from "react";

// ─── DATA MODELS ────────────────────────────────────────────────────────────

const EVALUATION_CRITERIA = [
  {
    id: "performance",
    label: "Performance & Throughput",
    weight: 20,
    description: "GPU-direct RDMA, NVMe-oF, bandwidth for AI/ML workloads",
    subcriteria: ["GPU-Direct Storage support", "Throughput (GB/s)", "IOPS (millions)", "Latency (µs)", "Parallel read/write"],
  },
  {
    id: "scalability",
    label: "Scalability & Elasticity",
    weight: 15,
    description: "Petabyte-scale, auto-scaling, multi-tenant isolation",
    subcriteria: ["Max capacity (PB)", "Auto-scale policy", "Burst handling", "Multi-tenant support", "Global namespace"],
  },
  {
    id: "compatibility",
    label: "DGX Cloud Compatibility",
    weight: 20,
    description: "CUDA, NCCL, InfiniBand, certified integrations",
    subcriteria: ["CUDA integration", "NCCL support", "InfiniBand/RoCE", "NVIDIA cert status", "API compatibility"],
  },
  {
    id: "reliability",
    label: "Reliability & SLA",
    weight: 15,
    description: "Availability SLA, DR, RPO/RTO, data durability",
    subcriteria: ["Uptime SLA (%)", "Durability (nines)", "RTO (min)", "RPO (min)", "Geo-redundancy"],
  },
  {
    id: "security",
    label: "Security & Compliance",
    weight: 10,
    description: "Encryption, zero-trust, SOC2, FedRAMP, HIPAA",
    subcriteria: ["Encryption at rest", "Encryption in transit", "SOC2 Type II", "FedRAMP", "RBAC/IAM"],
  },
  {
    id: "economics",
    label: "Cost Economics",
    weight: 10,
    description: "TCO, pricing model, egress costs, commit discounts",
    subcriteria: ["$/TB/month", "Egress cost", "Commit discount", "Overage policy", "TCO vs on-prem"],
  },
  {
    id: "support",
    label: "Support & Maturity",
    weight: 5,
    description: "Vendor stability, support tier, ecosystem maturity",
    subcriteria: ["Founded/Funding stage", "Dedicated TAM", "SLA response time", "Customer references", "NVIDIA partnership tier"],
  },
  {
    id: "innovation",
    label: "Roadmap & Innovation",
    weight: 5,
    description: "AI-native features, GenAI datasets, vector store readiness",
    subcriteria: ["GenAI dataset ops", "Vector store integration", "Checkpoint optimization", "AI pipeline integration", "12-mo roadmap strength"],
  },
];

const SAMPLE_PARTNERS = [
  {
    id: "weka",
    name: "WekaFS",
    category: "High-Performance Parallel FS",
    logo: "W",
    color: "#00D4FF",
    scores: { performance: 9.2, scalability: 8.5, compatibility: 9.0, reliability: 8.8, security: 8.0, economics: 6.5, support: 8.5, innovation: 9.0 },
    highlights: ["GPU-Direct certified", "NVMe-oF native", "NVIDIA DGX reference arch"],
    risks: ["Premium pricing", "Newer enterprise track record"],
    notes: "Leading AI-native file system. Strong NVIDIA partnership.",
  },
  {
    id: "vast",
    name: "VAST Data",
    category: "AI-Native Storage",
    logo: "V",
    color: "#7C3AED",
    scores: { performance: 9.0, scalability: 9.2, compatibility: 8.8, reliability: 9.0, security: 8.5, economics: 7.0, support: 8.0, innovation: 9.5 },
    highlights: ["Disaggregated shared everything", "Strong AI workload benchmarks", "Fast-growing"],
    risks: ["Newer company (2016)", "Limited legacy enterprise refs"],
    notes: "Exceptional AI-era architecture. Top innovation score.",
  },
  {
    id: "netapp",
    name: "NetApp StorageGRID",
    category: "Enterprise Hybrid Storage",
    logo: "N",
    color: "#0067C5",
    scores: { performance: 7.5, scalability: 8.8, compatibility: 7.8, reliability: 9.5, security: 9.2, economics: 7.5, support: 9.5, innovation: 7.0 },
    highlights: ["30+ yr enterprise track record", "FedRAMP authorized", "Global support"],
    risks: ["Legacy architecture", "Slower AI-native feature velocity"],
    notes: "Safest enterprise pick. Strong for regulated industries.",
  },
  {
    id: "ddn",
    name: "DDN EXAScaler",
    category: "HPC/AI Storage",
    logo: "D",
    color: "#FF6B35",
    scores: { performance: 9.5, scalability: 9.0, compatibility: 9.2, reliability: 8.5, security: 8.0, economics: 6.0, support: 8.8, innovation: 8.5 },
    highlights: ["HPC heritage", "Lustre-based", "Top500 deployments"],
    risks: ["High cost", "Complex operations"],
    notes: "Best raw performance. Traditional HPC leader moving to AI.",
  },
  {
    id: "hammerspace",
    name: "Hammerspace",
    category: "Global Data Fabric",
    logo: "H",
    color: "#10B981",
    scores: { performance: 7.8, scalability: 9.0, compatibility: 7.5, reliability: 8.2, security: 7.8, economics: 8.0, support: 7.0, innovation: 8.8 },
    highlights: ["Hybrid-cloud native", "Data orchestration", "Multi-cloud fabric"],
    risks: ["Smaller ecosystem", "Newer market presence"],
    notes: "Innovative global namespace. Good for multi-cloud NCP scenarios.",
  },
  {
    id: "ibm",
    name: "IBM Spectrum Scale",
    category: "Enterprise Parallel FS",
    logo: "I",
    color: "#0F62FE",
    scores: { performance: 8.2, scalability: 9.5, compatibility: 7.5, reliability: 9.8, security: 9.5, economics: 6.0, support: 9.8, innovation: 6.5 },
    highlights: ["Proven petabyte scale", "FedRAMP/HIPAA", "Fortune 500 refs"],
    risks: ["High TCO", "Slower innovation cycle"],
    notes: "Most mature and reliable. Best for large regulated enterprises.",
  },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function computeWeightedScore(partner, criteria, weights) {
  return criteria.reduce((total, c) => {
    const w = (weights[c.id] ?? c.weight) / 100;
    return total + (partner.scores[c.id] || 0) * w;
  }, 0);
}

function getGrade(score) {
  if (score >= 8.5) return { label: "A+", color: "#10B981" };
  if (score >= 8.0) return { label: "A", color: "#34D399" };
  if (score >= 7.5) return { label: "B+", color: "#FBBF24" };
  if (score >= 7.0) return { label: "B", color: "#F59E0B" };
  if (score >= 6.0) return { label: "C", color: "#EF4444" };
  return { label: "D", color: "#991B1B" };
}

function RadarChart({ scores, color, size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = EVALUATION_CRITERIA.length;
  const points = EVALUATION_CRITERIA.map((c, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const val = (scores[c.id] || 0) / 10;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle) };
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map(lv => {
        const gpts = EVALUATION_CRITERIA.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return `${cx + r * lv * Math.cos(angle)},${cy + r * lv * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={lv} points={gpts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
      })}
      {EVALUATION_CRITERIA.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
      })}
      <polygon points={polygon} fill={color + "33"} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function ScoreBar({ value, max = 10, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function NCPEvaluator() {
  const [view, setView] = useState("dashboard"); // dashboard | evaluate | compare | workflow | add
  const [partners, setPartners] = useState(SAMPLE_PARTNERS);
  const [weights, setWeights] = useState(() => Object.fromEntries(EVALUATION_CRITERIA.map(c => [c.id, c.weight])));
  const [selected, setSelected] = useState(["weka", "vast", "ddn"]);
  const [useCase, setUseCase] = useState("training"); // training | inference | checkpointing | all
  const [sortBy, setSortBy] = useState("weighted");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newPartner, setNewPartner] = useState({ name: "", category: "", notes: "", scores: Object.fromEntries(EVALUATION_CRITERIA.map(c => [c.id, 7])) });
  const [automationStep, setAutomationStep] = useState(0);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [toast, setToast] = useState(null);

  const USE_CASE_WEIGHTS = {
    training: { performance: 25, scalability: 20, compatibility: 25, reliability: 10, security: 5, economics: 5, support: 5, innovation: 5 },
    inference: { performance: 20, scalability: 15, compatibility: 20, reliability: 20, security: 10, economics: 10, support: 3, innovation: 2 },
    checkpointing: { performance: 30, scalability: 10, compatibility: 20, reliability: 20, security: 5, economics: 10, support: 3, innovation: 2 },
    all: { performance: 20, scalability: 15, compatibility: 20, reliability: 15, security: 10, economics: 10, support: 5, innovation: 5 },
  };

  const AUTOMATION_STEPS = [
    { icon: "📋", label: "Ingest Proposals", desc: "Parse vendor RFP responses via API / PDF extraction" },
    { icon: "🔍", label: "Auto-Score Criteria", desc: "AI extracts technical specs → maps to scoring rubric" },
    { icon: "⚖️", label: "Apply Use-Case Weights", desc: "Weight matrix applied per workload profile" },
    { icon: "🧮", label: "Compute Weighted Scores", desc: "Normalized 0–10 scores across all dimensions" },
    { icon: "📊", label: "Generate Comparison Matrix", desc: "Side-by-side shortlist with risk flags" },
    { icon: "🏆", label: "Recommend Top 3", desc: "Ranked shortlist with rationale for NCP review" },
    { icon: "📄", label: "Export Decision Report", desc: "Board-ready PDF with audit trail" },
  ];

  useEffect(() => {
    const activeWeights = USE_CASE_WEIGHTS[useCase];
    setWeights({ ...activeWeights });
  }, [useCase]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const rankedPartners = [...partners]
    .filter(p => filterCategory === "all" || p.category === filterCategory)
    .map(p => ({ ...p, weighted: computeWeightedScore(p, EVALUATION_CRITERIA, weights) }))
    .sort((a, b) => b[sortBy === "weighted" ? "weighted" : sortBy] - a[sortBy === "weighted" ? "weighted" : sortBy]);

  const top3 = rankedPartners.slice(0, 3);

  const runAutomation = () => {
    setAutomationRunning(true);
    setAutomationStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAutomationStep(step);
      if (step >= AUTOMATION_STEPS.length) {
        clearInterval(interval);
        setAutomationRunning(false);
        showToast("✅ Automation complete — Top 3 shortlist ready");
      }
    }, 700);
  };

  const addPartner = () => {
    if (!newPartner.name) return;
    const id = newPartner.name.toLowerCase().replace(/\s+/g, "_");
    const colors = ["#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#84CC16"];
    setPartners(prev => [...prev, { ...newPartner, id, logo: newPartner.name[0].toUpperCase(), color: colors[Math.floor(Math.random() * colors.length)] }]);
    showToast(`✅ ${newPartner.name} added to evaluation`);
    setView("dashboard");
    setNewPartner({ name: "", category: "", notes: "", scores: Object.fromEntries(EVALUATION_CRITERIA.map(c => [c.id, 7])) });
  };

  const categories = ["all", ...new Set(partners.map(p => p.category))];

  const styles = {
    app: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace", background: "#060910", minHeight: "100vh", color: "#E2E8F0", overflowX: "hidden" },
    header: { background: "linear-gradient(135deg, #0a0f1e 0%, #0d1530 100%)", borderBottom: "1px solid rgba(0,212,255,0.15)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)" },
    logo: { display: "flex", alignItems: "center", gap: 12 },
    logoMark: { width: 36, height: 36, background: "linear-gradient(135deg, #00D4FF, #7C3AED)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" },
    logoText: { fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" },
    logoSub: { fontSize: 10, color: "#64748B", letterSpacing: "0.2em" },
    nav: { display: "flex", gap: 4 },
    navBtn: (active) => ({ padding: "6px 14px", borderRadius: 6, border: "none", background: active ? "rgba(0,212,255,0.15)" : "transparent", color: active ? "#00D4FF" : "#64748B", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.2s" }),
    main: { padding: "28px 32px", maxWidth: 1280, margin: "0 auto" },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 },
    cardHighlight: { background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 12, padding: 20 },
    sectionTitle: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 },
    h1: { fontSize: 22, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em" },
    h2: { fontSize: 16, fontWeight: 700, color: "#E2E8F0" },
    tag: (color) => ({ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", background: color + "22", color: color, border: `1px solid ${color}44` }),
    btn: (variant = "primary") => ({
      padding: variant === "sm" ? "6px 14px" : "10px 20px",
      borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
      fontSize: variant === "sm" ? 11 : 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      background: variant === "primary" ? "linear-gradient(135deg, #00D4FF, #7C3AED)" : variant === "danger" ? "#EF4444" : "rgba(255,255,255,0.08)",
      color: "#fff", transition: "all 0.2s",
    }),
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
    flexRow: { display: "flex", alignItems: "center", gap: 12 },
    badge: (color) => ({ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, background: color + "22", color, border: `1px solid ${color}44` }),
  };

  return (
    <div style={styles.app}>
      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 24, background: "#0F172A", border: "1px solid #10B981", borderRadius: 10, padding: "10px 18px", fontSize: 12, color: "#10B981", zIndex: 9999, fontWeight: 700, letterSpacing: "0.05em", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>N</div>
          <div>
            <div style={styles.logoText}>NCP Storage Evaluator</div>
            <div style={styles.logoSub}>NVIDIA DGX Cloud · Partner Selection Automation</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {[["dashboard", "📊 Dashboard"], ["evaluate", "⚖️ Weight Engine"], ["compare", "🔬 Compare"], ["workflow", "🤖 Automation"], ["add", "➕ Add Partner"]].map(([id, label]) => (
            <button key={id} style={styles.navBtn(view === id)} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* KPI Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Total Proposals", value: partners.length, icon: "📦", color: "#00D4FF" },
                { label: "Shortlisted", value: top3.length, icon: "🏆", color: "#10B981" },
                { label: "Avg Top Score", value: (top3.reduce((s, p) => s + computeWeightedScore(p, EVALUATION_CRITERIA, weights), 0) / top3.length).toFixed(2), icon: "⭐", color: "#FBBF24" },
                { label: "Use-Case Profile", value: useCase.toUpperCase(), icon: "🎯", color: "#7C3AED" },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...styles.card, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{kpi.icon}</div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
                    <div style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase" }}>{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Use-Case Selector */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>🎯 Workload Profile — Auto-adjusts weights</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[["training", "LLM Training", "#00D4FF"], ["inference", "Inference Serving", "#10B981"], ["checkpointing", "Checkpoint Storage", "#FBBF24"], ["all", "Balanced / All", "#7C3AED"]].map(([id, label, color]) => (
                  <button key={id} onClick={() => setUseCase(id)} style={{ ...styles.btn(useCase === id ? "primary" : "secondary"), background: useCase === id ? color + "33" : "rgba(255,255,255,0.05)", border: `1px solid ${useCase === id ? color : "rgba(255,255,255,0.1)"}`, color: useCase === id ? color : "#94A3B8" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#64748B", letterSpacing: "0.1em" }}>FILTER:</span>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} style={{ ...styles.btn("secondary"), fontSize: 10, padding: "4px 12px", background: filterCategory === cat ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.04)", color: filterCategory === cat ? "#00D4FF" : "#64748B", border: `1px solid ${filterCategory === cat ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            {/* Partner Cards */}
            <div>
              <div style={styles.sectionTitle}>Ranked Partners · {useCase.toUpperCase()} Profile</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rankedPartners.map((partner, idx) => {
                  const ws = computeWeightedScore(partner, EVALUATION_CRITERIA, weights);
                  const grade = getGrade(ws);
                  const isSel = selected.includes(partner.id);
                  return (
                    <div key={partner.id} style={{ ...styles.card, borderColor: idx === 0 ? "rgba(255,215,0,0.2)" : idx < 3 ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 20, cursor: "pointer", transition: "all 0.2s" }}
                      onClick={() => setSelected(prev => prev.includes(partner.id) ? prev.filter(x => x !== partner.id) : [...prev, partner.id])}>
                      {/* Rank */}
                      <div style={{ width: 28, textAlign: "center", fontSize: idx === 0 ? 20 : 13, color: idx === 0 ? "#FFD700" : idx < 3 ? "#00D4FF" : "#475569" }}>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</div>
                      {/* Logo */}
                      <div style={styles.badge(partner.color)}>{partner.logo}</div>
                      {/* Name & Category */}
                      <div style={{ flex: "0 0 180px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#F1F5F9" }}>{partner.name}</div>
                        <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{partner.category}</div>
                      </div>
                      {/* Score bars */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        {EVALUATION_CRITERIA.slice(0, 4).map(c => (
                          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 9, color: "#475569", width: 80, textAlign: "right", letterSpacing: "0.05em" }}>{c.label.split(" ")[0]}</span>
                            <ScoreBar value={partner.scores[c.id] || 0} color={partner.color} />
                            <span style={{ fontSize: 10, color: "#94A3B8", width: 24 }}>{partner.scores[c.id]}</span>
                          </div>
                        ))}
                      </div>
                      {/* Weighted Score */}
                      <div style={{ textAlign: "center", flex: "0 0 80px" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: grade.color, lineHeight: 1 }}>{ws.toFixed(1)}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: grade.color }}>{grade.label}</div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>WEIGHTED</div>
                      </div>
                      {/* Radar mini */}
                      <RadarChart scores={partner.scores} color={partner.color} size={80} />
                      {/* Select indicator */}
                      <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${isSel ? "#00D4FF" : "#334155"}`, background: isSel ? "#00D4FF22" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#00D4FF" }}>
                        {isSel ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 3 Recommendation Box */}
            <div style={styles.cardHighlight}>
              <div style={styles.sectionTitle}>🏆 Recommended Shortlist for NCP Review</div>
              <div style={styles.grid3}>
                {top3.map((p, i) => {
                  const ws = computeWeightedScore(p, EVALUATION_CRITERIA, weights);
                  const grade = getGrade(ws);
                  return (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${p.color}33`, borderRadius: 10, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={styles.badge(p.color)}>{p.logo}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#F1F5F9" }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "#64748B" }}>{["Primary Recommendation", "Strong Alternative", "Specialized Option"][i]}</div>
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: 20, fontWeight: 900, color: grade.color }}>{ws.toFixed(1)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>{p.notes}</div>
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {p.highlights.slice(0, 2).map(h => <span key={h} style={styles.tag(p.color)}>{h}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── WEIGHT ENGINE ── */}
        {view === "evaluate" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={styles.flexRow}>
              <div>
                <h1 style={styles.h1}>⚖️ Weight Engine</h1>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Customize evaluation weights per NCP procurement requirements</p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {Object.entries(USE_CASE_WEIGHTS).map(([id, _]) => (
                  <button key={id} onClick={() => setUseCase(id)} style={{ ...styles.btn("secondary"), fontSize: 10, padding: "5px 12px", background: useCase === id ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.05)", color: useCase === id ? "#00D4FF" : "#64748B" }}>
                    {id}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {EVALUATION_CRITERIA.map(c => (
                <div key={c.id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#00D4FF" }}>{weights[c.id]}%</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>{c.description}</div>
                  <input type="range" min={0} max={30} value={weights[c.id]} onChange={e => setWeights(prev => ({ ...prev, [c.id]: +e.target.value }))}
                    style={{ width: "100%", accentColor: "#00D4FF" }} />
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {c.subcriteria.map(s => <span key={s} style={styles.tag("#00D4FF")}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...styles.card, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.2)" }}>
              <div style={styles.sectionTitle}>Weight Distribution · Total: {Object.values(weights).reduce((a, b) => a + b, 0)}%</div>
              <div style={{ display: "flex", gap: 2, height: 24, borderRadius: 8, overflow: "hidden" }}>
                {EVALUATION_CRITERIA.map((c, i) => {
                  const colors = ["#00D4FF", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];
                  const total = Object.values(weights).reduce((a, b) => a + b, 0);
                  return <div key={c.id} title={`${c.label}: ${weights[c.id]}%`} style={{ width: `${(weights[c.id] / total) * 100}%`, background: colors[i], transition: "width 0.3s" }} />;
                })}
              </div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EVALUATION_CRITERIA.map((c, i) => {
                  const colors = ["#00D4FF", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];
                  return <span key={c.id} style={styles.tag(colors[i])}>{c.label.split(" ")[0]}: {weights[c.id]}%</span>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── COMPARE ── */}
        {view === "compare" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={styles.h1}>🔬 Detailed Comparison Matrix</h1>
            <div style={{ fontSize: 11, color: "#64748B" }}>Click partners in Dashboard to select for comparison · Currently comparing: {selected.length} partners</div>

            {/* Radar comparison */}
            <div style={{ ...styles.card }}>
              <div style={styles.sectionTitle}>Radar Comparison</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
                {partners.filter(p => selected.includes(p.id)).map(p => {
                  const ws = computeWeightedScore(p, EVALUATION_CRITERIA, weights);
                  const grade = getGrade(ws);
                  return (
                    <div key={p.id} style={{ textAlign: "center" }}>
                      <RadarChart scores={p.scores} color={p.color} size={140} />
                      <div style={{ fontWeight: 700, color: p.color, fontSize: 12 }}>{p.name}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: grade.color }}>{ws.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score matrix */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>CRITERION</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", color: "#64748B", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>WEIGHT</th>
                    {partners.filter(p => selected.includes(p.id)).map(p => (
                      <th key={p.id} style={{ padding: "12px 16px", textAlign: "center", color: p.color, fontSize: 11, letterSpacing: "0.05em", fontWeight: 700, borderBottom: `1px solid ${p.color}44` }}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_CRITERIA.map((c, ci) => {
                    const selectedPartners = partners.filter(p => selected.includes(p.id));
                    const maxScore = Math.max(...selectedPartners.map(p => p.scores[c.id] || 0));
                    return (
                      <tr key={c.id} style={{ background: ci % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: "#E2E8F0" }}>{c.label}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>{c.description}</div>
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748B", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{weights[c.id]}%</td>
                        {selectedPartners.map(p => {
                          const score = p.scores[c.id] || 0;
                          const isMax = score === maxScore;
                          return (
                            <td key={p.id} style={{ padding: "10px 16px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 16, fontWeight: 900, color: isMax ? "#10B981" : "#94A3B8" }}>{score}</span>
                                {isMax && <span style={{ fontSize: 9, color: "#10B981", letterSpacing: "0.1em" }}>BEST</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Weighted Total Row */}
                  <tr style={{ background: "rgba(0,212,255,0.05)", borderTop: "2px solid rgba(0,212,255,0.2)" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 900, fontSize: 13, color: "#00D4FF", letterSpacing: "0.05em" }}>WEIGHTED TOTAL</td>
                    <td style={{ padding: "14px 8px", textAlign: "center", color: "#64748B", fontSize: 11 }}>100%</td>
                    {partners.filter(p => selected.includes(p.id)).map(p => {
                      const ws = computeWeightedScore(p, EVALUATION_CRITERIA, weights);
                      const grade = getGrade(ws);
                      return (
                        <td key={p.id} style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: grade.color }}>{ws.toFixed(2)}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: grade.color }}>{grade.label}</div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Risk Matrix */}
            <div style={styles.grid3}>
              {partners.filter(p => selected.includes(p.id)).map(p => (
                <div key={p.id} style={{ ...styles.card, borderColor: p.color + "33" }}>
                  <div style={{ ...styles.flexRow, marginBottom: 12 }}>
                    <div style={styles.badge(p.color)}>{p.logo}</div>
                    <div style={{ fontWeight: 700, color: "#F1F5F9" }}>{p.name}</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#10B981", letterSpacing: "0.1em", marginBottom: 4 }}>✅ STRENGTHS</div>
                    {p.highlights.map(h => <div key={h} style={{ fontSize: 11, color: "#94A3B8", padding: "2px 0" }}>• {h}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#EF4444", letterSpacing: "0.1em", marginBottom: 4 }}>⚠️ RISKS</div>
                    {p.risks.map(r => <div key={r} style={{ fontSize: 11, color: "#94A3B8", padding: "2px 0" }}>• {r}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUTOMATION WORKFLOW ── */}
        {view === "workflow" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={styles.h1}>🤖 NCP Selection Automation Pipeline</h1>
              <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>End-to-end automated vendor evaluation from RFP ingestion to board-ready shortlist</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
              {/* Pipeline Steps */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Pipeline Steps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {AUTOMATION_STEPS.map((step, i) => {
                    const isActive = automationRunning && automationStep === i;
                    const isDone = automationStep > i && (automationRunning || automationStep >= AUTOMATION_STEPS.length);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: isActive ? "rgba(0,212,255,0.08)" : isDone ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${isActive ? "rgba(0,212,255,0.3)" : isDone ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`, transition: "all 0.3s" }}>
                        <div style={{ fontSize: 20 }}>{isDone ? "✅" : isActive ? "⏳" : step.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: isActive ? "#00D4FF" : isDone ? "#10B981" : "#E2E8F0" }}>{step.label}</div>
                          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{step.desc}</div>
                        </div>
                        <div style={{ fontSize: 10, color: "#334155", fontWeight: 700 }}>Step {i + 1}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={runAutomation} disabled={automationRunning} style={{ ...styles.btn(), marginTop: 16, width: "100%", opacity: automationRunning ? 0.6 : 1 }}>
                  {automationRunning ? "⏳ Running..." : "▶ Run Automation Pipeline"}
                </button>
              </div>

              {/* Architecture */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>System Architecture</div>
                  {[
                    { layer: "Ingestion Layer", items: ["Vendor RFP PDF Parser (pdfminer/PyMuPDF)", "Web scraping (vendor datasheets)", "Manual score entry API", "Email attachment processor"], color: "#00D4FF" },
                    { layer: "Evaluation Engine", items: ["NLP spec extractor (Claude API)", "Score normalizer (0–10 rubric)", "Weight matrix calculator", "Use-case profile applier"], color: "#7C3AED" },
                    { layer: "Decision Layer", items: ["Weighted scoring aggregator", "Rank + grade generator", "Risk flag detector", "Shortlist recommender (top-N)"], color: "#10B981" },
                    { layer: "Output Layer", items: ["Board-ready PDF report (ReportLab)", "Comparison matrix export (XLSX)", "Audit trail logger", "NCP review dashboard (this UI)"], color: "#FBBF24" },
                  ].map(l => (
                    <div key={l.layer} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: l.color, letterSpacing: "0.1em", marginBottom: 6 }}>{l.layer.toUpperCase()}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {l.items.map(item => <span key={item} style={styles.tag(l.color)}>{item}</span>)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.card}>
                  <div style={styles.sectionTitle}>Integration Options</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ["📧", "Email/Outlook", "Auto-parse RFP emails"],
                      ["📁", "SharePoint/Drive", "Central doc store"],
                      ["🤖", "Claude API", "AI spec extraction"],
                      ["📊", "Power BI / Tableau", "Live dashboards"],
                      ["📄", "Confluence", "Decision docs"],
                      ["🔔", "Slack/Teams", "Stakeholder alerts"],
                    ].map(([icon, name, desc]) => (
                      <div key={name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 16 }}>{icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", marginTop: 4 }}>{name}</div>
                        <div style={{ fontSize: 10, color: "#64748B" }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Code Snippet */}
            <div style={{ ...styles.card, background: "rgba(0,0,0,0.4)" }}>
              <div style={styles.sectionTitle}>📋 Core Scoring Algorithm (Python)</div>
              <pre style={{ fontSize: 10, color: "#10B981", lineHeight: 1.8, overflow: "auto", margin: 0 }}>{`# NCP Storage Partner Evaluation Engine
# nvidia_ncp_evaluator.py

import json
from dataclasses import dataclass, field
from typing import Dict, List

CRITERIA_WEIGHTS = {
    "performance":    {"training": 25, "inference": 20, "checkpointing": 30, "all": 20},
    "scalability":    {"training": 20, "inference": 15, "checkpointing": 10, "all": 15},
    "compatibility":  {"training": 25, "inference": 20, "checkpointing": 20, "all": 20},
    "reliability":    {"training": 10, "inference": 20, "checkpointing": 20, "all": 15},
    "security":       {"training":  5, "inference": 10, "checkpointing":  5, "all": 10},
    "economics":      {"training":  5, "inference": 10, "checkpointing": 10, "all": 10},
    "support":        {"training":  5, "inference":  3, "checkpointing":  3, "all":  5},
    "innovation":     {"training":  5, "inference":  2, "checkpointing":  2, "all":  5},
}

@dataclass
class StoragePartner:
    name: str
    category: str
    scores: Dict[str, float]  # 0–10 per criterion
    highlights: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)

def compute_weighted_score(partner: StoragePartner, use_case: str = "all") -> float:
    total_weight = 0
    weighted_sum = 0.0
    for criterion, profiles in CRITERIA_WEIGHTS.items():
        w = profiles.get(use_case, profiles["all"])
        score = partner.scores.get(criterion, 0)
        weighted_sum += score * w
        total_weight += w
    return round(weighted_sum / total_weight, 2)

def shortlist(partners: List[StoragePartner], use_case: str = "all", top_n: int = 3):
    ranked = sorted(partners, key=lambda p: compute_weighted_score(p, use_case), reverse=True)
    return [(p, compute_weighted_score(p, use_case)) for p in ranked[:top_n]]

# Auto-score from vendor RFP using Claude API
def auto_score_from_rfp(rfp_text: str, anthropic_client) -> Dict[str, float]:
    prompt = f"""Extract storage performance specs from this RFP and score 0-10:
{rfp_text}
Return JSON: {{"performance": X, "scalability": X, "compatibility": X, 
               "reliability": X, "security": X, "economics": X, 
               "support": X, "innovation": X}}"""
    response = anthropic_client.messages.create(
        model="claude-opus-4-6", max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(response.content[0].text)`}</pre>
            </div>
          </div>
        )}

        {/* ── ADD PARTNER ── */}
        {view === "add" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>
            <h1 style={styles.h1}>➕ Add New Partner Proposal</h1>
            <div style={styles.card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>COMPANY NAME *</label>
                  <input value={newPartner.name} onChange={e => setNewPartner(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Qumulo, Pure Storage..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>CATEGORY</label>
                  <input value={newPartner.category} onChange={e => setNewPartner(p => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. Object Storage, Parallel FS..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>NOTES / SUMMARY</label>
                <textarea value={newPartner.notes} onChange={e => setNewPartner(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Brief assessment of this vendor's positioning..." rows={3}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontFamily: "inherit", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={styles.sectionTitle}>SCORES (0–10 per criterion)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {EVALUATION_CRITERIA.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, fontSize: 12, color: "#94A3B8" }}>{c.label}</div>
                    <input type="range" min={0} max={10} step={0.5} value={newPartner.scores[c.id] || 7}
                      onChange={e => setNewPartner(p => ({ ...p, scores: { ...p.scores, [c.id]: +e.target.value } }))}
                      style={{ width: 100, accentColor: "#00D4FF" }} />
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#00D4FF", width: 28 }}>{newPartner.scores[c.id] || 7}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={addPartner} style={styles.btn()}>➕ Add to Evaluation</button>
                <button onClick={() => setView("dashboard")} style={styles.btn("secondary")}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em" }}>NCP STORAGE EVALUATOR · NVIDIA DGX CLOUD · PARTNER SELECTION AUTOMATION</span>
        <span style={{ fontSize: 10, color: "#334155" }}>v2.0 · {partners.length} vendors · {useCase.toUpperCase()} profile</span>
      </footer>
    </div>
  );
}
