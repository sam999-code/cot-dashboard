import React, { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ============================================================================
   MARKET DATA HUB  —  bilingual (EN/AR) landing with per-era typography,
   then the live Supabase "smart money" dashboard.
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
// TradingView chart symbols (CFD-style where possible — matches what Salim trades)
const TV = {
  GC: "OANDA:XAUUSD", SI: "OANDA:XAGUSD", HG: "COMEX:HG1!", PL: "OANDA:XPTUSD", PA: "OANDA:XPDUSD",
  CL: "TVC:USOIL", NG: "NYMEX:NG1!",
  ES: "OANDA:SPX500USD", NQ: "OANDA:NAS100USD", YM: "OANDA:US30USD", RTY: "CME_MINI:RTY1!",
  "6E": "OANDA:EURUSD", "6B": "OANDA:GBPUSD", "6J": "OANDA:USDJPY", "6A": "OANDA:AUDUSD",
  "6C": "OANDA:USDCAD", "6S": "OANDA:USDCHF", "6N": "OANDA:NZDUSD",
  BTC: "BINANCE:BTCUSDT", ETH: "BINANCE:ETHUSDT", DXY: "TVC:DXY",
};
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

const C = {
  bg: "#0b0f17", panel: "#121925", panel2: "#0e1521", border: "#222d3e",
  borderSoft: "#1a2433", text: "#d6deea", muted: "#6b7889", faint: "#46505f",
  long: "#26a69a", longSoft: "rgba(38,166,154,0.14)",
  short: "#ef5350", shortSoft: "rgba(239,83,80,0.14)",
  amber: "#e0a526",
  gold: "#cda434", goldBright: "#ecca6e", goldSoft: "rgba(205,164,52,0.13)",
  ivory: "#e9e4d6",
};

const ANIM = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;600;700&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IM+Fell+English:ital@0;1&family=Rakkas&family=Reem+Kufi:wght@400;600;700&display=swap');
@keyframes mdh-rise { from { opacity:0; transform: translateY(16px);} to { opacity:1; transform: translateY(0);} }
@keyframes mdh-fade { from { opacity:0;} to { opacity:1;} }
@keyframes mdh-pulse { 0% { box-shadow:0 0 0 0 rgba(38,166,154,.5);} 70% { box-shadow:0 0 0 7px rgba(38,166,154,0);} 100% { box-shadow:0 0 0 0 rgba(38,166,154,0);} }
@keyframes mdh-blink { 0%,100% { opacity:.3;} 50% { opacity:1;} }
@keyframes mdh-twinkle { 0%,100% { opacity:.12;} 50% { opacity:.7;} }
@keyframes mdh-bob { 0%,100% { transform: translateY(0);} 50% { transform: translateY(9px);} }
@keyframes mdh-glow { 0%,100% { opacity:.5;} 50% { opacity:.85;} }
@keyframes mdh-reachL { 0%,100% { transform: translateX(0);} 50% { transform: translateX(-5px);} }
@keyframes mdh-bobS { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-4px);} }
@keyframes mdh-glint { 0%,100% { opacity:.3;} 50% { opacity:1;} }
@keyframes mdh-riseChart { 0%,100% { transform: translateY(2px); opacity:.55;} 50% { transform: translateY(-2px); opacity:1;} }
@keyframes mdh-flipIn { from { transform: perspective(1800px) rotateY(82deg) scale(.94); opacity:0;} to { transform: perspective(1800px) rotateY(0deg) scale(1); opacity:1;} }
@keyframes mdh-overlayIn { from { opacity:0;} to { opacity:1;} }
@media (prefers-reduced-motion: reduce) {
  [data-anim] { animation: none !important; opacity: 1 !important; transform: none !important; }
}
`;
function Style() { return <style>{ANIM}</style>; }

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* per-era evocative fonts (titles); body stays readable */
const FONT = {
  titleDefault: { en: "'Cinzel', serif", ar: "'Aref Ruqaa', serif" },
  body: { en: "'Cormorant Garamond', serif", ar: "'Amiri', serif" },
  era: {
    greece: { en: "'Cinzel', serif", ar: "'Amiri', serif" },
    andalus: { en: "'Rakkas', cursive", ar: "'Reem Kufi', sans-serif" },
    amsterdam: { en: "'IM Fell English', serif", ar: "'Aref Ruqaa', serif" },
    modern: { en: "ui-monospace, 'Courier New', monospace", ar: "'Cairo', sans-serif" },
  },
};

const T = {
  skip: { en: "Skip →", ar: "تخطّي ←" },
  journey: { en: "A JOURNEY THROUGH TIME", ar: "رحلةٌ عبرَ الزمن" },
  heroTitle: { en: ["The Trade That", "Built the World"], ar: ["التجارةُ التي", "صنعَت العالم"] },
  heroSub: {
    en: "From the agora of Athens, to the markets of Córdoba, to today's digital ledgers — one unbroken chain. You are its latest chapter.",
    ar: "من أغورا أثينا، إلى أسواقِ قرطبة، إلى دفاترِ اليومِ الرقمية — سلسلةٌ واحدةٌ لا تنقطع. وأنتَ آخرُ فصولها.",
  },
  scroll: { en: "Scroll down ↓", ar: "مرّر للأسفل ↓" },
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
};

/* ============================ shared helpers ============================== */
function useCountUp(target, duration = 950) {
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
    }, opts || { threshold: 0.28 });
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

/* ============================ language toggle ============================= */
function LangToggle({ lang, setLang }) {
  const item = (code, label) => (
    <button onClick={() => setLang(code)} style={{
      cursor: "pointer", background: lang === code ? C.goldSoft : "transparent",
      border: `1px solid ${lang === code ? C.gold : "transparent"}`, color: lang === code ? C.goldBright : C.muted,
      borderRadius: 6, padding: "3px 10px", fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: 0.5,
    }}>{label}</button>
  );
  return <div style={{ display: "flex", gap: 4 }}>{item("en", "EN")}{item("ar", "ع")}</div>;
}

/* ===================== LANDING — animated trader scenes =================== */
function SceneGreece() {
  const f = C.gold, hi = C.goldBright;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 330, display: "block", margin: "0 auto" }}>
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
        <ellipse cx="150" cy="150" rx="16" ry="5" fill={hi} /><ellipse cx="150" cy="144" rx="14" ry="4.5" fill={f} />
        <ellipse cx="150" cy="139" rx="12" ry="4" fill={hi} /><ellipse cx="150" cy="135" rx="10" ry="3.5" fill={f} />
      </g>
      <g fill={hi}>
        <path data-anim style={{ animation: "mdh-glint 1.8s ease-in-out infinite" }} d="M150 118 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
        <path data-anim style={{ animation: "mdh-glint 2.3s ease-in-out .5s infinite" }} d="M176 130 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
      </g>
    </svg>
  );
}
function SceneAndalus() {
  const f = C.gold, hi = C.goldBright;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 330, display: "block", margin: "0 auto" }}>
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
  const f = C.gold, hi = C.goldBright;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 330, display: "block", margin: "0 auto" }}>
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
        <ellipse cx="170" cy="150" rx="14" ry="4.5" fill={hi} /><ellipse cx="170" cy="145" rx="12" ry="4" fill={f} /><ellipse cx="170" cy="141" rx="10" ry="3.5" fill={hi} />
      </g>
      <path data-anim style={{ animation: "mdh-glint 2s ease-in-out infinite" }} d="M186 132 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill={hi} />
    </svg>
  );
}
function SceneModern() {
  const f = C.gold, hi = C.goldBright, up = C.long, dn = C.short;
  return (
    <svg viewBox="0 0 300 200" width="100%" style={{ maxWidth: 330, display: "block", margin: "0 auto" }}>
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

function Stars() {
  const stars = useMemo(
    () => Array.from({ length: 48 }, () => ({
      top: Math.random() * 100, left: Math.random() * 100,
      s: Math.random() * 1.7 + 0.6, d: Math.random() * 4, o: Math.random() * 0.5 + 0.15,
    })), []
  );
  if (prefersReduced()) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {stars.map((st, i) => (
        <span key={i} style={{
          position: "absolute", top: `${st.top}%`, left: `${st.left}%`,
          width: st.s, height: st.s, borderRadius: "50%", background: C.gold, opacity: st.o,
          animation: `mdh-twinkle ${2.6 + st.d}s ease-in-out ${st.d}s infinite`,
        }} />
      ))}
    </div>
  );
}

function Chapter({ ch, lang }) {
  const [ref, inView] = useInView({ threshold: 0.25 });
  const Scene = SCENES[ch.scene];
  return (
    <div ref={ref} style={{ position: "relative", textAlign: "center", padding: "40px 0" }}>
      <div data-anim style={{
        width: 14, height: 14, borderRadius: "50%", margin: "0 auto 26px",
        border: `1px solid ${C.gold}`, background: inView ? C.gold : C.bg,
        boxShadow: inView ? `0 0 16px ${C.gold}` : "none",
        transition: "background .6s ease, box-shadow .6s ease",
      }} />
      <div data-anim style={{
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1)",
      }}>
        <div style={{ marginBottom: 14 }}><Scene /></div>
        <div style={{ fontFamily: FONT.body[lang], color: C.gold, fontSize: 15, letterSpacing: lang === "ar" ? 0 : 3, fontWeight: 600 }}>
          {ch.idx[lang]} · {ch.era[lang]}
        </div>
        <h2 style={{ fontFamily: FONT.era[ch.scene][lang], color: C.goldBright, fontWeight: 600, fontSize: "clamp(24px,4.4vw,36px)", margin: "12px 0 16px", lineHeight: 1.4 }}>
          {ch.title[lang]}
        </h2>
        <p style={{ fontFamily: FONT.body[lang], color: C.ivory, fontSize: "clamp(17px,2.6vw,21px)", lineHeight: lang === "ar" ? 2 : 1.75, maxWidth: 600, margin: "0 auto" }}>
          {ch.body[lang]}
        </p>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0 }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <div ref={ref} data-anim style={{
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
      transition: `opacity .8s ease ${delay}s, transform .8s cubic-bezier(.2,.8,.2,1) ${delay}s`,
    }}>{children}</div>
  );
}

function EnterButton({ onEnter, lang }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onEnter} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        cursor: "pointer", fontFamily: FONT.titleDefault[lang], fontWeight: 600, fontSize: "clamp(17px,2.6vw,22px)", letterSpacing: lang === "ar" ? 0 : 1.5,
        color: hover ? C.bg : C.goldBright, background: hover ? C.gold : "transparent",
        border: `1px solid ${C.gold}`, borderRadius: 10, padding: "15px 42px",
        boxShadow: hover ? `0 0 34px ${C.goldSoft}` : "none",
        transition: "background .35s ease, color .35s ease, box-shadow .35s ease, transform .2s ease",
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
      position: "relative", background: C.bg, color: C.ivory, overflowX: "hidden",
      fontFamily: FONT.body[lang], opacity: leaving ? 0 : 1, transition: "opacity .7s ease",
    }}>
      <Style />
      <Stars />

      <div style={{ position: "absolute", top: 16, left: 20, zIndex: 5 }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <button onClick={onEnter} style={{
        position: "absolute", top: 18, right: 20, zIndex: 5, cursor: "pointer",
        background: "transparent", border: "none", color: C.muted, fontFamily: FONT.body[lang], fontSize: 16, letterSpacing: rtl ? 0 : 1,
      }}>{T.skip[lang]}</button>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 22px", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "30%", width: 540, height: 540, maxWidth: "92%", borderRadius: "50%", background: `radial-gradient(circle, ${C.goldSoft}, transparent 65%)`, filter: "blur(8px)", zIndex: 0, animation: "mdh-glow 7s ease-in-out infinite" }} />
        <div data-anim style={{ position: "relative", zIndex: 1, animation: "mdh-fade 1s ease both" }}>
          <div style={{ fontFamily: FONT.body[lang], fontSize: 16, letterSpacing: rtl ? 2 : 5, color: C.gold, fontWeight: 600 }}>{T.journey[lang]}</div>
          <h1 style={{ fontFamily: FONT.titleDefault[lang], fontWeight: 700, color: C.goldBright, fontSize: "clamp(38px,7.2vw,78px)", margin: "20px 0 0", lineHeight: 1.25, letterSpacing: rtl ? 0 : 1 }}>
            {T.heroTitle[lang][0]}<br />{T.heroTitle[lang][1]}
          </h1>
          <p style={{ fontFamily: FONT.body[lang], color: C.ivory, fontSize: "clamp(18px,2.8vw,24px)", lineHeight: rtl ? 1.9 : 1.7, maxWidth: 660, margin: "24px auto 0" }}>
            {T.heroSub[lang]}
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 34, color: C.gold, fontSize: 15, letterSpacing: rtl ? 0 : 2, zIndex: 1 }}>
          <div style={{ animation: "mdh-bob 2s ease-in-out infinite" }}>{T.scroll[lang]}</div>
        </div>
      </section>

      {/* NARRATIVE */}
      <section style={{ position: "relative", maxWidth: 760, margin: "0 auto", padding: "30px 22px 10px", zIndex: 1 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, transform: "translateX(-50%)", background: `linear-gradient(180deg, transparent, ${C.gold} 12%, ${C.gold} 88%, transparent)`, opacity: 0.32 }} />
        {CHAPTERS.map((ch) => <Chapter key={ch.scene} ch={ch} lang={lang} />)}
      </section>

      {/* ENTER */}
      <section style={{ position: "relative", minHeight: "78vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 22px 60px", zIndex: 1 }}>
        <Reveal>
          <div style={{ fontFamily: FONT.titleDefault[lang], color: C.goldBright, fontSize: "clamp(24px,4.4vw,38px)", marginBottom: 30, letterSpacing: rtl ? 0 : 1 }}>
            {T.yourTurn[lang]}
          </div>
        </Reveal>
        <Reveal delay={0.15}><EnterButton onEnter={onEnter} lang={lang} /></Reveal>
        <Reveal delay={0.3}>
          <div style={{ fontFamily: "ui-monospace, monospace", color: C.muted, fontSize: 12, letterSpacing: 1, marginTop: 22 }}>
            {T.liveLabel[lang]}
          </div>
        </Reveal>
      </section>
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

function Gauge({ s }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const pct = (s.pos * 100).toFixed(0);
  const zeroPct = Math.max(0, Math.min(100, s.zeroPos * 100));
  const markerLeft = mounted ? (s.pos * 100).toFixed(1) : zeroPct;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, fontFamily: "ui-monospace, monospace", marginBottom: 6 }}>
        <span>18-mo low {fmt(s.min)}</span><span>high {fmt(s.max)}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 6, background: `linear-gradient(90deg, ${C.shortSoft}, #1a2230 ${zeroPct}%, ${C.longSoft})`, border: `1px solid ${C.borderSoft}` }}>
        {s.zeroPos > 0.02 && s.zeroPos < 0.98 && (
          <div style={{ position: "absolute", left: `${zeroPct}%`, top: -3, bottom: -3, width: 1, background: C.faint }} />
        )}
        <div style={{ position: "absolute", left: `calc(${markerLeft}% - 6px)`, top: -3, width: 12, height: 12, borderRadius: "50%", background: s.isLong ? C.long : C.short, boxShadow: `0 0 0 3px ${C.bg}, 0 0 10px ${s.isLong ? C.long : C.short}`, transition: "left .8s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 7, fontFamily: "ui-monospace, monospace" }}>
        now at <span style={{ color: s.read.tone === "warn" ? C.amber : C.muted }}>{pct}%</span> of range · {s.read.note}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, mode }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#0a0e16", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 11px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 3 }}>{niceDate(d.date)}</div>
      {mode === "net" ? (
        <>
          <div style={{ color: d.net >= 0 ? C.long : C.short }}>net {fmtSigned(d.net)}</div>
          <div style={{ color: C.faint, fontSize: 11 }}>L {fmt(d.long)} · S {fmt(d.short)}</div>
        </>
      ) : (<div style={{ color: d.pctLong >= 50 ? C.long : C.short }}>{d.pctLong}% long</div>)}
    </div>
  );
}

