import React, { useState, useMemo, useEffect, useRef, useId, Suspense, lazy } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";
import { fetchAssetAnalytics } from "./marketData.js";

// Heavy WebGL hero is code-split so it never blocks first paint or the dashboard.
const Hero3D = lazy(() => import("./Hero3D.jsx"));

/* ============================================================================
   MARKET DATA HUB
   Bilingual (EN/AR) institutional terminal: a narrative intro, then the live
   Supabase "smart-money" (CFTC COT) positioning dashboard.
   Design system lives in index.css (cool slate base, sparing gold accent).
   ========================================================================== */

const SUPABASE_URL = "https://aankstpoibuqptqolpum.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbmtzdHBvaWJ1cXB0cW9scHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODYzNTAsImV4cCI6MjA5Nzg2MjM1MH0.xiEfxggpzZHwIjlIsQiavUNmZWSwQpdI377wWMJA0Cs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Full instrument catalog. cohort = the speculative "smart money" group in each report.
const INSTR = {
  GC:  { name: "Gold",            cat: "Metals",  venue: "COMEX", cohort: "Managed Money",   cfd: "XAUUSD" },
  SI:  { name: "Silver",          cat: "Metals",  venue: "COMEX", cohort: "Managed Money",   cfd: "XAGUSD" },
  HG:  { name: "Copper",          cat: "Metals",  venue: "COMEX", cohort: "Managed Money",   cfd: "COPPER" },
  PL:  { name: "Platinum",        cat: "Metals",  venue: "NYMEX", cohort: "Managed Money",   cfd: "XPTUSD" },
  PA:  { name: "Palladium",       cat: "Metals",  venue: "NYMEX", cohort: "Managed Money",   cfd: "XPDUSD" },
  CL:  { name: "WTI Crude Oil",   cat: "Energy",  venue: "ICE",   cohort: "Managed Money",   cfd: "USOIL" },
  NG:  { name: "Natural Gas",     cat: "Energy",  venue: "NYMEX", cohort: "Managed Money",   cfd: "NATGAS" },
  ES:  { name: "S&P 500",         cat: "Indices", venue: "CME",   cohort: "Leveraged Funds", cfd: "US500" },
  NQ:  { name: "Nasdaq-100",      cat: "Indices", venue: "CME",   cohort: "Leveraged Funds", cfd: "NAS100" },
  YM:  { name: "Dow Jones",       cat: "Indices", venue: "CBOT",  cohort: "Leveraged Funds", cfd: "US30" },
  RTY: { name: "Russell 2000",    cat: "Indices", venue: "CME",   cohort: "Leveraged Funds", cfd: "US2000" },
  "6E": { name: "Euro",           cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "EURUSD" },
  "6B": { name: "British Pound",  cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "GBPUSD" },
  "6J": { name: "Japanese Yen",   cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "USDJPY (inv)" },
  "6A": { name: "Aussie Dollar",  cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "AUDUSD" },
  "6C": { name: "Canadian Dollar",cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "USDCAD (inv)" },
  "6S": { name: "Swiss Franc",    cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "USDCHF (inv)" },
  "6N": { name: "NZ Dollar",      cat: "FX",      venue: "CME",   cohort: "Leveraged Funds", cfd: "NZDUSD" },
  BTC: { name: "Bitcoin",         cat: "Crypto",  venue: "CME",   cohort: "Leveraged Funds", cfd: "BTCUSD" },
  ETH: { name: "Ether",           cat: "Crypto",  venue: "CME",   cohort: "Leveraged Funds", cfd: "ETHUSD" },
  DXY: { name: "US Dollar Index", cat: "Dollar",  venue: "ICE",   cohort: "Non-Commercial",  cfd: "DXY" },
};
const ORDER = ["GC","SI","HG","PL","PA","CL","NG","ES","NQ","YM","RTY","6E","6B","6J","6A","6C","6S","6N","BTC","ETH","DXY"];
const CATS = ["All", "Metals", "Energy", "Indices", "FX", "Crypto", "Dollar"];
const CAT_LABEL = {
  All:     { en: "All",      ar: "الكل" },
  Metals:  { en: "Metals",   ar: "المعادن" },
  Energy:  { en: "Energy",   ar: "الطاقة" },
  Indices: { en: "Indices",  ar: "المؤشّرات" },
  FX:      { en: "FX",       ar: "العملات" },
  Crypto:  { en: "Crypto",   ar: "الرقمية" },
  Dollar:  { en: "Dollar",   ar: "الدولار" },
};

/* Palette mirror of index.css tokens — for JS-driven inline styles & Recharts. */
const C = {
  bg: "#080b11", panel: "#111824", panel2: "#0d131d", inset: "#0a0f17", hover: "#18202e",
  border: "#1f2937", borderSoft: "#161e29", borderStrong: "#2c3a4d",
  textHi: "#eaf0f8", text: "#aeb9c8", muted: "#6b7787", faint: "#485263",
  long: "#2dbd87", longSoft: "rgba(45,189,135,0.12)", longLine: "rgba(45,189,135,0.45)",
  short: "#f0556b", shortSoft: "rgba(240,85,107,0.12)", shortLine: "rgba(240,85,107,0.45)",
  info: "#4c8dff", infoSoft: "rgba(76,141,255,0.12)",
  warn: "#e3a93a", warnSoft: "rgba(227,169,58,0.12)",
  gold: "#cda94f", goldBright: "#ecca6e", goldSoft: "rgba(205,169,79,0.12)",
  ivory: "#ece7d8",
};
const MONO = "var(--font-mono)";

// Unified atmospheric background: cool blue glow up top, faint gold below, dark base.
const APP_BG =
  "radial-gradient(ellipse 92% 60% at 50% -12%, rgba(40,78,140,0.20), transparent 60%)," +
  "radial-gradient(ellipse 70% 50% at 100% 102%, rgba(205,169,79,0.055), transparent 55%)," +
  "linear-gradient(180deg, #0a0f18 0%, #080b11 56%, #070a0f 100%)";

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Typography: clean sans for both; Arabic gets its own readable serif/display. */
const FONT = {
  title: { en: "var(--font-sans)", ar: "'Reem Kufi', sans-serif" },
  body:  { en: "var(--font-sans)", ar: "'Amiri', serif" },
};

const T = {
  skip: { en: "Skip to terminal →", ar: "تخطّي إلى المنصّة ←" },
  journey: { en: "A JOURNEY THROUGH TIME", ar: "رحلةٌ عبرَ الزمن" },
  heroTitle: { en: ["The Trade That", "Built the World"], ar: ["التجارةُ التي", "صنعَت العالم"] },
  heroSub: {
    en: "From the agora of Athens, to the markets of Córdoba, to today's digital ledgers — one unbroken chain. You are its latest chapter.",
    ar: "من أغورا أثينا، إلى أسواقِ قرطبة، إلى دفاترِ اليومِ الرقمية — سلسلةٌ واحدةٌ لا تنقطع. وأنتَ آخرُ فصولها.",
  },
  scroll: { en: "Scroll to begin", ar: "مرّر للبدء" },
  yourTurn: { en: "And now, it's your turn.", ar: "والآنَ، حانَ دورُك." },
  enter: { en: "Enter the Terminal →", ar: "ادخل إلى المنصّة ←" },
  liveLabel: { en: "SMART-MONEY POSITIONING · LIVE DATA", ar: "تموضُع المال الذكي · بيانات حيّة" },
  dashTagline: {
    en: "Where the big speculators sit — and whether that's at an extreme.",
    ar: "أين يقف كبار المضاربين — وهل ذلك عند حدٍّ متطرّف.",
  },
  howToTitle: { en: "How to read it.", ar: "كيف تقرأها." },
  howToBody: {
    en: "The marker shows where this week's net position sits inside its 18-month range. Near the top or bottom = the crowd is heavily one-sided, which historically precedes mean-reversion more often than continuation. This is slow context (weekly, lagged) — a bias filter, never an entry trigger.",
    ar: "المؤشّر يبيّن أين يقع صافي تموضُع هذا الأسبوع داخل نطاق ١٨ شهراً. قُربَ القمّة أو القاع = الحشدُ منحازٌ بشدّة لجهةٍ واحدة، وهو تاريخياً يسبق الارتداد أكثر من الاستمرار. هذا سياقٌ بطيء (أسبوعي، متأخّر) — فلتر انحياز، لا إشارة دخول.",
  },
  footerNote: { en: "Discipline filter, not trade signals", ar: "فلتر انضباط، لا إشارات تداول" },
  loading: { en: "Loading positioning data…", ar: "جارٍ تحميل البيانات…" },
  analysisTitle: { en: "Asset analysis layers", ar: "طبقات تحليل الأصل" },
  analysisDisclaimer: {
    en: "Descriptive risk & movement context from price history — not a directional or probability signal. Positioning extremes and mechanical structure showed no measured timing edge out-of-sample; use these to size risk, not to predict direction.",
    ar: "سياقٌ وصفيٌّ للمخاطر والحركة من تاريخ السعر — وليس إشارةَ اتجاهٍ أو احتمال. تطرّفاتُ التموضع والبنية الميكانيكية لم تُظهر أيّ أفضليةِ توقيتٍ مقيسةٍ خارج العيّنة؛ استخدمها لتحجيمِ المخاطر، لا لتوقّع الاتجاه.",
  },
  analysisLoading: { en: "Loading price analytics…", ar: "جارٍ تحميل تحليلات السعر…" },
  analysisErr: { en: "Price feed unavailable for this asset.", ar: "تعذّر جلب بيانات السعر لهذا الأصل." },
  lyrPrice: { en: "Price context", ar: "سياق السعر" },
  lyrVol: { en: "Volatility", ar: "التقلّب" },
  lyrMove: { en: "Movement envelope", ar: "مدى الحركة" },
  lyrDist: { en: "Return distribution", ar: "توزيع العوائد" },
};

