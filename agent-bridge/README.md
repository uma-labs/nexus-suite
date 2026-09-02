# AGENT BRIDGE

Futuristic multi-agent command dashboard for **Umapathy Dhanapal** — dark cinematic ops board with CHIEF OF STAFF at the center and orbiting specialist agents.

## Open it

```bash
cd /workspace/agent-bridge
python3 server.py
```

Then visit **http://127.0.0.1:8791/**

Or from another host on the network: `http://<box-ip>:8791/`

## Notes

- Vanilla HTML + CSS + JS (ES modules). No build step.
- All activity, pipeline %, and beats are **DEMO ACTIVITY** — not live connector metrics.
- Agent UUIDs in `data.js` match the real roster ids.
- Screenshots can go in `shots/`.
- Clock uses America/New_York (ET).

## Files

| File        | Role                          |
|-------------|-------------------------------|
| index.html  | Shell layout                  |
| styles.css  | Dark neon / glass UI          |
| app.js      | Graph, drawer, clock, ticker  |
| data.js     | Agents, missions, pipeline    |
| server.py   | Static server on port 8791    |
