# NEXUS Radar v2 — TREND Specialist Results

Generated: 2026-09-02 (America/New_York). Yahoo delayed data.

## Setups tested

| Code | Rule |
|------|------|
| **A** | EMA 9/21/55 stack pullback to EMA21 + reclaim EMA9 |
| **B** | Supertrend-like HL2 ± 3*ATR(10) flip |
| **C** | Price above EMA200 (or EMA55) + pullback to EMA21 |

**Exits (all):** stop = ATR(14)×1.2 · TP = ATR×2.5 · trail = ATR×2 · or opposite signal.

**Liquidity soft filter:** rvol≥0.8, atr%≥0.7, $vol≥1M (SPCX ≥0.3M).

**Symbols:** NVDA, TSLA, AMD, META, PLTR, SPY, QQQ, RKLB, ASTS, SPCX

**Timeframes:** 1d (3mo), 1h (1mo)

## Ranked winners (n≥3 trades)

| Rank | Setup | Symbol | TF | Trades | Win% | AvgRet% | PF | MaxDD% | Score |
|------|-------|--------|----|--------|------|---------|----|--------|-------|
| 1 | B | SPCX | 1h | 4 | 50.0 | 2.203 | 2.58 | 5.5 | 65.8 |
| 2 | B | META | 1h | 3 | 33.3 | 0.456 | 3.19 | 0.6 | 54.9 |
| 3 | A | TSLA | 1h | 6 | 50.0 | 0.519 | 1.80 | 2.8 | 45.1 |
| 4 | C | PLTR | 1h | 6 | 50.0 | 0.293 | 1.41 | 2.5 | 38.8 |
| 5 | C | TSLA | 1h | 11 | 27.3 | -0.015 | 0.98 | 6.2 | 24.2 |
| 6 | A | META | 1h | 3 | 33.3 | -0.039 | 0.92 | 1.5 | 23.3 |
| 7 | C | META | 1h | 9 | 33.3 | -0.386 | 0.42 | 5.5 | 15.9 |
| 8 | A | PLTR | 1h | 3 | 33.3 | -0.684 | 0.15 | 2.4 | 8.5 |
| 9 | B | NVDA | 1h | 4 | 25.0 | -0.522 | 0.11 | 2.3 | 6.9 |
| 10 | B | AMD | 1h | 4 | 25.0 | -0.925 | 0.15 | 3.7 | 3.7 |
| 11 | B | PLTR | 1h | 5 | 20.0 | -0.862 | 0.03 | 4.3 | 1.2 |
| 12 | C | ASTS | 1h | 10 | 30.0 | -1.405 | 0.16 | 13.3 | 0.8 |
| 13 | C | AMD | 1h | 12 | 8.3 | -0.821 | 0.24 | 12.2 | 0.3 |
| 14 | C | NVDA | 1h | 7 | 14.3 | -0.899 | 0.08 | 6.1 | -0.2 |
| 15 | B | ASTS | 1h | 4 | 25.0 | -1.367 | 0.08 | 5.8 | -1.6 |
| 16 | C | SPCX | 1h | 8 | 25.0 | -1.396 | 0.02 | 10.8 | -2.5 |
| 17 | B | TSLA | 1h | 3 | 0.0 | -0.869 | 0.00 | 2.6 | -6.5 |
| 18 | A | AMD | 1h | 3 | 0.0 | -0.952 | 0.00 | 2.8 | -7.2 |
| 19 | A | RKLB | 1h | 4 | 0.0 | -2.195 | 0.00 | 8.5 | -19.0 |
| 20 | C | RKLB | 1h | 8 | 0.0 | -2.150 | 0.00 | 16.0 | -19.6 |
| 21 | B | NVDA | 1d | 4 | 0.0 | -3.261 | 0.00 | 12.4 | -29.1 |
| 22 | B | ASTS | 1d | 3 | 0.0 | -11.296 | 0.00 | 30.4 | -101.0 |

**Positive expectancy only (n≥3, avg_ret>0):** B/SPCX 1h, B/META 1h, A/TSLA 1h, C/PLTR 1h.

## Setup × TF aggregates (among n≥3)

| Setup | TF | #Symbols | TotTrades | AvgWR% | AvgRet% | AvgPF | AvgDD% | Composite |
|-------|----|----------|-----------|--------|---------|-------|--------|-----------|
| B | 1h | 7 | 27 | 25.5 | -0.269 | 0.88 | 3.5 | 41.6 |
| C | 1h | 8 | 71 | 23.5 | -0.847 | 0.41 | 9.1 | 35.5 |
| A | 1h | 5 | 19 | 23.3 | -0.670 | 0.57 | 3.6 | 25.5 |
| B | 1d | 2 | 7 | 0.0 | -7.278 | 0.00 | 21.4 | -72.2 |

