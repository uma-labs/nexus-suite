# OPTIONS-BOOK · Confluence Vote Grid

**Book:** SPCX, RKLB, ASTS (+ NVDA liquid control, TSLA)  
**Goal:** short-dated options *underlying* timing — fewer false entries over max winrate; need ATR% movement.  
**Data:** Yahoo delayed · 1h (1mo), 15m (5d), 1d (6mo) · hold 6 bars (1h) / 8 (15m) / 3 (1d) · stop 1.0 ATR · TP 1.5 ATR  
**Votes tested:** `{trend_pullback, macd_turn, rvol_spike, dk_break}` · thresholds 2-of-3 (all subsets), 2/3/4-of-4 · ATR% ∈ {0.8…2.0} · RVOL ∈ {1.2…1.8}

---

## Recommended vote rule (this book)

### Primary — **3-of-4** (false-entry control)

Enter only when **≥ 3 of 4** votes fire in the same direction, **and**:

| Filter | Value | Why |
|--------|-------|-----|
| Timeframe | **1H** (primary) | Only TF with usable n across the space book in this window |
| ATR% | **≥ 1.0** | Enough underlying move for short-dated premium; higher floors starve signals |
| RVOL | **≥ 1.8** | Cuts weak volume entries; lowers stop-out rate vs 1.5 |
| Trend gate | EMA9>21>55 (long) / inverse (short) | Votes are direction-gated by stack |
| Confirm | Bar close | Anti-repaint for options timing |

**Vote definitions (long; short mirrored):**
1. **trend_pullback** — uptrend + low tags mid-EMA band (`low ≤ EMA21 + 0.75·ATR`, close not far below mid)
2. **macd_turn** — MACD hist rising vs prior bar (turn/cross) while in uptrend
3. **rvol_spike** — `volume / SMA20(volume) ≥ 1.8` while in uptrend
4. **dk_break** — close breaks prior Donchian(20) high **or** Keltner upper (`EMA21 + 1.5·ATR`) while above EMA21

### Active fallback — **2-of-3 {trend_pullback, macd_turn, rvol_spike}**

Use when 3-of-4 is silent for >1–2 sessions. **Drop Donchian/Keltner from the required set** — the TMR triplet was the only 2-of-3 subset with pooled positive expectancy (1h+15m, atr≥1.0, rvol≥1.8: **n=32, wr≈53%, avg≈+0.23%**).

### Strict overlay — **4-of-4**

For NVDA / TSLA liquid control when you want max precision: pooled stop≈22–27% vs ~45%+ on looser rules, but **n is tiny** — expect long quiet stretches.

---

## Which threshold wins?

| Rule | Pooled n (1h+15m, atr≥1.0 rvol≥1.8) | Win% | Avg ret% | Stop% (false-entry proxy) | Verdict |
|------|--------------------------------------|------|----------|---------------------------|---------|
| **3-of-4** | 22 | 50.0 | −0.16 | **36** | **Book default** — fewer falses than 2-of-4 |
| **2-of-3 TMR** | 32 | 53.1 | **+0.23** | 44 | Best expectancy / Active mode |
| **4-of-4** | 11 | 54.5 | −0.01 | **27** | Strict only (starvation) |
| 2-of-3 + dk (no MACD) | ~26 | ~54 | −0.07 | ~35 | OK but weaker than TMR |
| **2-of-4** | 44 | 43.2 | −0.14 | **52** | **AVOID** — too many false entries |

**Answer:** For this options book, **3-of-4 beats 2-of-4** on false entries. Pure **2-of-3** only works if the triplet is **{trend, MACD, RVOL}** (not any 2-of-3). Prefer **3-of-4** as the combined entry rule; keep **2-of-3 TMR** as Active backup.

---

## Stats per symbol (1H · atr%≥1.0 · rvol≥1.8)

### Primary 3-of-4

