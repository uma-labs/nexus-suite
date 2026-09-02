# NEXUS Radar v2 — VOLUME / VWAP Specialist Results

Generated: 2026-09-02 ~19:45 ET (Yahoo delayed).  
Dir: `/workspace/tradingview/specialists/volume/`  
Symbols: NVDA, TSLA, AMD, META, PLTR, SPY, QQQ, RKLB, ASTS, SPCX  
TFs: **1h (1mo)**, **15m (5d)**, **1d (3mo)**  
Exits: stop=1.2×ATR · TP2=3×ATR · trail=2×ATR · max hold=48 bars · fill=signal close

## Setup definitions

| ID | Rule | Side |
|----|------|------|
| **A** Thrust | RVOL ≥ 1.5 AND close > open AND close > EMA21 | Long |
| **B** VWAP reclaim | Close crosses above session VWAP proxy (cum typical×vol) AND RVOL > 1.2 | Long |
| **C** OBV bounce | OBV > EMA(OBV,20) AND pullback bounce (touch EMA21 ±0.5ATR, then bullish reclaim) | Long |
| **D** Climax fade | RVOL > 2.5 AND rejection candle (upper wick ≥1.5×body, close in lower 40% of range) | Short |

VWAP proxy: intraday resets each UTC calendar day; daily uses monthly cumulative reset.

## Aggregate by setup (all symbols × TFs)

```
A  Thrust                         n= 96  WR=25.0%  avg=-0.355%  med=-0.477%  PF=0.60  bars=4.8
B  VWAP reclaim                   n= 86  WR=27.9%  avg=+0.194%  med=-0.447%  PF=1.27  bars=5.8
C  OBV rising + pullback bounce   n=164  WR=28.7%  avg=-0.511%  med=-0.424%  PF=0.50  bars=5.5
D  Climax fade short              n= 11  WR=36.4%  avg=-0.047%  med=-0.415%  PF=0.93  bars=3.2
```

## Aggregate by setup × timeframe

```
A/1h   n=50  WR=28.0%  avg=-0.352%  PF=0.59
A/15m  n=40  WR=22.5%  avg=-0.149%  PF=0.61
A/1d   n= 6  WR=16.7%  avg=-1.749%  PF=0.60

B/1h   n=45  WR=20.0%  avg=-0.372%  PF=0.59
B/15m  n=35  WR=34.3%  avg=-0.035%  PF=0.87
B/1d   n= 6  WR=50.0%  avg=+5.769%  PF=4.27   ← small-n daily outliers (PLTR/SPCX) inflate B total

C/1h   n=82  WR=32.9%  avg=-0.311%  PF=0.64
C/15m  n=63  WR=25.4%  avg=-0.107%  PF=0.66
C/1d   n=19  WR=21.1%  avg=-2.715%  PF=0.32

D/1h   n= 5  WR=20.0%  avg=-0.346%  PF=0.74
D/15m  n= 6  WR=50.0%  avg=+0.202%  PF=2.14
D/1d   n= 0
```

## Overlay / confluence tests (gate design)

| Test | n | WR% | avg% | PF | Takeaway |
|------|---|-----|------|-----|----------|
| C alone | 164 | 28.7 | -0.51 | 0.50 | Weak standalone |
| C + RVOL≥1.2 | 104 | 26.9 | -0.38 | 0.59 | RVOL floor helps, still soft |
| C + RVOL≥1.5 | 84 | 27.4 | -0.27 | 0.69 | Stricter RVOL still soft |
| B + OBV rising | 61 | 31.1 | **+0.48** | **1.71** | Best long confluence |
| B + close>EMA21 | 49 | 26.5 | -0.31 | 0.61 | EMA filter on B not additive here |
| A AND B | 36 | 25.0 | -0.37 | 0.56 | Do not require both |
| thrust RVOL≥1.0 | 139 | 25.9 | -0.52 | 0.49 | Looser RVOL *worse* than 1.5 |
| D + above VWAP | 3 | 66.7 | +0.59 | 5.05 | Tiny n; extension filter for shorts |

