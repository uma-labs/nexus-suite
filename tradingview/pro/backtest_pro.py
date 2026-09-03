#!/usr/bin/env python3
"""NEXUS Radar PRO — candidate backtest (ruthless expectancy filter).

Exits (all): stop 1.2ATR, TP 2.5ATR, trail 2.0ATR, max 12 bars.
Soft liq: rvol>=1.0, atrpct>=0.8, dollarVolM>=5 liquid / >=0.5 book.
"""
from __future__ import annotations
import csv, json, math, ssl, time, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

OUT = Path('/workspace/tradingview/pro')
OUT.mkdir(parents=True, exist_ok=True)
ctx = ssl.create_default_context()

LIQUID = ['NVDA', 'TSLA', 'AMD', 'META', 'PLTR', 'SPY', 'QQQ']
BOOK = ['SPCX', 'RKLB', 'ASTS']
BOOK_CTRL = ['NVDA', 'TSLA']  # controls alongside book
ALL_SYMS = list(dict.fromkeys(LIQUID + BOOK + BOOK_CTRL))

# TF plan: 1h prefer 3mo else 1mo; 1d = 1y
INTERVALS = [('3mo', '1h'), ('1y', '1d')]

STOP_ATR = 1.2
TP_ATR = 2.5
TRAIL_ATR = 2.0
MAX_BARS = 12

RULES = [
    'L_RSI50',
    'L_EMA_RECLAIM',
    'L_VWAP_RECLAIM',
    'B_SUPERTREND',
    'B_DONCHIAN_D',
    'HYBRID',
]


def fetch(sym, range_='3mo', interval='1h', retries=4):
    url = (f'https://query1.finance.yahoo.com/v8/finance/chart/{sym}'
           f'?range={range_}&interval={interval}')
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
                data = json.load(r)
            res = data['chart']['result'][0]
            ts = res['timestamp']
            q = res['indicators']['quote'][0]
            rows = []
            for i, t in enumerate(ts):
                o, h, l, c, v = q['open'][i], q['high'][i], q['low'][i], q['close'][i], q['volume'][i]
                if None in (o, h, l, c, v):
                    continue
                rows.append(dict(
                    t=datetime.fromtimestamp(t, tz=timezone.utc),
                    o=float(o), h=float(h), l=float(l), c=float(c), v=float(v),
                ))
            return rows
        except Exception as e:
            last = e
            time.sleep(0.5 * (attempt + 1))
    raise last


def ema(vals, n):
    out = [None] * len(vals)
    if len(vals) < n:
        return out
    s = sum(vals[:n]) / n
    out[n - 1] = s
    k = 2 / (n + 1)
    for i in range(n, len(vals)):
        s = vals[i] * k + s * (1 - k)
        out[i] = s
    return out


def sma(vals, n):
    out = [None] * len(vals)
    for i in range(n - 1, len(vals)):
        out[i] = sum(vals[i - n + 1:i + 1]) / n
    return out