function HistoryChart({ s, mode }) {
  const key = mode === "net" ? "net" : "pctLong";
  const data = s.rows;
  const gid = `g_${key}_${Math.random().toString(36).slice(2, 7)}`;
  const baseline = mode === "net" ? 0 : 50;
  return (
    <div style={{ height: 150, marginTop: 14 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.isLong ? C.long : C.short} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.isLong ? C.long : C.short} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: C.faint, fontSize: 10, fontFamily: "ui-monospace, monospace" }} interval={Math.floor(data.length / 5)} axisLine={{ stroke: C.borderSoft }} tickLine={false} />
          <YAxis tick={{ fill: C.faint, fontSize: 10, fontFamily: "ui-monospace, monospace" }} width={38} tickFormatter={(v) => mode === "net" ? (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "k" : v) : v + "%"} axisLine={false} tickLine={false} domain={mode === "pct" ? [20, 100] : ["auto", "auto"]} />
          <ReferenceLine y={baseline} stroke={C.faint} strokeDasharray="3 3" />
          <Tooltip content={<ChartTip mode={mode} />} />
          <Area type="monotone" dataKey={key} stroke={s.isLong ? C.long : C.short} strokeWidth={2} fill={`url(#${gid})`} dot={false} isAnimationActive={!prefersReduced()} animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniGauge({ s }) {
  const zeroPct = Math.max(0, Math.min(100, s.zeroPos * 100));
  const markerLeft = (s.pos * 100).toFixed(1);
  const extreme = s.pos >= 0.85 || s.pos <= 0.15;
  return (
    <div style={{ marginTop: 11 }}>
      <div style={{ position: "relative", height: 6, borderRadius: 4, background: `linear-gradient(90deg, ${C.shortSoft}, #1a2230 ${zeroPct}%, ${C.longSoft})`, border: `1px solid ${C.borderSoft}` }}>
        <div style={{ position: "absolute", left: `calc(${markerLeft}% - 4px)`, top: -2, width: 8, height: 8, borderRadius: "50%", background: s.isLong ? C.long : C.short, boxShadow: `0 0 0 2px ${C.panel2}` }} />
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: extreme ? C.amber : C.faint, marginTop: 5 }}>
        {(s.pos * 100).toFixed(0)}% of 18-mo range{extreme ? " · extreme" : ""}
      </div>
    </div>
  );
}

