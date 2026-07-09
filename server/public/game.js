const canvas = document.getElementById("game");
if (!canvas) throw new Error("Canvas #game not found");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const SCORE_LIMIT = 5;

const table = { x: 38, y: 26, w: W - 76, h: H - 52 };
const paddle = { w: 14, h: 110, inset: 18, aiSpeed: 560 };
const ballCfg = { r: 8, speed0: 430, speedMax: 1000 };

function dbgLog(hypothesisId, location, message, data = {}) {
  // #region agent log
  fetch("http://127.0.0.1:7715/ingest/a7f8c61b-f68b-44f7-981d-52bb95ff3807", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e4bbdd" },
    body: JSON.stringify({
      sessionId: "e4bbdd",
      runId: "pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
  roomCodeInput: document.getElementById("roomCodeInput"),
  gameOver: document.getElementById("gameOver"),
  gameOverTitle: document.getElementById("gameOverTitle"),
  gameOverScore: document.getElementById("gameOverScore"),
  playAgain: document.getElementById("playAgain"),
  backToMenu: document.getElementById("backToMenu"),
  btnLocal: document.getElementById("btnLocal"),
  btnOnline: document.getElementById("btnOnline"),
  btnCreateRoom: document.getElementById("btnCreateRoom"),
  btnJoinRoom: document.getElementById("btnJoinRoom"),
  btnBackMenu: document.getElementById("btnBackMenu"),
};

let audioCtx = null;
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
};

const NET_INTERP_MS = 70;

function inCenterCourt(ballX) {
  const margin = 220;
  return ballX > table.x + margin && ballX < table.x + table.w - margin;
}

function nearPaddleZone(ballX) {
  return ballX < table.x + 200 || ballX > table.x + table.w - 200;
}

function ballOverlapsRect(x, y, w, h) {
  const r = ballCfg.r;
  const cx = s.ball.x;
  const cy = s.ball.y;
  const closestX = clamp(cx, x, x + w);
  const closestY = clamp(cy, y, y + h);
  return Math.hypot(cx - closestX, cy - closestY) <= r + 1;
}

function clampVisualBallAtPaddles() {
  if (!net.snap?.ball) return;

  const serverVx = net.snap.ball.vx;

  if (net.player === 1 && s.ball.vx > 0 && serverVx > 0) {
    const py = net.remotePaddleY ?? s.p2.y;
    const face = s.p2.x - ballCfg.r;
    if (s.ball.x > face && ballOverlapsRect(s.p2.x, py, paddle.w, paddle.h)) {
      s.ball.x = face;
    }
  } else if (net.player === 2 && s.ball.vx < 0 && serverVx < 0) {
    const py = net.remotePaddleY ?? s.p1.y;
    const face = s.p1.x + paddle.w + ballCfg.r;
    if (s.ball.x < face && ballOverlapsRect(s.p1.x, py, paddle.w, paddle.h)) {
      s.ball.x = face;
    }
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

function playPaddleHit() {
  ensureAudio();
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(920 + Math.random() * 120, t);
  osc.frequency.exponentialRampToValueAtTime(360, t + 0.08);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

function showOverlay(el) {
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  if (stageEl && (el === ui.menuOverlay || el === ui.lobbyOverlay)) {
    stageEl.classList.add("menu-open");
  }
}

function hideOverlay(el) {
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (stageEl && (el === ui.menuOverlay || el === ui.lobbyOverlay)) {
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

function endGame(winner) {
  s.gameOver = true;
  s.running = false;
  ui.status.textContent = "Game over";

  if (s.mode === "local") {
    ui.gameOverTitle.textContent = winner === "p1" ? "YOU WIN" : "BOT WINS";
  } else {
    const youWon = (winner === "p1" && net.player === 1) || (winner === "p2" && net.player === 2);
    ui.gameOverTitle.textContent = youWon ? "YOU WIN" : "YOU LOSE";
  }

  ui.gameOverScore.textContent = `${s.p1.score} : ${s.p2.score}`;
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

function reflectFromPaddle(p) {
  const mid = p.y + paddle.h / 2;
  const t = clamp((s.ball.y - mid) / (paddle.h / 2), -1, 1);
  const speed = clamp(
    Math.hypot(s.ball.vx, s.ball.vy) * 1.05,
    ballCfg.speed0,
    ballCfg.speedMax
  );
  const maxBounce = 0.42 * Math.PI;
  const a = t * maxBounce;
  const dir = p === s.p1 ? 1 : -1;
  s.ball.vx = Math.cos(a) * speed * dir;
  s.ball.vy = Math.sin(a) * speed;
  playPaddleHit();
}

function updateLocal(dt) {
  s.p1.y = clamp(s.mouseY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);

  if (!s.gameOver) {
    s.ai.timer -= dt;
    if (s.ai.timer <= 0) {
      s.ai.timer = s.ai.interval + (Math.random() * 0.05 - 0.02);
      const err = (Math.random() * 2 - 1) * s.ai.errorPx;
      s.ai.targetY = s.ball.y - paddle.h / 2 + err;
    }
    const dy = s.ai.targetY - s.p2.y;
    const maxStep = paddle.aiSpeed * dt;
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

  const bLeft = s.ball.x - ballCfg.r;
  const bTop = s.ball.y - ballCfg.r;
  const bSize = ballCfg.r * 2;

  if (
    s.ball.vx < 0 &&
    rectsOverlap(bLeft, bTop, bSize, bSize, s.p1.x, s.p1.y, paddle.w, paddle.h)
  ) {
    s.ball.x = s.p1.x + paddle.w + ballCfg.r;
    reflectFromPaddle(s.p1);
  }

  if (
    s.ball.vx > 0 &&
    rectsOverlap(bLeft, bTop, bSize, bSize, s.p2.x, s.p2.y, paddle.w, paddle.h)
  ) {
    s.ball.x = s.p2.x - ballCfg.r;
    reflectFromPaddle(s.p2);
  }

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
  return clamp(s.mouseY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);
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
    const ballNear = net.snap?.ball && nearPaddleZone(net.snap.ball.x);
    if (ballNear) {
      remote.y = net.remotePaddleY;
    } else {
      remote.y += (net.remotePaddleY - remote.y) * Math.min(1, dt * 24);
    }
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

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(table.x, table.y, table.w, table.h);
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2, table.y);
  ctx.lineTo(table.x + table.w / 2, table.y + table.h);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.fillRect(s.p1.x, s.p1.y, paddle.w, paddle.h);
  ctx.fillRect(s.p2.x, s.p2.y, paddle.w, paddle.h);
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
    if (s.mode === "online" && !s.gameOver) {
      ui.status.textContent = "Disconnected";
    }
  };
}

function handleWsMessage(msg) {
  if (msg.type === "roomCreated") {
    net.code = msg.code;
    net.player = msg.player;
    ui.lobbyStatus.textContent = `Room code: ${msg.code} — waiting for opponent...`;
    setOnlineLabels();
    return;
  }

  if (msg.type === "joined") {
    net.code = msg.code;
    net.player = msg.player;
    ui.lobbyStatus.textContent = `Joined room ${msg.code}. Waiting for match...`;
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
    hideOverlay(ui.lobbyOverlay);
    s.gameOver = false;
    hideOverlay(ui.gameOver);
    ui.hint.textContent = "Online 1v1. " + controlHint().replace("paddle. ", "your paddle. ");
    ui.status.textContent = serveHint();
    setStagePlaying(true);
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

  if (msg.type === "opponentLeft") {
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
  hideOverlay(ui.gameOver);
  setScoreboardLabels("YOU", "BOT");
  ui.hint.textContent = controlHint() + " First to 5 wins.";
  resetLocalMatch();
}

function openLobby() {
  s.mode = "online";
  hideOverlay(ui.menuOverlay);
  showOverlay(ui.lobbyOverlay);
  setStagePlaying(false);
  ui.lobbyStatus.textContent = "Create or join a room.";
  ui.hint.textContent = "Online 1v1 — share your room code with a friend.";
}

function backToMenu() {
  closeWs();
  s.mode = "menu";
  s.gameOver = false;
  s.running = false;
  hideOverlay(ui.gameOver);
  hideOverlay(ui.lobbyOverlay);
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
  setScoreboardLabels("LEFT", "RIGHT");
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  ui.status.textContent = "Ready";
  ui.hint.textContent = "Choose a mode to start.";
}

function bindUi() {
  const missing = Object.entries(ui).filter(([, el]) => !el).map(([key]) => key);
  dbgLog("H2", "game.js:bindUi", "ui elements resolved", { missing, missingCount: missing.length });

  const bind = (el, label, handler) => {
    if (!el) {
      dbgLog("H2", "game.js:bindUi", "missing button element", { label });
      return;
    }
    el.addEventListener("click", (...args) => {
      dbgLog("H5", "game.js:click", "button clicked", { label, mode: s.mode });
      handler(...args);
    });
  };

  bind(ui.btnLocal, "btnLocal", startLocalMode);
  bind(ui.btnOnline, "btnOnline", openLobby);
  bind(ui.btnBackMenu, "btnBackMenu", backToMenu);
  bind(ui.backToMenu, "backToMenu", backToMenu);
  bind(ui.btnCreateRoom, "btnCreateRoom", () => connectWs(() => sendWs({ type: "create" })));
  bind(ui.btnJoinRoom, "btnJoinRoom", () => {
    const code = ui.roomCodeInput.value.trim().toUpperCase();
    if (code.length !== 4) {
      ui.lobbyStatus.textContent = "Enter a 4-letter room code.";
      return;
    }
    connectWs(() => sendWs({ type: "join", code }));
  });
  bind(ui.playAgain, "playAgain", () => {
    if (s.mode === "online") {
      sendWs({ type: "rematch" });
      hideOverlay(ui.gameOver);
      s.gameOver = false;
      ui.status.textContent = serveHint();
      return;
    }
    resetLocalMatch();
  });

  dbgLog("H4", "game.js:bindUi", "ui bindings complete", { bound: true });
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

function boot() {
  try {
    if (stageEl) stageEl.classList.add("menu-open");
    bindUi();
    ui.hint.textContent = isTouchDevice
      ? "Choose a mode. Works on iPhone, Android, and PC."
      : "Choose a mode to start.";
    dbgLog("H1", "game.js:boot", "game booted", {
      href: location.href,
      host: location.host,
      protocol: location.protocol,
    });
    requestAnimationFrame(frame);
  } catch (err) {
    dbgLog("H3", "game.js:boot", "boot failed", { error: String(err) });
    throw err;
  }
}

boot();
