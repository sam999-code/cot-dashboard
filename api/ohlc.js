/* Vercel serverless function: GET /api/ohlc?sym=GC&range=2y&interval=1d
   Proxies Yahoo Finance daily OHLCV (free, verified source) so the browser
   can read it without CORS issues. Cached at the edge for an hour. */
import { fetchOhlc } from "./_yahoo.js";

export default async function handler(req, res) {
  try {
    const { sym = "GC", range = "2y", interval = "1d" } = req.query || {};
    const data = await fetchOhlc(sym, range, interval);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: String(e && e.message ? e.message : e) });
  }
}