def rsi(closes, n=14):
    out = [None] * len(closes)
    if len(closes) <= n:
        return out
    gains, losses = [], []
    for i in range(1, n + 1):
        d = closes[i] - closes[i - 1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    ag = sum(gains) / n
    al = sum(losses) / n
    out[n] = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
    for i in range(n + 1, len(closes)):
        d = closes[i] - closes[i - 1]
        g, l = max(d, 0), max(-d, 0)
        ag = (ag * (n - 1) + g) / n
        al = (al * (n - 1) + l) / n
        out[i] = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
    return out


def atr_series(rows, n=14):
    trs = []
    for i, r in enumerate(rows):
        if i == 0:
            trs.append(r['h'] - r['l'])
        else:
            trs.append(max(r['h'] - r['l'],
                           abs(r['h'] - rows[i - 1]['c']),
                           abs(r['l'] - rows[i - 1]['c'])))
    return sma(trs, n)


def rolling_max(vals, n):
    out = [None] * len(vals)
    for i in range(n - 1, len(vals)):
        out[i] = max(vals[i - n + 1:i + 1])
    return out


def rolling_vwap(rows, window=20):
    """Rolling VWAP proxy over last `window` bars (typical*vol / vol)."""
    n = len(rows)
    out = [None] * n
    for i in range(window - 1, n):
        pv = 0.0
        vv = 0.0
        for j in range(i - window + 1, i + 1):
            typ = (rows[j]['h'] + rows[j]['l'] + rows[j]['c']) / 3.0
            pv += typ * rows[j]['v']
            vv += rows[j]['v']
        out[i] = pv / vv if vv > 0 else rows[i]['c']
    return out


def session_vwap(rows, interval):
    """Session VWAP: reset each UTC day for intraday; monthly for daily."""
    n = len(rows)
    out = [None] * n
    cum_pv = 0.0
    cum_v = 0.0
    prev = None
    for i in range(n):
        if interval == '1d':
            sk = rows[i]['t'].strftime('%Y-%m')
        else:
            sk = rows[i]['t'].strftime('%Y-%m-%d')
        if sk != prev:
            cum_pv = 0.0
            cum_v = 0.0
            prev = sk
        typ = (rows[i]['h'] + rows[i]['l'] + rows[i]['c']) / 3.0
        cum_pv += typ * rows[i]['v']
        cum_v += rows[i]['v']
        out[i] = cum_pv / cum_v if cum_v > 0 else typ
    return out


def supertrend(rows, atr10, mult=3.0):
    """Classic SuperTrend on HL2 ± mult*ATR(10). Returns (st_line, direction).
    direction: 1=long/uptrend, -1=short/downtrend. Flip when close crosses.
    """
    n = len(rows)
    st = [None] * n
    direction = [None] * n
    final_upper = [None] * n
    final_lower = [None] * n
    for i in range(n):
        if atr10[i] is None:
            continue
        hl2 = (rows[i]['h'] + rows[i]['l']) / 2.0
        basic_upper = hl2 + mult * atr10[i]
        basic_lower = hl2 - mult * atr10[i]
        if i == 0 or final_upper[i - 1] is None:
            final_upper[i] = basic_upper
            final_lower[i] = basic_lower
            direction[i] = 1
            st[i] = final_lower[i]
            continue
        # final bands
        if basic_lower > final_lower[i - 1] or rows[i - 1]['c'] < final_lower[i - 1]:
            final_lower[i] = basic_lower
        else:
            final_lower[i] = final_lower[i - 1]
        if basic_upper < final_upper[i - 1] or rows[i - 1]['c'] > final_upper[i - 1]:
            final_upper[i] = basic_upper
        else:
            final_upper[i] = final_upper[i - 1]
        # direction
        prev_dir = direction[i - 1]
        if prev_dir == 1:
            if rows[i]['c'] < final_lower[i]:
                direction[i] = -1
            else:
                direction[i] = 1
        else:
            if rows[i]['c'] > final_upper[i]:
                direction[i] = 1
            else:
                direction[i] = -1
        st[i] = final_lower[i] if direction[i] == 1 else final_upper[i]
    return st, direction


def universe_of(sym):
    if sym in BOOK:
        return 'book'
    return 'liquid'


def soft_liq(sym, i, ind):
    at = ind['atr'][i]
    vs = ind['vs'][i]
    c = ind['closes'][i]
    if at is None or vs is None or vs <= 0 or c <= 0:
        return False
    atrpct = at / c * 100.0
    rvol = ind['vols'][i] / vs
    dollar = vs * c / 1e6  # avg dollar vol in millions using SMA(vol)*price
    # Use current bar dollar as well? Spec says dollarVolM — use SMA vol * close
    min_d = 0.5 if universe_of(sym) == 'book' else 5.0
    return rvol >= 1.0 and atrpct >= 0.8 and dollar >= min_d


def prep(rows, interval):
    closes = [r['c'] for r in rows]
    highs = [r['h'] for r in rows]
    lows = [r['l'] for r in rows]
    vols = [r['v'] for r in rows]
    e9 = ema(closes, 9)
    e21 = ema(closes, 21)
    e55 = ema(closes, 55)
    rs = rsi(closes, 14)
    at = atr_series(rows, 14)
    at10 = atr_series(rows, 10)
    vs = sma(vols, 20)
    # VWAP: use rolling 20 as primary proxy + session for reclaim cross
    rvwap = rolling_vwap(rows, 20)
    svwap = session_vwap(rows, interval)
    # Prefer session VWAP for reclaim (more TradingView-like); fall back rolling
    vwap = svwap
    hh20 = rolling_max(highs, 20)
    st, stdir = supertrend(rows, at10, 3.0)
    rvol = [None] * len(rows)
    for i in range(len(rows)):
        if vs[i] and vs[i] > 0:
            rvol[i] = vols[i] / vs[i]
    return dict(
        closes=closes, highs=highs, lows=lows, vols=vols,
        e9=e9, e21=e21, e55=e55, rs=rs, atr=at, atr10=at10, vs=vs,
        vwap=vwap, rvwap=rvwap, hh20=hh20, st=st, stdir=stdir, rvol=rvol,
    )


def sig_L_RSI50(i, ind):
    """ema21>ema55, crossover(rsi,50), rvol>=1.0"""
    if i < 1:
        return False
    e21, e55, rs, rvol = ind['e21'], ind['e55'], ind['rs'], ind['rvol']
    if any(x[i] is None for x in (e21, e55, rs, rvol)) or rs[i - 1] is None:
        return False
    if not (e21[i] > e55[i]):
        return False
    if not (rs[i - 1] <= 50 and rs[i] > 50):
        return False
    if rvol[i] < 1.0:
        return False
    return True


def sig_L_EMA_RECLAIM(i, ind, rows):
    """ema9>ema21>ema55, pullback low<=ema21+0.5atr, close cross above ema9"""
    if i < 1:
        return False
    e9, e21, e55, at = ind['e9'], ind['e21'], ind['e55'], ind['atr']
    if any(x[i] is None for x in (e9, e21, e55, at)) or e9[i - 1] is None:
        return False
    if not (e9[i] > e21[i] > e55[i]):
        return False
    # pullback: recent low touched/near ema21 (this bar or prior few)
    # Spec: pullback low<=ema21+0.5atr — interpret as this bar's low (or recent)
    pullback = False
    for j in range(max(0, i - 5), i + 1):
        if e21[j] is None or at[j] is None:
            continue
        if rows[j]['l'] <= e21[j] + 0.5 * at[j]:
            pullback = True
            break
    if not pullback:
        return False
    # close cross above ema9
    if not (rows[i - 1]['c'] <= e9[i - 1] and rows[i]['c'] > e9[i]):
        return False
    return True


def sig_L_VWAP_RECLAIM(i, ind, rows):
    """cross above rolling VWAP proxy + rvol>=1.2 + close>ema21"""
    if i < 1:
        return False
    vwap, e21, rvol = ind['vwap'], ind['e21'], ind['rvol']
    if any(x[i] is None for x in (vwap, e21, rvol)) or vwap[i - 1] is None:
        return False
    cross = rows[i - 1]['c'] <= vwap[i - 1] and rows[i]['c'] > vwap[i]
    if not cross:
        return False
    if rvol[i] < 1.2:
        return False
    if rows[i]['c'] <= e21[i]:
        return False
    return True


def sig_B_SUPERTREND(i, ind):
    """HL2±3*ATR(10) flip to long/short — return side 'L'/'S' or None"""
    if i < 1:
        return None
    d = ind['stdir']
    if d[i] is None or d[i - 1] is None:
        return None
    if d[i - 1] == -1 and d[i] == 1:
        return 'L'
    if d[i - 1] == 1 and d[i] == -1:
        return 'S'
    return None


def sig_B_DONCHIAN_D(i, ind, rows, interval):
    """DAILY only: close > highest(high,20)[1] and close>ema21"""
    if interval != '1d' or i < 1:
        return False
    hh20, e21 = ind['hh20'], ind['e21']
    # highest(high,20)[1] = prior bar's 20-bar high (excluding current? In Pine,
    # highest(high,20)[1] is the highest of highs from i-20 to i-1)
    # Our hh20[i-1] = max(highs[i-20:i]) which is highs from (i-1)-20+1=i-20 to i-1. Correct.
    if hh20[i - 1] is None or e21[i] is None:
        return False
    c = rows[i]['c']
    return c > hh20[i - 1] and c > e21[i]


def collect_signals(sym, rows, ind, interval, rule):
    """Return list of {i, side}."""
    sigs = []
    for i in range(1, len(rows)):
        if ind['atr'][i] is None or ind['atr'][i] <= 0:
            continue
        if not soft_liq(sym, i, ind):
            continue
        side = None
        if rule == 'L_RSI50':
            if sig_L_RSI50(i, ind):
                side = 'L'
        elif rule == 'L_EMA_RECLAIM':
            if sig_L_EMA_RECLAIM(i, ind, rows):
                side = 'L'
        elif rule == 'L_VWAP_RECLAIM':
            if sig_L_VWAP_RECLAIM(i, ind, rows):
                side = 'L'
        elif rule == 'B_SUPERTREND':
            side = sig_B_SUPERTREND(i, ind)
        elif rule == 'B_DONCHIAN_D':
            if sig_B_DONCHIAN_D(i, ind, rows, interval):
                side = 'L'
        elif rule == 'HYBRID':
            hits = 0
            if sig_L_EMA_RECLAIM(i, ind, rows):
                hits += 1
            if sig_L_RSI50(i, ind):
                hits += 1
            if sig_L_VWAP_RECLAIM(i, ind, rows):
                hits += 1
            if hits >= 2:
                side = 'L'
        if side:
            sigs.append(dict(i=i, side=side))
    return sigs


def run_trades(rows, signals, atr):
    """One position at a time. Entry at signal bar close.
    Exits: stop 1.2ATR, TP 2.5ATR, trail 2.0ATR, max 12 bars.
    """
    trades = []
    pos = 0
    entry = stop = tp = extreme = entry_atr = None
    side = None
    entry_i = None
    sig_by_i = {s['i']: s for s in signals}

    for i in range(len(rows)):
        if atr[i] is None:
            continue
        c, h, l = rows[i]['c'], rows[i]['h'], rows[i]['l']

        if pos != 0:
            bars = i - entry_i
            reason = None
            px = None
            if pos == 1:
                extreme = max(extreme, h)
                trail = extreme - atr[i] * TRAIL_ATR
                cur_stop = max(stop, trail)
                if l <= cur_stop:
                    reason, px = 'stop', cur_stop
                elif h >= tp:
                    reason, px = 'tp', tp
                elif bars >= MAX_BARS:
                    reason, px = 'time', c
            else:
                extreme = min(extreme, l)
                trail = extreme + atr[i] * TRAIL_ATR
                cur_stop = min(stop, trail)
                if h >= cur_stop:
                    reason, px = 'stop', cur_stop
                elif l <= tp:
                    reason, px = 'tp', tp
                elif bars >= MAX_BARS:
                    reason, px = 'time', c
            if reason:
                if pos == 1:
                    ret = (px - entry) / entry * 100.0
                else:
                    ret = (entry - px) / entry * 100.0
                trades.append(dict(
                    side=side, ret=ret, reason=reason, bars=bars,
                    entry_i=entry_i, exit_i=i, entry=entry, exit=px,
                ))
                pos = 0

        if pos == 0 and i in sig_by_i:
            s = sig_by_i[i]
            side = s['side']
            entry = c
            entry_atr = atr[i] if atr[i] > 0 else c * 0.01
            entry_i = i
            if side == 'L':
                pos = 1
                extreme = h
                stop = entry - entry_atr * STOP_ATR
                tp = entry + entry_atr * TP_ATR
            else:
                pos = -1
                extreme = l
                stop = entry + entry_atr * STOP_ATR
                tp = entry - entry_atr * TP_ATR

    if pos != 0 and entry_i is not None:
        px = rows[-1]['c']
        ret = ((px - entry) / entry * 100.0) if pos == 1 else ((entry - px) / entry * 100.0)
        trades.append(dict(
            side=side, ret=ret, reason='eod', bars=len(rows) - 1 - entry_i,
            entry_i=entry_i, exit_i=len(rows) - 1, entry=entry, exit=px,
        ))
    return trades


def metrics(trades):
    if not trades:
        return dict(n=0, winrate=0.0, avg_ret=0.0, sum_ret=0.0, PF=0.0, maxDD=0.0)
    rets = [t['ret'] for t in trades]
    n = len(rets)
    wins = [r for r in rets if r > 0]
    losses = [r for r in rets if r <= 0]
    winrate = len(wins) / n * 100.0
    avg_ret = sum(rets) / n
    sum_ret = sum(rets)
    gp = sum(wins) if wins else 0.0
    gl = abs(sum(losses)) if losses else 0.0
    PF = (gp / gl) if gl > 1e-12 else (99.0 if gp > 0 else 0.0)
    # equity curve maxDD on cumulative % returns (additive approx)
    eq = 0.0
    peak = 0.0
    maxDD = 0.0
    for r in rets:
        eq += r
        peak = max(peak, eq)
        dd = peak - eq
        maxDD = max(maxDD, dd)
    return dict(n=n, winrate=winrate, avg_ret=avg_ret, sum_ret=sum_ret, PF=PF, maxDD=maxDD)


def walk_forward(trades, n_bars):
    """Split by entry_i mid-series. Flag if only one half has positive expectancy."""
    mid = n_bars // 2
    first = [t for t in trades if t['entry_i'] < mid]
    second = [t for t in trades if t['entry_i'] >= mid]
    m1 = metrics(first)
    m2 = metrics(second)
    pos1 = m1['n'] >= 2 and m1['avg_ret'] > 0 and m1['PF'] >= 1.0
    pos2 = m2['n'] >= 2 and m2['avg_ret'] > 0 and m2['PF'] >= 1.0
    if pos1 and pos2:
        flag = 'BOTH_HALVES'
    elif pos1 and not pos2:
        flag = 'FIRST_ONLY'
    elif pos2 and not pos1:
        flag = 'SECOND_ONLY'
    elif m1['n'] == 0 and m2['n'] == 0:
        flag = 'NO_TRADES'
    else:
        flag = 'WEAK_BOTH'
    return m1, m2, flag


def score_cell(m):
    """Expectancy-aware score for ranking."""
    if m['n'] < 5 or m['PF'] < 1.1 or m['avg_ret'] <= 0:
        return -999.0
    return m['avg_ret'] * math.sqrt(m['n']) * min(m['PF'], 5.0)


def main():
    cache = {}
    print('Fetching data...')
    for sym in ALL_SYMS:
        for range_, interval in INTERVALS:
            key = (sym, range_, interval)
            try:
                rows = fetch(sym, range_, interval)
                # fallback for 1h if 3mo thin
                if interval == '1h' and range_ == '3mo' and len(rows) < 100:
                    print(f'  {sym} 3mo/1h thin ({len(rows)}), trying 1mo')
                    rows = fetch(sym, '1mo', '1h')
                    key = (sym, '1mo', '1h')
                cache[key] = rows
                print(f'  {sym} {key[1]}/{interval}: {len(rows)} bars')
            except Exception as e:
                print(f'  FAIL {sym} {range_}/{interval}: {e}')
                if interval == '1h' and range_ == '3mo':
                    try:
                        rows = fetch(sym, '1mo', '1h')
                        cache[(sym, '1mo', '1h')] = rows
                        print(f'  fallback {sym} 1mo/1h: {len(rows)} bars')
                    except Exception as e2:
                        print(f'  FAIL fallback: {e2}')

    rows_out = []
    # Also keep trade lists for aggregation
    all_trades = defaultdict(list)  # (rule, universe, interval) -> trades with meta

    for (sym, range_, interval), rows in sorted(cache.items()):
        if len(rows) < 60:
            print(f'skip {sym} {interval}: too few bars {len(rows)}')
            continue
        ind = prep(rows, interval)
        uni = universe_of(sym)
        for rule in RULES:
            if rule == 'B_DONCHIAN_D' and interval != '1d':
                continue
            sigs = collect_signals(sym, rows, ind, interval, rule)
            trades = run_trades(rows, sigs, ind['atr'])
            m = metrics(trades)
            m1, m2, wf = walk_forward(trades, len(rows))
            sc = score_cell(m)
            row = dict(
                sym=sym, universe=uni, interval=interval, range=range_, rule=rule,
                bars=len(rows), n=m['n'], winrate=round(m['winrate'], 2),
                avg_ret=round(m['avg_ret'], 4), sum_ret=round(m['sum_ret'], 4),
                PF=round(m['PF'], 3), maxDD=round(m['maxDD'], 4),
                wf_flag=wf,
                wf1_n=m1['n'], wf1_avg=round(m1['avg_ret'], 4), wf1_PF=round(m1['PF'], 3),
                wf2_n=m2['n'], wf2_avg=round(m2['avg_ret'], 4), wf2_PF=round(m2['PF'], 3),
                score=round(sc, 3),
                is_control=1 if (sym in BOOK_CTRL and uni == 'liquid') else 0,
            )
            rows_out.append(row)
            # For book analysis also tag NVDA/TSLA as book_ctrl when reporting book
            all_trades[(rule, uni, interval)].append((sym, trades, m, wf))
            if sym in BOOK_CTRL:
                all_trades[(rule, 'book_ctrl', interval)].append((sym, trades, m, wf))
            print(f'{sym:5s} {interval:2s} {rule:16s} n={m["n"]:3d} WR={m["winrate"]:5.1f}% '
                  f'avg={m["avg_ret"]:+.3f} PF={m["PF"]:.2f} DD={m["maxDD"]:.2f} WF={wf}')

    # Write CSV
    csv_path = OUT / 'results.csv'
    fields = ['sym', 'universe', 'interval', 'range', 'rule', 'bars', 'n', 'winrate',
              'avg_ret', 'sum_ret', 'PF', 'maxDD', 'wf_flag',
              'wf1_n', 'wf1_avg', 'wf1_PF', 'wf2_n', 'wf2_avg', 'wf2_PF', 'score', 'is_control']
    with open(csv_path, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows_out:
            w.writerow(r)
    print(f'Wrote {csv_path} ({len(rows_out)} rows)')

    # Aggregates
    def agg(filter_fn):
        subset = [r for r in rows_out if filter_fn(r)]
        by_rule = defaultdict(list)
        for r in subset:
            by_rule[r['rule']].append(r)
        out = {}
        for rule, cells in by_rule.items():
            # pool trades via weighted — recompute from cell metrics carefully:
            # use sum of n, weighted avg, sum of sum_ret; PF from cells is imperfect —
            # rebuild from per-symbol metrics approximation: sum gp/gl not available,
            # so recompute PF from all_trades if possible; else use sum_ret & winrate proxy.
            total_n = sum(c['n'] for c in cells)
            if total_n == 0:
                out[rule] = dict(n=0, winrate=0, avg_ret=0, sum_ret=0, PF=0, maxDD=0,
                                 cells=len(cells), pos_cells=0, wf_stable=0, score=-999)
                continue
            sum_ret = sum(c['sum_ret'] for c in cells)
            avg_ret = sum_ret / total_n
            # winrate weighted
            wr = sum(c['winrate'] * c['n'] for c in cells) / total_n
            maxDD = max(c['maxDD'] for c in cells)
            # Approximate aggregate PF: can't perfectly recover; use harmonic-ish
            # Better: pull from all_trades
            pos_cells = sum(1 for c in cells if c['n'] >= 3 and c['avg_ret'] > 0 and c['PF'] >= 1.1)
            wf_stable = sum(1 for c in cells if c['wf_flag'] == 'BOTH_HALVES')
            out[rule] = dict(n=total_n, winrate=wr, avg_ret=avg_ret, sum_ret=sum_ret,
                             PF=None, maxDD=maxDD, cells=len(cells), pos_cells=pos_cells,
                             wf_stable=wf_stable, score=None, cell_rows=cells)
        return out

    # Rebuild accurate PF from trade lists
    def rebuild_agg(rule, symbols, interval):
        trades = []
        for (sym, range_, iv), rows in cache.items():
            if iv != interval or sym not in symbols:
                continue
            if len(rows) < 60:
                continue
            ind = prep(rows, iv)
            if rule == 'B_DONCHIAN_D' and iv != '1d':
                continue
            sigs = collect_signals(sym, rows, ind, iv, rule)
            tr = run_trades(rows, sigs, ind['atr'])
            trades.extend(tr)
        m = metrics(trades)
        # walk-forward across pooled: use each symbol's mid independently already in cells
        return m, trades

    liquid_1h = {}
    book_1h = {}
    book_1d = {}
    liquid_1d = {}

    for rule in RULES:
        m, _ = rebuild_agg(rule, LIQUID, '1h')
        liquid_1h[rule] = m
        m, _ = rebuild_agg(rule, BOOK, '1h')
        book_1h[rule] = m
        m, _ = rebuild_agg(rule, BOOK, '1d')
        book_1d[rule] = m
        m, _ = rebuild_agg(rule, LIQUID, '1d')
        liquid_1d[rule] = m

    # Also book+controls
    book_ctrl_1h = {}
    book_ctrl_1d = {}
    for rule in RULES:
        m, _ = rebuild_agg(rule, BOOK + BOOK_CTRL, '1h')
        book_ctrl_1h[rule] = m
        m, _ = rebuild_agg(rule, BOOK + BOOK_CTRL, '1d')
        book_ctrl_1d[rule] = m

    def pass_gate(m, book_pocket=False):
        if m['n'] < 5:
            if book_pocket and m['n'] >= 3 and m['PF'] >= 1.3 and m['avg_ret'] > 0:
                return True  # clear pocket exception
            return False
        if m['PF'] < 1.1:
            if book_pocket and m['n'] >= 5 and m['PF'] >= 1.05 and m['avg_ret'] > 0.15:
                return True
            return False
        return m['avg_ret'] > 0

    def rank_rules(d, book_pocket=False):
        ranked = []
        for rule, m in d.items():
            ok = pass_gate(m, book_pocket=book_pocket)
            sc = -999.0
            if ok:
                sc = m['avg_ret'] * math.sqrt(m['n']) * min(m['PF'], 5.0)
            ranked.append((sc, rule, m, ok))
        ranked.sort(key=lambda x: -x[0])
        return ranked

    liq_rank = rank_rules(liquid_1h, False)
    book_h_rank = rank_rules(book_1h, True)
    book_d_rank = rank_rules(book_1d, True)

    # Pick winners
    winner_liq = None
    for sc, rule, m, ok in liq_rank:
        if ok:
            # check walk-forward not FIRST_ONLY dominated across liquid cells
            cells = [r for r in rows_out if r['rule'] == rule and r['universe'] == 'liquid' and r['interval'] == '1h']
            bad_wf = sum(1 for c in cells if c['wf_flag'] in ('FIRST_ONLY', 'SECOND_ONLY') and c['n'] >= 3)
            good_wf = sum(1 for c in cells if c['wf_flag'] == 'BOTH_HALVES')
            winner_liq = dict(rule=rule, m=m, score=sc, cells=cells, bad_wf=bad_wf, good_wf=good_wf)
            break

    winner_book = None
    # Prefer clear pocket on book symbols; compare 1h vs 1d
    candidates_book = []
    for sc, rule, m, ok in book_h_rank:
        if ok:
            candidates_book.append(('1h', rule, m, sc))
    for sc, rule, m, ok in book_d_rank:
        if ok:
            candidates_book.append(('1d', rule, m, sc))
    candidates_book.sort(key=lambda x: -x[3])
    if candidates_book:
        tf, rule, m, sc = candidates_book[0]
        cells = [r for r in rows_out if r['rule'] == rule and r['sym'] in BOOK and r['interval'] == tf]
        winner_book = dict(rule=rule, m=m, score=sc, tf=tf, cells=cells)

    # If no pure-book winner, check book+ctrl for SuperTrend/Donchian
    if winner_book is None:
        for label, d, tf in [('1h', book_ctrl_1h, '1h'), ('1d', book_ctrl_1d, '1d')]:
            ranked = rank_rules(d, True)
            for sc, rule, m, ok in ranked:
                if ok and rule.startswith('B_'):
                    cells = [r for r in rows_out if r['rule'] == rule and r['sym'] in (BOOK + BOOK_CTRL) and r['interval'] == tf]
                    winner_book = dict(rule=rule, m=m, score=sc, tf=tf, cells=cells, note='book+controls')
                    break
            if winner_book:
                break

    # Write RESULTS.md
    def fmt_m(m):
        return (f"n={m['n']} WR={m['winrate']:.1f}% avg_ret={m['avg_ret']:+.3f}% "
                f"sum_ret={m['sum_ret']:+.2f}% PF={m['PF']:.2f} maxDD={m['maxDD']:.2f}%")

    lines = []
    lines.append('# NEXUS Radar PRO — Backtest Results')
    lines.append('')
    lines.append(f'Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")} '
                 f'(≈ {(datetime.now(timezone.utc).astimezone()).strftime("%Y-%m-%d %H:%M")} local box)')
    lines.append('')
    lines.append('## Setup')
    lines.append('- **Exits (all):** stop 1.2 ATR · TP 2.5 ATR · trail 2.0 ATR · max 12 bars')
    lines.append('- **Soft liq:** rvol≥1.0 · atrpct≥0.8 · dollarVolM≥5 (liquid) / ≥0.5 (book)')
    lines.append('- **Liquid:** NVDA, TSLA, AMD, META, PLTR, SPY, QQQ')
    lines.append('- **Book:** SPCX, RKLB, ASTS (+ NVDA, TSLA controls)')
    lines.append('- **TFs:** 1h≈3mo · 1d=1y')
    lines.append('- **Gate:** reject aggregate n<5 or PF<1.1 (book pocket exception if clear)')
    lines.append('')

    lines.append('## CLEAR WINNERS')
    lines.append('')
    if winner_liq:
        lines.append(f'### (a) Liquid 1H — **{winner_liq["rule"]}**')
        lines.append(f'- Aggregate: `{fmt_m(winner_liq["m"])}`')
        lines.append(f'- Score: {winner_liq["score"]:.2f} · WF both-half cells: {winner_liq["good_wf"]} · one-half flags: {winner_liq["bad_wf"]}')
        lines.append('- Per symbol:')
        for c in sorted(winner_liq['cells'], key=lambda x: -x['score']):
            lines.append(f"  - {c['sym']}: n={c['n']} WR={c['winrate']}% avg={c['avg_ret']:+.3f} PF={c['PF']} DD={c['maxDD']} WF={c['wf_flag']}")
    else:
        lines.append('### (a) Liquid 1H — **NO CLEAR WINNER** (no rule passed n≥5 & PF≥1.1 & avg_ret>0)')
    lines.append('')

    if winner_book:
        note = winner_book.get('note', 'book-only')
        lines.append(f'### (b) Book {winner_book["tf"].upper()} — **{winner_book["rule"]}** ({note})')
        lines.append(f'- Aggregate: `{fmt_m(winner_book["m"])}`')
        lines.append(f'- Score: {winner_book["score"]:.2f}')
        lines.append('- Per symbol:')
        for c in sorted(winner_book['cells'], key=lambda x: -x['score']):
            lines.append(f"  - {c['sym']}: n={c['n']} WR={c['winrate']}% avg={c['avg_ret']:+.3f} PF={c['PF']} DD={c['maxDD']} WF={c['wf_flag']}")
    else:
        lines.append('### (b) Book 1H/1D — **NO CLEAR WINNER**')
    lines.append('')

    lines.append('## Aggregate tables')
    lines.append('')
    lines.append('### Liquid 1H')
    lines.append('| rule | n | winrate | avg_ret | sum_ret | PF | maxDD | PASS |')
    lines.append('|------|---|---------|---------|---------|----|-------|------|')
    for sc, rule, m, ok in liq_rank:
        lines.append(f"| {rule} | {m['n']} | {m['winrate']:.1f} | {m['avg_ret']:+.3f} | {m['sum_ret']:+.2f} | {m['PF']:.2f} | {m['maxDD']:.2f} | {'YES' if ok else 'no'} |")
    lines.append('')
    lines.append('### Liquid 1D')
    for sc, rule, m, ok in rank_rules(liquid_1d, False):
        lines.append(f"- {rule}: {fmt_m(m)} {'PASS' if ok else 'FAIL'}")
    lines.append('')
    lines.append('### Book 1H')
    lines.append('| rule | n | winrate | avg_ret | sum_ret | PF | maxDD | PASS |')
    lines.append('|------|---|---------|---------|---------|----|-------|------|')
    for sc, rule, m, ok in book_h_rank:
        lines.append(f"| {rule} | {m['n']} | {m['winrate']:.1f} | {m['avg_ret']:+.3f} | {m['sum_ret']:+.2f} | {m['PF']:.2f} | {m['maxDD']:.2f} | {'YES' if ok else 'no'} |")
    lines.append('')
    lines.append('### Book 1D')
    lines.append('| rule | n | winrate | avg_ret | sum_ret | PF | maxDD | PASS |')
    lines.append('|------|---|---------|---------|---------|----|-------|------|')
    for sc, rule, m, ok in book_d_rank:
        lines.append(f"| {rule} | {m['n']} | {m['winrate']:.1f} | {m['avg_ret']:+.3f} | {m['sum_ret']:+.2f} | {m['PF']:.2f} | {m['maxDD']:.2f} | {'YES' if ok else 'no'} |")
    lines.append('')

    lines.append('### Book+Controls (NVDA,TSLA + book)')
    lines.append('**1H:**')
    for sc, rule, m, ok in rank_rules(book_ctrl_1h, True):
        lines.append(f"- {rule}: {fmt_m(m)} {'PASS' if ok else 'FAIL'}")
    lines.append('**1D:**')
    for sc, rule, m, ok in rank_rules(book_ctrl_1d, True):
        lines.append(f"- {rule}: {fmt_m(m)} {'PASS' if ok else 'FAIL'}")
    lines.append('')

    lines.append('## Walk-forward flags (one-half only = fragile)')
    fragile = [r for r in rows_out if r['wf_flag'] in ('FIRST_ONLY', 'SECOND_ONLY') and r['n'] >= 3]
    if not fragile:
        lines.append('_No fragile cells with n≥3._')
    else:
        for r in sorted(fragile, key=lambda x: (x['rule'], x['sym'])):
            lines.append(f"- {r['sym']} {r['interval']} {r['rule']}: {r['wf_flag']} "
                         f"(H1 n={r['wf1_n']} avg={r['wf1_avg']} PF={r['wf1_PF']} | "
                         f"H2 n={r['wf2_n']} avg={r['wf2_avg']} PF={r['wf2_PF']})")
    lines.append('')

    lines.append('## Rejected / notes')
    lines.append('- Any aggregate with n<5 or PF<1.1 rejected unless book shows a clear positive pocket.')
    lines.append('- B_DONCHIAN_D evaluated on 1D only by design.')
    lines.append('- HYBRID requires ≥2 of {L_EMA_RECLAIM, L_RSI50, L_VWAP_RECLAIM} same bar + soft liq.')
    lines.append('')

    # Persist winners JSON for SPEC writer
    winners = {
        'liquid_1h': None if not winner_liq else {
            'rule': winner_liq['rule'], **{k: winner_liq['m'][k] for k in ('n', 'winrate', 'avg_ret', 'sum_ret', 'PF', 'maxDD')},
            'score': winner_liq['score'],
        },
        'book': None if not winner_book else {
            'rule': winner_book['rule'], 'tf': winner_book['tf'],
            **{k: winner_book['m'][k] for k in ('n', 'winrate', 'avg_ret', 'sum_ret', 'PF', 'maxDD')},
            'score': winner_book['score'],
            'note': winner_book.get('note', 'book-only'),
        },
        'liquid_1h_all': {r: liquid_1h[r] for r in RULES},
        'book_1h_all': {r: book_1h[r] for r in RULES},
        'book_1d_all': {r: book_1d[r] for r in RULES},
    }
    with open(OUT / 'winners.json', 'w') as f:
        json.dump(winners, f, indent=2, default=float)

    res_path = OUT / 'RESULTS.md'
    res_path.write_text('\n'.join(lines) + '\n')
    print(f'Wrote {res_path}')
    print('WINNER LIQUID 1H:', winners['liquid_1h'])
    print('WINNER BOOK:', winners['book'])
    return winners


if __name__ == '__main__':
    main()