function MiniCard({ sym, data, selected, onSelect }) {
  const s = compute(sym, data);
  const m = INSTR[sym];
  const accent = s.isLong ? C.long : C.short;
  return (
    <button onClick={() => onSelect(sym)} dir="ltr" style={{
      textAlign: "left", cursor: "pointer", display: "block", width: "100%",
      background: selected ? C.panel : C.panel2,
      border: `1px solid ${selected ? accent : C.border}`, borderRadius: 12, padding: "13px 14px",
      boxShadow: selected ? `0 0 20px ${s.isLong ? C.longSoft : C.shortSoft}` : "none",
      transition: "border-color .25s ease, background .25s ease, box-shadow .25s ease, transform .15s ease",
      transform: selected ? "translateY(-1px)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.faint }}>{sym} · {m.venue}</div>
        </div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, fontWeight: 700, color: accent, background: s.isLong ? C.longSoft : C.shortSoft, border: `1px solid ${accent}`, borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap" }}>
          {s.isLong ? "LONG" : "SHORT"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 11 }}>
        <div>
          <div style={{ fontSize: 9.5, color: C.faint, textTransform: "uppercase" }}>Net</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 700, color: accent }}>{fmtSigned(s.last.net)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: C.faint, textTransform: "uppercase" }}>% Long</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 700, color: C.text }}>{s.last.pctLong}%</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: C.faint, textTransform: "uppercase" }}>1-wk</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 700, color: s.change1w >= 0 ? C.long : C.short }}>{fmtSigned(s.change1w)}</div>
        </div>
      </div>
      <MiniGauge s={s} />
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
  return (
    <div key={sym} data-anim dir="ltr" style={{
      background: C.panel, border: `1px solid ${accent}`, borderRadius: 14, padding: 20,
      boxShadow: `0 0 26px ${s.isLong ? C.longSoft : C.shortSoft}`, animation: "mdh-fade .35s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 21, fontWeight: 700, color: C.text }}>{m.name}</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>{sym} · {m.venue}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.cohort} · vs {m.cfd}</div>
        </div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 700, color: accent, background: s.isLong ? C.longSoft : C.shortSoft, border: `1px solid ${accent}`, borderRadius: 6, padding: "3px 9px", whiteSpace: "nowrap" }}>
          {s.isLong ? "NET LONG" : "NET SHORT"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>Net position</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1.2 }}>{fmtSigned(Math.round(animNet))}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>% Long</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{animPct.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>1-wk change</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: s.change1w >= 0 ? C.long : C.short, lineHeight: 1.2 }}>{fmtSigned(Math.round(animChg))}</div>
        </div>
      </div>
      <Gauge s={s} />
      <div key={mode} data-anim style={{ animation: "mdh-fade .35s ease both" }}><HistoryChart s={s} mode={mode} /></div>
    </div>
  );
}

