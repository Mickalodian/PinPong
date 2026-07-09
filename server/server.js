const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const ROOT = [path.join(__dirname, "public"), path.join(__dirname, "..")].find((dir) =>
  fs.existsSync(path.join(dir, "index.html"))
) || path.join(__dirname, "public");
const SCORE_LIMIT = 5;
const TICK_RATE = 60;
const BROADCAST_RATE = 20;

const GAME = {
  W: 900,
  H: 520,
  table: { x: 38, y: 26, w: 900 - 76, h: 520 - 52 },
  paddle: { w: 14, h: 110, inset: 18 },
  ball: { r: 8, speed0: 430, speedMax: 1000 },
};

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

const rooms = new Map();
const matchQueue = [];

const PROFILES_PATH = path.join(__dirname, "profiles.json");
const ADMIN_CODE = process.env.ADMIN_CODE || "4536";
const adminSessions = new Map();

function loadProfiles() {
  try {
    if (fs.existsSync(PROFILES_PATH)) {
      return JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveProfiles(db) {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(db, null, 2));
}

function defaultProfile() {
  return {
    name: "",
    points: 0,
    owned: { paddle: ["white"], table: ["classic"] },
    equipped: { paddle: "white", table: "classic" },
  };
}

function sanitizeName(name) {
  const clean = String(name || "")
    .trim()
    .replace(/[^\w\s\-'.]/g, "")
    .slice(0, 16);
  return clean.length >= 1 ? clean : "Player";
}

const VALID_PADDLE = new Set([
  "white", "blue", "pink", "orange", "red", "green", "yellow", "purple", "cyan",
  "galaxy", "moon", "sunset", "neon", "lava", "ice", "rainbow", "aurora",
]);
const VALID_TABLE = new Set([
  "classic", "blue", "pink", "orange", "red", "green", "yellow", "purple", "cyan",
  "galaxy", "moon", "sunset", "neon", "lava", "ice", "rainbow", "aurora",
]);

function sanitizeCosmetics(cos) {
  if (!cos) return null;
  const paddle = VALID_PADDLE.has(cos.paddle) ? cos.paddle : "white";
  const table = VALID_TABLE.has(cos.table) ? cos.table : "classic";
  return { paddle, table };
}

function relayCosmetics(room, ws) {
  const other = room.players[ws.playerSlot === 0 ? 1 : 0];
  if (other && other.readyState === 1) {
    other.send(JSON.stringify({
      type: "oCos",
      paddle: ws.cosmetics?.paddle || "white",
      table: ws.cosmetics?.table || "classic",
      name: ws.displayName || "Opponent",
    }));
  }
}

function exchangeCosmetics(room) {
  const p0 = room.players[0];
  const p1 = room.players[1];
  if (p0?.readyState === 1 && p1) {
    p0.send(JSON.stringify({
      type: "oCos",
      paddle: p1.cosmetics?.paddle || "white",
      table: p1.cosmetics?.table || "classic",
      name: p1.displayName || "Opponent",
    }));
  }
  if (p1?.readyState === 1 && p0) {
    p1.send(JSON.stringify({
      type: "oCos",
      paddle: p0.cosmetics?.paddle || "white",
      table: p0.cosmetics?.table || "classic",
      name: p0.displayName || "Opponent",
    }));
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, urlPath) {
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("Method not allowed");
    return true;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.writeHead(400);
    res.end("Bad request");
    return true;
  }

  if (urlPath === "api/admin-auth") {
    const code = String(body.code || "");
    if (code !== ADMIN_CODE) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false }));
      return true;
    }
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    adminSessions.set(token, Date.now() + 24 * 60 * 60 * 1000);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, token, expiresIn: 86400 }));
    return true;
  }

  if (urlPath === "api/profile") {
    const playerId = String(body.playerId || "").trim();
    if (!playerId || playerId.length < 8) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid player id" }));
      return true;
    }
    const db = loadProfiles();
    if (body.action === "get") {
      const profile = db[playerId] || defaultProfile();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ profile }));
      return true;
    }
    if (body.action === "save" && body.profile) {
      const p = body.profile;
      db[playerId] = {
        name: sanitizeName(p.name || db[playerId]?.name || ""),
        points: Math.max(0, Number(p.points) || 0),
        owned: {
          paddle: Array.isArray(p.owned?.paddle) ? p.owned.paddle : ["white"],
          table: Array.isArray(p.owned?.table) ? p.owned.table : ["classic"],
        },
        equipped: {
          paddle: String(p.equipped?.paddle || "white"),
          table: String(p.equipped?.table || "classic"),
        },
        updatedAt: Date.now(),
      };
      if (!db[playerId].owned.paddle.includes("white")) db[playerId].owned.paddle.unshift("white");
      if (!db[playerId].owned.table.includes("classic")) db[playerId].owned.table.unshift("classic");
      saveProfiles(db);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return true;
    }
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unknown action" }));
    return true;
  }

  return false;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? makeCode() : code;
}