Daily TF produced almost no usable winners (1d n≥3 only on B and all lost). Prefer **1h**.

## Recommended Pine rules to merge (best 1–2)

Selection criterion: positive-expectancy pockets with n≥3, clean parameters, and merge-ready Pine — **not** raw breadth (Setup C has more trades but negative aggregate expectancy).

### #1 — Setup **A** on **1h** (EMA stack pullback + reclaim)

Best clean trend-pullback: **TSLA 1h** n=6, WR=50%, avg=+0.52%, PF≈1.80, maxDD≈2.8%. Also appears on META/PLTR (weaker).

**Exact parameters:** EMA(9/21/55) stack · pullback touch EMA21 within 0.5×ATR(14) · reclaim EMA9 · soft liq rvol≥0.8 / atr%≥0.7 / $vol≥1M · exit stop ATR×1.2 / TP ATR×2.5 / trail ATR×2 / opposite signal.

```pine
// TREND A — EMA 9/21/55 stack + pullback EMA21 + reclaim EMA9  | TF: 1h
ema9  = ta.ema(close, 9)
ema21 = ta.ema(close, 21)
ema55 = ta.ema(close, 55)
atr14 = ta.atr(14)
volSma = ta.sma(volume, 20)
rvol = volume / volSma
atrpct = atr14 / close * 100
dollarVol = volSma * close
liqOK = rvol >= 0.8 and atrpct >= 0.7 and dollarVol >= 1e6  // SPCX: use 3e5
stackUp = ema9 > ema21 and ema21 > ema55
stackDn = ema9 < ema21 and ema21 < ema55
pullL = low <= ema21 + atr14 * 0.5 and close >= ema55
pullS = high >= ema21 - atr14 * 0.5 and close <= ema55
reclaim = close[1] < ema9[1] and close > ema9
reject  = close[1] > ema9[1] and close < ema9
trendLong  = stackUp and pullL and reclaim and liqOK
trendShort = stackDn and pullS and reject and liqOK
// Exit: stop = atr14*1.2, tp = atr14*2.5, trail = atr14*2, or opposite signal
```

### #2 — Setup **B** on **1h** (Supertrend HL2 ± 3×ATR(10) flip)

Best PF pockets: **SPCX 1h** n=4 WR=50% avg=+2.20% PF≈2.58; **META 1h** n=3 WR=33% avg=+0.46% PF≈3.19. Broader coverage but many names negative — gate to liquid momentum names or require PF filter in live.

**Exact parameters:** Supertrend factor=3.0, ATR length=10 (HL2 ± 3×ATR(10)) · enter on direction flip · same soft liq · same ATR(14) exits 1.2 / 2.5 / trail 2.

```pine
// TREND B — Supertrend-like HL2 ± 3*ATR(10) flip  | TF: 1h
atr10 = ta.atr(10)
atr14 = ta.atr(14)
[stLine, stDir] = ta.supertrend(3.0, 10)  // factor=3, atrPeriod=10
volSma = ta.sma(volume, 20)
rvol = volume / volSma
atrpct = atr14 / close * 100
dollarVol = volSma * close
liqOK = rvol >= 0.8 and atrpct >= 0.7 and dollarVol >= 1e6  // SPCX: 3e5
// TradingView stDir: -1 = bullish trend, +1 = bearish
bullFlip = ta.change(stDir) != 0 and stDir == -1
bearFlip = ta.change(stDir) != 0 and stDir == 1
trendLong  = bullFlip and liqOK
trendShort = bearFlip and liqOK
// Exit: stop = atr14*1.2, tp = atr14*2.5, trail = atr14*2, or opposite flip
```

### Not recommended for merge

- **Setup C @ 1h:** only PLTR positive (n=6, +0.29%); aggregate avg_ret −0.85%, PF≈0.41 — too noisy for Pine merge.
- **All 1d (3mo):** insufficient positive n≥3 sample; do not enable daily trend module from this window.

## Notes

- Sample windows are short (3mo daily / 1mo hourly); PF/DD are approximate.
- Winners require n≥3; merge only Setup **A** and **B** Pine blocks above into NexusRadar (1h Active).
- Preview chart: `preview_best_B_SPCX_1h.png` (best single combo).
