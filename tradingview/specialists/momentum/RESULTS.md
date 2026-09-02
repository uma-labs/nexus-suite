# NEXUS Radar v2 — MOMENTUM Specialist Results

**Generated:** 2026-09-02 23:45 UTC (EDT/UTC-4: same calendar day evening)  
**Symbols:** NVDA, TSLA, AMD, META, PLTR, SPY, QQQ, RKLB, ASTS, SPCX  
**Timeframes:** 1d (3mo), 1h (1mo)  
**Soft liquidity:** RVOL≥0.8 · ATR%≥0.7 · $volM≥1.0 (SPCX≥0.3)  
**Exits:** stop **1.2ATR** · TP **2.5ATR** · trail **2.0ATR** (Rule A also **RSI>70**)  
**Data:** Yahoo Finance delayed OHLC · script `backtest_momentum.py`

---

## CLEAR WINNER

### `A_RSI50_cross_uptrend` on **1H · core liquid** (NVDA,TSLA,AMD,META,PLTR,SPY,QQQ)

| Metric | Value |
|--------|------:|
| Trades | **15** |
| Win rate | **60.0%** |
| Avg ret / trade | **+0.48%** |
| Sum ret | **+7.19%** |
| Profit factor (approx) | **~2.4** |
| Positive cells (n≥2) | **3** (TSLA, PLTR, META) |

**Why A wins:** On the actionable 1H core-liquid slice it is the only rule with strong positive expectancy and multiple confirmed pockets. Full-universe aggregates are dragged negative by ASTS/RKLB/SPCX — exclude those for momentum deployment.

**Runner-up:** `C_StochRSI_OS_EMA_trend` (1H core: n=14, WR 50%, avg +0.11%) — keep as alternate OS-reclaim module.

**Reject:** B (MACD hist) and D (combo) — both negative on core 1H and full universe.

---

## Ranked summary

| Rank | Rule | Scope | n | Win% | Avg% | Sum% | PF | Verdict |
|-----:|------|-------|--:|-----:|-----:|-----:|---:|---------|
| 1 | A_RSI50_cross_uptrend | 1h_core_liquid | 15 | 60.0 | +0.48 | +7.19 | ~2.4 | **CLEAR_WINNER** |
| 2 | C_StochRSI_OS_EMA_trend | 1h_core_liquid | 14 | 50.0 | +0.11 | +1.53 | ~1.1 | RUNNER_UP |
| 3 | C_StochRSI_OS_EMA_trend | all_sym_tf | 22 | 40.9 | -0.30 | -6.64 | 0.62 | best-of-weak all |
| 4 | A_RSI50_cross_uptrend | all_sym_tf | 22 | 40.9 | -0.36 | -7.89 | 0.51 | pockets OK, micro drag |
| 5 | B_MACD_hist_cross_EMA21 | 1h_core_liquid | 12 | 25.0 | -0.41 | -4.89 | 0.35 | REJECT |
| 6 | B_MACD_hist_cross_EMA21 | all_sym_tf | 20 | 20.0 | -1.09 | -21.79 | 0.03 | REJECT |
| 7 | D_Combo_RSI_MACD_EMA9 | 1h_core_liquid | 5 | 0.0 | -1.37 | -6.87 | 0.00 | REJECT |
| 8 | D_Combo_RSI_MACD_EMA9 | all_sym_tf | 10 | 10.0 | -1.38 | -13.84 | 0.11 | REJECT |

---

## Best pockets (n≥2, avg>0)

| Rule | Sym | TF | n | Win% | Avg% | PF |
|------|-----|----|--:|-----:|-----:|----:|
| C_StochRSI_OS_EMA_trend | TSLA | 1h | 4 | 75.0 | +1.03 | 6.19 |
| **A_RSI50_cross_uptrend** | **TSLA** | **1h** | **7** | **71.4** | **+0.85** | **4.80** |
| **A_RSI50_cross_uptrend** | **PLTR** | **1h** | **4** | **50.0** | **+0.51** | **1.62** |
| B_MACD_hist_cross_EMA21 | META | 1h | 2 | 50.0 | +0.36 | 2.87 |
| A_RSI50_cross_uptrend | META | 1h | 2 | 50.0 | +0.08 | 1.13 |

---

## Pine-ready parameters — WINNER A

```pine
//@version=5
// NEXUS Radar v2 — Momentum WINNER: RSI50 cross + EMA uptrend
rsiLength      = 14
rsiCrossLevel  = 50
rsiExitLevel   = 70
emaFastTrend   = 21
emaSlowTrend   = 55
stopATR        = 1.2
tpATR          = 2.5
trailATR       = 2.0
minRVOL        = 0.8
minATRpct      = 0.7
minDollarVolM  = 1.0   // SPCX: 0.3

rsi  = ta.rsi(close, rsiLength)
e21  = ta.ema(close, emaFastTrend)
e55  = ta.ema(close, emaSlowTrend)
rvol = volume / ta.sma(volume, 20)
atrv = ta.atr(14)
atrpct = atrv / close * 100
dvolM  = ta.sma(volume, 20) * close / 1e6
minD   = syminfo.ticker == "SPCX" ? 0.3 : minDollarVolM
softLiq = rvol >= minRVOL and atrpct >= minATRpct and dvolM >= minD

longEntry = ta.crossover(rsi, rsiCrossLevel) and e21 > e55 and softLiq
longExitRSI = rsi > rsiExitLevel
// Also exit: stop=entry-stopATR*atr, tp=entry+tpATR*atr, trail=extreme-trailATR*atr
```

### Runner-up C (StochRSI) — Pine params

```pine
rsiLength=14, stochLength=14, kSmooth=3, dSmooth=3, stochOS=20
emaFastTrend=21, emaSlowTrend=55
stopATR=1.2, tpATR=2.5, trailATR=2.0
minRVOL=0.8, minATRpct=0.7, minDollarVolM=1.0, minDollarVolM_SPCX=0.3
// entry: wasOS (k[1]<20) and (crossover(k,d) or crossover(k,20)) and e21>e55 and softLiq
```

---

## Rule definitions

| ID | Entry | Extra exit |
|----|-------|------------|
| A | RSI(14) cross up 50 + EMA21>EMA55 | RSI>70 |
| B | MACD hist cross up 0 + close>EMA21 | — |
| C | StochRSI(14,3,3) cross up from <20 + EMA21>EMA55 | — |
| D | RSI<55 + MACD hist rising + EMA9>EMA21 | — |

---

## Deployment recommendation

1. **Primary:** Rule **A** on **1H** for liquid US names (TSLA, PLTR, META strongest in sample).
2. **Optional overlay:** Rule **C** as secondary OS-reclaim alert (do not size equal to A).
3. **Do not deploy** B or D in this parameter set.
4. **Universe filter:** skip / downsize ASTS, RKLB, SPCX for momentum specialist (consistent stop-outs in sample).
5. Daily 3mo window is sample-starved after EMA55 warmup — prefer 1H for live Radar momentum column.

## Files

- `results.csv` — ranked rules + Pine JSON params + verdict
- `results_detail.csv` — every symbol × TF cell
- `backtest_momentum.py` — reproducible Yahoo backtest