## 1h pockets worth noting (n≥2, avg>0 or WR≥50)

| Sym | Setup | n | WR% | avg% | PF |
|-----|-------|---|-----|------|----|
| TSLA | B | 3 | 67 | +1.66 | 4.89 |
| SPCX | B | 3 | 33 | +1.49 | 2.42 |
| SPCX | A | 6 | 33 | +1.06 | 2.22 |
| META | A | 5 | 80 | +0.73 | 3.47 |
| PLTR | B | 6 | 50 | +0.54 | 1.92 |
| META | C | 9 | 67 | +0.50 | 2.11 |
| SPCX | C | 13 | 38 | +0.25 | 1.22 |

Mega-liquid 1h block (SPY/QQQ/NVDA/META/AMD/TSLA/PLTR) alone is still flat-to-negative for A/B/C as *standalone* strategies — volume filters are for **gating / scoring**, not solo alpha in this window.

---

## HARD gates vs soft filters (final call)

### HARD (binary kill / required for volume-tagged longs)

1. **RVOL ≥ 1.2** — universal participation / liquidity HARD gate for Active volume entries.  
   - Overlay evidence: raising RVOL on C improves PF (0.50→0.59→0.69); loosening thrust to RVOL≥1.0 *hurts*.  
   - Matches existing NexusRadar `minRvol` philosophy; Strict mode should bump to **≥ 1.5**.
2. **Thrust identity (setup A label only):** RVOL ≥ 1.5 AND bullish body AND close > EMA21 — all three HARD *when naming a thrust*, not as the global scanner veto.
3. **VWAP reclaim identity (setup B):** actual cross above session VWAP — HARD for that setup (no “near VWAP” fires).

### SOFT (confluence / score, not veto)

1. **OBV > EMA(OBV,20)** — **best soft add**: B+OBV = PF 1.71 vs B alone 1.27. Do **not** hard-gate on OBV; standalone C is the weakest long (PF 0.50).
2. **Bullish body** — HARD for thrust A; soft elsewhere.
3. **Pullback-to-EMA21 geometry** — soft for bounce scoring (C).
4. **Climax fade D** — **opt-in short only**. High RVOL is continuation as often as exhaustion. Prefer D only with rejection **and** price extended above VWAP. Never hard-gate longs on “no climax.”
5. **A∩B** — do not require; rare and not better here.

### Suggested NEXUS Radar wiring

| Mode | Volume HARD | Volume SOFT (score / setup flags) |
|------|-------------|-----------------------------------|
| **Active** | `rvol ≥ 1.2` | +10 thrust A · +10 VWAP reclaim B · +5 OBV rising · +5 pullback bounce |
| **Strict** | `rvol ≥ 1.5` AND (`setupThrust` OR `setupVwapReclaim`) | OBV rising adds score; C never alone |
| **Shorts** | off by default | `setupClimaxFade` only if RVOL>2.5 AND rejection AND close>VWAP |

**Bottom line:** Make **RVOL floor HARD**. Treat **VWAP reclaim** and **thrust** as named setups (HARD internally, soft as global gates). Keep **OBV soft**. Keep **climax fade soft/opt-in**. Prefer **1h** for sample size; treat **1d B** wins as anecdotal until larger n.

## Pine-ready rules

See `pine_rules.txt` (boolean snippets + exit comments ready to paste into `NexusRadar.pine`).

## Files

| File | Purpose |
|------|---------|
| `results.csv` | Per symbol × TF × setup metrics |
| `RESULTS.md` | This report |
| `pine_rules.txt` | Pine v5 snippets |
| `volume_vwap_test.py` | Reproducible backtest |

## Caveats

- Delayed Yahoo OHLC; no bid/ask; fill = signal bar close.
- Session VWAP is a UTC-day proxy, not exact RTH anchored VWAP.
- B’s headline PF is partly daily small-n outliers — use intraday rows for conservative wiring.
- Not production edge proof; directional for radar filter design only.
