const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, "server", "public");
const files = ["index.html", "game.js", "style.css"];

fs.mkdirSync(dest, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(dest, file));
}
console.log("Synced static files to server/public");