function paddleX(side) {
  const { table, paddle } = GAME;
  return side === 1
    ? table.x + paddle.inset
    : table.x + table.w - paddle.inset - paddle.w;
}

function createState() {
  const { table, paddle } = GAME;
  return {
    p1y: table.y + (table.h - paddle.h) / 2,
    p2y: table.y + (table.h - paddle.h) / 2,
    ball: { x: table.x + table.w / 2, y: table.y + table.h / 2, vx: 0, vy: 0 },
    p1Score: 0,
    p2Score: 0,
    running: false,
    gameOver: false,
    winner: null,
    serveRight: true,
  };
}

function resetBall(state, servingToRight) {
  const { table, ball } = GAME;
  state.ball.x = table.x + table.w / 2;
  state.ball.y = table.y + table.h / 2;
  const dir = servingToRight ? 1 : -1;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  const sp = ball.speed0;
  state.ball.vx = Math.cos(angle) * sp * dir;
  state.ball.vy = Math.sin(angle) * sp;
  state.running = false;
  state.serveRight = servingToRight;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function reflectFromPaddle(state, side) {
  const { paddle, ball } = GAME;
  const y = side === 1 ? state.p1y : state.p2y;
  const mid = y + paddle.h / 2;
  const t = clamp((state.ball.y - mid) / (paddle.h / 2), -1, 1);
  const speed = clamp(
    Math.hypot(state.ball.vx, state.ball.vy) * 1.05,
    ball.speed0,
    ball.speedMax
  );
  const maxBounce = 0.42 * Math.PI;
  const a = t * maxBounce;
  const dir = side === 1 ? 1 : -1;
  state.ball.vx = Math.cos(a) * speed * dir;
  state.ball.vy = Math.sin(a) * speed;
  return true;
}

function segmentHitsPaddle(ox, oy, nx, ny, px, py, pw, ph) {
  const { ball } = GAME;
  const edgePad = 4;
  const r = ball.r;
  const dist = Math.hypot(nx - ox, ny - oy);
  const samples = Math.max(10, Math.ceil(dist / 3));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const cx = ox + (nx - ox) * t;
    const cy = oy + (ny - oy) * t;
    if (
      cx + r > px &&
      cx - r < px + pw &&
      cy + r > py - edgePad &&
      cy - r < py + ph + edgePad
    ) {
      return true;
    }
  }
  return false;
}

function ballOverlapsPaddle(bx, by, px, py, pw, ph) {
  const { ball } = GAME;
  const edgePad = 4;
  const r = ball.r;
  return (
    bx + r > px &&
    bx - r < px + pw &&
    by + r > py - edgePad &&
    by - r < py + ph + edgePad
  );
}

function resolvePaddleHit(state, side) {
  const { paddle, ball } = GAME;
  const px = paddleX(side);
  if (side === 1) state.ball.x = px + paddle.w + ball.r;
  else state.ball.x = px - ball.r;
  reflectFromPaddle(state, side);
}

function tryPaddleHit(state, side, ox, oy, nx, ny) {
  const { paddle } = GAME;
  const movingToward =
    (side === 1 && state.ball.vx < 0) || (side === 2 && state.ball.vx > 0);
  if (!movingToward) return false;
  const px = paddleX(side);
  const py = side === 1 ? state.p1y : state.p2y;
  if (!segmentHitsPaddle(ox, oy, nx, ny, px, py, paddle.w, paddle.h)) return false;
  resolvePaddleHit(state, side);
  return true;
}

