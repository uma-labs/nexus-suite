# NEXUS Radar v2 · Entry/Exit + Scan

TradingView **Pine Script v5** overlay implementing Stock Analyser’s NEXUS Radar v2 design: four entry families (no RSI/MACD as primary entry), hard liquidity/session filters, ATR exits, dashboard, screener columns, and alerts.

**Script:** [`NexusRadar_v2.pine`](./NexusRadar_v2.pine)

---

## Install

1. Open [TradingView](https://www.tradingview.com/) → any chart
2. Set chart timeframe to **1H** (recommended; required for ORB family B)
3. Bottom panel → **Pine Editor** → **Open** → **New blank indicator**
4. Delete the stub, paste the full contents of `NexusRadar_v2.pine`
5. **Save** → **Add to chart**

## Recommended chart

- **1H** chart on liquid US equities
- HTF bias via `request.security(..., "240", ..., lookahead_off)` (4H)
- Session times use the **symbol exchange timezone** (US listings ≈ America/New_York)

## Dollar filter: Active vs A-tier

| Tier | Setting | Default floor | When to use |
|------|---------|---------------|-------------|
| **Active** | `Dollar-volume tier = Active` | SMA(close×volume, 20) ≥ **$50M** | More setups / liquid names |
| **A-tier** | `Dollar-volume tier = A-tier` | SMA(close×volume, 20) ≥ **$100M** | Mega-liquid / stricter screener |

Both tiers still require RVOL gates, ATR% in **1.5–8**, and RTH **0930–1555** (exchange clock).

## Signal families

| Tag | Name | Idea |
|-----|------|------|
| **A** | HTF pullback | 4H long_bias if close>EMA50 and EMA20>EMA50 (short flip / else flat). On 1H: pullback into EMA21±0.15ATR or VWAP±0.25ATR; trigger close back through EMA21 after ≥1 bar touch with directional close |
| **B** | ORB | First **2×1H** bars after 0930 define OR high/low; after **1130** only: close beyond OR + VWAP side; invalidate if close back inside by >0.5ATR. **Gated to 1H charts** |
| **C** | VWAP reclaim | ≥2 closes below VWAP then cross up with vol≥1.2×SMA(vol,20); skip if \|close−VWAP\|/ATR>1.5; **flat HTF bias OK**, counter-trend blocked |
| **D** | Compression→expansion | BB width(20,2) at 20-bar low **or** ATR%/close in lowest 20% of 20 bars → close outside BB + RVOL≥1.5; must match HTF bias |

Hard filters for **A/B/D** require HTF bias match. **C** allows flat. Book soft flag (`SPCX, RKLB, ASTS, NVDA, MU, META, AMD, TSLA`) boosts score / dashboard only — not a hard gate.

## Exits

- **Stop (long):** tighter of `(signal low − 0.25ATR)` vs `(entry − 1.0ATR)` → `max` (closer to price)
- **Stop (short):** mirror with `min`
- **TP1** 1.5ATR; then **trail** remainder on EMA21 close-through
- **Time stop** after 6 bars; **bias-flip** exit

## Screener columns

`Scan Pass`, `Long Setup`, `Short Setup`, `Signal A/B/C/D`, `Score`, `RVOL`, `ATR%`, `Book Flag`

Filter **Scan Pass = 1**, sort by **Score** or **RVOL**.

## Alerts

Add alert → **NEXUS Radar v2** → family A/B/C/D long/short, Exit Long/Short, or Scan Pass. Prefer **Once Per Bar Close** when “Require bar close” is on (default).

## Approximations (Pine constraints)

1. **Timezone:** RTH/ORB use `time()` / `hour` / `minute` in **exchange tz** (`syminfo.timezone`), not a hard-coded `America/New_York` API. US equities match NY; adjust session inputs for other venues.
2. **ORB:** Exact 2-bar OR logic is enabled only when `timeframe.period == "60"`. On other TFs family B does not fire (dashboard: `gate 1H`).
3. **Pullback (A):** Stateful zone-touch flag; reclaim requires touch true on the **prior** bar, then directional close through EMA21.
4. **Book flag:** Ticker string match only (not live options book/flow).

## Disclaimer

Signals only — **not financial advice**. For education/research. Past patterns do not guarantee future results. You are solely responsible for risk, sizing, and compliance.
