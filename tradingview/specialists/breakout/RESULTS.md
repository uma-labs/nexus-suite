# NEXUS Radar v2 — BREAKOUT / VOLATILITY Results

**Generated:** 2026-09-02 ~7:45 PM ET (Yahoo delayed)  
**Symbols:** NVDA, TSLA, AMD, META, PLTR, SPY, QQQ, RKLB, ASTS, SPCX  
**TF:** 1d (2y, ~502 bars) / 1h (6mo, ~897 bars)  
**Filter:** soft liquidity — rvol≥0.7, ATR%≥0.5, avg $vol≥$1M  
**Exits grid:** TP 2.0 / 2.5 / 3.0 ATR · trail 1.5–2.5 ATR · stop setup-specific or 1.5 ATR  
**Artifacts:** `results.csv` (627 rows) · `PINE_RULES.md` · `backtest.py`

## Ranked setups (aggregate, all symbols)

| Rank | Setup | N trades | Win% | Avg% | PF | Focus N | Focus Win% | Focus Avg% | Verdict |
|-----:|-------|---------:|-----:|-----:|---:|--------:|-----------:|-----------:|---------|
| **1** | **A) Donchian20** | 3795 | 39.2 | **+0.25** | 1.17 | 1273 | 39.5 | **+0.23** | **WINNER** |
| 2 | D) Keltner | 4627 | 36.4 | −0.21 | 0.93 | 1611 | 35.9 | −0.44 | Satellite only |
| 3 | C) NR7 / Inside | 3689 | 34.3 | −0.26 | 1.05 | 1309 | 34.4 | −0.81 | Weak / TSLA-1h niche |
| 4 | B) ATR/BB Squeeze | 1940 | 35.5 | −0.53 | 1.00 | 661 | 35.1 | −0.77 | Avoid as default |

Focus = RKLB + ASTS + TSLA.

## Focus TF split (what actually works for volatile names)

| Setup × TF | Focus N | Focus Win% | Focus Avg% | Note |
|------------|--------:|-----------:|-----------:|------|
| **A_Donchian × 1d** | **576** | **45.1** | **+0.75** | **Clear primary** |
| C_NR7 × 1h | 787 | 36.8 | −0.20 | Near flat; TSLA pocket only |
| A_Donchian × 1h | 697 | 34.9 | −0.20 | Flat–slight drag |
| D_Keltner × 1h | 1114 | 35.0 | −0.35 | Too many false breaks |
| D_Keltner × 1d | 497 | 38.0 | −0.65 | Neg overall; RKLB/TSLA k=2.5 exception |
| B_Squeeze × 1h/1d | 661 | ~33 | −0.6 to −1.2 | Sparse + negative |

**Takeaway for RKLB / ASTS / TSLA:** trade **Donchian 20 high break + close>EMA21 on daily**, stop at Donchian mid (or 1.5 ATR), TP 2.5–3.0 ATR with 2.0 ATR trail.

## Best pockets — RKLB / ASTS / TSLA

| Sym | TF | Setup | Variant | N | Win% | Avg% | PF |
|-----|----|-------|---------|--:|-----:|-----:|---:|
| RKLB | 1d | D_Keltner | `k=2.5\|TP3.0_trail2.0` | 14 | 42.9 | +3.89 | 2.50 |
| ASTS | 1d | B_Squeeze | `sq<=25\|exp>=1.1\|TP3.0` | 5 | 60.0 | +3.35 | 1.67 |
| TSLA | 1d | D_Keltner | `k=2.5\|TP2.0_trail2.0` | 12 | 50.0 | +2.84 | 2.31 |
| **TSLA** | **1d** | **A_Donchian** | **`stop=donch_mid\|TP2.5_trail2.0`** | **14** | **57.1** | **+2.78** | **2.13** |
| RKLB | 1d | A_Donchian | `stop=atr1.5\|TP3.0_trail2.5` | 22 | 40.9 | +2.72 | 1.57 |
| ASTS | 1d | A_Donchian | `stop=donch_mid\|TP3.0_trail2.5` | 16 | 43.8 | +2.60 | 1.38 |
| RKLB | 1d | A_Donchian | `stop=donch_mid\|TP2.0_trail2.0` | 25 | 48.0 | +1.98 | 1.50 |
| TSLA | 1h | C_NR7 | `TP2.5_trail1.5` | 57 | 50.9 | +0.18 | 1.41 |

Donchian mid-stop on **TSLA/RKLB/ASTS 1d** is the robust cluster (n=14–25, avg +1.2 to +2.8%).  
Keltner k=2.5 1d is a **high-vol satellite** (great on RKLB/TSLA, poor when pooled).  
ASTS squeeze n=5 is anecdotal — do not promote alone.

## Setup notes

### A) Donchian 20 high break + close > EMA21 — PRIMARY
- Only setup with **positive focus expectancy** in aggregate.
- Best TF: **1d**. Soft liq keeps RKLB/ASTS alive.
- Prefer **stop = Donchian mid**; 1.5 ATR stop also works (slightly more trades).
- Exit: **TP 2.5–3.0 ATR**, trail **2.0 ATR**.
- Also healthy on AMD/PLTR 1d; NVDA 1d mixed in this window.

### D) Keltner close > EMA20 ± k·ATR — SATELLITE
- Aggregate negative on focus; **k=2.5 on RKLB/TSLA 1d** is the exception (wider channel = fewer fakeouts).
- Prefer as confirmation overlay with Donchian, not standalone default.
- k=1.5 floods signals and bleeds on 1h.

### C) NR7 / inside-bar break — NICHE
- Focus drag on 1d (−1.74%).  
- **TSLA 1h** only mild positive (~+0.15–0.20%, n≈50–57, wr~45–51%). Use sparingly.

### B) BB-width squeeze → expansion — AVOID DEFAULT
- Lowest focus expectancy. Occasional SPY/QQQ/ASTS toys (n≤8) — fragile.
- Keep for research / confluence flag, not entry engine.

## Fragile leaderboard noise (ignore for production)
- SPCX 1h Keltner k=1.5 wr~79% n=14 — thin ETF, not transferable.
- SPY/QQQ squeeze wr 75–100% n=4 — lottery sample.

## Pine-ready winners (see `PINE_RULES.md`)

1. **PRIMARY — A_Donchian20 @ 1d** — `stop=donch_mid | TP2.5 | trail2.0`  
   Focus cluster: TSLA/RKLB/ASTS daily.
2. **SATELLITE — D_Keltner k=2.5 @ 1d** — RKLB/TSLA only; TP 2.5–3.0.  
3. **NICHE — C_NR7 @ TSLA 1h** — TP2.5 trail1.5 (small edge, larger n).

## Coverage / caveats
- Soft $1M floor intentional for RKLB/ASTS/SPCX; SPCX 1d skipped (57 bars).
- Not walk-forward OOS; 1h≈6mo, 1d≈2y.
- Intrabar stop/TP path approximated (close-entry, stop vs TP priority = stop-first if both).
- Past patterns ≠ future results. Signals only — not financial advice.
