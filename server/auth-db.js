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

function createSession(username, playerId, isOwner = false, isAdmin = false) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    username,
    playerId,
    isOwner: !!isOwner,
    isAdmin: !!(isOwner || isAdmin),
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
    isAdmin: true,
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

function accountIsAdmin(acc, username) {
  if (!acc) return false;
  if (accountIsOwner(acc, username)) return true;
  return !!acc.isAdmin;
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
    isAdmin: false,
    createdAt: Date.now(),
  };
  saveAccounts(db);
  const token = createSession(user, pid, false, false);
  return { ok: true, token, username: user, playerId: pid, isOwner: false, isAdmin: false };
}

function loginAccount({ username, password }) {
  ensureOwnerAccount();
  const user = sanitizeUsername(username);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (acc.banned) {
    return { ok: false, error: "This account is banned." };
  }
  if (!verifyPassword(password, acc.salt, acc.passwordHash)) {
    return { ok: false, error: "Wrong password" };
  }
  const owner = accountIsOwner(acc, user);
  const admin = accountIsAdmin(acc, user);
  const token = createSession(acc.username, acc.playerId, owner, admin);
  return {
    ok: true,
    token,
    username: acc.displayName || acc.username,
    playerId: acc.playerId,
    isOwner: owner,
    isAdmin: admin,
  };
}

function listAccountsPublic() {
  ensureOwnerAccount();
  const db = loadAccounts();
  return Object.values(db)
    .filter((a) => a && a.username && a.playerId)
    .map((a) => ({
      username: a.displayName || a.username,
      usernameKey: a.username,
      playerId: a.playerId,
      isOwner: !!a.isOwner || isOwnerUsername(a.username),
      isAdmin: !!(a.isAdmin || a.isOwner || isOwnerUsername(a.username)),
      banned: !!a.banned,
      createdAt: a.createdAt || 0,
      updatedAt: a.updatedAt || 0,
    }))
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return String(a.username).localeCompare(String(b.username));
    });
}

function findAccountByPlayerId(playerId) {
  const pid = String(playerId || "").trim();
  if (!pid) return null;
  const db = loadAccounts();
  for (const acc of Object.values(db)) {
    if (acc && acc.playerId === pid) return acc;
  }
  return null;
}

function setAccountBanned(usernameOrKey, banned) {
  const user = sanitizeUsername(usernameOrKey);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (accountIsOwner(acc, user)) return { ok: false, error: "Cannot ban the owner account" };
  acc.banned = !!banned;
  acc.updatedAt = Date.now();
  saveAccounts(db);
  // Kill active sessions for this user
  for (const [token, session] of sessions.entries()) {
    if (session && sanitizeUsername(session.username) === user) sessions.delete(token);
  }
  return { ok: true, username: acc.displayName || acc.username, banned: !!acc.banned, playerId: acc.playerId };
}

function setAccountAdmin(usernameOrKey, makeAdmin) {
  const user = sanitizeUsername(usernameOrKey);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (accountIsOwner(acc, user)) {
    return { ok: false, error: "Owner always has admin — cannot change" };
  }
  acc.isAdmin = !!makeAdmin;
  acc.updatedAt = Date.now();
  saveAccounts(db);
  // Refresh live sessions so grant/revoke applies immediately
  for (const [, session] of sessions.entries()) {
    if (session && sanitizeUsername(session.username) === user) {
      session.isAdmin = !!makeAdmin;
      session.isOwner = false;
    }
  }
  return {
    ok: true,
    username: acc.displayName || acc.username,
    playerId: acc.playerId,
    isAdmin: !!acc.isAdmin,
    isOwner: false,
  };
}

function destroySessionsForPlayerId(playerId) {
  const pid = String(playerId || "").trim();
  if (!pid) return 0;
  let n = 0;
  for (const [token, session] of sessions.entries()) {
    if (session && session.playerId === pid) {
      sessions.delete(token);
      n += 1;
    }
  }
  return n;
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
  accountIsAdmin,
  getAccount,
  listAccountsPublic,
  findAccountByPlayerId,
  setAccountBanned,
  setAccountAdmin,
  destroySessionsForPlayerId,
  AVATARS_DIR,
  sanitizeUsername,
  OWNER_USERNAME,
  OWNER_DISPLAY,
};
