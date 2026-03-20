import { useState, useRef, useCallback, useEffect } from "react";

// ── LOCALE DATA ────────────────────────────────────────────────────────────

const ALL_LOCALES = [
  // ── Tier 1: Core Markets (15 locales) ──────────────────────────
  { code: "en-US",   label: "English (US)",              flag: "🇺🇸", tier: 1 },
  { code: "ja-JP",   label: "Japanese",                  flag: "🇯🇵", tier: 1 },
  { code: "en-GB",   label: "English (UK)",              flag: "🇬🇧", tier: 1 },
  { code: "en-CN",   label: "English (China)",           flag: "🇨🇳", tier: 1 },
  { code: "en-IN",   label: "English (India)",           flag: "🇮🇳", tier: 1 },
  { code: "en-CA",   label: "English (Canada)",          flag: "🇨🇦", tier: 1 },
  { code: "fr-CA",   label: "French (Canada)",           flag: "🇨🇦", tier: 1 },
  { code: "es-MX",   label: "Spanish (Mexico)",          flag: "🇲🇽", tier: 1 },
  { code: "es-ES",   label: "Spanish (Spain)",           flag: "🇪🇸", tier: 1 },
  { code: "de-DE",   label: "German",                    flag: "🇩🇪", tier: 1 },
  { code: "fr-FR",   label: "French (France)",           flag: "🇫🇷", tier: 1 },
  { code: "en-AU",   label: "English (Australia)",       flag: "🇦🇺", tier: 1 },
  { code: "it-IT",   label: "Italian",                   flag: "🇮🇹", tier: 1 },
  { code: "en-IE",   label: "English (Ireland)",         flag: "🇮🇪", tier: 1 },
  { code: "en-SG",   label: "English (Singapore)",       flag: "🇸🇬", tier: 1 },
  // ── Tier 2: Additional Markets (12 locales) ────────────────────
  { code: "zh-HK",   label: "Chinese (Hong Kong)",       flag: "🇭🇰", tier: 2 },
  { code: "pt-BR",   label: "Portuguese (Brazil)",       flag: "🇧🇷", tier: 2 },
  { code: "zh-TW",   label: "Chinese (Taiwan)",          flag: "🇹🇼", tier: 2 },
  { code: "ko-KR",   label: "Korean",                    flag: "🇰🇷", tier: 2 },
  { code: "nl-NL",   label: "Dutch (Netherlands)",       flag: "🇳🇱", tier: 2 },
  { code: "fr-BE",   label: "French (Belgium)",          flag: "🇧🇪", tier: 2 },
  { code: "nl-BE",   label: "Dutch (Belgium)",           flag: "🇧🇪", tier: 2 },
  { code: "de-CH",   label: "German (Switzerland)",      flag: "🇨🇭", tier: 2 },
  { code: "fr-CH",   label: "French (Switzerland)",      flag: "🇨🇭", tier: 2 },
  { code: "de-AT",   label: "German (Austria)",          flag: "🇦🇹", tier: 2 },
  { code: "sv-SE",   label: "Swedish",                   flag: "🇸🇪", tier: 2 },
  { code: "en-HK",   label: "English (Hong Kong)",       flag: "🇭🇰", tier: 2 },
];

const TIER1_CODES = ALL_LOCALES.filter(l => l.tier === 1).map(l => l.code);
const WORLDWIDE_CODES = ALL_LOCALES.map(l => l.code);

const TRANSLATION_TIERS = [
  { id: "none",      label: "US Only",   sub: "No translations",              locales: [] },
  { id: "tier1",     label: "Tier 1",    sub: "15 locales · 10 languages", locales: TIER1_CODES },
  { id: "worldwide", label: "Worldwide", sub: "27 locales · 16 languages", locales: WORLDWIDE_CODES },
  { id: "custom",    label: "Custom",    sub: "Choose specific locales",       locales: null },
];

// ── CONSTANTS ──────────────────────────────────────────────────────────────

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

const STORAGE_KEY = "schedule_builder_saved_projects";

// ── DATE HELPERS ────────────────────────────────────────────────────────────

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
const fmtShort = (ts) => {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
};

// ── LOCALE PICKER MODAL ────────────────────────────────────────────────────