function overlapPaddleHit(state, side) {
  const { paddle } = GAME;
  const movingToward =
    (side === 1 && state.ball.vx < 0) || (side === 2 && state.ball.vx > 0);
  if (!movingToward) return false;
  const px = paddleX(side);
  const py = side === 1 ? state.p1y : state.p2y;
  if (!ballOverlapsPaddle(state.ball.x, state.ball.y, px, py, paddle.w, paddle.h)) return false;
  resolvePaddleHit(state, side);
  return true;
}

function tickBall(state, dt) {
  const { table, ball } = GAME;
  let hit = false;
  let scored = null;

  const ox = state.ball.x;
  const oy = state.ball.y;

  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  const top = table.y;
  const bottom = table.y + table.h;
  if (state.ball.y - ball.r <= top) {
    state.ball.y = top + ball.r;
    state.ball.vy *= -1;
  } else if (state.ball.y + ball.r >= bottom) {
    state.ball.y = bottom - ball.r;
    state.ball.vy *= -1;
  }

  if (tryPaddleHit(state, 1, ox, oy, state.ball.x, state.ball.y)) hit = true;
  else if (tryPaddleHit(state, 2, ox, oy, state.ball.x, state.ball.y)) hit = true;
  else if (overlapPaddleHit(state, 1)) hit = true;
  else if (overlapPaddleHit(state, 2)) hit = true;

  if (state.ball.x < table.x - 40) scored = "p2";
  else if (state.ball.x > table.x + table.w + 40) scored = "p1";

  return { hit, scored };
}

function tickRoom(state, dt) {
  if (state.gameOver || !state.running) return { hit: false, scored: null };

  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  const steps = speed > 700 ? 16 : speed > 500 ? 12 : 8;
  const subDt = dt / steps;
  let hit = false;
  let scored = null;

  for (let i = 0; i < steps; i++) {
    const result = tickBall(state, subDt);
    if (result.hit) hit = true;
    if (result.scored) {
      scored = result.scored;
      break;
    }
  }

  if (scored) {
    if (scored === "p1") state.p1Score += 1;
    else state.p2Score += 1;

    const score = scored === "p1" ? state.p1Score : state.p2Score;
    if (score >= SCORE_LIMIT) {
      state.gameOver = true;
      state.winner = scored;
      state.running = false;
    } else {
      resetBall(state, scored === "p1");
    }
  }

  return { hit, scored };
}

function compactState(state) {
  const b = state.ball;
  return {
    t: Date.now(),
    y1: Math.round(state.p1y),
    y2: Math.round(state.p2y),
    b: [Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy)],
    s: [state.p1Score, state.p2Score],
    r: state.running ? 1 : 0,
    o: state.gameOver ? (state.winner === "p1" ? 1 : 2) : 0,
  };
}

function sendState(room, extra = {}) {
  const payload = { type: "s", d: compactState(room.state), ...extra };
  const data = JSON.stringify(payload);
  for (const player of room.players) {
    if (player && player.readyState === 1) player.send(data);
  }
}

function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  for (const player of room.players) {
    if (player && player.readyState === 1) player.send(data);
  }
}

function removeFromQueue(ws) {
  const idx = matchQueue.indexOf(ws);
  if (idx >= 0) matchQueue.splice(idx, 1);
  ws.searchingSince = null;
}

function startMatch(room) {
  resetBall(room.state, true);
  exchangeCosmetics(room);
  broadcast(room, { type: "matchReady" });
  sendState(room);
  startLoop(room);
}

function pairSearchers(ws1, ws2) {
  removeFromQueue(ws1);
  removeFromQueue(ws2);
  const code = makeCode();
  const room = {
    code,
    players: [null, null],
    state: createState(),
    interval: null,
    lastTick: Date.now(),
    tickAcc: 0,
    broadcastAcc: 0,
    matchmade: true,
  };
  rooms.set(code, room);
  attachPlayer(room, ws1, 0);
  attachPlayer(room, ws2, 1);
  ws1.send(JSON.stringify({ type: "matchFound", code, player: 1 }));
  ws2.send(JSON.stringify({ type: "matchFound", code, player: 2 }));
  startMatch(room);
}

