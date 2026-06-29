/* Shared Yahoo Finance OHLCV fetch — used by both the Vercel serverless function
   (api/ohlc.js) and the Vite dev middleware (vite.config.js).
   Yahoo is a free, verified source but is CORS-restricted and needs a User-Agent,
   so it must be called server-side. Daily bars only — this powers descriptive
   volatility / movement / price-context analytics (never a directional signal). */

// COT instrument key → Yahoo continuous-future (or index) symbol.
export const YAHOO_SYMBOL = {
  GC: "GC=F", SI: "SI=F", HG: "HG=F", PL: "PL=F", PA: "PA=F",
  CL: "CL=F", NG: "NG=F",
  ES: "ES=F", NQ: "NQ=F", YM: "YM=F", RTY: "RTY=F",
  "6E": "6E=F", "6B": "6B=F", "6J": "6J=F", "6A": "6A=F",
  "6C": "6C=F", "6S": "6S=F", "6N": "6N=F",
  BTC: "BTC=F", ETH: "ETH=F", DXY: "DX=F",
};

export async function fetchOhlc(symKey, range = "2y", interval = "1d") {
  const ySym = YAHOO_SYMBOL[symKey] || symKey;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MarketDataHub/1.0)" } });
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  if (!res || !res.timestamp) throw new Error("no data");
  const q = res.indicators.quote[0];
  const candles = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({ t: res.timestamp[i] * 1000, o, h, l, c, v: q.volume?.[i] ?? null });
  }
  return {
    symbol: ySym,
    currency: res.meta?.currency || "USD",
    candles,
  };
}