| Sym | n | Win% | Avg% | TP% | Stop% | MFE% | Notes |
|-----|---|------|------|-----|-------|------|-------|
| **SPCX** | 4 | 50.0 | −0.31 | 0 | 25 | 1.11 | Thin; longs only in window — treat as satellite |
| **RKLB** | 8 | 37.5 | −0.58 | 12 | **62** | 1.62 | 3-of-4 underperforms; prefer Active 2-of-3 TMR |
| **ASTS** | 4 | 50.0 | **+0.21** | 25 | **0** | 1.87 | Cleanest space-name pocket on 3-of-4 |
| **NVDA** | 2 | 50.0 | −0.38 | 0 | 50 | 0.66 | Control — small n; use Strict 4-of-4 or wait |
| **TSLA** | 3 | **100** | **+1.22** | 33 | **0** | 1.72 | Best 3-of-4 print in book |

### Active 2-of-3 TMR (same filters)

| Sym | n | Win% | Avg% | TP% | Stop% |
|-----|---|------|------|-----|-------|
| SPCX | 8 | 37.5 | −0.10 | 38 | 62 |
| **RKLB** | 8 | **62.5** | **+0.49** | 38 | 38 |
| **ASTS** | 5 | **60.0** | **+0.70** | 40 | 20 |
| NVDA | 3 | 66.7 | −0.13 | 0 | 33 |
| TSLA | 7 | 57.1 | +0.39 | 43 | 43 |

### TF notes
- **15m (5d):** almost no 3-of-4 fires — do not rely on 15m alone for this book in a 5-day window.
- **1d:** noisy for ASTS/NVDA (large MAE); TSLA had 1 clean short. Not primary for 0–7 DTE timing.

---

## Combined entry rule (copy for desk)

```
TF = 1H
IF trend_stack_aligned
AND atr_pct >= 1.0
AND votes_in_direction >= 3   # from {pullback, macd_turn, rvol>=1.8, dk_break}
AND barstate.isconfirmed
THEN allow_options_underlying_entry
  stop = 1.0 ATR | target = 1.5 ATR | time_stop ≈ 6 × 1H bars
ELSE IF votes_TMR >= 2 AND atr_pct >= 1.0 AND rvol >= 1.8   # Active
THEN allow (smaller size)
```

---

## AVOID (this book)

1. **2-of-4** — highest stop rate (~52%), worst false-entry profile.  
2. **Any 2-of-3 that omits MACD turn when including dk_break** — Donchian/Keltner without MACD/RVOL adds breakouts that fail for short-dated holds.  
3. **atr% < 1.0** — not enough underlying travel vs premium decay.  
4. **atr% ≥ 1.5 as a hard book-wide floor** — starves NVDA/TSLA/SPCX; use only as a *size-up* filter on RKLB/ASTS expansion days.  
5. **15m-only entries** without 1H (or higher) stack agreement — sample collapsed to ~0–2 trades / 5d.  
6. **Daily signals on SPCX / crowded ASTS mean-reversion** — large MAE; poor for short-dated long premium.  
7. **Chasing RVOL spike alone** — spike without pullback+MACD or break is noise.  
8. **Ignoring bar-close confirmation** — options timing needs anti-repaint.  
9. **Treating RKLB 3-of-4 as “confirmed edge”** — in-sample stop-heavy; size via Active TMR or skip.  
10. **Overfitting to TSLA 100% wr cell** — n=3; use as confirmation that 3-of-4 *can* work on liquid names, not a standalone system.

---

## Honesty limits

- Window is short (1mo 1h ≈ 162 bars). n per symbol is small — treat ranks as **regime snapshot**, not lifetime expectancy.  
- Yahoo delayed; no options IV/skew in this sim — this times the **underlying**, not the contract.  
- Artifacts: `confluence_grid_results.csv`, `focus_report.csv`, `grid_summary.json`, `pine_snippet.txt`.

*Signals research only — not financial advice.*
