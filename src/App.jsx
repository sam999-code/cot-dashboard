import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ============================================================================
   COT POSITIONING DASHBOARD  —  LIVE
   Real CFTC "smart money" positioning, read live from Supabase on load.
     GC  -> Gold (COMEX)      -> Managed Money
     NQ  -> Nasdaq-100 (CME)  -> Leveraged Funds
   Data source: public.cot_positioning  (read-only via RLS public policy)
   ========================================================================== */

/* --- Supabase connection ---------------------------------------------------
   These two values are SAFE to ship in browser code:
   the anon key only grants what Row Level Security allows (here: SELECT only).
   -------------------------------------------------------------------------- */
const SUPABASE_URL = "https://aankstpoibuqptqolpum.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbmtzdHBvaWJ1cXB0cW9scHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODYzNTAsImV4cCI6MjA5Nzg2MjM1MH0.xiEfxggpzZHwIjlIsQiavUNmZWSwQpdI377wWMJA0Cs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const META = {
  GC: { name: "Gold", venue: "COMEX", cohort: "Managed Money", cfd: "XAUUSD" },
  NQ: { name: "Nasdaq-100", venue: "CME", cohort: "Leveraged Funds", cfd: "NAS100" },
};

const C = {
  bg: "#0b0f17", panel: "#121925", panel2: "#0e1521", border: "#222d3e",
  borderSoft: "#1a2433", text: "#d6deea", muted: "#6b7889", faint: "#46505f",
  long: "#26a69a", longSoft: "rgba(38,166,154,0.14)",
  short: "#ef5350", shortSoft: "rgba(239,83,80,0.14)",
  amber: "#e0a526",
};

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

function compute(sym, all) {
  const rows = all.filter((r) => r.sym === sym).sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const nets = rows.map((r) => r.net);
  const min = Math.min(...nets), max = Math.max(...nets);
  const pos = (last.net - min) / (max - min); // 0..1 within full range
  const zeroPos = (0 - min) / (max - min);
  const change1w = last.net - prev.net;
  const isLong = last.net > 0;
  // is the crowd stretched? high in its own range -> stretched long; low -> stretched short
  let read;
  if (pos >= 0.85) read = { tag: "Crowded long", tone: "warn", note: "near the top of its 18-month range — historically stretched" };
  else if (pos <= 0.15) read = { tag: "Crowded short", tone: "warn", note: "near the bottom of its 18-month range — historically stretched" };
  else read = { tag: "Mid-range", tone: "neutral", note: "positioning sits in the middle of its 18-month range" };
  return { rows, last, prev, min, max, pos, zeroPos, change1w, isLong, read };
}

