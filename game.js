const canvas = document.getElementById("game");
if (!canvas) throw new Error("Canvas #game not found");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const SCORE_LIMIT = 5;

const table = { x: 38, y: 26, w: W - 76, h: H - 52 };
const paddle = { w: 14, h: 110, inset: 18, aiSpeed: 560 };
const ballCfg = { r: 8, speed0: 430, speedMax: 1000 };

const SAVE_CACHE_KEY = "pong-bw-save";
const PLAYER_ID_KEY = "pong-player-id";
const ADMIN_SESSION_KEY = "pong-admin-until";
const ADMIN_PASSKEY = "4536";
const ABILITIES_KEY = "pong-bw-abilities";
const POINTS_PER_WIN = 2;

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
  ],
};

const save = {
  points: 0,
  owned: { paddle: ["white"], table: ["classic"] },
  equipped: { paddle: "white", table: "classic" },
  shopTab: "paddle",
  abilities: { megaPaddle: false, freeShop: false, slowBot: false, bonusPts: false },
};

function isAdmin() {
  const until = parseInt(sessionStorage.getItem(ADMIN_SESSION_KEY) || "0", 10);
  return Date.now() < until;
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
  if (typeof data.points === "number") save.points = data.points;
  if (data.owned?.paddle) save.owned.paddle = data.owned.paddle;
  if (data.owned?.table) save.owned.table = data.owned.table;
  if (data.equipped?.paddle) save.equipped.paddle = data.equipped.paddle;
  if (data.equipped?.table) save.equipped.table = data.equipped.table;
  if (!save.owned.paddle.includes("white")) save.owned.paddle.unshift("white");
  if (!save.owned.table.includes("classic")) save.owned.table.unshift("classic");
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
      localStorage.setItem(
        SAVE_CACHE_KEY,
        JSON.stringify({ points: save.points, owned: save.owned, equipped: save.equipped })
      );
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
        profile: { points: save.points, owned: save.owned, equipped: save.equipped },
      }),
    });
  } catch {
    /* offline */
  }
}