/* ============================ shared helpers ============================== */
const clamp = (n) => Math.max(0, Math.min(100, n));

/* Subtle pointer-driven 3D tilt for cards (disabled under reduced-motion). */
function useTilt(max = 6) {
  const ref = useRef(null);
  const onMouseMove = (e) => {
    if (prefersReduced()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
  };
  const onMouseLeave = () => { const el = ref.current; if (el) el.style.transform = ""; };
  return { ref, onMouseMove, onMouseLeave };
}

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(prefersReduced() ? target : 0);
  useEffect(() => {
    if (prefersReduced()) { setVal(target); return; }
    let raf, start = null;
    const tick = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick); else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function useInView(opts) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (prefersReduced()) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, opts || { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

const fmt = (n) => (n == null ? "—" : n.toLocaleString("en-US"));
const fmtSigned = (n) => (n == null ? "—" : (n > 0 ? "+" : "") + n.toLocaleString("en-US"));
const niceDate = (d) => {
  const [y, m, day] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1];
  return `${mo} ${+day}, ${y}`;
};
const shortDate = (d) => {
  const [, m, day] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1];
  return `${mo} ${+day}`;
};

/* ============================ shared atoms =============================== */
function Kicker({ children, color = C.gold, style }) {
  return (
    <div className="mono" style={{
      fontSize: 11, letterSpacing: 2.4, color, textTransform: "uppercase",
      fontWeight: 600, ...style,
    }}>{children}</div>
  );
}

function Badge({ isLong, text, sm }) {
  const accent = isLong ? C.long : C.short;
  return (
    <span className="mono" style={{
      fontSize: sm ? 10 : 11, fontWeight: 700, letterSpacing: 0.4, color: accent,
      background: isLong ? C.longSoft : C.shortSoft, border: `1px solid ${accent}`,
      borderRadius: 999, padding: sm ? "2px 9px" : "3px 11px", whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent }} />
      {text ?? (isLong ? "LONG" : "SHORT")}
    </span>
  );
}

function Stat({ label, value, color, size = "lg" }) {
  const fs = size === "lg" ? 27 : size === "md" ? 18 : 15;
  return (
    <div>
      <div style={{ fontSize: 10.5, color: C.faint, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: fs, fontWeight: 700, color: color || C.textHi, lineHeight: 1.2, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function LangToggle({ lang, setLang }) {
  const item = (code, label) => (
    <button className="seg-btn" data-active={lang === code} onClick={() => setLang(code)}
      aria-pressed={lang === code} style={{ minWidth: 34 }}>{label}</button>
  );
  return <div className="seg" role="group" aria-label="Language">{item("en", "EN")}{item("ar", "ع")}</div>;
}

/* ===================== LANDING — animated trader scenes =================== */
/* Recolored to the cool theme: steel line-art with a sparing gold highlight. */
function SceneGreece() {
  const f = "#56657a", hi = C.gold;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 320, display: "block", margin: "0 auto" }}>
      <line x1="20" y1="168" x2="280" y2="168" stroke={f} strokeWidth="1" opacity="0.4" />
      <g opacity="0.5" stroke={f} strokeWidth="1.3" fill="none">
        <rect x="26" y="52" width="16" height="108" />
        <rect x="21" y="46" width="26" height="8" /><rect x="21" y="160" width="26" height="6" />
        <line x1="30" y1="56" x2="30" y2="158" /><line x1="34" y1="56" x2="34" y2="158" /><line x1="38" y1="56" x2="38" y2="158" />
      </g>
      <g fill={f}>
        <circle cx="100" cy="64" r="12" /><path d="M111 62 l7 2 -7 2 z" />
        <path d="M86 76 H114 L120 168 H80 Z" />
      </g>
      <path d="M112 92 Q132 96 144 104" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
      <g transform="rotate(-7 205 168)">
        <g fill={f}>
          <circle cx="205" cy="66" r="12" /><path d="M194 64 l-7 2 7 2 z" />
          <path d="M191 78 H219 L225 168 H185 Z" />
        </g>
        <g data-anim style={{ animation: "mdh-reachL 2.4s ease-in-out infinite" }}>
          <path d="M193 94 Q172 98 158 106" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g>
        <ellipse cx="150" cy="150" rx="16" ry="5" fill={hi} /><ellipse cx="150" cy="144" rx="14" ry="4.5" fill={hi} opacity="0.8" />
        <ellipse cx="150" cy="139" rx="12" ry="4" fill={hi} /><ellipse cx="150" cy="135" rx="10" ry="3.5" fill={hi} opacity="0.8" />
      </g>
      <g fill={hi}>
        <path data-anim style={{ animation: "mdh-glint 1.8s ease-in-out infinite" }} d="M150 118 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
        <path data-anim style={{ animation: "mdh-glint 2.3s ease-in-out .5s infinite" }} d="M176 130 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
      </g>
    </svg>
  );
}
function SceneAndalus() {
  const f = "#56657a", hi = C.gold;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 320, display: "block", margin: "0 auto" }}>
      <g opacity="0.42" stroke={f} strokeWidth="1.3" fill="none">
        <path d="M70 168 V100 A45 42 0 0 1 160 100 V168" />
        <path d="M83 168 V104 A32 30 0 0 1 147 104 V168" opacity="0.7" />
      </g>
      <line x1="18" y1="168" x2="282" y2="168" stroke={f} strokeWidth="1" opacity="0.4" />
      <rect x="120" y="138" width="84" height="7" fill={f} opacity="0.8" />
      <line x1="128" y1="145" x2="128" y2="168" stroke={f} strokeWidth="2" opacity="0.6" />
      <line x1="196" y1="145" x2="196" y2="168" stroke={f} strokeWidth="2" opacity="0.6" />
      <g fill={f} opacity="0.85">
        <path d="M134 138 q-3 -10 4 -14 q7 4 4 14 z" /><path d="M150 138 q-2 -8 3 -11 q5 3 3 11 z" />
      </g>
      <g fill={f}>
        <circle cx="92" cy="70" r="12" /><path d="M80 64 q12 -12 24 0 q-12 -5 -24 0 z" fill={hi} />
        <path d="M78 82 H106 L112 168 H72 Z" />
      </g>
      <g fill={f}>
        <circle cx="222" cy="72" r="12" /><path d="M210 66 q12 -11 24 0 q-12 -5 -24 0 z" fill={hi} />
        <path d="M208 84 H236 L242 168 H202 Z" />
      </g>
      <path d="M104 100 Q140 96 158 120" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
      <g data-anim style={{ animation: "mdh-reachL 2.6s ease-in-out infinite" }}>
        <path d="M210 102 Q176 98 162 120" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
      <g>
        <path d="M150 122 q11 -2 15 7 q2 11 -8 13 q-13 1 -13 -11 q0 -6 6 -9 z" fill={hi} />
        <path d="M149 122 q8 -4 15 2" stroke={C.bg} strokeWidth="1.2" fill="none" />
      </g>
      <g fill={hi}>
        <path data-anim style={{ animation: "mdh-glint 1.9s ease-in-out infinite" }} d="M168 110 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" />
        <path data-anim style={{ animation: "mdh-glint 2.4s ease-in-out .4s infinite" }} d="M134 116 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4 z" />
      </g>
    </svg>
  );
}
function SceneAmsterdam() {
  const f = "#56657a", hi = C.gold;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 320, display: "block", margin: "0 auto" }}>
      <g opacity="0.4" stroke={f} strokeWidth="1.3" fill="none">
        <path d="M40 150 q60 18 120 0 l-12 16 q-48 10 -96 0 z" />
        <line x1="100" y1="150" x2="100" y2="92" />
        <path d="M100 96 q26 8 0 28 z" fill={f} opacity="0.45" />
        <path d="M100 96 q-26 8 0 28 z" fill={f} opacity="0.28" />
      </g>
      <line x1="18" y1="168" x2="282" y2="168" stroke={f} strokeWidth="1" opacity="0.4" />
      <g fill={f}>
        <circle cx="120" cy="70" r="12" /><rect x="103" y="57" width="34" height="4" fill={hi} /><path d="M110 57 q10 -10 20 0 z" fill={hi} />
        <path d="M106 82 H134 L140 168 H100 Z" />
      </g>
      <path d="M132 90 L150 70" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
      <g data-anim style={{ animation: "mdh-bobS 2s ease-in-out infinite" }}>
        <rect x="146" y="48" width="22" height="26" rx="2" fill={hi} />
        <line x1="150" y1="56" x2="164" y2="56" stroke={C.bg} strokeWidth="1" /><line x1="150" y1="61" x2="164" y2="61" stroke={C.bg} strokeWidth="1" /><line x1="150" y1="66" x2="160" y2="66" stroke={C.bg} strokeWidth="1" />
      </g>
      <g fill={f}>
        <circle cx="208" cy="74" r="12" /><rect x="191" y="61" width="34" height="4" fill={hi} /><path d="M198 61 q10 -10 20 0 z" fill={hi} />
        <path d="M194 86 H222 L228 168 H188 Z" />
      </g>
      <g data-anim style={{ animation: "mdh-reachL 2.3s ease-in-out infinite" }}>
        <path d="M196 100 Q176 96 168 82" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
      <g>
        <ellipse cx="170" cy="150" rx="14" ry="4.5" fill={hi} /><ellipse cx="170" cy="145" rx="12" ry="4" fill={hi} opacity="0.8" /><ellipse cx="170" cy="141" rx="10" ry="3.5" fill={hi} />
      </g>
      <path data-anim style={{ animation: "mdh-glint 2s ease-in-out infinite" }} d="M186 132 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill={hi} />
    </svg>
  );
}
function SceneModern() {
  const f = "#56657a", hi = C.gold, up = C.long, dn = C.short;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 320, display: "block", margin: "0 auto" }}>
      <line x1="18" y1="168" x2="282" y2="168" stroke={f} strokeWidth="1" opacity="0.4" />
      <rect x="150" y="150" width="118" height="6" fill={f} opacity="0.8" />
      <line x1="160" y1="156" x2="160" y2="168" stroke={f} strokeWidth="2" opacity="0.6" /><line x1="258" y1="156" x2="258" y2="168" stroke={f} strokeWidth="2" opacity="0.6" />
      <rect x="168" y="70" width="96" height="64" rx="4" fill="none" stroke={f} strokeWidth="1.6" />
      <line x1="216" y1="134" x2="216" y2="150" stroke={f} strokeWidth="3" />
      <g>
        <line x1="184" y1="92" x2="184" y2="120" stroke={up} strokeWidth="1.2" /><rect x="180" y="100" width="8" height="14" fill={up} opacity="0.9" />
        <line x1="200" y1="86" x2="200" y2="124" stroke={dn} strokeWidth="1.2" /><rect x="196" y="98" width="8" height="18" fill={dn} opacity="0.9" />
        <line x1="216" y1="82" x2="216" y2="116" stroke={up} strokeWidth="1.2" /><rect x="212" y="92" width="8" height="14" fill={up} opacity="0.9" />
        <line x1="232" y1="76" x2="232" y2="110" stroke={up} strokeWidth="1.2" /><rect x="228" y="84" width="8" height="16" fill={up} opacity="0.9" />
      </g>
      <g data-anim style={{ animation: "mdh-riseChart 1.8s ease-in-out infinite" }} stroke={hi} strokeWidth="1.6" fill="none">
        <path d="M178 120 L248 82" /><path d="M240 82 L248 82 L248 90" />
      </g>
      <g transform="rotate(7 96 168)" fill={f}>
        <circle cx="96" cy="80" r="12" /><path d="M82 92 H108 L120 150 H76 Z" />
      </g>
      <path d="M115 104 Q140 112 156 132" stroke={f} strokeWidth="6" fill="none" strokeLinecap="round" />
      <text data-anim style={{ animation: "mdh-glint 1.7s ease-in-out infinite" }} x="120" y="68" fontFamily="monospace" fontSize="17" fill={hi}>$</text>
      <path data-anim style={{ animation: "mdh-glint 2.2s ease-in-out .4s infinite" }} d="M150 94 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill={hi} />
    </svg>
  );
}
const SCENES = { greece: SceneGreece, andalus: SceneAndalus, amsterdam: SceneAmsterdam, modern: SceneModern };

