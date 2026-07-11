const fs = require("fs");
const path = require("path");

const sfxDir = path.join(__dirname, "..", "sfx");
const publicSfx = path.join(__dirname, "..", "server", "public", "sfx");

function readWav(p) {
  const b = fs.readFileSync(p);
  return { rate: b.readUInt32LE(24), pcm: b.slice(44) };
}

function writeWav(p, rate, pcm) {
  const out = Buffer.alloc(44 + pcm.length);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + pcm.length, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(pcm.length, 40);
  pcm.copy(out, 44);
  fs.writeFileSync(p, out);
}

const b64 = [];
let n = 0;
for (let f = 1; f <= 4; f++) {
  const { rate, pcm } = readWav(path.join(sfxDir, `bounce${f}.wav`));
  const samples = pcm.length / 2;
  let peak = 1;
  for (let i = 0; i < samples; i += 8) {
    const a = Math.abs(pcm.readInt16LE(i * 2));
    if (a > peak) peak = a;
  }
  const thr = Math.max(4000, peak * 0.28);
  const minGap = Math.floor(rate * 0.12);
  let last = -minGap;
  const hits = [];
  for (let i = 0; i < samples; i++) {
    const a = Math.abs(pcm.readInt16LE(i * 2));
    if (a >= thr && i - last >= minGap) {
      hits.push(Math.max(0, i - Math.floor(rate * 0.003)));
      last = i;
      if (hits.length >= 3) break;
      i += minGap;
    }
  }
  if (!hits.length) hits.push(0);
  for (const h of hits) {
    const len = Math.min(samples - h, Math.floor(rate * 0.14));
    const slice = Buffer.alloc(len * 2);
    pcm.copy(slice, 0, h * 2, h * 2 + len * 2);
    n += 1;
    const outPath = path.join(sfxDir, `hit${n}.wav`);
    writeWav(outPath, rate, slice);
    b64.push(fs.readFileSync(outPath).toString("base64"));
    console.log(`hit${n} from bounce${f} @ ${(h / rate).toFixed(3)}s`);
  }
}

const body = "window.CUP_PONG_BOUNCE_WAVS = " + JSON.stringify(b64) + ";\n";
fs.mkdirSync(publicSfx, { recursive: true });
fs.writeFileSync(path.join(sfxDir, "cup-bounce-samples.js"), body);
fs.writeFileSync(path.join(publicSfx, "cup-bounce-samples.js"), body);
for (let i = 1; i <= n; i++) {
  const name = `hit${i}.wav`;
  fs.copyFileSync(path.join(sfxDir, name), path.join(publicSfx, name));
}
console.log("embedded", b64.length, "clips,", body.length, "bytes");
