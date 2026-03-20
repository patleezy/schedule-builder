import { useState, useRef, useCallback } from "react";

const HOLIDAYS_2026 = [
  "2026-01-01","2026-01-19","2026-05-25","2026-06-19","2026-07-03","2026-09-07",
  "2026-11-23","2026-11-24","2026-11-25","2026-11-26","2026-11-27",
  "2026-12-24","2026-12-25","2026-12-26","2026-12-27","2026-12-28","2026-12-29","2026-12-30","2026-12-31",
];

const BUILT_IN_WORK_TYPES = [
  { id: "email", label: "Email", color: "#E31937", light: "rgba(227,25,55,0.15)" },
  { id: "pdp",   label: "PDP",   color: "#FF6B35", light: "rgba(255,107,53,0.15)" },
  { id: "plp",   label: "PLP",   color: "#2D7DD2", light: "rgba(45,125,210,0.15)" },
  { id: "hp",    label: "HP",    color: "#45B764", light: "rgba(69,183,100,0.15)" },
];

const CUSTOM_COLORS = [
  { color: "#F5C542", light: "rgba(245,197,66,0.15)" },
  { color: "#A855F7", light: "rgba(168,85,247,0.15)" },
  { color: "#06B6D4", light: "rgba(6,182,212,0.15)" },
  { color: "#F97316", light: "rgba(249,115,22,0.15)" },
  { color: "#EC4899", light: "rgba(236,72,153,0.15)" },
  { color: "#84CC16", light: "rgba(132,204,22,0.15)" },
  { color: "#14B8A6", light: "rgba(20,184,166,0.15)" },
  { color: "#8B5CF6", light: "rgba(139,92,246,0.15)" },
];

const OWNER_PALETTE = [
  "#F5C542","#FF9F43","#54A0FF","#A855F7","#E31937","#45B764","#06B6D4",
  "#F97316","#EC4899","#84CC16","#14B8A6","#8B5CF6","#FF6B35","#2D7DD2",
];

const DEFAULT_OWNERS = {
  creative: { label: "Digital Creative", color: "#F5C542", builtin: true },
  legal:    { label: "Legal",            color: "#FF9F43", builtin: true },
  ops:      { label: "Digital Ops",      color: "#54A0FF", builtin: true },
  loc:      { label: "Localization",     color: "#A855F7", builtin: true },
};

const NPI_PHASES = (wt) => [
  { id: "wires",        name: "Finalize design wires/copy", owner: "creative", dur: { email: 20, pdp: 50, plp: 15, hp: 15 }[wt] ?? 10 },
  { id: "legal",        name: "Legal",                      owner: "legal",    dur: { email: 5,  pdp: 10, plp: 5,  hp: 5  }[wt] ?? 5,  toggleable: true, defaultOn: true },
  { id: "assets",       name: "Cut & deliver assets",       owner: "creative", dur: { email: 1,  pdp: 5,  plp: 1,  hp: 1  }[wt] ?? 2 },
  { id: "build",        name: "Build page",                 owner: "ops",      dur: { email: 3,  pdp: 10, plp: 5,  hp: 1  }[wt] ?? 3 },
  { id: "review",       name: "Review page",                owner: "ops",      dur: { email: 2,  pdp: 2,  plp: 2,  hp: 1  }[wt] ?? 2 },
  { id: "translations", name: "Translations",               owner: "loc",      dur: { email: 5,  pdp: 20, plp: 5,  hp: 5  }[wt] ?? 5,  translationPhase: true },
  { id: "icr1",         name: "ICR Round 1",                owner: "loc",      dur: { email: 7,  pdp: 7,  plp: 7,  hp: 5  }[wt] ?? 7,  translationPhase: true },
  { id: "icr2",         name: "ICR Round 2",                owner: "loc",      dur: { email: 3,  pdp: 5,  plp: 3,  hp: 3  }[wt] ?? 3,  translationPhase: true, toggleable: true, defaultOn: true },
  { id: "icr3",         name: "ICR Round 3",                owner: "loc",      dur: 2, translationPhase: true, toggleable: true, defaultOn: false },
  { id: "qa",           name: "Team QA & review",           owner: "ops",      dur: { email: 5,  pdp: 7,  plp: 5,  hp: 2  }[wt] ?? 5 },
  { id: "push",         name: "Push to production",         owner: "ops",      dur: 1, milestone: true },
];

const NON_NPI_PHASES = (wt) => [
  { id: "wires",        name: "Finalize design wires/copy", owner: "creative", dur: { email: 10, pdp: 25, plp: 8, hp: 8 }[wt] ?? 8 },
  { id: "legal",        name: "Legal (if needed)",          owner: "legal",    dur: { email: 3,  pdp: 5,  plp: 3, hp: 3 }[wt] ?? 3, toggleable: true, defaultOn: false },
  { id: "assets",       name: "Cut & deliver assets",       owner: "creative", dur: { email: 1,  pdp: 3,  plp: 1, hp: 1 }[wt] ?? 1 },
  { id: "build",        name: "Build page",                 owner: "ops",      dur: 2 },
  { id: "translations", name: "Translations",               owner: "loc",      dur: 5, translationPhase: true },
  { id: "icr1",         name: "ICR Round 1",                owner: "loc",      dur: 3, translationPhase: true },
  { id: "icr2",         name: "ICR Round 2 (if needed)",    owner: "loc",      dur: 2, translationPhase: true, toggleable: true, defaultOn: false },
  { id: "qa",           name: "Team QA & review",           owner: "ops",      dur: 2 },
  { id: "push",         name: "Push to production",         owner: "ops",      dur: 1, milestone: true },
];

