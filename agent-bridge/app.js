import { AGENTS, MISSIONS, PIPELINE, TICKER } from "./data.js";

const orbitAgents = AGENTS.filter((a) => a.key !== "cos");
const cos = AGENTS.find((a) => a.key === "cos");

/** Orbit layout angles (degrees) — even spread around CoS */
const ORBIT_ANGLES = [270, 330, 30, 90, 150, 210];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

/* —— Clock (America/New_York) —— */
function tickClock() {
  const clock = document.getElementById("clock");
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  clock.textContent = fmt.format(now) + " ET";
  clock.setAttribute("datetime", now.toISOString());
}

/* —— Missions —— */
function renderMissions() {
  const list = document.getElementById("missions");
  list.replaceChildren(
    ...MISSIONS.map((m) =>
      el("li", {}, el("strong", { text: m.title }), el("span", { text: m.detail }))
    )
  );
}

/* —— Pipeline —— */
function renderPipeline() {
  const root = document.getElementById("pipeline");
  root.replaceChildren(
    ...PIPELINE.map((p) => {
      const fill = el("i");
      const stage = el(
        "div",
        { className: "pipe-stage" },
        el(
          "div",
          { className: "pipe-head" },
          el("span", { className: "label", text: p.label }),
          el("span", { className: "pct", text: p.pct + "%" })
        ),
        el("div", { className: "pipe-note", text: p.note }),
        el("div", { className: "bar" }, fill)
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = p.pct + "%";
        });
      });
      return stage;
    })
  );
}

/* —— Ticker —— */
function renderTicker() {
  const inner = document.getElementById("ticker");
  const text = TICKER.map((t) => `<span>${escapeHtml(t)}</span>`).join("");
  inner.innerHTML = text + text;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* —— Graph geometry —— */
function stageSize() {
  const stage = document.getElementById("stage");
  const r = stage.getBoundingClientRect();
  return { w: r.width, h: r.height, cx: r.width / 2, cy: r.height / 2 };
}

function orbitRadius(w, h) {
  return Math.min(w, h) * 0.34;
}

function posFor(angleDeg, cx, cy, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius,
    y: cy + Math.sin(rad) * radius,
  };
}

function bezierPath(x1, y1, x2, y2, cx, cy) {
  // Soft curve pulling slightly toward center then out
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = mx - cx;
  const dy = my - cy;
  const pull = 0.22;
  const c1x = x1 + (mx - x1) * 0.45 + dx * pull * 0.3;
  const c1y = y1 + (my - y1) * 0.45 + dy * pull * 0.3;
  const c2x = x2 - (x2 - mx) * 0.45 + dx * pull * 0.3;
  const c2y = y2 - (y2 - my) * 0.45 + dy * pull * 0.3;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

function renderGraph() {
  const { w, h, cx, cy } = stageSize();
  if (w < 40 || h < 40) return;

  const radius = orbitRadius(w, h);
  const svg = document.getElementById("graph-svg");
  const nodesRoot = document.getElementById("nodes");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.replaceChildren();
  nodesRoot.replaceChildren();

  // CoS node
  const cosNode = buildNode(cos, cx, cy, true);
  nodesRoot.appendChild(cosNode);

  orbitAgents.forEach((agent, i) => {
    const angle = ORBIT_ANGLES[i % ORBIT_ANGLES.length];
    const { x, y } = posFor(angle, cx, cy, radius);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", bezierPath(cx, cy, x, y, cx, cy));
    path.setAttribute("class", "link active");
    path.style.stroke = agent.accent;
    path.style.color = agent.accent;
    path.dataset.key = agent.key;
    svg.appendChild(path);

    nodesRoot.appendChild(buildNode(agent, x, y, false));
  });
}

function buildNode(agent, x, y, isCos) {
  const node = el("div", {
    className: "node" + (isCos ? " cos" : ""),
    role: "button",
    tabindex: "0",
    "data-key": agent.key,
    "aria-label": agent.name,
    style: `left:${x}px;top:${y}px;color:${agent.accent}`,
  });

  const orbText = isCos ? "CoS" : agent.short.slice(0, 6);
  node.appendChild(el("div", { className: "orb", text: orbText }));
  node.appendChild(el("div", { className: "label", text: agent.name }));
  if (isCos) {
    node.appendChild(el("div", { className: "role", text: agent.role }));
  } else {
    node.appendChild(el("div", { className: "status", text: agent.status }));
  }

  const open = () => openDrawer(agent.key);
  node.addEventListener("click", open);
  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
  return node;
}

/* —— Drawer —— */
let selectedKey = null;

function openDrawer(key) {
  const agent = AGENTS.find((a) => a.key === key);
  if (!agent) return;
  selectedKey = key;

  document.querySelectorAll(".node").forEach((n) => {
    n.classList.toggle("selected", n.dataset.key === key);
  });

  document.getElementById("d-name").textContent = agent.name;
  document.getElementById("d-id").textContent = agent.id;
  document.getElementById("d-role").textContent = agent.role;
  const st = document.getElementById("d-status");
  st.textContent = agent.status;
  st.className = "v status-" + agent.status;
  document.getElementById("d-key").textContent = agent.key;
  document.getElementById("d-focus").textContent = "Last focus: " + agent.lastFocus;

  const beats = document.getElementById("d-beats");
  beats.replaceChildren(
    ...agent.beats.map((b) =>
      el("li", {}, el("span", { className: "when", text: b.t }), document.createTextNode(b.text))
    )
  );

  const drawer = document.getElementById("drawer");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  selectedKey = null;
  document.querySelectorAll(".node").forEach((n) => n.classList.remove("selected"));
  const drawer = document.getElementById("drawer");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

/* —— Init —— */
function init() {
  renderMissions();
  renderPipeline();
  renderTicker();
  tickClock();
  setInterval(tickClock, 1000);
  renderGraph();

  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  document.getElementById("stage").addEventListener("click", (e) => {
    if (e.target.id === "stage" || e.target.id === "graph-svg" || e.target.id === "nodes") {
      closeDrawer();
    }
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const keep = selectedKey;
      renderGraph();
      if (keep) openDrawer(keep);
    }, 120);
  });
}

init();
