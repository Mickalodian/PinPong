const canvas = document.getElementById("game");
if (!canvas) throw new Error("Canvas #game not found");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const SCORE_LIMIT = 5;

const table = { x: 38, y: 26, w: W - 76, h: H - 52 };
const paddle = { w: 14, h: 110, inset: 18, aiSpeed: 560 };
const ballCfg = { r: 8, speed0: 430, speedMax: 1180 };

const SAVE_CACHE_KEY = "pong-bw-save";
const PLAYER_ID_KEY = "pong-player-id";
const PLAYER_NAME_KEY = "pong-player-name";
const ADMIN_SESSION_KEY = "pong-admin-until";
const ADMIN_PASSKEY = "4536";
const ABILITIES_KEY = "pong-bw-abilities";
const POINTS_PER_WIN = 2;
const POINTS_PER_BOT_CLEAR = 5;
const PARRY_CHARGE_NEED = 10;
const FIRE_SMASH_SPEED = 1650;

const SHOP = {
  paddle: [
    { id: "white", name: "Classic", price: 0, style: "solid", color: "#ffffff" },
    { id: "blue", name: "Blue", price: 4, style: "solid", color: "#3b82f6" },
    { id: "pink", name: "Pink", price: 4, style: "solid", color: "#ec4899" },
    { id: "orange", name: "Orange", price: 4, style: "solid", color: "#f97316" },
    { id: "red", name: "Red", price: 4, style: "solid", color: "#ef4444" },
    { id: "green", name: "Green", price: 4, style: "solid", color: "#22c55e" },
    { id: "yellow", name: "Yellow", price: 4, style: "solid", color: "#eab308" },
    { id: "purple", name: "Purple", price: 4, style: "solid", color: "#a855f7" },
    { id: "cyan", name: "Cyan", price: 4, style: "solid", color: "#06b6d4" },
    { id: "galaxy", name: "Galaxy", price: 20, style: "galaxy" },
    { id: "moon", name: "Moon", price: 22, style: "moon" },
    { id: "sunset", name: "Sunset", price: 24, style: "sunset" },
    { id: "neon", name: "Neon", price: 26, style: "neon" },
    { id: "lava", name: "Lava", price: 24, style: "lava" },
    { id: "ice", name: "Ice", price: 22, style: "ice" },
    { id: "rainbow", name: "Rainbow", price: 28, style: "rainbow" },
    { id: "aurora", name: "Aurora", price: 26, style: "aurora" },
    { id: "nebula", name: "Nebula Flow", price: 50, style: "nebula", epic: true },
    { id: "interstellar", name: "Interstellar", price: 55, style: "interstellar", epic: true },
    { id: "voidpulse", name: "Void Pulse", price: 58, style: "voidpulse", epic: true },
    { id: "solarflare", name: "Solar Flare", price: 60, style: "solarflare", epic: true },
    { id: "plasma", name: "Plasma Core", price: 62, style: "plasma", epic: true },
    { id: "quantum", name: "Quantum Drift", price: 65, style: "quantum", epic: true },
    { id: "darkmatter", name: "Dark Matter", price: 70, style: "darkmatter", epic: true },
    { id: "hypernova", name: "Hypernova", price: 75, style: "hypernova", epic: true },
  ],
  table: [
    { id: "classic", name: "Classic", price: 0, style: "solid", color: "#000000" },
    { id: "blue", name: "Blue", price: 4, style: "solid", color: "#1e3a8a" },
    { id: "pink", name: "Pink", price: 4, style: "solid", color: "#9d174d" },
    { id: "orange", name: "Orange", price: 4, style: "solid", color: "#9a3412" },
    { id: "red", name: "Red", price: 4, style: "solid", color: "#991b1b" },
    { id: "green", name: "Green", price: 4, style: "solid", color: "#14532d" },
    { id: "yellow", name: "Yellow", price: 4, style: "solid", color: "#854d0e" },
    { id: "purple", name: "Purple", price: 4, style: "solid", color: "#581c87" },
    { id: "cyan", name: "Cyan", price: 4, style: "solid", color: "#155e75" },
    { id: "galaxy", name: "Galaxy", price: 20, style: "galaxy" },
    { id: "moon", name: "Moon", price: 22, style: "moon" },
    { id: "sunset", name: "Sunset", price: 24, style: "sunset" },
    { id: "neon", name: "Neon", price: 26, style: "neon" },
    { id: "lava", name: "Lava", price: 24, style: "lava" },
    { id: "ice", name: "Ice", price: 22, style: "ice" },
    { id: "rainbow", name: "Rainbow", price: 28, style: "rainbow" },
    { id: "aurora", name: "Aurora", price: 26, style: "aurora" },
    { id: "nebula", name: "Nebula Flow", price: 50, style: "nebula", epic: true },
    { id: "interstellar", name: "Interstellar", price: 55, style: "interstellar", epic: true },
    { id: "voidpulse", name: "Void Pulse", price: 58, style: "voidpulse", epic: true },
    { id: "solarflare", name: "Solar Flare", price: 60, style: "solarflare", epic: true },
    { id: "plasma", name: "Plasma Core", price: 62, style: "plasma", epic: true },
    { id: "quantum", name: "Quantum Drift", price: 65, style: "quantum", epic: true },
    { id: "darkmatter", name: "Dark Matter", price: 70, style: "darkmatter", epic: true },
    { id: "hypernova", name: "Hypernova", price: 75, style: "hypernova", epic: true },
  ],
};

const save = {
  name: "",
  points: 0,
  maxBotCleared: 0,
  owned: { paddle: ["white"], table: ["classic"] },
  equipped: { paddle: "white", table: "classic" },
  shopTab: "paddle",
  abilities: { megaPaddle: false, freeShop: false, slowBot: false, bonusPts: false },
};

function isAdmin() {
  const until = parseInt(sessionStorage.getItem(ADMIN_SESSION_KEY) || "0", 10);
  return Date.now() < until;
}

function sanitizeName(name) {
  const clean = String(name || "")
    .trim()
    .replace(/[^\w\s\-'.]/g, "")
    .slice(0, 16);
  return clean;
}

function getPlayerName() {
  return sanitizeName(save.name || localStorage.getItem(PLAYER_NAME_KEY) || "");
}

function hasValidName() {
  return getPlayerName().length >= 1;
}

function setPlayerName(name) {
  const clean = sanitizeName(name);
  if (!clean) return false;
  save.name = clean;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, clean);
  } catch {
    /* ignore */
  }
  persistSave();
  updateNameUI();
  return true;
}

function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function applyProfile(data) {
  if (typeof data.name === "string" && sanitizeName(data.name)) save.name = sanitizeName(data.name);
  if (typeof data.points === "number") save.points = data.points;
  if (typeof data.maxBotCleared === "number") {
    save.maxBotCleared = Math.max(0, Math.min(100, Math.floor(data.maxBotCleared)));
  }
  if (data.owned?.paddle) save.owned.paddle = data.owned.paddle;
  if (data.owned?.table) save.owned.table = data.owned.table;
  if (data.equipped?.paddle) save.equipped.paddle = data.equipped.paddle;
  if (data.equipped?.table) save.equipped.table = data.equipped.table;
  if (!save.owned.paddle.includes("white")) save.owned.paddle.unshift("white");
  if (!save.owned.table.includes("classic")) save.owned.table.unshift("classic");
}

function getPlayerLevel() {
  return Math.max(0, Math.min(100, save.maxBotCleared || 0));
}

function isBotLevelUnlocked(level) {
  return level === 1 || level <= (save.maxBotCleared || 0) + 1;
}

function playerLevelStyle(level) {
  const lv = Math.max(0, Math.min(100, level || 0));
  if (lv <= 0) return { color: "#9ca3af", animated: false, className: "lvl-0" };
  if (lv < 5) return { color: "#d1d5db", animated: false, className: "lvl-1" };
  if (lv < 10) return { color: "#86efac", animated: false, className: "lvl-5" };
  if (lv < 15) return { color: "#67e8f9", animated: false, className: "lvl-10" };
  if (lv < 20) return { color: "#c084fc", animated: false, className: "lvl-15" };
  if (lv < 40) return { color: null, animated: true, className: "lvl-20" };
  if (lv < 60) return { color: null, animated: true, className: "lvl-40" };
  if (lv < 80) return { color: null, animated: true, className: "lvl-60" };
  if (lv < 100) return { color: null, animated: true, className: "lvl-80" };
  return { color: null, animated: true, className: "lvl-100" };
}

function canvasLevelColor(level) {
  if (level == null) return "#ffffff";
  const lv = Math.max(0, Math.min(100, level || 0));
  const t = performance.now() * 0.001;
  if (lv <= 0) return "#9ca3af";
  if (lv < 5) return "#d1d5db";
  if (lv < 10) return "#86efac";
  if (lv < 15) return "#67e8f9";
  if (lv < 20) return "#c084fc";
  if (lv < 40) {
    const a = (Math.sin(t * 2) * 0.5 + 0.5);
    return a > 0.5 ? "#f472b6" : "#a78bfa";
  }
  if (lv < 60) {
    const a = (Math.sin(t * 2.4) * 0.5 + 0.5);
    return a > 0.5 ? "#22d3ee" : "#fbbf24";
  }
  if (lv < 80) {
    const a = (Math.sin(t * 3) * 0.5 + 0.5);
    return a > 0.5 ? "#fb7185" : "#34d399";
  }
  if (lv < 100) {
    const hues = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
    return hues[Math.floor(t * 4) % hues.length];
  }
  const hues = ["#ff4d6d", "#ff9f1c", "#ffd166", "#06d6a0", "#4cc9f0", "#7b2cbf"];
  return hues[Math.floor(t * 6) % hues.length];
}

function formatNameWithLevel(name, level) {
  const n = String(name || "Player");
  const lv = Math.max(0, Math.min(100, level || 0));
  return `${n} · L${lv}`;
}

function applyLevelClass(el, level) {
  if (!el) return;
  el.classList.remove(
    "lvl-0", "lvl-1", "lvl-5", "lvl-10", "lvl-15",
    "lvl-20", "lvl-40", "lvl-60", "lvl-80", "lvl-100", "player-level"
  );
  el.style.color = "";
  if (level == null) return;
  const style = playerLevelStyle(level);
  el.classList.add("player-level", style.className);
  if (style.color) el.style.color = style.color;
}

function awardBotClear(level) {
  if (s.mode !== "local") return 0;
  const lv = Math.max(1, Math.min(100, level || s.botLevel));
  if (lv <= save.maxBotCleared) return 0;
  save.maxBotCleared = lv;
  save.points += POINTS_PER_BOT_CLEAR;
  persistSave();
  updatePointsUI();
  updateNameUI();
  return POINTS_PER_BOT_CLEAR;
}

function profilePayload() {
  return {
    name: save.name,
    points: save.points,
    maxBotCleared: save.maxBotCleared,
    owned: save.owned,
    equipped: save.equipped,
  };
}

function loadAbilities() {
  if (!isAdmin()) return;
  try {
    const raw = localStorage.getItem(ABILITIES_KEY);
    if (raw) Object.assign(save.abilities, JSON.parse(raw));
  } catch {
    /* ignore */
  }
}

function persistAbilities() {
  if (!isAdmin()) return;
  try {
    localStorage.setItem(ABILITIES_KEY, JSON.stringify(save.abilities));
  } catch {
    /* ignore */
  }
}

async function syncProfileFromServer() {
  if (!location.host) return;
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", playerId: getPlayerId() }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.profile) {
      applyProfile(data.profile);
      localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(profilePayload()));
    }
  } catch {
    /* offline */
  }
}

