const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const LOG = path.resolve(__dirname, "..", "..", "Desktop", "debug-e4bbdd.log");
const url = "ws://127.0.0.1:3000";

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

function waitMsg(ws, pred, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      if (pred(msg)) {
        clearTimeout(t);
        resolve(msg);
      }
    });
  });
}

async function main() {
  const a = await connect();
  const b = await connect();
  a.send(JSON.stringify({ type: "create" }));
  const created = await waitMsg(a, (m) => m.type === "roomCreated");
  b.send(JSON.stringify({ type: "join", code: created.code }));
  await waitMsg(b, (m) => m.type === "joined");
  await waitMsg(a, (m) => m.type === "matchReady");
  await waitMsg(b, (m) => m.type === "matchReady");
  a.send(JSON.stringify({ type: "serve" }));
  for (let i = 0; i < 400; i++) {
    const y = 0.35 + Math.sin(i / 18) * 0.25;
    a.send(JSON.stringify({ type: "paddle", y }));
    b.send(JSON.stringify({ type: "paddle", y: 0.65 + Math.cos(i / 14) * 0.2 }));
    await new Promise((r) => setTimeout(r, 16));
  }
  a.close();
  b.close();
  if (fs.existsSync(LOG)) {
    const lines = fs.readFileSync(LOG, "utf8").trim().split("\n");
    const p2 = lines.filter((l) => l.includes('"side":2')).length;
    const p1 = lines.filter((l) => l.includes('"side":1')).length;
    console.log(`log lines=${lines.length} p1Hits=${p1} p2Hits=${p2}`);
    console.log(lines.slice(-5).join("\n"));
  } else {
    console.log("no log at", LOG);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