function tryMatchmake(ws) {
  if (ws.roomCode) return;
  removeFromQueue(ws);
  const opponent = matchQueue.find((q) => q !== ws && q.readyState === 1 && !q.roomCode);
  if (opponent) {
    pairSearchers(opponent, ws);
    return;
  }
  ws.searchingSince = Date.now();
  matchQueue.push(ws);
  ws.send(JSON.stringify({ type: "searching", startedAt: ws.searchingSince }));
}

function roomStatus(room) {
  const count = room.players.filter(Boolean).length;
  return { type: "waiting", players: count, code: room.code };
}

function startLoop(room) {
  if (room.interval) return;
  room.lastTick = Date.now();
  room.tickAcc = 0;
  room.broadcastAcc = 0;

  room.interval = setInterval(() => {
    const now = Date.now();
    const frameDt = Math.min(0.05, (now - room.lastTick) / 1000);
    room.lastTick = now;

    let hit = false;
    let scored = null;

    if (room.state.running && !room.state.gameOver) {
      room.tickAcc += frameDt;
      const fixedDt = 1 / TICK_RATE;
      while (room.tickAcc >= fixedDt) {
        const result = tickRoom(room.state, fixedDt);
        room.tickAcc -= fixedDt;
        if (result.hit) hit = true;
        if (result.scored) {
          scored = result.scored;
          break;
        }
      }
    }

    room.broadcastAcc += frameDt;
    const ball = room.state.ball;
    const nearPaddle =
      room.state.running &&
      (ball.x < GAME.table.x + 160 || ball.x > GAME.table.x + GAME.table.w - 160);
    const shouldBroadcast =
      hit ||
      scored ||
      nearPaddle ||
      room.broadcastAcc >= 1 / BROADCAST_RATE ||
      !room.state.running;

    if (shouldBroadcast) {
      const extra = {};
      if (hit) extra.h = 1;
      if (scored) extra.g = scored === "p1" ? 1 : 2;
      sendState(room, extra);
      room.broadcastAcc = 0;
    }
  }, 1000 / TICK_RATE);
}

function stopLoop(room) {
  if (!room.interval) return;
  clearInterval(room.interval);
  room.interval = null;
}

function removeRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  stopLoop(room);
  rooms.delete(code);
}

function attachPlayer(room, ws, slot) {
  room.players[slot] = ws;
  ws.roomCode = room.code;
  ws.playerSlot = slot;
}

function findOpenSlot(room) {
  if (!room.players[0]) return 0;
  if (!room.players[1]) return 1;
  return -1;
}

function handleDisconnect(ws) {
  removeFromQueue(ws);
  const code = ws.roomCode;
  if (!code || !rooms.has(code)) return;
  const room = rooms.get(code);
  const slot = ws.playerSlot;
  if (slot === 0 || slot === 1) room.players[slot] = null;
  stopLoop(room);
  broadcast(room, { type: "opponentLeft" });
  if (!room.players[0] && !room.players[1]) removeRoom(code);
}

