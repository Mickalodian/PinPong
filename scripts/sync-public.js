const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, "server", "public");
const files = ["index.html", "game.js", "style.css"];

fs.mkdirSync(dest, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(dest, file));
}

const packSrc = path.join(root, "avatar-pack");
const packDest = path.join(dest, "avatar-pack");
if (fs.existsSync(packSrc)) {
  fs.mkdirSync(packDest, { recursive: true });
  for (const name of fs.readdirSync(packSrc)) {
    fs.copyFileSync(path.join(packSrc, name), path.join(packDest, name));
  }
}

console.log("Synced static files to server/public");