// Atmospheric dashboard background: blue/gold glow + dark base (keeps content readable)
const DASH_BG =
  "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(36,70,120,0.5), transparent 60%)," +
  "radial-gradient(ellipse 60% 50% at 92% 105%, rgba(205,164,52,0.10), transparent 55%)," +
  "linear-gradient(180deg, #0a0f1a 0%, #0b0f17 55%, #090d14 100%)";

function DashBgDecor() {
  const candles = useMemo(() => {
    const arr = []; let y = 150;
    for (let i = 0; i < 48; i++) {
      const open = y;
      y = Math.max(70, Math.min(230, y + (Math.random() - 0.46) * 28));
      const up = y <= open;
      const hi = Math.min(open, y) - (5 + Math.random() * 16);
      const lo = Math.max(open, y) + (5 + Math.random() * 16);
      arr.push({ x: i * 25 + 14, open, close: y, hi, lo, up });
    }
    return arr;
  }, []);
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.045,
        backgroundImage: "linear-gradient(rgba(125,162,192,1) 1px, transparent 1px), linear-gradient(90deg, rgba(125,162,192,1) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
      }} />
      <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "62%", opacity: 0.16 }}>
        {candles.map((c, i) => {
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
    </div>
  );
}

function Center({ children, sub, loading }) {
  return (
    <div style={{ background: DASH_BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text, gap: 8 }}>
      <Style />
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: 2, color: C.amber, textTransform: "uppercase" }}>Market Data Hub</div>
      <div style={{ fontSize: 15, color: C.text, display: "flex", alignItems: "center", gap: 9 }}>
        {loading && <span data-anim style={{ width: 8, height: 8, borderRadius: "50%", background: C.long, animation: "mdh-blink 1s infinite" }} />}
        {children}
      </div>
      {sub && <div style={{ fontSize: 12, color: C.muted, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
}

function TVChart({ tvSymbol }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.cssText = "height:100%;width:100%;";
    host.appendChild(widget);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: tvSymbol, interval: "240", timezone: "Etc/UTC",
      theme: "dark", style: "1", locale: "en", hide_side_toolbar: false,
      allow_symbol_change: false, calendar: false, withdateranges: true,
      support_host: "https://www.tradingview.com",
    });
    host.appendChild(script);
    return () => { host.innerHTML = ""; };
  }, [tvSymbol]);
  return <div className="tradingview-widget-container" ref={ref} style={{ height: "100%", width: "100%" }} />;
}

