# AETHER v1.0 - Adaptive Expense & Fee Reduction OS

Personal finance HUD for the fictional **Orion household** (Jordan Orion + Sam Orion). Client-side only.

**Do not confuse with other demos.** Original sample data and UI.

## Run

    cd /workspace/aether
    python3 -m http.server 8790

Open http://localhost:8790/

Optional: python3 server.py (same port 8790).

No npm, no API keys, no backend.

## Files

- index.html - Futuristic glass HUD + inline CSS/JS + pillar math
- data.js - Sample Orion accounts, fees, debits, subs, bills, debts
- server.py - Tiny static HTTP server (port 8790)
- README.md - This file

## Product pillars

1. Fee Radar - Overdraft/NSF, ATM OON, foreign TX, late payment, maintenance, wire; dollars saved this month from prevented events.
2. Debit Shield - Checking vs upcoming debits vs $750 safety floor; float vs pay-now advice.
3. Subscription Drain - Kill/keep list with annualized waste from unused SaaS/cloud.
4. Bill Float Calendar - Next ~30 days; recommended pay dates for cash runway.
5. Debt Ladder - Avalanche by APR; leftover budget on highest-rate card.
6. Cash Runway - Days of liquid cash at burn rate; next paycheck.

## Sample snapshot (invented)

- Checking $2,840 / Savings $6,200 / Safety floor $750
- Debts: Aurora Card 24.9% APR, Comet Card 19.99%, Horizon Loan 11.5%
- Leftover for avalanche: $450/mo after mins

## License

Demo / educational sample. Not financial advice.
