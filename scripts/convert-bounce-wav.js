const fs = require("fs");
const path = require("path");

function convert24to16(src, dst) {
  const buf = fs.readFileSync(src);
  let pos = 12;
  let rate = 48000;
  let dataStart = -1;
  let dataSize = 0;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const chunk = pos + 8;
    if (id === "fmt ") {
      rate = buf.readUInt32LE(chunk + 4);
    } else if (id === "data") {
      dataStart = chunk;
      dataSize = size;
      break;
    }
    pos = chunk + size + (size % 2);
  }
  if (dataStart < 0) throw new Error("no data " + src);
  const samples = Math.floor(dataSize / 3);
  const pcm = Buffer.alloc(samples * 2);
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const o = dataStart + i * 3;
    let v = buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16);
    if (v & 0x800000) v |= ~0xffffff;
    let s16 = (v / 256) | 0;
    if (s16 > 32767) s16 = 32767;
    if (s16 < -32768) s16 = -32768;
    pcm.writeInt16LE(s16, i * 2);
    const a = Math.abs(s16);
    if (a > peak) peak = a;
  }
  let gain = 1;
  if (peak > 0 && peak < 16000) gain = Math.min(4, 24000 / peak);
  if (gain !== 1) {
    for (let i = 0; i < samples; i++) {
      let s = Math.round(pcm.readInt16LE(i * 2) * gain);
      if (s > 32767) s = 32767;
      if (s < -32768) s = -32768;
      pcm.writeInt16LE(s, i * 2);
    }
  }
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
  fs.writeFileSync(dst, out);
  console.log(path.basename(dst), "samples", samples, "peakIn", peak, "gain", gain.toFixed(2));
}

const root = path.join(__dirname, "..", "sfx");
for (let i = 1; i <= 4; i++) {
  convert24to16(
    path.join(root, `cup-bounce${i}.wav`),
    path.join(root, `bounce${i}.wav`)
  );
}
