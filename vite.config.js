import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fetchOhlc } from './api/_yahoo.js'

// Dev-only middleware that mirrors the Vercel /api/ohlc serverless function,
// so the price-analytics layer works under `vite dev` too.
function ohlcDevApi() {
  return {
    name: 'ohlc-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ohlc', async (req, res) => {
        try {
          const u = new URL(req.url, 'http://localhost')
          const sym = u.searchParams.get('sym') || 'GC'
          const range = u.searchParams.get('range') || '2y'
          const interval = u.searchParams.get('interval') || '1d'
          const data = await fetchOhlc(sym, range, interval)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: String(e?.message || e) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ohlcDevApi()],
})
