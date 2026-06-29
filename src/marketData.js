/* Price-derived analytics for an asset — descriptive RISK & MOVEMENT context only.
   Built on Salim's validated findings: direction is not predictable, but volatility,
   fat tails, and the movement envelope ARE structured. Nothing here predicts
   direction or attaches a probability/confidence to an outcome. */

const TRADING_DAYS = 252;

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};
const pct = (sortedAsc, p) => {
  if (!sortedAsc.length) return 0;
  const i = (sortedAsc.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (i - lo);
};

function atr(candles, period = 14) {
  if (candles.length < 2) return 0;
  const tr = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    tr.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
  }
  // Wilder's smoothing
  const n = Math.min(period, tr.length);
  let a = mean(tr.slice(0, n));
  for (let i = n; i < tr.length; i++) a = (a * (period - 1) + tr[i]) / period;
  return a;
}

export function computeAnalytics(candles) {
  if (!candles || candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const last = closes[closes.length - 1];

  // log returns
  const rets = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const retsPct = rets.map((r) => r * 100);

  const lastN = (arr, n) => arr.slice(Math.max(0, arr.length - n));
  const annVol = (window) => std(lastN(rets, window)) * Math.sqrt(TRADING_DAYS) * 100;
  const vol30 = annVol(30), vol90 = annVol(90), vol252 = annVol(TRADING_DAYS);
  const volRatio = vol90 ? vol30 / vol90 : 1;
  const volRegime = volRatio > 1.15 ? "elevated" : volRatio < 0.85 ? "compressed" : "normal";

  const dailyVol = std(rets);                 // log
  const a = atr(candles, 14);
  const atrPct = (a / last) * 100;

  // 52-week (≈252d) context
  const win = lastN(candles, TRADING_DAYS);
  const hi = Math.max(...win.map((c) => c.h));
  const lo = Math.min(...win.map((c) => c.l));
  const rangePos = hi > lo ? ((last - lo) / (hi - lo)) * 100 : 50;
  const distHigh = (last / hi - 1) * 100;
  const distLow = (last / lo - 1) * 100;

  // max drawdown over the 52w window
  let peak = -Infinity, maxDD = 0;
  for (const c of win) { peak = Math.max(peak, c.c); maxDD = Math.min(maxDD, c.c / peak - 1); }

  // distribution shape (full sample)
  const m = mean(rets), sd = std(rets) || 1e-9;
  const skew = mean(rets.map((r) => ((r - m) / sd) ** 3));
  const exKurt = mean(rets.map((r) => ((r - m) / sd) ** 4)) - 3;
  // fat tails: |r| > 3σ vs normal expectation (0.27%)
  const tailObs = rets.filter((r) => Math.abs(r) > 3 * sd).length / rets.length;
  const tailRatio = tailObs / 0.0027;

  // movement envelope — daily range as % of close, and in ATR units
  const rangePcts = candles.map((c) => ((c.h - c.l) / c.c) * 100).sort((x, y) => x - y);
  const env = { p50: pct(rangePcts, 0.5), p75: pct(rangePcts, 0.75), p90: pct(rangePcts, 0.9) };
  const envAtr = { p50: (env.p50 / 100 * last) / a, p75: (env.p75 / 100 * last) / a, p90: (env.p90 / 100 * last) / a };

  // descriptive trailing returns (NOT a forecast)
  const chg = (n) => closes.length > n ? (last / closes[closes.length - 1 - n] - 1) * 100 : null;
  const perf = { w1: chg(5), m1: chg(21), m3: chg(63), m6: chg(126), y1: chg(TRADING_DAYS) };

  // moving averages (descriptive position)
  const sma = (n) => closes.length >= n ? mean(lastN(closes, n)) : null;
  const sma50 = sma(50), sma200 = sma(200);

  // histogram of daily returns (for the distribution panel)
  const lo2 = pct(retsPct.slice().sort((x, y) => x - y), 0.01);
  const hi2 = pct(retsPct.slice().sort((x, y) => x - y), 0.99);
  const bins = 21, edge0 = Math.min(lo2, -hi2), edge1 = Math.max(hi2, -lo2);
  const hist = new Array(bins).fill(0);
  for (const r of retsPct) {
    let k = Math.floor(((r - edge0) / (edge1 - edge0)) * bins);
    k = Math.max(0, Math.min(bins - 1, k));
    hist[k]++;
  }

  return {
    last, n: candles.length, asOf: candles[candles.length - 1].t,
    vol30, vol90, vol252, volRegime, volRatio,
    dailyVolPct: dailyVol * 100, atr: a, atrPct,
    hi52: hi, lo52: lo, rangePos, distHigh, distLow, maxDD: maxDD * 100,
    skew, exKurt, tailRatio,
    env, envAtr,
    perf, sma50, sma200,
    hist, histRange: [edge0, edge1],
  };
}

const cache = new Map();
export async function fetchAssetAnalytics(symKey) {
  if (cache.has(symKey)) return cache.get(symKey);
  const p = (async () => {
    const r = await fetch(`/api/ohlc?sym=${encodeURIComponent(symKey)}&range=2y&interval=1d`);
    if (!r.ok) throw new Error(`price feed ${r.status}`);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    const analytics = computeAnalytics(data.candles);
    if (!analytics) throw new Error("not enough price history");
    return { ...data, analytics };
  })();
  cache.set(symKey, p);
  p.catch(() => cache.delete(symKey)); // don't cache failures
  return p;
}