function WhalePanel({ s, lang }) {
  const rtl = lang === "ar";
  const rows = s.rows;
  const last = rows[rows.length - 1];
  const back4 = rows[rows.length - 5] || rows[0];
  const chg4 = last.net - back4.net;
  const pct = (s.pos * 100).toFixed(0);
  const stance = s.pos >= 0.85 ? { en: "Crowded LONG — stretched", ar: "ازدحام شرائي — متطرّف", c: C.amber }
    : s.pos <= 0.15 ? { en: "Crowded SHORT — stretched", ar: "ازدحام بيعي — متطرّف", c: C.amber }
    : { en: "Mid-range positioning", ar: "تموضع في منتصف النطاق", c: C.muted };
  const Tile = ({ label, value, color }) => (
    <div style={{ background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 9, padding: "9px 12px", minWidth: 90 }}>
      <div style={{ fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 17, fontWeight: 700, color: color || C.text }}>{value}</div>
    </div>
  );
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{rtl ? "تموضع الحيتان" : "Whale Positioning"}</div>
      <div dir={rtl ? "rtl" : "ltr"} style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontFamily: rtl ? "'Amiri', serif" : "inherit" }}>
        {rtl ? "كبار المضاربين (" : "Big speculators ("}{s.last ? "" : ""}{INSTR_cohort(s)}{rtl ? ") — تقرير CFTC الأسبوعي" : ") — weekly CFTC report"}
      </div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <Tile label={rtl ? "الصافي" : "Net"} value={fmtSigned(last.net)} color={s.isLong ? C.long : C.short} />
        <Tile label={rtl ? "% شراء" : "% Long"} value={last.pctLong + "%"} />
        <Tile label={rtl ? "الموقع بالنطاق" : "Range pos"} value={pct + "%"} color={stance.c} />
        <Tile label={rtl ? "تغيّر أسبوع" : "1-wk Δ"} value={fmtSigned(s.change1w)} color={s.change1w >= 0 ? C.long : C.short} />
        <Tile label={rtl ? "تغيّر ٤ أسابيع" : "4-wk Δ"} value={fmtSigned(chg4)} color={chg4 >= 0 ? C.long : C.short} />
        <Tile label="OI" value={fmt(last.oi)} />
      </div>
      <div dir={rtl ? "rtl" : "ltr"} style={{ marginTop: 12, fontSize: rtl ? 14 : 12.5, color: stance.c, fontFamily: rtl ? "'Amiri', serif" : "inherit", fontWeight: 600 }}>
        {stance[lang]} · {pct}% {rtl ? "من نطاق ١٨ شهراً" : "of 18-mo range"}
      </div>
    </div>
  );
}
function INSTR_cohort(s) { return s.cohort || ""; }

