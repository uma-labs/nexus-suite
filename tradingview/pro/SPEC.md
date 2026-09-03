# NEXUS Radar PRO — SPEC (Pine-ready)

Single combined indicator. Modes: **Liquid** | **Book** | **Auto**.

Validated exits (all modes): `stop=1.2*ATR(14)`, `tp=2.5*ATR(14)`, `trail=2.0*ATR(14)`, `maxBars=12`.
Entry at signal bar close. One position at a time.

---

## Inputs

```pine
mode = input.string("Auto", "Mode", options=["Liquid","Book","Auto"])
atrLen = input.int(14, "ATR Length")
stopATR = input.float(1.2, "Stop ATR")
tpATR   = input.float(2.5, "TP ATR")
trailATR= input.float(2.0, "Trail ATR")
maxBars = input.int(12, "Max Bars")

// Soft liquidity
minRVOL     = input.float(1.0, "Min RVOL")
minATRpct   = input.float(0.8, "Min ATR %")
minDollarLiq= input.float(5.0, "Min $Vol M (Liquid)")
minDollarBk = input.float(0.5, "Min $Vol M (Book)")

// Book symbol list for Auto (comma-separated)
bookList = input.string("SPCX,RKLB,ASTS", "Book tickers (Auto)")
```

---

## Soft liquidity (always on)

```pine
atr = ta.atr(atrLen)
volSma = ta.sma(volume, 20)
rvol = volume / volSma
atrpct = atr / close * 100.0
dollarVolM = volSma * close / 1e6

isBookSym = str.contains(str.upper(bookList), syminfo.ticker)
useBookLiq = mode == "Book" or (mode == "Auto" and isBookSym)
minDollar = useBookLiq ? minDollarBk : minDollarLiq

softLiq = rvol >= minRVOL and atrpct >= minATRpct and dollarVolM >= minDollar
```

---

## Component signals (long unless noted)

### L_RSI50
```pine
ema21 = ta.ema(close, 21)
ema55 = ta.ema(close, 55)
rsi = ta.rsi(close, 14)
L_RSI50 = ema21 > ema55 and ta.crossover(rsi, 50) and rvol >= 1.0
```

### L_EMA_RECLAIM
```pine
ema9 = ta.ema(close, 9)
stack = ema9 > ema21 and ema21 > ema55
// pullback within last 6 bars: low <= ema21 + 0.5*atr
pullback = false
for i = 0 to 5
    pullback := pullback or (low[i] <= ema21[i] + 0.5 * atr[i])
crossEma9 = ta.crossover(close, ema9)
L_EMA_RECLAIM = stack and pullback and crossEma9
```

### L_VWAP_RECLAIM
```pine
// Session VWAP (TradingView ta.vwap)
vwapProxy = ta.vwap(hlc3)
L_VWAP_RECLAIM = ta.crossover(close, vwapProxy) and rvol >= 1.2 and close > ema21
```

### B_SUPERTREND — research only (not in production modes)
```pine
[stLine, stDir] = ta.supertrend(3.0, 10)  // HL2±3*ATR(10)
// Failed book expectancy; liquid PF only 1.20 — do not enable by default
```

### B_DONCHIAN_D — DAILY research only; REJECTED
```pine
donchHi = ta.highest(high, 20)[1]
B_DONCHIAN_D = timeframe.isdaily and close > donchHi and close > ema21
```

### HYBRID
```pine
votes = (L_EMA_RECLAIM ? 1 : 0) + (L_RSI50 ? 1 : 0) + (L_VWAP_RECLAIM ? 1 : 0)
HYBRID = votes >= 2
```

---

## Mode routing (WINNERS ONLY)

```pine
isDaily = timeframe.isdaily

effBook = mode == "Book" or (mode == "Auto" and isBookSym)
effLiq  = not effBook

// Liquid → HYBRID on 1H
longLiquid = softLiq and HYBRID

// Book → L_EMA_RECLAIM on DAILY only
longBook = softLiq and isDaily and L_EMA_RECLAIM

longSignal = effBook ? longBook : longLiquid
shortSignal = false  // winners are long-only
```

### Auto behavior
| Chart symbol | TF | Active rule |
|--------------|----|-------------|
| Not in book list | 1H | **HYBRID** + soft liq (liquid $5M) |
| In book list (SPCX,RKLB,ASTS) | 1D | **L_EMA_RECLAIM** + soft liq (book $0.5M) |
| Book list on 1H | — | **No entry** (book 1H all rejected) |
| Liquid on 1D | — | No primary entry (optional secondary: L_VWAP_RECLAIM research toggle) |

---

## Exits (identical)

```pine
var float entryPx = na
var float stopPx = na
var float tpPx = na
var float extreme = na
var int entryBar = na
var int pos = 0  // 1 long

if pos == 0 and longSignal
    pos := 1
    entryPx := close
    stopPx := close - stopATR * atr
    tpPx := close + tpATR * atr
    extreme := high
    entryBar := bar_index

if pos == 1
    extreme := math.max(extreme, high)
    trail = extreme - trailATR * atr
    curStop = math.max(stopPx, trail)
    barsHeld = bar_index - entryBar
    if low <= curStop
        pos := 0
    else if high >= tpPx
        pos := 0
    else if barsHeld >= maxBars
        pos := 0
```

---

## Plots / alerts

- Plot `longSignal` shapes (triangle up).
- Background tint when `softLiq`.
- Alert: `LONG PRO` on entry bar.
- Mode badge: Liquid/Book/Auto + active rule + TF warning if Book on non-daily.

---

## Validation snapshot (2026-09-02 ET)

| Mode | Rule | TF | n | WR | avg | PF | maxDD |
|------|------|----|---|----|-----|----|-------|
| Liquid | HYBRID | 1H | 18 | 61.1% | +0.65% | 2.32 | 4.42% |
| Book | L_EMA_RECLAIM | 1D | 6 | 66.7% | +5.09% | 2.64 | 9.40% |

Reject as default: B_SUPERTREND, B_DONCHIAN_D, all book-1H rules, liquid daily except optional L_VWAP_RECLAIM research toggle.