function LocalePickerModal({ selected, onSave, onClose }) {
  const [sel, setSel] = useState(new Set(selected));
  const toggle = (code) => setSel(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  const selectAll = () => setSel(new Set(ALL_LOCALES.map(l => l.code)));
  const clearAll  = () => setSel(new Set());

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0e0e0e", border: "1px solid #222", borderRadius: 8, width: "100%", maxWidth: 620, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #151515" }}>
          <div>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: 4, fontWeight: 700 }}>CUSTOM LOCALES</span>
            <span style={{ marginLeft: 12, fontSize: 10, color: "#555" }}>{sel.size} selected</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={selectAll} style={{ fontSize: 9, letterSpacing: 1, padding: "4px 10px", background: "transparent", border: "1px solid #222", color: "#555", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>ALL</button>
            <button onClick={clearAll}  style={{ fontSize: 9, letterSpacing: 1, padding: "4px 10px", background: "transparent", border: "1px solid #222", color: "#555", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>NONE</button>
            <button onClick={onClose} style={{ background: "none", border: "1px solid #222", color: "#888", width: 28, height: 28, borderRadius: 3, cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {/* Tier 1 group */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 8, letterSpacing: 3, color: "#333", marginBottom: 10, fontWeight: 700 }}>TIER 1 — CORE MARKETS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_LOCALES.filter(l => l.tier === 1).map(l => (
                <button key={l.code} onClick={() => toggle(l.code)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 4, cursor: "pointer",
                  background: sel.has(l.code) ? "rgba(168,85,247,0.15)" : "#0a0a0a",
                  border: `1.5px solid ${sel.has(l.code) ? "#A855F7" : "#1e1e1e"}`,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s",
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{l.flag}</span>
                  <span style={{ fontSize: 10, color: sel.has(l.code) ? "#A855F7" : "#666", whiteSpace: "nowrap" }}>{l.code}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Tier 2 group */}
          <div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: "#333", marginBottom: 10, fontWeight: 700 }}>TIER 2 — ADDITIONAL MARKETS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_LOCALES.filter(l => l.tier === 2).map(l => (
                <button key={l.code} onClick={() => toggle(l.code)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 4, cursor: "pointer",
                  background: sel.has(l.code) ? "rgba(168,85,247,0.15)" : "#0a0a0a",
                  border: `1.5px solid ${sel.has(l.code) ? "#A855F7" : "#1e1e1e"}`,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s",
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{l.flag}</span>
                  <span style={{ fontSize: 10, color: sel.has(l.code) ? "#A855F7" : "#666", whiteSpace: "nowrap" }}>{l.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #151515", display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#444" }}>
            {sel.size > 0 ? [...sel].map(c => ALL_LOCALES.find(l => l.code === c)?.flag).join(" ") : "No locales selected"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "8px 18px", background: "#0e0e0e", border: "1.5px solid #1e1e1e", color: "#888", fontSize: 11, letterSpacing: 2, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer" }}>CANCEL</button>
            <button onClick={() => onSave([...sel])} style={{ padding: "8px 18px", background: "#A855F7", border: "1.5px solid #A855F7", color: "#fff", fontSize: 11, letterSpacing: 2, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer" }}>SAVE SELECTION</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TRANSLATION TIER SELECTOR ──────────────────────────────────────────────

function TranslationTierSelector({ value, customLocales, onChange, onCustomLocales }) {
  const [showPicker, setShowPicker] = useState(false);

  const getLocaleCount = (tier) => {
    if (tier.id === "custom") return customLocales.length;
    return tier.locales.length;
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: value === "custom" && customLocales.length > 0 ? 10 : 0 }}>
        {TRANSLATION_TIERS.map(tier => {
          const active = value === tier.id;
          const accentColor = "#A855F7";
          const count = getLocaleCount(tier);
          return (
            <button key={tier.id} onClick={() => {
              onChange(tier.id);
              if (tier.id === "custom") setShowPicker(true);
            }} style={{
              padding: "14px 10px", textAlign: "left", cursor: "pointer",
              background: active ? "rgba(168,85,247,0.12)" : "#0a0a0a",
              border: `1.5px solid ${active ? accentColor : "#1e1e1e"}`,
              borderRadius: 6, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: active ? accentColor : "#bbb", display: "block" }}>{tier.label}</span>
              <span style={{ fontSize: 10, color: active ? accentColor + "cc" : "#444", lineHeight: 1.3 }}>
                {tier.id === "custom" && customLocales.length > 0
                  ? `${customLocales.length} locales selected`
                  : tier.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom selected locale flags */}
      {value === "custom" && customLocales.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
            {customLocales.map(code => {
              const loc = ALL_LOCALES.find(l => l.code === code);
              return loc ? <span key={code} title={loc.label} style={{ fontSize: 18, lineHeight: 1, cursor: "default" }}>{loc.flag}</span> : null;
            })}
          </div>
          <button onClick={() => setShowPicker(true)} style={{ fontSize: 9, letterSpacing: 1, padding: "4px 10px", background: "transparent", border: "1px solid #333", color: "#666", borderRadius: 3, cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>EDIT</button>
        </div>
      )}

      {/* Tier 1 sub-label */}
      {value === "tier1" && (
        <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 6 }}>
          {ALL_LOCALES.filter(l => l.tier === 1).map(l => l.flag).join(" ")}
        </div>
      )}
      {value === "worldwide" && (
        <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 6 }}>
          All Tier 1 + {ALL_LOCALES.filter(l => l.tier === 2).map(l => l.flag).join(" ")}
        </div>
      )}

      {showPicker && (
        <LocalePickerModal
          selected={customLocales}
          onSave={(codes) => { onCustomLocales(codes); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ── SAVE PROJECTS BAR ──────────────────────────────────────────────────────
// Compact top-of-page save/load bar replacing the sidebar

function SaveProjectsBar({ onLoad, currentState }) {
  const [projects, setProjects] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setProjects(raw ? JSON.parse(raw) : []);
    } catch { setProjects([]); }
  }, []);

  const persist = (updated) => {
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    persist([{ id: Date.now(), name: saveName.trim(), savedAt: Date.now(), state: currentState }, ...projects]);
    setSaveName(""); setSaveMode(false);
  };

  const handleDelete = (id) => { persist(projects.filter(p => p.id !== id)); setDeleteConfirm(null); };

  const btnStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
    background: active ? "rgba(227,25,55,0.12)" : "#0a0a0a",
    border: `1.5px solid ${active ? "#E31937" : "#1e1e1e"}`,
    color: active ? "#E31937" : "#666", fontSize: 11, letterSpacing: 1, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Action row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: showPanel || saveMode ? 10 : 0 }}>
        <button onClick={() => { setShowPanel(p => !p); setSaveMode(false); }} style={btnStyle(showPanel)}>
          <span style={{ fontSize: 14 }}>🗂</span> SAVED PROJECTS {projects.length > 0 && <span style={{ fontSize: 9, background: "#E31937", color: "#fff", borderRadius: 10, padding: "1px 6px", marginLeft: 2 }}>{projects.length}</span>}
        </button>
        <button onClick={() => { setSaveMode(p => !p); setShowPanel(false); setSaveName(currentState.projectName || ""); }} style={btnStyle(saveMode)}>
          <span style={{ fontSize: 14 }}>💾</span> SAVE
        </button>
      </div>

      {/* Save name input */}
      {saveMode && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px", background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 6, marginBottom: 4 }}>
          <input autoFocus value={saveName} onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setSaveMode(false); }}
            placeholder="Name this project…"
            style={{ flex: 1, background: "#060606", border: "1.5px solid #E31937", color: "#ddd", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "8px 12px", borderRadius: 4, outline: "none" }} />
          <button onClick={handleSave} style={{ padding: "8px 16px", background: "#E31937", border: "none", color: "#fff", fontSize: 10, letterSpacing: 2, fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>SAVE</button>
          <button onClick={() => setSaveMode(false)} style={{ padding: "8px 10px", background: "none", border: "1px solid #222", color: "#555", fontSize: 11, borderRadius: 3, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Saved projects dropdown panel */}
      {showPanel && (
        <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 6, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#333", fontSize: 11 }}>No saved projects yet</div>
          ) : projects.map(p => (
            <div key={p.id} style={{ borderBottom: "1px solid #111" }}>
              {deleteConfirm === p.id ? (
                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, background: "#0f0a0a" }}>
                  <span style={{ fontSize: 11, color: "#E31937", flex: 1 }}>Delete "{p.name}"?</span>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: "4px 12px", background: "#E31937", border: "none", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>DELETE</button>
                  <button onClick={() => setDeleteConfirm(null)} style={{ padding: "4px 10px", background: "none", border: "1px solid #222", color: "#555", fontSize: 9, borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>CANCEL</button>
                </div>
              ) : (
                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#0e0e0e"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => { onLoad(p.state); setShowPanel(false); }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#ccc", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>{fmtShort(p.savedAt)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setDeleteConfirm(p.id); }}
                    style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "#E31937"}
                    onMouseLeave={e => e.currentTarget.style.color = "#333"}>×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── OWNER HELPERS ──────────────────────────────────────────────────────────

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
      {label && <div style={{ marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 3, background: color + "18", border: `1px solid ${color}40` }}><div style={{ width: 6, height: 6, borderRadius: 2, background: color }} /><span style={{ fontSize: 10, color }}>{label}</span></div>}
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
  if (adding) return <NewOwnerInline inputStyle={inputStyle} onSave={(id, def) => { onAddOwner(id, def); onChange(id); setAdding(false); }} onCancel={() => setAdding(false)} />;
  const builtins = Object.entries(owners).filter(([,v]) => v.builtin);
  const customs  = Object.entries(owners).filter(([,v]) => !v.builtin);
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => e.target.value === "__add__" ? setAdding(true) : onChange(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 22 }}>
        <optgroup label="── Built-in ──">{builtins.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</optgroup>
        {customs.length > 0 && <optgroup label="── Custom ──">{customs.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</optgroup>}
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
          {builtins.map(([k, v]) => (<div key={k} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 3, background: v.color + "12", border: `1px solid ${v.color}28` }}><div style={{ width: 7, height: 7, borderRadius: 2, background: v.color, flexShrink: 0 }} /><span style={{ fontSize: 11, color: v.color }}>{v.label}</span></div>))}
        </div>
      </div>
      {customs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#2a2a2a", marginBottom: 8 }}>CUSTOM</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {customs.map(([k, v]) => (<div key={k} style={{ display: "flex", alignItems: "center", borderRadius: 4, overflow: "hidden", border: `1px solid ${v.color}44` }}><div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: v.color + "12", borderRadius: 0 }}><div style={{ width: 7, height: 7, borderRadius: 2, background: v.color, flexShrink: 0 }} /><span style={{ fontSize: 11, color: v.color }}>{v.label}</span></div><button onClick={() => onDeleteOwner(k)} title="Remove owner" style={{ padding: "4px 9px", background: v.color + "12", border: "none", borderLeft: `1px solid ${v.color}30`, color: v.color, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</button></div>))}
          </div>
        </div>
      )}
      {adding ? (
        <NewOwnerInline inputStyle={inputStyle} onSave={(id, def) => { onAddOwner(id, def); setAdding(false); }} onCancel={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} style={{ padding: "7px 14px", background: "transparent", border: "1.5px dashed #252525", color: "#3a3a3a", fontSize: 10, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#E31937"; e.currentTarget.style.color = "#E31937"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#3a3a3a"; }}>+ ADD OWNER</button>
      )}
    </div>
  );
}

// ── CUSTOM WORK TYPE MODAL ──────────────────────────────────────────────────

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0e0e0e", border: "1px solid #222", borderRadius: 8, width: "100%", maxWidth: 580, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #151515" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: 4, fontWeight: 700 }}>NEW WORK TYPE</span>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #222", color: "#888", width: 28, height: 28, borderRadius: 3, cursor: "pointer", fontSize: 14 }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ marginBottom: 20 }}><span style={{ fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Work Type Name</span><input style={IS} placeholder="e.g. Paid Social, OOH, Retail" value={label} onChange={e => { setLabel(e.target.value); setError(""); }} /></div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Color</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{CUSTOM_COLORS.map((c, i) => (<div key={i} onClick={() => setColorIdx(i)} style={{ width: 28, height: 28, borderRadius: 4, background: c.color, cursor: "pointer", border: colorIdx === i ? "2px solid #fff" : "2px solid transparent", boxShadow: colorIdx === i ? `0 0 0 1px ${c.color}` : "none", transition: "all 0.15s" }} />))}</div>
            {label && <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 3, background: CUSTOM_COLORS[colorIdx].light, border: `1px solid ${CUSTOM_COLORS[colorIdx].color}` }}><span style={{ fontSize: 11, color: CUSTOM_COLORS[colorIdx].color, fontWeight: 700, letterSpacing: 1 }}>{label}</span></div>}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", fontWeight: 600 }}>Phases</span><button onClick={addPhase} style={{ ...btn(false), fontSize: 10, padding: "5px 12px" }}>+ ADD PHASE</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 190px 52px 28px", gap: 6, marginBottom: 6 }}>{["PHASE NAME","OWNER","DAYS",""].map((h,i) => <span key={i} style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>{h}</span>)}</div>
            {phases.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 190px 52px 28px", gap: 6, marginBottom: 6, alignItems: "start" }}>
                <div style={{ position: "relative" }}><input style={{ ...IS, paddingRight: p.milestone ? 72 : 12 }} placeholder="Phase name" value={p.name} onChange={e => updPhase(i, "name", e.target.value)} />{p.milestone && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 7, letterSpacing: 1, color: "#E31937", fontWeight: 700, pointerEvents: "none" }}>MILESTONE</span>}</div>
                <OwnerSelect value={p.owner} onChange={v => updPhase(i, "owner", v)} owners={owners} onAddOwner={onAddOwner} inputStyle={{ ...IS, padding: "9px 8px" }} />
                <input type="number" min={1} value={p.duration} onChange={e => updPhase(i, "duration", e.target.value)} style={{ ...IS, padding: "9px 8px", textAlign: "center" }} />
                <button onClick={() => removePhase(i)} style={{ background: "none", border: "1px solid #1a1a1a", color: "#555", width: 28, height: 36, borderRadius: 3, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            ))}
            {phases.length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "#333", fontSize: 12 }}>No phases yet</div>}
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 11, color: "#E31937" }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #151515", display: "flex", gap: 8, justifyContent: "flex-end" }}><button onClick={onClose} style={btn(false)}>CANCEL</button><button onClick={handleSave} style={btn(true)}>CREATE WORK TYPE</button></div>
      </div>
    </div>
  );
}

// ── ADJUSTMENT NOTES COMPONENT ────────────────────────────────────────────

function AdjustmentNotes({ notes, onAdd, onRemove, inputStyle, btnStyle }) {
  const [text, setText] = useState("");
  const handle = () => { if (!text.trim()) return; onAdd(text.trim()); setText(""); };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: notes.length > 0 ? 10 : 0 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="e.g. Compressed QA from 7d to 5d due to delayed creative handoff"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
        />
        <button onClick={handle} style={{ ...btnStyle(false), padding: "8px 14px", fontSize: 10, letterSpacing: 1 }}>+ ADD</button>
      </div>
      {notes.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderTop: "1px solid #111" }}>
          <span style={{ fontSize: 9, color: "#555", marginTop: 2, flexShrink: 0 }}>{n.date}</span>
          <span style={{ fontSize: 11, color: "#aaa", flex: 1, lineHeight: 1.5 }}>{n.text}</span>
          <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 13, lineHeight: 1, flexShrink: 0, padding: "0 2px" }}
            onMouseEnter={e => e.currentTarget.style.color = "#E31937"}
            onMouseLeave={e => e.currentTarget.style.color = "#333"}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── LOCALE LABEL HELPER ────────────────────────────────────────────────────

function getTranslationLabel(tier, customLocales) {
  if (tier === "none") return "US Only";
  if (tier === "tier1") return `Tier 1 (${TIER1_CODES.length} locales)`;
  if (tier === "worldwide") return `Worldwide (${WORLDWIDE_CODES.length} locales)`;
  if (tier === "custom") return `Custom (${customLocales.length} locales)`;
  return "";
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────

const INITIAL_STATE = () => ({
  projectName:      "",
  projectType:      "npi",
  direction:        "backward",
  targetDate:       "2026-06-15",
  workTypes:        { email: true, pdp: false, plp: false, hp: false },
  customWorkTypes:  [],
  owners:           DEFAULT_OWNERS,
  translationTier:  "worldwide",
  customLocales:    WORLDWIDE_CODES,
  fastFollows:      [],
  phases:           {},
  adjustmentNotes:  [],
});

export default function WorkbackBuilder() {
  const [state, setState]         = useState(INITIAL_STATE());
  const [view, setView]           = useState("setup");
  const [activeTab, setActiveTab] = useState("email");
  const [schedule, setSchedule]   = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const ganttRef = useRef(null);

  const { projectName, projectType, direction, targetDate, workTypes,
          customWorkTypes, owners, translationTier, customLocales, fastFollows, phases,
          adjustmentNotes = [] } = state;

  const addNote = (text) => {
    const now = new Date();
    const date = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`;
    set("adjustmentNotes", [...adjustmentNotes, { text, date }]);
  };
  const removeNote = (i) => set("adjustmentNotes", adjustmentNotes.filter((_,j) => j !== i));

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }));
  const setPhases = (fn) => setState(prev => ({ ...prev, phases: typeof fn === "function" ? fn(prev.phases) : fn }));

  const translationsOn = translationTier !== "none";
  const allWorkTypes   = [...BUILT_IN_WORK_TYPES, ...customWorkTypes];

  // Snapshot for saving
  const currentSnapshot = { ...state };

  const loadProject = (savedState) => {
    setState({ ...INITIAL_STATE(), ...savedState });
    setView("setup");
    setSchedule(null);
    const first = [...BUILT_IN_WORK_TYPES, ...(savedState.customWorkTypes || [])].find(wt => savedState.workTypes?.[wt.id]);
    setActiveTab(first?.id || "email");
  };

  const addOwner = useCallback((id, def) => set("owners", { ...owners, [id]: def }), [owners]);
  const deleteOwner = useCallback((id) => {
    const n = { ...owners }; delete n[id];
    set("owners", n);
    setPhases(prev => { const np = { ...prev }; Object.keys(np).forEach(wt => { np[wt] = np[wt].map(p => p.owner === id ? { ...p, owner: "ops" } : p); }); return np; });
  }, [owners]);

  const ownerInfo = (id) => owners[id] || { label: id, color: "#888" };
  const toggleWorkType = (id) => set("workTypes", { ...workTypes, [id]: !workTypes[id] });

  const deleteCustomWorkType = (id) => {
    set("customWorkTypes", customWorkTypes.filter(c => c.id !== id));
    set("workTypes", (() => { const n = { ...workTypes }; delete n[id]; return n; })());
    setPhases(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (activeTab === id) setActiveTab("email");
  };

  const handleAddCustomWorkType = (wtDef) => {
    setState(prev => ({
      ...prev,
      customWorkTypes: [...prev.customWorkTypes, wtDef],
      workTypes: { ...prev.workTypes, [wtDef.id]: true },
      phases: { ...prev.phases, [wtDef.id]: wtDef.phases },
    }));
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

  // Auto-sync phases whenever work types or project type changes
  useEffect(() => { initPhases(); }, [workTypes, projectType, translationsOn]);

  const updatePhase = (wt, idx, field, value) => {
    setPhases(prev => { const u = { ...prev }; u[wt] = [...u[wt]]; u[wt][idx] = { ...u[wt][idx], [field]: value }; return u; });
  };

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

  const localeLabel = getTranslationLabel(translationTier, customLocales);

  const activeLocales = translationTier === "custom" ? customLocales
    : translationTier === "tier1" ? TIER1_CODES
    : translationTier === "worldwide" ? WORLDWIDE_CODES : [];

  const exportTxt = () => {
    if (!schedule) return;
    const target = parseDate(targetDate);
    let lines = ["SCHEDULE BUILDER", `Project: ${projectName || "Untitled"}`, `Type: ${projectType.toUpperCase()}`, `${direction === "backward" ? "Launch" : "Kick-off"}: ${fmtDisplay(target)}`, `Translations: ${localeLabel}`, ""];
    if (activeLocales.length > 0) { lines.push(`Locales: ${activeLocales.join(", ")}`); lines.push(""); }
    Object.entries(schedule).forEach(([wt, ps]) => {
      const wtLabel = allWorkTypes.find(w => w.id === wt)?.label?.toUpperCase() || wt;
      lines.push(`=== ${wtLabel} ===`);
      ps.forEach(p => lines.push(`  ${fmtDisplay(p.start)} - ${fmtDisplay(p.end)} | ${p.name} | ${ownerInfo(p.owner).label} | T-${weeksBetween(p.start, target)}w`));
      lines.push("");
    });
    if (fastFollows.length) { lines.push("=== FAST-FOLLOWS ==="); fastFollows.forEach(ff => lines.push(`  ${ff.date} | ${ff.name}`)); }
    if (adjustmentNotes.length) { lines.push(""); lines.push("=== ADJUSTMENT NOTES ==="); adjustmentNotes.forEach(n => lines.push(`  [${n.date}] ${n.text}`)); }
    const txtBlob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(txtBlob);
    a.download = `${(projectName || "schedule").replace(/\s+/g, "-").toLowerCase()}-workback.txt`; a.click();
  };

  const exportCsv = () => {
    if (!schedule) return;
    const target = parseDate(targetDate);
    let rows = [["Work Type","Phase","Owner","Start","End","Biz Days","T-minus"]];
    Object.entries(schedule).forEach(([wt, ps]) => { const wtLabel = allWorkTypes.find(w => w.id === wt)?.label || wt; ps.forEach(p => rows.push([wtLabel, p.name, ownerInfo(p.owner).label, fmt(p.start), fmt(p.end), p.duration, `T-${weeksBetween(p.start, target)}`])); });
    if (fastFollows.length) fastFollows.forEach(ff => rows.push(["Fast-Follow", ff.name, "", ff.date, ff.date, "", ""]));
    if (adjustmentNotes.length > 0) {
      rows.push([]);
      rows.push(["-- ADJUSTMENT NOTES --", ""]);
      adjustmentNotes.forEach(n => rows.push([n.date, n.text]));
    }
    if (activeLocales.length > 0) {
      rows.push([]);
      rows.push(["-- LOCALES --", ""]);
      activeLocales.forEach(code => {
        const loc = ALL_LOCALES.find(l => l.code === code);
        rows.push([code, loc ? loc.label : code]);
      });
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = `${(projectName || "schedule").replace(/\s+/g, "-").toLowerCase()}-workback.csv`; a.click();
  };

  const exportPdf = () => {
    const pw = window.open("", "_blank"), target = parseDate(targetDate);
    let html = `<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#0a0a0a;color:#e0e0e0;padding:40px}h1{font-family:'Barlow Condensed',sans-serif;font-size:32px;letter-spacing:6px;font-weight:800;margin-bottom:4px}.meta{font-size:12px;color:#777;margin-bottom:8px}.locales{font-size:11px;color:#444;margin-bottom:24px;line-height:1.8}.wt{margin-bottom:32px}.wt-title{font-family:'Barlow Condensed',sans-serif;font-size:18px;letter-spacing:4px;font-weight:700;padding:8px 14px;border-radius:4px;display:inline-block;margin-bottom:12px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:9px;letter-spacing:2px;color:#666;padding:6px 10px;border-bottom:1px solid #222}td{font-size:12px;padding:7px 10px;border-bottom:1px solid #151515}.badge{font-size:9px;padding:2px 8px;border-radius:2px;letter-spacing:1px}@media print{body{background:#0a0a0a!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>`;
    html += `<h1>${projectName || "UNTITLED PROJECT"}</h1><div class="meta">${projectType.toUpperCase()} · ${direction === "backward" ? "Launch" : "Kick-off"}: ${fmtDisplay(target)} · ${localeLabel}</div>`;
    if (activeLocales.length > 0) {
      const flags = activeLocales.map(c => ALL_LOCALES.find(l => l.code === c)?.flag || c).join(" ");
      html += `<div class="locales">${flags}</div>`;
    }
    Object.entries(schedule).forEach(([wt, ps]) => { const wi = allWorkTypes.find(w => w.id === wt) || { color: "#888", light: "rgba(136,136,136,0.15)", label: wt }; html += `<div class="wt"><div class="wt-title" style="background:${wi.light};color:${wi.color}">${wi.label}</div><table><tr><th>Phase</th><th>Owner</th><th>Start</th><th>End</th><th>Days</th><th>T-minus</th></tr>`; ps.forEach(p => { const tW = weeksBetween(p.start, target), ow = ownerInfo(p.owner); html += `<tr><td>${p.name}</td><td><span class="badge" style="background:${ow.color}22;color:${ow.color}">${ow.label}</span></td><td>${fmtDisplay(p.start)}</td><td>${fmtDisplay(p.end)}</td><td>${p.duration}</td><td style="color:#E31937;font-weight:600">T-${tW}w</td></tr>`; }); html += `</table></div>`; });
    if (fastFollows.length) { html += `<div style="margin-top:20px;border-top:1px solid #222;padding-top:16px"><div class="wt-title" style="background:rgba(227,25,55,0.15);color:#E31937">FAST-FOLLOWS</div><table>`; fastFollows.forEach(ff => { html += `<tr><td>${ff.name}</td><td>${ff.date}</td><td style="color:#E31937">T+${weeksBetween(parseDate(ff.date), target)}w</td></tr>`; }); html += `</table></div>`; }
    html += `</body></html>`; pw.document.write(html); pw.document.close(); setTimeout(() => pw.print(), 500);
  };

  // ── STYLES ─────────────────────────────────────────────────────────────────
  const S = {
    input: { width: "100%", background: "#0e0e0e", border: "1.5px solid #1e1e1e", color: "#ddd", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "10px 14px", borderRadius: 4, outline: "none", boxSizing: "border-box" },
    btn:   (a) => ({ padding: "8px 18px", background: a ? "#E31937" : "#0e0e0e", border: `1.5px solid ${a ? "#E31937" : "#1e1e1e"}`, color: a ? "#fff" : "#888", fontSize: 11, letterSpacing: 2, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }),
    pill:  (a, c) => ({ padding: "8px 16px", background: a ? (c||"#E31937")+"22" : "#0e0e0e", border: `1.5px solid ${a ? (c||"#E31937") : "#1e1e1e"}`, color: a ? (c||"#E31937") : "#555", fontSize: 11, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }),
    card:  { background: "#0a0a0a", border: "1px solid #151515", borderRadius: 6, padding: "20px", marginBottom: 16 },
    lbl:   { fontSize: 9, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 },
    sec:   { marginBottom: 24 },
  };

  const enabledCount = Object.values(workTypes).filter(Boolean).length;

  // ── SETUP VIEW ─────────────────────────────────────────────────────────────
  const renderSetup = () => (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, letterSpacing: 8, fontWeight: 800, marginBottom: 6 }}>SCHEDULE BUILDER</div>
        <div style={{ fontSize: 12, color: "#444" }}>Configure your project, then generate your schedule</div>
      </div>

      {/* Save / Saved Projects action bar */}
      <SaveProjectsBar onLoad={loadProject} currentState={currentSnapshot} />

      <div style={S.card}>
        <div style={S.sec}><span style={S.lbl}>Project Name</span><input style={S.input} placeholder="e.g. Global Launch for XYZ" value={projectName} onChange={e => set("projectName", e.target.value)} /></div>
        <div style={S.sec}><span style={S.lbl}>Project Type</span><div style={{ display: "flex", gap: 8 }}>{[["npi","NPI"],["non-npi","Non-NPI (Misc)"]].map(([id,lbl]) => (<button key={id} onClick={() => set("projectType", id)} style={S.btn(projectType === id)}>{lbl}</button>))}</div></div>
        <div style={S.sec}><span style={S.lbl}>Schedule Direction</span><div style={{ display: "flex", gap: 8 }}>{[["backward","← Backward from Launch"],["forward","Forward from Kick-off →"]].map(([id,lbl]) => (<button key={id} onClick={() => set("direction", id)} style={S.btn(direction === id)}>{lbl}</button>))}</div></div>
        <div style={S.sec}><span style={S.lbl}>{direction === "backward" ? "Launch Date" : "Kick-off Date"}</span><input type="date" style={{ ...S.input, maxWidth: "100%", minWidth: 0 }} value={targetDate} onChange={e => set("targetDate", e.target.value)} /></div>

        {/* Work Types */}
        <div style={S.sec}>
          <span style={S.lbl}>Work Types</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {BUILT_IN_WORK_TYPES.map(wt => (<button key={wt.id} onClick={() => toggleWorkType(wt.id)} style={S.pill(workTypes[wt.id], wt.color)}>{wt.label}</button>))}
            {customWorkTypes.map(cwt => (
              <div key={cwt.id} style={{ display: "flex", alignItems: "center", borderRadius: 4, overflow: "hidden", border: `1.5px solid ${workTypes[cwt.id] ? cwt.color : "#1e1e1e"}` }}>
                <button onClick={() => toggleWorkType(cwt.id)} style={{ padding: "8px 14px", background: workTypes[cwt.id] ? cwt.color+"22" : "#0e0e0e", border: "none", borderRight: `1px solid ${workTypes[cwt.id] ? cwt.color+"44" : "#1e1e1e"}`, color: workTypes[cwt.id] ? cwt.color : "#555", fontSize: 11, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>{cwt.label}</button>
                <button onClick={() => deleteCustomWorkType(cwt.id)} style={{ padding: "8px 9px", background: workTypes[cwt.id] ? cwt.color+"22" : "#0e0e0e", border: "none", color: workTypes[cwt.id] ? cwt.color : "#555", fontSize: 13, lineHeight: 1, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>×</button>
              </div>
            ))}
            <button onClick={() => setShowCustomModal(true)} style={{ padding: "8px 14px", background: "transparent", border: "1.5px dashed #2a2a2a", color: "#444", fontSize: 11, letterSpacing: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderRadius: 3, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#E31937"; e.currentTarget.style.color="#E31937"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color="#444"; }}>+ CUSTOM</button>
          </div>
        </div>

        {/* Translations — new tier selector */}
        <div style={S.sec}>
          <span style={S.lbl}>Translations</span>
          <TranslationTierSelector
            value={translationTier}
            customLocales={customLocales}
            onChange={tier => set("translationTier", tier)}
            onCustomLocales={codes => set("customLocales", codes)}
          />
        </div>

        {/* Fast Follows */}
        <div style={S.sec}>
          <span style={S.lbl}>Post-Launch Fast-Follow Milestones</span>
          {fastFollows.map((ff, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="e.g. Buyability update" value={ff.name} onChange={e => { const nf = [...fastFollows]; nf[i] = { ...nf[i], name: e.target.value }; set("fastFollows", nf); }} />
              <input type="date" style={{ ...S.input, width: 170 }} value={ff.date} onChange={e => { const nf = [...fastFollows]; nf[i] = { ...nf[i], date: e.target.value }; set("fastFollows", nf); }} />
              <button onClick={() => set("fastFollows", fastFollows.filter((_,j) => j !== i))} style={{ background: "none", border: "1px solid #2a1015", color: "#E31937", width: 28, height: 28, borderRadius: 3, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
          <button onClick={() => set("fastFollows", [...fastFollows, { name: "", date: targetDate }])} style={{ ...S.btn(false), fontSize: 10, padding: "6px 14px" }}>+ Add Fast-Follow</button>
        </div>
      </div>

      {/* Owners */}
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}><span style={{ ...S.lbl, marginBottom: 0 }}>Owners / Assignees</span></div>
        <ManageOwners owners={owners} onAddOwner={addOwner} onDeleteOwner={deleteOwner} />
      </div>

      {/* Phase Configuration */}
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
                    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr min(190px,40%) min(60px,15%)", gap: 6, marginBottom: 8, padding: "0 4px" }}>
                      {["ON","PHASE","OWNER","DAYS"].map(h => <span key={h} style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>{h}</span>)}
                    </div>
                    {phases[activeTab].map((p, idx) => {
                      const dimmed = p.translationPhase && !translationsOn;
                      return (
                        <div key={p.id || idx} style={{ display: "grid", gridTemplateColumns: "28px 1fr min(190px,40%) min(60px,15%)", gap: 6, padding: "10px 4px", borderBottom: "1px solid #111", alignItems: "start", opacity: dimmed ? 0.3 : p.enabled ? 1 : 0.4 }}>
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

  // ── SCHEDULE VIEW ──────────────────────────────────────────────────────────
  const [ganttFontSize, setGanttFontSize] = useState(1); // 0=small, 1=medium, 2=large
  const [numericDates, setNumericDates] = useState(false);

  const fmtDate = (d) => numericDates ? `${d.getMonth()+1}/${d.getDate()}` : fmtDisplay(d);
  const FONT_SCALES = [0.8, 1, 1.2];

  const renderSchedule = () => {
    if (!schedule) return null;
    const target = parseDate(targetDate);
    const { min, max } = getDateRange();
    const fs = FONT_SCALES[ganttFontSize];
    const labelW = Math.round(280 * fs);
    const minGanttW = Math.max(700, Math.round(900 * fs));
    const getPos = (d) => Math.max(0, Math.min(100, ((d - min) / (max - min)) * 100));
    const weekMarkers = [];
    let wk = new Date(min); wk.setDate(wk.getDate() - wk.getDay() + 1);
    while (wk <= max) { const tW = weeksBetween(wk, target); weekMarkers.push({ date: new Date(wk), tMinus: direction === "backward" ? `T-${tW}` : `T+${tW}`, pos: getPos(wk) }); wk.setDate(wk.getDate() + 7); }

    // Build owner legend from phases in schedule
    const usedOwnerIds = [...new Set(Object.values(schedule).flat().map(p => p.owner))];

    return (
      <div>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: Math.round(22*fs), letterSpacing: 5, fontWeight: 700 }}>{projectName || "UNTITLED PROJECT"}</div>
            <div style={{ fontSize: Math.round(11*fs), color: "#666", marginTop: 2 }}>{projectType.toUpperCase()} · {direction === "backward" ? "Launch" : "Kick-off"}: {fmtDate(target)} · {localeLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setView("setup")} style={S.btn(false)}>← EDIT</button>
            <button onClick={exportTxt} style={S.btn(false)}>TXT</button>
            <button onClick={exportCsv} style={S.btn(false)}>CSV</button>
            <button onClick={exportPdf} style={S.btn(true)}>PDF ↗</button>
          </div>
        </div>

        {/* Toolbar: font size + date format */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, padding: "8px 12px", background: "#0a0a0a", border: "1px solid #151515", borderRadius: 5, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: "#444", fontWeight: 600 }}>SIZE</span>
            {["S","M","L"].map((lbl, i) => (
              <button key={lbl} onClick={() => setGanttFontSize(i)} style={{
                width: 26, height: 26, borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                background: ganttFontSize === i ? "#E31937" : "#0e0e0e",
                border: `1.5px solid ${ganttFontSize === i ? "#E31937" : "#1e1e1e"}`,
                color: ganttFontSize === i ? "#fff" : "#555",
                fontSize: 9 + i, fontWeight: 700, lineHeight: 1,
              }}>{lbl}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: "#1e1e1e" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: "#444", fontWeight: 600 }}>DATES</span>
            {[["Mar 2", false], ["3/2", true]].map(([lbl, val]) => (
              <button key={lbl} onClick={() => setNumericDates(val)} style={{
                padding: "4px 10px", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                background: numericDates === val ? "#E31937" : "#0e0e0e",
                border: `1.5px solid ${numericDates === val ? "#E31937" : "#1e1e1e"}`,
                color: numericDates === val ? "#fff" : "#555",
                fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Locale flags row */}
        {activeLocales.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12, padding: "6px 12px", background: "#0a0a0a", border: "1px solid #151515", borderRadius: 4 }}>
            {activeLocales.map(code => {
              const loc = ALL_LOCALES.find(l => l.code === code);
              return loc ? <span key={code} title={loc.label} style={{ fontSize: Math.round(16*fs), lineHeight: 1 }}>{loc.flag}</span> : null;
            })}
          </div>
        )}

        {/* Owner legend */}
        {usedOwnerIds.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, padding: "8px 12px", background: "#0a0a0a", border: "1px solid #151515", borderRadius: 5 }}>
            <span style={{ fontSize: 8, letterSpacing: 2, color: "#333", fontWeight: 700, alignSelf: "center", marginRight: 4 }}>OWNERS</span>
            {usedOwnerIds.map(id => {
              const ow = ownerInfo(id);
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 3, background: ow.color + "14", border: `1px solid ${ow.color}30` }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: ow.color, flexShrink: 0 }} />
                  <span style={{ fontSize: Math.round(10*fs), color: ow.color, whiteSpace: "nowrap" }}>{ow.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Gantt — horizontally scrollable with min-width */}
        <div ref={ganttRef} style={{ background: "#0a0a0a", border: "1px solid #151515", borderRadius: 6, padding: "16px", overflow: "auto" }}>
          <div style={{ minWidth: minGanttW }}>
          <div style={{ position: "relative", height: 24, marginLeft: labelW, marginBottom: 4 }}>{weekMarkers.filter(w => w.pos > 0 && w.pos < 100).map((w, i) => (<div key={i} style={{ position: "absolute", left: `${w.pos}%`, transform: "translateX(-50%)", fontSize: Math.round(9*fs), letterSpacing: 1, color: "#aaa", fontWeight: 700, whiteSpace: "nowrap" }}>{w.tMinus}</div>))}</div>
          <div style={{ position: "relative", height: 20, marginLeft: labelW, marginBottom: 8, borderBottom: "1px solid #1e1e1e" }}>{weekMarkers.filter((w,i) => i%2===0 && w.pos>0 && w.pos<100).map((w, i) => (<div key={i} style={{ position: "absolute", left: `${w.pos}%`, transform: "translateX(-50%)", fontSize: Math.round(9*fs), color: "#666", whiteSpace: "nowrap" }}>{numericDates ? `${w.date.getMonth()+1}/${w.date.getDate()}` : fmtDisplay(w.date).split(" ").slice(1).join(" ")}</div>))}</div>
          {Object.entries(schedule).map(([wt, phaseList]) => {
            const wtInfo = allWorkTypes.find(w => w.id === wt) || { color: "#888", light: "rgba(136,136,136,0.15)", label: wt };
            const rowH = Math.round(28 * fs);
            return (
              <div key={wt} style={{ marginBottom: Math.round(20*fs) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: Math.round(10*fs), height: Math.round(10*fs), borderRadius: 2, background: wtInfo.color }} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: Math.round(14*fs), letterSpacing: 3, fontWeight: 700, color: wtInfo.color }}>{wtInfo.label}</span>
                  {wtInfo.custom && <span style={{ fontSize: 7, letterSpacing: 2, color: wtInfo.color, opacity: 0.6, fontWeight: 700 }}>CUSTOM</span>}
                </div>
                {phaseList.map((p, idx) => {
                  const left = getPos(p.start), right = getPos(p.end), width = Math.max(0.5, right - left);
                  const ow = ownerInfo(p.owner);
                  const dateLabel = numericDates
                    ? `${p.start.getMonth()+1}/${p.start.getDate()}–${p.end.getMonth()+1}/${p.end.getDate()}`
                    : `${fmtDisplay(p.start).slice(4)} – ${fmtDisplay(p.end).slice(4)}`;
                  return (
                    <div key={p.id||idx} style={{ display: "flex", alignItems: "center", marginBottom: 3, height: rowH }}>
                      {/* Label column: color flag + phase name + dates */}
                      <div style={{ width: labelW, flexShrink: 0, display: "flex", alignItems: "center", gap: 0, paddingRight: 10 }}>
                        <div style={{ width: 3, alignSelf: "stretch", background: ow.color, borderRadius: 2, marginRight: 8, flexShrink: 0, opacity: 0.85 }} />
                        <span style={{ fontSize: Math.round(10*fs), color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{p.name}</span>
                        <span style={{ fontSize: Math.round(9*fs), color: "#555", whiteSpace: "nowrap", marginLeft: 6, flexShrink: 0 }}>{dateLabel}</span>
                        <span style={{ fontSize: Math.round(8*fs), color: "#3a3a3a", whiteSpace: "nowrap", marginLeft: 4, flexShrink: 0 }}>{p.duration}d</span>
                      </div>
                      {/* Bar column — no text on bars */}
                      <div style={{ flex: 1, position: "relative", height: "100%" }}>
                        {weekMarkers.filter(w => w.pos>0 && w.pos<100).map((w, i) => (<div key={i} style={{ position: "absolute", left: `${w.pos}%`, top: 0, bottom: 0, width: 1, background: "#111" }} />))}
                        <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: Math.round(4*fs), height: Math.round(20*fs), borderRadius: p.milestone ? 10 : 3, background: p.milestone ? ow.color : `linear-gradient(90deg, ${ow.color}cc, ${ow.color}66)`, minWidth: p.milestone ? 10 : 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ position: "relative", marginLeft: labelW, height: 0 }}>
            <div style={{ position: "absolute", left: `${getPos(target)}%`, top: -1000, bottom: -20, width: 2, background: "#E31937", opacity: 0.6, zIndex: 5 }} />
            <div style={{ position: "absolute", left: `${getPos(target)}%`, transform: "translateX(-50%)", top: 4, fontSize: Math.round(8*fs), letterSpacing: 2, color: "#E31937", fontWeight: 700, whiteSpace: "nowrap", zIndex: 6 }}>▼ {direction === "backward" ? "LAUNCH" : "KICK-OFF"}</div>
          </div>
          {fastFollows.length > 0 && (
            <div style={{ marginTop: 24, marginLeft: labelW, position: "relative", height: 30 }}>
              {fastFollows.map((ff, i) => { const pos = getPos(parseDate(ff.date)); return (<div key={i} style={{ position: "absolute", left: `${pos}%`, transform: "translateX(-50%)", textAlign: "center" }}><div style={{ width: 2, height: 16, background: "#E31937", margin: "0 auto", opacity: 0.4 }} /><div style={{ fontSize: Math.round(8*fs), color: "#E31937", letterSpacing: 1, whiteSpace: "nowrap", marginTop: 2 }}>{ff.name || "Fast-follow"}</div></div>); })}
            </div>
          )}
          </div>{/* end minWidth wrapper */}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}><span style={{ fontSize: 11, color: "#666" }}>{fmtDate(p.start)} → {fmtDate(p.end)}</span><span style={{ fontSize: 10, color: "#444", minWidth: 36, textAlign: "right" }}>{p.duration}d</span><span style={{ fontSize: 10, color: "#E31937", fontWeight: 600, minWidth: 44, textAlign: "right" }}>{p.start <= target ? `T-${tW}w` : `T+${tW}w`}</span></div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Reminders — only for built-in work types */}
      {Object.keys(schedule).some(wt => ["email","pdp","plp","hp"].includes(wt)) && (
        <div style={{ ...S.card, marginTop: 8 }}>
          <span style={{ ...S.lbl, marginBottom: 10, display: "block" }}>Schedule Reminders</span>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              "Team QA can start on the US version while Translations/ICR is in progress",
              "QA can begin at the end of ICR Round 1 to overlap with Round 2 if time is tight",
              "Build page can start without final copy (placeholders OK)",
              "If schedule exceeds launch date, compress Build, Team QA, and/or Translations buffer",
              "Legal review can run in parallel with design wires if bandwidth allows",
              "Fast-follow assets should be scoped and briefed before launch, not after",
            ].map((tip, i) => (
              <li key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #0f0f0f", alignItems: "flex-start" }}>
                <span style={{ color: "#E31937", fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Adjustment Notes */}
      <div style={{ ...S.card, marginTop: 8 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ ...S.lbl, marginBottom: 4, display: "block" }}>Adjustment Notes</span>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 10 }}>Log changes here for context when sharing. Included in all exports.</div>
        </div>
        <AdjustmentNotes notes={adjustmentNotes} onAdd={addNote} onRemove={removeNote} inputStyle={S.input} btnStyle={S.btn} />
      </div>

    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060606", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box}html,body{margin:0;padding:0;background:#060606;overflow:hidden}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.7)}input[type="date"]{width:100%;min-width:0;-webkit-appearance:none;appearance:none}input[type="number"]::-webkit-inner-spin-button{opacity:1}input:focus{border-color:#E31937 !important;outline:none}select{color-scheme:dark}button:focus{outline:none}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #111", flexShrink: 0, background: "#060606" }}>
        <span style={{ fontSize: 9, letterSpacing: 2, padding: "3px 10px", borderRadius: 2, background: "rgba(227,25,55,0.15)", color: "#E31937" }}>SCHEDULE BUILDER</span>
        {view === "schedule" && schedule && (
          <div style={{ fontSize: 10, color: "#444" }}>{Object.keys(schedule).length} work type{Object.keys(schedule).length !== 1 ? "s" : ""} · {Object.values(schedule).flat().length} phases</div>
        )}
      </div>

      {/* Body: full width, no sidebar */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
        {view === "setup" ? renderSetup() : renderSchedule()}
      </div>

      {showCustomModal && <CustomWorkTypeModal onSave={handleAddCustomWorkType} onClose={() => setShowCustomModal(false)} owners={owners} onAddOwner={addOwner} />}
    </div>
  );
}
