# NEXUS Radar PRO — Backtest Results

Generated: 2026-09-02 20:07 ET

## Setup
- **Exits (all):** stop 1.2 ATR · TP 2.5 ATR · trail 2.0 ATR · max 12 bars
- **Soft liq:** rvol≥1.0 · atrpct≥0.8 · dollarVolM≥5 (liquid) / ≥0.5 (book)
- **Liquid:** NVDA, TSLA, AMD, META, PLTR, SPY, QQQ
- **Book:** SPCX, RKLB, ASTS (+ NVDA, TSLA controls)
- **TFs:** 1h≈3mo (Yahoo) · 1d=1y
- **Gate:** reject aggregate n<5 or PF<1.1 (book pocket exception if clear)
- **Ruthless notes:** SPY/QQQ 1h largely filtered out by atrpct≥0.8; SPCX 1d skipped (<60 bars)

---

## CLEAR WINNERS

### (a) Liquid 1H — **HYBRID** ✅
| metric | value |
|--------|------:|
| n | 18 |
| winrate | 61.1% |
| avg_ret | **+0.648%** |
| sum_ret | +11.66% |
| PF | **2.32** |
| maxDD | 4.42% |

**Entry:** soft_liq AND ≥2 of {L_EMA_RECLAIM, L_RSI50, L_VWAP_RECLAIM} same bar.

**Per-symbol (1h):**
| sym | n | WR | avg | PF | WF |
|-----|---|----|-----|----|----|
| TSLA | 5 | 80% | +1.29 | 6.04 | SECOND_ONLY |
| NVDA | 5 | 60% | +0.39 | 2.04 | WEAK_BOTH |
| PLTR | 3 | 33% | +0.28 | 1.67 | WEAK_BOTH |
| META | 2 | 100% | +2.50 | ∞ | WEAK_BOTH |
| AMD | 3 | 33% | **−0.86** | 0.42 | WEAK_BOTH |
| SPY/QQQ | 0 | — | — | — | NO_TRADES |

**Caveat:** AMD is a drag; prefer NVDA/TSLA/META/PLTR. WF not BOTH_HALVES on any single name — treat as regime-sensitive.

**Runner-up (more sample):** L_RSI50 — n=26 WR=50% avg=+0.47% PF=1.80 maxDD=4.44%
**Best single pocket:** PLTR L_VWAP_RECLAIM — n=10 WR=50% avg=+2.70% PF=6.54 **BOTH_HALVES**

### (b) Book 1D — **L_EMA_RECLAIM** ⚠️ pocket
| metric | value |
|--------|------:|
| n | 6 |
| winrate | 66.7% |
| avg_ret | **+5.089%** |
| sum_ret | +30.54% |
| PF | **2.64** |
| maxDD | 9.40% |

**Entry:** soft_liq (book thresholds) AND ema9>ema21>ema55 AND pullback low≤ema21+0.5·ATR AND close cross above ema9. **TF=1D only.**

**Per-symbol (1d):**
| sym | n | WR | avg | PF | WF |
|-----|---|----|-----|----|----|
| ASTS | 3 | 67% | +6.52 | 3.12 | FIRST_ONLY |
| RKLB | 3 | 67% | +3.66 | 2.17 | FIRST_ONLY |
| SPCX | — | — | — | — | 1d data too short |

**Caveat:** Thin n=6; ASTS second-half single trade was a loss (FIRST_ONLY). Book **1H: ALL rules FAIL** (no positive expectancy). Book+controls 1D L_EMA_RECLAIM still PASS (n=11 PF=1.65) — NVDA/TSLA dilute but do not kill it.

---

## Aggregate tables

### Liquid 1H
| rule | n | winrate | avg_ret | sum_ret | PF | maxDD | PASS |
|------|---|---------|---------|---------|----|-------|------|
| **HYBRID** | 18 | 61.1 | +0.648 | +11.66 | 2.32 | 4.42 | **YES** |
| L_RSI50 | 26 | 50.0 | +0.469 | +12.19 | 1.80 | 4.44 | YES |
| L_VWAP_RECLAIM | 42 | 38.1 | +0.442 | +18.54 | 1.50 | 17.26 | YES |
| L_EMA_RECLAIM | 21 | 52.4 | +0.364 | +7.65 | 1.79 | 2.19 | YES |
| B_SUPERTREND | 61 | 29.5 | +0.167 | +10.18 | 1.20 | 17.35 | YES (marginal) |
| B_DONCHIAN_D | 0 | — | — | — | — | — | n/a (1d only) |

### Liquid 1D
| rule | n | WR | avg | PF | PASS |
|------|---|----|-----|----|------|
| L_VWAP_RECLAIM | 27 | 44.4 | +1.233 | 1.62 | YES (secondary) |
| others | — | — | neg | <1.1 | REJECT |

### Book 1H — ALL REJECTED
| rule | n | avg | PF |
|------|---|-----|-----|
| B_SUPERTREND | 27 | −0.11 | 0.92 |
| L_VWAP_RECLAIM | 20 | −0.77 | 0.55 |
| L_EMA_RECLAIM | 7 | −1.04 | 0.41 |
| HYBRID | 6 | −0.70 | 0.54 |
| L_RSI50 | 5 | −1.20 | 0.32 |

### Book 1D
| rule | n | avg | PF | PASS |
|------|---|-----|-----|------|
| **L_EMA_RECLAIM** | 6 | +5.09 | 2.64 | **YES pocket** |
| B_DONCHIAN_D | 23 | −1.16 | 0.74 | no |
| B_SUPERTREND | 12 | −3.34 | 0.48 | no |
| others | — | neg | <1 | no |

---

## Rejected
- Book 1H entire slate (no positive expectancy)
- B_DONCHIAN_D aggregate (liquid & book) — PF<1.1 / neg avg
- B_SUPERTREND book — near breakeven / neg
- Liquid 1D all except L_VWAP_RECLAIM
- Any cell with n<5 on aggregate unless book pocket exception (applied once)

## Artifacts
- `results.csv` — per symbol×TF×rule metrics + walk-forward halves
- `SPEC.md` — Pine-ready combined indicator (Liquid / Book / Auto)
- `backtest_pro.py` — reproducible harness