function setPaddleY(state, slot, normalizedY) {
  const { table, paddle } = GAME;
  const centerY = table.y + clamp(normalizedY, 0, 1) * table.h;
  const y = clamp(centerY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);
  if (slot === 0) state.p1y = y;
  else state.p2y = y;
}

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/") urlPath = "index.html";
  urlPath = urlPath.replace(/^\/+/, "");

  if (urlPath.startsWith("api/")) {
    handleApi(req, res, urlPath)
      .then((handled) => {
        if (!handled) {
          res.writeHead(404);
          res.end("Not found");
        }
      })
      .catch(() => {
        res.writeHead(500);
        res.end("Server error");
      });
    return;
  }

  let filePath;
  const rootResolved = path.resolve(ROOT);

  // Serve owner admin key from repo root only (never copied to public/)
  if (urlPath === "admin.local.js") {
    const adminPath = path.resolve(ROOT, "..", "admin.local.js");
    const parentDir = path.resolve(ROOT, "..");
    if (!adminPath.startsWith(parentDir) || !fs.existsSync(adminPath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    filePath = adminPath;
  } else {
    filePath = path.resolve(ROOT, urlPath);
    if (!filePath.startsWith(rootResolved)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "text/plain" });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);
const wss = new WebSocketServer({ server, perMessageDeflate: false });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "search") {
      if (ws.roomCode) {
        ws.send(JSON.stringify({ type: "error", message: "Already in a room" }));
        return;
      }
      tryMatchmake(ws);
      return;
    }

    if (msg.type === "cancelSearch") {
      removeFromQueue(ws);
      ws.send(JSON.stringify({ type: "searchCancelled" }));
      return;
    }

    if (msg.type === "create") {
      removeFromQueue(ws);
      const code = makeCode();
      const room = {
        code,
        players: [null, null],
        state: createState(),
        interval: null,
        lastTick: Date.now(),
        tickAcc: 0,
        broadcastAcc: 0,
      };
      rooms.set(code, room);
      attachPlayer(room, ws, 0);
      ws.send(JSON.stringify({ type: "roomCreated", code, player: 1 }));
      ws.send(JSON.stringify(roomStatus(room)));
      if (ws.cosmetics) relayCosmetics(room, ws);
      return;
    }

    if (msg.type === "join") {
      removeFromQueue(ws);
      const code = String(msg.code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
      }
      const slot = findOpenSlot(room);
      if (slot < 0) {
        ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
        return;
      }
      attachPlayer(room, ws, slot);
      ws.send(JSON.stringify({ type: "joined", code, player: slot + 1 }));
      broadcast(room, roomStatus(room));
      if (ws.cosmetics) relayCosmetics(room, ws);
      if (room.players[0] && room.players[1]) {
        resetBall(room.state, true);
        exchangeCosmetics(room);
        broadcast(room, { type: "matchReady" });
        sendState(room);
        startLoop(room);
      }
      return;
    }

    if (msg.type === "profileGet" && msg.playerId) {
      const db = loadProfiles();
      const profile = db[msg.playerId] || defaultProfile();
      ws.send(JSON.stringify({ type: "profile", profile }));
      return;
    }

    if (msg.type === "profileSave" && msg.playerId && msg.profile) {
      const db = loadProfiles();
      const p = msg.profile;
      db[msg.playerId] = {
        name: sanitizeName(p.name || db[msg.playerId]?.name || ""),
        points: Math.max(0, Number(p.points) || 0),
        owned: {
          paddle: Array.isArray(p.owned?.paddle) ? p.owned.paddle : ["white"],
          table: Array.isArray(p.owned?.table) ? p.owned.table : ["classic"],
        },
        equipped: {
          paddle: String(p.equipped?.paddle || "white"),
          table: String(p.equipped?.table || "classic"),
        },
        updatedAt: Date.now(),
      };
      saveProfiles(db);
      ws.send(JSON.stringify({ type: "profileSaved", ok: true }));
      return;
    }

    const room = ws.roomCode ? rooms.get(ws.roomCode) : null;

    if (msg.type === "cosmetics" && msg.paddle && msg.table) {
      ws.cosmetics = sanitizeCosmetics({ paddle: String(msg.paddle), table: String(msg.table) });
      if (msg.name) ws.displayName = sanitizeName(msg.name);
      if (room) relayCosmetics(room, ws);
      return;
    }

    if (!room) return;

    if (msg.type === "paddle" && typeof msg.y === "number") {
      setPaddleY(room.state, ws.playerSlot, msg.y);
      const other = room.players[ws.playerSlot === 0 ? 1 : 0];
      if (other && other.readyState === 1) {
        other.send(JSON.stringify({ type: "p", y: msg.y }));
      }
      return;
    }

    if (msg.type === "serve" && !room.state.running && !room.state.gameOver) {
      room.state.running = true;
      sendState(room);
      return;
    }

    if (msg.type === "rematch" && room.state.gameOver) {
      room.state = createState();
      resetBall(room.state, true);
      sendState(room);
      startLoop(room);
      return;
    }

    if (msg.type === "resign" && room.state.running && !room.state.gameOver) {
      const winner = ws.playerSlot === 0 ? "p2" : "p1";
      room.state.gameOver = true;
      room.state.winner = winner;
      room.state.running = false;
      broadcast(room, {
        type: "resigned",
        by: ws.playerSlot + 1,
        score: [room.state.p1Score, room.state.p2Score],
      });
    }
  });

  ws.on("close", () => handleDisconnect(ws));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pong server running on port ${PORT}`);
});
