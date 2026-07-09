const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const ROOT = [path.join(__dirname, "public"), path.join(__dirname, "..")].find((dir) =>
  fs.existsSync(path.join(dir, "index.html"))
) || path.join(__dirname, "public");
const SCORE_LIMIT = 5;

const GAME = {
  W: 900,
  H: 520,
  table: { x: 38, y: 26, w: 788, h: 468 },
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

function tickBall(state, dt) {
  const { table, paddle, ball } = GAME;
  let hit = false;
  let scored = null;

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

  const p1x = paddleX(1);
  const p2x = paddleX(2);
  const pad = 3;
  const bLeft = state.ball.x - ball.r;
  const bTop = state.ball.y - ball.r;
  const bSize = ball.r * 2;

  if (
    state.ball.vx < 0 &&
    rectsOverlap(
      bLeft,
      bTop,
      bSize,
      bSize,
      p1x - pad,
      state.p1y - pad,
      paddle.w + pad * 2,
      paddle.h + pad * 2
    )
  ) {
    state.ball.x = p1x + paddle.w + ball.r;
    hit = reflectFromPaddle(state, 1);
  }

  if (
    state.ball.vx > 0 &&
    rectsOverlap(
      bLeft,
      bTop,
      bSize,
      bSize,
      p2x - pad,
      state.p2y - pad,
      paddle.w + pad * 2,
      paddle.h + pad * 2
    )
  ) {
    state.ball.x = p2x - ball.r;
    hit = reflectFromPaddle(state, 2);
  }

  if (state.ball.x < table.x - 40) {
    scored = "p2";
  } else if (state.ball.x > table.x + table.w + 40) {
    scored = "p1";
  }

  return { hit, scored };
}

function tickRoom(room, dt) {
  const state = room.state;
  if (state.gameOver || !state.running) return { hit: false, scored: null };

  const steps = 4;
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

function publicState(state) {
  return {
    t: Date.now(),
    p1y: state.p1y,
    p2y: state.p2y,
    ball: { ...state.ball },
    p1Score: state.p1Score,
    p2Score: state.p2Score,
    running: state.running,
    gameOver: state.gameOver,
    winner: state.winner,
  };
}

function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  for (const player of room.players) {
    if (player && player.readyState === 1) player.send(data);
  }
}

function roomStatus(room) {
  const count = room.players.filter(Boolean).length;
  return { type: "waiting", players: count, code: room.code };
}

function startLoop(room) {
  if (room.interval) return;
  room.lastTick = Date.now();
  room.interval = setInterval(() => {
    const now = Date.now();
    const dt = Math.min(0.03, (now - room.lastTick) / 1000);
    room.lastTick = now;

    const result = tickRoom(room, dt);
    const payload = { type: "state", state: publicState(room.state) };
    if (result.hit) payload.hit = true;
    if (result.scored) payload.scored = result.scored;
    broadcast(room, payload);
  }, 1000 / 60);
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

  const filePath = path.resolve(ROOT, urlPath);
  const rootResolved = path.resolve(ROOT);
  if (!filePath.startsWith(rootResolved)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
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

    if (msg.type === "create") {
      const code = makeCode();
      const room = { code, players: [null, null], state: createState(), interval: null, lastTick: Date.now() };
      rooms.set(code, room);
      attachPlayer(room, ws, 0);
      ws.send(JSON.stringify({ type: "roomCreated", code, player: 1 }));
      ws.send(JSON.stringify(roomStatus(room)));
      return;
    }

    if (msg.type === "join") {
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
      if (room.players[0] && room.players[1]) {
        resetBall(room.state, true);
        broadcast(room, { type: "matchReady" });
        broadcast(room, { type: "state", state: publicState(room.state) });
        startLoop(room);
      }
      return;
    }

    const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
    if (!room) return;

    if (msg.type === "paddle" && typeof msg.y === "number") {
      setPaddleY(room.state, ws.playerSlot, msg.y);
      const other = room.players[ws.playerSlot === 0 ? 1 : 0];
      if (other && other.readyState === 1) {
        other.send(
          JSON.stringify({
            type: "opponentPaddle",
            player: ws.playerSlot + 1,
            y: msg.y,
            t: Date.now(),
          })
        );
      }
      return;
    }

    if (msg.type === "serve" && !room.state.running && !room.state.gameOver) {
      room.state.running = true;
      broadcast(room, { type: "state", state: publicState(room.state) });
      return;
    }

    if (msg.type === "rematch" && room.state.gameOver) {
      room.state = createState();
      resetBall(room.state, true);
      broadcast(room, { type: "state", state: publicState(room.state) });
      startLoop(room);
    }
  });

  ws.on("close", () => handleDisconnect(ws));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pong server running on port ${PORT}`);
});