const CHAPTERS = [
  {
    scene: "greece", idx: { en: "01", ar: "٠١" },
    era: { en: "ATHENS · 6th century BCE", ar: "أثينا · القرن السادس ق.م" },
    title: { en: "The Agora — Where the Market Was Born", ar: "الأغورا — حيثُ وُلِدَ السوق" },
    body: {
      en: "At the heart of the Greek city stood the agora: a square where merchant, philosopher and citizen met. There the first coins were struck, and the drachma crossed the ports of the Aegean. From their tongue came the word economy — the managing of a house, then of nations.",
      ar: "في قلبِ المدينةِ اليونانيةِ كانت الأغورا؛ ساحةٌ يلتقي فيها التاجرُ والفيلسوفُ والمواطن. هناك سُكَّت أوائلُ العملات، وعبَرت الدراخما موانئَ بحرِ إيجة. ومن لسانِهم جاءت كلمةُ «الاقتصاد»: تدبيرُ البيت، ثمّ تدبيرُ الأمم.",
    },
  },
  {
    scene: "andalus", idx: { en: "02", ar: "٠٢" },
    era: { en: "CÓRDOBA · 10th century CE", ar: "قرطبة · القرن العاشر للميلاد" },
    title: { en: "Córdoba — Where Continents Met", ar: "قرطبة — مُلتقى القارّات" },
    body: {
      en: "Al-Andalus was a bridge between three continents. In the souks of Córdoba, silk and gold and books changed hands, and the dinar and dirham were minted. From here spread the numerals we still count with, and the ṣakk — said to be the root of the word cheque. Knowledge and commerce, at once.",
      ar: "كانت الأندلسُ جسرًا بين ثلاثِ قارّات. في أسواقِ قرطبةَ يلتقي الحريرُ والذهبُ والكتاب، ويُسَكُّ الدينارُ والدرهم. ومنها انتشرت الأرقامُ التي نحسبُ بها اليوم، وفكرةُ «الصَّكِّ» التي يُنسَبُ إليها أصلُ كلمة cheque — علمٌ وتجارةٌ في آنٍ واحد.",
    },
  },
  {
    scene: "amsterdam", idx: { en: "03", ar: "٠٣" },
    era: { en: "AMSTERDAM · 1602", ar: "أمستردام · ١٦٠٢ للميلاد" },
    title: { en: "The Birth of the Exchange", ar: "مولدُ البورصة" },
    body: {
      en: "Then the modern exchange was born: in Amsterdam the first shares were offered to the public, and capital itself became a good — bought and sold, its value swinging from hand to hand.",
      ar: "ثمّ وُلِدت البورصةُ الحديثة: في أمستردام طُرحت أوائلُ الأسهمِ للتداولِ العام، فصار رأسُ المالِ نفسُه سلعةً تُشترى وتُباع، وتتقلّبُ قيمتُها بين يدٍ ويد.",
    },
  },
  {
    scene: "modern", idx: { en: "04", ar: "٠٤" },
    era: { en: "TODAY · DIGITAL MARKETS", ar: "اليوم · الأسواقُ الرقمية" },
    title: { en: "The Order Book", ar: "دفترُ الأوامر" },
    body: {
      en: "Today the same dance — a buyer, a seller — but in fractions of a second, on digital order books. What lies before you now is the modern merchant's ledger: where the smart money stands in gold and the indices.",
      ar: "واليومَ الرقصةُ ذاتُها — بائعٌ ومشترٍ — لكنْ في أجزاءٍ من الثانية، على دفاترِ أوامرَ رقمية. وما بين يديكَ الآنَ هو دفترُ التاجرِ الحديث: أين يقفُ المالُ الذكيُّ في الذهبِ والمؤشّرات.",
    },
  },
];