const fmt = (d) => d.toISOString().split("T")[0];
const parseDate = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
const isHoliday = (d) => HOLIDAYS_2026.includes(fmt(d));
const isBusinessDay = (d) => !isWeekend(d) && !isHoliday(d);

function addBizDays(start, days) {
  let d = new Date(start), count = 0;
  while (count < days) { d.setDate(d.getDate() + 1); if (isBusinessDay(d)) count++; }
  return d;
}
function subBizDays(start, days) {
  let d = new Date(start), count = 0;
  while (count < days) { d.setDate(d.getDate() - 1); if (isBusinessDay(d)) count++; }
  return d;
}
function weeksBetween(a, b) { return Math.ceil(Math.abs(b - a) / (7 * 24 * 60 * 60 * 1000)); }
const fmtDisplay = (d) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
};

function NewOwnerInline({ onSave, onCancel, inputStyle }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(OWNER_PALETTE[4]);
  const [err, setErr]     = useState("");
  const handleSave = () => {
    if (!label.trim()) { setErr("Name required"); return; }
    const id = "owner_" + label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + "_" + Date.now();
    onSave(id, { label: label.trim(), color, builtin: false });
  };
  return (
    <div style={{ border: "1.5px solid #E31937", borderRadius: 4, padding: "10px 12px", background: "#0a0a0a" }}>
      <div style={{ fontSize: 8, letterSpacing: 2, color: "#E31937", marginBottom: 8, fontWeight: 700 }}>NEW OWNER</div>
      <input autoFocus style={{ ...inputStyle, marginBottom: 8, fontSize: 11, padding: "6px 8px" }} placeholder="e.g. Brand Marketing, PR, Retail"
        value={label} onChange={e => { setLabel(e.target.value); setErr(""); }}
        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }} />
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {OWNER_PALETTE.map(c => (
          <div key={c} onClick={() => setColor(c)} style={{ width: 18, height: 18, borderRadius: 3, background: c, cursor: "pointer", flexShrink: 0,
            border: color === c ? "2px solid #fff" : "2px solid transparent", boxShadow: color === c ? `0 0 0 1px ${c}` : "none" }} />
        ))}
      </div>
      {label && (
        <div style={{ marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 3, background: color + "18", border: `1px solid ${color}40` }}>
          <div style={{ width: 6, height: 6, borderRadius: 2, background: color }} />
          <span style={{ fontSize: 10, color }}>{label}</span>
        </div>
      )}
      {err && <div style={{ fontSize: 9, color: "#E31937", marginBottom: 6 }}>{err}</div>}
      <div style={{ display: "flex", gap: 5 }}>
        <button onClick={handleSave} style={{ flex: 1, padding: "5px 0", background: "#E31937", border: "none", color: "#fff", fontSize: 9, letterSpacing: 1, fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>CREATE</button>
        <button onClick={onCancel} style={{ padding: "5px 10px", background: "none", border: "1px solid #222", color: "#666", fontSize: 9, borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✕</button>
      </div>
    </div>
  );
}

function OwnerSelect({ value, onChange, owners, onAddOwner, inputStyle }) {
  const [adding, setAdding] = useState(false);
  if (adding) {
    return <NewOwnerInline inputStyle={inputStyle}
      onSave={(id, def) => { onAddOwner(id, def); onChange(id); setAdding(false); }}
      onCancel={() => setAdding(false)} />;
  }
  const builtins = Object.entries(owners).filter(([,v]) => v.builtin);
  const customs  = Object.entries(owners).filter(([,v]) => !v.builtin);
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => e.target.value === "__add__" ? setAdding(true) : onChange(e.target.value)}
        style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 22 }}>
        <optgroup label="── Built-in ──">
          {builtins.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </optgroup>
        {customs.length > 0 && (
          <optgroup label="── Custom ──">
            {customs.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </optgroup>
        )}
        <option value="__add__">＋ Add new owner…</option>
      </select>
      <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 9, color: "#555" }}>▾</span>
    </div>
  );
}

