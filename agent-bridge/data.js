/** AGENT BRIDGE — demo roster & mission data (not live API) */
export const AGENTS = [
  {
    id: "4e4726be-c0d9-4c4e-b7e9-0bf2ce6d4ca4",
    key: "cos",
    name: "CHIEF OF STAFF",
    short: "CoS",
    role: "Routes · decides · surfaces only what needs you",
    status: "Ready",
    accent: "#22d3ee",
    lastFocus: "Prioritizing Optima→AETHER handoff + options desk queue",
    beats: [
      { t: "2m ago", text: "Routed design brief to Aether Design; flagged Eng for HUD shell sync." },
      { t: "18m ago", text: "Surfaced CMC liaison note from Data Architect — needs your eyes on schema freeze." },
      { t: "1h ago", text: "Parked low-priority inbox digests; Email Summarize watching overnight." },
    ],
  },
  {
    id: "27c5d828-61a9-460f-b8e8-3f8e521819eb",
    key: "aether-design",
    name: "Aether Design",
    short: "Design",
    role: "Product design for AETHER finance OS",
    status: "Watching",
    accent: "#e879f9",
    lastFocus: "HUD chrome + glass panel system for trading desk",
    beats: [
      { t: "12m ago", text: "Pushed neon node graph motifs for command surfaces (DEMO ACTIVITY)." },
      { t: "45m ago", text: "Explored density modes for 1280×800 ops boards." },
      { t: "2h ago", text: "Aligned motion language with CoS routing pulses." },
    ],
  },
  {
    id: "7d8c5c8a-8fb3-403b-a508-4453da203e6f",
    key: "aether-eng",
    name: "Aether Engineer",
    short: "Engineer",
    role: "Implements AETHER HUD",
    status: "Ready",
    accent: "#34d399",
    lastFocus: "Wireframe → component map for Sense→Act pipeline UI",
    beats: [
      { t: "8m ago", text: "Stubbed static HUD shell; awaiting design tokens (DEMO ACTIVITY)." },
      { t: "40m ago", text: "Scaffolded agent node graph SVG layer." },
      { t: "3h ago", text: "Noted portability: vanilla HTML/JS, no build step." },
    ],
  },
  {
    id: "5559b158-bc92-4776-928e-be0e37fc5a7e",
    key: "data-arch",
    name: "Data Architect",
    short: "Data",
    role: "CMC / Alembic / pharma data models",
    status: "Watching",
    accent: "#a78bfa",
    lastFocus: "CMC liaison schema — Alembic migration draft",
    beats: [
      { t: "25m ago", text: "Drafted entity map for CMC batch records (DEMO ACTIVITY)." },
      { t: "1h ago", text: "Flagged Alembic revision conflict risk on staging." },
      { t: "4h ago", text: "Synced naming conventions with AETHER finance models." },
    ],
  },
  {
    id: "17bbdf6d-6d15-4de1-9870-9e58b2812e08",
    key: "stock",
    name: "Stock Analyser",
    short: "Stocks",
    role: "Options & tape",
    status: "Ready",
    accent: "#fbbf24",
    lastFocus: "Options desk: IV surface + unusual flow watchlist",
    beats: [
      { t: "5m ago", text: "Marked DEMO tape snapshot — no live connector metrics." },
      { t: "35m ago", text: "Outlined gamma levels for desk briefing." },
      { t: "2h ago", text: "Queued overnight unusual-options digest template." },
    ],
  },
  {
    id: "4e08c3e9-ea4a-47c2-8ace-a63a152ab5e6",
    key: "email",
    name: "Email - Summarize",
    short: "Email",
    role: "Inbox digests",
    status: "Idle",
    accent: "#38bdf8",
    lastFocus: "Overnight digest template — vendors & CMC threads",
    beats: [
      { t: "1h ago", text: "Prepared DEMO digest buckets (action / FYI / noise)." },
      { t: "3h ago", text: "Watching for high-signal CMC liaison mail." },
      { t: "6h ago", text: "Cleared stale threads from last cycle." },
    ],
  },
  {
    id: "34a2f62b-588d-4f91-82b0-454dcc48d4ea",
    key: "aether-room",
    name: "Aether (room)",
    short: "Room",
    role: "Group channel for AETHER",
    status: "Watching",
    accent: "#fb7185",
    lastFocus: "Cross-agent AETHER sync channel",
    beats: [
      { t: "15m ago", text: "Mirrored Design→Eng handoff note (DEMO ACTIVITY)." },
      { t: "50m ago", text: "Pinned Optima→AETHER seed checklist." },
      { t: "5h ago", text: "Room idle — awaiting CoS broadcast." },
    ],
  },
];

export const MISSIONS = [
  {
    title: "Optima → AETHER seed",
    detail: "Migrate seed UX & data contracts into AETHER finance OS.",
  },
  {
    title: "Options desk",
    detail: "IV / flow watch — Stock Analyser briefing CoS before act.",
  },
  {
    title: "CMC liaison",
    detail: "Pharma CMC models via Data Architect; schema freeze pending.",
  },
];

export const PIPELINE = [
  { id: "sense", label: "Sense", pct: 82, note: "Signals in · email / tape / room" },
  { id: "model", label: "Model", pct: 64, note: "Schemas · HUD · risk frames" },
  { id: "act", label: "Act", pct: 41, note: "Ship stubs · digests · routes" },
  { id: "review", label: "Review", pct: 28, note: "CoS surfaces only what needs you" },
];

export const TICKER = [
  "DEMO · AGENT BRIDGE live board — not connected to production APIs",
  "CoS routing Optima→AETHER · Design + Engineer in sync",
  "Stock Analyser watching options desk (demo tape)",
  "Data Architect · CMC / Alembic models in review",
  "Email Summarize · overnight digest template armed",
  "Aether room · group channel quiet · CoS can broadcast",
];