let profileSyncTimer = null;
async function syncProfileToServer() {
  if (!location.host) return;
  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        playerId: getPlayerId(),
        profile: profilePayload(),
      }),
    });
  } catch {
    /* offline */
  }
}

async function loadSave() {
  loadAbilities();
  try {
    const raw = localStorage.getItem(PLAYER_NAME_KEY);
    if (raw) save.name = sanitizeName(raw);
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(SAVE_CACHE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.name) save.name = sanitizeName(data.name);
      applyProfile(data);
    }
  } catch {
    /* ignore */
  }
  await syncProfileFromServer();
  if (save.name) {
    try {
      localStorage.setItem(PLAYER_NAME_KEY, save.name);
    } catch {
      /* ignore */
    }
  }
}

function persistSave() {
  try {
    localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(profilePayload()));
    if (save.name) localStorage.setItem(PLAYER_NAME_KEY, save.name);
    persistAbilities();
    clearTimeout(profileSyncTimer);
    profileSyncTimer = setTimeout(syncProfileToServer, 300);
    if (s.mode === "online" && net.connected) sendCosmetics();
  } catch {
    /* ignore */
  }
}

function shopItem(kind, id) {
  return SHOP[kind].find((i) => i.id === id) || SHOP[kind][0];
}

function updatePointsUI() {
  if (ui.shopPoints) ui.shopPoints.textContent = String(save.points);
}

function awardWinPoints(winner) {
  const won =
    s.mode === "local"
      ? winner === "p1"
      : (winner === "p1" && net.player === 1) || (winner === "p2" && net.player === 2);
  if (!won) return 0;
  const gain = isAdmin() && save.abilities.bonusPts ? 10 : POINTS_PER_WIN;
  save.points += gain;
  persistSave();
  updatePointsUI();
  return gain;
}

function effectivePaddleH(side) {
  if (side === mySide() && isAdmin() && save.abilities.megaPaddle) {
    return Math.round(paddle.h * 1.55);
  }
  return paddle.h;
}

function mySide() {
  if (s.mode === "local") return "p1";
  if (s.mode === "online" && net.player === 1) return "p1";
  if (s.mode === "online" && net.player === 2) return "p2";
  return null;
}

function applyFillStyle(c, item, x, y, w, h, alpha) {
  const t = performance.now() * 0.001;
  if (item.style === "solid") {
    c.globalAlpha = alpha;
    c.fillStyle = item.color;
    return;
  }
  let g;
  if (item.style === "galaxy") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#0b0320");
    g.addColorStop(0.4, "#4c1d95");
    g.addColorStop(0.7, "#7c3aed");
    g.addColorStop(1, "#0ea5e9");
  } else if (item.style === "moon") {
    g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#1e293b");
    g.addColorStop(0.45, "#94a3b8");
    g.addColorStop(1, "#e2e8f0");
  } else if (item.style === "sunset") {
    g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#f97316");
    g.addColorStop(0.5, "#ec4899");
    g.addColorStop(1, "#7c3aed");
  } else if (item.style === "neon") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#22c55e");
    g.addColorStop(0.5, "#06b6d4");
    g.addColorStop(1, "#a855f7");
  } else if (item.style === "lava") {
    g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#fef08a");
    g.addColorStop(0.4, "#f97316");
    g.addColorStop(1, "#991b1b");
  } else if (item.style === "ice") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#e0f2fe");
    g.addColorStop(0.5, "#38bdf8");
    g.addColorStop(1, "#1e3a8a");
  } else if (item.style === "rainbow") {
    g = c.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, "#ef4444");
    g.addColorStop(0.25, "#eab308");
    g.addColorStop(0.5, "#22c55e");
    g.addColorStop(0.75, "#3b82f6");
    g.addColorStop(1, "#a855f7");
  } else if (item.style === "aurora") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#064e3b");
    g.addColorStop(0.4 + Math.sin(t) * 0.06, "#10b981");
    g.addColorStop(0.75, "#6366f1");
    g.addColorStop(1, "#312e81");
  } else if (item.style === "nebula") {
    const ox = Math.sin(t * 0.7) * w * 0.35;
    const oy = Math.cos(t * 0.55) * h * 0.25;
    g = c.createLinearGradient(x + ox, y + oy, x + w - ox, y + h - oy);
    g.addColorStop(0, "#12002b");
    g.addColorStop(0.25 + Math.sin(t) * 0.05, "#7c3aed");
    g.addColorStop(0.55, "#ec4899");
    g.addColorStop(0.8, "#38bdf8");
    g.addColorStop(1, "#0b0320");
  } else if (item.style === "interstellar") {
    const shift = ((t * 0.18) % 1);
    g = c.createLinearGradient(x - w * shift, y, x + w * (1.4 - shift), y + h);
    g.addColorStop(0, "#020617");
    g.addColorStop(0.2, "#1e3a8a");
    g.addColorStop(0.45, "#67e8f9");
    g.addColorStop(0.65, "#c084fc");
    g.addColorStop(0.85, "#f472b6");
    g.addColorStop(1, "#020617");
  } else if (item.style === "voidpulse") {
    const pulse = 0.35 + Math.sin(t * 2.2) * 0.2;
    g = c.createRadialGradient(x + w * 0.5, y + h * 0.5, 1, x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.9);
    g.addColorStop(0, "#f0abfc");
    g.addColorStop(pulse * 0.45, "#7c3aed");
    g.addColorStop(0.7, "#1e1b4b");
    g.addColorStop(1, "#02010a");
  } else if (item.style === "solarflare") {
    const ox = Math.sin(t * 1.4) * w * 0.4;
    g = c.createLinearGradient(x + ox, y, x + w - ox, y + h);
    g.addColorStop(0, "#450a0a");
    g.addColorStop(0.25, "#ea580c");
    g.addColorStop(0.5 + Math.sin(t * 2) * 0.08, "#fde047");
    g.addColorStop(0.75, "#fb7185");
    g.addColorStop(1, "#7f1d1d");
  } else if (item.style === "plasma") {
    const a = t * 1.1;
    g = c.createLinearGradient(x + Math.cos(a) * w * 0.3, y + Math.sin(a) * h * 0.3, x + w, y + h);
    g.addColorStop(0, "#022c22");
    g.addColorStop(0.3, "#22d3ee");
    g.addColorStop(0.55, "#a3e635");
    g.addColorStop(0.8, "#f472b6");
    g.addColorStop(1, "#312e81");
  } else if (item.style === "quantum") {
    const s1 = (Math.sin(t * 1.3) + 1) * 0.5;
    g = c.createLinearGradient(x, y + h * s1, x + w, y + h * (1 - s1));
    g.addColorStop(0, "#0f172a");
    g.addColorStop(0.2, "#22d3ee");
    g.addColorStop(0.45, "#ffffff");
    g.addColorStop(0.7, "#818cf8");
    g.addColorStop(1, "#0f172a");
  } else if (item.style === "darkmatter") {
    const ox = Math.cos(t * 0.8) * w * 0.5;
    const oy = Math.sin(t * 0.6) * h * 0.4;
    g = c.createRadialGradient(x + w * 0.5 + ox * 0.2, y + h * 0.5 + oy * 0.2, 2, x + w * 0.5, y + h * 0.5, Math.max(w, h));
    g.addColorStop(0, "#f5d0fe");
    g.addColorStop(0.25, "#581c87");
    g.addColorStop(0.55, "#111827");
    g.addColorStop(0.8, "#4c1d95");
    g.addColorStop(1, "#000000");
  } else if (item.style === "hypernova") {
    const shift = ((t * 0.35) % 1);
    g = c.createLinearGradient(x, y - h * shift, x + w, y + h * (1.2 - shift));
    g.addColorStop(0, "#3b0764");
    g.addColorStop(0.2, "#ef4444");
    g.addColorStop(0.4, "#fbbf24");
    g.addColorStop(0.6, "#22d3ee");
    g.addColorStop(0.8, "#a855f7");
    g.addColorStop(1, "#3b0764");
  } else {
    c.globalAlpha = alpha;
    c.fillStyle = item.color || "#fff";
    return;
  }
  c.globalAlpha = alpha;
  c.fillStyle = g;
}

function drawEpicOverlay(c, item, x, y, w, h, alpha) {
  if (!item.epic) return;
  const t = performance.now() * 0.001;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();

  if (item.style === "nebula" || item.style === "interstellar" || item.style === "darkmatter") {
    for (let i = 0; i < 14; i++) {
      const px = x + ((Math.sin(t * 0.7 + i * 1.7) * 0.5 + 0.5) * w);
      const py = y + ((Math.cos(t * 0.9 + i * 2.1) * 0.5 + 0.5) * h);
      const r = 0.6 + (i % 3) * 0.5;
      c.globalAlpha = alpha * (0.35 + (Math.sin(t * 3 + i) * 0.5 + 0.5) * 0.45);
      c.fillStyle = i % 2 === 0 ? "#ffffff" : "#a5f3fc";
      c.beginPath();
      c.arc(px, py, r, 0, Math.PI * 2);
      c.fill();
    }
  }

  if (item.style === "interstellar" || item.style === "quantum") {
    for (let i = 0; i < 5; i++) {
      const yy = y + ((t * (18 + i * 7) + i * 17) % (h + 20)) - 10;
      c.globalAlpha = alpha * 0.28;
      c.strokeStyle = i % 2 ? "#67e8f9" : "#e879f9";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, yy);
      c.lineTo(x + w, yy + (i - 2) * 2);
      c.stroke();
    }
  }

  if (item.style === "solarflare" || item.style === "hypernova" || item.style === "plasma") {
    for (let i = 0; i < 4; i++) {
      const wave = Math.sin(t * 2.4 + i * 1.3);
      c.globalAlpha = alpha * (0.18 + Math.abs(wave) * 0.2);
      c.strokeStyle = item.style === "plasma" ? "#67e8f9" : "#fde047";
      c.lineWidth = 1.5;
      c.beginPath();
      for (let px = 0; px <= w; px += 2) {
        const py = y + h * (0.25 + i * 0.18) + Math.sin(px * 0.12 + t * 3 + i) * (4 + i * 2) * wave;
        if (px === 0) c.moveTo(x + px, py);
        else c.lineTo(x + px, py);
      }
      c.stroke();
    }
  }

  if (item.style === "voidpulse") {
    const pulse = (Math.sin(t * 2.5) * 0.5 + 0.5);
    c.globalAlpha = alpha * (0.2 + pulse * 0.35);
    c.strokeStyle = "#e879f9";
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
  }

  if (item.style === "hypernova") {
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const rg = c.createRadialGradient(cx, cy, 1, cx, cy, Math.max(w, h) * 0.7);
    rg.addColorStop(0, `rgba(255,255,255,${0.25 + Math.sin(t * 4) * 0.1})`);
    rg.addColorStop(0.4, "rgba(251,191,36,0.12)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = rg;
    c.fillRect(x, y, w, h);
  }

  c.restore();
  c.globalAlpha = 1;
}

function drawCosmeticFill(c, item, x, y, w, h, alpha) {
  applyFillStyle(c, item, x, y, w, h, alpha);
  c.fillRect(x, y, w, h);
  drawEpicOverlay(c, item, x, y, w, h, alpha);
  c.globalAlpha = 1;
}

const shopAnimSwatches = [];
let shopAnimRunning = false;

function drawSwatch(item, el) {
  const c = document.createElement("canvas");
  c.width = 120;
  c.height = 48;
  const cctx = c.getContext("2d");
  drawCosmeticFill(cctx, item, 0, 0, c.width, c.height, 1);
  el.style.backgroundImage = `url(${c.toDataURL()})`;
  el.style.backgroundSize = "cover";
  if (item.epic) {
    el.dataset.epicStyle = item.style;
    shopAnimSwatches.push({ el, item, canvas: c, ctx: cctx });
  }
}