function ManageOwners({ owners, onAddOwner, onDeleteOwner }) {
  const [adding, setAdding] = useState(false);
  const inputStyle = { width: "100%", background: "#060606", border: "1.5px solid #1e1e1e", color: "#ddd", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "7px 10px", borderRadius: 4, outline: "none", boxSizing: "border-box" };
  const builtins = Object.entries(owners).filter(([,v]) => v.builtin);
  const customs  = Object.entries(owners).filter(([,v]) => !v.builtin);
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: "#2a2a2a", marginBottom: 8 }}>BUILT-IN</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {builtins.map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 3, background: v.color + "12", border: `1px solid ${v.color}28` }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: v.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: v.color }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
      {customs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#2a2a2a", marginBottom: 8 }}>CUSTOM</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {customs.map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: v.color + "12", border: `1px solid ${v.color}38`, borderRight: "none", borderRadius: "3px 0 0 3px" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: v.color }}>{v.label}</span>
                </div>
                <button onClick={() => onDeleteOwner(k)} title="Remove owner" style={{ padding: "4px 8px", background: v.color + "12", border: `1px solid ${v.color}38`, borderLeft: "none", color: v.color, borderRadius: "0 3px 3px 0", cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {adding ? (
        <NewOwnerInline inputStyle={inputStyle}
          onSave={(id, def) => { onAddOwner(id, def); setAdding(false); }}
          onCancel={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ padding: "7px 14px", background: "transparent", border: "1.5px dashed #252525", color: "#3a3a3a", fontSize: 10, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#E31937"; e.currentTarget.style.color = "#E31937"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#3a3a3a"; }}>
          + ADD OWNER
        </button>
      )}
    </div>
  );
}

function CustomWorkTypeModal({ onSave, onClose, owners, onAddOwner }) {
  const [label, setLabel]       = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [phases, setPhases]     = useState([
    { name: "Brief & kickoff", owner: "creative", duration: 5 },
    { name: "Build",           owner: "ops",      duration: 3 },
    { name: "QA & review",    owner: "ops",      duration: 2 },
    { name: "Launch",          owner: "ops",      duration: 1, milestone: true },
  ]);
  const [error, setError] = useState("");
  const addPhase    = () => setPhases(p => [...p, { name: "", owner: Object.keys(owners)[0] || "ops", duration: 3 }]);
  const removePhase = (i) => setPhases(p => p.filter((_,j) => j !== i));
  const updPhase    = (i, f, v) => setPhases(p => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u; });
  const handleSave = () => {
    if (!label.trim()) { setError("Work type needs a name."); return; }
    if (phases.some(p => !p.name.trim())) { setError("All phases need a name."); return; }
    const id = "custom_" + label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + "_" + Date.now();
    const colorDef = CUSTOM_COLORS[colorIdx];
    onSave({ id, label: label.trim(), color: colorDef.color, light: colorDef.light, custom: true,
      phases: phases.map((p, i) => ({ id: `p${i}`, name: p.name.trim(), owner: p.owner, duration: Math.max(1, parseInt(p.duration) || 1), enabled: true, defaultOn: true, milestone: !!p.milestone })) });
  };
  const IS = { width: "100%", background: "#0a0a0a", border: "1.5px solid #1e1e1e", color: "#ddd", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "9px 12px", borderRadius: 4, outline: "none", boxSizing: "border-box" };
  const btn = (a) => ({ padding: "8px 18px", background: a ? "#E31937" : "#0e0e0e", border: `1.5px solid ${a ? "#E31937" : "#1e1e1e"}`, color: a ? "#fff" : "#888", fontSize: 11, letterSpacing: 2, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer" });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0e0e0e", border: "1px solid #222", borderRadius: 8, width: "100%", maxWidth: 580, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #151515" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: 4, fontWeight: 700 }}>NEW WORK TYPE</span>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #222", color: "#888", width: 28, height: 28, borderRadius: 3, cursor: "pointer", fontSize: 14 }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Work Type Name</span>
            <input style={IS} placeholder="e.g. Paid Social, OOH, Retail" value={label} onChange={e => { setLabel(e.target.value); setError(""); }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Color</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CUSTOM_COLORS.map((c, i) => (
                <div key={i} onClick={() => setColorIdx(i)} style={{ width: 28, height: 28, borderRadius: 4, background: c.color, cursor: "pointer", border: colorIdx === i ? "2px solid #fff" : "2px solid transparent", boxShadow: colorIdx === i ? `0 0 0 1px ${c.color}` : "none", transition: "all 0.15s" }} />
              ))}
            </div>
            {label && (
              <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 3, background: CUSTOM_COLORS[colorIdx].light, border: `1px solid ${CUSTOM_COLORS[colorIdx].color}` }}>
                <span style={{ fontSize: 11, color: CUSTOM_COLORS[colorIdx].color, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
              </div>
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", fontWeight: 600 }}>Phases</span>
              <button onClick={addPhase} style={{ ...btn(false), fontSize: 10, padding: "5px 12px" }}>+ ADD PHASE</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 190px 52px 28px", gap: 6, marginBottom: 6 }}>
              {["PHASE NAME","OWNER","DAYS",""].map((h,i) => <span key={i} style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>{h}</span>)}
            </div>
            {phases.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 190px 52px 28px", gap: 6, marginBottom: 6, alignItems: "start" }}>
                <div style={{ position: "relative" }}>
                  <input style={{ ...IS, paddingRight: p.milestone ? 72 : 12 }} placeholder="Phase name" value={p.name} onChange={e => updPhase(i, "name", e.target.value)} />
                  {p.milestone && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 7, letterSpacing: 1, color: "#E31937", fontWeight: 700, pointerEvents: "none" }}>MILESTONE</span>}
                </div>
                <OwnerSelect value={p.owner} onChange={v => updPhase(i, "owner", v)} owners={owners} onAddOwner={onAddOwner} inputStyle={{ ...IS, padding: "9px 8px" }} />
                <input type="number" min={1} value={p.duration} onChange={e => updPhase(i, "duration", e.target.value)} style={{ ...IS, padding: "9px 8px", textAlign: "center" }} />
                <button onClick={() => removePhase(i)} style={{ background: "none", border: "1px solid #1a1a1a", color: "#555", width: 28, height: 36, borderRadius: 3, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            ))}
            {phases.length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "#333", fontSize: 12 }}>No phases yet</div>}
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 11, color: "#E31937" }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #151515", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btn(false)}>CANCEL</button>
          <button onClick={handleSave} style={btn(true)}>CREATE WORK TYPE</button>
        </div>
      </div>
    </div>
  );
}

