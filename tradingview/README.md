# NEXUS Radar · Entry/Exit + Scan

TradingView Pine Script v5 indicator: confluence entries/exits + screener columns.

## Install
1. Open [TradingView](https://www.tradingview.com/) → any chart
2. Bottom panel → **Pine Editor** → **Open** → **New blank indicator**
3. Delete the stub, paste `NexusRadar.pine`, **Save**, then **Add to chart**

## Chart
- Green/red triangles = entries; orange X = exits
- Aqua/gold/pink EMAs = 9/21/55 stack
- Lines = entry, stop, TP1, TP2 for the active trade
- Top-right table = bias, score, RVOL, ATR%, scan pass, setup

## Screener (focus only on pass tickers)
1. TradingView → **Products** → **Screeners** → **Stock screener** (or Pine Screener where available)
2. Add this script / choose columns from the indicator:
   - **Scan Pass** = 1
   - optionally **Long Setup** = 1 or **Short Setup** = 1
3. Sort by **Confluence Score** or **Rel Volume**
4. Click through the short list only

## Alerts
Right-click chart → **Add alert** → Condition: NEXUS Radar → Long Entry / Short Entry / Exit / Scan Pass.

## Suggested defaults (liquid US names)
Leave defaults. For quieter names, lower Min avg $ volume to 5–10M. For 0DTE-style underlyings, use 5m/15m chart + HTF 60.

## Disclaimer
Signals only — not financial advice. Past patterns do not guarantee future results.
