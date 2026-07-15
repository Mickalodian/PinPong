const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, "server", "public");
const files = ["index.html", "game.js", "style.css", "cuppong.js"];

fs.mkdirSync(dest, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(dest, file));
}

const assetsSrc = path.join(root, "assets");
const assetsDest = path.join(dest, "assets");
if (fs.existsSync(assetsSrc)) {
  fs.mkdirSync(assetsDest, { recursive: true });
  for (const name of fs.readdirSync(assetsSrc)) {
    const from = path.join(assetsSrc, name);
    if (fs.statSync(from).isFile() && name.endsWith(".svg")) {
      fs.copyFileSync(from, path.join(assetsDest, name));
    }
  }
}

const packSrc = path.join(root, "avatar-pack");
const packDest = path.join(dest, "avatar-pack");
if (fs.existsSync(packSrc)) {
  fs.mkdirSync(packDest, { recursive: true });
  for (const name of fs.readdirSync(packSrc)) {
    fs.copyFileSync(path.join(packSrc, name), path.join(packDest, name));
  }
}

const sfxSrc = path.join(root, "sfx");
const sfxDest = path.join(dest, "sfx");
if (fs.existsSync(sfxSrc)) {
  fs.mkdirSync(sfxDest, { recursive: true });
  for (const name of fs.readdirSync(sfxSrc)) {
    const from = path.join(sfxSrc, name);
    if (fs.statSync(from).isFile()) {
      fs.copyFileSync(from, path.join(sfxDest, name));
    }
  }
}

console.log("Synced static files to server/public");
