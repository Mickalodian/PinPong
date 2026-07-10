const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ACCOUNTS_PATH = path.join(__dirname, "accounts.json");
const AVATARS_DIR = path.join(__dirname, "avatars");
const sessions = new Map();

/** Owner account — only this user can access Admin (case-insensitive username). */
const OWNER_USERNAME = "mikloit";
const OWNER_DISPLAY = "MikLoit";
const OWNER_PASSWORD = "Miki2002";

function ensureAvatarsDir() {
  try {
    if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function loadAccounts() {
  try {
    if (fs.existsSync(ACCOUNTS_PATH)) {
      return JSON.parse(fs.readFileSync(ACCOUNTS_PATH, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveAccounts(db) {
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(db, null, 2));
}

function sanitizeUsername(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16);
}

function isOwnerUsername(username) {
  return sanitizeUsername(username) === OWNER_USERNAME;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(String(expectedHash), "hex"));
  } catch {
    return false;
  }
}

function createSession(username, playerId, isOwner = false) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    username,
    playerId,
    isOwner: !!isOwner,
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const s = sessions.get(String(token));
  if (!s) return null;
  if (Date.now() > s.expires) {
    sessions.delete(String(token));
    return null;
  }
  return s;
}

function destroySession(token) {
  sessions.delete(String(token || ""));
}

function ensureOwnerAccount() {
  const db = loadAccounts();
  const { hash, salt } = hashPassword(OWNER_PASSWORD);
  const existing = db[OWNER_USERNAME];
  const playerId =
    existing && typeof existing.playerId === "string" && existing.playerId.length >= 8
      ? existing.playerId
      : crypto.randomUUID();
  db[OWNER_USERNAME] = {
    username: OWNER_USERNAME,
    displayName: OWNER_DISPLAY,
    passwordHash: hash,
    salt,
    playerId,
    isOwner: true,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  for (const key of Object.keys(db)) {
    if (key !== OWNER_USERNAME && db[key]) db[key].isOwner = false;
  }
  saveAccounts(db);
  return db[OWNER_USERNAME];
}

function accountIsOwner(acc, username) {
  if (!acc) return false;
  return !!(acc.isOwner || isOwnerUsername(username || acc.username));
}

function getAccount(username) {
  const user = sanitizeUsername(username);
  const db = loadAccounts();
  return db[user] || null;
}

function registerAccount({ username, password, playerId }) {
  ensureOwnerAccount();
  const user = sanitizeUsername(username);
  if (user.length < 3) return { ok: false, error: "Username must be 3–16 letters, numbers, or _" };
  if (isOwnerUsername(user)) {
    return { ok: false, error: "That username is reserved. Log in instead." };
  }
  if (String(password || "").length < 6) return { ok: false, error: "Password must be at least 6 characters" };
  const pid = String(playerId || "").trim();
  if (!pid || pid.length < 8) return { ok: false, error: "Invalid player id" };

  const db = loadAccounts();
  if (db[user]) return { ok: false, error: "Username already taken" };

  const { hash, salt } = hashPassword(password);
  db[user] = {
    username: user,
    passwordHash: hash,
    salt,
    playerId: pid,
    isOwner: false,
    createdAt: Date.now(),
  };
  saveAccounts(db);
  const token = createSession(user, pid, false);
  return { ok: true, token, username: user, playerId: pid, isOwner: false };
}

function loginAccount({ username, password }) {
  ensureOwnerAccount();
  const user = sanitizeUsername(username);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (!verifyPassword(password, acc.salt, acc.passwordHash)) {
    return { ok: false, error: "Wrong password" };
  }
  const owner = accountIsOwner(acc, user);
  const token = createSession(acc.username, acc.playerId, owner);
  return {
    ok: true,
    token,
    username: acc.displayName || acc.username,
    playerId: acc.playerId,
    isOwner: owner,
  };
}

function saveAvatarFile(playerId, dataUrl) {
  ensureAvatarsDir();
  const m = String(dataUrl || "").match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) return { ok: false, error: "Use a PNG, JPG, or WEBP image" };
  const ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 450000) return { ok: false, error: "Image too large (max ~350KB)" };
  const safeId = String(playerId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!safeId) return { ok: false, error: "Invalid player" };
  const fileName = `${safeId}.${ext}`;
  const filePath = path.join(AVATARS_DIR, fileName);
  for (const e of ["png", "jpg", "webp"]) {
    const old = path.join(AVATARS_DIR, `${safeId}.${e}`);
    if (e !== ext && fs.existsSync(old)) {
      try {
        fs.unlinkSync(old);
      } catch {
        /* ignore */
      }
    }
  }
  fs.writeFileSync(filePath, buf);
  return { ok: true, avatarUrl: `/avatars/${fileName}?t=${Date.now()}` };
}

function resolveAvatarPath(urlPath) {
  ensureAvatarsDir();
  const name = path.basename(String(urlPath || ""));
  if (!/^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(name)) return null;
  const full = path.join(AVATARS_DIR, name);
  if (!full.startsWith(AVATARS_DIR)) return null;
  if (!fs.existsSync(full)) return null;
  return full;
}

ensureOwnerAccount();

module.exports = {
  registerAccount,
  loginAccount,
  getSession,
  destroySession,
  saveAvatarFile,
  resolveAvatarPath,
  ensureOwnerAccount,
  isOwnerUsername,
  accountIsOwner,
  getAccount,
  AVATARS_DIR,
  sanitizeUsername,
  OWNER_USERNAME,
  OWNER_DISPLAY,
};