/* Subtle, unified decorative background: dot grid + faint candle silhouette. */
function BgDecor({ candles = true }) {
  const bars = useMemo(() => {
    const arr = []; let y = 150;
    for (let i = 0; i < 48; i++) {
      const open = y;
      y = Math.max(70, Math.min(230, y + (Math.random() - 0.46) * 28));
      const hi = Math.min(open, y) - (5 + Math.random() * 16);
      const lo = Math.max(open, y) + (5 + Math.random() * 16);
      arr.push({ x: i * 25 + 14, open, close: y, hi, lo, up: y <= open });
    }
    return arr;
  }, []);
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(125,162,192,1) 1px, transparent 1px), linear-gradient(90deg, rgba(125,162,192,1) 1px, transparent 1px)",
        backgroundSize: "52px 52px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
      }} />
      {candles && !prefersReduced() && (
        <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "60%", opacity: 0.1 }}>
          {bars.map((c, i) => {
            const col = c.up ? C.long : C.short;
            const top = Math.min(c.open, c.close);
            const h = Math.max(2, Math.abs(c.close - c.open));
            return (
              <g key={i} stroke={col} fill={col}>
                <line x1={c.x} x2={c.x} y1={c.hi} y2={c.lo} strokeWidth="1.5" />
                <rect x={c.x - 6} y={top} width="12" height={h} />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function Chapter({ ch, lang }) {
  const [ref, inView] = useInView({ threshold: 0.22 });
  const Scene = SCENES[ch.scene];
  const rtl = lang === "ar";
  return (
    <div ref={ref} style={{ position: "relative", padding: "30px 0" }}>
      {/* node on the spine */}
      <div data-anim style={{
        position: "absolute", insetInlineStart: rtl ? "auto" : "50%", left: "50%", top: 36,
        width: 11, height: 11, borderRadius: "50%", transform: "translateX(-50%)",
        border: `1px solid ${C.gold}`, background: inView ? C.gold : C.bg,
        boxShadow: inView ? `0 0 14px ${C.gold}` : "none",
        transition: "background .6s ease, box-shadow .6s ease", zIndex: 2,
      }} />
      <div data-anim style={{
        maxWidth: 640, margin: "0 auto", textAlign: "center", paddingTop: 30,
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(22px)",
        transition: "opacity .8s var(--ease), transform .8s var(--ease)",
      }}>
        <div style={{
          background: C.panel2, border: `1px solid ${C.border}`, borderRadius: "var(--r-lg)",
          padding: "22px 20px 24px", boxShadow: "var(--shadow)",
        }}>
          <div style={{
            border: `1px solid ${C.borderSoft}`, borderRadius: "var(--r)", background: C.inset,
            padding: "14px 10px", marginBottom: 18,
          }}>
            <Scene />
          </div>
          <Kicker style={{ letterSpacing: rtl ? 0 : 2.4 }}>{ch.idx[lang]} · {ch.era[lang]}</Kicker>
          <h2 style={{
            fontFamily: FONT.title[lang], color: C.textHi, fontWeight: 700,
            fontSize: "clamp(21px,3.6vw,28px)", margin: "12px 0 12px", lineHeight: 1.35,
          }}>{ch.title[lang]}</h2>
          <p dir={rtl ? "rtl" : "ltr"} style={{
            fontFamily: FONT.body[lang], color: C.text, fontSize: rtl ? 18 : "clamp(15px,2vw,17px)",
            lineHeight: rtl ? 2 : 1.75, margin: 0,
          }}>{ch.body[lang]}</p>
        </div>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0 }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <div ref={ref} data-anim style={{
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(18px)",
      transition: `opacity .8s var(--ease) ${delay}s, transform .8s var(--ease) ${delay}s`,
    }}>{children}</div>
  );
}

function EnterButton({ onEnter, lang }) {
  const [hover, setHover] = useState(false);
  return (
    <button className="btn" onClick={onEnter} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: FONT.title[lang], fontWeight: 600, fontSize: "clamp(15px,2.2vw,18px)",
        letterSpacing: lang === "ar" ? 0 : 0.4,
        color: hover ? "#0a0f17" : C.goldBright, background: hover ? C.gold : "transparent",
        border: `1px solid ${C.gold}`, borderRadius: 10, padding: "14px 38px",
        boxShadow: hover ? `0 14px 36px -10px rgba(205,169,79,0.5)` : "none",
        transform: hover ? "translateY(-2px)" : "none",
      }}>
      {T.enter[lang]}
    </button>
  );
}

function Landing({ onEnter, leaving, lang, setLang }) {
  const rtl = lang === "ar";
  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{
      position: "relative", background: APP_BG, color: C.text, overflowX: "hidden",
      minHeight: "100vh", fontFamily: FONT.body[lang],
      opacity: leaving ? 0 : 1, transition: "opacity .6s ease",
    }}>
      <BgDecor candles={false} />

      {/* top bar */}
      <div style={{
        position: "absolute", top: 0, insetInline: 0, zIndex: 5, display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "16px 20px",
      }}>
        <LangToggle lang={lang} setLang={setLang} />
        <button className="btn" onClick={onEnter} style={{
          background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
          fontFamily: FONT.body[lang], fontSize: 13, padding: "7px 14px", borderRadius: 8,
        }}>{T.skip[lang]}</button>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 22px" }}>
          {!prefersReduced() && (
            <Suspense fallback={null}><Hero3D /></Suspense>
          )}
          <div data-anim style={{ position: "relative", zIndex: 1, animation: "mdh-fade 1s ease both" }}>
            <Kicker style={{ letterSpacing: rtl ? 2 : 4, marginBottom: 22, color: C.gold }}>{T.journey[lang]}</Kicker>
            <h1 style={{
              fontFamily: FONT.title[lang], fontWeight: 800, color: C.textHi,
              fontSize: "clamp(40px,7.4vw,80px)", margin: 0, lineHeight: 1.08,
              letterSpacing: rtl ? 0 : -1.5,
            }}>
              {T.heroTitle[lang][0]}<br />
              <span style={{ color: C.gold }}>{T.heroTitle[lang][1]}</span>
            </h1>
            <p dir={rtl ? "rtl" : "ltr"} style={{
              fontFamily: FONT.body[lang], color: C.text, fontSize: rtl ? 19 : "clamp(16px,2.2vw,20px)",
              lineHeight: rtl ? 2 : 1.7, maxWidth: 620, margin: "26px auto 0",
            }}>{T.heroSub[lang]}</p>
          </div>
          <div style={{ position: "absolute", zIndex: 1, bottom: 30, color: C.muted, fontSize: 12, letterSpacing: rtl ? 0 : 1.5, textTransform: "uppercase" }} className="mono">
            <div style={{ animation: prefersReduced() ? "none" : "mdh-bob 2s ease-in-out infinite" }}>{T.scroll[lang]} ↓</div>
          </div>
        </section>

        {/* NARRATIVE */}
        <section style={{ position: "relative", maxWidth: 760, margin: "0 auto", padding: "20px 22px 10px" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, transform: "translateX(-50%)", background: `linear-gradient(180deg, transparent, ${C.gold} 12%, ${C.gold} 88%, transparent)`, opacity: 0.25 }} />
          {CHAPTERS.map((ch) => <Chapter key={ch.scene} ch={ch} lang={lang} />)}
        </section>

        {/* ENTER */}
        <section style={{ minHeight: "76vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 22px 60px" }}>
          <Reveal>
            <div style={{ fontFamily: FONT.title[lang], color: C.textHi, fontWeight: 700, fontSize: "clamp(23px,4vw,36px)", marginBottom: 28, letterSpacing: rtl ? 0 : -0.5 }}>
              {T.yourTurn[lang]}
            </div>
          </Reveal>
          <Reveal delay={0.15}><EnterButton onEnter={onEnter} lang={lang} /></Reveal>
          <Reveal delay={0.3}>
            <div className="mono" style={{ color: C.muted, fontSize: 11, letterSpacing: 1.5, marginTop: 22 }}>
              {T.liveLabel[lang]}
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ================================= */
function compute(sym, all) {
  const rows = all.filter((r) => r.sym === sym).sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const nets = rows.map((r) => r.net);
  const min = Math.min(...nets), max = Math.max(...nets);
  const pos = (last.net - min) / (max - min);
  const zeroPos = (0 - min) / (max - min);
  const change1w = last.net - prev.net;
  const isLong = last.net > 0;
  let read;
  if (pos >= 0.85) read = { tone: "warn", note: "near the top of its 18-month range — historically stretched" };
  else if (pos <= 0.15) read = { tone: "warn", note: "near the bottom of its 18-month range — historically stretched" };
  else read = { tone: "neutral", note: "positioning sits in the middle of its 18-month range" };
  return { rows, last, prev, min, max, pos, zeroPos, change1w, isLong, read };
}

/* Lightweight pure-SVG sparkline of net history (no extra dependency). */
function Sparkline({ rows, color, w = 132, h = 36 }) {
  const gid = useId().replace(/:/g, "");
  const slice = rows.slice(-46).map((r) => r.net);
  if (slice.length < 2) return null;
  const min = Math.min(...slice), max = Math.max(...slice);
  const span = (max - min) || 1;
  const X = (i) => (i / (slice.length - 1)) * w;
  const Y = (v) => h - 3 - ((v - min) / span) * (h - 6);
  const line = slice.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${w.toFixed(1)} ${h} L 0 ${h} Z`;
  const zeroY = min < 0 && max > 0 ? Y(0) : null;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", height: h }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {zeroY != null && <line x1="0" x2={w} y1={zeroY} y2={zeroY} stroke={C.faint} strokeWidth="0.6" strokeDasharray="2 2" />}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* Range-positioning meter. compact=true → dense version for watchlist cards. */
function Gauge({ s, compact }) {
  const [mounted, setMounted] = useState(prefersReduced());
  useEffect(() => { const t = setTimeout(() => setMounted(true), 90); return () => clearTimeout(t); }, []);
  const pctNum = s.pos * 100;
  const zeroPct = clamp(s.zeroPos * 100);
  const markerLeft = mounted ? clamp(pctNum) : zeroPct;
  const extreme = s.pos >= 0.85 || s.pos <= 0.15;
  const accent = s.isLong ? C.long : C.short;
  const trackH = compact ? 6 : 10;
  const track = `linear-gradient(90deg, ${C.shortSoft} 0%, rgba(255,255,255,0.03) ${zeroPct}%, ${C.longSoft} 100%)`;
  return (
    <div style={{ marginTop: compact ? 10 : 16 }}>
      {!compact && (
        <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.faint, marginBottom: 7 }}>
          <span>18-mo low · {fmt(s.min)}</span><span>high · {fmt(s.max)}</span>
        </div>
      )}
      <div style={{ position: "relative", height: trackH, borderRadius: trackH, background: track, border: `1px solid ${C.borderSoft}` }}>
        {!compact && [25, 50, 75].map((t) => (
          <div key={t} style={{ position: "absolute", left: `${t}%`, top: 1, bottom: 1, width: 1, background: "rgba(255,255,255,0.05)" }} />
        ))}
        {s.zeroPos > 0.02 && s.zeroPos < 0.98 && (
          <div style={{ position: "absolute", left: `${zeroPct}%`, top: -3, bottom: -3, width: 1, background: C.muted, opacity: 0.55 }} />
        )}
        <div style={{
          position: "absolute", left: `calc(${markerLeft}% - ${compact ? 4 : 6}px)`, top: compact ? -2 : -3,
          width: compact ? 8 : 12, height: compact ? 8 : 12, borderRadius: "50%", background: accent,
          boxShadow: `0 0 0 ${compact ? 2 : 3}px ${C.bg}, 0 0 12px ${accent}`,
          transition: "left .8s var(--ease)",
        }} />
      </div>
      {compact ? (
        <div className="mono" style={{ fontSize: 10, color: extreme ? C.warn : C.faint, marginTop: 6 }}>
          {pctNum.toFixed(0)}% of 18-mo range{extreme ? " · extreme" : ""}
        </div>
      ) : (
        <div className="mono" style={{ fontSize: 11, color: C.muted, marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: s.read.tone === "warn" ? C.warn : C.text, fontWeight: 600 }}>{pctNum.toFixed(0)}% of range</span>
          {extreme && (
            <span style={{ color: C.warn, background: C.warnSoft, border: `1px solid ${C.warn}`, borderRadius: 999, padding: "1px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>EXTREME</span>
          )}
          <span style={{ color: C.faint }}>· {s.read.note}</span>
        </div>
      )}
    </div>
  );
}

function ChartTip({ active, payload, mode }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="mono" style={{ background: C.inset, border: `1px solid ${C.borderStrong}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, boxShadow: "var(--shadow)" }}>
      <div style={{ color: C.muted, marginBottom: 4, fontSize: 11 }}>{niceDate(d.date)}</div>
      {mode === "net" ? (
        <>
          <div style={{ color: d.net >= 0 ? C.long : C.short, fontWeight: 700, fontSize: 13 }}>net {fmtSigned(d.net)}</div>
          <div style={{ color: C.faint, fontSize: 11, marginTop: 2 }}>L {fmt(d.long)} · S {fmt(d.short)}</div>
        </>
      ) : (<div style={{ color: d.pctLong >= 50 ? C.long : C.short, fontWeight: 700, fontSize: 13 }}>{d.pctLong}% long</div>)}
    </div>
  );
}