function MarketModal({ sym, data, onClose, lang }) {
  const [mode, setMode] = useState("net");
  const s = compute(sym, data);
  s.cohort = INSTR[sym].cohort;
  const m = INSTR[sym];
  const rtl = lang === "ar";
  const accent = s.isLong ? C.long : C.short;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  const Tab = ({ id, label }) => (
    <button onClick={() => setMode(id)} style={{
      fontFamily: "ui-monospace, monospace", fontSize: 12, cursor: "pointer", padding: "5px 12px", borderRadius: 7,
      border: `1px solid ${mode === id ? C.border : "transparent"}`, background: mode === id ? C.panel : "transparent",
      color: mode === id ? C.text : C.muted,
    }}>{label}</button>
  );
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 60, background: "rgba(4,7,12,0.78)", backdropFilter: "blur(3px)",
      animation: "mdh-overlayIn .25s ease both", display: "flex", justifyContent: "center", alignItems: "flex-start",
      padding: "24px 14px", overflowY: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} dir="ltr" style={{
        width: "100%", maxWidth: 1000, background: DASH_BG, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: 20, transformOrigin: "center", animation: "mdh-flipIn .55s cubic-bezier(.2,.8,.2,1) both",
        boxShadow: "0 30px 80px rgba(0,0,0,.6)",
      }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{m.name}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>{sym} · {m.venue} · chart {m.cfd}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 700, color: accent, background: s.isLong ? C.longSoft : C.shortSoft, border: `1px solid ${accent}`, borderRadius: 6, padding: "2px 8px" }}>
                {s.isLong ? "NET LONG" : "NET SHORT"}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ cursor: "pointer", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, width: 34, height: 34, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {/* whale positioning */}
        <div style={{ marginTop: 16 }}><WhalePanel s={s} lang={lang} /></div>

        {/* live chart */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            {rtl ? "الشارت الحيّ — استخدم أدوات الرسم على اليسار للدعم/المقاومة والستركشر" : "Live chart — use the drawing tools (left) for support/resistance & structure"}
          </div>
          <div style={{ height: "70vh", minHeight: 460, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <TVChart tvSymbol={TV[sym]} />
          </div>
        </div>

        {/* COT history */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{rtl ? "تاريخ تموضع الحيتان (COT)" : "Whale positioning history (COT)"}</div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 10 }}>
              <Tab id="net" label="Net" /><Tab id="pct" label="% Long" />
            </div>
          </div>
          <Gauge s={s} />
          <div key={mode} data-anim style={{ animation: "mdh-fade .35s ease both" }}><HistoryChart s={s} mode={mode} /></div>
        </div>

        {/* honest note */}
        <div dir={rtl ? "rtl" : "ltr"} style={{ marginTop: 16, background: C.panel2, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "12px 15px", fontSize: rtl ? 14 : 12.5, color: C.muted, lineHeight: rtl ? 1.9 : 1.6, fontFamily: rtl ? "'Amiri', serif" : "inherit", textAlign: rtl ? "right" : "left" }}>
          {rtl
            ? "ملاحظة: الرسم التلقائي للدعم/المقاومة والستركشر والأوردر بلوكس (من منطق ICT V4) هو المرحلة القادمة — يحتاج مصدر أسعار + إعادة بناء منطق المؤشّر بـ JavaScript. حالياً ارسم يدوياً على شارت TradingView أو أضف مؤشّرك داخل TradingView."
            : "Note: auto-drawing S/R, market structure and order blocks (from ICT V4 logic) is the next phase — it needs a price feed + the indicator's logic re-built in JavaScript. For now, draw manually on the TradingView chart or add your indicator inside TradingView."}
        </div>
      </div>
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

  const Tab = ({ id, label }) => (
    <button onClick={() => setMode(id)} style={{
      fontFamily: "ui-monospace, monospace", fontSize: 12, cursor: "pointer",
      padding: "5px 12px", borderRadius: 7, border: `1px solid ${mode === id ? C.border : "transparent"}`,
      background: mode === id ? C.panel : "transparent", color: mode === id ? C.text : C.muted,
      transition: "background .25s ease, color .25s ease, border-color .25s ease",
    }}>{label}</button>
  );

  const Chip = ({ c }) => (
    <button onClick={() => pickCat(c)} style={{
      fontFamily: "ui-monospace, monospace", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
      padding: "6px 13px", borderRadius: 8, border: `1px solid ${cat === c ? C.amber : C.border}`,
      background: cat === c ? C.goldSoft : "transparent", color: cat === c ? C.goldBright : C.muted,
      transition: "all .2s ease",
    }}>{CAT_LABEL[c][lang]}</button>
  );

  return (
    <div style={{ position: "relative", background: DASH_BG, minHeight: "100vh", padding: "26px 20px", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text }}>
      <Style />
      <DashBgDecor />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto" }}>
        <div data-anim style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4, animation: "mdh-fade .5s ease both" }}>
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: 2, color: C.amber, textTransform: "uppercase" }}>Market Data Hub</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0" }}>Smart-Money Positioning</h1>
            <div dir={rtl ? "rtl" : "ltr"} style={{ fontSize: 13, color: C.muted, marginTop: 4, fontFamily: rtl ? "'Amiri', serif" : "inherit" }}>
              {T.dashTagline[lang]}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <LangToggle lang={lang} setLang={setLang} />
            <div style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>
              <div>CFTC · weekly · {present.length} markets</div>
              <div style={{ color: C.muted }}>latest {niceDate(latestDate)}</div>
            </div>
          </div>
        </div>

        {/* category filters */}
        <div data-anim style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "16px 0 0", animation: "mdh-fade .5s ease both", animationDelay: ".05s" }}>
          {CATS.map((c) => <Chip key={c} c={c} />)}
        </div>

        {/* net / %long toggle */}
        <div data-anim style={{ display: "flex", gap: 4, margin: "14px 0 16px", padding: 4, background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 10, width: "fit-content", animation: "mdh-fade .5s ease both", animationDelay: ".1s" }}>
          <Tab id="net" label="Net position" /><Tab id="pct" label="% Long" />
        </div>

        {/* selected-market detail */}
        <DetailPanel sym={sel} mode={mode} data={data} />

        {/* watchlist grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12, marginTop: 16 }}>
          {visible.map((s) => (
            <MiniCard key={s} sym={s} data={data} selected={s === sel} onSelect={(x) => { setSel(x); setOpen(x); }} />
          ))}
        </div>

        <div data-anim dir={rtl ? "rtl" : "ltr"} style={{ background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: "14px 18px", marginTop: 16, fontSize: rtl ? 15 : 13, color: C.muted, lineHeight: rtl ? 1.9 : 1.6, fontFamily: rtl ? "'Amiri', serif" : "inherit", textAlign: rtl ? "right" : "left" }}>
          <span style={{ color: C.text, fontWeight: 600 }}>{T.howToTitle[lang]}</span> {T.howToBody[lang]}
        </div>

        <div data-anim style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 14, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.faint }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span data-anim style={{ width: 7, height: 7, borderRadius: "50%", background: C.long, animation: "mdh-pulse 2.2s infinite" }} />
            Live from Supabase · {present.length} markets · free CFTC data
          </span>
          <span style={{ color: C.muted, fontFamily: rtl ? "'Amiri', serif" : "ui-monospace, monospace" }}>{T.footerNote[lang]}</span>
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
    setTimeout(() => { setEntered(true); window.scrollTo(0, 0); }, 700);
  };

  if (entered) return <Dashboard lang={lang} setLang={setLang} />;
  return <Landing onEnter={enter} leaving={leaving} lang={lang} setLang={setLang} />;
}