function tickShopSwatches() {
  shopAnimRunning = false;
  if (!ui.customizeOverlay || ui.customizeOverlay.classList.contains("hidden")) {
    shopAnimSwatches.length = 0;
    return;
  }
  if (!shopAnimSwatches.length) return;
  shopAnimRunning = true;
  for (const entry of shopAnimSwatches) {
    if (!entry.el.isConnected) continue;
    entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
    drawCosmeticFill(entry.ctx, entry.item, 0, 0, entry.canvas.width, entry.canvas.height, 1);
    entry.el.style.backgroundImage = `url(${entry.canvas.toDataURL()})`;
  }
  requestAnimationFrame(tickShopSwatches);
}

function renderShop() {
  if (!ui.shopGrid) return;
  shopAnimSwatches.length = 0;
  const kind = save.shopTab;
  ui.shopGrid.innerHTML = "";
  for (const item of SHOP[kind]) {
    const owned = save.owned[kind].includes(item.id);
    const equipped = save.equipped[kind] === item.id;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-item";
    if (item.epic) btn.classList.add("epic");
    if (equipped) btn.classList.add("equipped");
    const free = isAdmin() && save.abilities.freeShop;
    if (!owned && !free && save.points < item.price) btn.classList.add("cant-afford");
    const swatch = document.createElement("div");
    swatch.className = "shop-swatch";
    if (item.epic) swatch.classList.add("epic-swatch");
    drawSwatch(item, swatch);
    const name = document.createElement("div");
    name.className = "shop-name";
    name.textContent = item.name;
    const price = document.createElement("div");
    price.className = "shop-price";
    price.textContent = item.price === 0 ? "Free" : `${item.price} pts`;
    btn.append(swatch, name, price);
    if (item.epic) {
      const tag = document.createElement("span");
      tag.className = "shop-epic-tag";
      tag.textContent = "EPIC";
      btn.appendChild(tag);
    }
    if (equipped) {
      const b = document.createElement("span");
      b.className = "shop-badge";
      b.textContent = "ON";
      btn.appendChild(b);
    }
    btn.addEventListener("click", () => {
      playMenuClick();
      if (owned) {
        save.equipped[kind] = item.id;
        persistSave();
        if (ui.shopMsg) ui.shopMsg.textContent = `Equipped ${item.name}.`;
        renderShop();
        return;
      }
      if (save.points < item.price && !(isAdmin() && save.abilities.freeShop)) {
        if (ui.shopMsg) ui.shopMsg.textContent = `Need ${item.price - save.points} more pts. Win games for +2.`;
        return;
      }
      if (!(isAdmin() && save.abilities.freeShop)) save.points -= item.price;
      save.owned[kind].push(item.id);
      save.equipped[kind] = item.id;
      persistSave();
      updatePointsUI();
      if (ui.shopMsg) ui.shopMsg.textContent = `Bought ${item.name}!`;
      renderShop();
    });
    ui.shopGrid.appendChild(btn);
  }
  if (shopAnimSwatches.length && !shopAnimRunning) requestAnimationFrame(tickShopSwatches);
}

function setShopTab(tab) {
  save.shopTab = tab;
  document.querySelectorAll(".shop-tab").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  renderShop();
}

function openCustomize() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  showOverlay(ui.customizeOverlay);
  setStagePlaying(false);
  updatePointsUI();
  setShopTab(save.shopTab);
  if (ui.shopMsg) ui.shopMsg.textContent = "Buy or equip a colour. Epic skins (50+) are animated.";
}

function closeCustomize() {
  shopAnimSwatches.length = 0;
  hideOverlay(ui.customizeOverlay);
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
}

function openAdmin() {
  if (!isAdmin()) {
    openPasskeyOverlay();
    return;
  }
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.lobbyOverlay);
  showOverlay(ui.adminOverlay);
  setStagePlaying(false);
  refreshAdminPanel();
}

function closeAdmin() {
  hideOverlay(ui.adminOverlay);
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
}

function refreshAdminPanel() {
  if (!isAdmin()) return;
  if (ui.adminWelcome) ui.adminWelcome.textContent = "Welcome, Owner";
  if (ui.adminPoints) ui.adminPoints.textContent = String(save.points);
  if (ui.adminLevel) ui.adminLevel.textContent = String(getPlayerLevel());
  if (ui.adminLevelInput && document.activeElement !== ui.adminLevelInput) {
    ui.adminLevelInput.value = String(getPlayerLevel());
  }
  if (ui.abMegaPaddle) ui.abMegaPaddle.checked = save.abilities.megaPaddle;
  if (ui.abFreeShop) ui.abFreeShop.checked = save.abilities.freeShop;
  if (ui.abSlowBot) ui.abSlowBot.checked = save.abilities.slowBot;
  if (ui.abBonusPts) ui.abBonusPts.checked = save.abilities.bonusPts;
}

function adminAddPoints(n) {
  if (!isAdmin()) return;
  save.points += Math.max(0, n);
  persistSave();
  updatePointsUI();
  refreshAdminPanel();
  if (ui.adminMsg) ui.adminMsg.textContent = `Added ${n} points.`;
}

function adminSetPoints(n) {
  if (!isAdmin()) return;
  save.points = Math.max(0, n);
  persistSave();
  updatePointsUI();
  refreshAdminPanel();
  if (ui.adminMsg) ui.adminMsg.textContent = `Points set to ${save.points}.`;
}

function adminUnlockAll() {
  if (!isAdmin()) return;
  for (const item of SHOP.paddle) {
    if (!save.owned.paddle.includes(item.id)) save.owned.paddle.push(item.id);
  }
  for (const item of SHOP.table) {
    if (!save.owned.table.includes(item.id)) save.owned.table.push(item.id);
  }
  persistSave();
  if (ui.adminMsg) ui.adminMsg.textContent = "All colours unlocked.";
  refreshAdminPanel();
}

function adminUnlockAllLevels() {
  if (!isAdmin()) return;
  save.maxBotCleared = 100;
  persistSave();
  updateNameUI();
  refreshAdminPanel();
  if (ui.botLevelGrid) renderBotLevelGrid();
  if (ui.adminMsg) ui.adminMsg.textContent = "All bot levels unlocked (L100).";
}

function adminSetPlayerLevel(n) {
  if (!isAdmin()) return;
  const lv = Math.max(0, Math.min(100, Math.floor(Number(n) || 0)));
  save.maxBotCleared = lv;
  persistSave();
  updateNameUI();
  refreshAdminPanel();
  if (ui.botLevelGrid) renderBotLevelGrid();
  if (s.mode === "online" && net.connected) sendCosmetics();
  if (ui.adminMsg) ui.adminMsg.textContent = `Player level set to L${lv}.`;
}

function setAdminAbility(key, on) {
  if (!isAdmin()) return;
  save.abilities[key] = on;
  persistSave();
  if (ui.adminMsg) ui.adminMsg.textContent = on ? "Ability enabled." : "Ability disabled.";
}

function initAdminUi() {
  if (!ui.btnAdmin) return;
  ui.btnAdmin.classList.remove("hidden");
}

function openAdminOrPasskey() {
  if (isAdmin()) openAdmin();
  else openPasskeyOverlay();
}

function equippedForSide(side) {
  const mine = mySide();
  if (side === mine) return save.equipped;
  if (net.opponentCosmetics) return net.opponentCosmetics;
  return { paddle: "white", table: "classic" };
}

function drawTableHalf(side) {
  const eq = equippedForSide(side);
  const style = shopItem("table", eq.table);
  if (style.id === "classic") return;
  const halfW = table.w / 2;
  const x = side === "p1" ? table.x : table.x + halfW;
  const alpha = style.epic ? 0.58 : style.price >= 20 ? 0.5 : 0.38;
  drawCosmeticFill(ctx, style, x, table.y, halfW, table.h, alpha);
}

function drawPaddleRect(p, side) {
  const h = effectivePaddleH(side);
  const eq = equippedForSide(side);
  const style = shopItem("paddle", eq.paddle);
  drawCosmeticFill(ctx, style, p.x, p.y, paddle.w, h, 1);
  if (side === "p1" && s.mode === "local" && s.ability.armed) {
    drawFirePaddle(p.x, p.y, paddle.w, h);
  }
}

function drawFirePaddle(x, y, w, h) {
  const t = performance.now() * 0.001;
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const flicker = Math.sin(t * 14 + i * 1.7) * 0.5 + 0.5;
    const fx = x + w * 0.5 + (Math.sin(t * 9 + i) * w * 0.35);
    const fy = y + h * (0.1 + (i / 10) * 0.8);
    const r = 4 + flicker * 7;
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, `rgba(255,255,200,${0.55 + flicker * 0.35})`);
    g.addColorStop(0.35, `rgba(255,140,0,${0.4 + flicker * 0.25})`);
    g.addColorStop(1, "rgba(180,20,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.55 + Math.sin(t * 10) * 0.2;
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function resetAbility() {
  s.ability.parries = 0;
  s.ability.ready = false;
  s.ability.armed = false;
  s.ability.smashing = false;
  s.ability.breakFx = null;
  s.ability.flames = [];
  updateAbilityUI();
}

function updateAbilityUI() {
  if (!ui.abilityBar) return;
  const show = s.mode === "local" && !s.gameOver;
  ui.abilityBar.classList.toggle("hidden", !show);
  if (!show) return;
  const pct = Math.min(100, (s.ability.parries / PARRY_CHARGE_NEED) * 100);
  if (ui.abilityFill) ui.abilityFill.style.width = `${pct}%`;
  ui.abilityBar.classList.toggle("ready", s.ability.ready && !s.ability.armed);
  ui.abilityBar.classList.toggle("armed", s.ability.armed);
  if (ui.abilityLabel) {
    if (s.ability.armed) ui.abilityLabel.textContent = "FIRE SMASH ARMED";
    else if (s.ability.ready) ui.abilityLabel.textContent = "FIRE SMASH READY";
    else ui.abilityLabel.textContent = `PARRY ${s.ability.parries}/${PARRY_CHARGE_NEED}`;
  }
  if (ui.abilityHint) {
    if (s.ability.armed) {
      ui.abilityHint.textContent = "Next hit shatters the bot bat & scores!";
    } else if (s.ability.ready) {
      ui.abilityHint.textContent = isTouchDevice
        ? "Tap the court to ignite your paddle"
        : "Click the court to ignite your paddle";
    } else {
      ui.abilityHint.textContent = "Land 10 hits to charge Fire Smash";
    }
  }
}

function tryActivateFireSmash() {
  if (s.mode !== "local" || s.gameOver || !s.running) return false;
  if (!s.ability.ready || s.ability.armed) return false;
  s.ability.armed = true;
  s.ability.ready = false;
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(220, t, 0.12, "sawtooth", 0.12);
  playTone(440, t + 0.08, 0.14, "square", 0.1);
  playTone(880, t + 0.16, 0.18, "triangle", 0.12);
  ui.status.textContent = "Fire Smash armed!";
  updateAbilityUI();
  return true;
}

function registerParry() {
  if (s.mode !== "local" || s.gameOver) return;
  if (s.ability.armed || s.ability.ready) return;
  s.ability.parries = Math.min(PARRY_CHARGE_NEED, s.ability.parries + 1);
  if (s.ability.parries >= PARRY_CHARGE_NEED) {
    s.ability.ready = true;
    s.ability.parries = PARRY_CHARGE_NEED;
    ui.status.textContent = isTouchDevice
      ? "Fire Smash ready — tap to ignite!"
      : "Fire Smash ready — click to ignite!";
  }
  updateAbilityUI();
}

function playFireSmashSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(180, t, 0.08, "sawtooth", 0.18);
  playTone(520, t + 0.04, 0.1, "square", 0.14);
  playTone(1200, t + 0.1, 0.16, "triangle", 0.16);
  playTone(1800, t + 0.18, 0.2, "sine", 0.1);
}

function playBatBreakSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(140, t, 0.12, "sawtooth", 0.22);
  playTone(90, t + 0.04, 0.18, "square", 0.16);
  playTone(320, t + 0.08, 0.1, "triangle", 0.12);
  playTone(60, t + 0.12, 0.22, "sawtooth", 0.14);
}

function spawnBatBreakFx() {
  const shards = [];
  const cx = s.p2.x + paddle.w / 2;
  const cy = s.p2.y + paddle.h / 2;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
    const sp = 180 + Math.random() * 420;
    shards.push({
      x: cx + (Math.random() - 0.5) * paddle.w,
      y: cy + (Math.random() - 0.5) * paddle.h,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 80,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 12,
      w: 4 + Math.random() * 10,
      h: 3 + Math.random() * 8,
      life: 0.55 + Math.random() * 0.35,
      t: 0,
    });
  }
  s.ability.breakFx = { shards, flash: 0.28 };
  s.p2.broken = true;
}

function drawBatBreakFx() {
  const fx = s.ability.breakFx;
  if (!fx) return;
  if (fx.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.flash * 2.2);
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(s.p2.x - 18, table.y, paddle.w + 36, table.h);
    ctx.restore();
  }
  for (const sh of fx.shards) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    ctx.globalAlpha = Math.max(0, 1 - sh.t / sh.life);
    ctx.fillStyle = sh.t < 0.08 ? "#fbbf24" : "#ffffff";
    ctx.fillRect(-sh.w / 2, -sh.h / 2, sh.w, sh.h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function updateBatBreakFx(dt) {
  const fx = s.ability.breakFx;
  if (!fx) return;
  if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt);
  for (const sh of fx.shards) {
    sh.t += dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.vy += 900 * dt;
    sh.rot += sh.spin * dt;
  }
  fx.shards = fx.shards.filter((sh) => sh.t < sh.life);
  if (!fx.shards.length && fx.flash <= 0) {
    s.ability.breakFx = null;
    s.p2.broken = false;
  }
}

function scorePointLocal(scorer) {
  if (s.gameOver) return;
  if (scorer === "p1") {
    s.p1.score += 1;
    ui.p1.textContent = String(s.p1.score);
    scoreFx("p1");
    if (s.p1.score >= SCORE_LIMIT) endGame("p1");
    else resetBall(true);
  } else {
    resetAbility();
    playPointLossSound();
    s.p2.score += 1;
    ui.p2.textContent = String(s.p2.score);
    scoreFx("p2", { silent: true });
    if (s.p2.score >= SCORE_LIMIT) endGame("p2");
    else {
      resetBall(false);
      ui.status.textContent = "Parry charge lost — " + serveHint();
    }
  }
}

function breakBotBatAndScore() {
  if (s.mode !== "local" || s.gameOver || !s.ability.smashing) return;
  s.ability.smashing = false;
  s.ability.armed = false;
  s.ability.parries = 0;
  s.ability.ready = false;
  s.running = false;
  spawnBatBreakFx();
  playBatBreakSound();
  ui.status.textContent = "BAT SHATTERED!";
  updateAbilityUI();
  scorePointLocal("p1");
}

const stageEl = document.querySelector(".stage");
const isTouchDevice =
  "ontouchstart" in window || matchMedia("(pointer: coarse)").matches;

function serveHint() {
  return isTouchDevice ? "Tap to serve" : "Click to serve";
}

function controlHint() {
  return isTouchDevice
    ? "Drag finger on court to move paddle. Tap to serve."
    : "Move mouse up/down to control paddle. Click to serve.";
}

const ui = {
  hint: document.getElementById("hint"),
  titleEl: document.getElementById("titleEl"),
  nameOverlay: document.getElementById("nameOverlay"),
  nameInput: document.getElementById("nameInput"),
  nameMsg: document.getElementById("nameMsg"),
  btnNameSubmit: document.getElementById("btnNameSubmit"),
  btnChangeName: document.getElementById("btnChangeName"),
  p1: document.getElementById("p1"),
  p2: document.getElementById("p2"),
  p1Label: document.getElementById("p1Label"),
  p2Label: document.getElementById("p2Label"),
  status: document.getElementById("status"),
  menuOverlay: document.getElementById("menuOverlay"),
  botLevelOverlay: document.getElementById("botLevelOverlay"),
  botLevelGrid: document.getElementById("botLevelGrid"),
  botLevelHint: document.getElementById("botLevelHint"),
  btnBotLevelBack: document.getElementById("btnBotLevelBack"),
  lobbyOverlay: document.getElementById("lobbyOverlay"),
  lobbyStatus: document.getElementById("lobbyStatus"),
  lobbyActions: document.getElementById("lobbyActions"),
  searchPanel: document.getElementById("searchPanel"),
  lobbySearchStatus: document.getElementById("lobbySearchStatus"),
  lobbySearchTimer: document.getElementById("lobbySearchTimer"),
  btnSearch: document.getElementById("btnSearch"),
  btnCancelSearch: document.getElementById("btnCancelSearch"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  gameOver: document.getElementById("gameOver"),
  gameOverTitle: document.getElementById("gameOverTitle"),
  gameOverScore: document.getElementById("gameOverScore"),
  playAgain: document.getElementById("playAgain"),
  backToMenu: document.getElementById("backToMenu"),
  btnResign: document.getElementById("btnResign"),
  abilityBar: document.getElementById("abilityBar"),
  abilityLabel: document.getElementById("abilityLabel"),
  abilityFill: document.getElementById("abilityFill"),
  abilityHint: document.getElementById("abilityHint"),
  btnLocal: document.getElementById("btnLocal"),
  btnOnline: document.getElementById("btnOnline"),
  btnCreateRoom: document.getElementById("btnCreateRoom"),
  btnJoinRoom: document.getElementById("btnJoinRoom"),
  btnBackMenu: document.getElementById("btnBackMenu"),
  btnCustomize: document.getElementById("btnCustomize"),
  btnCustomizeBack: document.getElementById("btnCustomizeBack"),
  customizeOverlay: document.getElementById("customizeOverlay"),
  shopPoints: document.getElementById("shopPoints"),
  shopGrid: document.getElementById("shopGrid"),
  shopMsg: document.getElementById("shopMsg"),
  btnAdmin: document.getElementById("btnAdmin"),
  btnAdminBack: document.getElementById("btnAdminBack"),
  adminOverlay: document.getElementById("adminOverlay"),
  adminWelcome: document.getElementById("adminWelcome"),
  adminPoints: document.getElementById("adminPoints"),
  adminPointsInput: document.getElementById("adminPointsInput"),
  btnAdminAddPts: document.getElementById("btnAdminAddPts"),
  btnAdminSetPts: document.getElementById("btnAdminSetPts"),
  btnAdminUnlockAll: document.getElementById("btnAdminUnlockAll"),
  btnAdminMaxPts: document.getElementById("btnAdminMaxPts"),
  btnAdminUnlockLevels: document.getElementById("btnAdminUnlockLevels"),
  adminLevel: document.getElementById("adminLevel"),
  adminLevelInput: document.getElementById("adminLevelInput"),
  btnAdminSetLevel: document.getElementById("btnAdminSetLevel"),
  adminMsg: document.getElementById("adminMsg"),
  abMegaPaddle: document.getElementById("abMegaPaddle"),
  abFreeShop: document.getElementById("abFreeShop"),
  abSlowBot: document.getElementById("abSlowBot"),
  abBonusPts: document.getElementById("abBonusPts"),
  passkeyOverlay: document.getElementById("passkeyOverlay"),
  passkeyInput: document.getElementById("passkeyInput"),
  passkeyMsg: document.getElementById("passkeyMsg"),
  btnPasskeySubmit: document.getElementById("btnPasskeySubmit"),
  btnPasskeyCancel: document.getElementById("btnPasskeyCancel"),
};

let audioCtx = null;
let musicPlaying = false;
let musicTimer = null;
let musicStep = 0;
const MUSIC_NOTES = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];
const MUSIC_BASS = [130.81, 130.81, 146.83, 146.83];
let ws = null;

const net = {
  player: 0,
  code: "",
  connected: false,
  snap: null,
  snapPrev: null,
  snapAt: 0,
  snapPrevAt: 0,
  remotePaddleY: null,
  lastPaddleSend: 0,
  lastPaddleSentY: -1,
  opponentCosmetics: null,
  opponentName: "",
  opponentLevel: 0,
  searching: false,
  searchStartedAt: 0,
};

let searchTimerInterval = null;