function HistoryChart({ s, mode }) {
  const key = mode === "net" ? "net" : "pctLong";
  const data = s.rows;
  const gid = useId().replace(/:/g, "");
  const accent = s.isLong ? C.long : C.short;
  const baseline = mode === "net" ? 0 : 50;
  return (
    <div style={{ height: 178, marginTop: 14 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.32} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.borderSoft} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: C.faint, fontSize: 10, fontFamily: MONO }}
            interval={Math.floor(data.length / 5)} axisLine={{ stroke: C.borderSoft }} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fill: C.faint, fontSize: 10, fontFamily: MONO }} width={40}
            tickFormatter={(v) => mode === "net" ? (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "k" : v) : v + "%"}
            axisLine={false} tickLine={false} domain={mode === "pct" ? [20, 100] : ["auto", "auto"]} />
          <ReferenceLine y={baseline} stroke={C.faint} strokeDasharray="4 4" strokeOpacity={0.7} />
          <Tooltip content={<ChartTip mode={mode} />} cursor={{ stroke: C.borderStrong, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey={key} stroke={accent} strokeWidth={2} fill={`url(#${gid})`} dot={false}
            activeDot={{ r: 4, fill: accent, stroke: C.bg, strokeWidth: 2 }}
            isAnimationActive={!prefersReduced()} animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniCard({ sym, data, selected, onSelect }) {
  const s = compute(sym, data);
  const m = INSTR[sym];
  const accent = s.isLong ? C.long : C.short;
  const tilt = useTilt(5);
  return (
    <button className="mc tilt" {...tilt} onClick={() => onSelect(sym)} dir="ltr" aria-pressed={selected}
      style={selected ? { borderColor: accent, background: C.panel, boxShadow: `0 0 0 1px ${accent}, var(--shadow)` } : undefined}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.textHi, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
          <div className="mono" style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{sym} · {m.venue}</div>
        </div>
        <Badge isLong={s.isLong} sm />
      </div>
      <div style={{ margin: "12px -2px 2px" }}>
        <Sparkline rows={s.rows} color={accent} />
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        <Stat size="sm" label="Net" value={fmtSigned(s.last.net)} color={accent} />
        <Stat size="sm" label="% Long" value={s.last.pctLong + "%"} />
        <Stat size="sm" label="1-wk" value={fmtSigned(s.change1w)} color={s.change1w >= 0 ? C.long : C.short} />
      </div>
      <Gauge s={s} compact />
    </button>
  );
}

function DetailPanel({ sym, mode, data }) {
  const s = compute(sym, data);
  const m = INSTR[sym];
  const accent = s.isLong ? C.long : C.short;
  const animNet = useCountUp(s.last.net);
  const animPct = useCountUp(s.last.pctLong);
  const animChg = useCountUp(s.change1w);
  const back4 = s.rows[s.rows.length - 5] || s.rows[0];
  const chg4 = s.last.net - back4.net;
  return (
    <div key={sym} data-anim dir="ltr" style={{
      position: "relative", background: C.panel, border: `1px solid ${C.border}`, borderRadius: "var(--r-lg)",
      padding: 22, boxShadow: "var(--shadow)", overflow: "hidden", animation: "mdh-fade .35s ease both",
    }}>
      <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.textHi, letterSpacing: -0.3 }}>{m.name}</span>
            <span className="mono" style={{ fontSize: 12, color: C.faint }}>{sym} · {m.venue}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{m.cohort} · vs {m.cfd}</div>
        </div>
        <Badge isLong={s.isLong} text={s.isLong ? "NET LONG" : "NET SHORT"} />
      </div>

      <div style={{ display: "flex", gap: 26, marginTop: 18, flexWrap: "wrap" }}>
        <Stat label="Net position" value={fmtSigned(Math.round(animNet))} color={accent} />
        <Stat label="% Long" value={animPct.toFixed(1) + "%"} />
        <Stat label="1-wk change" value={fmtSigned(Math.round(animChg))} color={s.change1w >= 0 ? C.long : C.short} />
        <Stat label="4-wk change" value={fmtSigned(chg4)} color={chg4 >= 0 ? C.long : C.short} size="md" />
        <Stat label="Open interest" value={fmt(s.last.oi)} size="md" />
      </div>

      <Gauge s={s} />
      <div key={mode} data-anim style={{ animation: "mdh-fade .35s ease both" }}><HistoryChart s={s} mode={mode} /></div>
    </div>
  );
}