function Gauge({ s }) {
  const pct = (s.pos * 100).toFixed(0);
  const zeroPct = Math.max(0, Math.min(100, s.zeroPos * 100));
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, fontFamily: "ui-monospace, monospace", marginBottom: 6 }}>
        <span>18-mo low {fmt(s.min)}</span>
        <span>high {fmt(s.max)}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 6, background: `linear-gradient(90deg, ${C.shortSoft}, #1a2230 ${zeroPct}%, ${C.longSoft})`, border: `1px solid ${C.borderSoft}` }}>
        {/* zero line (long/short divide) if it falls inside the range */}
        {s.zeroPos > 0.02 && s.zeroPos < 0.98 && (
          <div style={{ position: "absolute", left: `${zeroPct}%`, top: -3, bottom: -3, width: 1, background: C.faint }} title="net flat (long = short)" />
        )}
        {/* current marker */}
        <div style={{ position: "absolute", left: `calc(${(s.pos * 100).toFixed(1)}% - 6px)`, top: -3, width: 12, height: 12, borderRadius: "50%", background: s.isLong ? C.long : C.short, boxShadow: `0 0 0 3px ${C.bg}, 0 0 10px ${s.isLong ? C.long : C.short}`, transition: "left .6s cubic-bezier(.2,.8,.2,1)" }} />
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
      ) : (
        <div style={{ color: d.pctLong >= 50 ? C.long : C.short }}>{d.pctLong}% long</div>
      )}
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
          <Area type="monotone" dataKey={key} stroke={s.isLong ? C.long : C.short} strokeWidth={2} fill={`url(#${gid})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Panel({ sym, mode, data }) {
  const s = compute(sym, data);
  const m = META[sym];
  const accent = s.isLong ? C.long : C.short;
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, flex: "1 1 340px", minWidth: 300 }}>
      {/* header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: C.text }}>{m.name}</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>{sym} · {m.venue}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.cohort} · trades as {m.cfd}</div>
        </div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 700, color: accent, background: s.isLong ? C.longSoft : C.shortSoft, border: `1px solid ${accent}`, borderRadius: 6, padding: "3px 9px", whiteSpace: "nowrap" }}>
          {s.isLong ? "NET LONG" : "NET SHORT"}
        </span>
      </div>

      {/* big figures */}
      <div style={{ display: "flex", gap: 22, marginTop: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>Net position</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1.2 }}>{fmtSigned(s.last.net)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>% Long</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{s.last.pctLong}%</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>1-wk change</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: s.change1w >= 0 ? C.long : C.short, lineHeight: 1.2 }}>{fmtSigned(s.change1w)}</div>
        </div>
      </div>

      <Gauge s={s} />
      <HistoryChart s={s} mode={mode} />
    </div>
  );
}

/* full-screen centered message (loading / error), on-theme */
function Center({ children, sub }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text, gap: 8 }}>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: 2, color: C.amber, textTransform: "uppercase" }}>Market Data Hub</div>
      <div style={{ fontSize: 15, color: C.text }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
}

export default function CotDashboard() {
  const [mode, setMode] = useState("net");
  const [data, setData] = useState(null);   // null = still loading
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: rows, error } = await supabase
        .from("cot_positioning")
        .select("date, sym, long, short, net, pct_long, oi")
        .order("date", { ascending: true });
      if (!alive) return;
      if (error) { setErr(error.message); return; }
      setData(
        rows.map((r) => ({
          date: r.date,
          sym: r.sym,
          long: r.long,
          short: r.short,
          net: r.net,
          pctLong: Number(r.pct_long),
          oi: r.oi,
        }))
      );
    })();
    return () => { alive = false; };
  }, []);

  const latestDate = useMemo(
    () => (data && data.length ? data.reduce((a, r) => (r.date > a ? r.date : a), "0") : null),
    [data]
  );

  if (err) {
    return (
      <Center sub="Check that the Supabase table exists and the public read policy is enabled, then refresh.">
        Couldn’t load data — {err}
      </Center>
    );
  }
  if (!data) return <Center>Loading positioning data…</Center>;
  if (!data.length) return <Center>No data found in the table yet.</Center>;

  const Tab = ({ id, label }) => (
    <button onClick={() => setMode(id)} style={{
      fontFamily: "ui-monospace, monospace", fontSize: 12, cursor: "pointer",
      padding: "5px 12px", borderRadius: 7, border: `1px solid ${mode === id ? C.border : "transparent"}`,
      background: mode === id ? C.panel : "transparent", color: mode === id ? C.text : C.muted,
    }}>{label}</button>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "26px 20px", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: 2, color: C.amber, textTransform: "uppercase" }}>Market Data Hub</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0" }}>Smart-Money Positioning</h1>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Where the big speculators sit — and whether that's at an extreme.
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>
            <div>CFTC · weekly</div>
            <div style={{ color: C.muted }}>latest {niceDate(latestDate)}</div>
          </div>
        </div>

        {/* view toggle */}
        <div style={{ display: "flex", gap: 4, margin: "16px 0 14px", padding: 4, background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 10, width: "fit-content" }}>
          <Tab id="net" label="Net position" />
          <Tab id="pct" label="% Long" />
        </div>

        {/* panels */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Panel sym="GC" mode={mode} data={data} />
          <Panel sym="NQ" mode={mode} data={data} />
        </div>

        {/* how to read */}
        <div style={{ background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: "14px 18px", marginTop: 16, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>How to read it.</span> The marker shows where this week's net position sits inside its 18-month range.
          Near the <span style={{ color: C.amber }}>top or bottom</span> = the crowd is heavily one-sided, which historically precedes mean-reversion more often than continuation.
          This is <span style={{ color: C.text }}>slow context</span> (weekly, lagged) — a bias filter, never an entry trigger.
        </div>

        {/* footer / honesty */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 14, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.faint }}>
          <span>Live from Supabase · {data.length} weekly reports · free CFTC data</span>
          <span style={{ color: C.muted }}>Discipline filter, not trade signals</span>
        </div>
      </div>
    </div>
  );
}
