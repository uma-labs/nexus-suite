# NEXUS suite export (2026-09-02)

## Contents (nexus-suite-*.tar.gz)
- `aether/` — AETHER finance HUD (port 8790)
- `agent-bridge/` — multi-agent ops board (port 8791)
- `nexus-pulse/` — options desk HUD
- `tradingview/` — NEXUS Radar v1 + v2 Pine scripts + research notes

## On Windows
```powershell
cd C:\Users\kd_um\repos
tar -xzf nexus-suite-2026-09-02.tar.gz
```

## Serve locally
```powershell
cd aether; python server.py
# http://127.0.0.1:8790/
cd ..\agent-bridge; python server.py
# http://127.0.0.1:8791/
```

## TradingView
Paste `tradingview/NexusRadar_v2.pine` into Pine Editor on a **1H** chart.

## TradingView Pro (validated)
See `tradingview/pro/NexusRadar_Pro.pine` — Liquid 1H HYBRID / Book 1D EMA reclaim.
Validation notes in `tradingview/pro/RESULTS.md`.