function Center({ children, sub, loading }) {
  return (
    <div style={{ background: APP_BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.text, gap: 10, padding: 24, textAlign: "center" }}>
      {loading && (
        <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.gold, animation: prefersReduced() ? "none" : "mdh-spin .8s linear infinite", marginBottom: 4 }} />
      )}
      <Kicker color={C.gold}>Market Data Hub</Kicker>
      <div style={{ fontSize: 15, color: C.textHi }}>{children}</div>
      {sub && <div style={{ fontSize: 12.5, color: C.muted, maxWidth: 440, lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
}

function WhalePanel({ s, lang }) {
  const rtl = lang === "ar";
  const rows = s.rows;
  const last = rows[rows.length - 1];
  const back4 = rows[rows.length - 5] || rows[0];
  const chg4 = last.net - back4.net;
  const pct = (s.pos * 100).toFixed(0);
  const stance = s.pos >= 0.85 ? { en: "Crowded LONG — stretched", ar: "ازدحام شرائي — متطرّف", c: C.warn }
    : s.pos <= 0.15 ? { en: "Crowded SHORT — stretched", ar: "ازدحام بيعي — متطرّف", c: C.warn }
    : { en: "Mid-range positioning", ar: "تموضع في منتصف النطاق", c: C.muted };
  const Tile = ({ label, value, color }) => (
    <div style={{ background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: "10px 13px", minWidth: 92, flex: "1 1 92px" }}>
      <div style={{ fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: color || C.textHi, marginTop: 3 }}>{value}</div>
    </div>
  );
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "var(--r)", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.isLong ? C.long : C.short }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.textHi }}>{rtl ? "تموضع الحيتان" : "Whale Positioning"}</span>
      </div>
      <div dir={rtl ? "rtl" : "ltr"} style={{ fontSize: 12, color: C.muted, marginBottom: 13, fontFamily: rtl ? FONT.body.ar : "inherit" }}>
        {rtl ? "كبار المضاربين (" : "Big speculators ("}{INSTR_cohort(s)}{rtl ? ") — تقرير CFTC الأسبوعي" : ") — weekly CFTC report"}
      </div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <Tile label={rtl ? "الصافي" : "Net"} value={fmtSigned(last.net)} color={s.isLong ? C.long : C.short} />
        <Tile label={rtl ? "% شراء" : "% Long"} value={last.pctLong + "%"} />
        <Tile label={rtl ? "الموقع بالنطاق" : "Range pos"} value={pct + "%"} color={stance.c} />
        <Tile label={rtl ? "تغيّر أسبوع" : "1-wk Δ"} value={fmtSigned(s.change1w)} color={s.change1w >= 0 ? C.long : C.short} />
        <Tile label={rtl ? "تغيّر ٤ أسابيع" : "4-wk Δ"} value={fmtSigned(chg4)} color={chg4 >= 0 ? C.long : C.short} />
        <Tile label="OI" value={fmt(last.oi)} />
      </div>
      <div dir={rtl ? "rtl" : "ltr"} style={{ marginTop: 13, fontSize: rtl ? 14 : 12.5, color: stance.c, fontFamily: rtl ? FONT.body.ar : "inherit", fontWeight: 600 }}>
        {stance[lang]} · {pct}% {rtl ? "من نطاق ١٨ شهراً" : "of 18-mo range"}
      </div>
    </div>
  );
}
function INSTR_cohort(s) { return s.cohort || ""; }

/* ===================== asset analysis layers (price-derived) ============== */
function MiniMeter({ pos, accent }) {
  const p = clamp(pos);
  return (
    <div style={{ position: "relative", height: 8, borderRadius: 8, background: `linear-gradient(90deg, ${C.shortSoft}, rgba(255,255,255,0.03), ${C.longSoft})`, border: `1px solid ${C.borderSoft}` }}>
      <div style={{ position: "absolute", left: `calc(${p}% - 5px)`, top: -2, width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: `0 0 0 2px ${C.bg}, 0 0 8px ${accent}` }} />
    </div>
  );
}

function Histogram({ hist }) {
  const max = Math.max(...hist, 1);
  const n = hist.length;
  const mid = (n - 1) / 2;
  return (
    <svg width="100%" viewBox={`0 0 ${n} 40`} preserveAspectRatio="none" style={{ display: "block", height: 54 }}>
      <line x1={mid + 0.5} x2={mid + 0.5} y1="0" y2="40" stroke={C.faint} strokeWidth="0.06" strokeDasharray="1 1" />
      {hist.map((v, i) => {
        const h = (v / max) * 36;
        const col = i < mid - 0.5 ? C.short : i > mid + 0.5 ? C.long : C.muted;
        return <rect key={i} x={i + 0.12} y={40 - h} width={0.76} height={h} fill={col} opacity={0.85} />;
      })}
    </svg>
  );
}

function ALayer({ label, color, children }) {
  const tilt = useTilt(5);
  return (
    <div className="alayer tilt" {...tilt}>
      <div className="alayer-h"><span className="dot" style={{ background: color }} />{label}</div>
      {children}
    </div>
  );
}