function formatSearchTime(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateSearchTimerDisplay() {
  if (!ui.lobbySearchTimer || !net.searching) return;
  ui.lobbySearchTimer.textContent = formatSearchTime(Date.now() - net.searchStartedAt);
}

function startSearchTimer() {
  stopSearchTimer();
  updateSearchTimerDisplay();
  searchTimerInterval = setInterval(updateSearchTimerDisplay, 250);
}

function stopSearchTimer() {
  if (searchTimerInterval) {
    clearInterval(searchTimerInterval);
    searchTimerInterval = null;
  }
}

function beginSearchUI(startedAt) {
  net.searching = true;
  net.searchStartedAt = startedAt || Date.now();
  ui.lobbyActions?.classList.add("hidden");
  ui.searchPanel?.classList.remove("hidden");
  if (ui.lobbySearchStatus) {
    ui.lobbySearchStatus.textContent = "Searching for opponent...";
    ui.lobbySearchStatus.classList.remove("match-found");
  }
  if (ui.lobbyStatus) ui.lobbyStatus.textContent = "Looking for an active player...";
  startSearchTimer();
}

function showMatchFoundUI() {
  net.searching = false;
  stopSearchTimer();
  if (ui.lobbySearchStatus) {
    ui.lobbySearchStatus.textContent = "MATCH FOUND!";
    ui.lobbySearchStatus.classList.add("match-found");
  }
  updateSearchTimerDisplay();
  if (ui.lobbyStatus) ui.lobbyStatus.textContent = "Starting match...";
}

function stopSearchUI() {
  net.searching = false;
  net.searchStartedAt = 0;
  stopSearchTimer();
  ui.lobbyActions?.classList.remove("hidden");
  ui.searchPanel?.classList.add("hidden");
  if (ui.lobbySearchStatus) ui.lobbySearchStatus.classList.remove("match-found");
  if (ui.lobbySearchTimer) ui.lobbySearchTimer.textContent = "0:00";
}

function startMatchSearch() {
  connectWs(() => sendWs({ type: "search" }));
}

function cancelMatchSearch() {
  if (net.searching) sendWs({ type: "cancelSearch" });
  stopSearchUI();
  if (ui.lobbyStatus) ui.lobbyStatus.textContent = "Create or join a room.";
}

const NET_INTERP_MS = 58;
const NET_EXTRAP_MAX = 0.045;

function inCenterCourt(ballX) {
  const margin = 220;
  return ballX > table.x + margin && ballX < table.x + table.w - margin;
}

function nearPaddleZone(ballX) {
  return ballX < table.x + 200 || ballX > table.x + table.w - 200;
}

function ballOverlapsPaddleRect(bx, by, px, py, pw, ph) {
  const edgePad = 4;
  const r = ballCfg.r;
  return (
    bx + r > px &&
    bx - r < px + pw &&
    by + r > py - edgePad &&
    by - r < py + ph + edgePad
  );
}

function clampVisualBallAtPaddles() {
  if (!net.snap?.ball) return;
  if (nearPaddleZone(net.snap.ball.x)) {
    s.ball.x = net.snap.ball.x;
    s.ball.y = net.snap.ball.y;
    s.ball.vx = net.snap.ball.vx;
    s.ball.vy = net.snap.ball.vy;
  }
}

function expandState(d) {
  if (!d) return null;
  if (d.p1y != null) return d;
  return {
    t: d.t,
    p1y: d.y1,
    p2y: d.y2,
    ball: { x: d.b[0], y: d.b[1], vx: d.b[2], vy: d.b[3] },
    p1Score: d.s[0],
    p2Score: d.s[1],
    running: d.r === 1,
    gameOver: d.o > 0,
    winner: d.o === 1 ? "p1" : d.o === 2 ? "p2" : null,
  };
}

const s = {
  mode: "menu",
  running: false,
  gameOver: false,
  botLevel: 1,
  lastT: performance.now(),
  mouseY: table.y + table.h / 2,
  ai: { timer: 0, interval: 0.11, targetY: table.y + table.h / 2, errorPx: 28, speed: 560, track: 0.55 },
  ability: { parries: 0, ready: false, armed: false, smashing: false, breakFx: null, flames: [] },
  fx: { scoreT: 0, who: "p1", particles: [] },
  p1: { x: table.x + paddle.inset, y: table.y + (table.h - paddle.h) / 2, score: 0 },
  p2: {
    x: table.x + table.w - paddle.inset - paddle.w,
    y: table.y + (table.h - paddle.h) / 2,
    score: 0,
    broken: false,
  },
  ball: { x: table.x + table.w / 2, y: table.y + table.h / 2, vx: 0, vy: 0 },
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function botTierClass(level) {
  if (level <= 20) return "tier-easy";
  if (level <= 40) return "tier-medium";
  if (level <= 60) return "tier-hard";
  if (level <= 80) return "tier-expert";
  return "tier-master";
}

function botLevelLabel(level) {
  if (level <= 20) return "Slow & clumsy";
  if (level <= 40) return "Getting sharper";
  if (level <= 60) return "Fast reactions";
  if (level <= 80) return "Near perfect";
  return "Unforgiving master";
}

function applyBotLevel(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, 100);
  s.botLevel = lv;
  const t = (lv - 1) / 99;
  s.ai.errorPx = 72 - t * 70;
  s.ai.interval = 0.28 - t * 0.255;
  s.ai.speed = 220 + t * 980;
  s.ai.track = 0.35 + t * 0.62;
  if (isAdmin() && save.abilities.slowBot) s.ai.speed *= 0.45;
}

function openBotLevelSelect() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.botLevelOverlay);
  setStagePlaying(false);
  startMenuBg();
  renderBotLevelGrid();
  ui.hint.textContent = "Select a bot level.";
  updateNameUI();
}

function closeBotLevelSelect() {
  hideOverlay(ui.botLevelOverlay);
  showOverlay(ui.menuOverlay);
  startMenuBg();
  updateNameUI();
}

function renderBotLevelGrid() {
  if (!ui.botLevelGrid) return;
  ui.botLevelGrid.innerHTML = "";
  const nextUnlock = Math.min(100, (save.maxBotCleared || 0) + 1);
  for (let i = 1; i <= 100; i++) {
    const unlocked = isBotLevelUnlocked(i);
    const cleared = i <= (save.maxBotCleared || 0);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `bot-level-btn ${botTierClass(i)}`;
    if (!unlocked) btn.classList.add("locked");
    if (cleared) btn.classList.add("cleared");
    if (i === nextUnlock && unlocked) btn.classList.add("next");
    btn.textContent = unlocked ? String(i) : "🔒";
    btn.disabled = !unlocked;
    btn.title = unlocked
      ? `Level ${i} — ${botLevelLabel(i)}${cleared ? " (cleared)" : ""}`
      : `Locked — clear level ${i - 1} first`;
    btn.addEventListener("click", () => {
      if (!unlocked) {
        if (ui.botLevelHint) {
          ui.botLevelHint.textContent = `Locked. Clear level ${i - 1} to unlock.`;
        }
        return;
      }
      playMenuClick();
      startLocalMode(i);
    });
    btn.addEventListener("mouseenter", () => {
      if (!ui.botLevelHint) return;
      if (!unlocked) {
        ui.botLevelHint.textContent = `Locked — beat level ${i - 1} first (+5 pts on clear).`;
      } else if (cleared) {
        ui.botLevelHint.textContent = `Level ${i} cleared — ${botLevelLabel(i)}`;
      } else {
        ui.botLevelHint.textContent = `Level ${i} — ${botLevelLabel(i)} · Clear for +5 pts`;
      }
    });
    ui.botLevelGrid.appendChild(btn);
  }
  if (ui.botLevelHint) {
    const cleared = save.maxBotCleared || 0;
    ui.botLevelHint.textContent =
      cleared >= 100
        ? "All 100 levels cleared. Master status!"
        : `Progress: L${cleared}/100 · Next unlock: L${nextUnlock} · Clear = +5 pts`;
  }
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, start, duration, type = "sine", peak = 0.18) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playMenuClick() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(880, t, 0.05, "square", 0.1);
  playTone(1320, t + 0.03, 0.06, "triangle", 0.08);
}

function playPaddleHit() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(920 + Math.random() * 120, t, 0.09, "triangle", 0.22);
  playTone(360, t + 0.02, 0.07, "triangle", 0.08);
}

function playScoreSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(523.25, t, 0.1, "sine", 0.2);
  playTone(659.25, t + 0.09, 0.14, "sine", 0.22);
}

function playWinSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    playTone(freq, t + i * 0.11, 0.2, "square", 0.14);
  });
}

function playLossSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  [392, 349.23, 293.66, 220].forEach((freq, i) => {
    playTone(freq, t + i * 0.13, 0.22, "triangle", 0.16);
  });
}

function playPointLossSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(280, t, 0.12, "sawtooth", 0.16);
  playTone(180, t + 0.08, 0.16, "triangle", 0.14);
  playTone(110, t + 0.16, 0.22, "square", 0.1);
}

function scheduleMusicStep() {
  if (!musicPlaying) return;
  ensureAudio();
  const t = audioCtx.currentTime;
  const melody = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
  playTone(melody, t, 0.16, "square", 0.045);
  if (musicStep % 2 === 0) {
    playTone(MUSIC_BASS[(musicStep / 2) % MUSIC_BASS.length], t, 0.22, "triangle", 0.035);
  }
  musicStep += 1;
  musicTimer = setTimeout(scheduleMusicStep, 220);
}

function startGameMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  musicStep = 0;
  scheduleMusicStep();
}

function stopGameMusic() {
  musicPlaying = false;
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

function updateResignButton() {
  if (!ui.btnResign) return;
  const inMatch = (s.mode === "local" || s.mode === "online") && !s.gameOver;
  const lobbyOpen = ui.lobbyOverlay && !ui.lobbyOverlay.classList.contains("hidden");
  const menuOpen = ui.menuOverlay && !ui.menuOverlay.classList.contains("hidden");
  const botSelectOpen = ui.botLevelOverlay && !ui.botLevelOverlay.classList.contains("hidden");
  ui.btnResign.classList.toggle("hidden", !(inMatch && !lobbyOpen && !menuOpen && !botSelectOpen));
}

function resignMatch() {
  if (s.gameOver || (s.mode !== "local" && s.mode !== "online")) return;
  ensureAudio();
  if (s.mode === "local") {
    endGame("p2", { resigned: true, resignedByMe: true });
    return;
  }
  sendWs({ type: "resign" });
}

function updateNameUI() {
  const name = getPlayerName();
  const level = getPlayerLevel();
  if (ui.hint && hasValidName()) {
    ui.hint.innerHTML = "";
    ui.hint.append("Playing as ");
    const span = document.createElement("span");
    span.className = "player-level-inline";
    span.textContent = formatNameWithLevel(name, level);
    applyLevelClass(span, level);
    ui.hint.appendChild(span);
  }
}

function setScoreboardLabels(left, right, opts = {}) {
  const trim = (s) => {
    const t = String(s || "");
    return t.length > 18 ? `${t.slice(0, 17)}…` : t;
  };
  ui.p1Label.textContent = trim(left);
  ui.p2Label.textContent = trim(right);
  applyLevelClass(ui.p1Label, opts.p1Level != null ? opts.p1Level : null);
  applyLevelClass(ui.p2Label, opts.p2Level != null ? opts.p2Level : null);
}

function openNameOverlay(fromMenu = false) {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  showOverlay(ui.nameOverlay);
  if (ui.nameInput) {
    ui.nameInput.value = getPlayerName();
    ui.nameInput.focus();
    ui.nameInput.select();
  }
  if (ui.nameMsg) ui.nameMsg.textContent = fromMenu ? "Update your name." : "Name is required to play.";
}

function closeNameOverlay() {
  hideOverlay(ui.nameOverlay);
  if (hasValidName()) {
    showOverlay(ui.menuOverlay);
    updateNameUI();
    startMenuBg();
  }
}

function submitName() {
  const raw = ui.nameInput?.value || "";
  if (!sanitizeName(raw)) {
    if (ui.nameMsg) ui.nameMsg.textContent = "Enter a name (letters/numbers).";
    return;
  }
  setPlayerName(raw);
  if (ui.nameMsg) ui.nameMsg.textContent = "";
  closeNameOverlay();
}

function requireName(action) {
  if (!hasValidName()) {
    openNameOverlay();
    return;
  }
  action();
}

function showOverlay(el) {
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  if (stageEl && (el === ui.nameOverlay || el === ui.menuOverlay || el === ui.botLevelOverlay || el === ui.lobbyOverlay || el === ui.customizeOverlay || el === ui.adminOverlay || el === ui.passkeyOverlay)) {
    stageEl.classList.add("menu-open");
  }
}

function hideOverlay(el) {
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (stageEl && (el === ui.nameOverlay || el === ui.menuOverlay || el === ui.botLevelOverlay || el === ui.lobbyOverlay || el === ui.customizeOverlay || el === ui.adminOverlay || el === ui.passkeyOverlay)) {
    stageEl.classList.remove("menu-open");
  }
}

function normalizedMouseY() {
  return clamp((s.mouseY - table.y) / table.h, 0, 1);
}

function setStagePlaying(on) {
  if (!stageEl) return;
  stageEl.classList.toggle("playing", on);
  stageEl.classList.toggle("menu-open", !on && s.mode === "menu");
  updateResignButton();
  if (on) stopMenuBg();
}

function resetBall(servingToRight = true) {
  s.ball.x = table.x + table.w / 2;
  s.ball.y = table.y + table.h / 2;
  const dir = servingToRight ? 1 : -1;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  const sp = ballCfg.speed0;
  s.ball.vx = Math.cos(angle) * sp * dir;
  s.ball.vy = Math.sin(angle) * sp;
  s.running = false;
  s.ability.smashing = false;
  if (!s.ability.breakFx) s.p2.broken = false;
  if (!s.gameOver) ui.status.textContent = serveHint();
}

function scoreFx(who, opts = {}) {
  s.fx.scoreT = 0.65;
  s.fx.who = who;
  s.fx.particles.length = 0;
  if (!opts.silent) playScoreSound();
  const cx = table.x + table.w / 2;
  const cy = table.y + table.h / 2;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.15;
    const sp = 220 + Math.random() * 360;
    s.fx.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.6 + Math.random() * 0.25,
      t: 0,
    });
  }
  const el = who === "p1" ? ui.p1 : ui.p2;
  el.classList.remove("score-pop");
  void el.offsetWidth;
  el.classList.add("score-pop");
}

