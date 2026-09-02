# NEXUS Pulse

Futuristic live options trading HUD for Umapathy — single static HTML app + optional Yahoo Finance proxy. **No API keys.** Quotes are never fabricated; failed symbols show `—` and an error chip.

## Quick start

```bash
cd /workspace/nexus-pulse   # or your local copy
python server.py
```

Open **http://127.0.0.1:8788/**

Port defaults to **8788** (avoids Optima / nexus-desk on 8787). Override with:

```bash
PORT=8790 python server.py
```

## What you get

- Dark glass HUD · emerald / cyan / amber accents
- America/New_York session clock + US cash open/closed heuristic
- Hero swipe strip of top movers (smart cards + sparklines)
- Featured ideas: NVDA, SPY, QQQ, TSLA, META, MU, CRM, CRWD
- Holdings with **MINE** badge: SPCX, RKLB, ASTS, RVI
- Live scan ranked by abs % move (volume tie-break)
- Feed status: **LIVE** / **DELAYED** / **STALE** / **ERROR**
- Risk strip (display only): idea risk ≤ $300 · time stop 15:45 ET
- Auto-refresh ~15s

## Endpoints (server.py)

| Path | Purpose |
|------|---------|
| `/` or `/index.html` | Static Pulse UI |
| `/proxy/yahoo?symbols=NVDA,SPY,...` | Batch Yahoo chart → JSON quotes + spark closes |
| `/api/quotes?symbols=...` | Alias of the proxy |

Yahoo upstream used by the proxy:

- `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1m&range=1d&includePrePost=true`

The browser prefers same-origin `/proxy/yahoo`. If the companion server is absent (e.g. static host only), `index.html` falls back to direct Yahoo fetch, then a public CORS relay — still never invents prices.

## Mount under nexus-desk (`/pulse/`)

Serve this folder as `/pulse/` on an existing desk (e.g. 8787). The UI resolves relative/`/pulse/proxy/yahoo` paths so it keeps working when reverse-proxied. You can also point desk traffic at this `server.py` on 8788.

## Files

- `index.html` — full UI (styles + JS inline)
- `server.py` — `ThreadingHTTPServer` static + Yahoo proxy
- `README.md` — this file

Not investment advice. Confirm marks on your broker before any order.