const dlt = (v) => (v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%");
const dcol = (v) => (v == null ? C.muted : v >= 0 ? C.long : C.short);
const REGIME = {
  elevated:   { en: "Elevated volatility", ar: "تقلّب مرتفع", c: C.short },
  compressed: { en: "Compressed volatility", ar: "تقلّب منخفض", c: C.info },
  normal:     { en: "Normal volatility", ar: "تقلّب طبيعي", c: C.muted },
};

function AssetAnalysis({ sym, lang }) {
  const rtl = lang === "ar";
  const [st, setSt] = useState({ loading: true });
  useEffect(() => {
    let alive = true;
    setSt({ loading: true });
    fetchAssetAnalytics(sym)
      .then((d) => alive && setSt({ loading: false, data: d }))
      .catch((e) => alive && setSt({ loading: false, error: String(e?.message || e) }));
    return () => { alive = false; };
  }, [sym]);

  const a = st.data?.analytics;
  const reg = a ? REGIME[a.volRegime] : null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textHi }}>{T.analysisTitle[lang]}</div>
        {st.data && <span className="mono" style={{ fontSize: 11, color: C.faint }}>{st.data.symbol} · {st.data.currency} · {a.n}d daily</span>}
      </div>

      {/* honesty banner — guardrail: descriptive risk context, never a direction call */}
      <div dir={rtl ? "rtl" : "ltr"} style={{ display: "flex", gap: 11, background: C.warnSoft, border: "1px solid rgba(227,169,58,0.35)", borderRadius: "var(--r)", padding: "11px 14px", marginBottom: 14, fontSize: rtl ? 13.5 : 12, color: C.text, lineHeight: rtl ? 1.85 : 1.55, fontFamily: rtl ? FONT.body.ar : "inherit", textAlign: rtl ? "right" : "left" }}>
        <span style={{ color: C.warn, fontWeight: 800, flexShrink: 0 }}>⚠</span>
        <span>{T.analysisDisclaimer[lang]}</span>
      </div>

      {st.loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(232px,1fr))", gap: 13 }}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 158 }} />)}
        </div>
      )}

      {st.error && (
        <div style={{ background: C.panel2, border: `1px dashed ${C.border}`, borderRadius: "var(--r)", padding: "16px 18px", color: C.muted, fontSize: 13 }}>
          {T.analysisErr[lang]} <span className="mono" style={{ color: C.faint }}>({st.error})</span>
        </div>
      )}

      {a && (
        <div className="tilt-scene" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(238px,1fr))", gap: 13 }}>
          {/* Price context */}
          <ALayer label={T.lyrPrice[lang]} color={C.info}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="mono" style={{ fontSize: 23, fontWeight: 700, color: C.textHi }}>{a.last.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
              <span className="mono" style={{ fontSize: 11, color: C.faint }}>{st.data.currency}</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: C.faint, margin: "13px 0 6px", display: "flex", justifyContent: "space-between" }}>
              <span>52w {a.lo52.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              <span style={{ color: C.text }}>{a.rangePos.toFixed(0)}%</span>
              <span>{a.hi52.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            </div>
            <MiniMeter pos={a.rangePos} accent={C.info} />
            <div style={{ display: "flex", gap: 11, marginTop: 13, flexWrap: "wrap" }}>
              {[["1W", a.perf.w1], ["1M", a.perf.m1], ["3M", a.perf.m3], ["6M", a.perf.m6], ["1Y", a.perf.y1]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 9.5, color: C.faint, fontWeight: 600 }}>{k}</div>
                  <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: dcol(v) }}>{dlt(v)}</div>
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 12 }}>
              max drawdown 1y · <span style={{ color: C.short, fontWeight: 600 }}>{a.maxDD.toFixed(1)}%</span>
            </div>
          </ALayer>

          {/* Volatility */}
          <ALayer label={T.lyrVol[lang]} color={C.warn}>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <Stat size="md" label="Ann. vol 30d" value={a.vol30.toFixed(0) + "%"} color={C.textHi} />
              <Stat size="md" label="Ann. vol 90d" value={a.vol90.toFixed(0) + "%"} />
            </div>
            <div style={{ marginTop: 13 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: reg.c, background: `${reg.c}1f`, border: `1px solid ${reg.c}`, borderRadius: 999, padding: "3px 11px" }}>{reg[lang]}</span>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 15, flexWrap: "wrap" }}>
              <Stat size="md" label="ATR(14)" value={a.atr.toLocaleString("en-US", { maximumFractionDigits: a.atr < 10 ? 2 : 0 })} />
              <Stat size="md" label="ATR %" value={a.atrPct.toFixed(2) + "%"} />
              <Stat size="md" label="Daily σ" value={a.dailyVolPct.toFixed(2) + "%"} />
            </div>
          </ALayer>

          {/* Movement envelope */}
          <ALayer label={T.lyrMove[lang]} color={C.long}>
            <div dir={rtl ? "rtl" : "ltr"} style={{ fontSize: rtl ? 12.5 : 11.5, color: C.muted, marginBottom: 12, lineHeight: 1.5, fontFamily: rtl ? FONT.body.ar : "inherit" }}>
              {rtl ? "مدى اليوم النموذجي (نطاق الشمعة اليومية) — لتحجيم الوقف والهدف." : "Typical single-day range — for sizing stops & targets."}
            </div>
            {[["Typical day", a.env.p50, a.envAtr.p50], ["Active (75th)", a.env.p75, a.envAtr.p75], ["Big day (90th)", a.env.p90, a.envAtr.p90]].map(([k, pp, aa]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <span style={{ fontSize: 11.5, color: C.text }}>{k}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.textHi }}>{pp.toFixed(2)}% <span style={{ color: C.faint, fontWeight: 400, fontSize: 11 }}>· {aa.toFixed(1)} ATR</span></span>
              </div>
            ))}
          </ALayer>

          {/* Return distribution */}
          <ALayer label={T.lyrDist[lang]} color={C.short}>
            <Histogram hist={a.hist} />
            <div style={{ display: "flex", gap: 16, marginTop: 13, flexWrap: "wrap" }}>
              <Stat size="md" label="Skew" value={a.skew.toFixed(2)} color={a.skew < 0 ? C.short : C.long} />
              <Stat size="md" label="Excess kurt" value={a.exKurt.toFixed(1)} />
              <Stat size="md" label=">3σ tails" value={a.tailRatio.toFixed(1) + "×"} color={a.tailRatio > 1 ? C.warn : C.textHi} />
            </div>
            <div dir={rtl ? "rtl" : "ltr"} style={{ fontSize: rtl ? 12 : 10.5, color: C.faint, marginTop: 12, lineHeight: 1.5, fontFamily: rtl ? FONT.body.ar : "inherit" }}>
              {rtl
                ? `ذيولٌ سمينة: قفزاتٌ أكبر من ٣σ تحدث بمعدّل ${a.tailRatio.toFixed(1)}× مقارنةً بالتوزيع الطبيعي.`
                : `Fat tails: >3σ moves occur ${a.tailRatio.toFixed(1)}× more than a normal distribution predicts.`}
            </div>
          </ALayer>
        </div>
      )}
    </div>
  );
}

function MarketModal({ sym, data, onClose, lang }) {
  const [mode, setMode] = useState("net");
  const s = compute(sym, data);
  s.cohort = INSTR[sym].cohort;
  const m = INSTR[sym];
  const rtl = lang === "ar";
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 60, background: "rgba(4,7,12,0.8)", backdropFilter: "blur(4px)",
      animation: "mdh-overlayIn .25s ease both", display: "flex", justifyContent: "center", alignItems: "flex-start",
      padding: "24px 14px", overflowY: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} dir="ltr" style={{
        width: "100%", maxWidth: 1040, background: APP_BG, border: `1px solid ${C.border}`, borderRadius: "var(--r-xl)",
        padding: 20, animation: "mdh-modalIn .4s var(--ease) both", boxShadow: "var(--shadow-lg)",
      }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: C.textHi, letterSpacing: -0.4 }}>{m.name}</span>
              <Badge isLong={s.isLong} text={s.isLong ? "NET LONG" : "NET SHORT"} sm />
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>{sym} · {m.venue} · {m.cohort} · vs {m.cfd}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, fontSize: 19, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {/* whale positioning */}
        <div style={{ marginTop: 16 }}><WhalePanel s={s} lang={lang} /></div>

        {/* asset analysis layers (replaces the old live chart) */}
        <AssetAnalysis sym={sym} lang={lang} />

        {/* COT history */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textHi }}>{rtl ? "تاريخ تموضع الحيتان (COT)" : "Whale positioning history (COT)"}</div>
            <div className="seg">
              <button className="seg-btn" data-active={mode === "net"} onClick={() => setMode("net")}>Net</button>
              <button className="seg-btn" data-active={mode === "pct"} onClick={() => setMode("pct")}>% Long</button>
            </div>
          </div>
          <Gauge s={s} />
          <div key={mode} data-anim style={{ animation: "mdh-fade .35s ease both" }}><HistoryChart s={s} mode={mode} /></div>
        </div>

        {/* honest note */}
        <div dir={rtl ? "rtl" : "ltr"} style={{ marginTop: 16, background: C.panel2, border: `1px dashed ${C.border}`, borderRadius: "var(--r)", padding: "13px 16px", fontSize: rtl ? 14 : 12.5, color: C.muted, lineHeight: rtl ? 1.9 : 1.6, fontFamily: rtl ? FONT.body.ar : "inherit", textAlign: rtl ? "right" : "left" }}>
          {rtl
            ? "ملاحظة: هذه الطبقات تضيف تحليلات وصفية للمخاطر والحركة مبنيّة على أسعار يومية (Yahoo). الرسم التلقائي لبنية ICT (دعم/مقاومة، أوردر بلوكس، FVG، BOS/CHoCH) على شارت شموع أصلي هو المرحلة القادمة — مصدر الأسعار صار موصولاً، ويبقى عرض البنية داخل اليوم لاحقاً."
            : "Note: these layers add descriptive risk & movement analytics from daily price bars (Yahoo). Auto-drawn ICT structure (S/R, order blocks, FVG, BOS/CHoCH) on a native candlestick chart is the next phase — the price feed is now wired; intraday structure rendering is still to come."}
        </div>
      </div>
    </div>
  );
}