function endGame(winner, opts = {}) {
  const justEnded = !s.gameOver;
  s.gameOver = true;
  s.running = false;
  ui.status.textContent = "Game over";
  stopGameMusic();
  updateResignButton();
  resetAbility();
  if (ui.abilityBar) ui.abilityBar.classList.add("hidden");

  let youWon = false;
  let clearBonus = 0;
  let winPts = 0;
  if (opts.resigned) {
    if (s.mode === "local") {
      youWon = false;
      ui.gameOverTitle.textContent = "YOU RESIGNED";
    } else {
      youWon = !opts.resignedByMe;
      ui.gameOverTitle.textContent = opts.resignedByMe ? "YOU RESIGNED" : "OPPONENT RESIGNED";
    }
  } else if (s.mode === "local") {
    youWon = winner === "p1";
    if (justEnded && youWon) {
      winPts = awardWinPoints(winner);
      clearBonus = awardBotClear(s.botLevel);
      const total = winPts + clearBonus;
      if (clearBonus > 0) {
        ui.gameOverTitle.textContent = `LEVEL ${s.botLevel} CLEARED (+${total} PTS)`;
      } else {
        ui.gameOverTitle.textContent = `YOU WIN (+${winPts || POINTS_PER_WIN} PTS)`;
      }
    } else {
      ui.gameOverTitle.textContent = youWon ? "YOU WIN" : "BOT WINS";
    }
  } else {
    youWon = (winner === "p1" && net.player === 1) || (winner === "p2" && net.player === 2);
    if (justEnded && youWon) {
      winPts = awardWinPoints(winner);
      ui.gameOverTitle.textContent = `YOU WIN (+${winPts || POINTS_PER_WIN} PTS)`;
    } else {
      ui.gameOverTitle.textContent = youWon ? "YOU WIN" : "YOU LOSE";
    }
  }

  ui.gameOverScore.textContent = `${s.p1.score} : ${s.p2.score}`;
  if (justEnded) {
    if (youWon) playWinSound();
    else playLossSound();
  }
  showOverlay(ui.gameOver);
}

function resetLocalMatch() {
  s.gameOver = false;
  s.p1.score = 0;
  s.p2.score = 0;
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  hideOverlay(ui.gameOver);
  resetAbility();
  resetBall(true);
  ui.status.textContent = serveHint();
  setStagePlaying(true);
  startGameMusic();
  updateAbilityUI();
}

