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

/** Pre-seeded accounts that must choose a password on first login. */
const RESERVED_CLAIM_USERS = [
  { username: "shazita", displayName: "Shazita" },
  { username: "bethanyy", displayName: "Bethanyy" },
  { username: "nathan_c01", displayName: "Nathan_C01" },
  { username: "orchardd", displayName: "Orchardd" },
];

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
  ensureReservedAccounts(db);
  return db[OWNER_USERNAME];
}

function ensureReservedAccounts(existingDb) {
  const db = existingDb || loadAccounts();
  let dirty = false;
  for (const entry of RESERVED_CLAIM_USERS) {
    const key = sanitizeUsername(entry.username);
    if (!key) continue;
    const existing = db[key];
    if (existing && existing.mustSetPassword === false) {
      // Already claimed — leave password and flags alone.
      if (entry.displayName && existing.displayName !== entry.displayName) {
        existing.displayName = entry.displayName;
        dirty = true;
      }
      continue;
    }
    if (existing && !existing.mustSetPassword) {
      // Account exists with a real password (no claim flag) — do not overwrite.
      continue;
    }
    if (existing && existing.mustSetPassword) {
      if (entry.displayName && existing.displayName !== entry.displayName) {
        existing.displayName = entry.displayName;
        dirty = true;
      }
      continue;
    }
    const { hash, salt } = hashPassword(crypto.randomBytes(24).toString("hex"));
    db[key] = {
      username: key,
      displayName: entry.displayName,
      passwordHash: hash,
      salt,
      playerId: crypto.randomUUID(),
      isOwner: false,
      isAdmin: false,
      mustSetPassword: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dirty = true;
  }
  if (dirty) saveAccounts(db);
  return db;
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

function usernameExists(username) {
  const acc = getAccount(username);
  if (!acc) return { ok: true, exists: false, username: sanitizeUsername(username) };
  return {
    ok: true,
    exists: true,
    username: acc.displayName || acc.username,
    usernameKey: acc.username,
    playerId: acc.playerId,
    banned: isAccountCurrentlyBanned(acc),
  };
}

function registerAccount({ username, password, playerId }) {
  ensureOwnerAccount();
  ensureReservedAccounts();
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
  ensureReservedAccounts();
  const user = sanitizeUsername(username);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  clearExpiredBanInPlace(acc, db, user);
  if (isAccountCurrentlyBanned(acc)) {
    const until = acc.bannedUntil ? new Date(acc.bannedUntil).toLocaleString() : null;
    return {
      ok: false,
      error: until ? `This account is banned until ${until}.` : "This account is permanently banned.",
    };
  }
  if (acc.mustSetPassword) {
    return {
      ok: false,
      mustSetPassword: true,
      username: acc.displayName || acc.username,
      error: "Choose a new password for this account.",
    };
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
  let dirty = false;
  for (const [key, acc] of Object.entries(db)) {
    if (acc && clearExpiredBanInPlace(acc, null, key)) dirty = true;
  }
  if (dirty) saveAccounts(db);
  return Object.values(db)
    .filter((a) => a && a.username && a.playerId)
    .map((a) => {
      const banned = isAccountCurrentlyBanned(a);
      return {
        username: a.displayName || a.username,
        usernameKey: a.username,
        playerId: a.playerId,
        isOwner: !!a.isOwner || isOwnerUsername(a.username),
        isAdmin: !!(a.isAdmin || a.isOwner || isOwnerUsername(a.username)),
        banned,
        bannedUntil: banned ? a.bannedUntil || 0 : 0,
        banDuration: banned ? a.banDuration || (a.bannedUntil ? "" : "permanent") : "",
        createdAt: a.createdAt || 0,
        updatedAt: a.updatedAt || 0,
      };
    })
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

const BAN_DURATION_MS = {
  "2h": 2 * 60 * 60 * 1000,
  "7h": 7 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "2d": 2 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  permanent: null,
};

const BAN_DURATION_LABELS = {
  "2h": "2 hours",
  "7h": "7 hours",
  "24h": "24 hours",
  "2d": "2 days",
  "7d": "7 days",
  "30d": "30 days",
  permanent: "permanent",
};

function isAccountCurrentlyBanned(acc) {
  if (!acc || !acc.banned) return false;
  if (!acc.bannedUntil) return true; // permanent
  return Date.now() < Number(acc.bannedUntil);
}

/** Clears expired temp bans. If db is provided, persists. Returns true if changed. */
function clearExpiredBanInPlace(acc, db, userKey) {
  if (!acc || !acc.banned || !acc.bannedUntil) return false;
  if (Date.now() < Number(acc.bannedUntil)) return false;
  acc.banned = false;
  acc.bannedUntil = 0;
  acc.banDuration = "";
  acc.updatedAt = Date.now();
  if (db) saveAccounts(db);
  return true;
}

function setAccountBanned(usernameOrKey, banned, durationKey = "permanent") {
  const user = sanitizeUsername(usernameOrKey);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (accountIsOwner(acc, user)) return { ok: false, error: "Cannot ban the owner account" };

  if (!banned) {
    acc.banned = false;
    acc.bannedUntil = 0;
    acc.banDuration = "";
  } else {
    const key = BAN_DURATION_MS.hasOwnProperty(durationKey) ? durationKey : "permanent";
    const ms = BAN_DURATION_MS[key];
    acc.banned = true;
    acc.banDuration = key;
    acc.bannedUntil = ms == null ? 0 : Date.now() + ms;
  }
  acc.updatedAt = Date.now();
  saveAccounts(db);
  for (const [token, session] of sessions.entries()) {
    if (session && sanitizeUsername(session.username) === user) sessions.delete(token);
  }
  return {
    ok: true,
    username: acc.displayName || acc.username,
    banned: isAccountCurrentlyBanned(acc),
    bannedUntil: acc.bannedUntil || 0,
    banDuration: acc.banDuration || "",
    banLabel: banned
      ? acc.bannedUntil
        ? `Banned until ${new Date(acc.bannedUntil).toLocaleString()}`
        : "Permanently banned"
      : "Not banned",
    playerId: acc.playerId,
  };
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

function requestPasswordReset(username) {
  ensureOwnerAccount();
  const user = sanitizeUsername(username);
  if (user.length < 3) return { ok: false, error: "Enter a valid username" };
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) {
    // Same response either way to avoid account enumeration? User wants ticket for their account - show not found is clearer for a small game.
    return { ok: false, error: "Account not found" };
  }
  if (accountIsOwner(acc, user)) {
    return { ok: false, error: "Owner password cannot be reset this way" };
  }
  if (isAccountCurrentlyBanned(acc)) {
    return { ok: false, error: "This account is banned" };
  }
  acc.passwordResetRequested = true;
  acc.passwordResetRequestedAt = Date.now();
  acc.passwordResetAllowed = false;
  acc.passwordResetCode = "";
  acc.passwordResetExpires = 0;
  acc.updatedAt = Date.now();
  saveAccounts(db);
  return {
    ok: true,
    username: user,
    displayName: acc.displayName || acc.username,
    playerId: acc.playerId,
    message: "Password reset requested. An admin will review it, then you can enter your reset code and new password.",
  };
}

function approvePasswordReset(usernameOrKey) {
  ensureOwnerAccount();
  const user = sanitizeUsername(usernameOrKey);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (accountIsOwner(acc, user)) return { ok: false, error: "Cannot reset owner password this way" };
  acc.passwordResetAllowed = true;
  acc.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;
  acc.passwordResetRequested = false;
  acc.passwordResetCode = "";
  acc.updatedAt = Date.now();
  saveAccounts(db);
  return {
    ok: true,
    username: acc.displayName || acc.username,
    playerId: acc.playerId,
    expiresAt: acc.passwordResetExpires,
    message: "Approved. The player can now set a new password on their screen.",
  };
}

function denyPasswordReset(usernameOrKey) {
  ensureOwnerAccount();
  const user = sanitizeUsername(usernameOrKey);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  acc.passwordResetAllowed = false;
  acc.passwordResetRequested = false;
  acc.passwordResetExpires = 0;
  acc.passwordResetCode = "";
  acc.passwordResetDeniedAt = Date.now();
  acc.updatedAt = Date.now();
  saveAccounts(db);
  return { ok: true, username: acc.displayName || acc.username, message: "Password reset denied." };
}

function getPasswordResetStatus(username) {
  ensureOwnerAccount();
  const user = sanitizeUsername(username);
  if (user.length < 3) return { ok: false, error: "Enter a valid username" };
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  const expiresAt = Number(acc.passwordResetExpires || 0);
  const approved = !!acc.passwordResetAllowed && (!expiresAt || Date.now() <= expiresAt);
  const pending = !!acc.passwordResetRequested && !approved;
  return {
    ok: true,
    username: acc.displayName || acc.username,
    pending,
    approved,
    expiresAt: approved ? expiresAt : 0,
  };
}

function resetPasswordApproved({ username, newPassword }) {
  ensureOwnerAccount();
  ensureReservedAccounts();
  const user = sanitizeUsername(username);
  const db = loadAccounts();
  const acc = db[user];
  if (!acc) return { ok: false, error: "Account not found" };
  if (accountIsOwner(acc, user)) return { ok: false, error: "Owner password cannot be reset this way" };

  const claiming = !!acc.mustSetPassword;
  if (!claiming) {
    if (!acc.passwordResetAllowed) {
      return { ok: false, error: "Reset is not approved yet — wait for an admin" };
    }
    if (acc.passwordResetExpires && Date.now() > Number(acc.passwordResetExpires)) {
      acc.passwordResetAllowed = false;
      acc.passwordResetExpires = 0;
      saveAccounts(db);
      return { ok: false, error: "Approval expired — ask an admin to approve again" };
    }
  }

  if (String(newPassword || "").length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }
  const { hash, salt } = hashPassword(newPassword);
  acc.passwordHash = hash;
  acc.salt = salt;
  acc.mustSetPassword = false;
  acc.passwordResetCode = "";
  acc.passwordResetExpires = 0;
  acc.passwordResetRequested = false;
  acc.passwordResetAllowed = false;
  acc.updatedAt = Date.now();
  saveAccounts(db);
  for (const [token, session] of sessions.entries()) {
    if (session && sanitizeUsername(session.username) === user) sessions.delete(token);
  }
  return {
    ok: true,
    username: acc.displayName || acc.username,
    message: claiming
      ? "Password saved. Please remember your password — you can log in now."
      : "Password updated. You can log in now.",
  };
}

module.exports = {
  registerAccount,
  loginAccount,
  getSession,
  destroySession,
  saveAvatarFile,
  resolveAvatarPath,
  ensureOwnerAccount,
  ensureReservedAccounts,
  isOwnerUsername,
  accountIsOwner,
  accountIsAdmin,
  getAccount,
  usernameExists,
  listAccountsPublic,
  findAccountByPlayerId,
  setAccountBanned,
  setAccountAdmin,
  destroySessionsForPlayerId,
  isAccountCurrentlyBanned,
  requestPasswordReset,
  approvePasswordReset,
  denyPasswordReset,
  getPasswordResetStatus,
  resetPasswordApproved,
  BAN_DURATION_MS,
  BAN_DURATION_LABELS,
  AVATARS_DIR,
  sanitizeUsername,
  OWNER_USERNAME,
  OWNER_DISPLAY,
};