/* KPI summary tile for the dashboard header strip. */
function SummaryTile({ label, value, color, accentBar }) {
  return (
    <div style={{ position: "relative", background: C.panel, border: `1px solid ${C.border}`, borderRadius: "var(--r)", padding: "13px 16px", overflow: "hidden", flex: "1 1 130px", minWidth: 120 }}>
      {accentBar && <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 3, background: accentBar }} />}
      <div style={{ fontSize: 10.5, color: C.faint, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: color || C.textHi, marginTop: 4, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function Dashboard({ lang, setLang }) {
  const [mode, setMode] = useState("net");
  const [cat, setCat] = useState("All");
  const [sel, setSel] = useState("GC");
  const [open, setOpen] = useState(null);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const rtl = lang === "ar";

  useEffect(() => {
    let alive = true;
    (async () => {
      const PAGE = 1000;          // Supabase caps each request at 1000 rows
      let from = 0, acc = [];
      while (true) {
        const { data: rows, error } = await supabase
          .from("cot_positioning")
          .select("date, sym, long, short, net, pct_long, oi")
          .order("date", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) { if (alive) setErr(error.message); return; }
        acc = acc.concat(rows);
        if (rows.length < PAGE) break;   // last page reached
        from += PAGE;
      }
      if (!alive) return;
      setData(acc.map((r) => ({
        date: r.date, sym: r.sym, long: r.long, short: r.short,
        net: r.net, pctLong: Number(r.pct_long), oi: r.oi,
      })));
    })();
    return () => { alive = false; };
  }, []);

  const present = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map((r) => r.sym));
    return ORDER.filter((s) => set.has(s));
  }, [data]);

  const visible = useMemo(
    () => present.filter((s) => cat === "All" || INSTR[s].cat === cat),
    [present, cat]
  );

  const latestDate = useMemo(
    () => (data && data.length ? data.reduce((a, r) => (r.date > a ? r.date : a), "0") : null),
    [data]
  );

  const summary = useMemo(() => {
    if (!data || !present.length) return null;
    let nl = 0, ns = 0, ext = 0;
    for (const sym of present) {
      const s = compute(sym, data);
      if (s.isLong) nl++; else ns++;
      if (s.pos >= 0.85 || s.pos <= 0.15) ext++;
    }
    return { nl, ns, ext, total: present.length };
  }, [data, present]);

  if (err) return (<Center sub="Check that the Supabase table exists and the public read policy is enabled, then refresh.">Couldn’t load data — {err}</Center>);
  if (!data) return <Center loading>{T.loading[lang]}</Center>;
  if (!data.length) return <Center>No data found in the table yet.</Center>;

  const pickCat = (c) => {
    setCat(c);
    if (c !== "All" && INSTR[sel].cat !== c) {
      const first = present.find((s) => INSTR[s].cat === c);
      if (first) setSel(first);
    }
  };

  return (
    <div style={{ position: "relative", background: APP_BG, minHeight: "100vh", color: C.text }}>
      <BgDecor />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "22px 20px 40px" }}>

        {/* ===== top bar ===== */}
        <header data-anim style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, paddingBottom: 18, borderBottom: `1px solid ${C.border}`, animation: "mdh-fade .5s ease both" }}>
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: C.goldSoft, border: `1px solid ${C.gold}`, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: `linear-gradient(135deg, ${C.goldBright}, ${C.gold})` }} />
            </div>
            <div>
              <Kicker>Market Data Hub</Kicker>
              <h1 style={{ fontSize: "clamp(22px,3vw,28px)", fontWeight: 700, margin: "5px 0 0", color: C.textHi, letterSpacing: -0.4 }}>Smart-Money Positioning</h1>
              <div dir={rtl ? "rtl" : "ltr"} style={{ fontSize: 13, color: C.muted, marginTop: 4, fontFamily: rtl ? FONT.body.ar : "inherit", maxWidth: 460 }}>
                {T.dashTagline[lang]}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, color: C.long, background: C.longSoft, border: `1px solid ${C.long}`, borderRadius: 999, padding: "4px 11px" }} className="mono">
                <span className="pulse" /> LIVE
              </span>
              <LangToggle lang={lang} setLang={setLang} />
            </div>
            <div className="mono" style={{ textAlign: "right", fontSize: 11.5, color: C.faint }}>
              <div>CFTC · weekly · {present.length} markets</div>
              <div style={{ color: C.muted, marginTop: 2 }}>latest {niceDate(latestDate)}</div>
            </div>
          </div>
        </header>

        {/* ===== KPI summary strip ===== */}
        {summary && (
          <div data-anim style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18, animation: "mdh-fade .5s ease both", animationDelay: ".04s" }}>
            <SummaryTile label="Markets tracked" value={summary.total} accentBar={C.info} />
            <SummaryTile label="Net long" value={summary.nl} color={C.long} accentBar={C.long} />
            <SummaryTile label="Net short" value={summary.ns} color={C.short} accentBar={C.short} />
            <SummaryTile label="At extreme" value={summary.ext} color={summary.ext ? C.warn : C.textHi} accentBar={C.warn} />
            <SummaryTile label="Latest report" value={shortDate(latestDate)} accentBar={C.gold} />
          </div>
        )}

        {/* ===== controls ===== */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, margin: "20px 0 16px" }}>
          <div data-anim style={{ display: "flex", gap: 8, flexWrap: "wrap", animation: "mdh-fade .5s ease both", animationDelay: ".06s" }}>
            {CATS.map((c) => (
              <button key={c} className="chip" data-active={cat === c} onClick={() => pickCat(c)}>{CAT_LABEL[c][lang]}</button>
            ))}
          </div>
          <div data-anim className="seg" style={{ animation: "mdh-fade .5s ease both", animationDelay: ".1s" }}>
            <button className="seg-btn" data-active={mode === "net"} onClick={() => setMode("net")}>Net position</button>
            <button className="seg-btn" data-active={mode === "pct"} onClick={() => setMode("pct")}>% Long</button>
          </div>
        </div>

        {/* ===== selected-market detail ===== */}
        <DetailPanel sym={sel} mode={mode} data={data} />

        {/* ===== watchlist grid ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 13, marginTop: 16 }}>
          {visible.map((s) => (
            <MiniCard key={s} sym={s} data={data} selected={s === sel} onSelect={(x) => { setSel(x); setOpen(x); }} />
          ))}
        </div>

        {/* ===== how-to ===== */}
        <div data-anim dir={rtl ? "rtl" : "ltr"} style={{ display: "flex", gap: 13, background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: "var(--r)", padding: "15px 18px", marginTop: 18, fontSize: rtl ? 15 : 13, color: C.muted, lineHeight: rtl ? 1.9 : 1.65, fontFamily: rtl ? FONT.body.ar : "inherit", textAlign: rtl ? "right" : "left" }}>
          <div style={{ width: 3, alignSelf: "stretch", background: C.gold, borderRadius: 2, flexShrink: 0 }} />
          <div><span style={{ color: C.textHi, fontWeight: 700 }}>{T.howToTitle[lang]}</span> {T.howToBody[lang]}</div>
        </div>

        {/* ===== footer ===== */}
        <div data-anim style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.faint }}>
          <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="pulse" /> Live from Supabase · {present.length} markets · free CFTC data
          </span>
          <span style={{ color: C.muted, fontFamily: rtl ? FONT.body.ar : "var(--font-mono)" }}>{T.footerNote[lang]}</span>
        </div>
      </div>

      {open && <MarketModal sym={open} data={data} onClose={() => setOpen(null)} lang={lang} />}
    </div>
  );
}

/* ================================ APP ==================================== */
export default function App() {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [lang, setLang] = useState("en");

  const enter = () => {
    if (prefersReduced()) { setEntered(true); return; }
    setLeaving(true);
    setTimeout(() => { setEntered(true); window.scrollTo(0, 0); }, 600);
  };

  if (entered) return <Dashboard lang={lang} setLang={setLang} />;
  return <Landing onEnter={enter} leaving={leaving} lang={lang} setLang={setLang} />;
}