export default function WorkbackBuilder() {
  const [view,            setView]            = useState("setup");
  const [projectName,     setProjectName]     = useState("");
  const [projectType,     setProjectType]     = useState("npi");
  const [direction,       setDirection]       = useState("backward");
  const [targetDate,      setTargetDate]      = useState("2026-06-15");
  const [workTypes,       setWorkTypes]       = useState({ email: true, pdp: false, plp: false, hp: false });
  const [customWorkTypes, setCustomWorkTypes] = useState([]);
  const [owners,          setOwners]          = useState(DEFAULT_OWNERS);
  const [translationsOn,  setTranslationsOn]  = useState(true);
  const [fastFollows,     setFastFollows]     = useState([]);
  const [phases,          setPhases]          = useState({});
  const [schedule,        setSchedule]        = useState(null);
  const [activeTab,       setActiveTab]       = useState("email");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const ganttRef = useRef(null);
  const allWorkTypes = [...BUILT_IN_WORK_TYPES, ...customWorkTypes];
  const addOwner    = useCallback((id, def) => setOwners(prev => ({ ...prev, [id]: def })), []);
  const deleteOwner = useCallback((id) => {
    setOwners(prev => { const n = { ...prev }; delete n[id]; return n; });
    setPhases(prev => { const n = { ...prev }; Object.keys(n).forEach(wt => { n[wt] = n[wt].map(p => p.owner === id ? { ...p, owner: "ops" } : p); }); return n; });
  }, []);
  const ownerInfo = (id) => owners[id] || { label: id, color: "#888" };
  const toggleWorkType = (id) => setWorkTypes(prev => ({ ...prev, [id]: !prev[id] }));
  const deleteCustomWorkType = (id) => {
    setCustomWorkTypes(prev => prev.filter(c => c.id !== id));
    setWorkTypes(prev => { const n = {...prev}; delete n[id]; return n; });
    setPhases(prev => { const n = {...prev}; delete n[id]; return n; });
    if (activeTab === id) setActiveTab("email");
  };
  const handleAddCustomWorkType = (wtDef) => {
    setCustomWorkTypes(prev => [...prev, wtDef]);
    setWorkTypes(prev => ({ ...prev, [wtDef.id]: true }));
    setPhases(prev => ({ ...prev, [wtDef.id]: wtDef.phases }));
    setActiveTab(wtDef.id);
    setShowCustomModal(false);
  };
  const initPhases = useCallback(() => {
    const np = {};
    allWorkTypes.forEach(({ id, custom }) => {
      if (!workTypes[id]) return;
      if (custom) { const cwt = customWorkTypes.find(c => c.id === id); if (cwt) np[id] = cwt.phases.map(p => ({ ...p })); }
      else { const tpl = projectType === "npi" ? NPI_PHASES(id) : NON_NPI_PHASES(id); np[id] = tpl.map(p => ({ ...p, enabled: p.translationPhase ? translationsOn && (p.defaultOn !== false) : (p.defaultOn !== false), duration: typeof p.dur === "number" ? p.dur : (p.dur ?? 3) })); }
    });
    setPhases(np);
    const first = allWorkTypes.find(wt => workTypes[wt.id]);
    if (first) setActiveTab(first.id);
  }, [workTypes, projectType, translationsOn, customWorkTypes]);
  const updatePhase = (wt, idx, field, value) => { setPhases(prev => { const u = { ...prev }; u[wt] = [...u[wt]]; u[wt][idx] = { ...u[wt][idx], [field]: value }; return u; }); };
  const calculateSchedule = () => {
    const result = {}, target = parseDate(targetDate);
    Object.entries(phases).forEach(([wt, pl]) => {
      const ep = pl.filter(p => p.enabled); if (!ep.length) return;
      const sched = [];
      if (direction === "backward") {
        let cur = new Date(target);
        for (let i = ep.length - 1; i >= 0; i--) { const p = ep[i], end = new Date(cur); const start = p.duration <= 1 ? new Date(end) : subBizDays(end, p.duration - 1); sched.unshift({ ...p, start, end }); cur = subBizDays(start, 1); }
      } else {
        let cur = new Date(target);
        for (let i = 0; i < ep.length; i++) { const p = ep[i], start = new Date(cur); const end = p.duration <= 1 ? new Date(start) : addBizDays(start, p.duration - 1); sched.push({ ...p, start, end }); cur = addBizDays(end, 1); }
      }
      result[wt] = sched;
    });
    setSchedule(result); setView("schedule");
  };
  const getDateRange = () => {
    if (!schedule) return { min: new Date(), max: new Date() };
    let min = new Date("2099-01-01"), max = new Date("2000-01-01");
    Object.values(schedule).forEach(ps => ps.forEach(p => { if (p.start < min) min = new Date(p.start); if (p.end > max) max = new Date(p.end); }));
    fastFollows.forEach(ff => { const d = parseDate(ff.date); if (d > max) max = new Date(d); });
    min.setDate(min.getDate() - 3); max.setDate(max.getDate() + 3);
    return { min, max };
  };
  const exportTxt = () => {
    if (!schedule) return;
    const target = parseDate(targetDate);
    let lines = [`WORKBACK SCHEDULE`, `Project: ${projectName || "Untitled"}`, `Type: ${projectType.toUpperCase()}`, `${direction === "backward" ? "Launch" : "Kick-off"}: ${fmtDisplay(target)}`, `Translations: ${translationsOn ? "ON" : "OFF"}`, ``];
    Object.entries(schedule).forEach(([wt, ps]) => { lines.push(`━━━ ${allWorkTypes.find(w => w.id === wt)?.label?.toUpperCase() || wt} ━━━`); ps.forEach(p => lines.push(`  ${fmtDisplay(p.start)} → ${fmtDisplay(p.end)} | ${p.name} | ${ownerInfo(p.owner).label} | T-${weeksBetween(p.start, target)}w`)); lines.push(""); });
    if (fastFollows.length) { lines.push("━━━ FAST-FOLLOWS ━━━"); fastFollows.forEach(ff => lines.push(`  ${ff.date} | ${ff.name}`)); }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    a.download = `${(projectName || "schedule").replace(/\s+/g, "-").toLowerCase()}-workback.txt`; a.click();
  };
  const exportCsv = () => {
    if (!schedule) return;
    const target = parseDate(targetDate);
    let rows = [["Work Type","Phase","Owner","Start","End","Biz Days","T-minus"]];
    Object.entries(schedule).forEach(([wt, ps]) => { const wtLabel = allWorkTypes.find(w => w.id === wt)?.label || wt; ps.forEach(p => rows.push([wtLabel, p.name, ownerInfo(p.owner).label, fmt(p.start), fmt(p.end), p.duration, `T-${weeksBetween(p.start, target)}`])); });
    if (fastFollows.length) fastFollows.forEach(ff => rows.push(["Fast-Follow", ff.name, "", ff.date, ff.date, "", ""]));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = `${(projectName || "schedule").replace(/\s+/g, "-").toLowerCase()}-workback.csv`; a.click();
  };
  const exportPdf = () => {
    const pw = window.open("", "_blank"), target = parseDate(targetDate);
    let html = `<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#0a0a0a;color:#e0e0e0;padding:40px}h1{font-family:'Barlow Condensed',sans-serif;font-size:32px;letter-spacing:6px;font-weight:800;margin-bottom:4px}.meta{font-size:12px;color:#777;margin-bottom:30px}.wt{margin-bottom:32px}.wt-title{font-family:'Barlow Condensed',sans-serif;font-size:18px;letter-spacing:4px;font-weight:700;padding:8px 14px;border-radius:4px;display:inline-block;margin-bottom:12px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:9px;letter-spacing:2px;color:#666;padding:6px 10px;border-bottom:1px solid #222}td{font-size:12px;padding:7px 10px;border-bottom:1px solid #151515}.badge{font-size:9px;padding:2px 8px;border-radius:2px;letter-spacing:1px}@media print{body{background:#0a0a0a!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><h1>${projectName || "UNTITLED PROJECT"}</h1><div class="meta">${projectType.toUpperCase()} · ${direction === "backward" ? "Launch" : "Kick-off"}: ${fmtDisplay(target)} · Translations: ${translationsOn ? "ON" : "US Only"}</div>`;
    Object.entries(schedule).forEach(([wt, ps]) => { const wi = allWorkTypes.find(w => w.id === wt) || { color: "#888", light: "rgba(136,136,136,0.15)", label: wt }; html += `<div class="wt"><div class="wt-title" style="background:${wi.light};color:${wi.color}">${wi.label}</div><table><tr><th>Phase</th><th>Owner</th><th>Start</th><th>End</th><th>Days</th><th>T-minus</th></tr>`; ps.forEach(p => { const tW = weeksBetween(p.start, target), ow = ownerInfo(p.owner); html += `<tr><td>${p.name}</td><td><span class="badge" style="background:${ow.color}22;color:${ow.color}">${ow.label}</span></td><td>${fmtDisplay(p.start)}</td><td>${fmtDisplay(p.end)}</td><td>${p.duration}</td><td style="color:#E31937;font-weight:600">T-${tW}w</td></tr>`; }); html += `</table></div>`; });
    if (fastFollows.length) { html += `<div style="margin-top:20px;border-top:1px solid #222;padding-top:16px"><div class="wt-title" style="background:rgba(227,25,55,0.15);color:#E31937">FAST-FOLLOWS</div><table>`; fastFollows.forEach(ff => { html += `<tr><td>${ff.name}</td><td>${ff.date}</td><td style="color:#E31937">T+${weeksBetween(parseDate(ff.date), target)}w</td></tr>`; }); html += `</table></div>`; }
    html += `</body></html>`; pw.document.write(html); pw.document.close(); setTimeout(() => pw.print(), 500);
  };
  const S = {
    app:    { display: "flex", flexDirection: "column", height: "100vh", background: "#060606", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #151515", flexShrink: 0 },
    badge:  { fontSize: 9, letterSpacing: 2, padding: "3px 10px", borderRadius: 2, background: "rgba(227,25,55,0.15)", color: "#E31937" },
    main:   { flex: 1, overflow: "auto", padding: "24px" },
    lbl:    { fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 },
    input:  { width: "100%", background: "#0e0e0e", border: "1.5px solid #1e1e1e", color: "#ddd", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "10px 14px", borderRadius: 4, outline: "none", boxSizing: "border-box" },
    btn:    (a) => ({ padding: "8px 18px", background: a ? "#E31937" : "#0e0e0e", border: `1.5px solid ${a ? "#E31937" : "#1e1e1e"}`, color: a ? "#fff" : "#888", fontSize: 11, letterSpacing: 2, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }),
    pill:   (a, c) => ({ padding: "8px 16px", background: a ? (c||"#E31937")+"22" : "#0e0e0e", border: `1.5px solid ${a ? (c||"#E31937") : "#1e1e1e"}`, color: a ? (c||"#E31937") : "#555", fontSize: 11, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }),
    card:   { background: "#0a0a0a", border: "1px solid #151515", borderRadius: 6, padding: "20px", marginBottom: 16 },
    sec:    { marginBottom: 24 },
  };
  const enabledCount = Object.values(workTypes).filter(Boolean).length;
  const renderSetup = () => (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, letterSpacing: 8, fontWeight: 800, marginBottom: 6 }}>WORKBACK SCHEDULE BUILDER</div>
        <div style={{ fontSize: 12, color: "#444" }}>Configure your project, then generate your schedule</div>
      </div>
      <div style={S.card}>
        <div style={S.sec}><span style={S.lbl}>Project Name</span><input style={S.input} placeholder="e.g. Global Launch for XYZ" value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
        <div style={S.sec}><span style={S.lbl}>Project Type</span><div style={{ display: "flex", gap: 8 }}>{[["npi","NPI"],["non-npi","Non-NPI (Misc)"]].map(([id,lbl]) => (<button key={id} onClick={() => setProjectType(id)} style={S.btn(projectType === id)}>{lbl}</button>))}</div></div>
        <div style={S.sec}><span style={S.lbl}>Schedule Direction</span><div style={{ display: "flex", gap: 8 }}>{[["backward","← Backward from Launch"],["forward","Forward from Kick-off →"]].map(([id,lbl]) => (<button key={id} onClick={() => setDirection(id)} style={S.btn(direction === id)}>{lbl}</button>))}</div></div>
        <div style={S.sec}><span style={S.lbl}>{direction === "backward" ? "Launch Date" : "Kick-off Date"}</span><input type="date" style={S.input} value={targetDate} onChange={e => setTargetDate(e.target.value)} /></div>
        <div style={S.sec}>
          <span style={S.lbl}>Work Types</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {BUILT_IN_WORK_TYPES.map(wt => (<button key={wt.id} onClick={() => toggleWorkType(wt.id)} style={S.pill(workTypes[wt.id], wt.color)}>{wt.label}</button>))}
            {customWorkTypes.map(cwt => (
              <div key={cwt.id} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => toggleWorkType(cwt.id)} style={{ ...S.pill(workTypes[cwt.id], cwt.color), borderRadius: "3px 0 0 3px", borderRight: "none" }}>{cwt.label}</button>
                <button onClick={() => deleteCustomWorkType(cwt.id)} style={{ padding: "8px 8px", background: workTypes[cwt.id] ? cwt.color+"22" : "#0e0e0e", border: `1.5px solid ${workTypes[cwt.id] ? cwt.color : "#1e1e1e"}`, color: workTypes[cwt.id] ? cwt.color : "#555", fontSize: 12, fontFamily: "'DM Sans', sans-serif", borderRadius: "0 3px 3px 0", cursor: "pointer" }}>×</button>
              </div>
            ))}
            <button onClick={() => setShowCustomModal(true)} style={{ padding: "8px 14px", background: "transparent", border: "1.5px dashed #2a2a2a", color: "#444", fontSize: 11, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#E31937"; e.currentTarget.style.color="#E31937"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color="#444"; }}>+ CUSTOM</button>
          </div>
        </div>
        <div style={S.sec}><span style={S.lbl}>Translations</span><div style={{ display: "flex", gap: 8 }}><button onClick={() => setTranslationsOn(true)} style={S.pill(translationsOn,"#A855F7")}>ON — 16 Languages / 27 Locales</button><button onClick={() => setTranslationsOn(false)} style={S.pill(!translationsOn,"#666")}>US Only</button></div></div>
        <div style={S.sec}>
          <span style={S.lbl}>Post-Launch Fast-Follow Milestones</span>
          {fastFollows.map((ff, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="e.g. Buyability update" value={ff.name} onChange={e => { const nf = [...fastFollows]; nf[i] = { ...nf[i], name: e.target.value }; setFastFollows(nf); }} />
              <input type="date" style={{ ...S.input, width: 170 }} value={ff.date} onChange={e => { const nf = [...fastFollows]; nf[i] = { ...nf[i], date: e.target.value }; setFastFollows(nf); }} />
              <button onClick={() => setFastFollows(f2 => f2.filter((_,j) => j !== i))} style={{ background: "none", border: "1px solid #2a1015", color: "#E31937", width: 28, height: 28, borderRadius: 3, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
          <button onClick={() => setFastFollows(f => [...f, { name: "", date: targetDate }])} style={{ ...S.btn(false), fontSize: 10, padding: "6px 14px" }}>+ Add Fast-Follow</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}><span style={{ ...S.lbl, marginBottom: 0 }}>Owners / Assignees</span></div>
        <ManageOwners owners={owners} onAddOwner={addOwner} onDeleteOwner={deleteOwner} />
      </div>
      {enabledCount > 0 && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ ...S.lbl, marginBottom: 0 }}>Phase Configuration</span>
            <button onClick={initPhases} style={{ ...S.btn(true), fontSize: 10, padding: "6px 14px" }}>{Object.keys(phases).length > 0 ? "RESET DEFAULTS" : "LOAD DEFAULTS"}</button>
          </div>
          {Object.keys(phases).length > 0 && (
            <>
              <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #151515", paddingBottom: 8, flexWrap: "wrap" }}>
                {allWorkTypes.filter(wt => workTypes[wt.id] && phases[wt.id]).map(wt => (
                  <button key={wt.id} onClick={() => setActiveTab(wt.id)} style={{ padding: "6px 14px", fontSize: 11, letterSpacing: 1, fontWeight: 600, background: activeTab === wt.id ? wt.light : "transparent", border: `1px solid ${activeTab === wt.id ? wt.color : "transparent"}`, color: activeTab === wt.id ? wt.color : "#555", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {wt.label}{wt.custom && <span style={{ marginLeft: 5, fontSize: 7, letterSpacing: 1, opacity: 0.7 }}>CUSTOM</span>}
                  </button>
                ))}
              </div>
              {phases[activeTab] && (() => {
                const awt = allWorkTypes.find(w => w.id === activeTab);
                return (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 190px 60px", gap: 8, marginBottom: 8, padding: "0 4px" }}>
                      {["ON","PHASE","OWNER","DAYS"].map(h => <span key={h} style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>{h}</span>)}
                    </div>
                    {phases[activeTab].map((p, idx) => {
                      const dimmed = p.translationPhase && !translationsOn;
                      return (
                        <div key={p.id || idx} style={{ display: "grid", gridTemplateColumns: "36px 1fr 190px 60px", gap: 8, padding: "8px 4px", borderBottom: "1px solid #111", alignItems: "start", opacity: dimmed ? 0.3 : p.enabled ? 1 : 0.4 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 9 }}>
                            <div onClick={() => !dimmed && updatePhase(activeTab, idx, "enabled", !p.enabled)} style={{ width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${p.enabled && !dimmed ? "#E31937" : "#333"}`, background: p.enabled && !dimmed ? "#E31937" : "transparent", cursor: dimmed ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{p.enabled && !dimmed && "✓"}</div>
                          </div>
                          <div style={{ paddingTop: 8 }}>
                            <div style={{ fontSize: 12.5, color: "#ccc" }}>{p.name}</div>
                            {p.milestone && <span style={{ fontSize: 8, letterSpacing: 2, color: "#E31937", fontWeight: 600 }}>MILESTONE</span>}
                            {p.translationPhase && <span style={{ fontSize: 8, letterSpacing: 1, color: "#A855F7", marginLeft: 4 }}>LOC</span>}
                          </div>
                          <OwnerSelect value={p.owner} onChange={v => updatePhase(activeTab, idx, "owner", v)} owners={owners} onAddOwner={addOwner} inputStyle={{ ...S.input, padding: "7px 8px", fontSize: 11 }} />
                          <input type="number" min={1} value={p.duration} onChange={e => updatePhase(activeTab, idx, "duration", Math.max(1, parseInt(e.target.value)||1))} disabled={dimmed} style={{ ...S.input, width: 52, padding: "7px 8px", fontSize: 12, textAlign: "center" }} />
                        </div>
                      );
                    })}
                    {awt?.custom && (
                      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={() => setPhases(prev => ({ ...prev, [activeTab]: [...(prev[activeTab]||[]), { id: `p${Date.now()}`, name: "New phase", owner: Object.keys(owners)[0]||"ops", duration: 3, enabled: true, defaultOn: true }] }))} style={{ ...S.btn(false), fontSize: 10, padding: "5px 12px" }}>+ ADD PHASE</button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
      <button onClick={calculateSchedule} disabled={enabledCount === 0 || Object.keys(phases).length === 0}
        style={{ width: "100%", padding: "18px", background: enabledCount > 0 && Object.keys(phases).length > 0 ? "linear-gradient(135deg, #E31937 0%, #aa0020 100%)" : "#1a0a0a", color: enabledCount > 0 && Object.keys(phases).length > 0 ? "#fff" : "#550010", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: 6, fontWeight: 800, border: "none", borderRadius: 4, cursor: enabledCount > 0 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
        GENERATE SCHEDULE →
      </button>
    </div>
  );
  const renderSchedule = () => {
    if (!schedule) return null;
    const target = parseDate(targetDate);
    const { min, max } = getDateRange();
    const getPos = (d) => Math.max(0, Math.min(100, ((d - min) / (max - min)) * 100));
    const weekMarkers = [];
    let wk = new Date(min); wk.setDate(wk.getDate() - wk.getDay() + 1);
    while (wk <= max) { const tW = weeksBetween(wk, target); weekMarkers.push({ date: new Date(wk), tMinus: direction === "backward" ? `T-${tW}` : `T+${tW}`, pos: getPos(wk) }); wk.setDate(wk.getDate() + 7); }
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, letterSpacing: 5, fontWeight: 700 }}>{projectName || "UNTITLED PROJECT"}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{projectType.toUpperCase()} · {direction === "backward" ? "Launch" : "Kick-off"}: {fmtDisplay(target)} · {translationsOn ? "16 Languages" : "US Only"}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("setup")} style={S.btn(false)}>← EDIT</button>
            <button onClick={exportTxt} style={S.btn(false)}>TXT</button>
            <button onClick={exportCsv} style={S.btn(false)}>CSV</button>
            <button onClick={exportPdf} style={S.btn(true)}>PDF ↗</button>
          </div>
        </div>
        <div ref={ganttRef} style={{ background: "#0a0a0a", border: "1px solid #151515", borderRadius: 6, padding: "20px", overflow: "auto" }}>
          <div style={{ position: "relative", height: 24, marginLeft: 220, marginBottom: 4 }}>{weekMarkers.filter(w => w.pos > 0 && w.pos < 100).map((w, i) => (<div key={i} style={{ position: "absolute", left: `${w.pos}%`, transform: "translateX(-50%)", fontSize: 8, letterSpacing: 1, color: "#444", whiteSpace: "nowrap" }}>{w.tMinus}</div>))}</div>
          <div style={{ position: "relative", height: 20, marginLeft: 220, marginBottom: 8, borderBottom: "1px solid #151515" }}>{weekMarkers.filter((w,i) => i%2===0 && w.pos>0 && w.pos<100).map((w, i) => (<div key={i} style={{ position: "absolute", left: `${w.pos}%`, transform: "translateX(-50%)", fontSize: 9, color: "#333", whiteSpace: "nowrap" }}>{fmtDisplay(w.date).split(" ").slice(1).join(" ")}</div>))}</div>
          {Object.entries(schedule).map(([wt, phaseList]) => {
            const wtInfo = allWorkTypes.find(w => w.id === wt) || { color: "#888", light: "rgba(136,136,136,0.15)", label: wt };
            return (
              <div key={wt} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: wtInfo.color }} /><span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 3, fontWeight: 700, color: wtInfo.color }}>{wtInfo.label}</span>{wtInfo.custom && <span style={{ fontSize: 7, letterSpacing: 2, color: wtInfo.color, opacity: 0.6, fontWeight: 700 }}>CUSTOM</span>}</div>
                {phaseList.map((p, idx) => {
                  const left = getPos(p.start), right = getPos(p.end), width = Math.max(0.5, right - left);
                  const ow = ownerInfo(p.owner);
                  return (
                    <div key={p.id||idx} style={{ display: "flex", alignItems: "center", marginBottom: 3, height: 28 }}>
                      <div style={{ width: 220, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, paddingRight: 12 }}>
                        <span style={{ fontSize: 10.5, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: 7, letterSpacing: 1, padding: "2px 5px", borderRadius: 2, background: ow.color+"18", color: ow.color, flexShrink: 0, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ow.label.split(" ").slice(-1)[0]}</span>
                      </div>
                      <div style={{ flex: 1, position: "relative", height: "100%" }}>
                        {weekMarkers.filter(w => w.pos>0 && w.pos<100).map((w, i) => (<div key={i} style={{ position: "absolute", left: `${w.pos}%`, top: 0, bottom: 0, width: 1, background: "#111" }} />))}
                        <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 4, height: 20, borderRadius: p.milestone ? 10 : 3, background: p.milestone ? wtInfo.color : `linear-gradient(90deg, ${wtInfo.color}cc, ${wtInfo.color}88)`, minWidth: p.milestone ? 10 : 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {width > 3 && <span style={{ fontSize: 8, color: "#fff", fontWeight: 600, letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", padding: "0 4px" }}>{fmtDisplay(p.start).slice(4)} – {fmtDisplay(p.end).slice(4)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ position: "relative", marginLeft: 220, height: 0 }}>
            <div style={{ position: "absolute", left: `${getPos(target)}%`, top: -1000, bottom: -20, width: 2, background: "#E31937", opacity: 0.6, zIndex: 5 }} />
            <div style={{ position: "absolute", left: `${getPos(target)}%`, transform: "translateX(-50%)", top: 4, fontSize: 8, letterSpacing: 2, color: "#E31937", fontWeight: 700, whiteSpace: "nowrap", zIndex: 6 }}>▼ {direction === "backward" ? "LAUNCH" : "KICK-OFF"}</div>
          </div>
          {fastFollows.length > 0 && (
            <div style={{ marginTop: 24, marginLeft: 220, position: "relative", height: 30 }}>
              {fastFollows.map((ff, i) => { const pos = getPos(parseDate(ff.date)); return (<div key={i} style={{ position: "absolute", left: `${pos}%`, transform: "translateX(-50%)", textAlign: "center" }}><div style={{ width: 2, height: 16, background: "#E31937", margin: "0 auto", opacity: 0.4 }} /><div style={{ fontSize: 8, color: "#E31937", letterSpacing: 1, whiteSpace: "nowrap", marginTop: 2 }}>{ff.name || "Fast-follow"}</div></div>); })}
            </div>
          )}
        </div>
        <div style={{ marginTop: 24 }}>
          {Object.entries(schedule).map(([wt, phaseList]) => {
            const wtInfo = allWorkTypes.find(w => w.id === wt) || { color: "#888", light: "rgba(136,136,136,0.15)", label: wt };
            const total = phaseList.reduce((s, p) => s + p.duration, 0);
            return (
              <div key={wt} style={{ ...S.card, borderLeft: `3px solid ${wtInfo.color}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, letterSpacing: 3, fontWeight: 700, color: wtInfo.color }}>{wtInfo.label}</span>{wtInfo.custom && <span style={{ fontSize: 7, letterSpacing: 2, padding: "2px 6px", borderRadius: 2, background: wtInfo.color+"18", color: wtInfo.color }}>CUSTOM</span>}</div>
                  <span style={{ fontSize: 10, color: "#555" }}>{total} biz days · ~{Math.ceil(total/5)} weeks</span>
                </div>
                {phaseList.map((p, pi) => {
                  const ow = ownerInfo(p.owner); const tW = weeksBetween(p.start, target);
                  return (
                    <div key={p.id||pi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #111" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 11.5, color: "#bbb" }}>{p.name}</span><span style={{ fontSize: 8, letterSpacing: 1, padding: "2px 6px", borderRadius: 2, background: ow.color+"15", color: ow.color }}>{ow.label}</span></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}><span style={{ fontSize: 11, color: "#666" }}>{fmtDisplay(p.start)} → {fmtDisplay(p.end)}</span><span style={{ fontSize: 10, color: "#444", minWidth: 36, textAlign: "right" }}>{p.duration}d</span><span style={{ fontSize: 10, color: "#E31937", fontWeight: 600, minWidth: 44, textAlign: "right" }}>{p.start <= target ? `T-${tW}w` : `T+${tW}w`}</span></div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.7)}input[type="number"]::-webkit-inner-spin-button{opacity:1}input:focus{border-color:#E31937 !important;outline:none}select{color-scheme:dark}`}</style>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center" }}><span style={S.badge}>WORKBACK BUILDER</span></div>
        {view === "schedule" && schedule && (<div style={{ fontSize: 10, color: "#444" }}>{Object.keys(schedule).length} work type{Object.keys(schedule).length !== 1 ? "s" : ""} · {Object.values(schedule).flat().length} phases</div>)}
      </div>
      <div style={S.main}>{view === "setup" ? renderSetup() : renderSchedule()}</div>
      {showCustomModal && (<CustomWorkTypeModal onSave={handleAddCustomWorkType} onClose={() => setShowCustomModal(false)} owners={owners} onAddOwner={addOwner} />)}
    </div>
  );
}