function serve() {
  if (s.gameOver || s.running) return;
  ensureAudio();

  if (s.mode === "online") {
    sendWs({ type: "serve" });
    return;
  }

  s.running = true;
  ui.status.textContent = "Playing";
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function reflectFromPaddle(p, side) {
  const h = effectivePaddleH(side);
  const mid = p.y + h / 2;
  const t = clamp((s.ball.y - mid) / (h / 2), -1, 1);
  const fireSmash = side === "p1" && s.mode === "local" && s.ability.armed;
  const speed = fireSmash
    ? FIRE_SMASH_SPEED
    : clamp(Math.hypot(s.ball.vx, s.ball.vy) * 1.065, ballCfg.speed0, ballCfg.speedMax);
  const maxBounce = fireSmash ? 0.12 * Math.PI : 0.42 * Math.PI;
  const a = t * maxBounce;
  const dir = side === "p1" ? 1 : -1;
  s.ball.vx = Math.cos(a) * speed * dir;
  s.ball.vy = Math.sin(a) * speed;
  if (fireSmash) {
    s.ability.armed = false;
    s.ability.smashing = true;
    s.p2.broken = false;
    playFireSmashSound();
    ui.status.textContent = "UNSTOPPABLE SMASH!";
    updateAbilityUI();
  } else {
    playPaddleHit();
    if (side === "p1") registerParry();
  }
}

function tryLocalPaddleHit(p, side) {
  if (side === "p2" && s.ability.smashing) return false;
  if (side === "p2" && s.p2.broken) return false;
  const h = effectivePaddleH(side);
  const movingToward =
    (side === "p1" && s.ball.vx < 0) || (side === "p2" && s.ball.vx > 0);
  if (!movingToward) return false;
  if (!ballOverlapsPaddleRect(s.ball.x, s.ball.y, p.x, p.y, paddle.w, h)) return false;
  if (side === "p1") s.ball.x = p.x + paddle.w + ballCfg.r;
  else s.ball.x = p.x - ballCfg.r;
  reflectFromPaddle(p, side);
  return true;
}

function updateLocal(dt) {
  const p1h = effectivePaddleH("p1");
  s.p1.y = clamp(s.mouseY - p1h / 2, table.y + 6, table.y + table.h - p1h - 6);

  if (!s.gameOver && !s.p2.broken) {
    const botSpeed = s.ai.speed;
    s.ai.timer -= dt;
    if (s.ai.timer <= 0) {
      s.ai.timer = s.ai.interval + (Math.random() * 0.04 - 0.015);
      const err = (Math.random() * 2 - 1) * s.ai.errorPx;
      const lead = s.ball.vx > 0 ? s.ball.vy * 0.08 * ((s.botLevel - 1) / 99) : 0;
      s.ai.targetY = s.ball.y + lead - paddle.h / 2 + err;
    }
    const dy = s.ai.targetY - s.p2.y;
    const maxStep = botSpeed * dt;
    s.p2.y = clamp(
      s.p2.y + clamp(dy * s.ai.track, -maxStep, maxStep),
      table.y + 6,
      table.y + table.h - paddle.h - 6
    );
  }

  updateBatBreakFx(dt);

  if (!s.running || s.gameOver) return;

  s.ball.x += s.ball.vx * dt;
  s.ball.y += s.ball.vy * dt;

  const top = table.y;
  const bottom = table.y + table.h;
  if (s.ball.y - ballCfg.r <= top) {
    s.ball.y = top + ballCfg.r;
    s.ball.vy *= -1;
  } else if (s.ball.y + ballCfg.r >= bottom) {
    s.ball.y = bottom - ballCfg.r;
    s.ball.vy *= -1;
  }

  tryLocalPaddleHit(s.p1, "p1");
  if (!s.ability.smashing) tryLocalPaddleHit(s.p2, "p2");

  if (s.ability.smashing && s.ball.vx > 0 && s.ball.x + ballCfg.r >= s.p2.x) {
    breakBotBatAndScore();
    return;
  }

  if (s.ball.x < table.x - 40) {
    scorePointLocal("p2");
  } else if (s.ball.x > table.x + table.w + 40) {
    if (s.ability.smashing) breakBotBatAndScore();
    else scorePointLocal("p1");
  }
}

function myPaddleY() {
  const side = mySide();
  const h = effectivePaddleH(side || "p1");
  return clamp(s.mouseY - h / 2, table.y + 6, table.y + table.h - h - 6);
}

function pushSnapshot(state, serverT) {
  if (net.snap) {
    net.snapPrev = net.snap;
    net.snapPrevAt = net.snapAt;
  }
  net.snap = state;
  net.snapAt = serverT || state.t || Date.now();
}

function renderInterpolatedBall() {
  if (!net.snap?.ball) return;

  if (!inCenterCourt(net.snap.ball.x)) {
    s.ball.x = net.snap.ball.x;
    s.ball.y = net.snap.ball.y;
    s.ball.vx = net.snap.ball.vx;
    s.ball.vy = net.snap.ball.vy;
    return;
  }

  const now = Date.now();
  const renderT = now - NET_INTERP_MS;

  if (net.snapPrev?.ball && net.snapPrevAt < net.snapAt) {
    const t0 = net.snapPrevAt;
    const t1 = net.snapAt;
    const alpha = clamp((renderT - t0) / (t1 - t0), 0, 1);
    s.ball.x = net.snapPrev.ball.x + (net.snap.ball.x - net.snapPrev.ball.x) * alpha;
    s.ball.y = net.snapPrev.ball.y + (net.snap.ball.y - net.snapPrev.ball.y) * alpha;
  } else {
    s.ball.x = net.snap.ball.x;
    s.ball.y = net.snap.ball.y;
  }

  s.ball.vx = net.snap.ball.vx;
  s.ball.vy = net.snap.ball.vy;

  if (!nearPaddleZone(s.ball.x)) {
    const extrap = clamp((Date.now() - net.snapAt) / 1000, 0, NET_EXTRAP_MAX);
    s.ball.x += s.ball.vx * extrap * 0.35;
    s.ball.y += s.ball.vy * extrap * 0.35;
  }
}

function applyServerState(state, serverT, forceSnap = false) {
  if (forceSnap) {
    net.snapPrev = null;
  }
  pushSnapshot(state, serverT);

  if (net.player === 1) {
    net.remotePaddleY = state.p2y;
    s.p2.y = state.p2y;
  } else if (net.player === 2) {
    net.remotePaddleY = state.p1y;
    s.p1.y = state.p1y;
  }

  s.p1.score = state.p1Score;
  s.p2.score = state.p2Score;
  s.running = state.running;
  ui.p1.textContent = String(state.p1Score);
  ui.p2.textContent = String(state.p2Score);

  if (state.ball) {
    s.ball.x = state.ball.x;
    s.ball.y = state.ball.y;
    s.ball.vx = state.ball.vx;
    s.ball.vy = state.ball.vy;
    if (forceSnap || !inCenterCourt(state.ball.x)) {
      net.snapPrev = null;
    }
  }

  if (state.gameOver && state.winner) {
    endGame(state.winner);
  } else if (s.running) {
    ui.status.textContent = "Playing";
  } else if (!state.gameOver) {
    ui.status.textContent = serveHint();
  }
}

function updateOnline(dt) {
  if (s.mode !== "online" || s.gameOver) return;

  const myY = myPaddleY();
  if (net.player === 1) s.p1.y = myY;
  else if (net.player === 2) s.p2.y = myY;

  if (net.remotePaddleY != null) {
    const remote = net.player === 1 ? s.p2 : s.p1;
    remote.y = net.remotePaddleY;
  }

  if (s.running && net.snap?.ball) {
    renderInterpolatedBall();
    clampVisualBallAtPaddles();
  }

  const normY = normalizedMouseY();
  const now = performance.now();
  const ballNear = net.snap?.ball && nearPaddleZone(net.snap.ball.x);
  const paddleInterval = ballNear ? 33 : 50;
  if (now - net.lastPaddleSend > paddleInterval || Math.abs(normY - net.lastPaddleSentY) > 0.008) {
    sendWs({ type: "paddle", y: normY });
    net.lastPaddleSend = now;
    net.lastPaddleSentY = normY;
  }
}

function updateFx(dt) {
  if (s.fx.scoreT > 0) s.fx.scoreT = Math.max(0, s.fx.scoreT - dt);
  for (const p of s.fx.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.985;
    p.vy *= 0.985;
  }
  s.fx.particles = s.fx.particles.filter((p) => p.t < p.life);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  if (s.mode === "local" || s.mode === "online") {
    drawTableHalf("p1");
    drawTableHalf("p2");
  }

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(table.x, table.y, table.w, table.h);
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2, table.y);
  ctx.lineTo(table.x + table.w / 2, table.y + table.h);
  ctx.stroke();

  ctx.globalAlpha = 1;
  drawPaddleRect(s.p1, "p1");
  if (!(s.mode === "local" && s.p2.broken)) drawPaddleRect(s.p2, "p2");
  if (s.mode === "local") drawBatBreakFx();

  if (s.mode === "local" || s.mode === "online") {
    const p1Name = ui.p1Label?.textContent || "";
    const p2Name = ui.p2Label?.textContent || "";
    const p1Lv = s.mode === "local" ? getPlayerLevel() : net.player === 1 ? getPlayerLevel() : net.opponentLevel || 0;
    const p2Lv = s.mode === "local" ? null : net.player === 2 ? getPlayerLevel() : net.opponentLevel || 0;
    ctx.font = `bold ${isTouchDevice ? 11 : 13}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = canvasLevelColor(p1Lv);
    ctx.fillText(p1Name, table.x + table.w * 0.25, table.y - 4);
    ctx.fillStyle = canvasLevelColor(p2Lv);
    ctx.fillText(p2Name, table.x + table.w * 0.75, table.y - 4);
    ctx.globalAlpha = 1;
  }

  if (s.mode === "local" && s.ability.smashing) {
    const t = performance.now() * 0.001;
    for (let i = 0; i < 5; i++) {
      const trail = i * 10;
      const bx = s.ball.x - Math.sign(s.ball.vx || 1) * trail;
      const by = s.ball.y - Math.sign(s.ball.vy || 0) * trail * 0.15;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, ballCfg.r + 8 - i);
      g.addColorStop(0, `rgba(255,220,120,${0.45 - i * 0.07})`);
      g.addColorStop(0.5, `rgba(255,90,0,${0.28 - i * 0.04})`);
      g.addColorStop(1, "rgba(180,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by + Math.sin(t * 20 + i) * 2, ballCfg.r + 6 - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = s.ability.smashing ? "#ffe08a" : "#fff";
  ctx.beginPath();
  ctx.arc(s.ball.x, s.ball.y, ballCfg.r, 0, Math.PI * 2);
  ctx.fill();

  if (!s.running && (s.mode === "local" || s.mode === "online") && !s.gameOver) {
    ctx.font = `${isTouchDevice ? 14 : 16}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.85;
    ctx.fillText(serveHint().toUpperCase(), table.x + table.w / 2, table.y + table.h / 2);
    ctx.globalAlpha = 1;
  }

  if (s.fx.scoreT > 0) {
    const t = 1 - s.fx.scoreT / 0.65;
    const pop = Math.sin(Math.min(1, t) * Math.PI);
    const cx = table.x + table.w / 2;
    const cy = table.y + table.h / 2;
    ctx.save();
    ctx.translate(cx, cy - 10);
    ctx.scale(1 + pop * 0.08, 1 + pop * 0.08);
    ctx.globalAlpha = clamp(1 - t * 0.9, 0, 1);
    ctx.fillStyle = "#fff";
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCORE", 0, 0);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    for (const p of s.fx.particles) {
      ctx.globalAlpha = (1 - p.t / p.life) * 0.9;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function frame(t) {
  const dt = Math.min(0.03, (t - s.lastT) / 1000);
  s.lastT = t;
  if (menuBg.active) updateMenuBg(t);
  if (s.mode === "local") updateLocal(dt);
  if (s.mode === "online") updateOnline(dt);
  updateFx(dt);
  draw();
  requestAnimationFrame(frame);
}

function wsURL() {
  if (!location.host) return null;
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}`;
}

function closeWs() {
  if (net.searching) sendWs({ type: "cancelSearch" });
  stopSearchUI();
  if (ws) {
    ws.close();
    ws = null;
  }
  net.connected = false;
  net.player = 0;
  net.code = "";
  net.snap = null;
  net.snapPrev = null;
  net.snapAt = 0;
  net.snapPrevAt = 0;
  net.remotePaddleY = null;
  net.opponentCosmetics = null;
  net.opponentName = "";
  net.opponentLevel = 0;
}

function sendCosmetics() {
  sendWs({
    type: "cosmetics",
    paddle: save.equipped.paddle,
    table: save.equipped.table,
    name: getPlayerName(),
    level: getPlayerLevel(),
  });
}

function sendWs(payload) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function connectWs(onOpen) {
  const url = wsURL();
  if (!url) {
    ui.lobbyStatus.textContent = "Online mode needs the game server. Run Start Server.bat first.";
    return;
  }
  closeWs();
  ws = new WebSocket(url);
  ws.onopen = () => {
    net.connected = true;
    onOpen();
  };
  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleWsMessage(msg);
  };
  ws.onclose = () => {
    net.connected = false;
    stopSearchUI();
    if (s.mode === "online" && !s.gameOver) {
      ui.status.textContent = "Disconnected";
    }
  };
}

function handleWsMessage(msg) {
  if (msg.type === "searching") {
    beginSearchUI(msg.startedAt);
    return;
  }

  if (msg.type === "matchFound") {
    net.code = msg.code;
    net.player = msg.player;
    s.mode = "online";
    setOnlineLabels();
    sendCosmetics();
    showMatchFoundUI();
    return;
  }

  if (msg.type === "searchCancelled") {
    stopSearchUI();
    if (ui.lobbyStatus) ui.lobbyStatus.textContent = "Create or join a room.";
    return;
  }

  if (msg.type === "roomCreated") {
    net.code = msg.code;
    net.player = msg.player;
    s.mode = "online";
    ui.lobbyStatus.textContent = `Room code: ${msg.code} — waiting for opponent...`;
    setOnlineLabels();
    sendCosmetics();
    return;
  }

  if (msg.type === "joined") {
    net.code = msg.code;
    net.player = msg.player;
    s.mode = "online";
    ui.lobbyStatus.textContent = `Joined room ${msg.code}. Waiting for match...`;
    setOnlineLabels();
    sendCosmetics();
    return;
  }

  if (msg.type === "oCos") {
    net.opponentCosmetics = { paddle: msg.paddle || "white", table: msg.table || "classic" };
    if (msg.name) net.opponentName = sanitizeName(msg.name) || "Opponent";
    if (typeof msg.level === "number") net.opponentLevel = Math.max(0, Math.min(100, Math.floor(msg.level)));
    setOnlineLabels();
    return;
  }

  if (msg.type === "waiting") {
    ui.lobbyStatus.textContent =
      msg.players < 2
        ? `Room ${msg.code}: waiting for opponent (${msg.players}/2)`
        : `Room ${msg.code}: both players connected`;
    return;
  }

  if (msg.type === "matchReady") {
    stopSearchUI();
    hideOverlay(ui.lobbyOverlay);
    s.gameOver = false;
    hideOverlay(ui.gameOver);
    setOnlineLabels();
    updateNameUI();
    ui.hint.textContent = `Online 1v1 as ${getPlayerName()}. ` + controlHint().replace("paddle. ", "your paddle. ");
    ui.status.textContent = serveHint();
    setStagePlaying(true);
    startGameMusic();
    return;
  }

  if (msg.type === "p" && typeof msg.y === "number") {
    const centerY = table.y + clamp(msg.y, 0, 1) * table.h;
    const y = clamp(centerY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);
    net.remotePaddleY = y;
    if (net.snap?.ball && nearPaddleZone(net.snap.ball.x)) {
      const remote = net.player === 1 ? s.p2 : s.p1;
      remote.y = y;
    }
    return;
  }

  if (msg.type === "opponentPaddle" && typeof msg.y === "number") {
    const centerY = table.y + clamp(msg.y, 0, 1) * table.h;
    const y = clamp(centerY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);
    net.remotePaddleY = y;
    if (net.snap?.ball && nearPaddleZone(net.snap.ball.x)) {
      const remote = net.player === 1 ? s.p2 : s.p1;
      remote.y = y;
    }
    return;
  }

  if (msg.type === "s" && msg.d) {
    const state = expandState(msg.d);
    applyServerState(state, state.t, msg.h === 1);
    if (msg.h === 1) playPaddleHit();
    if (msg.g === 1) scoreFx("p1");
    if (msg.g === 2) scoreFx("p2");
    return;
  }

  if (msg.type === "state") {
    const state = expandState(msg.state) || msg.state;
    applyServerState(state, state.t, !!msg.hit);
    if (msg.hit) playPaddleHit();
    if (msg.scored) scoreFx(msg.scored);
    return;
  }

  if (msg.type === "resigned") {
    if (Array.isArray(msg.score) && msg.score.length === 2) {
      s.p1.score = msg.score[0];
      s.p2.score = msg.score[1];
      ui.p1.textContent = String(msg.score[0]);
      ui.p2.textContent = String(msg.score[1]);
    }
    const winner = msg.by === 1 ? "p2" : "p1";
    const resignedByMe = msg.by === net.player;
    endGame(winner, { resigned: true, resignedByMe });
    return;
  }

  if (msg.type === "opponentLeft") {
    stopGameMusic();
    stopSearchUI();
    ui.lobbyStatus.textContent = "Opponent left the game.";
    ui.status.textContent = "Opponent left";
    s.running = false;
    showOverlay(ui.lobbyOverlay);
    return;
  }

  if (msg.type === "error") {
    ui.lobbyStatus.textContent = msg.message;
  }
}

function setOnlineLabels() {
  const myName = formatNameWithLevel(getPlayerName() || "You", getPlayerLevel());
  const oppName = formatNameWithLevel(net.opponentName || "Opponent", net.opponentLevel || 0);
  if (net.player === 1) {
    setScoreboardLabels(myName, oppName, { p1Level: getPlayerLevel(), p2Level: net.opponentLevel || 0 });
  } else if (net.player === 2) {
    setScoreboardLabels(oppName, myName, { p1Level: net.opponentLevel || 0, p2Level: getPlayerLevel() });
  } else {
    setScoreboardLabels("LEFT", "RIGHT");
  }
}

function startLocalMode(level = 1) {
  if (!isBotLevelUnlocked(level)) {
    openBotLevelSelect();
    if (ui.botLevelHint) ui.botLevelHint.textContent = `Level ${level} is locked.`;
    return;
  }
  stopMenuBg();
  applyBotLevel(level);
  s.mode = "local";
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  setScoreboardLabels(
    formatNameWithLevel(getPlayerName() || "You", getPlayerLevel()),
    `BOT L${s.botLevel}`,
    { p1Level: getPlayerLevel(), p2Level: null }
  );
  ui.hint.textContent = `${getPlayerName()} (L${getPlayerLevel()}) vs BOT L${s.botLevel} — 10 parries → Fire Smash.`;
  resetLocalMatch();
}

function openLobby() {
  stopMenuBg();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.lobbyOverlay);
  setStagePlaying(false);
  stopSearchUI();
  ui.lobbyStatus.textContent = "Create a room, join with a code, or search for a match.";
  ui.hint.textContent = "Online 1v1 — share your room code with a friend.";
}

function backToMenu() {
  closeWs();
  stopGameMusic();
  s.mode = "menu";
  s.gameOver = false;
  s.running = false;
  hideOverlay(ui.gameOver);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
  setScoreboardLabels("LEFT", "RIGHT");
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  ui.status.textContent = "Ready";
  updateNameUI();
  if (!hasValidName()) ui.hint.textContent = "Enter your name to start.";
  updatePointsUI();
  updateResignButton();
  resetAbility();
  if (ui.abilityBar) ui.abilityBar.classList.add("hidden");
  startMenuBg();
}

let adminBound = false;

function bindAdminControls() {
  if (adminBound || !isAdmin()) return;
  adminBound = true;
  const bind = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", handler);
  };
  bind(ui.btnAdminAddPts, () => {
    const n = parseInt(ui.adminPointsInput?.value, 10);
    adminAddPoints(Number.isFinite(n) ? n : 10);
  });
  bind(ui.btnAdminSetPts, () => {
    const n = parseInt(ui.adminPointsInput?.value, 10);
    adminSetPoints(Number.isFinite(n) ? n : 0);
  });
  bind(ui.btnAdminUnlockAll, adminUnlockAll);
  bind(ui.btnAdminMaxPts, () => adminAddPoints(999));
  bind(ui.btnAdminUnlockLevels, adminUnlockAllLevels);
  bind(ui.btnAdminSetLevel, () => {
    const n = parseInt(ui.adminLevelInput?.value, 10);
    adminSetPlayerLevel(Number.isFinite(n) ? n : 0);
  });
  if (ui.adminLevelInput) {
    ui.adminLevelInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        const n = parseInt(ui.adminLevelInput.value, 10);
        adminSetPlayerLevel(Number.isFinite(n) ? n : 0);
      }
    });
  }
  const bindToggle = (el, key) => {
    if (!el) return;
    el.addEventListener("change", (e) => setAdminAbility(key, e.target.checked));
  };
  bindToggle(ui.abMegaPaddle, "megaPaddle");
  bindToggle(ui.abFreeShop, "freeShop");
  bindToggle(ui.abSlowBot, "slowBot");
  bindToggle(ui.abBonusPts, "bonusPts");
}

function unlockAdminSession(hours = 24) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, String(Date.now() + hours * 3600000));
  loadAbilities();
  initAdminUi();
  bindAdminControls();
}

function submitPasskey() {
  const code = ui.passkeyInput?.value || "";
  if (!code) {
    if (ui.passkeyMsg) ui.passkeyMsg.textContent = "Enter passkey.";
    return;
  }
  if (code !== ADMIN_PASSKEY) {
    if (ui.passkeyMsg) ui.passkeyMsg.textContent = "Wrong passkey.";
    return;
  }
  unlockAdminSession();
  hideOverlay(ui.passkeyOverlay);
  if (ui.passkeyMsg) ui.passkeyMsg.textContent = "";
  if (ui.passkeyInput) ui.passkeyInput.value = "";
  openAdmin();
}

function openPasskeyOverlay() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  showOverlay(ui.passkeyOverlay);
  if (ui.passkeyMsg) ui.passkeyMsg.textContent = "";
  if (ui.passkeyInput) {
    ui.passkeyInput.value = "";
    ui.passkeyInput.focus();
  }
}

function closePasskeyOverlay() {
  hideOverlay(ui.passkeyOverlay);
  showOverlay(ui.menuOverlay);
}

function bindUi() {
  const bind = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", () => {
      playMenuClick();
      handler();
    });
  };

  bind(ui.btnLocal, () => requireName(openBotLevelSelect));
  bind(ui.btnOnline, () => requireName(openLobby));
  bind(ui.btnCustomize, () => requireName(openCustomize));
  bind(ui.btnNameSubmit, submitName);
  bind(ui.btnChangeName, () => openNameOverlay(true));
  bind(ui.btnBotLevelBack, closeBotLevelSelect);
  document.querySelectorAll(".bot-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      playMenuClick();
      const level = parseInt(btn.dataset.level, 10) || 1;
      if (!isBotLevelUnlocked(level)) {
        if (ui.botLevelHint) {
          ui.botLevelHint.textContent = `Locked — clear level ${level - 1} first.`;
        }
        return;
      }
      startLocalMode(level);
    });
  });
  if (ui.nameInput) {
    ui.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        submitName();
      }
    });
  }
  bind(ui.btnCustomizeBack, closeCustomize);
  bind(ui.btnAdmin, openAdminOrPasskey);
  bind(ui.btnAdminBack, closeAdmin);
  bind(ui.btnBackMenu, backToMenu);
  bind(ui.backToMenu, backToMenu);
  bind(ui.btnCreateRoom, () => connectWs(() => sendWs({ type: "create" })));
  bind(ui.btnSearch, startMatchSearch);
  bind(ui.btnCancelSearch, cancelMatchSearch);
  bind(ui.btnJoinRoom, () => {
    const code = ui.roomCodeInput.value.trim().toUpperCase();
    if (code.length !== 4) {
      ui.lobbyStatus.textContent = "Enter a 4-letter room code.";
      return;
    }
    connectWs(() => sendWs({ type: "join", code }));
  });
  bind(ui.playAgain, () => {
    if (s.mode === "online") {
      sendWs({ type: "rematch" });
      hideOverlay(ui.gameOver);
      s.gameOver = false;
      ui.status.textContent = serveHint();
      startGameMusic();
      updateResignButton();
      return;
    }
    applyBotLevel(s.botLevel);
    resetLocalMatch();
  });

  bind(ui.btnResign, resignMatch);

  document.querySelectorAll(".shop-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      playMenuClick();
      setShopTab(tab.dataset.tab);
    });
  });

  bindAdminControls();

  bind(ui.btnPasskeySubmit, submitPasskey);
  bind(ui.btnPasskeyCancel, closePasskeyOverlay);
  if (ui.passkeyInput) {
    ui.passkeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        submitPasskey();
      }
    });
  }

  let titleClicks = 0;
  let titleClickTimer = null;
  if (ui.titleEl) {
    ui.titleEl.style.cursor = "default";
    ui.titleEl.addEventListener("click", () => {
      titleClicks += 1;
      clearTimeout(titleClickTimer);
      titleClickTimer = setTimeout(() => {
        titleClicks = 0;
      }, 700);
      if (titleClicks >= 3) {
        titleClicks = 0;
        playMenuClick();
        if (isAdmin()) openAdmin();
        else openPasskeyOverlay();
      }
    });
  }
}

function setPaddleFromClientY(clientY) {
  const r = canvas.getBoundingClientRect();
  const y = ((clientY - r.top) / r.height) * H;
  s.mouseY = clamp(y, table.y, table.y + table.h);
}

function bindCanvasInput() {
  canvas.style.touchAction = "none";

  canvas.addEventListener("mousemove", (e) => setPaddleFromClientY(e.clientY));

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setPaddleFromClientY(e.clientY);
    if (s.mode !== "local" && s.mode !== "online") return;
    if (s.mode === "local" && s.running && tryActivateFireSmash()) return;
    serve();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    setPaddleFromClientY(e.clientY);
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches[0]) setPaddleFromClientY(e.touches[0].clientY);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        setPaddleFromClientY(e.touches[0].clientY);
      }
    },
    { passive: false }
  );
}

bindCanvasInput();

const MENU_BG_COLORS = [
  "#ff4d6d", "#ff9f1c", "#2ec4b6", "#7b2cbf", "#4361ee",
  "#06d6a0", "#ef476f", "#ffd166", "#118ab2", "#f72585",
  "#4cc9f0", "#80ed99", "#f4a261", "#e76f51", "#a2d2ff",
];
const MENU_BG_SHAPES = ["circle", "square", "triangle", "diamond", "ring"];

const menuBg = {
  canvas: document.getElementById("menuBg"),
  ctx: null,
  shapes: [],
  active: false,
  lastT: 0,
  w: 0,
  h: 0,
};

function resizeMenuBg() {
  if (!menuBg.canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  menuBg.w = window.innerWidth;
  menuBg.h = window.innerHeight;
  menuBg.canvas.width = Math.floor(menuBg.w * dpr);
  menuBg.canvas.height = Math.floor(menuBg.h * dpr);
  menuBg.ctx = menuBg.canvas.getContext("2d");
  menuBg.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnMenuShape(fromEdge = true) {
  const size = 10 + Math.random() * 42;
  const color = MENU_BG_COLORS[Math.floor(Math.random() * MENU_BG_COLORS.length)];
  const kind = MENU_BG_SHAPES[Math.floor(Math.random() * MENU_BG_SHAPES.length)];
  const speed = 18 + Math.random() * 55;
  const angle = Math.random() * Math.PI * 2;
  let x;
  let y;
  if (fromEdge) {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      x = -size;
      y = Math.random() * menuBg.h;
    } else if (edge === 1) {
      x = menuBg.w + size;
      y = Math.random() * menuBg.h;
    } else if (edge === 2) {
      x = Math.random() * menuBg.w;
      y = -size;
    } else {
      x = Math.random() * menuBg.w;
      y = menuBg.h + size;
    }
  } else {
    x = Math.random() * menuBg.w;
    y = Math.random() * menuBg.h;
  }
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    color,
    kind,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.4,
    life: 0,
    maxLife: 6 + Math.random() * 10,
    alpha: 0,
  };
}

function drawMenuShape(ctx, sh) {
  ctx.save();
  ctx.translate(sh.x, sh.y);
  ctx.rotate(sh.rot);
  ctx.globalAlpha = sh.alpha;
  ctx.fillStyle = sh.color;
  ctx.strokeStyle = sh.color;
  ctx.lineWidth = Math.max(2, sh.size * 0.12);
  const r = sh.size;
  if (sh.kind === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sh.kind === "ring") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sh.kind === "square") {
    ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
  } else if (sh.kind === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.45, 0);
    ctx.lineTo(0, r * 0.55);
    ctx.lineTo(-r * 0.45, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.5, r * 0.45);
    ctx.lineTo(-r * 0.5, r * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function updateMenuBg(now) {
  if (!menuBg.active || !menuBg.ctx) return;
  const dt = Math.min(0.05, (now - menuBg.lastT) / 1000 || 0.016);
  menuBg.lastT = now;
  const ctx = menuBg.ctx;
  ctx.clearRect(0, 0, menuBg.w, menuBg.h);

  const g = ctx.createRadialGradient(
    menuBg.w * 0.5,
    menuBg.h * 0.45,
    40,
    menuBg.w * 0.5,
    menuBg.h * 0.5,
    Math.max(menuBg.w, menuBg.h) * 0.75
  );
  g.addColorStop(0, "#12121a");
  g.addColorStop(0.55, "#08080c");
  g.addColorStop(1, "#030305");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, menuBg.w, menuBg.h);

  while (menuBg.shapes.length < 42) {
    menuBg.shapes.push(spawnMenuShape(menuBg.shapes.length > 12));
  }

  for (const sh of menuBg.shapes) {
    sh.life += dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.rot += sh.spin * dt;
    const fadeIn = Math.min(1, sh.life / 0.8);
    const fadeOut = Math.min(1, (sh.maxLife - sh.life) / 1.2);
    sh.alpha = Math.max(0, Math.min(0.72, fadeIn * fadeOut * 0.72));
    drawMenuShape(ctx, sh);
  }

  menuBg.shapes = menuBg.shapes.filter((sh) => {
    if (sh.life >= sh.maxLife) return false;
    const m = sh.size + 60;
    return sh.x > -m && sh.x < menuBg.w + m && sh.y > -m && sh.y < menuBg.h + m;
  });
}

function startMenuBg() {
  if (!menuBg.canvas) return;
  resizeMenuBg();
  if (!menuBg.shapes.length) {
    for (let i = 0; i < 36; i++) menuBg.shapes.push(spawnMenuShape(false));
  }
  menuBg.active = true;
  menuBg.lastT = performance.now();
  document.body.classList.add("menu-bg-active");
}

function stopMenuBg() {
  menuBg.active = false;
  document.body.classList.remove("menu-bg-active");
  if (menuBg.ctx && menuBg.w) menuBg.ctx.clearRect(0, 0, menuBg.w, menuBg.h);
}

window.addEventListener("resize", () => {
  if (menuBg.active) resizeMenuBg();
});

async function boot() {
  await loadSave();
  updatePointsUI();
  initAdminUi();
  bindUi();
  if (hasValidName()) {
    hideOverlay(ui.nameOverlay);
    showOverlay(ui.menuOverlay);
    updateNameUI();
    startMenuBg();
  } else {
    hideOverlay(ui.menuOverlay);
    showOverlay(ui.nameOverlay);
    if (ui.nameInput) ui.nameInput.focus();
    ui.hint.textContent = "Enter your name to start.";
    startMenuBg();
  }
  if (stageEl) stageEl.classList.add("menu-open");
  requestAnimationFrame(frame);
}

boot();