async function loadSave() {
  loadAbilities();
  try {
    const raw = localStorage.getItem(SAVE_CACHE_KEY);
    if (raw) applyProfile(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  await syncProfileFromServer();
}

function persistSave() {
  try {
    const payload = { points: save.points, owned: save.owned, equipped: save.equipped };
    localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(payload));
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
  if (!won) return;
  const gain = isAdmin() && save.abilities.bonusPts ? 10 : POINTS_PER_WIN;
  save.points += gain;
  persistSave();
  updatePointsUI();
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
  } else {
    c.globalAlpha = alpha;
    c.fillStyle = item.color || "#fff";
    return;
  }
  c.globalAlpha = alpha;
  c.fillStyle = g;
}

function drawSwatch(item, el) {
  const c = document.createElement("canvas");
  c.width = 100;
  c.height = 40;
  const cctx = c.getContext("2d");
  applyFillStyle(cctx, item, 0, 0, c.width, c.height, 1);
  cctx.fillRect(0, 0, c.width, c.height);
  el.style.backgroundImage = `url(${c.toDataURL()})`;
  el.style.backgroundSize = "cover";
}

function renderShop() {
  if (!ui.shopGrid) return;
  const kind = save.shopTab;
  ui.shopGrid.innerHTML = "";
  for (const item of SHOP[kind]) {
    const owned = save.owned[kind].includes(item.id);
    const equipped = save.equipped[kind] === item.id;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-item";
    if (equipped) btn.classList.add("equipped");
    const free = isAdmin() && save.abilities.freeShop;
    if (!owned && !free && save.points < item.price) btn.classList.add("cant-afford");
    const swatch = document.createElement("div");
    swatch.className = "shop-swatch";
    drawSwatch(item, swatch);
    const name = document.createElement("div");
    name.className = "shop-name";
    name.textContent = item.name;
    const price = document.createElement("div");
    price.className = "shop-price";
    price.textContent = item.price === 0 ? "Free" : `${item.price} pts`;
    btn.append(swatch, name, price);
    if (equipped) {
      const b = document.createElement("span");
      b.className = "shop-badge";
      b.textContent = "ON";
      btn.appendChild(b);
    }
    btn.addEventListener("click", () => {
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
  hideOverlay(ui.lobbyOverlay);
  showOverlay(ui.customizeOverlay);
  setStagePlaying(false);
  updatePointsUI();
  setShopTab(save.shopTab);
  if (ui.shopMsg) ui.shopMsg.textContent = "Buy or equip a colour.";
}

function closeCustomize() {
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
  const alpha = style.price >= 20 ? 0.5 : 0.38;
  applyFillStyle(ctx, style, x, table.y, halfW, table.h, alpha);
  ctx.fillRect(x, table.y, halfW, table.h);
  ctx.globalAlpha = 1;
}

function drawPaddleRect(p, side) {
  const h = effectivePaddleH(side);
  const eq = equippedForSide(side);
  const style = shopItem("paddle", eq.paddle);
  applyFillStyle(ctx, style, p.x, p.y, paddle.w, h, 1);
  ctx.fillRect(p.x, p.y, paddle.w, h);
  ctx.globalAlpha = 1;
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
  p1: document.getElementById("p1"),
  p2: document.getElementById("p2"),
  p1Label: document.getElementById("p1Label"),
  p2Label: document.getElementById("p2Label"),
  status: document.getElementById("status"),
  menuOverlay: document.getElementById("menuOverlay"),
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
  adminMsg: document.getElementById("adminMsg"),
  abMegaPaddle: document.getElementById("abMegaPaddle"),
  abFreeShop: document.getElementById("abFreeShop"),
  abSlowBot: document.getElementById("abSlowBot"),
  abBonusPts: document.getElementById("abBonusPts"),
  titleEl: document.getElementById("titleEl"),
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
  lastT: performance.now(),
  mouseY: table.y + table.h / 2,
  ai: { timer: 0, interval: 0.11, targetY: table.y + table.h / 2, errorPx: 28 },
  fx: { scoreT: 0, who: "p1", particles: [] },
  p1: { x: table.x + paddle.inset, y: table.y + (table.h - paddle.h) / 2, score: 0 },
  p2: {
    x: table.x + table.w - paddle.inset - paddle.w,
    y: table.y + (table.h - paddle.h) / 2,
    score: 0,
  },
  ball: { x: table.x + table.w / 2, y: table.y + table.h / 2, vx: 0, vy: 0 },
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
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
  ui.btnResign.classList.toggle("hidden", !(inMatch && !lobbyOpen && !menuOpen));
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

function showOverlay(el) {
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  if (stageEl && (el === ui.menuOverlay || el === ui.lobbyOverlay || el === ui.customizeOverlay || el === ui.adminOverlay || el === ui.passkeyOverlay)) {
    stageEl.classList.add("menu-open");
  }
}

function hideOverlay(el) {
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (stageEl && (el === ui.menuOverlay || el === ui.lobbyOverlay || el === ui.customizeOverlay || el === ui.adminOverlay || el === ui.passkeyOverlay)) {
    stageEl.classList.remove("menu-open");
  }
}

function setScoreboardLabels(left, right) {
  ui.p1Label.textContent = left;
  ui.p2Label.textContent = right;
}

function normalizedMouseY() {
  return clamp((s.mouseY - table.y) / table.h, 0, 1);
}

function setStagePlaying(on) {
  if (!stageEl) return;
  stageEl.classList.toggle("playing", on);
  stageEl.classList.toggle("menu-open", !on && s.mode === "menu");
  updateResignButton();
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
  if (!s.gameOver) ui.status.textContent = serveHint();
}

function scoreFx(who) {
  s.fx.scoreT = 0.65;
  s.fx.who = who;
  s.fx.particles.length = 0;
  playScoreSound();
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

  let youWon = false;
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
    ui.gameOverTitle.textContent = youWon ? "YOU WIN (+2 PTS)" : "BOT WINS";
  } else {
    youWon = (winner === "p1" && net.player === 1) || (winner === "p2" && net.player === 2);
    ui.gameOverTitle.textContent = youWon ? "YOU WIN (+2 PTS)" : "YOU LOSE";
  }

  ui.gameOverScore.textContent = `${s.p1.score} : ${s.p2.score}`;
  if (justEnded) {
    awardWinPoints(winner);
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
  resetBall(true);
  ui.status.textContent = serveHint();
  setStagePlaying(true);
  startGameMusic();
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
  const speed = clamp(
    Math.hypot(s.ball.vx, s.ball.vy) * 1.05,
    ballCfg.speed0,
    ballCfg.speedMax
  );
  const maxBounce = 0.42 * Math.PI;
  const a = t * maxBounce;
  const dir = side === "p1" ? 1 : -1;
  s.ball.vx = Math.cos(a) * speed * dir;
  s.ball.vy = Math.sin(a) * speed;
  playPaddleHit();
}

function tryLocalPaddleHit(p, side) {
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

  if (!s.gameOver) {
    const botSpeed = isAdmin() && save.abilities.slowBot ? paddle.aiSpeed * 0.45 : paddle.aiSpeed;
    s.ai.timer -= dt;
    if (s.ai.timer <= 0) {
      s.ai.timer = s.ai.interval + (Math.random() * 0.05 - 0.02);
      const err = (Math.random() * 2 - 1) * s.ai.errorPx;
      s.ai.targetY = s.ball.y - paddle.h / 2 + err;
    }
    const dy = s.ai.targetY - s.p2.y;
    const maxStep = botSpeed * dt;
    s.p2.y = clamp(
      s.p2.y + clamp(dy * 0.75, -maxStep, maxStep),
      table.y + 6,
      table.y + table.h - paddle.h - 6
    );
  }

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
  tryLocalPaddleHit(s.p2, "p2");

  if (s.ball.x < table.x - 40) {
    s.p2.score += 1;
    ui.p2.textContent = String(s.p2.score);
    scoreFx("p2");
    if (s.p2.score >= SCORE_LIMIT) endGame("p2");
    else resetBall(false);
  } else if (s.ball.x > table.x + table.w + 40) {
    s.p1.score += 1;
    ui.p1.textContent = String(s.p1.score);
    scoreFx("p1");
    if (s.p1.score >= SCORE_LIMIT) endGame("p1");
    else resetBall(true);
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
  drawPaddleRect(s.p2, "p2");
  ctx.fillStyle = "#fff";
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
}

function sendCosmetics() {
  sendWs({
    type: "cosmetics",
    paddle: save.equipped.paddle,
    table: save.equipped.table,
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
    ui.hint.textContent = "Online 1v1. " + controlHint().replace("paddle. ", "your paddle. ");
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
  if (net.player === 1) {
    setScoreboardLabels("YOU", "OPPONENT");
  } else if (net.player === 2) {
    setScoreboardLabels("OPPONENT", "YOU");
  } else {
    setScoreboardLabels("LEFT", "RIGHT");
  }
}

function startLocalMode() {
  s.mode = "local";
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  setScoreboardLabels("YOU", "BOT");
  ui.hint.textContent = controlHint() + " First to 5 wins.";
  resetLocalMatch();
}

function openLobby() {
  hideOverlay(ui.menuOverlay);
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
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
  setScoreboardLabels("LEFT", "RIGHT");
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  ui.status.textContent = "Ready";
  ui.hint.textContent = "Choose a mode to start.";
  updatePointsUI();
  updateResignButton();
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
    el.addEventListener("click", handler);
  };

  bind(ui.btnLocal, startLocalMode);
  bind(ui.btnOnline, openLobby);
  bind(ui.btnCustomize, openCustomize);
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
    resetLocalMatch();
  });

  bind(ui.btnResign, resignMatch);

  document.querySelectorAll(".shop-tab").forEach((tab) => {
    tab.addEventListener("click", () => setShopTab(tab.dataset.tab));
  });

  bindAdminControls();

  bind(ui.btnPasskeySubmit, submitPasskey);
  bind(ui.btnPasskeyCancel, closePasskeyOverlay);
  if (ui.passkeyInput) {
    ui.passkeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitPasskey();
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
    if (s.mode === "local" || s.mode === "online") serve();
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

async function boot() {
  await loadSave();
  updatePointsUI();
  initAdminUi();
  bindAdminControls();
  if (stageEl) stageEl.classList.add("menu-open");
  bindUi();
  ui.hint.textContent = isTouchDevice
    ? "Choose a mode. Works on iPhone, Android, and PC."
    : "Choose a mode to start.";
  requestAnimationFrame(frame);
}

boot();
