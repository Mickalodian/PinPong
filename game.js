const canvas = document.getElementById("game");
if (!canvas) throw new Error("Canvas #game not found");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const SCORE_LIMIT = 5;

const table = { x: 38, y: 26, w: W - 76, h: H - 52 };
const paddle = { w: 14, h: 110, inset: 18, aiSpeed: 560 };
const ballCfg = { r: 8, speed0: 430, speedMax: 1180 };

const SAVE_CACHE_KEY = "pong-bw-save";
const PLAYER_ID_KEY = "pong-player-id";
const PLAYER_NAME_KEY = "pong-player-name";
const ABILITIES_KEY = "pong-bw-abilities";
const SETTINGS_KEY = "pong-bw-settings";
const AUTH_TOKEN_KEY = "pong-auth-token";
const AUTH_USER_KEY = "pong-auth-user";
const POINTS_PER_WIN = 2;
const POINTS_PER_BOT_CLEAR = 5;
const POINTS_PER_CHAOS_CLEAR = 3;
const POINTS_PER_SURVIVAL_WIN = 5;
const POINTS_PER_BOSS_WIN = 8;
const POINTS_PER_CUP_PONG_WIN = 4;
const XP_PER_CLASSIC_WIN = 18;
const XP_PER_BOT_CLEAR = 45;
const XP_PER_CHAOS_WIN = 22;
const XP_PER_SURVIVAL_WIN = 28;
const XP_PER_BOSS_WIN = 55;
const XP_PER_CUP_PONG_WIN = 50;
const CHAOS_MAX_LEVEL = 25;
const SURVIVAL_MAX_ROUND = 25;
const BOSS_MAX_LEVEL = 10;
const CUP_PONG_MAX_LEVEL = 50;
const BOSS_HP = 5;
const SURVIVAL_MATCH_SECONDS = 120;
const PARRY_CHARGE_NEED = 10;
const FIRE_SMASH_SPEED = 1650;
const BOSS_REFLECT_SPEED = 1320;
const VALID_BOSS_POWERS = new Set(["block", "iron", "timeslow", "reflect"]);
const BOSS_SHOP = [
  {
    id: "block",
    name: "Block",
    price: 500,
    desc: "Negate the next goal scored against you. 15s cooldown after use.",
  },
  {
    id: "iron",
    name: "Iron Paddle",
    price: 350,
    desc: "Your paddle grows 30% larger for 30 seconds.",
  },
  {
    id: "timeslow",
    name: "Time Slow",
    price: 450,
    desc: "Slow the boss and its abilities by 40% for 5 seconds.",
  },
  {
    id: "reflect",
    name: "Reflect",
    price: 500,
    desc: "Next hit launches the ball. If it strikes the boss, freeze them 10s. 20s cooldown.",
  },
];

const AVATAR_DEFS = [
  { id: "default", label: "P", emoji: "P", unlock: { type: "free" } },
  { id: "smile", label: "Smile", emoji: "😄", unlock: { type: "xp", level: 2 } },
  { id: "fox", label: "Fox", emoji: "🦊", unlock: { type: "xp", level: 3 } },
  { id: "cool", label: "Cool", emoji: "😎", unlock: { type: "xp", level: 4 } },
  { id: "rocket", label: "Rocket", emoji: "🚀", unlock: { type: "xp", level: 5 } },
  { id: "pizza", label: "Pizza", emoji: "🍕", unlock: { type: "xp", level: 6 } },
  { id: "bolt", label: "Bolt", emoji: "⚡", unlock: { type: "xp", level: 7 } },
  { id: "dragon", label: "Dragon", emoji: "🐉", unlock: { type: "xp", level: 8 } },
  { id: "ghost", label: "Ghost", emoji: "👻", unlock: { type: "xp", level: 9 } },
  { id: "robot", label: "Bot", emoji: "🤖", unlock: { type: "xp", level: 10 } },
  { id: "alien", label: "Alien", emoji: "👽", unlock: { type: "xp", level: 12 } },
  { id: "panda", label: "Panda", emoji: "🐼", unlock: { type: "xp", level: 13 } },
  { id: "unicorn", label: "Unicorn", emoji: "🦄", unlock: { type: "xp", level: 14 } },
  { id: "ninja", label: "Ninja", emoji: "🥷", unlock: { type: "xp", level: 16 } },
  { id: "wizard", label: "Wizard", emoji: "🧙", unlock: { type: "xp", level: 17 } },
  { id: "octopus", label: "Octopus", emoji: "🐙", unlock: { type: "xp", level: 18 } },
  { id: "eagle", label: "Eagle", emoji: "🦅", unlock: { type: "xp", level: 19 } },
  { id: "sports_car", label: "Sports Car", emoji: "🏎️", image: "/avatar-pack/sports-car.jpg", unlock: { type: "xp", level: 20 } },
  { id: "gem", label: "Gem", emoji: "💎", unlock: { type: "xp", level: 22 } },
  { id: "cactus", label: "Cactus", emoji: "🌵", unlock: { type: "xp", level: 23 } },
  { id: "galaxy", label: "Galaxy", emoji: "🌌", unlock: { type: "xp", level: 25 } },
  { id: "classic_car", label: "Classic Car", emoji: "🚗", image: "/avatar-pack/classic-car.jpg", unlock: { type: "xp", level: 26 } },
  { id: "koala", label: "Koala", emoji: "🐨", unlock: { type: "xp", level: 27 } },
  { id: "trophy", label: "Trophy", emoji: "🏆", unlock: { type: "xp", level: 28 } },
  { id: "owl", label: "Owl", emoji: "🦉", unlock: { type: "xp", level: 29 } },
  { id: "motorcycle", label: "Motorcycle", emoji: "🏍️", image: "/avatar-pack/motorcycle.jpg", unlock: { type: "xp", level: 32 } },
  { id: "medal", label: "Gold Medal", emoji: "🥇", unlock: { type: "xp", level: 33 } },
  { id: "star", label: "Star", emoji: "🌟", unlock: { type: "xp", level: 36 } },
  { id: "eiffel", label: "Eiffel", emoji: "🗼", image: "/avatar-pack/eiffel.jpg", unlock: { type: "xp", level: 38 } },
  { id: "wolf", label: "Wolf", emoji: "🐺", unlock: { type: "xp", level: 39 } },
  { id: "comet", label: "Comet", emoji: "☄️", unlock: { type: "xp", level: 40 } },
  { id: "tokyo", label: "Tokyo", emoji: "🌃", image: "/avatar-pack/tokyo.jpg", unlock: { type: "xp", level: 44 } },
  { id: "moon", label: "Moon", emoji: "🌙", unlock: { type: "xp", level: 45 } },
  { id: "sun", label: "Sun", emoji: "☀️", unlock: { type: "xp", level: 48 } },
  { id: "beach", label: "Beach", emoji: "🏖️", image: "/avatar-pack/beach.jpg", unlock: { type: "xp", level: 50 } },
  { id: "rainbow", label: "Rainbow", emoji: "🌈", unlock: { type: "xp", level: 55 } },
  { id: "mountains", label: "Mountains", emoji: "🏔️", image: "/avatar-pack/mountains.jpg", unlock: { type: "xp", level: 56 } },
  { id: "volcano", label: "Volcano", emoji: "🌋", unlock: { type: "xp", level: 60 } },
  { id: "nyc", label: "New York", emoji: "🗽", image: "/avatar-pack/nyc.jpg", unlock: { type: "xp", level: 62 } },
  { id: "ocean", label: "Ocean", emoji: "🌊", unlock: { type: "xp", level: 65 } },
  { id: "train", label: "Steam Train", emoji: "🚂", image: "/avatar-pack/train.jpg", unlock: { type: "xp", level: 68 } },
  { id: "forest", label: "Forest", emoji: "🌲", unlock: { type: "xp", level: 70 } },
  { id: "balloon", label: "Hot Air Balloon", emoji: "🎈", image: "/avatar-pack/balloon.jpg", unlock: { type: "xp", level: 74 } },
  { id: "castle", label: "Castle", emoji: "🏰", unlock: { type: "xp", level: 75 } },
  { id: "yacht", label: "Yacht", emoji: "🛥️", image: "/avatar-pack/yacht.jpg", unlock: { type: "xp", level: 80 } },
  { id: "sparkle", label: "Sparkle", emoji: "✨", unlock: { type: "xp", level: 82 } },
  { id: "desert", label: "Desert", emoji: "🏜️", image: "/avatar-pack/desert.jpg", unlock: { type: "xp", level: 86 } },
  { id: "aurora", label: "Aurora", emoji: "🌌", image: "/avatar-pack/aurora.jpg", unlock: { type: "xp", level: 92 } },
  { id: "planet", label: "Planet", emoji: "🪐", unlock: { type: "xp", level: 95 } },
  { id: "island", label: "Island", emoji: "🏝️", image: "/avatar-pack/island.jpg", unlock: { type: "xp", level: 100 } },

  { id: "flame", label: "Flame", emoji: "🔥", unlock: { type: "chaos", level: 10 } },
  { id: "crown", label: "Crown", emoji: "👑", unlock: { type: "classic", level: 50 } },
  { id: "rift", label: "Rift", emoji: "🌀", unlock: { type: "chaos", level: 25 } },
  { id: "endurance", label: "Endurance", emoji: "♾️", unlock: { type: "survival", level: 25 } },
  { id: "overlord", label: "Overlord", emoji: "👁️", unlock: { type: "boss", level: 10 } },
  { id: "custom", label: "Upload", emoji: "+", unlock: { type: "upload" } },
];

const SHOP = {
  paddle: [
    { id: "white", name: "Classic", price: 0, style: "solid", color: "#ffffff" },
    { id: "blue", name: "Blue", price: 4, style: "solid", color: "#3b82f6" },
    { id: "pink", name: "Pink", price: 4, style: "solid", color: "#ec4899" },
    { id: "orange", name: "Orange", price: 4, style: "solid", color: "#f97316" },
    { id: "red", name: "Red", price: 4, style: "solid", color: "#ef4444" },
    { id: "green", name: "Green", price: 4, style: "solid", color: "#22c55e" },
    { id: "yellow", name: "Yellow", price: 4, style: "solid", color: "#eab308" },
    { id: "purple", name: "Purple", price: 4, style: "solid", color: "#a855f7" },
    { id: "cyan", name: "Cyan", price: 4, style: "solid", color: "#06b6d4" },
    { id: "galaxy", name: "Galaxy", price: 20, style: "galaxy" },
    { id: "moon", name: "Moon", price: 22, style: "moon" },
    { id: "sunset", name: "Sunset", price: 24, style: "sunset" },
    { id: "neon", name: "Neon", price: 26, style: "neon" },
    { id: "lava", name: "Lava", price: 24, style: "lava" },
    { id: "ice", name: "Ice", price: 22, style: "ice" },
    { id: "rainbow", name: "Rainbow", price: 28, style: "rainbow" },
    { id: "aurora", name: "Aurora", price: 26, style: "aurora" },
    { id: "nebula", name: "Nebula Flow", price: 50, style: "nebula", epic: true },
    { id: "interstellar", name: "Interstellar", price: 55, style: "interstellar", epic: true },
    { id: "voidpulse", name: "Void Pulse", price: 58, style: "voidpulse", epic: true },
    { id: "solarflare", name: "Solar Flare", price: 60, style: "solarflare", epic: true },
    { id: "plasma", name: "Plasma Core", price: 62, style: "plasma", epic: true },
    { id: "quantum", name: "Quantum Drift", price: 65, style: "quantum", epic: true },
    { id: "darkmatter", name: "Dark Matter", price: 70, style: "darkmatter", epic: true },
    { id: "hypernova", name: "Hypernova", price: 75, style: "hypernova", epic: true },
    {
      id: "rosegold",
      name: "Rose Gold",
      price: 0,
      style: "rosegold",
      legendary: true,
      requireLevel: 20,
    },
    {
      id: "voidstorm",
      name: "Void Storm",
      price: 0,
      style: "voidstorm",
      legendary: true,
      requireLevel: 40,
    },
    {
      id: "hearthflame",
      name: "Hearthflame",
      price: 0,
      style: "hearthflame",
      legendary: true,
      requireLevel: 60,
    },
    {
      id: "skywyrm",
      name: "Skywyrm",
      price: 0,
      style: "skywyrm",
      legendary: true,
      requireLevel: 80,
    },
    {
      id: "obsidian",
      name: "Obsidian",
      price: 0,
      style: "obsidian",
      legendary: true,
      requireLevel: 100,
    },
    {
      id: "chaosrift",
      name: "Chaos Rift",
      price: 0,
      style: "chaosrift",
      chaos: true,
      requireChaosLevel: 25,
    },
    {
      id: "endurance",
      name: "Endurance",
      price: 0,
      style: "endurance",
      survival: true,
      requireSurvivalLevel: 25,
    },
    {
      id: "overlord",
      name: "Overlord",
      price: 0,
      style: "overlord",
      boss: true,
      requireBossLevel: 10,
    },
    {
      id: "beerpong",
      name: "Beer Pong",
      price: 0,
      style: "beerpong",
      cuppong: true,
      requireCupPongLevel: 50,
    },
    {
      id: "heartbloom",
      name: "Heart Bloom",
      price: 0,
      style: "heartbloom",
      secret: true,
      hidden: true,
      codeOnly: true,
      limitedEdition: true,
    },
    {
      id: "blushgarden",
      name: "Blush Garden",
      price: 0,
      style: "blushgarden",
      secret: true,
      hidden: true,
      codeOnly: true,
      limitedEdition: true,
    },
  ],
  table: [
    { id: "classic", name: "Classic", price: 0, style: "solid", color: "#000000" },
    { id: "blue", name: "Blue", price: 4, style: "solid", color: "#1e3a8a" },
    { id: "pink", name: "Pink", price: 4, style: "solid", color: "#9d174d" },
    { id: "orange", name: "Orange", price: 4, style: "solid", color: "#9a3412" },
    { id: "red", name: "Red", price: 4, style: "solid", color: "#991b1b" },
    { id: "green", name: "Green", price: 4, style: "solid", color: "#14532d" },
    { id: "yellow", name: "Yellow", price: 4, style: "solid", color: "#854d0e" },
    { id: "purple", name: "Purple", price: 4, style: "solid", color: "#581c87" },
    { id: "cyan", name: "Cyan", price: 4, style: "solid", color: "#155e75" },
    { id: "galaxy", name: "Galaxy", price: 20, style: "galaxy" },
    { id: "moon", name: "Moon", price: 22, style: "moon" },
    { id: "sunset", name: "Sunset", price: 24, style: "sunset" },
    { id: "neon", name: "Neon", price: 26, style: "neon" },
    { id: "lava", name: "Lava", price: 24, style: "lava" },
    { id: "ice", name: "Ice", price: 22, style: "ice" },
    { id: "rainbow", name: "Rainbow", price: 28, style: "rainbow" },
    { id: "aurora", name: "Aurora", price: 26, style: "aurora" },
    { id: "nebula", name: "Nebula Flow", price: 50, style: "nebula", epic: true },
    { id: "interstellar", name: "Interstellar", price: 55, style: "interstellar", epic: true },
    { id: "voidpulse", name: "Void Pulse", price: 58, style: "voidpulse", epic: true },
    { id: "solarflare", name: "Solar Flare", price: 60, style: "solarflare", epic: true },
    { id: "plasma", name: "Plasma Core", price: 62, style: "plasma", epic: true },
    { id: "quantum", name: "Quantum Drift", price: 65, style: "quantum", epic: true },
    { id: "darkmatter", name: "Dark Matter", price: 70, style: "darkmatter", epic: true },
    { id: "hypernova", name: "Hypernova", price: 75, style: "hypernova", epic: true },
    {
      id: "rosegold",
      name: "Rose Gold",
      price: 0,
      style: "rosegold",
      legendary: true,
      requireLevel: 20,
    },
    {
      id: "voidstorm",
      name: "Void Storm",
      price: 0,
      style: "voidstorm",
      legendary: true,
      requireLevel: 40,
    },
    {
      id: "hearthflame",
      name: "Hearthflame",
      price: 0,
      style: "hearthflame",
      legendary: true,
      requireLevel: 60,
    },
    {
      id: "skywyrm",
      name: "Skywyrm",
      price: 0,
      style: "skywyrm",
      legendary: true,
      requireLevel: 80,
    },
    {
      id: "obsidian",
      name: "Obsidian",
      price: 0,
      style: "obsidian",
      legendary: true,
      requireLevel: 100,
    },
    {
      id: "chaosrift",
      name: "Chaos Rift",
      price: 0,
      style: "chaosrift",
      chaos: true,
      requireChaosLevel: 25,
    },
    {
      id: "endurance",
      name: "Endurance",
      price: 0,
      style: "endurance",
      survival: true,
      requireSurvivalLevel: 25,
    },
    {
      id: "overlord",
      name: "Overlord",
      price: 0,
      style: "overlord",
      boss: true,
      requireBossLevel: 10,
    },
    {
      id: "beerpong",
      name: "Beer Pong",
      price: 0,
      style: "beerpong",
      cuppong: true,
      requireCupPongLevel: 50,
    },
    {
      id: "heartbloom",
      name: "Heart Bloom",
      price: 0,
      style: "heartbloom",
      secret: true,
      hidden: true,
      codeOnly: true,
      limitedEdition: true,
    },
    {
      id: "blushgarden",
      name: "Blush Garden",
      price: 0,
      style: "blushgarden",
      secret: true,
      hidden: true,
      codeOnly: true,
      limitedEdition: true,
    },
  ],
};

// expiresAt: ISO date string. After this time new redemptions fail,
// but anyone who already redeemed keeps the rewards forever.
const REDEEM_CODES = {
  "6767": {
    id: "6767",
    label: "Heart Bloom",
    expiresAt: "2026-08-09T23:59:59.000Z",
    rewards: [
      { type: "cosmetic", kind: "paddle", id: "heartbloom" },
      { type: "cosmetic", kind: "table", id: "heartbloom" },
    ],
  },
  "6967": {
    id: "6967",
    label: "Blush Garden",
    expiresAt: "2026-08-09T23:59:59.000Z",
    rewards: [
      { type: "cosmetic", kind: "paddle", id: "blushgarden" },
      { type: "cosmetic", kind: "table", id: "blushgarden" },
    ],
  },
};

const save = {
  name: "",
  points: 0,
  xp: 0,
  maxBotCleared: 0,
  maxChaosCleared: 0,
  maxSurvivalCleared: 0,
  maxBossCleared: 0,
  maxCupPongCleared: 0,
  owned: { paddle: ["white"], table: ["classic"] },
  equipped: { paddle: "white", table: "classic" },
  redeemedCodes: [],
  shopTab: "paddle",
  shopCatalog: "pong",
  bossPowers: [],
  avatar: "default",
  ownedAvatars: ["default"],
  customAvatarUrl: "",
  title: "",
  adminSyncedAt: 0,
  abilities: { megaPaddle: false, freeShop: false, slowBot: false, pauseBot: false, bonusPts: false },
};

let authState = { token: "", username: "", isOwner: false, isAdmin: false };

function isAdmin() {
  return !!(authState.token && (authState.isAdmin || authState.isOwner));
}

function isOwner() {
  return !!(authState.token && authState.isOwner);
}

function sanitizeName(name) {
  const clean = String(name || "")
    .trim()
    .replace(/[^\w\s\-'.]/g, "")
    .slice(0, 16);
  return clean;
}

function getPlayerName() {
  return sanitizeName(save.name || localStorage.getItem(PLAYER_NAME_KEY) || "");
}

function hasValidName() {
  return getPlayerName().length >= 1;
}

function setPlayerName(name) {
  const clean = sanitizeName(name);
  if (!clean) return false;
  save.name = clean;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, clean);
  } catch {
    /* ignore */
  }
  persistSave({ force: true });
  updateNameUI();
  return true;
}

function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function uniqIds(list, fallback) {
  const out = [];
  for (const id of Array.isArray(list) ? list : []) {
    const s = String(id || "");
    if (s && !out.includes(s)) out.push(s);
  }
  if (fallback && !out.includes(fallback)) out.unshift(fallback);
  return out;
}

function mergeOwned(localList, remoteList, fallback) {
  return uniqIds([...(Array.isArray(localList) ? localList : []), ...(Array.isArray(remoteList) ? remoteList : [])], fallback);
}

function applyProfile(data, { replace = false } = {}) {
  if (!data || typeof data !== "object") return;
  if (typeof data.name === "string") {
    const incoming = sanitizeName(data.name);
    const local = sanitizeName(save.name || "");
    if (replace) {
      if (incoming) {
        save.name = incoming;
        try {
          localStorage.setItem(PLAYER_NAME_KEY, incoming);
        } catch {
          /* ignore */
        }
      }
    } else if (local && incoming && local !== incoming) {
      // Keep the local preferred name; syncProfileFromServer will push it.
      save.name = local;
    } else if (incoming) {
      save.name = incoming;
      try {
        localStorage.setItem(PLAYER_NAME_KEY, incoming);
      } catch {
        /* ignore */
      }
    } else if (local) {
      save.name = local;
    }
  }

  const incomingAdminSynced =
    typeof data.adminSyncedAt === "number" && Number.isFinite(data.adminSyncedAt)
      ? Math.floor(data.adminSyncedAt)
      : 0;
  const forceEconomy = replace || incomingAdminSynced > (save.adminSyncedAt || 0);

  if (typeof data.points === "number" && Number.isFinite(data.points)) {
    const incoming = Math.max(0, Math.floor(data.points));
    save.points = forceEconomy ? incoming : Math.max(save.points || 0, incoming);
  }

  if (typeof data.xp === "number" && Number.isFinite(data.xp)) {
    const incoming = Math.max(0, Math.floor(data.xp));
    save.xp = forceEconomy ? incoming : Math.max(save.xp || 0, incoming);
  }

  if (incomingAdminSynced) {
    save.adminSyncedAt = Math.max(save.adminSyncedAt || 0, incomingAdminSynced);
  }

  if (typeof data.maxBotCleared === "number" && Number.isFinite(data.maxBotCleared)) {
    const incoming = Math.max(0, Math.min(100, Math.floor(data.maxBotCleared)));
    save.maxBotCleared = replace ? incoming : Math.max(save.maxBotCleared || 0, incoming);
  }

  if (typeof data.maxChaosCleared === "number" && Number.isFinite(data.maxChaosCleared)) {
    const incoming = Math.max(0, Math.min(CHAOS_MAX_LEVEL, Math.floor(data.maxChaosCleared)));
    save.maxChaosCleared = replace ? incoming : Math.max(save.maxChaosCleared || 0, incoming);
  }

  if (typeof data.maxSurvivalCleared === "number" && Number.isFinite(data.maxSurvivalCleared)) {
    const incoming = Math.max(0, Math.min(SURVIVAL_MAX_ROUND, Math.floor(data.maxSurvivalCleared)));
    save.maxSurvivalCleared = replace ? incoming : Math.max(save.maxSurvivalCleared || 0, incoming);
  }

  if (typeof data.maxBossCleared === "number" && Number.isFinite(data.maxBossCleared)) {
    const incoming = Math.max(0, Math.min(BOSS_MAX_LEVEL, Math.floor(data.maxBossCleared)));
    save.maxBossCleared = replace ? incoming : Math.max(save.maxBossCleared || 0, incoming);
  }

  if (typeof data.maxCupPongCleared === "number" && Number.isFinite(data.maxCupPongCleared)) {
    const incoming = Math.max(0, Math.min(CUP_PONG_MAX_LEVEL, Math.floor(data.maxCupPongCleared)));
    save.maxCupPongCleared = replace ? incoming : Math.max(save.maxCupPongCleared || 0, incoming);
  }

  if (data.owned?.paddle || data.owned?.table) {
    save.owned.paddle = replace
      ? uniqIds(data.owned?.paddle, "white")
      : mergeOwned(save.owned.paddle, data.owned?.paddle, "white");
    save.owned.table = replace
      ? uniqIds(data.owned?.table, "classic")
      : mergeOwned(save.owned.table, data.owned?.table, "classic");
  }

  if (data.equipped?.paddle) save.equipped.paddle = String(data.equipped.paddle);
  if (data.equipped?.table) save.equipped.table = String(data.equipped.table);
  if (Array.isArray(data.redeemedCodes)) {
    const merged = new Set([...(save.redeemedCodes || []), ...data.redeemedCodes.map(String)]);
    save.redeemedCodes = [...merged];
  }
  if (Array.isArray(data.bossPowers)) {
    const merged = new Set([...(save.bossPowers || []), ...data.bossPowers.map(String).filter((id) => VALID_BOSS_POWERS.has(id))]);
    if (replace) {
      save.bossPowers = [...new Set(data.bossPowers.map(String).filter((id) => VALID_BOSS_POWERS.has(id)))];
    } else {
      save.bossPowers = [...merged];
    }
  }
  if (typeof data.avatar === "string" && data.avatar) save.avatar = String(data.avatar).slice(0, 64);
  if (typeof data.customAvatarUrl === "string") save.customAvatarUrl = String(data.customAvatarUrl).slice(0, 200);
  if (typeof data.title === "string") save.title = String(data.title).slice(0, 32);
  if (Array.isArray(data.ownedAvatars)) {
    const merged = new Set([...(save.ownedAvatars || ["default"]), ...data.ownedAvatars.map(String), "default"]);
    save.ownedAvatars = replace
      ? [...new Set([...data.ownedAvatars.map(String), "default"])]
      : [...merged];
  }
  if (!save.owned.paddle.includes("white")) save.owned.paddle.unshift("white");
  if (!save.owned.table.includes("classic")) save.owned.table.unshift("classic");
  if (!Array.isArray(save.ownedAvatars) || !save.ownedAvatars.length) save.ownedAvatars = ["default"];
  sanitizeEquippedCosmetics();
  refreshAvatarUnlocks();
}

const XP_MAX_LEVEL = 1000;

function xpNeedForLevel(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  // Levels 1–100 keep the original curve so existing progress stays stable.
  if (lv <= 100) return Math.floor(100 * Math.pow(1.14, lv - 1));
  const at100 = Math.floor(100 * Math.pow(1.14, 99));
  return Math.floor(at100 * Math.pow(1.015, lv - 100));
}

function getPlayerLevel() {
  // Display / unlock level is XP-based (not classic bot clear progress).
  return getXpLevel();
}

function getXpProgress(xpTotal = save.xp || 0) {
  let xp = Math.max(0, Math.floor(xpTotal));
  let level = 1;
  let need = xpNeedForLevel(1);
  while (xp >= need && level < XP_MAX_LEVEL) {
    xp -= need;
    level += 1;
    need = xpNeedForLevel(level);
  }
  return { level, into: xp, need, total: Math.max(0, Math.floor(xpTotal)) };
}

function getXpLevel() {
  return getXpProgress().level;
}

/** Minimum total XP required to reach a given level (1–1000). */
function xpTotalForLevel(level) {
  const target = Math.max(1, Math.min(XP_MAX_LEVEL, Math.floor(level || 1)));
  let total = 0;
  for (let l = 1; l < target; l++) {
    total += xpNeedForLevel(l);
  }
  return total;
}

function getXpLevelUnlocks(fromLevel, toLevel) {
  const from = Math.max(0, Math.floor(fromLevel || 0));
  const to = Math.max(from, Math.floor(toLevel || 0));
  const unlocks = [];
  for (const def of AVATAR_DEFS) {
    const u = def.unlock || {};
    if (u.type !== "xp") continue;
    const need = Math.max(1, Math.floor(u.level || 1));
    if (need > from && need <= to) {
      unlocks.push({
        kind: "Profile avatar",
        id: def.id,
        label: def.label,
        emoji: def.emoji || "P",
        color: "",
      });
    }
  }
  return unlocks;
}

function playLevelUpSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  try {
    const noiseLen = Math.floor(audioCtx.sampleRate * 0.28);
    const buffer = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(900, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(2400, t + 0.22);
    noiseFilter.Q.value = 0.7;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(t);
    noise.stop(t + 0.3);
  } catch {
    /* ignore */
  }
  playTone(70, t, 0.28, "sine", 0.38);
  playTone(110, t + 0.02, 0.22, "triangle", 0.18);
  const climb = [392, 523.25, 659.25, 783.99, 1046.5];
  climb.forEach((freq, i) => {
    const at = t + 0.1 + i * 0.085;
    playTone(freq, at, 0.16, "square", 0.11);
    playTone(freq * 2, at + 0.01, 0.12, "sine", 0.05);
  });
  playTone(523.25, t + 0.58, 0.55, "sawtooth", 0.07);
  playTone(659.25, t + 0.58, 0.55, "triangle", 0.1);
  playTone(783.99, t + 0.58, 0.6, "sine", 0.12);
  playTone(1046.5, t + 0.62, 0.35, "square", 0.06);
}

function paintLevelUpUnlocks(unlocks) {
  const list = ui.levelUpUnlocks;
  const wrap = ui.levelUpUnlocksWrap;
  const empty = ui.levelUpEmpty;
  if (!list || !wrap) return;
  list.innerHTML = "";
  const items = Array.isArray(unlocks) ? unlocks : [];
  if (!items.length) {
    wrap.classList.add("hidden");
    if (empty) empty.classList.remove("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  if (empty) empty.classList.add("hidden");
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "level-up-unlock-item";
    li.style.animationDelay = `${0.12 + i * 0.08}s`;
    const icon = document.createElement("div");
    icon.className = "level-up-unlock-icon profile-avatar";
    const def = AVATAR_DEFS.find((a) => a.id === item.id);
    applyAvatarToElement(icon, def, { emoji: item.emoji || def?.emoji || "?" });
    const text = document.createElement("div");
    text.className = "level-up-unlock-text";
    const label = document.createElement("div");
    label.className = "level-up-unlock-label";
    label.textContent = item.label || "Unlock";
    const kind = document.createElement("div");
    kind.className = "level-up-unlock-kind";
    kind.textContent = item.kind || "Reward";
    text.append(label, kind);
    li.append(icon, text);
    list.appendChild(li);
  });
}

let levelUpTimer = 0;

function openLevelUpOverlay(fromLevel, toLevel) {
  if (!ui.levelUpOverlay) return;
  const from = Math.max(1, Math.floor(fromLevel || 1));
  const to = Math.max(from + 1, Math.floor(toLevel || from + 1));
  if (ui.levelUpRank) ui.levelUpRank.textContent = String(to);
  if (ui.levelUpSub) {
    ui.levelUpSub.textContent =
      to - from > 1 ? `XP Level ${from} → ${to}` : `XP Level ${to}`;
  }
  paintLevelUpUnlocks(getXpLevelUnlocks(from, to));
  showOverlay(ui.levelUpOverlay);
  playLevelUpSound();
}

function closeLevelUpOverlay() {
  if (levelUpTimer) {
    clearTimeout(levelUpTimer);
    levelUpTimer = 0;
  }
  hideOverlay(ui.levelUpOverlay);
}

function scheduleLevelUpCelebration(fromLevel, toLevel) {
  if (!Number.isFinite(toLevel) || toLevel <= fromLevel) return;
  if (levelUpTimer) clearTimeout(levelUpTimer);
  levelUpTimer = setTimeout(() => {
    levelUpTimer = 0;
    openLevelUpOverlay(fromLevel, toLevel);
  }, 650);
}

function awardXp(amount) {
  const gain = Math.max(0, Math.floor(amount || 0));
  if (!gain) return 0;
  const before = getXpLevel();
  save.xp = Math.max(0, (save.xp || 0) + gain);
  refreshAvatarUnlocks();
  persistSave();
  const after = getXpLevel();
  if (after > before && ui.status && s.mode !== "menu") {
    ui.status.textContent = `XP LEVEL ${after}!`;
  }
  return gain;
}

function avatarUnlocked(def) {
  if (!def) return false;
  if (def.id === "custom") return !!(save.customAvatarUrl || (save.ownedAvatars || []).includes("custom"));
  if ((save.ownedAvatars || []).includes(def.id)) return true;
  const u = def.unlock || { type: "free" };
  if (u.type === "free") return true;
  if (u.type === "xp") return getXpLevel() >= (u.level || 1);
  if (u.type === "classic") return (save.maxBotCleared || 0) >= (u.level || 1);
  if (u.type === "chaos") return (save.maxChaosCleared || 0) >= (u.level || 1);
  if (u.type === "survival") return (save.maxSurvivalCleared || 0) >= (u.level || 1);
  if (u.type === "boss") return (save.maxBossCleared || 0) >= (u.level || 1);
  if (u.type === "upload") return !!(authState.token || save.customAvatarUrl);
  return false;
}

function refreshAvatarUnlocks() {
  if (!Array.isArray(save.ownedAvatars)) save.ownedAvatars = ["default"];
  let changed = false;
  for (const def of AVATAR_DEFS) {
    if (def.id === "custom") continue;
    if (avatarUnlocked(def) && !save.ownedAvatars.includes(def.id)) {
      save.ownedAvatars.push(def.id);
      changed = true;
    }
  }
  if (save.avatar && !avatarUnlocked(AVATAR_DEFS.find((a) => a.id === save.avatar) || { id: save.avatar, unlock: { type: "free" } })) {
    if (save.avatar !== "custom" || !save.customAvatarUrl) {
      save.avatar = "default";
      changed = true;
    }
  }
  return changed;
}

function itemUnlocked(item) {
  if (!item) return true;
  if (isAdmin() && save.abilities.freeShop) return true;
  if (item.requireChaosLevel) {
    return (save.maxChaosCleared || 0) >= item.requireChaosLevel;
  }
  if (item.requireSurvivalLevel) {
    return (save.maxSurvivalCleared || 0) >= item.requireSurvivalLevel;
  }
  if (item.requireBossLevel) {
    return (save.maxBossCleared || 0) >= item.requireBossLevel;
  }
  if (item.requireCupPongLevel) {
    return (save.maxCupPongCleared || 0) >= item.requireCupPongLevel;
  }
  if (!item.requireLevel) return true;
  return getPlayerLevel() >= item.requireLevel;
}

function sanitizeEquippedCosmetics() {
  let changed = false;
  for (const kind of ["paddle", "table"]) {
    for (const item of SHOP[kind]) {
      const gated = !!(
        item.requireLevel ||
        item.requireChaosLevel ||
        item.requireSurvivalLevel ||
        item.requireBossLevel ||
        item.requireCupPongLevel
      );
      if (gated && itemUnlocked(item) && !save.owned[kind].includes(item.id)) {
        save.owned[kind].push(item.id);
        changed = true;
      }
    }
    const item = shopItem(kind, save.equipped[kind]);
    if (!itemUnlocked(item)) {
      save.equipped[kind] = kind === "paddle" ? "white" : "classic";
      changed = true;
    }
  }
  return changed;
}

function isBotLevelUnlocked(level) {
  return level === 1 || level <= (save.maxBotCleared || 0) + 1;
}

function isChaosLevelUnlocked(level) {
  return level === 1 || level <= (save.maxChaosCleared || 0) + 1;
}

function isSurvivalRoundUnlocked(round) {
  return round === 1 || round <= (save.maxSurvivalCleared || 0) + 1;
}

function isBossLevelUnlocked(level) {
  return level === 1 || level <= (save.maxBossCleared || 0) + 1;
}

function chaosWinPoints(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, CHAOS_MAX_LEVEL);
  return Math.round(2 + ((lv - 1) * 48) / (CHAOS_MAX_LEVEL - 1));
}

function grantChaosRiftIfEligible() {
  let granted = false;
  if ((save.maxChaosCleared || 0) < 25) return false;
  for (const kind of ["paddle", "table"]) {
    if (!save.owned[kind].includes("chaosrift")) {
      save.owned[kind].push("chaosrift");
      granted = true;
    }
  }
  return granted;
}

function grantEnduranceIfEligible() {
  let granted = false;
  if ((save.maxSurvivalCleared || 0) < SURVIVAL_MAX_ROUND) return false;
  for (const kind of ["paddle", "table"]) {
    if (!save.owned[kind].includes("endurance")) {
      save.owned[kind].push("endurance");
      granted = true;
    }
  }
  return granted;
}

function grantOverlordIfEligible() {
  let granted = false;
  if ((save.maxBossCleared || 0) < BOSS_MAX_LEVEL) return false;
  for (const kind of ["paddle", "table"]) {
    if (!save.owned[kind].includes("overlord")) {
      save.owned[kind].push("overlord");
      granted = true;
    }
  }
  return granted;
}

function playerLevelStyle(level) {
  const lv = Math.max(0, Math.min(XP_MAX_LEVEL, Math.floor(level || 0)));
  if (lv <= 0) return { color: "#9ca3af", animated: false, className: "lvl-0" };
  if (lv < 5) return { color: "#d1d5db", animated: false, className: "lvl-1" };
  if (lv < 10) return { color: "#86efac", animated: false, className: "lvl-5" };
  if (lv < 15) return { color: "#67e8f9", animated: false, className: "lvl-10" };
  if (lv < 20) return { color: "#c084fc", animated: false, className: "lvl-15" };
  if (lv < 40) return { color: null, animated: true, className: "lvl-20" };
  if (lv < 60) return { color: null, animated: true, className: "lvl-40" };
  if (lv < 80) return { color: null, animated: true, className: "lvl-60" };
  if (lv < 100) return { color: null, animated: true, className: "lvl-80" };
  if (lv < 125) return { color: null, animated: true, className: "lvl-100" };
  if (lv >= XP_MAX_LEVEL) return { color: null, animated: true, className: "lvl-1000" };
  const band = Math.floor(lv / 25) * 25;
  return { color: null, animated: true, className: `lvl-${band}` };
}

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length < 6) return [255, 255, 255];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mixHex(a, b, t) {
  const u = Math.max(0, Math.min(1, t));
  const s = u * u * (3 - 2 * u); // smoothstep
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * s);
  const g = Math.round(A[1] + (B[1] - A[1]) * s);
  const bl = Math.round(A[2] + (B[2] - A[2]) * s);
  return `rgb(${r},${g},${bl})`;
}

/** Continuously blend through a palette (no hard color snaps). */
function cyclePalette(colors, t, speed = 0.35) {
  const list = Array.isArray(colors) && colors.length ? colors : ["#ffffff"];
  if (list.length === 1) return list[0];
  const n = list.length;
  const phase = ((t * speed) % n + n) % n;
  const i = Math.floor(phase);
  const f = phase - i;
  return mixHex(list[i], list[(i + 1) % n], f);
}

function canvasLevelColor(level) {
  if (level == null) return "#ffffff";
  const lv = Math.max(0, Math.min(XP_MAX_LEVEL, Math.floor(level || 0)));
  const t = cosmeticTime();
  if (lv <= 0) return "#9ca3af";
  if (lv < 5) return "#d1d5db";
  if (lv < 10) return "#86efac";
  if (lv < 15) return "#67e8f9";
  if (lv < 20) return "#c084fc";
  if (lv < 40) return cyclePalette(["#f472b6", "#a78bfa", "#f472b6"], t, 0.45);
  if (lv < 60) return cyclePalette(["#22d3ee", "#fbbf24", "#22d3ee"], t, 0.5);
  if (lv < 80) return cyclePalette(["#fb7185", "#34d399", "#818cf8", "#fb7185"], t, 0.55);
  if (lv < 100) {
    return cyclePalette(["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ef4444"], t, 0.4);
  }
  const palettes = [
    ["#ff4d6d", "#ff9f1c", "#ffd166", "#06d6a0", "#4cc9f0", "#7b2cbf", "#ff4d6d"],
    ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#38bdf8"],
    ["#f97316", "#ef4444", "#fbbf24", "#fb7185", "#f97316"],
    ["#22d3ee", "#2dd4bf", "#34d399", "#a3e635", "#22d3ee"],
    ["#e879f9", "#a78bfa", "#60a5fa", "#22d3ee", "#e879f9"],
    ["#facc15", "#f59e0b", "#fb923c", "#f87171", "#facc15"],
    ["#94a3b8", "#e2e8f0", "#38bdf8", "#a855f7", "#94a3b8"],
    ["#f43f5e", "#ec4899", "#d946ef", "#8b5cf6", "#f43f5e"],
    ["#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#14b8a6"],
    ["#fff7ed", "#fdba74", "#fb923c", "#ea580c", "#fff7ed"],
  ];
  const bandIdx = Math.max(0, Math.floor((lv - 100) / 25) % palettes.length);
  const speed = 0.28 + (bandIdx % 5) * 0.04;
  return cyclePalette(palettes[bandIdx], t, speed);
}

function formatNameWithLevel(name, level) {
  const n = String(name || "Player");
  const lv = Math.max(0, Math.min(XP_MAX_LEVEL, Math.floor(level || 0)));
  return `${n} · L${lv}`;
}

const LEVEL_STYLE_CLASSES = (() => {
  const list = [
    "lvl-0", "lvl-1", "lvl-5", "lvl-10", "lvl-15",
    "lvl-20", "lvl-40", "lvl-60", "lvl-80", "lvl-100",
  ];
  for (let n = 125; n <= XP_MAX_LEVEL; n += 25) list.push(`lvl-${n}`);
  list.push("player-level");
  return list;
})();

function applyLevelClass(el, level) {
  if (!el) return;
  el.classList.remove(...LEVEL_STYLE_CLASSES);
  el.style.color = "";
  if (level == null) return;
  const style = playerLevelStyle(level);
  el.classList.add("player-level", style.className);
  if (style.color) el.style.color = style.color;
}

function awardBotClear(level) {
  if (
    s.mode !== "local" ||
    s.botMode === "chaos" ||
    s.botMode === "survival" ||
    s.botMode === "boss" ||
    s.botMode === "cuppong"
  )
    return 0;
  const lv = Math.max(1, Math.min(100, level || s.botLevel));
  if (lv <= save.maxBotCleared) return 0;
  save.maxBotCleared = lv;
  save.points += POINTS_PER_BOT_CLEAR;
  awardXp(XP_PER_BOT_CLEAR);
  sanitizeEquippedCosmetics();
  persistSave();
  updatePointsUI();
  updateNameUI();
  return POINTS_PER_BOT_CLEAR;
}

function awardChaosClear(level) {
  if (s.mode !== "local" || s.botMode !== "chaos") return 0;
  const lv = Math.max(1, Math.min(CHAOS_MAX_LEVEL, level || s.botLevel));
  if (lv <= (save.maxChaosCleared || 0)) return 0;
  save.maxChaosCleared = lv;
  save.points += POINTS_PER_CHAOS_CLEAR;
  awardXp(Math.round(XP_PER_CHAOS_WIN * 0.5) + lv);
  grantChaosRiftIfEligible();
  sanitizeEquippedCosmetics();
  persistSave();
  updatePointsUI();
  updateNameUI();
  return POINTS_PER_CHAOS_CLEAR;
}

function awardSurvivalClear(round) {
  if (s.mode !== "local" || s.botMode !== "survival") return 0;
  const lv = Math.max(1, Math.min(SURVIVAL_MAX_ROUND, round || s.botLevel));
  if (lv <= (save.maxSurvivalCleared || 0)) return 0;
  save.maxSurvivalCleared = lv;
  grantEnduranceIfEligible();
  awardXp(20 + lv);
  sanitizeEquippedCosmetics();
  persistSave();
  updatePointsUI();
  updateNameUI();
  return 1;
}

function awardBossClear(level) {
  if (s.mode !== "local" || s.botMode !== "boss") return 0;
  const lv = Math.max(1, Math.min(BOSS_MAX_LEVEL, level || s.botLevel));
  if (lv <= (save.maxBossCleared || 0)) return 0;
  save.maxBossCleared = lv;
  grantOverlordIfEligible();
  awardXp(30 + lv * 3);
  sanitizeEquippedCosmetics();
  persistSave();
  updatePointsUI();
  updateNameUI();
  return 1;
}

function profilePayload() {
  return {
    name: save.name,
    points: save.points,
    xp: save.xp || 0,
    maxBotCleared: save.maxBotCleared,
    maxChaosCleared: save.maxChaosCleared || 0,
    maxSurvivalCleared: save.maxSurvivalCleared || 0,
    maxBossCleared: save.maxBossCleared || 0,
    maxCupPongCleared: save.maxCupPongCleared || 0,
    owned: save.owned,
    equipped: save.equipped,
    redeemedCodes: Array.isArray(save.redeemedCodes) ? save.redeemedCodes : [],
    bossPowers: Array.isArray(save.bossPowers) ? save.bossPowers.filter((id) => VALID_BOSS_POWERS.has(id)) : [],
    avatar: save.avatar || "default",
    ownedAvatars: Array.isArray(save.ownedAvatars) ? save.ownedAvatars : ["default"],
    customAvatarUrl: save.customAvatarUrl || "",
    title: save.title || "",
    adminSyncedAt: save.adminSyncedAt || 0,
  };
}

function loadAbilities() {
  if (!isAdmin()) return;
  try {
    const raw = localStorage.getItem(ABILITIES_KEY);
    if (raw) Object.assign(save.abilities, JSON.parse(raw));
  } catch {
    /* ignore */
  }
}

function persistAbilities() {
  if (!isAdmin()) return;
  try {
    localStorage.setItem(ABILITIES_KEY, JSON.stringify(save.abilities));
  } catch {
    /* ignore */
  }
}

async function syncProfileFromServer() {
  if (!location.host) return;
  try {
    const before = {
      name: sanitizeName(save.name || ""),
      points: save.points || 0,
      maxBotCleared: save.maxBotCleared || 0,
      maxChaosCleared: save.maxChaosCleared || 0,
      maxSurvivalCleared: save.maxSurvivalCleared || 0,
      maxBossCleared: save.maxBossCleared || 0,
      maxCupPongCleared: save.maxCupPongCleared || 0,
      ownedPaddle: (save.owned.paddle || []).length,
      ownedTable: (save.owned.table || []).length,
    };
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", playerId: getPlayerId() }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.profile) {
      applyProfile(data.profile);
      // If local name was preferred over a stale server name, keep it.
      if (before.name && before.name !== sanitizeName(data.profile.name || "")) {
        save.name = before.name;
        try {
          localStorage.setItem(PLAYER_NAME_KEY, before.name);
        } catch {
          /* ignore */
        }
      }
      localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(profilePayload()));
      const after = {
        name: sanitizeName(save.name || ""),
        points: save.points || 0,
        maxBotCleared: save.maxBotCleared || 0,
        maxChaosCleared: save.maxChaosCleared || 0,
        maxSurvivalCleared: save.maxSurvivalCleared || 0,
        maxBossCleared: save.maxBossCleared || 0,
        maxCupPongCleared: save.maxCupPongCleared || 0,
        ownedPaddle: (save.owned.paddle || []).length,
        ownedTable: (save.owned.table || []).length,
      };
      const remoteName = sanitizeName(data.profile.name || "");
      // If local progress / name was ahead of server, push the merged profile back up.
      if (
        (after.name && after.name !== remoteName) ||
        after.points > (Number(data.profile.points) || 0) ||
        after.maxBotCleared > (Number(data.profile.maxBotCleared) || 0) ||
        after.maxChaosCleared > (Number(data.profile.maxChaosCleared) || 0) ||
        after.maxSurvivalCleared > (Number(data.profile.maxSurvivalCleared) || 0) ||
        after.maxBossCleared > (Number(data.profile.maxBossCleared) || 0) ||
        after.maxCupPongCleared > (Number(data.profile.maxCupPongCleared) || 0) ||
        after.ownedPaddle > (data.profile.owned?.paddle || []).length ||
        after.ownedTable > (data.profile.owned?.table || []).length ||
        before.points > (Number(data.profile.points) || 0) ||
        before.maxBotCleared > (Number(data.profile.maxBotCleared) || 0) ||
        before.maxChaosCleared > (Number(data.profile.maxChaosCleared) || 0) ||
        before.maxSurvivalCleared > (Number(data.profile.maxSurvivalCleared) || 0) ||
        before.maxBossCleared > (Number(data.profile.maxBossCleared) || 0)
      ) {
        await syncProfileToServer({ force: after.name && after.name !== remoteName });
      }
    }
  } catch {
    /* offline — keep local cache */
  }
}

let profileSyncTimer = null;
async function syncProfileToServer(opts = {}) {
  if (!location.host) return;
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        playerId: getPlayerId(),
        profile: profilePayload(),
        force: !!opts.force,
      }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (data?.profile && !opts.force) applyProfile(data.profile);
  } catch {
    /* offline */
  }
}

async function loadSave() {
  loadAbilities();
  loadAuthState();
  try {
    const raw = localStorage.getItem(PLAYER_NAME_KEY);
    if (raw) save.name = sanitizeName(raw);
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(SAVE_CACHE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.name) save.name = sanitizeName(data.name);
      applyProfile(data);
    }
  } catch {
    /* ignore */
  }
  await restoreAuthSession();
  await syncProfileFromServer();
  // Always write the merged progress back to local cache.
  try {
    localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(profilePayload()));
    if (save.name) localStorage.setItem(PLAYER_NAME_KEY, save.name);
  } catch {
    /* ignore */
  }
}

function persistSave(opts = {}) {
  try {
    localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(profilePayload()));
    if (save.name) localStorage.setItem(PLAYER_NAME_KEY, save.name);
    persistAbilities();
    clearTimeout(profileSyncTimer);
    profileSyncTimer = setTimeout(() => syncProfileToServer(opts), opts.force ? 0 : 300);
    if (s.mode === "online" && net.connected) sendCosmetics();
  } catch {
    /* ignore */
  }
}

function shopItem(kind, id) {
  return SHOP[kind].find((i) => i.id === id) || SHOP[kind][0];
}

function updatePointsUI() {
  if (ui.shopPoints) ui.shopPoints.textContent = String(save.points);
}

function awardWinPoints(winner) {
  const won =
    s.mode === "local"
      ? winner === "p1"
      : (winner === "p1" && net.player === 1) || (winner === "p2" && net.player === 2);
  if (!won) return 0;
  const gain = isAdmin() && save.abilities.bonusPts ? 10 : POINTS_PER_WIN;
  save.points += gain;
  awardXp(XP_PER_CLASSIC_WIN);
  persistSave();
  updatePointsUI();
  return gain;
}

function effectivePaddleH(side) {
  let h = paddle.h;
  if (side === mySide() && isAdmin() && save.abilities.megaPaddle) {
    h = Math.round(paddle.h * 1.55);
  }
  if (side === "p1" && isBossMode() && s.boss?.powers?.ironT > 0) {
    h = Math.round(h * 1.3);
  }
  if (side === "p2" && isBossMode() && s.boss && s.boss.growT > 0) {
    h = Math.round(h * (s.boss.growMul || 1.55));
  }
  return h;
}

function mySide() {
  if (s.mode === "local") return "p1";
  if (s.mode === "online" && net.player === 1) return "p1";
  if (s.mode === "online" && net.player === 2) return "p2";
  return null;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function safeColorStop(g, offset, color) {
  g.addColorStop(clamp01(offset), color);
}

let cosmeticSmoothT = 0;

function cosmeticTime() {
  const raw = performance.now() * 0.001;
  if (!cosmeticSmoothT) cosmeticSmoothT = raw;
  cosmeticSmoothT += (raw - cosmeticSmoothT) * 0.12;
  return cosmeticSmoothT;
}

function applyFillStyle(c, item, x, y, w, h, alpha) {
  const t = cosmeticTime();
  if (item.style === "solid") {
    c.globalAlpha = alpha;
    c.fillStyle = item.color;
    return;
  }
  let g;
  if (item.style === "galaxy") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#0b0320");
    safeColorStop(g, 0.4, "#4c1d95");
    safeColorStop(g, 0.7, "#7c3aed");
    safeColorStop(g, 1, "#0ea5e9");
  } else if (item.style === "moon") {
    g = c.createLinearGradient(x, y, x, y + h);
    safeColorStop(g, 0, "#1e293b");
    safeColorStop(g, 0.45, "#94a3b8");
    safeColorStop(g, 1, "#e2e8f0");
  } else if (item.style === "sunset") {
    g = c.createLinearGradient(x, y, x, y + h);
    safeColorStop(g, 0, "#f97316");
    safeColorStop(g, 0.5, "#ec4899");
    safeColorStop(g, 1, "#7c3aed");
  } else if (item.style === "neon") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#22c55e");
    safeColorStop(g, 0.5, "#06b6d4");
    safeColorStop(g, 1, "#a855f7");
  } else if (item.style === "lava") {
    g = c.createLinearGradient(x, y, x, y + h);
    safeColorStop(g, 0, "#fef08a");
    safeColorStop(g, 0.4, "#f97316");
    safeColorStop(g, 1, "#991b1b");
  } else if (item.style === "ice") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#e0f2fe");
    safeColorStop(g, 0.5, "#38bdf8");
    safeColorStop(g, 1, "#1e3a8a");
  } else if (item.style === "rainbow") {
    g = c.createLinearGradient(x, y, x + w, y);
    safeColorStop(g, 0, "#ef4444");
    safeColorStop(g, 0.25, "#eab308");
    safeColorStop(g, 0.5, "#22c55e");
    safeColorStop(g, 0.75, "#3b82f6");
    safeColorStop(g, 1, "#a855f7");
  } else if (item.style === "aurora") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#064e3b");
    safeColorStop(g, 0.4 + Math.sin(t) * 0.06, "#10b981");
    safeColorStop(g, 0.75, "#6366f1");
    safeColorStop(g, 1, "#312e81");
  } else if (item.style === "nebula") {
    const ox = Math.sin(t * 0.7) * w * 0.35;
    const oy = Math.cos(t * 0.55) * h * 0.25;
    g = c.createLinearGradient(x + ox, y + oy, x + w - ox, y + h - oy);
    safeColorStop(g, 0, "#12002b");
    safeColorStop(g, 0.25 + Math.sin(t) * 0.05, "#7c3aed");
    safeColorStop(g, 0.55, "#ec4899");
    safeColorStop(g, 0.8, "#38bdf8");
    safeColorStop(g, 1, "#0b0320");
  } else if (item.style === "interstellar") {
    const shift = ((t * 0.18) % 1);
    g = c.createLinearGradient(x - w * shift, y, x + w * (1.4 - shift), y + h);
    safeColorStop(g, 0, "#020617");
    safeColorStop(g, 0.2, "#1e3a8a");
    safeColorStop(g, 0.45, "#67e8f9");
    safeColorStop(g, 0.65, "#c084fc");
    safeColorStop(g, 0.85, "#f472b6");
    safeColorStop(g, 1, "#020617");
  } else if (item.style === "voidpulse") {
    const pulse = 0.35 + Math.sin(t * 2.2) * 0.2;
    g = c.createRadialGradient(x + w * 0.5, y + h * 0.5, 1, x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.9);
    safeColorStop(g, 0, "#f0abfc");
    safeColorStop(g, pulse * 0.45, "#7c3aed");
    safeColorStop(g, 0.7, "#1e1b4b");
    safeColorStop(g, 1, "#02010a");
  } else if (item.style === "solarflare") {
    const ox = Math.sin(t * 1.4) * w * 0.4;
    g = c.createLinearGradient(x + ox, y, x + w - ox, y + h);
    safeColorStop(g, 0, "#450a0a");
    safeColorStop(g, 0.25, "#ea580c");
    safeColorStop(g, 0.5 + Math.sin(t * 2) * 0.08, "#fde047");
    safeColorStop(g, 0.75, "#fb7185");
    safeColorStop(g, 1, "#7f1d1d");
  } else if (item.style === "plasma") {
    const a = t * 1.1;
    g = c.createLinearGradient(x + Math.cos(a) * w * 0.3, y + Math.sin(a) * h * 0.3, x + w, y + h);
    safeColorStop(g, 0, "#022c22");
    safeColorStop(g, 0.3, "#22d3ee");
    safeColorStop(g, 0.55, "#a3e635");
    safeColorStop(g, 0.8, "#f472b6");
    safeColorStop(g, 1, "#312e81");
  } else if (item.style === "quantum") {
    const s1 = (Math.sin(t * 1.3) + 1) * 0.5;
    g = c.createLinearGradient(x, y + h * s1, x + w, y + h * (1 - s1));
    safeColorStop(g, 0, "#0f172a");
    safeColorStop(g, 0.2, "#22d3ee");
    safeColorStop(g, 0.45, "#ffffff");
    safeColorStop(g, 0.7, "#818cf8");
    safeColorStop(g, 1, "#0f172a");
  } else if (item.style === "darkmatter") {
    const ox = Math.cos(t * 0.8) * w * 0.5;
    const oy = Math.sin(t * 0.6) * h * 0.4;
    g = c.createRadialGradient(x + w * 0.5 + ox * 0.2, y + h * 0.5 + oy * 0.2, 2, x + w * 0.5, y + h * 0.5, Math.max(w, h));
    safeColorStop(g, 0, "#f5d0fe");
    safeColorStop(g, 0.25, "#581c87");
    safeColorStop(g, 0.55, "#111827");
    safeColorStop(g, 0.8, "#4c1d95");
    safeColorStop(g, 1, "#000000");
  } else if (item.style === "hypernova") {
    const shift = ((t * 0.35) % 1);
    g = c.createLinearGradient(x, y - h * shift, x + w, y + h * (1.2 - shift));
    safeColorStop(g, 0, "#3b0764");
    safeColorStop(g, 0.2, "#ef4444");
    safeColorStop(g, 0.4, "#fbbf24");
    safeColorStop(g, 0.6, "#22d3ee");
    safeColorStop(g, 0.8, "#a855f7");
    safeColorStop(g, 1, "#3b0764");
  } else if (item.style === "rosegold") {
    const ox = Math.sin(t * 0.55) * w * 0.2;
    const oy = Math.cos(t * 0.4) * h * 0.12;
    g = c.createLinearGradient(x + ox, y + oy, x + w - ox * 0.5, y + h - oy);
    safeColorStop(g, 0, "#6b2f2a");
    safeColorStop(g, 0.22, "#b76e79");
    safeColorStop(g, 0.42, "#e8b4b8");
    safeColorStop(g, 0.55 + Math.sin(t * 1.2) * 0.04, "#fff1f2");
    safeColorStop(g, 0.72, "#d4a574");
    safeColorStop(g, 0.88, "#c97b84");
    safeColorStop(g, 1, "#8b3a3a");
  } else if (item.style === "voidstorm") {
    const ox = Math.sin(t * 0.35) * w * 0.12;
    g = c.createLinearGradient(x + ox, y, x + w - ox, y + h);
    safeColorStop(g, 0, "#000000");
    safeColorStop(g, 0.35, "#050816");
    safeColorStop(g, 0.55, "#0b1224");
    safeColorStop(g, 0.78, "#020617");
    safeColorStop(g, 1, "#000000");
  } else if (item.style === "hearthflame") {
    // Pure black void — fire is painted in the overlay and blooms into darkness
    g = c.createLinearGradient(x, y, x, y + h);
    safeColorStop(g, 0, "#000000");
    safeColorStop(g, 0.55, "#050201");
    safeColorStop(g, 0.82, "#0a0402");
    safeColorStop(g, 1, "#000000");
  } else if (item.style === "skywyrm") {
    const shift = Math.sin(t * 0.25) * 0.04;
    g = c.createLinearGradient(x, y, x, y + h);
    safeColorStop(g, 0, "#7dd3fc");
    safeColorStop(g, 0.28 + shift, "#38bdf8");
    safeColorStop(g, 0.55, "#0ea5e9");
    safeColorStop(g, 0.78, "#0369a1");
    safeColorStop(g, 1, "#0c4a6e");
  } else if (item.style === "obsidian") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#000000");
    safeColorStop(g, 0.35, "#050505");
    safeColorStop(g, 0.65, "#0a0a0a");
    safeColorStop(g, 1, "#000000");
  } else if (item.style === "chaosrift") {
    const shift = Math.sin(t * 1.4) * 0.06;
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#050008");
    safeColorStop(g, 0.28 + shift, "#120018");
    safeColorStop(g, 0.52, "#0a0510");
    safeColorStop(g, 0.78 - shift, "#180820");
    safeColorStop(g, 1, "#000000");
  } else if (item.style === "endurance") {
    const shift = Math.sin(t * 0.55) * 0.04;
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#050403");
    safeColorStop(g, 0.3 + shift, "#0c0a08");
    safeColorStop(g, 0.55, "#081210");
    safeColorStop(g, 0.78 - shift, "#0a100c");
    safeColorStop(g, 1, "#030201");
  } else if (item.style === "overlord") {
    const shift = Math.sin(t * 1.1) * 0.05;
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#1a0505");
    safeColorStop(g, 0.28 + shift, "#450a0a");
    safeColorStop(g, 0.5, "#14532d");
    safeColorStop(g, 0.72 - shift, "#7f1d1d");
    safeColorStop(g, 1, "#052e16");
  } else if (item.style === "beerpong") {
    // Pint-glass amber: dark body → golden mid → pale near the head
    const sway = Math.sin(t * 0.65) * 0.03;
    g = c.createLinearGradient(x, y + h, x, y);
    safeColorStop(g, 0, "#2a1406");
    safeColorStop(g, 0.18, "#5c2e0a");
    safeColorStop(g, 0.42 + sway, "#a85c12");
    safeColorStop(g, 0.68, "#d4a017");
    safeColorStop(g, 0.88, "#e8c547");
    safeColorStop(g, 1, "#f5e6a3");
  } else if (item.style === "heartbloom") {
    const ox = Math.sin(t * 0.7) * w * 0.18;
    g = c.createLinearGradient(x + ox, y, x + w - ox, y + h);
    safeColorStop(g, 0, "#831843");
    safeColorStop(g, 0.28, "#db2777");
    safeColorStop(g, 0.52 + Math.sin(t * 1.4) * 0.05, "#f472b6");
    safeColorStop(g, 0.78, "#fda4d5");
    safeColorStop(g, 1, "#9d174d");
  } else if (item.style === "blushgarden") {
    g = c.createLinearGradient(x, y, x + w, y + h);
    safeColorStop(g, 0, "#fadadd");
    safeColorStop(g, 0.45, "#f9d5e5");
    safeColorStop(g, 1, "#f6cfe0");
  } else {
    c.globalAlpha = alpha;
    c.fillStyle = item.color || "#fff";
    return;
  }
  c.globalAlpha = alpha;
  c.fillStyle = g;
}

function drawStar(c, cx, cy, spikes, outerR, innerR) {
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
}

function drawHeart(c, cx, cy, size) {
  c.beginPath();
  const s = size;
  c.moveTo(cx, cy + s * 0.35);
  c.bezierCurveTo(cx, cy, cx - s, cy, cx - s, cy + s * 0.35);
  c.bezierCurveTo(cx - s, cy + s * 0.75, cx, cy + s * 1.05, cx, cy + s * 1.35);
  c.bezierCurveTo(cx, cy + s * 1.05, cx + s, cy + s * 0.75, cx + s, cy + s * 0.35);
  c.bezierCurveTo(cx + s, cy, cx, cy, cx, cy + s * 0.35);
  c.closePath();
  c.fill();
}

function drawCosmosFlower(c, cx, cy, size, rot, petalColor, alpha) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.globalAlpha = alpha;
  const petals = 12;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    c.save();
    c.rotate(a);
    c.beginPath();
    c.ellipse(0, -size * 0.52, size * 0.18, size * 0.52, 0, 0, Math.PI * 2);
    c.fillStyle = petalColor;
    c.fill();
    c.restore();
  }
  // Soft petal tips highlight
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + 0.08;
    c.save();
    c.rotate(a);
    c.globalAlpha = alpha * 0.35;
    c.beginPath();
    c.ellipse(0, -size * 0.62, size * 0.08, size * 0.22, 0, 0, Math.PI * 2);
    c.fillStyle = "#ffffff";
    c.fill();
    c.restore();
  }
  c.globalAlpha = alpha;
  const center = c.createRadialGradient(0, 0, size * 0.05, 0, 0, size * 0.28);
  center.addColorStop(0, "#fde047");
  center.addColorStop(0.55, "#fbbf24");
  center.addColorStop(1, "#f59e0b");
  c.fillStyle = center;
  c.beginPath();
  c.arc(0, 0, size * 0.26, 0, Math.PI * 2);
  c.fill();
  // Textured disc florets
  c.fillStyle = "#fef08a";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = size * (0.08 + (i % 3) * 0.04);
    c.beginPath();
    c.arc(Math.cos(a) * r, Math.sin(a) * r, size * 0.035, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawTinyBlossom(c, cx, cy, size, rot, color, alpha) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.globalAlpha = alpha;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    c.beginPath();
    c.ellipse(
      Math.cos(a) * size * 0.45,
      Math.sin(a) * size * 0.45,
      size * 0.32,
      size * 0.22,
      a,
      0,
      Math.PI * 2
    );
    c.fillStyle = color;
    c.fill();
  }
  c.fillStyle = "#fde68a";
  c.beginPath();
  c.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawPinkCluster(c, cx, cy, size, rot, alpha) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.globalAlpha = alpha;
  const dots = [
    [0, 0, 1],
    [-0.55, -0.35, 0.75],
    [0.5, -0.4, 0.7],
    [-0.35, 0.5, 0.65],
    [0.45, 0.4, 0.7],
    [0.05, -0.7, 0.55],
    [-0.7, 0.15, 0.55],
  ];
  for (const [ox, oy, s] of dots) {
    c.beginPath();
    c.arc(ox * size, oy * size, size * 0.28 * s, 0, Math.PI * 2);
    c.fillStyle = s > 0.8 ? "#ec4899" : s > 0.65 ? "#f472b6" : "#fb7185";
    c.fill();
  }
  c.restore();
}

function drawLoosePetal(c, cx, cy, size, rot, color, alpha) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.globalAlpha = alpha;
  c.beginPath();
  c.ellipse(0, 0, size * 0.28, size * 0.7, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.restore();
}

function hashNoise(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildLightningPath(x0, y0, x1, y1, depth, jag, seed) {
  function subdivide(ax, ay, bx, by, d, s) {
    if (d <= 0) return [{ x: bx, y: by }];
    const mx = (ax + bx) * 0.5;
    const my = (ay + by) * 0.5;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const offset = (hashNoise(s) * 2 - 1) * jag * (0.38 + d * 0.2);
    const midX = mx + nx * offset;
    const midY = my + ny * offset * 0.88;
    return [
      ...subdivide(ax, ay, midX, midY, d - 1, s + 1.7),
      ...subdivide(midX, midY, bx, by, d - 1, s + 3.1),
    ];
  }
  return [{ x: x0, y: y0 }, ...subdivide(x0, y0, x1, y1, depth, seed)];
}

function strokeLightningPath(c, pts, untilIndex) {
  if (!pts || pts.length < 2) return;
  const end = untilIndex == null ? pts.length - 1 : Math.max(1, Math.min(pts.length - 1, untilIndex));
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i <= end; i++) c.lineTo(pts[i].x, pts[i].y);
  c.stroke();
}

function pointAlongLightning(pts, progress) {
  if (!pts || pts.length < 2) return { x: 0, y: 0, idx: 0 };
  const p = Math.max(0, Math.min(1, progress));
  const target = p * (pts.length - 1);
  const i0 = Math.floor(target);
  const i1 = Math.min(pts.length - 1, i0 + 1);
  const f = target - i0;
  return {
    x: pts[i0].x + (pts[i1].x - pts[i0].x) * f,
    y: pts[i0].y + (pts[i1].y - pts[i0].y) * f,
    idx: i1,
  };
}

function drawLightningBolt(c, x0, y0, x1, y1, segs, jag, seed) {
  const depth = Math.max(3, Math.min(7, Math.round(Math.log2(Math.max(4, segs)) + 2)));
  const pts = buildLightningPath(x0, y0, x1, y1, depth, jag, seed);
  strokeLightningPath(c, pts);
  return pts;
}

function drawLightningStrike(c, x0, y0, x1, y1, scale, seed, flash, alpha, progress) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const jag = Math.max(2.2, len * 0.07) * scale;
  const depth = 5 + (Math.floor(seed) % 3);
  const main = buildLightningPath(x0, y0, x1, y1, depth, jag, seed);
  const prog = Math.max(0.02, Math.min(1, progress == null ? 1 : progress));
  const head = pointAlongLightning(main, prog);
  const until = head.idx;

  c.lineCap = "round";
  c.lineJoin = "round";

  // Soft atmospheric bloom along revealed path
  c.globalAlpha = alpha * flash * 0.14;
  c.strokeStyle = "#3b82f6";
  c.lineWidth = 10 * scale;
  strokeLightningPath(c, main, until);

  c.globalAlpha = alpha * flash * 0.26;
  c.strokeStyle = "#60a5fa";
  c.lineWidth = 5.8 * scale;
  strokeLightningPath(c, main, until);

  c.globalAlpha = alpha * flash * 0.55;
  c.strokeStyle = "#bfdbfe";
  c.lineWidth = 2.5 * scale;
  strokeLightningPath(c, main, until);

  c.globalAlpha = alpha * flash * 0.98;
  c.strokeStyle = "#ffffff";
  c.lineWidth = 1.1 * scale;
  strokeLightningPath(c, main, until);

  c.globalAlpha = alpha * flash * 0.85;
  c.strokeStyle = "#f8fafc";
  c.lineWidth = 0.45 * scale;
  strokeLightningPath(c, main, until);

  // Branches only appear once the ripple has passed their fork
  const branchCount = 2 + (Math.floor(seed * 3) % 2);
  for (let b = 0; b < branchCount; b++) {
    const forkFrac = 0.28 + b * 0.22 + hashNoise(seed + b * 9) * 0.12;
    if (prog < forkFrac + 0.04) continue;
    const idx = Math.min(
      main.length - 2,
      Math.max(2, Math.floor(main.length * forkFrac))
    );
    if (idx > until) continue;
    const origin = main[idx];
    const dir = b % 2 === 0 ? 1 : -1;
    const reach = Math.min(len * 0.12, Math.max(6, scale * 8)) * (0.7 + hashNoise(seed + b * 4.2) * 0.35);
    const bx = origin.x + dir * reach * (0.55 + hashNoise(seed + b) * 0.35);
    const by = origin.y + reach * (0.7 + hashNoise(seed + b * 2.1) * 0.45);
    const branch = buildLightningPath(origin.x, origin.y, bx, by, 3, jag * 0.4, seed + b * 17.3);
    const branchProg = Math.max(0, Math.min(1, (prog - forkFrac) / 0.35));
    const bHead = pointAlongLightning(branch, branchProg);

    c.globalAlpha = alpha * flash * 0.18;
    c.strokeStyle = "#93c5fd";
    c.lineWidth = 2.8 * scale;
    strokeLightningPath(c, branch, bHead.idx);

    c.globalAlpha = alpha * flash * 0.7;
    c.strokeStyle = "#e0f2fe";
    c.lineWidth = 1.0 * scale;
    strokeLightningPath(c, branch, bHead.idx);

    c.globalAlpha = alpha * flash * 0.9;
    c.strokeStyle = "#ffffff";
    c.lineWidth = 0.45 * scale;
    strokeLightningPath(c, branch, bHead.idx);
  }

  return { main, head, progress: prog };
}

function drawSkywyrmDragon(c, ox, oy, unit, wingPhase, pitch, alpha, mouthOpen = 0, fireAmt = 0) {
  c.save();
  c.translate(ox, oy);
  c.rotate(pitch);
  c.globalAlpha = alpha;

  const u = unit;
  const flap = wingPhase;
  const wingUp = -0.6 + flap * 1.05;
  const wingSpread = 1.12 + Math.abs(flap) * 0.28;
  const jaw = Math.max(0, Math.min(1, mouthOpen));

  // Soft contact shadow
  c.fillStyle = "rgba(40, 10, 5, 0.28)";
  c.beginPath();
  c.ellipse(u * 0.3, u * 2.8, u * 4.2, u * 0.7, 0, 0, Math.PI * 2);
  c.fill();

  // Far wing (behind body)
  c.save();
  c.translate(-u * 0.25, -u * 0.2);
  c.rotate(wingUp * 0.92);
  c.scale(wingSpread, 1);
  const farWing = c.createLinearGradient(0, 0, 0, -u * 5.2);
  farWing.addColorStop(0, "#450a0a");
  farWing.addColorStop(0.4, "#991b1b");
  farWing.addColorStop(0.75, "#dc2626");
  farWing.addColorStop(1, "rgba(252, 165, 165, 0.35)");
  c.fillStyle = farWing;
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(u * 1.0, -u * 1.5, u * 3.0, -u * 4.0, u * 0.5, -u * 5.4);
  c.bezierCurveTo(-u * 0.8, -u * 4.2, -u * 2.2, -u * 1.9, -u * 0.4, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(254, 202, 202, 0.35)";
  c.lineWidth = Math.max(0.45, u * 0.09);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(u * 0.4, -u * 4.9);
  c.moveTo(0, 0);
  c.lineTo(u * 1.8, -u * 3.8);
  c.moveTo(0, 0);
  c.lineTo(-u * 1.1, -u * 2.8);
  c.stroke();
  c.restore();

  // Tail
  const tailGrad = c.createLinearGradient(-u * 2, 0, -u * 7.5, 0);
  tailGrad.addColorStop(0, "#b91c1c");
  tailGrad.addColorStop(1, "#7f1d1d");
  c.fillStyle = tailGrad;
  c.beginPath();
  c.moveTo(-u * 2.6, u * 0.2);
  c.bezierCurveTo(-u * 4.2, u * 1.1, -u * 6.0, u * 0.25, -u * 7.6, -u * 0.75);
  c.bezierCurveTo(-u * 5.8, -u * 0.15, -u * 4.0, -u * 0.6, -u * 2.5, -u * 0.3);
  c.closePath();
  c.fill();
  // Tail spikes
  c.fillStyle = "#fca5a5";
  for (let i = 0; i < 4; i++) {
    const tx = -u * (3.2 + i * 1.05);
    const ty = -u * (0.15 + i * 0.08);
    c.beginPath();
    c.moveTo(tx, ty);
    c.lineTo(tx - u * 0.15, ty - u * 0.55);
    c.lineTo(tx + u * 0.35, ty - u * 0.1);
    c.closePath();
    c.fill();
  }
  // Tail fin
  c.fillStyle = "#ef4444";
  c.beginPath();
  c.moveTo(-u * 7.2, -u * 0.55);
  c.quadraticCurveTo(-u * 8.5, -u * 1.8, -u * 7.8, -u * 0.15);
  c.quadraticCurveTo(-u * 8.3, u * 1.1, -u * 7.1, u * 0.2);
  c.closePath();
  c.fill();

  // Body
  const body = c.createLinearGradient(0, -u * 1.4, 0, u * 1.5);
  body.addColorStop(0, "#f87171");
  body.addColorStop(0.3, "#dc2626");
  body.addColorStop(0.65, "#b91c1c");
  body.addColorStop(1, "#7f1d1d");
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-u * 2.8, 0);
  c.bezierCurveTo(-u * 1.6, -u * 1.45, u * 0.8, -u * 1.55, u * 2.9, -u * 0.45);
  c.bezierCurveTo(u * 3.5, 0, u * 3.0, u * 1.05, u * 1.9, u * 1.2);
  c.bezierCurveTo(u * 0.2, u * 1.4, -u * 1.8, u * 1.05, -u * 2.8, u * 0.2);
  c.closePath();
  c.fill();

  // Spine ridges
  c.fillStyle = "#fecaca";
  for (let i = 0; i < 6; i++) {
    const sx = -u * 1.8 + i * u * 0.75;
    c.beginPath();
    c.moveTo(sx, -u * 0.85);
    c.lineTo(sx + u * 0.15, -u * 1.55);
    c.lineTo(sx + u * 0.45, -u * 0.75);
    c.closePath();
    c.fill();
  }

  // Belly scales
  const belly = c.createLinearGradient(0, 0, 0, u * 1.2);
  belly.addColorStop(0, "rgba(254, 243, 199, 0.7)");
  belly.addColorStop(0.55, "rgba(251, 191, 36, 0.35)");
  belly.addColorStop(1, "rgba(180, 83, 9, 0.15)");
  c.fillStyle = belly;
  c.beginPath();
  c.moveTo(-u * 1.9, u * 0.2);
  c.bezierCurveTo(-u * 0.4, u * 0.7, u * 1.2, u * 0.75, u * 2.4, u * 0.3);
  c.bezierCurveTo(u * 1.4, u * 1.15, -u * 0.5, u * 1.15, -u * 1.9, u * 0.4);
  c.closePath();
  c.fill();

  // Scale rows
  c.strokeStyle = "rgba(127, 29, 29, 0.45)";
  c.lineWidth = Math.max(0.4, u * 0.07);
  for (let i = 0; i < 7; i++) {
    const sx = -u * 1.7 + i * u * 0.65;
    c.beginPath();
    c.arc(sx, -u * 0.2, u * 0.32, 0.15, Math.PI - 0.15);
    c.stroke();
  }

  // Near wing (in front)
  c.save();
  c.translate(u * 0.2, -u * 0.15);
  c.rotate(wingUp);
  c.scale(wingSpread, 1);
  const nearWing = c.createLinearGradient(0, 0, 0, -u * 5.6);
  nearWing.addColorStop(0, "#991b1b");
  nearWing.addColorStop(0.35, "#dc2626");
  nearWing.addColorStop(0.7, "#f87171");
  nearWing.addColorStop(1, "rgba(254, 226, 226, 0.5)");
  c.fillStyle = nearWing;
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(u * 1.3, -u * 1.7, u * 3.4, -u * 4.3, u * 0.6, -u * 5.8);
  c.bezierCurveTo(-u * 1.0, -u * 4.5, -u * 2.5, -u * 2.0, -u * 0.4, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(69, 10, 10, 0.5)";
  c.lineWidth = Math.max(0.5, u * 0.1);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(u * 0.5, -u * 5.3);
  c.moveTo(0, 0);
  c.lineTo(u * 2.0, -u * 4.0);
  c.moveTo(0, 0);
  c.lineTo(-u * 1.2, -u * 3.0);
  c.stroke();
  c.strokeStyle = "rgba(255, 255, 255, 0.35)";
  c.lineWidth = Math.max(0.4, u * 0.08);
  c.beginPath();
  c.moveTo(u * 0.25, -u * 5.4);
  c.quadraticCurveTo(u * 0.65, -u * 5.7, u * 0.4, -u * 5.0);
  c.stroke();
  c.restore();

  // Neck
  c.fillStyle = "#dc2626";
  c.beginPath();
  c.moveTo(u * 2.4, -u * 0.25);
  c.bezierCurveTo(u * 3.3, -u * 0.85, u * 4.1, -u * 0.7, u * 4.7, -u * 0.2);
  c.bezierCurveTo(u * 5.1, u * 0.2, u * 4.8, u * 0.55, u * 4.1, u * 0.5);
  c.bezierCurveTo(u * 3.4, u * 0.45, u * 2.7, u * 0.3, u * 2.4, u * 0.2);
  c.closePath();
  c.fill();

  // Upper jaw / snout
  const snout = c.createLinearGradient(u * 4.5, 0, u * 6.2, 0);
  snout.addColorStop(0, "#ef4444");
  snout.addColorStop(1, "#991b1b");
  c.fillStyle = snout;
  c.beginPath();
  c.moveTo(u * 4.5, -u * 0.28);
  c.bezierCurveTo(u * 5.3, -u * 0.5, u * 6.0, -u * 0.2, u * 6.25, u * 0.05);
  c.bezierCurveTo(u * 6.1, u * 0.22, u * 5.3, u * 0.18, u * 4.6, u * 0.08);
  c.closePath();
  c.fill();

  // Lower jaw (opens when breathing fire)
  c.fillStyle = "#7f1d1d";
  c.beginPath();
  c.moveTo(u * 4.55, u * 0.12);
  c.bezierCurveTo(
    u * 5.2,
    u * (0.2 + jaw * 0.55),
    u * 5.9,
    u * (0.25 + jaw * 0.75),
    u * 6.15,
    u * (0.15 + jaw * 0.55)
  );
  c.bezierCurveTo(
    u * 5.7,
    u * (0.35 + jaw * 0.7),
    u * 5.0,
    u * (0.4 + jaw * 0.45),
    u * 4.55,
    u * 0.28
  );
  c.closePath();
  c.fill();

  // Mouth interior / glow when open
  if (jaw > 0.08) {
    const mouthGlow = c.createRadialGradient(
      u * 5.4,
      u * (0.15 + jaw * 0.25),
      0,
      u * 5.4,
      u * (0.15 + jaw * 0.25),
      u * (0.9 + jaw)
    );
    mouthGlow.addColorStop(0, `rgba(255, 250, 200,${0.7 * jaw})`);
    mouthGlow.addColorStop(0.4, `rgba(251, 146, 60,${0.45 * jaw})`);
    mouthGlow.addColorStop(1, "rgba(127, 29, 29, 0)");
    c.fillStyle = mouthGlow;
    c.beginPath();
    c.moveTo(u * 4.7, u * 0.1);
    c.lineTo(u * 6.05, u * (0.08 + jaw * 0.15));
    c.lineTo(u * 5.95, u * (0.2 + jaw * 0.55));
    c.lineTo(u * 4.7, u * 0.25);
    c.closePath();
    c.fill();

    // Teeth
    c.fillStyle = "#fef3c7";
    for (let i = 0; i < 4; i++) {
      const tx = u * (4.95 + i * 0.28);
      c.beginPath();
      c.moveTo(tx, u * 0.1);
      c.lineTo(tx + u * 0.08, u * (0.1 + jaw * 0.22));
      c.lineTo(tx + u * 0.16, u * 0.1);
      c.closePath();
      c.fill();
    }
  }

  // Horns
  c.fillStyle = "#fef3c7";
  c.beginPath();
  c.moveTo(u * 4.15, -u * 0.4);
  c.quadraticCurveTo(u * 3.95, -u * 1.4, u * 4.4, -u * 1.65);
  c.quadraticCurveTo(u * 4.5, -u * 0.85, u * 4.35, -u * 0.3);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(u * 4.55, -u * 0.35);
  c.quadraticCurveTo(u * 4.8, -u * 1.15, u * 5.15, -u * 1.25);
  c.quadraticCurveTo(u * 4.9, -u * 0.65, u * 4.65, -u * 0.25);
  c.closePath();
  c.fill();

  // Fiery eyes
  const eyeX = u * 4.85;
  const eyeY = -u * 0.08;
  const eyeGlow = c.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, u * 0.55);
  eyeGlow.addColorStop(0, "rgba(255, 250, 200, 0.85)");
  eyeGlow.addColorStop(0.35, "rgba(251, 146, 60, 0.55)");
  eyeGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
  c.fillStyle = eyeGlow;
  c.beginPath();
  c.arc(eyeX, eyeY, u * 0.55, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fde047";
  c.beginPath();
  c.ellipse(eyeX, eyeY, u * 0.22, u * 0.17, -0.25, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ea580c";
  c.beginPath();
  c.ellipse(eyeX + u * 0.02, eyeY, u * 0.12, u * 0.14, -0.25, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#450a0a";
  c.beginPath();
  c.arc(eyeX + u * 0.04, eyeY, u * 0.06, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.beginPath();
  c.arc(eyeX - u * 0.04, eyeY - u * 0.05, u * 0.035, 0, Math.PI * 2);
  c.fill();

  // Hind / fore legs
  c.fillStyle = "#991b1b";
  c.beginPath();
  c.moveTo(-u * 0.7, u * 0.65);
  c.quadraticCurveTo(-u * 0.35, u * 1.7, u * 0.45, u * 1.9);
  c.quadraticCurveTo(u * 0.2, u * 1.15, -u * 0.25, u * 0.7);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(u * 1.5, u * 0.55);
  c.quadraticCurveTo(u * 1.8, u * 1.5, u * 2.4, u * 1.65);
  c.quadraticCurveTo(u * 2.0, u * 1.0, u * 1.6, u * 0.6);
  c.closePath();
  c.fill();

  // Fire breath blast
  if (fireAmt > 0.04) {
    const fx0 = u * 6.2;
    const fy0 = u * (0.08 + jaw * 0.2);
    const reach = u * (4.5 + fireAmt * 7.5);
    const cone = u * (0.6 + fireAmt * 1.8);

    // Outer glow into air
    const blast = c.createRadialGradient(fx0 + reach * 0.35, fy0, 0, fx0 + reach * 0.35, fy0, reach * 0.85);
    blast.addColorStop(0, `rgba(255, 250, 200,${0.45 * fireAmt})`);
    blast.addColorStop(0.3, `rgba(251, 146, 60,${0.35 * fireAmt})`);
    blast.addColorStop(0.65, `rgba(220, 38, 38,${0.18 * fireAmt})`);
    blast.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = blast;
    c.beginPath();
    c.arc(fx0 + reach * 0.35, fy0, reach * 0.85, 0, Math.PI * 2);
    c.fill();

    // Flame cone
    c.beginPath();
    c.moveTo(fx0, fy0 - u * 0.12);
    c.bezierCurveTo(
      fx0 + reach * 0.35,
      fy0 - cone,
      fx0 + reach * 0.7,
      fy0 - cone * 0.7,
      fx0 + reach,
      fy0 + Math.sin(performance.now() * 0.02) * u * 0.3
    );
    c.bezierCurveTo(
      fx0 + reach * 0.7,
      fy0 + cone * 0.7,
      fx0 + reach * 0.35,
      fy0 + cone,
      fx0,
      fy0 + u * 0.18
    );
    c.closePath();
    const coneGrad = c.createLinearGradient(fx0, fy0, fx0 + reach, fy0);
    coneGrad.addColorStop(0, `rgba(255, 255, 255,${0.85 * fireAmt})`);
    coneGrad.addColorStop(0.2, `rgba(254, 240, 138,${0.9 * fireAmt})`);
    coneGrad.addColorStop(0.45, `rgba(251, 146, 60,${0.85 * fireAmt})`);
    coneGrad.addColorStop(0.75, `rgba(220, 38, 38,${0.55 * fireAmt})`);
    coneGrad.addColorStop(1, "rgba(69, 10, 10, 0)");
    c.fillStyle = coneGrad;
    c.fill();

    // Hot core stream
    c.beginPath();
    c.moveTo(fx0, fy0);
    c.bezierCurveTo(
      fx0 + reach * 0.4,
      fy0 - cone * 0.25,
      fx0 + reach * 0.7,
      fy0 + cone * 0.15,
      fx0 + reach * 0.92,
      fy0
    );
    c.bezierCurveTo(
      fx0 + reach * 0.7,
      fy0 - cone * 0.1,
      fx0 + reach * 0.4,
      fy0 + cone * 0.2,
      fx0,
      fy0
    );
    c.closePath();
    c.fillStyle = `rgba(255, 255, 255,${0.55 * fireAmt})`;
    c.fill();

    // Embers in the breath
    for (let i = 0; i < 10; i++) {
      const p = (i + 1) / 11;
      const ex = fx0 + reach * p + Math.sin(performance.now() * 0.01 + i) * u * 0.25;
      const ey = fy0 + Math.sin(performance.now() * 0.015 + i * 1.7) * cone * 0.45 * p;
      c.globalAlpha = alpha * fireAmt * (1 - p * 0.7);
      c.fillStyle = i % 2 ? "#fde68a" : "#fb923c";
      c.beginPath();
      c.arc(ex, ey, u * (0.08 + (1 - p) * 0.12), 0, Math.PI * 2);
      c.fill();
    }
  }

  c.restore();
}

function drawEpicOverlay(c, item, x, y, w, h, alpha) {
  if (!item.epic && !item.legendary && !item.chaos && !item.survival && !item.boss && !item.secret && !item.cuppong) return;
  const t = cosmeticTime();
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();

  if (item.style === "nebula" || item.style === "interstellar" || item.style === "darkmatter") {
    for (let i = 0; i < 14; i++) {
      const px = x + ((Math.sin(t * 0.7 + i * 1.7) * 0.5 + 0.5) * w);
      const py = y + ((Math.cos(t * 0.9 + i * 2.1) * 0.5 + 0.5) * h);
      const r = 0.6 + (i % 3) * 0.5;
      c.globalAlpha = alpha * (0.35 + (Math.sin(t * 2.1 + i) * 0.5 + 0.5) * 0.45);
      c.fillStyle = i % 2 === 0 ? "#ffffff" : "#a5f3fc";
      c.beginPath();
      c.arc(px, py, r, 0, Math.PI * 2);
      c.fill();
    }
  }

  if (item.style === "interstellar" || item.style === "quantum") {
    for (let i = 0; i < 5; i++) {
      const yy = y + ((t * (18 + i * 7) + i * 17) % (h + 20)) - 10;
      c.globalAlpha = alpha * 0.28;
      c.strokeStyle = i % 2 ? "#67e8f9" : "#e879f9";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, yy);
      c.lineTo(x + w, yy + (i - 2) * 2);
      c.stroke();
    }
  }

  if (item.style === "solarflare" || item.style === "hypernova" || item.style === "plasma") {
    for (let i = 0; i < 4; i++) {
      const wave = Math.sin(t * 2.4 + i * 1.3);
      c.globalAlpha = alpha * (0.18 + Math.abs(wave) * 0.2);
      c.strokeStyle = item.style === "plasma" ? "#67e8f9" : "#fde047";
      c.lineWidth = 1.5;
      c.beginPath();
      for (let px = 0; px <= w; px += 2) {
        const py = y + h * (0.25 + i * 0.18) + Math.sin(px * 0.12 + t * 3 + i) * (4 + i * 2) * wave;
        if (px === 0) c.moveTo(x + px, py);
        else c.lineTo(x + px, py);
      }
      c.stroke();
    }
  }

  if (item.style === "voidpulse") {
    const pulse = (Math.sin(t * 2.5) * 0.5 + 0.5);
    c.globalAlpha = alpha * (0.2 + pulse * 0.35);
    c.strokeStyle = "#e879f9";
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
  }

  if (item.style === "hypernova") {
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const rg = c.createRadialGradient(cx, cy, 1, cx, cy, Math.max(w, h) * 0.7);
    rg.addColorStop(0, `rgba(255,255,255,${0.25 + Math.sin(t * 4) * 0.1})`);
    rg.addColorStop(0.4, "rgba(251,191,36,0.12)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = rg;
    c.fillRect(x, y, w, h);
  }

  if (item.style === "rosegold") {
    for (let i = 0; i < 28; i++) {
      const px = x + ((Math.sin(t * 1.1 + i * 2.3) * 0.5 + 0.5) * w);
      const py = y + ((Math.cos(t * 0.95 + i * 1.9) * 0.5 + 0.5) * h);
      const twinkle = Math.sin(t * 6 + i * 1.4) * 0.5 + 0.5;
      c.globalAlpha = alpha * (0.25 + twinkle * 0.65);
      c.fillStyle = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffe4e6" : "#fde68a";
      c.beginPath();
      c.arc(px, py, 0.5 + (i % 4) * 0.35 * twinkle, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 7; i++) {
      const sx = x + ((Math.sin(t * 0.45 + i * 1.8) * 0.5 + 0.5) * w);
      const sy = y + ((Math.cos(t * 0.55 + i * 2.4) * 0.5 + 0.5) * h);
      const pulse = 0.55 + Math.sin(t * 2.2 + i) * 0.35;
      c.globalAlpha = alpha * (0.35 + pulse * 0.45);
      c.fillStyle = i % 2 === 0 ? "#fff7ed" : "#fecdd3";
      drawStar(c, sx, sy, 4, 2.2 + pulse * 1.6, 0.9 + pulse * 0.5);
    }
    const sheen = c.createLinearGradient(x, y, x + w, y + h);
    const sheenPos = (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.5;
    sheen.addColorStop(Math.max(0, sheenPos - 0.08), "rgba(255,255,255,0)");
    sheen.addColorStop(sheenPos, `rgba(255,241,242,${0.18 + Math.sin(t * 2) * 0.06})`);
    sheen.addColorStop(Math.min(1, sheenPos + 0.08), "rgba(255,255,255,0)");
    c.globalAlpha = alpha;
    c.fillStyle = sheen;
    c.fillRect(x, y, w, h);
  }

  if (item.style === "voidstorm") {
    const scale = Math.max(0.55, Math.min(2.6, Math.min(w, h) / 32));
    let peakFlash = 0;
    let flashCx = x + w * 0.5;
    let flashCy = y + h * 0.35;

    // 4 staggered slow ripples every 2s; each travels top→bottom and stays until impact
    const windowSec = 2;
    const strikesPerWindow = 4;
    const travelDur = 0.58;
    const holdDur = 0.1;
    const strikeLife = travelDur + holdDur;
    const slotGap = windowSec / strikesPerWindow;
    const windowIndex = Math.floor(t / windowSec);
    const localT = t - windowIndex * windowSec;
    const laneFracs = [0.14, 0.38, 0.62, 0.86];

    for (let s = 0; s < strikesPerWindow; s++) {
      const startAt = s * slotGap + 0.02;
      const age = localT - startAt;
      if (age < 0 || age > strikeLife) continue;

      const progress = Math.min(1, age / travelDur);
      const atBottom = progress >= 1;
      const holdAge = Math.max(0, age - travelDur);
      const fade = atBottom ? Math.max(0, 1 - holdAge / holdDur) : 1;
      const flicker = 0.94 + hashNoise(Math.floor(t * 16) + s * 19) * 0.06;
      const flash = Math.min(1, (0.55 + progress * 0.45) * fade * flicker);
      if (flash < 0.04) continue;

      const laneOrderSeed = windowIndex * 17.9 + 3.1;
      const lanePick = (s + Math.floor(hashNoise(laneOrderSeed) * 4)) % 4;
      const lane = laneFracs[lanePick];
      const seedBase = windowIndex * 53.1 + s * 91.7 + lanePick * 13.3;

      const laneHalf = w * 0.09;
      const startX = x + lane * w + (hashNoise(seedBase) * 2 - 1) * laneHalf * 0.35;
      const endX = x + lane * w + (hashNoise(seedBase + 2.4) * 2 - 1) * laneHalf;
      const startY = y - h * 0.12;
      const endY = y + h * 0.995;

      const drawn = drawLightningStrike(
        c,
        startX,
        startY,
        endX,
        endY,
        scale,
        seedBase,
        flash,
        alpha,
        progress
      );
      const head = drawn.head;

      // Bright ripple head traveling downward
      const headR = (7 + progress * 5) * scale;
      const tipGlow = c.createRadialGradient(head.x, head.y, 0, head.x, head.y, headR);
      tipGlow.addColorStop(0, `rgba(255,255,255,${0.7 * flash})`);
      tipGlow.addColorStop(0.3, `rgba(191,219,254,${0.35 * flash})`);
      tipGlow.addColorStop(1, "rgba(59,130,246,0)");
      c.globalAlpha = alpha;
      c.fillStyle = tipGlow;
      c.beginPath();
      c.arc(head.x, head.y, headR, 0, Math.PI * 2);
      c.fill();

      // Soft light wash that follows the descending tip
      const follow = c.createRadialGradient(
        head.x,
        head.y,
        1,
        head.x,
        head.y,
        Math.max(w, h) * (0.28 + progress * 0.2)
      );
      follow.addColorStop(0, `rgba(239,246,255,${0.16 * flash})`);
      follow.addColorStop(0.45, `rgba(147,197,253,${0.08 * flash})`);
      follow.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = follow;
      c.fillRect(x, y, w, h);

      // Expanding ripple bloom once the strike reaches the bottom
      if (atBottom) {
        const impact = Math.sin(Math.min(1, holdAge / holdDur) * Math.PI);
        const r1 = Math.min(w, h) * (0.2 + impact * 0.45);
        const ring = c.createRadialGradient(head.x, head.y, 1, head.x, head.y, r1);
        ring.addColorStop(0, `rgba(255,255,255,${0.28 * impact * fade})`);
        ring.addColorStop(0.4, `rgba(147,197,253,${0.14 * impact * fade})`);
        ring.addColorStop(1, "rgba(15,23,42,0)");
        c.globalAlpha = alpha;
        c.fillStyle = ring;
        c.beginPath();
        c.arc(head.x, head.y, r1, 0, Math.PI * 2);
        c.fill();

        c.globalAlpha = alpha * impact * fade * 0.6;
        c.strokeStyle = "rgba(224,242,254,0.9)";
        c.lineWidth = Math.max(0.6, 1.2 * scale * (1 - holdAge / holdDur));
        c.beginPath();
        c.arc(head.x, head.y, r1 * 0.9, 0, Math.PI * 2);
        c.stroke();
      }

      if (flash > peakFlash) {
        peakFlash = flash;
        flashCx = head.x;
        flashCy = head.y;
      }
    }

    if (peakFlash > 0.35) {
      const wash = c.createRadialGradient(
        flashCx,
        flashCy,
        1,
        flashCx,
        flashCy,
        Math.max(w, h) * 1.05
      );
      wash.addColorStop(0, `rgba(239,246,255,${0.1 * peakFlash})`);
      wash.addColorStop(0.45, `rgba(147,197,253,${0.06 * peakFlash})`);
      wash.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = wash;
      c.fillRect(x, y, w, h);
    }

    const glow = c.createRadialGradient(
      x + w * 0.5,
      y + h * 0.25,
      1,
      x + w * 0.5,
      y + h * 0.55,
      Math.max(w, h) * 0.9
    );
    glow.addColorStop(0, `rgba(96,165,250,${0.06 + Math.sin(t * 2.8) * 0.03})`);
    glow.addColorStop(0.5, "rgba(30,64,175,0.04)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = glow;
    c.fillRect(x, y, w, h);
  }

  if (item.style === "hearthflame") {
    const scale = Math.max(0.55, Math.min(2.8, Math.min(w, h) / 28));
    const baseY = y + h * 1.02;
    let peakGlow = 0;
    let glowCx = x + w * 0.5;
    let glowCy = y + h * 0.72;

    // Soft hearth illumination that fades into black (voidstorm-style wash)
    const hearthPulse = 0.55 + Math.sin(t * 2.1) * 0.12;
    const hearth = c.createRadialGradient(
      x + w * 0.5,
      y + h * 0.95,
      1,
      x + w * 0.5,
      y + h * 0.42,
      Math.max(w, h) * 1.05
    );
    hearth.addColorStop(0, `rgba(255, 180, 60,${0.16 * hearthPulse})`);
    hearth.addColorStop(0.28, `rgba(234, 88, 12,${0.1 * hearthPulse})`);
    hearth.addColorStop(0.55, `rgba(127, 29, 29,${0.05 * hearthPulse})`);
    hearth.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = hearth;
    c.fillRect(x, y, w, h);

    // Back-layer soft blazes (wide, translucent, bloom into void)
    for (let i = 0; i < 5; i++) {
      const phase = i * 1.9 + 0.4;
      const flicker = 0.75 + Math.sin(t * (1.7 + i * 0.25) + phase) * 0.25;
      const lane = 0.12 + i * 0.19;
      const cx = x + lane * w + Math.sin(t * 1.1 + phase) * w * 0.05;
      const height = h * (0.55 + (i % 3) * 0.1) * flicker;
      const width = w * (0.22 + (i % 2) * 0.06);
      const tipY = baseY - height;
      const sway = Math.sin(t * 1.6 + phase) * width * 0.45;

      const bloomR = Math.max(width, height * 0.35) * 1.1;
      const bloom = c.createRadialGradient(cx, tipY + height * 0.45, 1, cx, tipY + height * 0.45, bloomR);
      bloom.addColorStop(0, `rgba(255, 140, 40,${0.14 * flicker})`);
      bloom.addColorStop(0.45, `rgba(220, 50, 10,${0.07 * flicker})`);
      bloom.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = bloom;
      c.beginPath();
      c.arc(cx, tipY + height * 0.45, bloomR, 0, Math.PI * 2);
      c.fill();

      c.beginPath();
      c.moveTo(cx - width * 0.6, baseY);
      c.bezierCurveTo(
        cx - width * 1.05 + sway,
        baseY - height * 0.35,
        cx - width * 0.15 + sway * 0.5,
        tipY + height * 0.3,
        cx + sway * 0.25,
        tipY
      );
      c.bezierCurveTo(
        cx + width * 0.15 - sway * 0.5,
        tipY + height * 0.3,
        cx + width * 1.05 - sway,
        baseY - height * 0.35,
        cx + width * 0.6,
        baseY
      );
      c.closePath();
      const back = c.createLinearGradient(cx, tipY, cx, baseY);
      back.addColorStop(0, `rgba(255, 90, 20,${0.15 * flicker})`);
      back.addColorStop(0.4, `rgba(180, 30, 8,${0.35 * flicker})`);
      back.addColorStop(1, "rgba(40, 5, 0,0)");
      c.globalAlpha = alpha * 0.85;
      c.fillStyle = back;
      c.fill();
    }

    // Foreground flame tongues (white-hot cores → orange → red wisps into black)
    const tongues = 8;
    for (let i = 0; i < tongues; i++) {
      const phase = i * 1.41;
      const flicker = 0.78 + Math.sin(t * (2.4 + i * 0.33) + phase) * 0.22;
      const lane = (i + 0.35) / tongues;
      const cx = x + lane * w + Math.sin(t * (1.5 + i * 0.18) + phase) * w * 0.055;
      const height = h * (0.38 + (i % 4) * 0.1 + Math.sin(t * 1.9 + phase) * 0.07) * flicker;
      const width = w * (0.1 + (i % 5) * 0.028) * (0.88 + Math.sin(t * 2.2 + phase) * 0.14);
      const tipY = baseY - height;
      const sway = Math.sin(t * 2.35 + phase) * width * 0.5;
      const sway2 = Math.cos(t * 3.2 + phase * 1.2) * width * 0.28;
      const hot = 0.55 + Math.sin(t * 3.4 + phase) * 0.25;

      const edgeGlow = c.createRadialGradient(cx, tipY + height * 0.4, 0, cx, tipY + height * 0.4, width * 1.8);
      edgeGlow.addColorStop(0, `rgba(255, 200, 80,${0.2 * hot * flicker})`);
      edgeGlow.addColorStop(0.5, `rgba(249, 115, 22,${0.08 * flicker})`);
      edgeGlow.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = edgeGlow;
      c.beginPath();
      c.arc(cx, tipY + height * 0.4, width * 1.8, 0, Math.PI * 2);
      c.fill();

      c.beginPath();
      c.moveTo(cx - width * 0.5, baseY);
      c.bezierCurveTo(
        cx - width * 0.95 + sway,
        baseY - height * 0.3,
        cx - width * 0.18 + sway2,
        tipY + height * 0.26,
        cx + sway * 0.3,
        tipY
      );
      c.bezierCurveTo(
        cx + width * 0.18 - sway2,
        tipY + height * 0.26,
        cx + width * 0.95 - sway,
        baseY - height * 0.3,
        cx + width * 0.5,
        baseY
      );
      c.closePath();
      const fg = c.createLinearGradient(cx, tipY, cx, baseY);
      fg.addColorStop(0, `rgba(255, 252, 230,${0.75 * hot})`);
      fg.addColorStop(0.18, `rgba(255, 220, 90,${0.85 * hot})`);
      fg.addColorStop(0.42, `rgba(251, 146, 40,${0.8})`);
      fg.addColorStop(0.68, `rgba(220, 50, 10,${0.55})`);
      fg.addColorStop(0.88, `rgba(120, 20, 5,${0.25})`);
      fg.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha * (0.55 + flicker * 0.4);
      c.fillStyle = fg;
      c.fill();

      c.beginPath();
      c.moveTo(cx - width * 0.18, baseY - height * 0.04);
      c.bezierCurveTo(
        cx - width * 0.28 + sway * 0.35,
        baseY - height * 0.38,
        cx + sway2 * 0.25,
        tipY + height * 0.32,
        cx,
        tipY + height * 0.1
      );
      c.bezierCurveTo(
        cx - sway2 * 0.25,
        tipY + height * 0.32,
        cx + width * 0.28 - sway * 0.35,
        baseY - height * 0.38,
        cx + width * 0.18,
        baseY - height * 0.04
      );
      c.closePath();
      const core = c.createLinearGradient(cx, tipY, cx, baseY);
      core.addColorStop(0, "rgba(255,255,255,0.95)");
      core.addColorStop(0.3, "rgba(254, 243, 160,0.8)");
      core.addColorStop(0.7, "rgba(251, 146, 60,0.25)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha * (0.3 + hot * 0.4);
      c.fillStyle = core;
      c.fill();

      const tipFlash = flicker * hot;
      if (tipFlash > peakGlow) {
        peakGlow = tipFlash;
        glowCx = cx;
        glowCy = tipY + height * 0.25;
      }
    }

    // Peak blaze wash into black (same blend approach as voidstorm lightning)
    if (peakGlow > 0.45) {
      const wash = c.createRadialGradient(
        glowCx,
        glowCy,
        1,
        glowCx,
        glowCy,
        Math.max(w, h) * (0.55 + peakGlow * 0.35)
      );
      wash.addColorStop(0, `rgba(255, 245, 200,${0.14 * peakGlow})`);
      wash.addColorStop(0.35, `rgba(251, 146, 60,${0.08 * peakGlow})`);
      wash.addColorStop(0.7, `rgba(127, 29, 29,${0.04 * peakGlow})`);
      wash.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = wash;
      c.fillRect(x, y, w, h);
    }

    // Rising sparks / embers into the black void
    for (let i = 0; i < 52; i++) {
      const seed = i * 19.7;
      const speed = 0.14 + (i % 9) * 0.04;
      const drift = ((t * speed + i * 0.063) % 1);
      const lane = (Math.sin(seed * 0.7 + t * 0.2) * 0.5 + 0.5) * 0.94 + 0.03;
      const sx = x + lane * w + Math.sin(t * 2.1 + seed) * w * 0.04;
      const sy = y + h * (0.95 - drift * 0.95);
      const life = Math.max(0, 1 - drift);
      const dens = Math.max(0.15, 1 - Math.abs(drift - 0.25) * 1.4);
      const twinkle = 0.45 + Math.sin(t * 9 + seed) * 0.55;
      const r = (0.25 + (i % 6) * 0.22 + twinkle * 0.3) * scale * (0.55 + life);
      if (life < 0.04) continue;

      const sg = c.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2);
      sg.addColorStop(0, `rgba(255, 230, 140,${0.55 * life * dens * twinkle})`);
      sg.addColorStop(0.4, `rgba(251, 146, 60,${0.25 * life * dens})`);
      sg.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = sg;
      c.beginPath();
      c.arc(sx, sy, r * 3.2, 0, Math.PI * 2);
      c.fill();

      c.globalAlpha = alpha * life * dens * (0.4 + twinkle * 0.55);
      c.fillStyle =
        i % 5 === 0 ? "#fffbeb" : i % 5 === 1 ? "#fde68a" : i % 5 === 2 ? "#fb923c" : i % 5 === 3 ? "#f97316" : "#ea580c";
      c.beginPath();
      c.arc(sx, sy, r, 0, Math.PI * 2);
      c.fill();
    }
  }

  if (item.style === "skywyrm") {
    const scale = Math.max(0.7, Math.min(3.6, Math.min(w, h) / 22));

    // Sun bloom
    const sunX = x + w * (0.78 + Math.sin(t * 0.15) * 0.03);
    const sunY = y + h * (0.18 + Math.cos(t * 0.12) * 0.02);
    const sun = c.createRadialGradient(sunX, sunY, 1, sunX, sunY, Math.max(w, h) * 0.55);
    sun.addColorStop(0, `rgba(255, 251, 235,${0.55 + Math.sin(t * 1.2) * 0.08})`);
    sun.addColorStop(0.25, "rgba(253, 224, 71, 0.28)");
    sun.addColorStop(0.55, "rgba(125, 211, 252, 0.1)");
    sun.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = sun;
    c.fillRect(x, y, w, h);
    c.fillStyle = "rgba(255, 255, 255, 0.85)";
    c.beginPath();
    c.arc(sunX, sunY, Math.max(1.2, 2.2 * scale), 0, Math.PI * 2);
    c.fill();

    // Drifting clouds
    for (let i = 0; i < 7; i++) {
      const drift = ((t * (0.04 + (i % 3) * 0.02) + i * 0.17) % 1.4) - 0.2;
      const cx = x + drift * w * 1.15;
      const cy = y + h * (0.22 + (i % 4) * 0.16 + Math.sin(t * 0.3 + i) * 0.02);
      const cw = w * (0.18 + (i % 3) * 0.07);
      const ch = h * (0.06 + (i % 2) * 0.03);
      const cg = c.createRadialGradient(cx, cy, 1, cx, cy, cw);
      cg.addColorStop(0, `rgba(255,255,255,${0.45 - (i % 3) * 0.08})`);
      cg.addColorStop(0.55, `rgba(226, 232, 240,${0.22})`);
      cg.addColorStop(1, "rgba(255,255,255,0)");
      c.globalAlpha = alpha * 0.9;
      c.fillStyle = cg;
      c.beginPath();
      c.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(cx - cw * 0.35, cy + ch * 0.15, cw * 0.55, ch * 0.7, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(cx + cw * 0.4, cy + ch * 0.1, cw * 0.5, ch * 0.65, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Distant red silhouette
    {
      const prog = ((t * 0.07) % 1.3) - 0.15;
      const dx = x + prog * w * 1.2;
      const dy = y + h * (0.26 + Math.sin(prog * Math.PI * 2) * 0.04);
      const flap = Math.sin(t * 5.5);
      drawSkywyrmDragon(
        c,
        dx,
        dy,
        scale * 0.55,
        flap,
        -0.08 + Math.sin(prog * 4) * 0.05,
        alpha * 0.32,
        0,
        0
      );
    }

    // Main large dragon + fire breath
    {
      const cycle = 8.5;
      const prog = (t % cycle) / cycle;
      const dx = x - w * 0.28 + prog * w * 1.5;
      const dy = y + h * (0.5 + Math.sin(prog * Math.PI * 2) * 0.14 + Math.sin(t * 1.4) * 0.02);
      const flap = Math.sin(t * 6.8);
      const pitch = -0.1 + Math.cos(prog * Math.PI * 2) * 0.16;
      const unit = scale * (1.55 + Math.min(1.6, Math.max(w, h) / 100) * 0.55);

      // Fire breath cadence: open mouth, blast, close — every ~2.8s
      const breathCycle = 2.8;
      const bLocal = t % breathCycle;
      let mouthOpen = 0;
      let fireAmt = 0;
      if (bLocal > 0.35 && bLocal < 1.55) {
        const phase = (bLocal - 0.35) / 1.2;
        mouthOpen = phase < 0.2 ? phase / 0.2 : phase > 0.75 ? (1 - phase) / 0.25 : 1;
        fireAmt = phase < 0.15 ? 0 : phase < 0.35 ? (phase - 0.15) / 0.2 : phase > 0.7 ? Math.max(0, (1 - phase) / 0.3) : 1;
        fireAmt *= 0.55 + Math.sin(t * 16) * 0.15;
      }

      // Warm aura when breathing
      if (fireAmt > 0.1) {
        const fireAura = c.createRadialGradient(dx + unit * 5, dy, 1, dx + unit * 5, dy, unit * 10);
        fireAura.addColorStop(0, `rgba(255, 200, 80,${0.16 * fireAmt})`);
        fireAura.addColorStop(0.45, `rgba(220, 38, 38,${0.08 * fireAmt})`);
        fireAura.addColorStop(1, "rgba(0,0,0,0)");
        c.globalAlpha = alpha;
        c.fillStyle = fireAura;
        c.fillRect(x, y, w, h);
      }

      // Wind streaks
      c.globalAlpha = alpha * 0.16;
      c.strokeStyle = "rgba(255,255,255,0.5)";
      c.lineWidth = Math.max(0.6, 1.2 * scale);
      for (let s = 0; s < 5; s++) {
        const sy = dy + (s - 2) * scale * 1.4;
        c.beginPath();
        c.moveTo(dx - unit * (4.2 + s), sy);
        c.lineTo(dx - unit * (1.4 + s * 0.35), sy + Math.sin(t * 4 + s) * scale);
        c.stroke();
      }

      const aura = c.createRadialGradient(dx, dy, 1, dx, dy, unit * 8);
      aura.addColorStop(0, "rgba(254, 202, 202, 0.14)");
      aura.addColorStop(0.4, "rgba(248, 113, 113, 0.07)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = aura;
      c.fillRect(x, y, w, h);

      drawSkywyrmDragon(c, dx, dy, unit, flap, pitch, alpha * 0.98, mouthOpen, fireAmt);
    }

    // Bottom mist
    const mist = c.createLinearGradient(x, y + h * 0.65, x, y + h);
    mist.addColorStop(0, "rgba(224, 242, 254, 0)");
    mist.addColorStop(0.55, "rgba(186, 230, 253, 0.12)");
    mist.addColorStop(1, "rgba(125, 211, 252, 0.22)");
    c.globalAlpha = alpha;
    c.fillStyle = mist;
    c.fillRect(x, y, w, h);
  }

  if (item.style === "obsidian") {
    // CoD gun camo: full-surface liquid specular flow over fractured black glass
    const scale = Math.max(0.55, Math.min(3.4, Math.min(w, h) / 24));
    const area = Math.max(1, w * h);
    const flowA = t * 0.85;
    const flowB = t * 0.55;
    const flowC = t * 1.15;

    // Continuous CoD-style flow field across the whole surface
    function obsidianFlow(u, v) {
      const warpU = u + Math.sin(v * 3.4 + flowB) * 0.12 + Math.sin(v * 7.1 - flowA) * 0.05;
      const warpV = v + Math.cos(u * 2.8 + flowA * 0.9) * 0.14 + Math.sin(u * 5.6 + flowC) * 0.06;
      const a = Math.sin(warpU * 4.6 + flowA + Math.sin(warpV * 3.2 + flowB) * 1.6);
      const b = Math.sin(warpV * 5.1 - flowB * 1.15 + warpU * 2.4);
      const d = Math.sin((warpU * 1.3 + warpV) * 6.2 + flowC * 0.7);
      const e = Math.sin(warpU * 9.5 - flowA * 1.2 + Math.cos(warpV * 8.2 + flowB) * 1.8);
      const raw = a * 0.42 + b * 0.32 + d * 0.18 + e * 0.12;
      return Math.max(0, Math.min(1, raw * 0.5 + 0.5));
    }

    // Soft full-bleed light pools that drift like liquid metal on a gun camo
    for (let p = 0; p < 6; p++) {
      const pu = (0.12 + p * 0.15 + Math.sin(flowA * 0.7 + p * 1.4) * 0.18 + Math.cos(flowB + p) * 0.1 + 1) % 1;
      const pv = (0.18 + p * 0.13 + Math.cos(flowB * 0.85 + p * 1.1) * 0.2 + Math.sin(flowC * 0.5 + p) * 0.1 + 1) % 1;
      const px = x + pu * w;
      const py = y + pv * h;
      const pr = Math.max(w, h) * (0.28 + (p % 3) * 0.08);
      const pulse = 0.55 + Math.sin(flowC + p * 1.7) * 0.2;
      const pool = c.createRadialGradient(px, py, 1, px, py, pr);
      pool.addColorStop(0, `rgba(235,240,248,${0.16 * pulse})`);
      pool.addColorStop(0.35, `rgba(160,170,185,${0.08 * pulse})`);
      pool.addColorStop(0.7, `rgba(40,42,48,${0.04 * pulse})`);
      pool.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = pool;
      c.fillRect(x, y, w, h);
    }

    // Dense cell grid: the whole background breathes with the flow (no line ribbons)
    const cell = Math.max(3.2, Math.min(9.5, Math.min(w, h) / 14));
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const u = (col + 0.5) / cols;
        const v = (row + 0.5) / rows;
        // Slight positional warp so the grid itself feels like fabric/liquid
        const wu = u + Math.sin(v * Math.PI * 2 + flowA) * 0.035;
        const wv = v + Math.cos(u * Math.PI * 2 - flowB) * 0.04;
        const lit = obsidianFlow(wu, wv);
        const hi = lit * lit;
        if (hi < 0.08) continue;

        const cx = x + wu * w;
        const cy = y + wv * h;
        const jitter = hashNoise(col * 13.1 + row * 7.7);
        const rw = cell * (0.55 + jitter * 0.55 + hi * 0.35);
        const rh = cell * (0.4 + hashNoise(col + row * 3.3) * 0.5 + hi * 0.3);
        const rot = (jitter - 0.5) * 0.9 + Math.sin(flowA + col * 0.2 + row * 0.15) * 0.08;

        c.save();
        c.translate(cx, cy);
        c.rotate(rot);
        const g = c.createLinearGradient(-rw, -rh, rw, rh);
        const s = Math.floor(12 + hi * 230);
        const m = Math.floor(4 + hi * 140);
        g.addColorStop(0, `rgba(${s},${Math.min(255, s + 6)},${Math.min(255, s + 14)},${0.2 + hi * 0.75})`);
        g.addColorStop(0.5, `rgba(${m},${m + 4},${m + 10},${0.25 + hi * 0.45})`);
        g.addColorStop(1, `rgba(0,0,0,${0.35 + (1 - hi) * 0.4})`);
        c.globalAlpha = alpha * (0.35 + hi * 0.65);
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // Fractured glass chips — fixed texture, lit only by the flowing field
    const facetN = Math.min(160, Math.max(40, Math.floor(area / 95)));
    for (let i = 0; i < facetN; i++) {
      const seed = i * 17.913 + 2.7;
      const u0 = hashNoise(seed);
      const v0 = hashNoise(seed + 3.1);
      const lit = obsidianFlow(u0, v0);
      const hi = Math.max(0, lit * 1.05 - 0.12);
      if (hi < 0.05) continue;

      const fx = x + u0 * w;
      const fy = y + v0 * h;
      const sz =
        (0.85 + hashNoise(seed + 5.4) * 2.4 + (i % 6 === 0 ? 1.3 : 0)) *
        scale *
        (0.8 + Math.min(1.3, Math.max(w, h) / 150));
      const ang = hashNoise(seed + 8.2) * Math.PI * 2;
      const sides = i % 5 === 0 ? 3 : 4;

      c.save();
      c.translate(fx, fy);
      c.rotate(ang);
      c.beginPath();
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const r = sz * (0.5 + hashNoise(seed + s * 1.7) * 0.75);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * (0.5 + hashNoise(seed + 14) * 0.55);
        if (s === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.globalAlpha = alpha * (0.25 + hi * 0.75);
      c.fillStyle =
        hi > 0.7
          ? `rgba(245,248,255,${0.35 + hi * 0.55})`
          : hi > 0.4
            ? `rgba(170,180,195,${0.25 + hi * 0.4})`
            : `rgba(30,32,38,${0.35 + hi * 0.25})`;
      c.fill();
      if (hi > 0.55) {
        c.globalAlpha = alpha * (hi - 0.45) * 1.4;
        c.strokeStyle = "rgba(255,255,255,0.85)";
        c.lineWidth = Math.max(0.35, 0.55 * scale * hi);
        c.stroke();
      }
      c.restore();
    }

    // Micro speculars only inside bright flow regions
    const sparkN = Math.min(70, Math.max(18, Math.floor(area / 200)));
    for (let i = 0; i < sparkN; i++) {
      const seed = i * 23.7 + 9.1;
      const u = hashNoise(seed);
      const v = hashNoise(seed + 2.2);
      const lit = obsidianFlow(u, v);
      if (lit < 0.62) continue;
      const sx = x + u * w;
      const sy = y + v * h;
      const tw = 0.6 + Math.sin(t * 7.5 + i * 2.1) * 0.4;
      const r = (0.3 + hashNoise(seed + 4) * 1.2) * scale * lit;
      c.globalAlpha = alpha * lit * lit * tw * 0.9;
      c.fillStyle = i % 3 === 0 ? "#ffffff" : "#d8dee8";
      c.beginPath();
      c.moveTo(sx, sy - r * 1.5);
      c.lineTo(sx + r * 0.5, sy);
      c.lineTo(sx, sy + r * 1.5);
      c.lineTo(sx - r * 0.5, sy);
      c.closePath();
      c.fill();
    }
  }

  if (item.style === "chaosrift") {
    const scale = Math.max(0.55, Math.min(3.6, Math.min(w, h) / 22));
    const area = Math.max(1, w * h);
    const flow = t * 1.35;

    // Prismatic void wash
    const wash = c.createRadialGradient(
      x + w * (0.45 + Math.sin(flow * 0.4) * 0.12),
      y + h * (0.5 + Math.cos(flow * 0.33) * 0.1),
      1,
      x + w * 0.5,
      y + h * 0.5,
      Math.max(w, h) * 0.9
    );
    wash.addColorStop(0, `rgba(236, 72, 153,${0.14 + Math.sin(flow) * 0.04})`);
    wash.addColorStop(0.35, `rgba(34, 211, 238,${0.1})`);
    wash.addColorStop(0.65, `rgba(168, 85, 247,${0.08})`);
    wash.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = wash;
    c.fillRect(x, y, w, h);

    // Jagged luminous rift cracks
    for (let r = 0; r < 3; r++) {
      const seed = r * 19.7 + 3.1;
      const y0 = y + (0.18 + hashNoise(seed) * 0.64 + Math.sin(flow * 0.5 + r) * 0.04) * h;
      c.beginPath();
      const steps = Math.max(10, Math.floor(w / 8));
      for (let sIdx = 0; sIdx <= steps; sIdx++) {
        const u = sIdx / steps;
        const px = x + u * w;
        const py =
          y0 +
          Math.sin(u * Math.PI * (2.5 + r) + flow * (1.1 + r * 0.2)) * h * 0.08 +
          (hashNoise(seed + sIdx * 0.7) - 0.5) * h * 0.05;
        if (sIdx === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      const pulse = 0.55 + Math.sin(flow * 2 + r) * 0.25;
      c.globalAlpha = alpha * (0.35 + pulse * 0.45);
      c.strokeStyle = r === 0 ? "rgba(255,255,255,0.95)" : r === 1 ? "rgba(34,211,238,0.9)" : "rgba(244,114,182,0.85)";
      c.lineWidth = Math.max(1.1, (2.2 - r * 0.4) * scale * 0.55);
      c.lineJoin = "round";
      c.stroke();
      c.globalAlpha = alpha * 0.18 * pulse;
      c.lineWidth = Math.max(3, 6 * scale * 0.45);
      c.stroke();
    }

    // Chromatic glitch shards
    const shardN = Math.min(140, Math.max(36, Math.floor(area / 70)));
    for (let i = 0; i < shardN; i++) {
      const seed = i * 13.3 + 1.7;
      const u = (hashNoise(seed) + Math.sin(flow * 0.2 + i) * 0.03 + 1) % 1;
      const v = (hashNoise(seed + 2.4) + Math.cos(flow * 0.17 + i * 0.4) * 0.03 + 1) % 1;
      const sx = x + u * w;
      const sy = y + v * h;
      const sz = (0.7 + hashNoise(seed + 5) * 2.2) * scale;
      const ang = hashNoise(seed + 8) * Math.PI * 2 + flow * 0.15;
      const huePick = i % 3;
      const col =
        huePick === 0
          ? `rgba(255,${80 + (i % 40)},${160 + (i % 50)},0.75)`
          : huePick === 1
            ? `rgba(${40 + (i % 50)},220,255,0.7)`
            : `rgba(190,${90 + (i % 60)},255,0.72)`;
      c.save();
      c.translate(sx, sy);
      c.rotate(ang);
      c.globalAlpha = alpha * (0.25 + hashNoise(seed + 11) * 0.55);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, -sz);
      c.lineTo(sz * 0.55, sz * 0.35);
      c.lineTo(-sz * 0.45, sz * 0.55);
      c.closePath();
      c.fill();
      c.restore();
    }

    // RGB split sweep bands
    for (let b = 0; b < 2; b++) {
      const phase = flow * (0.7 + b * 0.25) + b * 2.1;
      const bandX = x + ((Math.sin(phase) * 0.5 + 0.5) * 0.9 + 0.05) * w;
      const band = c.createLinearGradient(bandX - w * 0.08, y, bandX + w * 0.08, y);
      band.addColorStop(0, "rgba(255,0,80,0)");
      band.addColorStop(0.35, `rgba(255,40,120,${0.08 + b * 0.03})`);
      band.addColorStop(0.5, `rgba(0,255,255,${0.1})`);
      band.addColorStop(0.65, `rgba(180,80,255,${0.08})`);
      band.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = band;
      c.fillRect(x, y, w, h);
    }

    // Orbiting neon motes + ember sparks
    const moteN = Math.min(55, Math.max(16, Math.floor(area / 180)));
    for (let i = 0; i < moteN; i++) {
      const orbit = flow * (1.2 + (i % 5) * 0.15) + i * 0.9;
      const radius = 0.15 + (i % 7) * 0.05;
      const mx = x + w * (0.5 + Math.cos(orbit) * radius);
      const my = y + h * (0.5 + Math.sin(orbit * 1.15) * radius * 0.85);
      const mr = (0.6 + (i % 4) * 0.35) * scale;
      const glow = c.createRadialGradient(mx, my, 0, mx, my, mr * 3);
      const hot = i % 2 === 0;
      glow.addColorStop(0, hot ? "rgba(255,240,200,0.95)" : "rgba(180,255,255,0.9)");
      glow.addColorStop(0.4, hot ? "rgba(251,113,133,0.35)" : "rgba(34,211,238,0.3)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha * (0.45 + Math.sin(orbit * 2) * 0.25);
      c.fillStyle = glow;
      c.beginPath();
      c.arc(mx, my, mr * 3, 0, Math.PI * 2);
      c.fill();
    }

    // Occasional rift flare
    const flare = Math.max(0, Math.sin(flow * 1.8) * 1.4 - 0.7);
    if (flare > 0) {
      const fx = x + w * (0.35 + Math.sin(flow * 0.6) * 0.2);
      const fy = y + h * 0.5;
      const fr = Math.max(w, h) * (0.2 + flare * 0.15);
      const fg = c.createRadialGradient(fx, fy, 1, fx, fy, fr);
      fg.addColorStop(0, `rgba(255,255,255,${0.35 * flare})`);
      fg.addColorStop(0.3, `rgba(244,114,182,${0.2 * flare})`);
      fg.addColorStop(0.65, `rgba(34,211,238,${0.1 * flare})`);
      fg.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha;
      c.fillStyle = fg;
      c.fillRect(x, y, w, h);
    }
  }

  if (item.style === "endurance") {
    const scale = Math.max(0.55, Math.min(3.4, Math.min(w, h) / 22));
    const area = Math.max(1, w * h);
    const flow = t * 0.72;

    // Warm dusk wash — gold into teal
    const wash = c.createRadialGradient(
      x + w * (0.42 + Math.sin(flow * 0.35) * 0.1),
      y + h * (0.48 + Math.cos(flow * 0.28) * 0.08),
      1,
      x + w * 0.5,
      y + h * 0.5,
      Math.max(w, h) * 0.95
    );
    wash.addColorStop(0, `rgba(251, 191, 36,${0.12 + Math.sin(flow) * 0.03})`);
    wash.addColorStop(0.4, `rgba(45, 212, 191,${0.1})`);
    wash.addColorStop(0.7, `rgba(132, 204, 22,${0.07})`);
    wash.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = wash;
    c.fillRect(x, y, w, h);

    // Smooth flowing liquid bands (less glitchy than Chaos)
    for (let b = 0; b < 4; b++) {
      const phase = flow * (0.55 + b * 0.12) + b * 1.4;
      c.beginPath();
      const steps = Math.max(14, Math.floor(w / 5));
      for (let sIdx = 0; sIdx <= steps; sIdx++) {
        const u = sIdx / steps;
        const px = x + u * w;
        const py =
          y +
          h * (0.22 + b * 0.18) +
          Math.sin(u * Math.PI * 2.2 + phase) * h * 0.07 +
          Math.sin(u * Math.PI * 1.1 + phase * 0.6) * h * 0.035;
        if (sIdx === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      const pulse = 0.55 + Math.sin(phase * 1.2) * 0.2;
      c.globalAlpha = alpha * (0.28 + pulse * 0.35);
      c.strokeStyle =
        b % 2 === 0 ? "rgba(251,191,36,0.85)" : b === 1 ? "rgba(45,212,191,0.8)" : "rgba(190,242,100,0.75)";
      c.lineWidth = Math.max(1.2, (2.4 - b * 0.25) * scale * 0.5);
      c.lineJoin = "round";
      c.lineCap = "round";
      c.stroke();
      c.globalAlpha = alpha * 0.12 * pulse;
      c.lineWidth = Math.max(3, 5.5 * scale * 0.4);
      c.stroke();
    }

    // Soft ember + teal motes drifting with the flow
    const moteN = Math.min(70, Math.max(18, Math.floor(area / 140)));
    for (let i = 0; i < moteN; i++) {
      const seed = i * 11.7 + 2.3;
      const drift = (hashNoise(seed) + flow * (0.08 + (i % 5) * 0.015)) % 1;
      const lane = (hashNoise(seed + 3) + Math.sin(flow * 0.4 + i) * 0.04 + 1) % 1;
      const mx = x + lane * w;
      const my = y + ((drift + Math.sin(flow + i) * 0.02 + 1) % 1) * h;
      const mr = (0.45 + hashNoise(seed + 6) * 1.4) * scale;
      const hot = i % 3 !== 1;
      const glow = c.createRadialGradient(mx, my, 0, mx, my, mr * 2.8);
      glow.addColorStop(0, hot ? "rgba(255,236,180,0.9)" : "rgba(167,243,208,0.85)");
      glow.addColorStop(0.45, hot ? "rgba(245,158,11,0.28)" : "rgba(45,212,191,0.28)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha * (0.35 + hashNoise(seed + 9) * 0.4);
      c.fillStyle = glow;
      c.beginPath();
      c.arc(mx, my, mr * 2.8, 0, Math.PI * 2);
      c.fill();
    }

    // Gentle highlight sheen sweeping the surface
    const sheenPos = (Math.sin(flow * 0.65) * 0.5 + 0.5) * 0.7 + 0.1;
    const sheen = c.createLinearGradient(x, y, x + w, y + h);
    sheen.addColorStop(Math.max(0, sheenPos - 0.12), "rgba(255,255,255,0)");
    sheen.addColorStop(sheenPos, `rgba(254,243,199,${0.14 + Math.sin(flow * 1.4) * 0.04})`);
    sheen.addColorStop(Math.min(1, sheenPos + 0.12), "rgba(255,255,255,0)");
    c.globalAlpha = alpha;
    c.fillStyle = sheen;
    c.fillRect(x, y, w, h);
  }

  if (item.style === "overlord") {
    const scale = Math.max(0.55, Math.min(3.5, Math.min(w, h) / 22));
    const area = Math.max(1, w * h);
    const flow = t * 1.15;

    const wash = c.createRadialGradient(
      x + w * (0.48 + Math.sin(flow * 0.4) * 0.1),
      y + h * (0.5 + Math.cos(flow * 0.32) * 0.08),
      1,
      x + w * 0.5,
      y + h * 0.5,
      Math.max(w, h) * 0.95
    );
    wash.addColorStop(0, `rgba(239, 68, 68,${0.16 + Math.sin(flow) * 0.04})`);
    wash.addColorStop(0.4, `rgba(74, 222, 128,${0.12})`);
    wash.addColorStop(0.75, `rgba(153, 27, 27,${0.1})`);
    wash.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = alpha;
    c.fillStyle = wash;
    c.fillRect(x, y, w, h);

    // Crown crest arcs
    for (let i = 0; i < 3; i++) {
      const cy = y + h * (0.22 + i * 0.12);
      c.beginPath();
      c.moveTo(x + w * 0.15, cy);
      c.quadraticCurveTo(x + w * 0.5, cy - h * (0.1 + i * 0.02), x + w * 0.85, cy);
      c.globalAlpha = alpha * (0.35 + Math.sin(flow * 2 + i) * 0.15);
      c.strokeStyle = i % 2 ? "rgba(134,239,172,0.9)" : "rgba(252,165,165,0.9)";
      c.lineWidth = Math.max(1.2, 2.2 * scale * 0.45);
      c.stroke();
    }

    // Multi-eye glow motes
    const moteN = Math.min(90, Math.max(24, Math.floor(area / 110)));
    for (let i = 0; i < moteN; i++) {
      const seed = i * 9.7 + 4.1;
      const u = (hashNoise(seed) + Math.sin(flow * 0.25 + i) * 0.03 + 1) % 1;
      const v = (hashNoise(seed + 2) + Math.cos(flow * 0.2 + i * 0.3) * 0.03 + 1) % 1;
      const mx = x + u * w;
      const my = y + v * h;
      const mr = (0.5 + hashNoise(seed + 5) * 1.6) * scale;
      const hot = i % 3 !== 1;
      const glow = c.createRadialGradient(mx, my, 0, mx, my, mr * 2.6);
      glow.addColorStop(0, hot ? "rgba(254,202,202,0.95)" : "rgba(187,247,208,0.9)");
      glow.addColorStop(0.4, hot ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.3)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = alpha * (0.3 + hashNoise(seed + 8) * 0.45);
      c.fillStyle = glow;
      c.beginPath();
      c.arc(mx, my, mr * 2.6, 0, Math.PI * 2);
      c.fill();
    }
  }

  if (item.style === "beerpong") {
    const flow = t * 1.15;
    const foamH = Math.max(4, h * (0.16 + Math.sin(flow * 0.35) * 0.02));
    const liquidTop = y + foamH * 0.72;
    const scale = Math.max(0.55, Math.min(2.2, Math.min(w, h) / 36));

    // Soft liquid depth wash (clearer near top, denser bottom)
    const depth = c.createLinearGradient(x, liquidTop, x, y + h);
    depth.addColorStop(0, "rgba(255, 236, 179, 0.18)");
    depth.addColorStop(0.35, "rgba(212, 140, 30, 0.08)");
    depth.addColorStop(0.75, "rgba(90, 40, 8, 0.22)");
    depth.addColorStop(1, "rgba(30, 12, 4, 0.35)");
    c.globalAlpha = alpha;
    c.fillStyle = depth;
    c.fillRect(x, liquidTop, w, Math.max(1, y + h - liquidTop));

    // Glass-like vertical highlight
    const sheen = c.createLinearGradient(x, y, x + w * 0.35, y);
    sheen.addColorStop(0, "rgba(255,255,255,0.22)");
    sheen.addColorStop(0.45, "rgba(255,255,255,0.05)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    c.globalAlpha = alpha * 0.55;
    c.fillStyle = sheen;
    c.fillRect(x, y, w * 0.28, h);

    // Rising carbonation bubbles in the liquid
    const bubbleN = Math.min(70, Math.max(18, Math.floor((w * h) / 160)));
    for (let i = 0; i < bubbleN; i++) {
      const seed = i * 12.37 + 3.1;
      const lane = (hashNoise(seed) + Math.sin(flow * 0.08 + i) * 0.02 + 1) % 1;
      const rise = (hashNoise(seed + 1) + flow * (0.12 + hashNoise(seed + 2) * 0.22)) % 1;
      // Bubbles travel from bottom toward foam, fade near head
      const bx = x + 2 + lane * Math.max(1, w - 4);
      const by = y + h - rise * (h - foamH * 0.5);
      if (by < liquidTop + 1) continue;
      const br = (0.55 + hashNoise(seed + 3) * 1.8) * scale;
      const fade = Math.max(0, Math.min(1, (by - liquidTop) / Math.max(8, h * 0.55)));
      c.globalAlpha = alpha * (0.2 + fade * 0.55) * (0.55 + hashNoise(seed + 4) * 0.45);

      // Bubble body
      const bg = c.createRadialGradient(bx - br * 0.25, by - br * 0.3, 0, bx, by, br * 1.4);
      bg.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      bg.addColorStop(0.35, "rgba(255, 248, 220, 0.45)");
      bg.addColorStop(0.7, "rgba(255, 220, 140, 0.12)");
      bg.addColorStop(1, "rgba(255, 200, 100, 0)");
      c.fillStyle = bg;
      c.beginPath();
      c.arc(bx, by, br * 1.35, 0, Math.PI * 2);
      c.fill();

      // Thin rim
      c.globalAlpha = alpha * (0.25 + fade * 0.35);
      c.strokeStyle = "rgba(255, 250, 235, 0.7)";
      c.lineWidth = Math.max(0.6, 0.9 * scale);
      c.beginPath();
      c.arc(bx, by, br, 0, Math.PI * 2);
      c.stroke();
    }

    // Thick pint foam head with irregular surface
    c.save();
    c.beginPath();
    c.moveTo(x, y + foamH);
    c.lineTo(x, y + 1);
    const foamWaves = Math.max(4, Math.floor(w / 7));
    for (let i = 0; i <= foamWaves; i++) {
      const u = i / foamWaves;
      const fx = x + u * w;
      const bob =
        Math.sin(flow * 1.6 + u * Math.PI * 3.2) * foamH * 0.12 +
        Math.sin(flow * 2.3 + u * 9.1) * foamH * 0.06;
      c.lineTo(fx, y + Math.max(0.5, 1.5 + bob));
    }
    c.lineTo(x + w, y + foamH);
    // Soft underside of foam (beer/foam interface)
    for (let i = foamWaves; i >= 0; i--) {
      const u = i / foamWaves;
      const fx = x + u * w;
      const drip =
        Math.sin(flow * 0.9 + u * Math.PI * 2.4) * foamH * 0.1 +
        Math.cos(flow * 1.4 + u * 7) * foamH * 0.05;
      c.lineTo(fx, liquidTop + foamH * 0.15 + drip);
    }
    c.closePath();

    const foamGrad = c.createLinearGradient(x, y, x, y + foamH * 1.35);
    foamGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    foamGrad.addColorStop(0.35, "rgba(255, 250, 240, 0.95)");
    foamGrad.addColorStop(0.7, "rgba(245, 230, 200, 0.88)");
    foamGrad.addColorStop(1, "rgba(230, 200, 140, 0.55)");
    c.globalAlpha = alpha * 0.95;
    c.fillStyle = foamGrad;
    c.fill();

    // Foam bubble cluster texture
    const foamBubbles = Math.min(55, Math.max(12, Math.floor(w * foamH / 28)));
    for (let i = 0; i < foamBubbles; i++) {
      const seed = i * 7.3 + 19;
      const u = hashNoise(seed);
      const v = hashNoise(seed + 1);
      const fx = x + 2 + u * Math.max(1, w - 4);
      const fy = y + 1 + v * foamH * 0.95;
      const fr = (0.7 + hashNoise(seed + 2) * 2.4) * scale;
      const pop = 0.55 + Math.sin(flow * 3 + i * 1.7) * 0.25;
      c.globalAlpha = alpha * (0.25 + hashNoise(seed + 3) * 0.5) * pop;
      c.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.95)" : "rgba(255, 245, 225, 0.75)";
      c.beginPath();
      c.arc(fx, fy, fr, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = alpha * 0.35;
      c.strokeStyle = "rgba(210, 180, 120, 0.45)";
      c.lineWidth = 0.7;
      c.stroke();
    }

    // Occasional foam overflow drip down the sides
    for (let i = 0; i < 3; i++) {
      const side = i % 2 === 0 ? x + 1 + i * 0.5 : x + w - 2 - i * 0.4;
      const dripY = liquidTop + ((flow * 0.25 + i * 0.37) % 1) * h * 0.35;
      const dripH = 3 + (i % 3) * 2;
      c.globalAlpha = alpha * 0.28;
      c.fillStyle = "rgba(255, 248, 230, 0.7)";
      c.beginPath();
      c.ellipse(side, dripY, 1.2 * scale, dripH * 0.35 * scale, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  if (item.style === "heartbloom") {
    const scale = Math.max(0.7, Math.min(2.4, Math.min(w, h) / 28));
    for (let i = 0; i < 22; i++) {
      const drift = ((t * (0.14 + (i % 6) * 0.045) + i * 0.11) % 1);
      const lane = (Math.sin(t * 0.4 + i * 1.7) * 0.5 + 0.5);
      const hx = x + lane * w;
      const hy = y + h * (1.2 - drift * 1.45);
      const sizeTier = i % 5;
      const base =
        sizeTier === 0 ? 0.7 :
        sizeTier === 1 ? 1.2 :
        sizeTier === 2 ? 2.0 :
        sizeTier === 3 ? 3.1 :
        4.4;
      const size = (base + Math.sin(t * 2.4 + i * 0.9) * 0.35) * scale;
      const fade = Math.max(0, 1 - Math.abs(drift - 0.5) * 1.55);
      c.globalAlpha = alpha * (0.22 + fade * 0.7);
      c.fillStyle = i % 4 === 0 ? "#fff1f8" : i % 4 === 1 ? "#fda4d5" : i % 4 === 2 ? "#fb7185" : "#f9a8d4";
      drawHeart(c, hx, hy, size);
    }
  }

  if (item.style === "blushgarden") {
    const scale = Math.max(0.55, Math.min(2.8, Math.min(w, h) / 26));
    // Soft drifting petals first (background layer)
    for (let i = 0; i < 8; i++) {
      const px =
        x +
        ((Math.sin(t * 0.11 + i * 1.9) * 0.5 + 0.5) * 0.9 + 0.05) * w;
      const py =
        y +
        ((Math.cos(t * 0.09 + i * 2.3) * 0.5 + 0.5) * 0.9 + 0.05) * h;
      const rot = t * (0.12 + (i % 3) * 0.04) + i;
      const size = (1.1 + (i % 4) * 0.35) * scale;
      drawLoosePetal(
        c,
        px,
        py,
        size,
        rot,
        i % 2 === 0 ? "#fbcfe8" : "#ffffff",
        alpha * 0.55
      );
    }
    // Tiny white blossoms
    for (let i = 0; i < 10; i++) {
      const bx =
        x +
        ((0.08 + hashNoise(i * 7.1) * 0.84) + Math.sin(t * 0.13 + i * 1.4) * 0.06) * w;
      const by =
        y +
        ((0.1 + hashNoise(i * 11.3) * 0.8) + Math.cos(t * 0.11 + i * 1.7) * 0.06) * h;
      const size = (0.9 + (i % 3) * 0.25) * scale;
      const rot = t * 0.08 + i * 0.7;
      drawTinyBlossom(c, bx, by, size, rot, "#ffffff", alpha * 0.85);
    }
    // Pink baby's-breath clusters
    for (let i = 0; i < 7; i++) {
      const cx =
        x +
        ((0.12 + hashNoise(i * 19.7) * 0.76) + Math.sin(t * 0.1 + i * 2.1) * 0.05) * w;
      const cy =
        y +
        ((0.14 + hashNoise(i * 23.4) * 0.72) + Math.cos(t * 0.12 + i * 1.5) * 0.05) * h;
      const size = (1.4 + (i % 3) * 0.4) * scale;
      drawPinkCluster(c, cx, cy, size, t * 0.06 + i, alpha * 0.9);
    }
    // Large cosmos flowers drifting slowly
    const blooms = [
      { seed: 1.1, pink: true, size: 5.2 },
      { seed: 2.4, pink: false, size: 4.6 },
      { seed: 3.7, pink: true, size: 3.8 },
      { seed: 5.0, pink: false, size: 5.0 },
      { seed: 6.3, pink: true, size: 3.4 },
      { seed: 7.8, pink: false, size: 4.2 },
    ];
    for (let i = 0; i < blooms.length; i++) {
      const b = blooms[i];
      const fx =
        x +
        ((0.1 + hashNoise(b.seed * 4.2) * 0.8) + Math.sin(t * 0.07 + b.seed) * 0.07) * w;
      const fy =
        y +
        ((0.12 + hashNoise(b.seed * 8.6) * 0.76) + Math.cos(t * 0.06 + b.seed * 1.3) * 0.07) * h;
      const breath = 1 + Math.sin(t * 0.55 + b.seed) * 0.03;
      const size = b.size * scale * breath;
      const rot = t * (0.05 + (i % 3) * 0.015) + b.seed;
      const petal = b.pink ? "#f9a8d4" : "#ffffff";
      drawCosmosFlower(c, fx, fy, size, rot, petal, alpha * 0.95);
    }
  }

  c.restore();
  c.globalAlpha = 1;
}

function drawCosmeticFill(c, item, x, y, w, h, alpha) {
  applyFillStyle(c, item, x, y, w, h, alpha);
  c.fillRect(x, y, w, h);
  drawEpicOverlay(c, item, x, y, w, h, alpha);
  c.globalAlpha = 1;
}

const shopAnimSwatches = [];
let shopAnimRunning = false;

function agentLog(hypothesisId, location, message, data = {}, runId = "post-fix") {
  const payload = {
    sessionId: "38eb5e",
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

function paintSwatchCanvas(entry) {
  const { canvas, ctx, item } = entry;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCosmeticFill(ctx, item, 0, 0, canvas.width, canvas.height, 1);
}

function drawSwatch(item, el) {
  el.innerHTML = "";
  const c = document.createElement("canvas");
  c.width = 120;
  c.height = 48;
  c.setAttribute("aria-hidden", "true");
  const cctx = c.getContext("2d");
  el.appendChild(c);
  const entry = { el, item, canvas: c, ctx: cctx };
  let drawErr = null;
  try {
    paintSwatchCanvas(entry);
  } catch (err) {
    drawErr = String(err && err.message ? err.message : err);
    cctx.fillStyle = item.color || "#7c3aed";
    cctx.fillRect(0, 0, c.width, c.height);
  }
  if (item.epic || item.legendary || item.chaos || item.survival || item.boss || item.secret) {
    el.dataset.epicStyle = item.style;
    shopAnimSwatches.push(entry);
    if (shopAnimSwatches.length <= 3) {
      let sample = [0, 0, 0, 0];
      try {
        sample = Array.from(cctx.getImageData(60, 24, 1, 1).data);
      } catch {
        /* ignore */
      }
      agentLog("C", "game.js:drawSwatch", "epic swatch canvas painted", {
        id: item.id,
        style: item.style,
        drawErr,
        mode: "canvas-element",
        px: sample,
        hasChildCanvas: el.querySelector("canvas") != null,
      });
    }
  }
}

function tickShopSwatches() {
  shopAnimRunning = false;
  if (!ui.customizeOverlay || ui.customizeOverlay.classList.contains("hidden")) {
    agentLog("B", "game.js:tickShopSwatches", "tick aborted overlay hidden", {
      hasOverlay: !!ui.customizeOverlay,
      hidden: !!(ui.customizeOverlay && ui.customizeOverlay.classList.contains("hidden")),
      swatchCount: shopAnimSwatches.length,
    });
    shopAnimSwatches.length = 0;
    return;
  }
  if (!shopAnimSwatches.length) return;
  shopAnimRunning = true;
  if (!tickShopSwatches._logged) {
    tickShopSwatches._logged = true;
    agentLog("D", "game.js:tickShopSwatches", "animation loop running", {
      swatchCount: shopAnimSwatches.length,
      ids: shopAnimSwatches.map((e) => e.item.id),
      mode: "canvas-element",
    });
  }
  let tickErr = null;
  for (const entry of shopAnimSwatches) {
    if (!entry.el.isConnected) continue;
    try {
      paintSwatchCanvas(entry);
    } catch (err) {
      tickErr = String(err && err.message ? err.message : err);
    }
  }
  if (tickErr && !tickShopSwatches._errLogged) {
    tickShopSwatches._errLogged = true;
    agentLog("C", "game.js:tickShopSwatches", "tick draw error", { tickErr });
  }
  requestAnimationFrame(tickShopSwatches);
}

function rebuildShopTabs() {
  const tabsEl = ui.shopTabs || document.getElementById("shopTabs");
  if (!tabsEl) return;
  const catalog = save.shopCatalog === "cup" ? "cup" : "pong";
  const defs =
    catalog === "cup"
      ? [
          { tab: "cup", label: "Cups" },
          { tab: "ball", label: "Ball" },
          { tab: "tabletop", label: "Tabletop" },
        ]
      : [
          { tab: "paddle", label: "Paddles" },
          { tab: "table", label: "Tabletop" },
        ];
  const valid = new Set(defs.map((d) => d.tab));
  if (!valid.has(save.shopTab)) save.shopTab = defs[0].tab;
  tabsEl.innerHTML = "";
  for (const def of defs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `shop-tab${save.shopTab === def.tab ? " active" : ""}`;
    btn.dataset.tab = def.tab;
    btn.textContent = def.label;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", save.shopTab === def.tab ? "true" : "false");
    btn.addEventListener("click", () => {
      playMenuClick();
      setShopTab(def.tab);
    });
    tabsEl.appendChild(btn);
  }
  if (ui.customizeOverlay) {
    ui.customizeOverlay.classList.toggle("shop-catalog-cup", catalog === "cup");
    ui.customizeOverlay.classList.toggle("shop-catalog-pong", catalog === "pong");
  }
}

function applyShopChrome() {
  const catalog = save.shopCatalog === "cup" ? "cup" : "pong";
  if (ui.shopTitle) {
    ui.shopTitle.textContent = catalog === "cup" ? "CUP LOUNGE SHOP" : "PING PONG EMPORIUM";
  }
  if (ui.shopHint) {
    ui.shopHint.textContent =
      catalog === "cup"
        ? "(Cup Pong wins · cosmetics coming soon)"
        : "(+2 per win · synced online)";
  }
}

function renderShopUnderConstruction(sectionLabel) {
  if (!ui.shopGrid) return;
  ui.shopGrid.innerHTML = "";
  ui.shopGrid.classList.add("shop-grid-wip");
  const panel = document.createElement("div");
  panel.className = "shop-under-construction";
  const badge = document.createElement("div");
  badge.className = "shop-wip-badge";
  badge.textContent = "Under construction";
  const title = document.createElement("h3");
  title.className = "shop-wip-title";
  title.textContent = `${sectionLabel} colours`;
  const copy = document.createElement("p");
  copy.className = "shop-wip-copy";
  copy.textContent = "This Cup Lounge aisle is still being stocked. More cosmetics arriving soon.";
  panel.append(badge, title, copy);
  ui.shopGrid.appendChild(panel);
  if (ui.shopMsg) {
    ui.shopMsg.textContent = `${sectionLabel} — under construction. Check back soon.`;
  }
}

function renderShop() {
  if (!ui.shopGrid) return;
  shopAnimSwatches.length = 0;
  tickShopSwatches._logged = false;
  tickShopSwatches._errLogged = false;
  ui.shopGrid.classList.remove("shop-grid-wip");

  const catalog = save.shopCatalog === "cup" ? "cup" : "pong";
  if (catalog === "cup") {
    const labels = { cup: "Cups", ball: "Ball", tabletop: "Tabletop" };
    const tab = labels[save.shopTab] ? save.shopTab : "cup";
    save.shopTab = tab;
    renderShopUnderConstruction(labels[tab] || "Cups");
    return;
  }

  const kind = save.shopTab === "table" ? "table" : "paddle";
  save.shopTab = kind;
  ui.shopGrid.innerHTML = "";
  let epicCount = 0;
  let cantAffordEpic = 0;
  for (const item of SHOP[kind]) {
    const owned = save.owned[kind].includes(item.id);
    if (item.hidden && !owned) continue;
    const equipped = save.equipped[kind] === item.id;
    const unlocked = itemUnlocked(item);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-item";
    if (item.epic) btn.classList.add("epic");
    if (item.chaos) btn.classList.add("chaos");
    else if (item.survival) btn.classList.add("survival");
    else if (item.boss) btn.classList.add("boss");
    else if (item.cuppong) btn.classList.add("cuppong");
    else if (item.legendary) btn.classList.add("legendary");
    if (item.secret) btn.classList.add("secret");
    if (item.limitedEdition) btn.classList.add("limited");
    if (equipped) btn.classList.add("equipped");
    const free = isAdmin() && save.abilities.freeShop;
    const cantAfford = unlocked && !owned && !free && item.price > 0 && save.points < item.price;
    if (!unlocked) btn.classList.add("level-locked");
    else if (cantAfford) btn.classList.add("cant-afford");
    if (
      item.epic ||
      item.legendary ||
      item.chaos ||
      item.survival ||
      item.boss ||
      item.cuppong ||
      item.secret ||
      item.limitedEdition
    ) {
      epicCount += 1;
      if (cantAfford || !unlocked) cantAffordEpic += 1;
    }
    const swatch = document.createElement("div");
    swatch.className = "shop-swatch";
    if (item.epic) swatch.classList.add("epic-swatch");
    if (item.chaos) swatch.classList.add("chaos-swatch");
    else if (item.survival) swatch.classList.add("survival-swatch");
    else if (item.boss) swatch.classList.add("boss-swatch");
    else if (item.cuppong) swatch.classList.add("cuppong-swatch");
    else if (item.legendary) swatch.classList.add("legendary-swatch");
    if (item.secret) swatch.classList.add("secret-swatch");
    if (item.limitedEdition) swatch.classList.add("limited-swatch");
    drawSwatch(item, swatch);
    const name = document.createElement("div");
    name.className = "shop-name";
    name.textContent = item.name;
    name.title = item.name;
    btn.title = item.name;
    const price = document.createElement("div");
    price.className = "shop-price";
    if (!unlocked) {
      if (item.requireChaosLevel) price.textContent = `CHAOS L${item.requireChaosLevel}`;
      else if (item.requireSurvivalLevel) price.textContent = `SURVIVAL L${item.requireSurvivalLevel}`;
      else if (item.requireBossLevel) price.textContent = `BOSS L${item.requireBossLevel}`;
      else if (item.requireCupPongLevel) price.textContent = `CUP L${item.requireCupPongLevel}`;
      else price.textContent = `LVL ${item.requireLevel}`;
    } else if (item.limitedEdition) price.textContent = owned ? "Limited edition" : "Hidden";
    else if (item.secret) price.textContent = owned ? "Code unlock" : "Hidden";
    else if (item.price === 0)
      price.textContent =
        owned || item.legendary || item.chaos || item.survival || item.boss || item.cuppong ? "Unlocked" : "Free";
    else price.textContent = `${item.price} pts`;

    let rarityTag = null;
    if (item.limitedEdition) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-limited-tag";
      rarityTag.textContent = "LIMITED";
    } else if (item.secret) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-secret-tag";
      rarityTag.textContent = "SECRET";
    } else if (item.cuppong) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-cuppong-tag";
      rarityTag.textContent = "CUPPONG";
    } else if (item.chaos) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-chaos-tag";
      rarityTag.textContent = "CHAOS";
    } else if (item.survival) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-survival-tag";
      rarityTag.textContent = "SURVIVAL";
    } else if (item.boss) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-boss-tag";
      rarityTag.textContent = "BOSS";
    } else if (item.legendary) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-legendary-tag";
      rarityTag.textContent = "LEGENDARY";
    } else if (item.epic) {
      rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity-tag shop-epic-tag";
      rarityTag.textContent = "EPIC";
    }

    if (rarityTag) btn.append(rarityTag, swatch, name, price);
    else btn.append(swatch, name, price);

    if (!unlocked) {
      const lock = document.createElement("span");
      lock.className = "shop-lock-badge";
      lock.textContent = item.requireChaosLevel
        ? `LOCKED · CHAOS L${item.requireChaosLevel}`
        : item.requireSurvivalLevel
          ? `LOCKED · SURVIVAL L${item.requireSurvivalLevel}`
          : item.requireBossLevel
            ? `LOCKED · BOSS L${item.requireBossLevel}`
            : item.requireCupPongLevel
              ? `LOCKED · CUP L${item.requireCupPongLevel}`
              : `LOCKED · L${item.requireLevel}`;
      btn.appendChild(lock);
    } else if (equipped) {
      const b = document.createElement("span");
      b.className = "shop-badge";
      b.textContent = "ON";
      btn.appendChild(b);
    }
    btn.addEventListener("click", () => {
      playMenuClick();
      if (!unlocked) {
        if (ui.shopMsg) {
          ui.shopMsg.textContent = item.requireChaosLevel
            ? `${item.name} unlocks at Chaos level ${item.requireChaosLevel}. Clear Chaos Mode levels to earn it.`
            : item.requireSurvivalLevel
              ? `${item.name} unlocks at Survival round ${item.requireSurvivalLevel}. Clear Survival Mode rounds to earn it.`
              : item.requireBossLevel
                ? `${item.name} unlocks at Boss ${item.requireBossLevel}. Clear Boss Battles to earn it.`
                : item.requireCupPongLevel
                  ? `${item.name} unlocks at Cup Pong level ${item.requireCupPongLevel}. Clear Cup Pong bots to earn it.`
                  : `${item.name} unlocks at level ${item.requireLevel}. Earn XP to reach L${item.requireLevel}.`;
        }
        return;
      }
      if (owned) {
        save.equipped[kind] = item.id;
        persistSave();
        if (ui.shopMsg) ui.shopMsg.textContent = `Equipped ${item.name}.`;
        renderShop();
        return;
      }
      if (item.price > 0 && save.points < item.price && !free) {
        if (ui.shopMsg) ui.shopMsg.textContent = `Need ${item.price - save.points} more pts. Win games for +2.`;
        return;
      }
      if (item.price > 0 && !free) save.points -= item.price;
      if (!save.owned[kind].includes(item.id)) save.owned[kind].push(item.id);
      save.equipped[kind] = item.id;
      persistSave();
      updatePointsUI();
      if (ui.shopMsg) {
        ui.shopMsg.textContent =
          item.price === 0 ? `Unlocked & equipped ${item.name}!` : `Bought ${item.name}!`;
      }
      renderShop();
    });
    ui.shopGrid.appendChild(btn);
  }
  const firstEpic = ui.shopGrid.querySelector(".shop-item.epic");
  const firstSwatch = firstEpic && firstEpic.querySelector(".shop-swatch");
  const firstCanvas = firstSwatch && firstSwatch.querySelector("canvas");
  const computed = firstEpic ? getComputedStyle(firstEpic) : null;
  let sample = null;
  if (firstCanvas) {
    try {
      sample = Array.from(firstCanvas.getContext("2d").getImageData(60, 24, 1, 1).data);
    } catch {
      sample = null;
    }
  }
  agentLog("A", "game.js:renderShop", "shop rendered", {
    kind,
    points: save.points,
    epicCount,
    cantAffordEpic,
    animSwatches: shopAnimSwatches.length,
    shopAnimRunning,
    overlayHidden: !!(ui.customizeOverlay && ui.customizeOverlay.classList.contains("hidden")),
    firstEpicOpacity: computed ? computed.opacity : null,
    hasLiveCanvas: !!firstCanvas,
    samplePx: sample,
    ua: navigator.userAgent.slice(0, 120),
  });
  if (shopAnimSwatches.length && !shopAnimRunning) requestAnimationFrame(tickShopSwatches);
}

function setShopTab(tab) {
  save.shopTab = String(tab || "");
  document.querySelectorAll("#shopTabs .shop-tab, .shop-tabs .shop-tab").forEach((el) => {
    const on = el.dataset.tab === save.shopTab;
    el.classList.toggle("active", on);
    el.setAttribute("aria-selected", on ? "true" : "false");
  });
  renderShop();
}

function openShopHub() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.profileOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.updatesOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.adminOverlay);
  showOverlay(ui.shopHubOverlay);
  setStagePlaying(false);
  startMenuBg();
  ui.hint.textContent = "Cosmetics Boutique — Ping Pong or Cup Lounge.";
}

function closeShopHub() {
  hideOverlay(ui.shopHubOverlay);
  showOverlay(ui.profileOverlay || ui.menuOverlay);
  setStagePlaying(false);
  if (ui.profileOverlay && !ui.profileOverlay.classList.contains("hidden")) refreshProfileUI();
}

function openCustomize(opts = {}) {
  const catalog = opts.catalog === "cup" ? "cup" : "pong";
  save.shopCatalog = catalog;
  save.shopTab = catalog === "cup" ? "cup" : "paddle";
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.profileOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.updatesOverlay);
  showOverlay(ui.customizeOverlay);
  setStagePlaying(false);
  updatePointsUI();
  applyShopChrome();
  rebuildShopTabs();
  setShopTab(save.shopTab);
  if (ui.shopMsg && catalog === "pong") {
    ui.shopMsg.textContent =
      "Buy or equip a colour. Legendaries: Rose Gold L20 · Void Storm L40 · Hearthflame L60 · Skywyrm L80 · Obsidian L100. Chaos Rift (Chaos L25). Endurance (Survival R25). Overlord (Boss B10).";
  }
}

function closeCustomize() {
  shopAnimSwatches.length = 0;
  hideOverlay(ui.customizeOverlay);
  showOverlay(ui.shopHubOverlay || ui.profileOverlay || ui.menuOverlay);
  setStagePlaying(false);
}

function loadAuthState() {
  try {
    authState.token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
    authState.username = localStorage.getItem(AUTH_USER_KEY) || "";
    // Never trust a cached owner flag — server /api/auth/me must confirm.
    authState.isOwner = false;
    authState.isAdmin = false;
  } catch {
    authState.token = "";
    authState.username = "";
    authState.isOwner = false;
    authState.isAdmin = false;
  }
}

function persistAuthState() {
  try {
    if (authState.token) localStorage.setItem(AUTH_TOKEN_KEY, authState.token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
    if (authState.username) localStorage.setItem(AUTH_USER_KEY, authState.username);
    else localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    /* ignore */
  }
}

function setAuthMsg(msg) {
  if (ui.profileAuthMsg) ui.profileAuthMsg.textContent = msg || "";
}

function avatarImageUrl(def, customUrl = "") {
  if (customUrl) return customUrl;
  if (!def) return "";
  if (def.id === "custom" && save.customAvatarUrl) return save.customAvatarUrl;
  if (def.image) return def.image;
  return "";
}

function avatarCssBackground(def) {
  if (!def) return "#222";
  const img = avatarImageUrl(def);
  if (img) return `center / cover no-repeat url("${img}")`;
  const colors = {
    default: "#14532d",
    smile: "#1d4ed8",
    fox: "#c2410c",
    cool: "#6d28d9",
    rocket: "#0f766e",
    pizza: "#b45309",
    bolt: "#ca8a04",
    dragon: "#7c3aed",
    ghost: "#475569",
    robot: "#334155",
    alien: "#15803d",
    panda: "#1f2937",
    unicorn: "#db2777",
    ninja: "#111827",
    wizard: "#5b21b6",
    octopus: "#9d174d",
    eagle: "#92400e",
    gem: "#0369a1",
    cactus: "#166534",
    galaxy: "#312e81",
    koala: "#57534e",
    trophy: "#a16207",
    owl: "#44403c",
    medal: "#ca8a04",
    star: "#b45309",
    wolf: "#3f3f46",
    comet: "#1e3a8a",
    moon: "#1e293b",
    sun: "#ea580c",
    rainbow: "#7c3aed",
    volcano: "#9a3412",
    ocean: "#0e7490",
    forest: "#14532d",
    castle: "#4c1d95",
    sparkle: "#a21caf",
    planet: "#1e40af",
    flame: "#9a3412",
    crown: "#a16207",
    rift: "#9d174d",
    endurance: "#0f766e",
    overlord: "#7f1d1d",
  };
  return colors[def.id] || "#222";
}

function applyAvatarToElement(el, def, { customUrl = "", emoji = "", color = "" } = {}) {
  if (!el) return;
  el.textContent = "";
  el.style.background = "";
  el.style.backgroundImage = "";
  el.style.backgroundSize = "";
  el.style.backgroundPosition = "";
  if (color) {
    el.style.background = color;
    el.textContent = emoji || "?";
    return;
  }
  const img = avatarImageUrl(def, customUrl);
  if (img) {
    el.style.backgroundImage = `url("${img}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    return;
  }
  const d = def || AVATAR_DEFS[0];
  el.style.background = avatarCssBackground(d);
  el.textContent = emoji || d.emoji || "?";
}

function paintAvatarPreview() {
  const el = ui.profileAvatarPreview;
  if (!el) return;
  const def = AVATAR_DEFS.find((a) => a.id === save.avatar) || AVATAR_DEFS[0];
  applyAvatarToElement(el, def, {
    customUrl: def.id === "custom" ? save.customAvatarUrl : "",
  });
}

function renderProfileAvatarGrid() {
  if (!ui.profileAvatarGrid) return;
  refreshAvatarUnlocks();
  ui.profileAvatarGrid.innerHTML = "";
  for (const def of AVATAR_DEFS) {
    const unlocked = avatarUnlocked(def);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `profile-avatar-btn${unlocked ? "" : " locked"}${save.avatar === def.id ? " selected" : ""}`;
    btn.title = unlocked
      ? def.label
      : def.unlock?.type === "xp"
        ? `Unlock at XP Level ${def.unlock.level}`
        : def.unlock?.type === "classic"
          ? `Clear Classic L${def.unlock.level}`
          : def.unlock?.type === "chaos"
            ? `Clear Chaos L${def.unlock.level}`
            : def.unlock?.type === "survival"
              ? `Clear Survival R${def.unlock.level}`
              : def.unlock?.type === "boss"
                ? `Clear Boss B${def.unlock.level}`
                : def.unlock?.type === "upload"
                  ? "Upload an image (account recommended)"
                  : "Locked";
    applyAvatarToElement(btn, def, {
      customUrl: def.id === "custom" ? save.customAvatarUrl : "",
    });
    if (!unlocked) {
      const lock = document.createElement("span");
      lock.className = "lock-dot";
      lock.textContent = "🔒";
      btn.appendChild(lock);
    }
    btn.addEventListener("click", () => {
      if (!unlocked) {
        setAuthMsg(btn.title);
        return;
      }
      if (def.id === "custom" && !save.customAvatarUrl) {
        ui.profileAvatarFile?.click();
        return;
      }
      save.avatar = def.id;
      persistSave();
      paintAvatarPreview();
      renderProfileAvatarGrid();
      setAuthMsg(`Avatar set to ${def.label}.`);
    });
    ui.profileAvatarGrid.appendChild(btn);
  }
}

function refreshProfilePanel() {
  refreshAvatarUnlocks();
  const xp = getXpProgress();
  if (ui.profileNameInput) ui.profileNameInput.value = getPlayerName();
  if (ui.profileXpLabel) ui.profileXpLabel.textContent = `XP Level ${xp.level}`;
  if (ui.profileXpFill) ui.profileXpFill.style.width = `${Math.min(100, (xp.into / Math.max(1, xp.need)) * 100)}%`;
  if (ui.profileXpSub) ui.profileXpSub.textContent = `${xp.into} / ${xp.need} XP · total ${xp.total}`;
  if (ui.profileAccountStatus) {
    ui.profileAccountStatus.textContent = authState.token
      ? `Signed in as ${authState.username} · progress syncs to your account.`
      : "Playing as guest — create an account to sync across devices.";
  }
  if (ui.profileAuthGuest) ui.profileAuthGuest.classList.toggle("hidden", !!authState.token);
  if (ui.profileAuthSignedIn) ui.profileAuthSignedIn.classList.toggle("hidden", !authState.token);
  if (ui.profileSignedInText) ui.profileSignedInText.textContent = `Signed in as ${authState.username}`;
  paintAvatarPreview();
  renderProfileAvatarGrid();
}

function refreshProfileUI() {
  refreshProfilePanel();
}

function openProfile() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.updatesOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.contactOverlay);
  hideOverlay(ui.inboxOverlay);
  hideOverlay(ui.forgotPasswordOverlay);
  hideOverlay(ui.profileViewOverlay);
  showOverlay(ui.profileOverlay);
  setStagePlaying(false);
  startMenuBg();
  refreshProfileUI();
  setAuthMsg("");
  ui.hint.textContent = "Profile — name, XP, avatars, account.";
  updateNameUI();
}

function closeProfile() {
  hideOverlay(ui.profileOverlay);
  showOverlay(ui.menuOverlay);
  startMenuBg();
  updateNameUI();
}

function formatAccomplishmentsFromStats(stats = {}) {
  const list = [];
  const classic = Math.max(0, Math.floor(stats.maxBotCleared || 0));
  const chaos = Math.max(0, Math.floor(stats.maxChaosCleared || 0));
  const survival = Math.max(0, Math.floor(stats.maxSurvivalCleared || 0));
  const boss = Math.max(0, Math.floor(stats.maxBossCleared || 0));
  const xp = getXpProgress(stats.xp || 0);
  if (classic > 0) list.push(`Cleared Classic L${classic}`);
  if (chaos > 0) list.push(`Cleared Chaos L${chaos}`);
  if (survival > 0) list.push(`Cleared Survival R${survival}`);
  if (boss > 0) list.push(`Defeated Boss B${boss}${boss >= 10 ? " — Overlord" : ""}`);
  list.push(`Reached XP Level ${xp.level}`);
  if (classic >= 50) list.push("Classic Crown unlocked");
  if (chaos >= 25) list.push("Chaos Rift cleared");
  if (survival >= 25) list.push("Endurance survivor");
  if (boss >= 10) list.push("Boss Overlord conquered");
  return list;
}

function buildLeaderboardProfileView(entry) {
  if (!entry) return null;
  const xpTotal = Math.max(0, Math.floor(entry.xp || 0));
  const classic = Math.max(0, Math.floor(entry.maxBotCleared ?? entry.rank ?? 0));
  const chaos = Math.max(0, Math.floor(entry.maxChaosCleared || 0));
  const survival = Math.max(0, Math.floor(entry.maxSurvivalCleared || 0));
  const boss = Math.max(0, Math.floor(entry.maxBossCleared || 0));
  const wins = Math.max(0, Math.floor(entry.wins || 0));
  const losses = Math.max(0, Math.floor(entry.losses || 0));
  const matches = Math.max(0, Math.floor(entry.matches || 0));
  const goals = Math.max(0, Math.floor(entry.goalsFor || 0));
  const place = Math.max(0, Math.floor(entry.place || 0));
  const accomplishments = formatAccomplishmentsFromStats({
    xp: xpTotal,
    maxBotCleared: classic,
    maxChaosCleared: chaos,
    maxSurvivalCleared: survival,
    maxBossCleared: boss,
  });
  accomplishments.unshift(
    place ? `Scoreboard rank #${place}` : "On the server scoreboard",
    `${wins} online win${wins === 1 ? "" : "s"} · ${losses} loss${losses === 1 ? "" : "es"}`,
    `${matches} online match${matches === 1 ? "" : "es"} played`
  );
  const streak = Math.max(0, Math.floor(entry.winStreak || 0));
  const bestStreak = Math.max(0, Math.floor(entry.bestWinStreak || 0));
  if (streak > 0) accomplishments.push(`Current win streak: ${streak}`);
  if (bestStreak > 0) accomplishments.push(`Best win streak: ${bestStreak}`);
  if (goals > 0) accomplishments.push(`${goals} goals scored online`);
  return {
    name: entry.name || "Player",
    kind: "Online player",
    bio: `Public scoreboard profile · Level ${getXpProgress(xpTotal).level} · Classic bots L${classic}.`,
    rankLabel: `Level ${getXpProgress(xpTotal).level}`,
    xpTotal,
    avatarId: entry.avatar || "default",
    customAvatarUrl: entry.customAvatarUrl || "",
    avatarColor: "",
    avatarEmoji: "",
    accomplishments,
  };
}

function buildSelfProfileView() {
  const xp = getXpProgress();
  return {
    name: getPlayerName() || "You",
    kind: "Player",
    bio: authState.token
      ? `Signed-in player · account ${authState.username}.`
      : "Local player profile.",
    rankLabel: `Level ${xp.level}`,
    xpTotal: xp.total,
    avatarId: save.avatar || "default",
    customAvatarUrl: save.customAvatarUrl || "",
    avatarColor: "",
    avatarEmoji: "",
    accomplishments: formatAccomplishmentsFromStats({
      xp: save.xp || 0,
      maxBotCleared: save.maxBotCleared || 0,
      maxChaosCleared: save.maxChaosCleared || 0,
      maxSurvivalCleared: save.maxSurvivalCleared || 0,
      maxBossCleared: save.maxBossCleared || 0,
      maxCupPongCleared: save.maxCupPongCleared || 0,
    }),
  };
}

function buildOnlineOpponentProfileView() {
  const p = net.opponentProfile || {};
  const name = net.opponentName || "Opponent";
  const xpTotal = Math.max(0, Math.floor(p.xp || 0));
  const xpLv = Math.max(
    1,
    Math.floor(p.xpLevel || getXpProgress(xpTotal).level || net.opponentLevel || 1)
  );
  const classic = Math.max(0, Math.floor(p.maxBotCleared || 0));
  return {
    name,
    kind: "Online opponent",
    bio: "Matched online. Stats shared from their cosmetics profile.",
    rankLabel: `Level ${xpLv}`,
    xpTotal,
    avatarId: p.avatar || "default",
    customAvatarUrl: p.customAvatarUrl || "",
    avatarColor: "",
    avatarEmoji: "",
    accomplishments: formatAccomplishmentsFromStats({
      xp: xpTotal,
      maxBotCleared: classic,
      maxChaosCleared: p.maxChaosCleared || 0,
      maxSurvivalCleared: p.maxSurvivalCleared || 0,
      maxBossCleared: p.maxBossCleared || 0,
      maxCupPongCleared: p.maxCupPongCleared || 0,
    }),
  };
}

function bossAbilityAccomplishments(def) {
  if (!def) return [];
  const list = [`Boss Battle #${def.id}`, `Threat rating ~ Classic L${def.classicEquiv || 50}`];
  if (def.decoy) list.push(def.doubleDecoy ? "Double Decoy master" : "Decoy specialist");
  if (def.teleport) list.push("Blink teleport");
  if (def.grow) list.push("Paddle growth surge");
  if (def.laser) list.push(def.laserTrack ? "Tracking laser" : "Iris laser");
  if (def.decoyCurve) list.push("Curving decoy balls");
  if (def.shake) list.push("Court-shaking presence");
  if (def.fog) list.push("Fog of war");
  if (def.slowField) list.push("Chrono slow-field");
  if (def.id >= 10) list.push("Final Overlord of the arena");
  return list;
}

function buildBossProfileView() {
  const def = bossDef() || BOSS_DEFS[s.botLevel] || BOSS_DEFS[1];
  const xpEstimate = Math.floor(800 + (def.id || 1) * 420 + (def.classicEquiv || 50) * 18);
  return {
    name: def.name || `Boss ${s.botLevel}`,
    kind: `Boss · B${def.id || s.botLevel}`,
    bio: `${def.name} rules Boss Battles. Tap the scoreboard name anytime to scout their profile.`,
    rankLabel: `Boss rank B${def.id || s.botLevel}`,
    xpTotal: xpEstimate,
    avatarId: "",
    customAvatarUrl: "",
    avatarColor: def.eyeColor || "#14532d",
    avatarEmoji: def.id >= 10 ? "👁" : "◆",
    accomplishments: bossAbilityAccomplishments(def),
  };
}

function buildBotProfileView() {
  if (isBossMode()) return buildBossProfileView();
  const level = Math.max(1, Math.floor(s.botLevel || 1));
  const mode = s.botMode || "classic";
  let name = `BOT L${level}`;
  let kind = "Classic bot";
  let bio = "Training bot for Classic Levels.";
  let rankLabel = `Classic bot L${level}`;
  let avatarId = "robot";
  let avatarEmoji = "🤖";
  let avatarColor = "";
  const feats = [];
  if (mode === "chaos") {
    name = `CHAOS L${level}`;
    kind = "Chaos bot";
    bio = "High-speed multi-ball chaos opponent.";
    rankLabel = `Chaos bot L${level}`;
    avatarId = level >= 25 ? "rift" : "flame";
    avatarEmoji = level >= 25 ? "🌀" : "🔥";
    feats.push(`Chaos intensity L${level}`);
    if (level >= 10) feats.push("Fog of war enabled");
    if (level >= 25) feats.push("Rift-tier chaos");
  } else if (mode === "survival") {
    name = `SURVIVAL R${level}`;
    kind = "Survival bot";
    bio = "Two-minute endurance opponent. Highest score wins.";
    rankLabel = `Survival bot R${level}`;
    avatarId = "endurance";
    avatarEmoji = "♾️";
    feats.push(`Survival round ${level}`);
    if (level >= 25) feats.push("Endurance apex");
  } else {
    feats.push(`Classic AI L${level}`);
    if (level >= 50) feats.push("Crown-tier difficulty");
    if (level >= 100) feats.push("Max classic pressure");
  }
  const xpEstimate = Math.floor(120 + level * level * 3.2 + level * 40);
  feats.push(`Estimated XP Level ${getXpProgress(xpEstimate).level}`);
  feats.push("Parry-ready paddle AI");
  return {
    name,
    kind,
    bio,
    rankLabel,
    xpTotal: xpEstimate,
    avatarId,
    customAvatarUrl: "",
    avatarColor,
    avatarEmoji,
    accomplishments: feats,
  };
}

function paintProfileViewAvatar(profile) {
  const el = ui.profileViewAvatar;
  if (!el || !profile) return;
  const def = AVATAR_DEFS.find((a) => a.id === profile.avatarId) || AVATAR_DEFS[0];
  applyAvatarToElement(el, def, {
    customUrl: profile.customAvatarUrl || "",
    emoji: profile.avatarEmoji || "",
    color: profile.avatarColor || "",
  });
}

function paintProfileView(profile) {
  if (!profile) return;
  const xp = getXpProgress(profile.xpTotal || 0);
  if (ui.profileViewTitle) ui.profileViewTitle.textContent = "PROFILE";
  if (ui.profileViewName) ui.profileViewName.textContent = profile.name || "Unknown";
  if (ui.profileViewKind) ui.profileViewKind.textContent = profile.kind || "Player";
  if (ui.profileViewXpLabel) ui.profileViewXpLabel.textContent = `XP Level ${xp.level}`;
  if (ui.profileViewXpFill) {
    ui.profileViewXpFill.style.width = `${Math.min(100, (xp.into / Math.max(1, xp.need)) * 100)}%`;
  }
  if (ui.profileViewXpSub) ui.profileViewXpSub.textContent = `${xp.into} / ${xp.need} XP · total ${xp.total}`;
  if (ui.profileViewRank) ui.profileViewRank.textContent = profile.rankLabel || "";
  if (ui.profileViewBio) ui.profileViewBio.textContent = profile.bio || "";
  paintProfileViewAvatar(profile);
  if (ui.profileViewAccomplishments) {
    ui.profileViewAccomplishments.innerHTML = "";
    const items = profile.accomplishments?.length ? profile.accomplishments : ["No accomplishments listed."];
    for (const text of items) {
      const li = document.createElement("li");
      li.textContent = text;
      ui.profileViewAccomplishments.appendChild(li);
    }
  }
}

let profileViewResumeLocal = false;

function openProfileView(profile) {
  if (!profile || !ui.profileViewOverlay) return;
  paintProfileView(profile);
  showOverlay(ui.profileViewOverlay);
  if (s.mode === "local" && s.running && !s.gameOver) {
    profileViewResumeLocal = true;
    s.running = false;
    if (ui.status) ui.status.textContent = "Paused — profile";
  }
}

function closeProfileView() {
  hideOverlay(ui.profileViewOverlay);
  if (profileViewResumeLocal) {
    profileViewResumeLocal = false;
    if (s.mode === "local" && !s.gameOver) {
      s.running = true;
      if (ui.status) ui.status.textContent = "Playing";
    }
  }
}

function resolveScoreboardProfile(side) {
  if (s.mode === "online") {
    const meLeft = net.player === 1;
    const isMe = (side === "p1" && meLeft) || (side === "p2" && !meLeft);
    return isMe ? buildSelfProfileView() : buildOnlineOpponentProfileView();
  }
  if (s.mode === "local") {
    if (side === "p1") return buildSelfProfileView();
    return buildBotProfileView();
  }
  return null;
}

function onScoreboardProfileClick(side) {
  if (s.mode !== "local" && s.mode !== "online") return;
  if (ui.profileOverlay && !ui.profileOverlay.classList.contains("hidden")) return;
  const profile = resolveScoreboardProfile(side);
  if (!profile) return;
  openProfileView(profile);
}

async function authRegister() {
  if (!location.host) {
    setAuthMsg("Start the game server to create an account.");
    return;
  }
  const username = ui.authUsername?.value || "";
  const password = ui.authPassword?.value || "";
  setAuthMsg("Creating account…");
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, playerId: getPlayerId() }),
    });
    const data = await res.json();
    if (!data.ok) {
      setAuthMsg(data.error || "Could not create account.");
      return;
    }
    authState.token = data.token;
    authState.username = data.username;
    authState.isOwner = !!data.isOwner;
    authState.isAdmin = !!(data.isAdmin || data.isOwner);
    persistAuthState();
    persistSave({ force: true });
    setAuthMsg("Account created — you're signed in.");
    refreshProfileUI();
    updateAdminVisibility();
    startTicketNoticePolling();
  } catch {
    setAuthMsg("Network error — try again.");
  }
}

async function authLogin() {
  if (!location.host) {
    setAuthMsg("Start the game server to log in.");
    return;
  }
  const username = ui.authUsername?.value || "";
  const password = ui.authPassword?.value || "";
  setAuthMsg("Logging in…");
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.ok) {
      if (data.mustSetPassword) {
        const claimUser = data.username || username;
        setAuthMsg("Choose a password for this account.");
        openClaimPasswordPopup(claimUser);
        return;
      }
      setAuthMsg(data.error || "Login failed.");
      return;
    }
    authState.token = data.token;
    authState.username = data.username;
    authState.isOwner = !!data.isOwner;
    authState.isAdmin = !!(data.isAdmin || data.isOwner);
    persistAuthState();
    if (data.playerId) {
      try {
        localStorage.setItem(PLAYER_ID_KEY, data.playerId);
      } catch {
        /* ignore */
      }
    }
    if (data.profile) applyProfile(data.profile, { replace: true });
    persistSave({ force: true });
    updatePointsUI();
    updateNameUI();
    setAuthMsg(
      data.isOwner ? "Welcome back, Owner." : data.isAdmin ? "Welcome back, Admin." : "Welcome back!"
    );
    refreshProfileUI();
    updateAdminVisibility();
    startTicketNoticePolling();
    ensurePresence();
  } catch {
    setAuthMsg("Network error — try again.");
  }
}

async function authLogout() {
  try {
    if (location.host && authState.token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: authState.token }),
      });
    }
  } catch {
    /* ignore */
  }
  authState.token = "";
  authState.username = "";
  authState.isOwner = false;
  authState.isAdmin = false;
  persistAuthState();
  setAuthMsg("Logged out. Guest progress stays on this device.");
  refreshProfileUI();
  updateAdminVisibility();
}

async function restoreAuthSession() {
  loadAuthState();
  updateAdminVisibility();
  if (!authState.token || !location.host) return;
  try {
    const res = await fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: authState.token }),
    });
    const data = await res.json();
    if (!data.ok) {
      authState.token = "";
      authState.username = "";
      authState.isOwner = false;
      authState.isAdmin = false;
      persistAuthState();
      updateAdminVisibility();
      return;
    }
    authState.username = data.username || authState.username;
    authState.isOwner = !!data.isOwner;
    authState.isAdmin = !!(data.isAdmin || data.isOwner);
    persistAuthState();
    updateAdminVisibility();
    startTicketNoticePolling();
    if (data.playerId) {
      try {
        localStorage.setItem(PLAYER_ID_KEY, data.playerId);
      } catch {
        /* ignore */
      }
    }
    if (data.profile) applyProfile(data.profile);
    ensurePresence();
  } catch {
    /* offline — keep signed-in UI but no admin until server confirms */
    authState.isOwner = false;
    authState.isAdmin = false;
    updateAdminVisibility();
  }
}

function uploadProfileAvatar(file) {
  if (!file) return;
  if (!location.host) {
    setAuthMsg("Start the game server to upload avatars.");
    return;
  }
  if (file.size > 350000) {
    setAuthMsg("Image too large — keep under ~350KB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    setAuthMsg("Uploading…");
    try {
      const res = await fetch("/api/avatar/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: authState.token,
          playerId: getPlayerId(),
          imageData: reader.result,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAuthMsg(data.error || "Upload failed.");
        return;
      }
      if (data.profile) applyProfile(data.profile, { replace: false });
      save.customAvatarUrl = data.avatarUrl || save.customAvatarUrl;
      save.avatar = "custom";
      if (!save.ownedAvatars.includes("custom")) save.ownedAvatars.push("custom");
      persistSave({ force: true });
      setAuthMsg("Custom avatar uploaded!");
      refreshProfileUI();
    } catch {
      setAuthMsg("Upload failed — try again.");
    }
  };
  reader.readAsDataURL(file);
}

function openAdmin() {
  if (!isAdmin()) {
    updateAdminVisibility();
    return;
  }
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.adminToolsOverlay);
  hideOverlay(ui.adminPlayersOverlay);
  hideOverlay(ui.adminPlayerDetailOverlay);
  hideOverlay(ui.adminReportsOverlay);
  hideOverlay(ui.adminReportDetailOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.lobbyOverlay);
  showOverlay(ui.adminOverlay);
  setStagePlaying(false);
  if (ui.adminWelcome) {
    ui.adminWelcome.textContent = isOwner() ? "Welcome, Owner" : "Welcome, Admin";
  }
}

function openAdminTools() {
  if (!isAdmin()) return;
  hideOverlay(ui.adminOverlay);
  showOverlay(ui.adminToolsOverlay);
  setStagePlaying(false);
  refreshAdminPanel();
  // Only owner can wipe the persistent scoreboard
  if (ui.btnAdminResetScoreboard) {
    ui.btnAdminResetScoreboard.classList.toggle("hidden", !isOwner());
  }
}

function closeAdminTools() {
  hideOverlay(ui.adminToolsOverlay);
  showOverlay(ui.adminOverlay);
  setStagePlaying(false);
}

function closeAdmin() {
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.adminToolsOverlay);
  hideOverlay(ui.adminPlayersOverlay);
  hideOverlay(ui.adminPlayerDetailOverlay);
  hideOverlay(ui.adminReportsOverlay);
  hideOverlay(ui.adminReportDetailOverlay);
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
}

function refreshAdminPanel() {
  if (!isAdmin()) return;
  if (ui.adminWelcome) ui.adminWelcome.textContent = "Welcome, Owner";
  if (ui.adminPoints) ui.adminPoints.textContent = String(save.points);
  const xp = getXpProgress();
  if (ui.adminXp) ui.adminXp.textContent = String(xp.total);
  if (ui.adminXpLevel) ui.adminXpLevel.textContent = String(xp.level);
  if (ui.adminXpInput && document.activeElement !== ui.adminXpInput) {
    ui.adminXpInput.value = String(xp.total);
  }
  if (ui.adminLevel) ui.adminLevel.textContent = String(getPlayerLevel());
  if (ui.adminLevelInput && document.activeElement !== ui.adminLevelInput) {
    ui.adminLevelInput.value = String(getPlayerLevel());
  }
  if (ui.abMegaPaddle) ui.abMegaPaddle.checked = save.abilities.megaPaddle;
  if (ui.abFreeShop) ui.abFreeShop.checked = save.abilities.freeShop;
  if (ui.abSlowBot) ui.abSlowBot.checked = save.abilities.slowBot;
  if (ui.abPauseBot) ui.abPauseBot.checked = save.abilities.pauseBot;
  if (ui.abBonusPts) ui.abBonusPts.checked = save.abilities.bonusPts;
}

function adminAddPoints(n) {
  if (!isAdmin()) return;
  save.points += Math.max(0, n);
  persistSave();
  updatePointsUI();
  refreshAdminPanel();
  if (ui.adminMsg) ui.adminMsg.textContent = `Added ${n} points.`;
}

function adminSetPoints(n) {
  if (!isAdmin()) return;
  save.points = Math.max(0, n);
  persistSave({ force: true });
  updatePointsUI();
  refreshAdminPanel();
  if (ui.adminMsg) ui.adminMsg.textContent = `Points set to ${save.points}.`;
}

function adminAddXp(n) {
  if (!isAdmin()) return;
  const gain = Math.max(0, Math.floor(n || 0));
  if (!gain) {
    if (ui.adminMsg) ui.adminMsg.textContent = "Enter an XP amount to add.";
    return;
  }
  const before = getXpLevel();
  save.xp = Math.max(0, (save.xp || 0) + gain);
  refreshAvatarUnlocks();
  persistSave();
  refreshAdminPanel();
  const after = getXpLevel();
  if (ui.adminMsg) {
    ui.adminMsg.textContent =
      after > before ? `Added ${gain} XP · XP Level ${before} → ${after}.` : `Added ${gain} XP.`;
  }
}

function adminSetXp(n) {
  if (!isAdmin()) return;
  save.xp = Math.max(0, Math.floor(n || 0));
  refreshAvatarUnlocks();
  persistSave({ force: true });
  refreshAdminPanel();
  if (ui.adminMsg) ui.adminMsg.textContent = `XP set to ${save.xp} (Level ${getXpLevel()}).`;
}

function adminUnlockAll() {
  if (!isAdmin()) return;
  for (const item of SHOP.paddle) {
    if (item.hidden || item.codeOnly) continue;
    if (!save.owned.paddle.includes(item.id)) save.owned.paddle.push(item.id);
  }
  for (const item of SHOP.table) {
    if (item.hidden || item.codeOnly) continue;
    if (!save.owned.table.includes(item.id)) save.owned.table.push(item.id);
  }
  persistSave();
  if (ui.adminMsg) ui.adminMsg.textContent = "All colours unlocked.";
  refreshAdminPanel();
}

function adminUnlockAllLevels() {
  if (!isAdmin()) return;
  save.maxBotCleared = 100;
  sanitizeEquippedCosmetics();
  persistSave();
  updateNameUI();
  refreshAdminPanel();
  if (ui.botLevelGrid) renderBotLevelGrid();
  if (ui.adminMsg) ui.adminMsg.textContent = "All bot levels unlocked (L100).";
}

function adminUnlockAllChaosLevels() {
  if (!isAdmin()) return;
  save.maxChaosCleared = CHAOS_MAX_LEVEL;
  grantChaosRiftIfEligible();
  sanitizeEquippedCosmetics();
  persistSave();
  updateNameUI();
  refreshAdminPanel();
  if (ui.chaosLevelGrid) renderChaosLevelGrid();
  if (ui.adminMsg) ui.adminMsg.textContent = "All Chaos levels unlocked (L25) — Chaos Rift granted.";
}

function adminUnlockAllSurvivalRounds() {
  if (!isAdmin()) return;
  save.maxSurvivalCleared = SURVIVAL_MAX_ROUND;
  grantEnduranceIfEligible();
  sanitizeEquippedCosmetics();
  persistSave();
  updateNameUI();
  refreshAdminPanel();
  if (ui.survivalLevelGrid) renderSurvivalLevelGrid();
  if (ui.adminMsg) ui.adminMsg.textContent = "All Survival rounds unlocked (R25) — Endurance granted.";
}

function adminUnlockAllBossLevels() {
  if (!isAdmin()) return;
  save.maxBossCleared = BOSS_MAX_LEVEL;
  grantOverlordIfEligible();
  sanitizeEquippedCosmetics();
  persistSave();
  updateNameUI();
  refreshAdminPanel();
  if (ui.bossLevelGrid) renderBossLevelGrid();
  if (ui.adminMsg) ui.adminMsg.textContent = "All Boss battles unlocked (B10) — Overlord granted.";
}

function adminUnlockAllCupPongLevels() {
  if (!isAdmin()) return;
  save.maxCupPongCleared = CUP_PONG_MAX_LEVEL;
  if (!save.owned) save.owned = { paddle: ["white"], table: ["classic"] };
  if (!Array.isArray(save.owned.paddle)) save.owned.paddle = ["white"];
  if (!Array.isArray(save.owned.table)) save.owned.table = ["classic"];
  // Grant Beer Pong paddle + tabletop directly (same as clear L50).
  for (const kind of ["paddle", "table"]) {
    if (!save.owned[kind].includes("beerpong")) save.owned[kind].push("beerpong");
  }
  if (typeof grantBeerPongCosmeticIfEligible === "function") grantBeerPongCosmeticIfEligible();
  sanitizeEquippedCosmetics();
  persistSave({ force: true });
  updateNameUI();
  refreshAdminPanel();
  if (typeof renderCupPongLevelGrid === "function") renderCupPongLevelGrid();
  if (ui.customizeOverlay && !ui.customizeOverlay.classList.contains("hidden")) renderShop();
  if (ui.adminMsg) ui.adminMsg.textContent = "All Cup Pong levels unlocked (L50) — Beer Pong cosmetics granted.";
}

function adminSetPlayerLevel(n) {
  if (!isAdmin()) return;
  const lv = Math.max(1, Math.min(XP_MAX_LEVEL, Math.floor(Number(n) || 1)));
  const before = getXpLevel();
  save.xp = xpTotalForLevel(lv);
  refreshAvatarUnlocks();
  sanitizeEquippedCosmetics();
  persistSave({ force: true });
  updateNameUI();
  refreshAdminPanel();
  if (s.mode === "online" && net.connected) sendCosmetics();
  const after = getXpLevel();
  if (after > before) scheduleLevelUpCelebration(before, after);
  if (ui.adminMsg) ui.adminMsg.textContent = `Player level set to L${after} (${save.xp} XP).`;
}

function setAdminAbility(key, on) {
  if (!isAdmin()) return;
  save.abilities[key] = on;
  persistSave();
  if (ui.adminMsg) ui.adminMsg.textContent = on ? "Ability enabled." : "Ability disabled.";
}

async function adminResetScoreboard() {
  if (!isAdmin()) return;
  if (!location.host) {
    if (ui.adminMsg) ui.adminMsg.textContent = "Start the game server to manage the scoreboard.";
    return;
  }
  if (!authState.token) {
    if (ui.adminMsg) ui.adminMsg.textContent = "Sign in as MikLoit first.";
    return;
  }
  const ok = window.confirm(
    "Restart the online scoreboard?\n\nThis clears ALL players' wins, losses, and streaks on this server.\nA backup file is saved on the server first."
  );
  if (!ok) {
    if (ui.adminMsg) ui.adminMsg.textContent = "Scoreboard restart cancelled.";
    return;
  }
  if (ui.adminMsg) ui.adminMsg.textContent = "Restarting scoreboard…";
  try {
    const res = await fetch("/api/leaderboard/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: authState.token, confirm: "RESET" }),
    });
    const data = await res.json();
    if (!data?.ok) {
      if (ui.adminMsg) ui.adminMsg.textContent = data?.error || "Could not restart scoreboard.";
      return;
    }
    if (ui.adminMsg) {
      ui.adminMsg.textContent = `Scoreboard restarted — cleared ${data.cleared || 0} player${
        data.cleared === 1 ? "" : "s"
      }.${data.backup ? ` Backup: ${data.backup}` : ""}`;
    }
    if (ui.onlineScoreboardList) refreshOnlineScoreboard();
  } catch {
    if (ui.adminMsg) ui.adminMsg.textContent = "Network error — scoreboard not changed.";
  }
}

let adminSelectedPlayer = null;
let adminSelectedTicket = null;

async function adminApi(path, body = {}) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: authState.token, ...body }),
  });
  return res.json();
}

function paintAdminPlayerAvatar(player) {
  const el = ui.adminPlayerAvatar;
  if (!el) return;
  const def = AVATAR_DEFS.find((a) => a.id === (player?.avatar || "default")) || AVATAR_DEFS[0];
  applyAvatarToElement(el, def, { customUrl: player?.customAvatarUrl || "" });
}

function formatBanMeta(player) {
  if (!player?.banned) return null;
  if (player.banLabel) return player.banLabel;
  if (player.bannedUntil) return `Banned until ${new Date(player.bannedUntil).toLocaleString()}`;
  return "Permanently banned";
}

function renderAdminPlayersList(players) {
  const list = ui.adminPlayersList;
  if (!list) return;
  list.innerHTML = "";
  const rows = Array.isArray(players) ? players : [];
  if (!rows.length) {
    if (ui.adminPlayersMsg) ui.adminPlayersMsg.textContent = "No registered accounts yet.";
    return;
  }
  if (ui.adminPlayersMsg) {
    const onlineCount = rows.filter((p) => p.online).length;
    ui.adminPlayersMsg.textContent = `${rows.length} account${rows.length === 1 ? "" : "s"} · ${onlineCount} online · tap to manage.`;
  }
  rows.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "admin-list-row";
    btn.setAttribute("role", "listitem");
    const title = document.createElement("div");
    title.className = "admin-list-title";
    title.textContent = p.username || p.name || "Player";
    const meta = document.createElement("div");
    meta.className = "admin-list-meta";
    const status = document.createElement("span");
    status.className = `presence-pill ${p.online ? "is-online" : "is-offline"}`;
    status.textContent = p.online ? "Online" : "Offline";
    meta.appendChild(status);
    if (p.banned) {
      meta.appendChild(document.createTextNode(" · "));
      const ban = document.createElement("span");
      ban.className = "ban-label";
      ban.textContent = "Banned";
      meta.appendChild(ban);
    }
    if (p.isOwner) meta.appendChild(document.createTextNode(" · Owner"));
    else if (p.isAdmin) meta.appendChild(document.createTextNode(" · Admin"));
    meta.appendChild(
      document.createTextNode(
        ` · ${p.points || 0} pts · XP L${p.xpLevel || getXpProgress(p.xp || 0).level} (${p.xp || 0})`
      )
    );
    btn.append(title, meta);
    btn.addEventListener("click", () => {
      playMenuClick();
      openAdminPlayerDetail(p);
    });
    list.appendChild(btn);
  });
}

async function refreshAdminPlayers() {
  if (!isAdmin() || !ui.adminPlayersList) return;
  if (ui.adminPlayersMsg) ui.adminPlayersMsg.textContent = "Loading…";
  try {
    const data = await adminApi("/api/admin/players");
    if (!data?.ok) throw new Error(data?.error || "fail");
    renderAdminPlayersList(data.players || []);
  } catch {
    if (ui.adminPlayersMsg) ui.adminPlayersMsg.textContent = "Could not load players.";
  }
}

function openAdminPlayers() {
  if (!isAdmin()) return;
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.adminPlayerDetailOverlay);
  showOverlay(ui.adminPlayersOverlay);
  setStagePlaying(false);
  refreshAdminPlayers();
}

function closeAdminPlayers() {
  hideOverlay(ui.adminPlayersOverlay);
  showOverlay(ui.adminOverlay);
}

function openAdminPlayerDetail(player) {
  if (!isAdmin() || !player) return;
  adminSelectedPlayer = player;
  hideOverlay(ui.adminPlayersOverlay);
  showOverlay(ui.adminPlayerDetailOverlay);
  const viewOnlyOwner = !!player.isOwner && !isOwner();
  if (ui.adminPlayerTitle) ui.adminPlayerTitle.textContent = (player.username || "PLAYER").toUpperCase();
  if (ui.adminPlayerSub) {
    if (player.banned) {
      ui.adminPlayerSub.innerHTML = `<span class="ban-label">${formatBanMeta(player) || "Banned"}</span>`;
    } else {
      ui.adminPlayerSub.innerHTML = player.online
        ? `<span class="presence-pill is-online">Online</span> · Currently active`
        : `<span class="presence-pill is-offline">Offline</span> · Registered account`;
    }
  }
  if (ui.adminPlayerName) ui.adminPlayerName.textContent = player.name || player.username || "Player";
  if (ui.adminPlayerKind) {
    ui.adminPlayerKind.textContent = player.isOwner
      ? "Owner"
      : player.isAdmin
        ? `Admin · ${player.usernameKey || player.username || ""}`
        : `Account · ${player.usernameKey || player.username || ""}`;
  }
  if (ui.adminPlayerStats) {
    const lvl = player.xpLevel || getXpProgress(player.xp || 0).level;
    ui.adminPlayerStats.textContent = `${player.points || 0} pts · XP Level ${lvl} · ${player.xp || 0} XP · Classic L${
      player.maxBotCleared || 0
    }`;
  }
  paintAdminPlayerAvatar(player);

  if (ui.adminPlayerControls) ui.adminPlayerControls.classList.toggle("hidden", viewOnlyOwner);
  if (ui.adminDaddyMsg) {
    ui.adminDaddyMsg.classList.toggle("hidden", !viewOnlyOwner);
    if (viewOnlyOwner) ui.adminDaddyMsg.textContent = "No messing around with daddy";
  }

  if (!viewOnlyOwner) {
    if (ui.btnAdminBanPlayer) ui.btnAdminBanPlayer.classList.toggle("hidden", !!player.banned || !!player.isOwner);
    if (ui.adminBanDuration) ui.adminBanDuration.classList.toggle("hidden", !!player.banned || !!player.isOwner);
    if (ui.adminBanDurationLabel) ui.adminBanDurationLabel.classList.toggle("hidden", !!player.banned || !!player.isOwner);
    if (ui.btnAdminUnbanPlayer) ui.btnAdminUnbanPlayer.classList.toggle("hidden", !player.banned || !!player.isOwner);
    if (ui.btnAdminKickPlayer) ui.btnAdminKickPlayer.classList.toggle("hidden", !!player.isOwner);
    const canManageRole = isOwner() && !player.isOwner;
    if (ui.adminRoleSection) ui.adminRoleSection.classList.toggle("hidden", !canManageRole);
    if (ui.adminRoleActions) ui.adminRoleActions.classList.toggle("hidden", !canManageRole);
    if (ui.btnAdminGrantAdmin) ui.btnAdminGrantAdmin.classList.toggle("hidden", !canManageRole || !!player.isAdmin);
    if (ui.btnAdminRevokeAdmin) ui.btnAdminRevokeAdmin.classList.toggle("hidden", !canManageRole || !player.isAdmin);
  }
  if (ui.adminPlayerMsg) ui.adminPlayerMsg.textContent = viewOnlyOwner ? "" : "";
}

function closeAdminPlayerDetail() {
  hideOverlay(ui.adminPlayerDetailOverlay);
  showOverlay(ui.adminPlayersOverlay);
  refreshAdminPlayers();
}

async function adminPlayerAction(action, amount) {
  if (!isAdmin() || !adminSelectedPlayer) return;
  if (adminSelectedPlayer.isOwner && !isOwner()) {
    if (ui.adminPlayerMsg) ui.adminPlayerMsg.textContent = "No messing around with daddy";
    return;
  }
  if (ui.adminPlayerMsg) ui.adminPlayerMsg.textContent = "Working…";
  try {
    const payload = {
      playerId: adminSelectedPlayer.playerId,
      username: adminSelectedPlayer.usernameKey || adminSelectedPlayer.username,
      action,
      amount,
    };
    if (action === "ban") {
      payload.duration = ui.adminBanDuration?.value || "permanent";
    }
    const data = await adminApi("/api/admin/player/action", payload);
    if (!data?.ok) {
      if (ui.adminPlayerMsg) ui.adminPlayerMsg.textContent = data?.error || "Action failed.";
      return;
    }
    if (data.player) {
      adminSelectedPlayer = { ...adminSelectedPlayer, ...data.player };
      if (data.profile) {
        adminSelectedPlayer.points = data.profile.points ?? adminSelectedPlayer.points;
        adminSelectedPlayer.xp = data.profile.xp ?? adminSelectedPlayer.xp;
        adminSelectedPlayer.xpLevel = getXpProgress(adminSelectedPlayer.xp || 0).level;
      }
      openAdminPlayerDetail(adminSelectedPlayer);
    }
    const labels = {
      givePoints: `Points added → ${adminSelectedPlayer?.points ?? "?"} pts.`,
      removePoints: `Points removed → ${adminSelectedPlayer?.points ?? "?"} pts.`,
      giveXp: `XP added → Level ${adminSelectedPlayer?.xpLevel ?? "?"} (${adminSelectedPlayer?.xp ?? "?"} XP).`,
      removeXp: `XP removed → Level ${adminSelectedPlayer?.xpLevel ?? "?"} (${adminSelectedPlayer?.xp ?? "?"} XP).`,
      ban: data.banLabel || "Player banned.",
      unban: "Player unbanned.",
      kick: `Kicked ${data.kicked || 0} connection(s).`,
      grantAdmin: "Admin granted. They must refresh or re-login if already signed in.",
      revokeAdmin: "Admin removed.",
    };
    if (ui.adminPlayerMsg) ui.adminPlayerMsg.textContent = labels[action] || "Done.";
  } catch {
    if (ui.adminPlayerMsg) ui.adminPlayerMsg.textContent = "Network error.";
  }
}

function renderAdminReportsList(tickets) {
  const list = ui.adminReportsList;
  if (!list) return;
  list.innerHTML = "";
  const rows = Array.isArray(tickets) ? tickets : [];
  if (!rows.length) {
    if (ui.adminReportsMsg) ui.adminReportsMsg.textContent = "No tickets yet.";
    return;
  }
  const openCount = rows.filter((t) => t.status === "open").length;
  if (ui.adminReportsMsg) {
    ui.adminReportsMsg.textContent = `${rows.length} ticket${rows.length === 1 ? "" : "s"} · ${openCount} open.`;
  }
  rows.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `admin-list-row status-${t.status || "open"}`;
    btn.setAttribute("role", "listitem");
    const title = document.createElement("div");
    title.className = "admin-list-title";
    title.textContent = t.subject || "Ticket";
    const meta = document.createElement("div");
    meta.className = "admin-list-meta";
    meta.textContent = `${(t.category || "other").toUpperCase()} · ${t.status || "open"} · ${t.username || "player"}${
      t.reason ? ` · ${String(t.reason).replace(/_/g, " ")}` : ""
    }`;
    btn.append(title, meta);
    btn.addEventListener("click", () => {
      playMenuClick();
      openAdminReportDetail(t);
    });
    list.appendChild(btn);
  });
}

async function refreshAdminReports() {
  if (!isAdmin() || !ui.adminReportsList) return;
  if (ui.adminReportsMsg) ui.adminReportsMsg.textContent = "Loading…";
  try {
    const data = await adminApi("/api/admin/tickets");
    if (!data?.ok) throw new Error(data?.error || "fail");
    renderAdminReportsList(data.tickets || []);
  } catch {
    if (ui.adminReportsMsg) ui.adminReportsMsg.textContent = "Could not load reports.";
  }
}

function openAdminReports() {
  if (!isAdmin()) return;
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.adminReportDetailOverlay);
  showOverlay(ui.adminReportsOverlay);
  setStagePlaying(false);
  refreshAdminReports();
}

function closeAdminReports() {
  hideOverlay(ui.adminReportsOverlay);
  showOverlay(ui.adminOverlay);
}

function openAdminReportDetail(ticket) {
  if (!isAdmin() || !ticket) return;
  adminSelectedTicket = ticket;
  hideOverlay(ui.adminReportsOverlay);
  showOverlay(ui.adminReportDetailOverlay);
  if (ui.adminReportTitle) ui.adminReportTitle.textContent = (ticket.subject || "TICKET").toUpperCase();
  if (ui.adminReportMeta) {
    const when = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "";
    const reasonBit = ticket.reason ? ` · ${String(ticket.reason).replace(/_/g, " ")}` : "";
    ui.adminReportMeta.textContent = `${(ticket.category || "other").toUpperCase()} · ${ticket.status || "open"} · ${
      ticket.username || "player"
    }${ticket.reportedPlayer ? ` · vs ${ticket.reportedPlayer}` : ""}${reasonBit}${when ? ` · ${when}` : ""}`;
  }
  if (ui.adminReportBody) ui.adminReportBody.textContent = ticket.message || "";
  if (ui.adminReportResolution) {
    if (ticket.resolution) {
      ui.adminReportResolution.textContent = `Outcome: ${ticket.resolution}`;
      ui.adminReportResolution.classList.remove("hidden");
    } else {
      ui.adminReportResolution.textContent = "";
      ui.adminReportResolution.classList.add("hidden");
    }
  }
  if (ui.adminReportOutcome && ticket.resolution) {
    const opt = [...ui.adminReportOutcome.options].find((o) => o.value === ticket.resolution);
    if (opt) ui.adminReportOutcome.value = ticket.resolution;
    else if (String(ticket.resolution).startsWith("Password reset approved")) {
      ui.adminReportOutcome.value = "Password reset approved";
    }
  }
  const isPassword = String(ticket.category || "").toLowerCase() === "password";
  if (ui.adminPasswordResetBox) ui.adminPasswordResetBox.classList.toggle("hidden", !isPassword);
  if (ui.adminResetCodeMsg) {
    ui.adminResetCodeMsg.textContent =
      isPassword && ticket.status === "resolved" && String(ticket.resolution || "").includes("approved")
        ? "Approved — player can set a new password on their screen."
        : isPassword && ticket.status === "closed"
          ? "Denied."
          : "";
  }
  const isChatReport =
    String(ticket.source || "").toLowerCase() === "chat" ||
    String(ticket.subject || "").toLowerCase().startsWith("chat report");
  if (ui.adminChatHistoryBox) ui.adminChatHistoryBox.classList.toggle("hidden", !isChatReport);
  if (ui.adminChatLog) {
    ui.adminChatLog.innerHTML = "";
    ui.adminChatLog.classList.add("hidden");
  }
  if (ui.adminChatHistoryMsg) ui.adminChatHistoryMsg.textContent = "";
  if (ui.adminReportMsg) ui.adminReportMsg.textContent = "";
}

function renderAdminChatHistory(messages, ticket) {
  const box = ui.adminChatLog;
  if (!box) return;
  box.innerHTML = "";
  const rows = Array.isArray(messages) ? messages : [];
  if (!rows.length) {
    box.classList.remove("hidden");
    const empty = document.createElement("p");
    empty.className = "lobby-text";
    empty.textContent = "No messages found for this conversation.";
    box.appendChild(empty);
    return;
  }
  const reporterKey = String(ticket.reporterKey || ticket.username || "").toLowerCase();
  const reportedKey = String(ticket.reportedKey || ticket.reportedPlayer || "").toLowerCase();
  rows.forEach((m) => {
    const fromKey = String(m.fromKey || m.from || "").toLowerCase();
    const div = document.createElement("div");
    const fromReported = reportedKey && fromKey === reportedKey;
    div.className = `admin-chat-bubble ${fromReported ? "from-reported" : "from-reporter"}`;
    const who = document.createElement("span");
    who.className = "admin-chat-bubble-who";
    who.textContent = m.from || (fromReported ? "Reported" : "Reporter");
    const text = document.createElement("div");
    text.textContent = m.body || "";
    const meta = document.createElement("span");
    meta.className = "admin-chat-bubble-meta";
    meta.textContent = m.createdAt ? new Date(m.createdAt).toLocaleString() : "";
    div.append(who, text, meta);
    box.appendChild(div);
  });
  box.classList.remove("hidden");
  box.scrollTop = box.scrollHeight;
}

async function adminCheckChatHistory() {
  if (!isAdmin() || !adminSelectedTicket) return;
  if (ui.adminChatHistoryMsg) ui.adminChatHistoryMsg.textContent = "Loading chat…";
  if (ui.adminChatLog) {
    ui.adminChatLog.innerHTML = "";
    ui.adminChatLog.classList.add("hidden");
  }
  try {
    const data = await adminApi("/api/admin/chat-history", {
      ticketId: adminSelectedTicket.id,
      reporterKey: adminSelectedTicket.reporterKey || adminSelectedTicket.username,
      reportedKey: adminSelectedTicket.reportedKey || adminSelectedTicket.reportedPlayer,
      threadId: adminSelectedTicket.threadId || "",
    });
    if (!data?.ok) {
      if (ui.adminChatHistoryMsg) ui.adminChatHistoryMsg.textContent = data?.error || "Could not load chat.";
      return;
    }
    renderAdminChatHistory(data.messages, adminSelectedTicket);
    if (ui.adminChatHistoryMsg) {
      ui.adminChatHistoryMsg.textContent = data.messages?.length
        ? `${data.messages.length} message${data.messages.length === 1 ? "" : "s"} loaded.`
        : "No messages in this thread.";
    }
  } catch {
    if (ui.adminChatHistoryMsg) ui.adminChatHistoryMsg.textContent = "Network error.";
  }
}

async function adminApprovePasswordReset() {
  if (!isAdmin() || !adminSelectedTicket) return;
  // #region agent log
  fetch('http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'38eb5e'},body:JSON.stringify({sessionId:'38eb5e',runId:'post-fix',hypothesisId:'B',location:'game.js:adminApprovePasswordReset',message:'admin approving password reset',data:{ticketUser:adminSelectedTicket.username||'',authUser:authState.username||'',isAdmin:isAdmin(),pendingLocal:getPendingResetUsername(),adminOverlay:!ui.adminReportDetailOverlay?.classList.contains('hidden')},timestamp:Date.now()})}).catch(()=>{});
  fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'38eb5e',runId:'post-fix',hypothesisId:'B',location:'game.js:adminApprovePasswordReset',message:'admin approving password reset',data:{ticketUser:adminSelectedTicket.username||'',authUser:authState.username||'',isAdmin:isAdmin(),pendingLocal:getPendingResetUsername()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Approving…";
  if (ui.adminResetCodeMsg) ui.adminResetCodeMsg.textContent = "";
  try {
    const data = await adminApi("/api/admin/password-reset/approve", {
      ticketId: adminSelectedTicket.id,
      username: adminSelectedTicket.username,
    });
    if (!data?.ok) {
      if (ui.adminReportMsg) ui.adminReportMsg.textContent = data?.error || "Approve failed.";
      return;
    }
    if (data.ticket) adminSelectedTicket = data.ticket;
    openAdminReportDetail(adminSelectedTicket);
    if (ui.adminResetCodeMsg) {
      ui.adminResetCodeMsg.textContent = "Approved — the player will get a popup to set their new password.";
    }
    if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Reset approved.";
    // #region agent log
    fetch('http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'38eb5e'},body:JSON.stringify({sessionId:'38eb5e',runId:'post-fix',hypothesisId:'A',location:'game.js:adminApprovePasswordReset:after',message:'approve ok; checking if admin will also poll',data:{pendingLocal:getPendingResetUsername(),pollActive:!!passwordResetPollTimer,approvedUser:data.username||''},timestamp:Date.now()})}).catch(()=>{});
    fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'38eb5e',runId:'post-fix',hypothesisId:'A',location:'game.js:adminApprovePasswordReset:after',message:'approve ok',data:{pendingLocal:getPendingResetUsername(),pollActive:!!passwordResetPollTimer,approvedUser:data.username||''},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch {
    if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Network error.";
  }
}

async function adminDenyPasswordReset() {
  if (!isAdmin() || !adminSelectedTicket) return;
  if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Denying…";
  try {
    const data = await adminApi("/api/admin/password-reset/deny", {
      ticketId: adminSelectedTicket.id,
      username: adminSelectedTicket.username,
    });
    if (!data?.ok) {
      if (ui.adminReportMsg) ui.adminReportMsg.textContent = data?.error || "Deny failed.";
      return;
    }
    if (data.ticket) adminSelectedTicket = data.ticket;
    openAdminReportDetail(adminSelectedTicket);
    if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Reset denied.";
  } catch {
    if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Network error.";
  }
}

function closeAdminReportDetail() {
  hideOverlay(ui.adminReportDetailOverlay);
  showOverlay(ui.adminReportsOverlay);
  refreshAdminReports();
}

async function adminSetTicketStatus(status) {
  if (!isAdmin() || !adminSelectedTicket) return;
  if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Updating…";
  const resolution =
    status === "open" ? "" : ui.adminReportOutcome?.value || "No action taken";
  try {
    const data = await adminApi("/api/admin/ticket", {
      ticketId: adminSelectedTicket.id,
      status,
      resolution,
    });
    if (!data?.ok) {
      if (ui.adminReportMsg) ui.adminReportMsg.textContent = data?.error || "Update failed.";
      return;
    }
    adminSelectedTicket = data.ticket;
    openAdminReportDetail(adminSelectedTicket);
    if (ui.adminReportMsg) {
      ui.adminReportMsg.textContent =
        status === "open"
          ? "Marked open."
          : `Marked ${status}. Player will get a notice: “${resolution}”.`;
    }
  } catch {
    if (ui.adminReportMsg) ui.adminReportMsg.textContent = "Network error.";
  }
}

const PENDING_RESET_KEY = "pong-bw-pending-reset";
let passwordResetPollTimer = null;
let passwordResetPopupShownFor = "";

function dbgReset(hypothesisId, location, message, data) {
  // #region agent log
  const payload = {
    sessionId: "38eb5e",
    runId: "post-fix",
    hypothesisId,
    location,
    message,
    data: data || {},
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

function getPendingResetUsername() {
  try {
    // sessionStorage is per-tab so an admin tab won't inherit the player's pending request.
    const fromSession = String(sessionStorage.getItem(PENDING_RESET_KEY) || "").trim();
    if (fromSession) return fromSession;
    // One-time migrate away from shared localStorage (caused admin to see the popup).
    const legacy = String(localStorage.getItem(PENDING_RESET_KEY) || "").trim();
    if (legacy) {
      localStorage.removeItem(PENDING_RESET_KEY);
    }
    return "";
  } catch {
    return "";
  }
}

function setPendingResetUsername(username) {
  try {
    const u = String(username || "").trim();
    localStorage.removeItem(PENDING_RESET_KEY);
    if (u) sessionStorage.setItem(PENDING_RESET_KEY, u);
    else sessionStorage.removeItem(PENDING_RESET_KEY);
  } catch {
    /* ignore */
  }
}

function stopPasswordResetPoll() {
  if (passwordResetPollTimer) {
    clearInterval(passwordResetPollTimer);
    passwordResetPollTimer = null;
  }
}

function normalizeAuthUser(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16);
}

function isPasswordResetRequester(pendingUser) {
  const pending = normalizeAuthUser(pendingUser);
  if (!pending) return false;
  const signed = normalizeAuthUser(authState.username);
  // Admin/owner UI must never take over another player's reset form.
  if (isAdmin() || isOwner()) {
    return !!signed && signed === pending;
  }
  if (!authState.token) return true;
  if (!signed) return true;
  return signed === pending;
}

function startPasswordResetPoll(username) {
  const user = String(username || "").trim();
  if (!user) return;
  dbgReset("C", "game.js:startPasswordResetPoll", "starting reset poll", {
    user,
    authUser: authState.username || "",
    isAdmin: isAdmin(),
    isOwner: isOwner(),
  });
  setPendingResetUsername(user);
  stopPasswordResetPoll();
  pollPasswordResetStatus();
  passwordResetPollTimer = setInterval(pollPasswordResetStatus, 2500);
}

async function pollPasswordResetStatus() {
  const username = getPendingResetUsername();
  if (!username) {
    stopPasswordResetPoll();
    return;
  }
  try {
    const res = await fetch("/api/auth/forgot-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) return;
    if (data.approved || data.pending) {
      dbgReset("A", "game.js:pollPasswordResetStatus", "poll status", {
        username,
        pending: !!data.pending,
        approved: !!data.approved,
        authUser: authState.username || "",
        isAdmin: isAdmin(),
        isRequester: isPasswordResetRequester(username),
      });
    }
    if (data.pending && ui.forgotPasswordMsg && !ui.forgotPasswordOverlay?.classList.contains("hidden")) {
      ui.forgotPasswordMsg.textContent = "Waiting for an admin to approve…";
    }
    if (data.approved) {
      openResetPasswordPopup(username);
    }
  } catch {
    /* ignore */
  }
}

function openForgotPassword() {
  hideOverlay(ui.profileOverlay);
  showOverlay(ui.forgotPasswordOverlay);
  setStagePlaying(false);
  if (ui.forgotUsername) {
    ui.forgotUsername.value = getPendingResetUsername() || ui.authUsername?.value || "";
  }
  if (ui.forgotPasswordMsg) {
    ui.forgotPasswordMsg.textContent = getPendingResetUsername()
      ? "Request pending — waiting for admin approval…"
      : "";
  }
  if (getPendingResetUsername()) startPasswordResetPoll(getPendingResetUsername());
}

function closeForgotPassword() {
  hideOverlay(ui.forgotPasswordOverlay);
  showOverlay(ui.profileOverlay);
  refreshProfileUI();
}

function openResetPasswordPopup(username) {
  const user = String(username || getPendingResetUsername() || "").trim();
  if (!user) return;
  const requester = isPasswordResetRequester(user);
  const adminUiOpen =
    !ui.adminOverlay?.classList.contains("hidden") ||
    !ui.adminReportsOverlay?.classList.contains("hidden") ||
    !ui.adminReportDetailOverlay?.classList.contains("hidden") ||
    !ui.adminPlayersOverlay?.classList.contains("hidden") ||
    !ui.adminPlayerDetailOverlay?.classList.contains("hidden") ||
    !ui.adminToolsOverlay?.classList.contains("hidden");
  dbgReset("A", "game.js:openResetPasswordPopup", requester && !adminUiOpen ? "opening set-password popup" : "blocked set-password popup", {
    user,
    authUser: authState.username || "",
    isAdmin: isAdmin(),
    isOwner: isOwner(),
    requester,
    adminUiOpen,
    hasToken: !!authState.token,
  });
  if (!requester || adminUiOpen) return;
  if (passwordResetPopupShownFor === user && ui.resetPasswordOverlay && !ui.resetPasswordOverlay.classList.contains("hidden")) {
    return;
  }
  passwordResetPopupShownFor = user;
  setPendingResetUsername(user);
  hideOverlay(ui.forgotPasswordOverlay);
  if (ui.resetPasswordLead) {
    ui.resetPasswordLead.textContent = `Reset approved for ${user}. Choose a new password, then save.`;
  }
  if (ui.resetNewPassword) ui.resetNewPassword.value = "";
  if (ui.resetConfirmPassword) ui.resetConfirmPassword.value = "";
  if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = "";
  showOverlay(ui.resetPasswordOverlay);
  setStagePlaying(false);
}

/** First-login claim for reserved accounts (mustSetPassword). */
function openClaimPasswordPopup(username) {
  const user = String(username || "").trim();
  if (!user || !ui.resetPasswordOverlay) return;
  stopPasswordResetPoll();
  passwordResetPopupShownFor = user;
  setPendingResetUsername(user);
  hideOverlay(ui.forgotPasswordOverlay);
  if (ui.resetPasswordLead) {
    ui.resetPasswordLead.textContent = `Welcome, ${user}. Choose your password, then save. Please remember your password.`;
  }
  if (ui.resetNewPassword) ui.resetNewPassword.value = "";
  if (ui.resetConfirmPassword) ui.resetConfirmPassword.value = "";
  if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = "Please remember your password.";
  showOverlay(ui.resetPasswordOverlay);
  setStagePlaying(false);
}

function closeResetPasswordPopup({ keepPending = true } = {}) {
  hideOverlay(ui.resetPasswordOverlay);
  if (!keepPending) {
    setPendingResetUsername("");
    passwordResetPopupShownFor = "";
    stopPasswordResetPoll();
  }
}

async function submitForgotRequest() {
  const username = String(ui.forgotUsername?.value || "").trim();
  if (ui.forgotPasswordMsg) ui.forgotPasswordMsg.textContent = "Sending…";
  try {
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      if (ui.forgotPasswordMsg) ui.forgotPasswordMsg.textContent = data?.error || "Could not send request.";
      return;
    }
    if (ui.forgotPasswordMsg) {
      ui.forgotPasswordMsg.textContent =
        data.message || "Request sent. Keep this page open — a password window will appear when approved.";
    }
    startPasswordResetPoll(username);
  } catch {
    if (ui.forgotPasswordMsg) ui.forgotPasswordMsg.textContent = "Network error.";
  }
}

async function submitForgotNewPassword() {
  const username = getPendingResetUsername() || String(ui.forgotUsername?.value || "").trim();
  const newPassword = String(ui.resetNewPassword?.value || "");
  const confirm = String(ui.resetConfirmPassword?.value || "");
  if (newPassword.length < 6) {
    if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = "Password must be at least 6 characters.";
    return;
  }
  if (newPassword !== confirm) {
    if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = "Passwords do not match.";
    return;
  }
  if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = "Saving…";
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newPassword }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = data?.error || "Reset failed.";
      return;
    }
    if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = data.message || "Password saved. You can log in now.";
    setPendingResetUsername("");
    passwordResetPopupShownFor = "";
    stopPasswordResetPoll();
    if (ui.authUsername && username) ui.authUsername.value = username;
    setTimeout(() => {
      closeResetPasswordPopup({ keepPending: false });
      showOverlay(ui.profileOverlay);
      refreshProfileUI();
      setAuthMsg("Password saved — please remember your password, then log in.");
    }, 700);
  } catch {
    if (ui.resetPasswordMsg) ui.resetPasswordMsg.textContent = "Network error.";
  }
}

function refreshContactUI() {
  const signedIn = !!authState.token;
  if (ui.contactGuest) ui.contactGuest.classList.toggle("hidden", signedIn);
  if (ui.contactForm) ui.contactForm.classList.toggle("hidden", !signedIn);
  if (ui.contactMsg) ui.contactMsg.textContent = "";
}

function openContact() {
  hideOverlay(ui.menuOverlay);
  showOverlay(ui.contactOverlay);
  setStagePlaying(false);
  refreshContactUI();
}

function closeContact() {
  hideOverlay(ui.contactOverlay);
  showOverlay(ui.menuOverlay);
}

async function submitContactTicket() {
  if (!authState.token) {
    if (ui.contactMsg) ui.contactMsg.textContent = "Sign in from Profile first.";
    return;
  }
  if (ui.contactMsg) ui.contactMsg.textContent = "Sending…";
  try {
    const data = await adminApi("/api/tickets", {
      category: ui.contactCategory?.value || "other",
      subject: ui.contactSubject?.value || "",
      message: ui.contactMessage?.value || "",
      reportedPlayer: ui.contactReported?.value || "",
    });
    if (!data?.ok) {
      if (ui.contactMsg) ui.contactMsg.textContent = data?.error || "Could not send ticket.";
      return;
    }
    if (ui.contactSubject) ui.contactSubject.value = "";
    if (ui.contactMessage) ui.contactMessage.value = "";
    if (ui.contactReported) ui.contactReported.value = "";
    if (ui.contactMsg) {
      ui.contactMsg.textContent =
        data.message ||
        "Ticket submitted. Please be patient — one of our admins will look into it.";
    }
  } catch {
    if (ui.contactMsg) ui.contactMsg.textContent = "Network error — try again.";
  }
}

const REPORT_REASON_LABELS = {
  abusive_name: "Abusive name",
  cheating: "Cheating",
  harassment: "Harassment",
  other: "Other",
};

function openReportPlayer() {
  const name = String(net.opponentName || "").trim();
  if (!name) return;
  if (ui.reportPlayerName) ui.reportPlayerName.value = name;
  if (ui.reportPlayerDetails) ui.reportPlayerDetails.value = "";
  if (ui.reportPlayerReason) ui.reportPlayerReason.value = "abusive_name";
  if (ui.reportPlayerMsg) ui.reportPlayerMsg.textContent = "";
  if (ui.reportPlayerLead) {
    ui.reportPlayerLead.textContent = authState.token
      ? `Report ${name} to admins.`
      : "Sign in from Profile to submit a report.";
  }
  hideOverlay(ui.gameOver);
  showOverlay(ui.reportPlayerOverlay);
  setStagePlaying(false);
}

function closeReportPlayer() {
  hideOverlay(ui.reportPlayerOverlay);
  showOverlay(ui.gameOver);
}

async function submitReportPlayer() {
  if (!authState.token) {
    if (ui.reportPlayerMsg) ui.reportPlayerMsg.textContent = "Sign in from Profile first.";
    return;
  }
  const reported = String(ui.reportPlayerName?.value || net.opponentName || "").trim();
  const reason = ui.reportPlayerReason?.value || "other";
  const details = String(ui.reportPlayerDetails?.value || "").trim();
  const label = REPORT_REASON_LABELS[reason] || reason;
  if (ui.reportPlayerMsg) ui.reportPlayerMsg.textContent = "Sending…";
  try {
    const data = await adminApi("/api/tickets", {
      category: "report",
      reason,
      reportedPlayer: reported,
      subject: `Report: ${label}`,
      message: details || `Reported ${reported} for ${label} after an online match.`,
    });
    if (!data?.ok) {
      if (ui.reportPlayerMsg) ui.reportPlayerMsg.textContent = data?.error || "Could not send report.";
      return;
    }
    if (ui.reportPlayerMsg) {
      ui.reportPlayerMsg.textContent =
        data.message || "Report submitted. An admin will review it.";
    }
    setTimeout(() => {
      hideOverlay(ui.reportPlayerOverlay);
      showOverlay(ui.gameOver);
    }, 700);
  } catch {
    if (ui.reportPlayerMsg) ui.reportPlayerMsg.textContent = "Network error — try again.";
  }
}

let inboxSelectedUser = "";
let inboxSelectedDisplay = "";
let inboxPollTimer = null;

function inboxInitials(name) {
  const s = String(name || "?").trim();
  if (!s) return "?";
  const parts = s.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return s.slice(0, 2).toUpperCase();
}

function formatInboxTime(ts) {
  const n = Number(ts) || 0;
  if (!n) return "";
  const d = new Date(n);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Client-side mirror of server chat safety (server still enforces). */
function scanChatMessageClient(raw) {
  const text = String(raw || "");
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
    return { ok: false, error: "Emails are not allowed in chat." };
  }
  if (
    /\bpassword\b/i.test(text) ||
    /\bhttps?:\/\//i.test(text) ||
    /\bwww\.[a-z0-9.-]+\.[a-z]{2,}/i.test(text) ||
    /\bsend\s+(me\s+)?(your\s+)?(password|pass|login|credentials)\b/i.test(text) ||
    /\b(click|open)\s+(this|the)\s+link\b/i.test(text)
  ) {
    return { ok: false, error: "That message looks like a scam or password request. It was blocked." };
  }
  if (
    /\b(my|our|home|house)\s+address\b/i.test(text) ||
    /\b(live|living)\s+at\b/i.test(text) ||
    /\b\d{1,5}\s+[a-z].{0,40}\b(street|st\.?|road|rd\.?|avenue|ave\.?)\b/i.test(text)
  ) {
    return { ok: false, error: "Addresses are not allowed in chat." };
  }
  if (
    /\bhow\s+old\s+(?:are\s+you|r\s+u)\b/i.test(text) ||
    /\b\d{1,2}\s*(?:years?|yrs?)\s*old\b/i.test(text) ||
    /\bmy\s+age\b/i.test(text) ||
    /\b(?:tell|share|ask)\s+(?:me\s+)?(?:your\s+)?age\b/i.test(text)
  ) {
    return { ok: false, error: "Sharing or asking about age is not allowed in chat." };
  }
  return { ok: true };
}

function stopInboxPoll() {
  if (inboxPollTimer) {
    clearInterval(inboxPollTimer);
    inboxPollTimer = null;
  }
}

function showInboxPane(which) {
  if (ui.inboxListView) ui.inboxListView.classList.toggle("hidden", which !== "list");
  if (ui.inboxComposeView) ui.inboxComposeView.classList.toggle("hidden", which !== "compose");
  if (ui.inboxThreadView) ui.inboxThreadView.classList.toggle("hidden", which !== "thread");
}

function refreshInboxUI() {
  const signedIn = !!authState.token;
  if (ui.inboxGuest) ui.inboxGuest.classList.toggle("hidden", signedIn);
  if (ui.inboxSignedIn) ui.inboxSignedIn.classList.toggle("hidden", !signedIn);
}

function toggleInboxRules() {
  const open = ui.inboxRulesList && ui.inboxRulesList.classList.contains("hidden");
  if (ui.inboxRulesList) ui.inboxRulesList.classList.toggle("hidden", !open);
  if (ui.btnInboxRulesToggle) ui.btnInboxRulesToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

async function refreshInboxBadge() {
  if (!authState.token || !location.host) {
    if (ui.inboxBadge) {
      ui.inboxBadge.textContent = "0";
      ui.inboxBadge.classList.add("hidden");
    }
    return;
  }
  try {
    const data = await adminApi("/api/inbox/threads");
    const n = Math.max(0, Math.floor(Number(data?.unreadTotal) || 0));
    if (ui.inboxBadge) {
      ui.inboxBadge.textContent = String(n);
      ui.inboxBadge.classList.toggle("hidden", n < 1);
    }
  } catch {
    /* ignore */
  }
}

function openInbox() {
  hideOverlay(ui.menuOverlay);
  showOverlay(ui.inboxOverlay);
  setStagePlaying(false);
  refreshInboxUI();
  if (authState.token) {
    showInboxPane("list");
    refreshInboxThreads();
    stopInboxPoll();
    inboxPollTimer = setInterval(() => {
      if (ui.inboxOverlay && !ui.inboxOverlay.classList.contains("hidden")) {
        if (ui.inboxListView && !ui.inboxListView.classList.contains("hidden")) refreshInboxThreads({ quiet: true });
        else if (inboxSelectedUser) openInboxThread(inboxSelectedUser, { quiet: true });
      }
    }, 5000);
  }
  refreshInboxBadge();
}

function closeInbox() {
  stopInboxPoll();
  hideOverlay(ui.inboxOverlay);
  showOverlay(ui.menuOverlay);
  refreshInboxBadge();
}

function renderInboxThreads(threads) {
  const list = ui.inboxThreadList;
  if (!list) return;
  list.innerHTML = "";
  const rows = Array.isArray(threads) ? threads : [];
  if (!rows.length) {
    if (ui.inboxListMsg) ui.inboxListMsg.textContent = "No chats yet. Tap New chat to start one.";
    return;
  }
  if (ui.inboxListMsg) ui.inboxListMsg.textContent = "";
  rows.forEach((t) => {
    const name = t.withUsername || t.withUsernameKey || "Player";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inbox-conv";
    btn.setAttribute("role", "listitem");

    const avatar = document.createElement("div");
    avatar.className = "inbox-conv-avatar";
    avatar.textContent = inboxInitials(name);

    const main = document.createElement("div");
    main.className = "inbox-conv-main";
    const title = document.createElement("div");
    title.className = "inbox-conv-name";
    title.textContent = name;
    const preview = document.createElement("div");
    preview.className = "inbox-conv-preview";
    preview.textContent = t.lastMessage || "Say hello";
    main.append(title, preview);

    const side = document.createElement("div");
    side.className = "inbox-conv-side";
    const time = document.createElement("div");
    time.className = "inbox-conv-time";
    time.textContent = formatInboxTime(t.lastAt);
    side.appendChild(time);
    if (t.unread) {
      const badge = document.createElement("span");
      badge.className = "inbox-badge";
      badge.textContent = String(t.unread);
      side.appendChild(badge);
    }

    btn.append(avatar, main, side);
    btn.addEventListener("click", () => {
      playMenuClick();
      openInboxThread(t.withUsernameKey || t.withUsername, { displayName: name });
    });
    list.appendChild(btn);
  });
}

async function refreshInboxThreads({ quiet = false } = {}) {
  if (!authState.token) return;
  if (!quiet && ui.inboxListMsg) ui.inboxListMsg.textContent = "Loading…";
  try {
    const data = await adminApi("/api/inbox/threads");
    if (!data?.ok) {
      if (ui.inboxListMsg) ui.inboxListMsg.textContent = data?.error || "Could not load inbox.";
      return;
    }
    renderInboxThreads(data.threads);
    const n = Math.max(0, Math.floor(Number(data.unreadTotal) || 0));
    if (ui.inboxBadge) {
      ui.inboxBadge.textContent = String(n);
      ui.inboxBadge.classList.toggle("hidden", n < 1);
    }
  } catch {
    if (ui.inboxListMsg) ui.inboxListMsg.textContent = "Network error.";
  }
}

function openInboxCompose() {
  inboxSelectedUser = "";
  inboxSelectedDisplay = "";
  showInboxPane("compose");
  if (ui.inboxLookupUser) ui.inboxLookupUser.value = "";
  if (ui.inboxComposeBody) ui.inboxComposeBody.value = "";
  if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = "";
  if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = "";
}

async function lookupInboxUser() {
  const username = String(ui.inboxLookupUser?.value || "").trim();
  if (!username) {
    if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = "Enter a username.";
    return null;
  }
  if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = "Checking…";
  try {
    const data = await adminApi("/api/users/lookup", { username });
    if (!data?.ok || !data.exists) {
      if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = data?.error || "Username not found.";
      return null;
    }
    if (data.banned) {
      if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = "That account is banned.";
      return null;
    }
    if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = `Found: ${data.username}`;
    return data;
  } catch {
    if (ui.inboxLookupMsg) ui.inboxLookupMsg.textContent = "Network error.";
    return null;
  }
}

async function sendInboxCompose() {
  if (!authState.token) return;
  const found = await lookupInboxUser();
  if (!found) return;
  const body = String(ui.inboxComposeBody?.value || "").trim();
  if (!body) {
    if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = "Write a message first.";
    return;
  }
  const safety = scanChatMessageClient(body);
  if (!safety.ok) {
    if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = safety.error;
    return;
  }
  if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = "Sending…";
  try {
    const data = await adminApi("/api/inbox/send", {
      toUsername: found.usernameKey || found.username,
      body,
    });
    if (!data?.ok) {
      if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = data?.error || "Send failed.";
      return;
    }
    if (ui.inboxComposeBody) ui.inboxComposeBody.value = "";
    if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = "Sent.";
    openInboxThread(data.withUsernameKey || found.usernameKey || found.username, {
      displayName: data.withUsername || found.username,
    });
  } catch {
    if (ui.inboxComposeMsg) ui.inboxComposeMsg.textContent = "Network error.";
  }
}

function renderInboxMessages(messages) {
  const box = ui.inboxMessages;
  if (!box) return;
  box.innerHTML = "";
  const rows = Array.isArray(messages) ? messages : [];
  rows.forEach((m) => {
    const div = document.createElement("div");
    div.className = `inbox-bubble ${m.mine ? "mine" : "theirs"}`;
    const text = document.createElement("div");
    text.textContent = m.body || "";
    const meta = document.createElement("span");
    meta.className = "inbox-bubble-meta";
    meta.textContent = formatInboxTime(m.createdAt);
    div.append(text, meta);
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

async function openInboxThread(withUsername, { quiet = false, displayName = "" } = {}) {
  if (!authState.token || !withUsername) return;
  inboxSelectedUser = withUsername;
  inboxSelectedDisplay = displayName || withUsername;
  showInboxPane("thread");
  if (ui.inboxThreadTitle) ui.inboxThreadTitle.textContent = inboxSelectedDisplay;
  if (ui.inboxThreadAvatar) ui.inboxThreadAvatar.textContent = inboxInitials(inboxSelectedDisplay);
  if (!quiet && ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Loading…";
  try {
    const data = await adminApi("/api/inbox/thread", { withUsername });
    if (!data?.ok) {
      if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = data?.error || "Could not load chat.";
      return;
    }
    inboxSelectedDisplay = data.withUsername || inboxSelectedDisplay;
    if (ui.inboxThreadTitle) ui.inboxThreadTitle.textContent = inboxSelectedDisplay;
    if (ui.inboxThreadAvatar) ui.inboxThreadAvatar.textContent = inboxInitials(inboxSelectedDisplay);
    renderInboxMessages(data.messages);
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "";
    refreshInboxBadge();
  } catch {
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Network error.";
  }
}

async function sendInboxReply() {
  if (!authState.token || !inboxSelectedUser) return;
  const body = String(ui.inboxReplyBody?.value || "").trim();
  if (!body) {
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Write a reply first.";
    return;
  }
  const safety = scanChatMessageClient(body);
  if (!safety.ok) {
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = safety.error;
    return;
  }
  if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Sending…";
  try {
    const data = await adminApi("/api/inbox/send", {
      toUsername: inboxSelectedUser,
      body,
    });
    if (!data?.ok) {
      if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = data?.error || "Send failed.";
      return;
    }
    if (ui.inboxReplyBody) ui.inboxReplyBody.value = "";
    await openInboxThread(inboxSelectedUser, {
      quiet: true,
      displayName: inboxSelectedDisplay,
    });
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "";
  } catch {
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Network error.";
  }
}

async function reportInboxPlayer() {
  if (!authState.token || !inboxSelectedUser) return;
  const name = inboxSelectedDisplay || inboxSelectedUser;
  if (!window.confirm(`Report ${name} for abusive chat?`)) return;
  if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Sending report…";
  try {
    const data = await adminApi("/api/tickets", {
      category: "report",
      reason: "harassment",
      source: "chat",
      reportedPlayer: name,
      reportedKey: inboxSelectedUser,
      reporterKey: authState.username,
      subject: `Chat report: ${name}`,
      message: `Reported ${name} from Inbox chat for abusive or unsafe messaging.`,
    });
    if (!data?.ok) {
      if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = data?.error || "Report failed.";
      return;
    }
    if (ui.inboxThreadMsg) {
      ui.inboxThreadMsg.textContent = "Report sent. An admin will review it.";
    }
  } catch {
    if (ui.inboxThreadMsg) ui.inboxThreadMsg.textContent = "Network error.";
  }
}

let ticketNoticeQueue = [];
let ticketNoticeShowing = null;
let ticketNoticeTimer = null;

function showTicketNoticePopup(notice) {
  if (!notice || !ui.ticketNoticeOverlay) return;
  ticketNoticeShowing = notice;
  if (ui.ticketNoticeTitle) {
    ui.ticketNoticeTitle.textContent =
      notice.status === "resolved" ? "TICKET RESOLVED" : "TICKET CLOSED";
  }
  if (ui.ticketNoticeSubject) {
    ui.ticketNoticeSubject.textContent = notice.subject || "Your ticket";
  }
  if (ui.ticketNoticeBody) {
    ui.ticketNoticeBody.textContent = `Update from admin: ${notice.resolution || "No action taken"}`;
  }
  showOverlay(ui.ticketNoticeOverlay);
  setStagePlaying(false);
}

async function dismissTicketNotice() {
  const notice = ticketNoticeShowing;
  hideOverlay(ui.ticketNoticeOverlay);
  ticketNoticeShowing = null;
  if (notice?.id && authState.token) {
    try {
      await adminApi("/api/tickets/ack", { noticeId: notice.id });
    } catch {
      /* ignore */
    }
  }
  if (ticketNoticeQueue.length) {
    const next = ticketNoticeQueue.shift();
    setTimeout(() => showTicketNoticePopup(next), 250);
  }
}

async function pollTicketNotices() {
  if (!authState.token || !location.host) return;
  if (ticketNoticeShowing || (ui.ticketNoticeOverlay && !ui.ticketNoticeOverlay.classList.contains("hidden"))) {
    return;
  }
  try {
    const data = await adminApi("/api/tickets/notices");
    if (!data?.ok || !Array.isArray(data.notices) || !data.notices.length) return;
    const pendingIds = new Set([
      ...(ticketNoticeShowing ? [ticketNoticeShowing.id] : []),
      ...ticketNoticeQueue.map((n) => n.id),
    ]);
    const fresh = data.notices.filter((n) => n && n.id && !pendingIds.has(n.id));
    if (!fresh.length) return;
    ticketNoticeQueue.push(...fresh);
    if (!ticketNoticeShowing) {
      const next = ticketNoticeQueue.shift();
      showTicketNoticePopup(next);
    }
  } catch {
    /* ignore */
  }
}

function startTicketNoticePolling() {
  if (ticketNoticeTimer) return;
  pollTicketNotices();
  ticketNoticeTimer = setInterval(pollTicketNotices, 20000);
}

function updateAdminVisibility() {
  if (!ui.btnAdmin) return;
  const show = isAdmin();
  ui.btnAdmin.classList.toggle("hidden", !show);
  ui.btnAdmin.setAttribute("aria-hidden", show ? "false" : "true");
  if (show) {
    loadAbilities();
    bindAdminControls();
  } else {
    hideOverlay(ui.adminOverlay);
    hideOverlay(ui.passkeyOverlay);
  }
  refreshInboxBadge();
}

function initAdminUi() {
  updateAdminVisibility();
}

function openAdminOrPasskey() {
  if (isAdmin()) openAdmin();
}

function equippedForSide(side) {
  const mine = mySide();
  if (side === mine) return save.equipped;
  if (net.opponentCosmetics) return net.opponentCosmetics;
  return { paddle: "white", table: "classic" };
}

function drawTableHalf(side) {
  if (isBossMode() && side === "p2") {
    drawBossTableHalf();
    return;
  }
  const eq = equippedForSide(side);
  const style = shopItem("table", eq.table);
  if (style.id === "classic") return;
  const halfW = table.w / 2;
  const x = side === "p1" ? table.x : table.x + halfW;
  const alpha = style.chaos || style.survival || style.boss ? 0.68 : style.legendary || style.secret ? 0.62 : style.epic ? 0.58 : style.price >= 20 ? 0.5 : 0.38;
  drawCosmeticFill(ctx, style, x, table.y, halfW, table.h, alpha);
}

function drawPaddleRect(p, side) {
  const h = effectivePaddleH(side);
  if (isBossMode() && side === "p2") {
    drawBossPaddle(p, h);
    return;
  }
  if (isBossMode() && side === "p1" && s.boss.brokenPlayerT > 0) return;
  const eq = equippedForSide(side);
  const style = shopItem("paddle", eq.paddle);
  drawCosmeticFill(ctx, style, p.x, p.y, paddle.w, h, 1);
  if (isLightTheme()) {
    ctx.strokeStyle = "rgba(24, 24, 27, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, paddle.w - 1, h - 1);
  }
  if (side === "p1" && isBossMode() && s.boss?.powers?.ironT > 0) {
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(cosmeticTime() * 8) * 0.15;
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(p.x - 2, p.y - 2, paddle.w + 4, h + 4);
    ctx.restore();
  }
  if (side === "p1" && s.mode === "local" && s.ability.armed) {
    drawFirePaddle(p.x, p.y, paddle.w, h);
  }
}

function drawFirePaddle(x, y, w, h) {
  const t = cosmeticTime();
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const flicker = Math.sin(t * 10 + i * 1.7) * 0.5 + 0.5;
    const fx = x + w * 0.5 + (Math.sin(t * 6.5 + i) * w * 0.35);
    const fy = y + h * (0.1 + (i / 10) * 0.8);
    const r = 4 + flicker * 7;
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, `rgba(255,255,200,${0.55 + flicker * 0.35})`);
    g.addColorStop(0.35, `rgba(255,140,0,${0.4 + flicker * 0.25})`);
    g.addColorStop(1, "rgba(180,20,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.55 + Math.sin(t * 7) * 0.2;
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function resetAbility() {
  s.ability.parries = 0;
  s.ability.ready = false;
  s.ability.armed = false;
  s.ability.smashing = false;
  s.ability.breakFx = null;
  s.ability.flames = [];
  updateAbilityUI();
}

function updateAbilityUI() {
  if (!ui.abilityBar) return;
  const show = s.mode === "local" && !s.gameOver && !isCupPongMode();
  ui.abilityBar.classList.toggle("hidden", !show);
  if (!show) return;
  const pct = Math.min(100, (s.ability.parries / PARRY_CHARGE_NEED) * 100);
  if (ui.abilityFill) ui.abilityFill.style.width = `${pct}%`;
  ui.abilityBar.classList.toggle("ready", s.ability.ready && !s.ability.armed);
  ui.abilityBar.classList.toggle("armed", s.ability.armed);
  if (ui.abilityLabel) {
    if (s.ability.armed) ui.abilityLabel.textContent = "FIRE SMASH ARMED";
    else if (s.ability.ready) ui.abilityLabel.textContent = "FIRE SMASH READY";
    else ui.abilityLabel.textContent = `PARRY ${s.ability.parries}/${PARRY_CHARGE_NEED}`;
  }
  if (ui.abilityHint) {
    if (s.ability.armed) {
      ui.abilityHint.textContent = "Next hit shatters the bot bat & scores!";
    } else if (s.ability.ready) {
      ui.abilityHint.textContent = isTouchDevice
        ? "Tap the court to ignite your paddle"
        : "Click the court to ignite your paddle";
    } else {
      ui.abilityHint.textContent = "Land 10 hits to charge Fire Smash";
    }
  }
}

function tryActivateFireSmash() {
  if (s.mode !== "local" || s.gameOver || !s.running) return false;
  if (!s.ability.ready || s.ability.armed) return false;
  s.ability.armed = true;
  s.ability.ready = false;
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(220, t, 0.12, "sawtooth", 0.12);
  playTone(440, t + 0.08, 0.14, "square", 0.1);
  playTone(880, t + 0.16, 0.18, "triangle", 0.12);
  ui.status.textContent = "Fire Smash armed!";
  updateAbilityUI();
  return true;
}

function registerParry() {
  if (s.mode !== "local" || s.gameOver) return;
  if (s.ability.armed || s.ability.ready) return;
  s.ability.parries = Math.min(PARRY_CHARGE_NEED, s.ability.parries + 1);
  if (s.ability.parries >= PARRY_CHARGE_NEED) {
    s.ability.ready = true;
    s.ability.parries = PARRY_CHARGE_NEED;
    ui.status.textContent = isTouchDevice
      ? "Fire Smash ready — tap to ignite!"
      : "Fire Smash ready — click to ignite!";
  }
  updateAbilityUI();
}

function playFireSmashSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(180, t, 0.08, "sawtooth", 0.18);
  playTone(520, t + 0.04, 0.1, "square", 0.14);
  playTone(1200, t + 0.1, 0.16, "triangle", 0.16);
  playTone(1800, t + 0.18, 0.2, "sine", 0.1);
}

function playBatBreakSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(140, t, 0.12, "sawtooth", 0.22);
  playTone(90, t + 0.04, 0.18, "square", 0.16);
  playTone(320, t + 0.08, 0.1, "triangle", 0.12);
  playTone(60, t + 0.12, 0.22, "sawtooth", 0.14);
}

function spawnBatBreakFx() {
  const shards = [];
  const cx = s.p2.x + paddle.w / 2;
  const cy = s.p2.y + paddle.h / 2;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
    const sp = 180 + Math.random() * 420;
    shards.push({
      x: cx + (Math.random() - 0.5) * paddle.w,
      y: cy + (Math.random() - 0.5) * paddle.h,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 80,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 12,
      w: 4 + Math.random() * 10,
      h: 3 + Math.random() * 8,
      life: 0.55 + Math.random() * 0.35,
      t: 0,
    });
  }
  s.ability.breakFx = { shards, flash: 0.28 };
  s.p2.broken = true;
}

function drawBatBreakFx() {
  const fx = s.ability.breakFx;
  if (!fx) return;
  if (fx.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.flash * 2.2);
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(s.p2.x - 18, table.y, paddle.w + 36, table.h);
    ctx.restore();
  }
  for (const sh of fx.shards) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    ctx.globalAlpha = Math.max(0, 1 - sh.t / sh.life);
    ctx.fillStyle = sh.t < 0.08 ? "#fbbf24" : "#ffffff";
    ctx.fillRect(-sh.w / 2, -sh.h / 2, sh.w, sh.h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function updateBatBreakFx(dt) {
  const fx = s.ability.breakFx;
  if (!fx) return;
  if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt);
  for (const sh of fx.shards) {
    sh.t += dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.vy += 900 * dt;
    sh.rot += sh.spin * dt;
  }
  fx.shards = fx.shards.filter((sh) => sh.t < sh.life);
  if (!fx.shards.length && fx.flash <= 0) {
    s.ability.breakFx = null;
    s.p2.broken = false;
  }
}

function scorePointLocal(scorer) {
  if (s.gameOver) return;
  bumpChaosShake(10);
  if (isBossMode()) {
    clearBossReflectBoost();
    if (scorer === "p1") {
      s.p1.score += 1;
      ui.p1.textContent = String(s.p1.score);
      scoreFx("p1");
      damageBoss();
    } else {
      if (tryConsumeBossBlock()) {
        resetBall(false);
        ui.status.textContent = "BLOCKED! — " + serveHint();
        return;
      }
      resetAbility();
      playPointLossSound();
      s.p2.score += 1;
      ui.p2.textContent = String(s.p2.score);
      scoreFx("p2", { silent: true });
      damagePlayer();
    }
    return;
  }
  if (scorer === "p1") {
    s.p1.score += 1;
    ui.p1.textContent = String(s.p1.score);
    scoreFx("p1");
    if (!isSurvivalMode() && s.p1.score >= SCORE_LIMIT) endGame("p1");
    else {
      resetBall(true);
      if (isSurvivalMode()) updateSurvivalHud();
    }
  } else {
    resetAbility();
    playPointLossSound();
    s.p2.score += 1;
    ui.p2.textContent = String(s.p2.score);
    scoreFx("p2", { silent: true });
    if (!isSurvivalMode() && s.p2.score >= SCORE_LIMIT) endGame("p2");
    else {
      resetBall(false);
      if (isSurvivalMode()) updateSurvivalHud();
      else ui.status.textContent = "Parry charge lost — " + serveHint();
    }
  }
}

function breakBotBatAndScore() {
  if (s.mode !== "local" || s.gameOver || !s.ability.smashing) return;
  s.ability.smashing = false;
  s.ability.armed = false;
  s.ability.parries = 0;
  s.ability.ready = false;
  s.running = false;
  spawnBatBreakFx();
  playBatBreakSound();
  ui.status.textContent = "BAT SHATTERED!";
  updateAbilityUI();
  scorePointLocal("p1");
}

const stageEl = document.querySelector(".stage");
const isTouchDevice =
  "ontouchstart" in window || matchMedia("(pointer: coarse)").matches;

function isIOSLike() {
  const ua = navigator.userAgent || "";
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isPhoneLike() {
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  // Short landscape viewports (phones / emulators) always use phone layout
  if (shortSide <= 520 && longSide <= 980) return true;
  if (typeof window.matchMedia === "function") {
    if (matchMedia("(hover: none) and (pointer: coarse)").matches) {
      if (shortSide <= 700 || longSide <= 980) return true;
    }
    // Narrow touch / mobile browser chrome
    if (matchMedia("(max-width: 700px)").matches && isTouchDevice) return true;
  }
  const ua = navigator.userAgent || "";
  if (/Android.+Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  if (isIOSLike() && Math.min(window.screen.width, window.screen.height) <= 820) return true;
  return isTouchDevice && shortSide <= 700;
}

function serveHint() {
  return isTouchDevice ? "Tap to serve" : "Click to serve";
}

function controlHint() {
  return isTouchDevice
    ? "Drag finger on court to move paddle. Tap to serve."
    : "Move mouse up/down to control paddle. Click to serve.";
}

const ui = {
  hint: document.getElementById("hint"),
  titleEl: document.getElementById("titleEl"),
  nameOverlay: document.getElementById("nameOverlay"),
  nameInput: document.getElementById("nameInput"),
  nameMsg: document.getElementById("nameMsg"),
  btnNameSubmit: document.getElementById("btnNameSubmit"),
  btnChangeName: document.getElementById("btnChangeName"),
  p1: document.getElementById("p1"),
  p2: document.getElementById("p2"),
  p1Label: document.getElementById("p1Label"),
  p2Label: document.getElementById("p2Label"),
  status: document.getElementById("status"),
  survivalTimer: document.getElementById("survivalTimer"),
  bossHud: document.getElementById("bossHud"),
  bossHudYouFill: document.getElementById("bossHudYouFill"),
  bossHudBossFill: document.getElementById("bossHudBossFill"),
  bossHudYouHp: document.getElementById("bossHudYouHp"),
  bossHudBossHp: document.getElementById("bossHudBossHp"),
  bossHudName: document.getElementById("bossHudName"),
  bossPowerBar: document.getElementById("bossPowerBar"),
  btnBossPowerBlock: document.getElementById("btnBossPowerBlock"),
  btnBossPowerIron: document.getElementById("btnBossPowerIron"),
  btnBossPowerTimeslow: document.getElementById("btnBossPowerTimeslow"),
  btnBossPowerReflect: document.getElementById("btnBossPowerReflect"),
  bossPowerMetaBlock: document.getElementById("bossPowerMetaBlock"),
  bossPowerMetaIron: document.getElementById("bossPowerMetaIron"),
  bossPowerMetaTimeslow: document.getElementById("bossPowerMetaTimeslow"),
  bossPowerMetaReflect: document.getElementById("bossPowerMetaReflect"),
  menuOverlay: document.getElementById("menuOverlay"),
  botModesOverlay: document.getElementById("botModesOverlay"),
  classicGamesOverlay: document.getElementById("classicGamesOverlay"),
  campaignHubOverlay: document.getElementById("campaignHubOverlay"),
  arcadeHubOverlay: document.getElementById("arcadeHubOverlay"),
  challengeMapOverlay: document.getElementById("challengeMapOverlay"),
  btnCatClassicGames: document.getElementById("btnCatClassicGames"),
  btnCatCampaign: document.getElementById("btnCatCampaign"),
  btnCatArcade: document.getElementById("btnCatArcade"),
  btnClassicGamesBack: document.getElementById("btnClassicGamesBack"),
  btnCampaignHubBack: document.getElementById("btnCampaignHubBack"),
  btnArcadeHubBack: document.getElementById("btnArcadeHubBack"),
  btnModeChallenge: document.getElementById("btnModeChallenge"),
  btnChallengeMapBack: document.getElementById("btnChallengeMapBack"),
  btnChallengeRegionBack: document.getElementById("btnChallengeRegionBack"),
  challengeWorldView: document.getElementById("challengeWorldView"),
  challengeRegionView: document.getElementById("challengeRegionView"),
  challengeRegionDots: document.getElementById("challengeRegionDots"),
  challengeRegionTitle: document.getElementById("challengeRegionTitle"),
  challengeRegionRoster: document.getElementById("challengeRegionRoster"),
  challengeMapLead: document.getElementById("challengeMapLead"),
  btnModeClassic: document.getElementById("btnModeClassic"),
  btnModeChaos: document.getElementById("btnModeChaos"),
  btnModeSurvival: document.getElementById("btnModeSurvival"),
  btnModeBoss: document.getElementById("btnModeBoss"),
  btnBotModesBack: document.getElementById("btnBotModesBack"),
  btnProfile: document.getElementById("btnProfile"),
  profileOverlay: document.getElementById("profileOverlay"),
  profileAvatarPreview: document.getElementById("profileAvatarPreview"),
  profileNameInput: document.getElementById("profileNameInput"),
  btnProfileSaveName: document.getElementById("btnProfileSaveName"),
  profileXpLabel: document.getElementById("profileXpLabel"),
  profileXpFill: document.getElementById("profileXpFill"),
  profileXpSub: document.getElementById("profileXpSub"),
  profileAccountStatus: document.getElementById("profileAccountStatus"),
  profileAuthGuest: document.getElementById("profileAuthGuest"),
  profileAuthSignedIn: document.getElementById("profileAuthSignedIn"),
  profileSignedInText: document.getElementById("profileSignedInText"),
  authUsername: document.getElementById("authUsername"),
  authPassword: document.getElementById("authPassword"),
  btnAuthRegister: document.getElementById("btnAuthRegister"),
  btnAuthLogin: document.getElementById("btnAuthLogin"),
  btnAuthLogout: document.getElementById("btnAuthLogout"),
  btnForgotPassword: document.getElementById("btnForgotPassword"),
  forgotPasswordOverlay: document.getElementById("forgotPasswordOverlay"),
  forgotUsername: document.getElementById("forgotUsername"),
  btnForgotRequest: document.getElementById("btnForgotRequest"),
  resetPasswordOverlay: document.getElementById("resetPasswordOverlay"),
  resetPasswordLead: document.getElementById("resetPasswordLead"),
  resetNewPassword: document.getElementById("resetNewPassword"),
  resetConfirmPassword: document.getElementById("resetConfirmPassword"),
  btnForgotSubmitNew: document.getElementById("btnForgotSubmitNew"),
  forgotPasswordMsg: document.getElementById("forgotPasswordMsg"),
  resetPasswordMsg: document.getElementById("resetPasswordMsg"),
  btnForgotPasswordBack: document.getElementById("btnForgotPasswordBack"),
  btnResetPasswordLater: document.getElementById("btnResetPasswordLater"),
  profileAuthMsg: document.getElementById("profileAuthMsg"),
  profileAvatarGrid: document.getElementById("profileAvatarGrid"),
  profileAvatarFile: document.getElementById("profileAvatarFile"),
  btnProfileCustomize: document.getElementById("btnProfileCustomize"),
  btnProfileBack: document.getElementById("btnProfileBack"),
  profileViewOverlay: document.getElementById("profileViewOverlay"),
  profileViewTitle: document.getElementById("profileViewTitle"),
  profileViewAvatar: document.getElementById("profileViewAvatar"),
  profileViewName: document.getElementById("profileViewName"),
  profileViewKind: document.getElementById("profileViewKind"),
  profileViewXpLabel: document.getElementById("profileViewXpLabel"),
  profileViewXpFill: document.getElementById("profileViewXpFill"),
  profileViewXpSub: document.getElementById("profileViewXpSub"),
  profileViewRank: document.getElementById("profileViewRank"),
  profileViewBio: document.getElementById("profileViewBio"),
  profileViewAccomplishments: document.getElementById("profileViewAccomplishments"),
  btnProfileViewBack: document.getElementById("btnProfileViewBack"),
  modeSoonOverlay: document.getElementById("modeSoonOverlay"),
  modeSoonLead: document.getElementById("modeSoonLead"),
  btnModeSoonUpdates: document.getElementById("btnModeSoonUpdates"),
  btnModeSoonBack: document.getElementById("btnModeSoonBack"),
  chaosLevelOverlay: document.getElementById("chaosLevelOverlay"),
  chaosLevelGrid: document.getElementById("chaosLevelGrid"),
  chaosLevelHint: document.getElementById("chaosLevelHint"),
  btnChaosLevelBack: document.getElementById("btnChaosLevelBack"),
  survivalLevelOverlay: document.getElementById("survivalLevelOverlay"),
  survivalLevelGrid: document.getElementById("survivalLevelGrid"),
  survivalLevelHint: document.getElementById("survivalLevelHint"),
  btnSurvivalLevelBack: document.getElementById("btnSurvivalLevelBack"),
  bossHubOverlay: document.getElementById("bossHubOverlay"),
  btnBossHubLevels: document.getElementById("btnBossHubLevels"),
  btnBossHubShop: document.getElementById("btnBossHubShop"),
  btnBossHubBack: document.getElementById("btnBossHubBack"),
  bossShopOverlay: document.getElementById("bossShopOverlay"),
  bossShopList: document.getElementById("bossShopList"),
  bossShopHint: document.getElementById("bossShopHint"),
  bossShopPoints: document.getElementById("bossShopPoints"),
  btnBossShopBack: document.getElementById("btnBossShopBack"),
  bossLevelOverlay: document.getElementById("bossLevelOverlay"),
  bossLevelGrid: document.getElementById("bossLevelGrid"),
  bossLevelHint: document.getElementById("bossLevelHint"),
  btnBossLevelBack: document.getElementById("btnBossLevelBack"),
  cupPongLevelOverlay: document.getElementById("cupPongLevelOverlay"),
  cupPongLevelGrid: document.getElementById("cupPongLevelGrid"),
  cupPongLevelHint: document.getElementById("cupPongLevelHint"),
  btnModeCupPong: document.getElementById("btnModeCupPong"),
  btnCupPongLevelBack: document.getElementById("btnCupPongLevelBack"),
  botLevelOverlay: document.getElementById("botLevelOverlay"),
  botLevelGrid: document.getElementById("botLevelGrid"),
  botLevelHint: document.getElementById("botLevelHint"),
  btnBotLevelBack: document.getElementById("btnBotLevelBack"),
  lobbyOverlay: document.getElementById("lobbyOverlay"),
  lobbyStatus: document.getElementById("lobbyStatus"),
  lobbyActions: document.getElementById("lobbyActions"),
  onlineHubOverlay: document.getElementById("onlineHubOverlay"),
  btnOnlineScoreboard: document.getElementById("btnOnlineScoreboard"),
  btnOnlineCreateRoom: document.getElementById("btnOnlineCreateRoom"),
  btnOnlineSearch: document.getElementById("btnOnlineSearch"),
  btnOnlineHubBack: document.getElementById("btnOnlineHubBack"),
  scoreboardOverlay: document.getElementById("scoreboardOverlay"),
  onlineScoreboardList: document.getElementById("onlineScoreboardList"),
  onlineScoreboardMsg: document.getElementById("onlineScoreboardMsg"),
  btnScoreboardRefresh: document.getElementById("btnScoreboardRefresh"),
  btnScoreboardBack: document.getElementById("btnScoreboardBack"),
  onlineSearchOverlay: document.getElementById("onlineSearchOverlay"),
  searchLobbyActions: document.getElementById("searchLobbyActions"),
  searchLobbyStatus: document.getElementById("searchLobbyStatus"),
  btnOnlineSearchBack: document.getElementById("btnOnlineSearchBack"),
  searchPanel: document.getElementById("searchPanel"),
  lobbySearchStatus: document.getElementById("lobbySearchStatus"),
  lobbySearchTimer: document.getElementById("lobbySearchTimer"),
  btnSearch: document.getElementById("btnSearch"),
  btnCancelSearch: document.getElementById("btnCancelSearch"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  gameOver: document.getElementById("gameOver"),
  gameOverTitle: document.getElementById("gameOverTitle"),
  gameOverReward: document.getElementById("gameOverReward"),
  gameOverXp: document.getElementById("gameOverXp"),
  gameOverScore: document.getElementById("gameOverScore"),
  gameOverRematchMsg: document.getElementById("gameOverRematchMsg"),
  levelUpOverlay: document.getElementById("levelUpOverlay"),
  levelUpRank: document.getElementById("levelUpRank"),
  levelUpSub: document.getElementById("levelUpSub"),
  levelUpUnlocksWrap: document.getElementById("levelUpUnlocksWrap"),
  levelUpUnlocks: document.getElementById("levelUpUnlocks"),
  levelUpEmpty: document.getElementById("levelUpEmpty"),
  btnLevelUpContinue: document.getElementById("btnLevelUpContinue"),
  playAgain: document.getElementById("playAgain"),
  btnNextLevel: document.getElementById("btnNextLevel"),
  backToMenu: document.getElementById("backToMenu"),
  btnResign: document.getElementById("btnResign"),
  abilityBar: document.getElementById("abilityBar"),
  abilityLabel: document.getElementById("abilityLabel"),
  abilityFill: document.getElementById("abilityFill"),
  abilityHint: document.getElementById("abilityHint"),
  btnLocal: document.getElementById("btnLocal"),
  btnOnline: document.getElementById("btnOnline"),
  btnCreateRoom: document.getElementById("btnCreateRoom"),
  btnJoinRoom: document.getElementById("btnJoinRoom"),
  btnBackMenu: document.getElementById("btnBackMenu"),
  btnCustomize: document.getElementById("btnCustomize"),
  btnCustomizeBack: document.getElementById("btnCustomizeBack"),
  customizeOverlay: document.getElementById("customizeOverlay"),
  shopHubOverlay: document.getElementById("shopHubOverlay"),
  btnShopHubPong: document.getElementById("btnShopHubPong"),
  btnShopHubCup: document.getElementById("btnShopHubCup"),
  btnShopHubBack: document.getElementById("btnShopHubBack"),
  shopTitle: document.getElementById("shopTitle"),
  shopHint: document.getElementById("shopHint"),
  shopTabs: document.getElementById("shopTabs"),
  shopPoints: document.getElementById("shopPoints"),
  shopGrid: document.getElementById("shopGrid"),
  shopMsg: document.getElementById("shopMsg"),
  btnSettings: document.getElementById("btnSettings"),
  btnSettingsBack: document.getElementById("btnSettingsBack"),
  settingsOverlay: document.getElementById("settingsOverlay"),
  btnUpdates: document.getElementById("btnUpdates"),
  btnUpdatesBack: document.getElementById("btnUpdatesBack"),
  updatesOverlay: document.getElementById("updatesOverlay"),
  masterClearOverlay: document.getElementById("masterClearOverlay"),
  confettiCanvas: document.getElementById("confettiCanvas"),
  masterClearTitle: document.getElementById("masterClearTitle"),
  masterClearLead: document.getElementById("masterClearLead"),
  masterClearMsg: document.getElementById("masterClearMsg"),
  masterClearReward: document.getElementById("masterClearReward"),
  masterClearXp: document.getElementById("masterClearXp"),
  masterClearScore: document.getElementById("masterClearScore"),
  btnMasterPlayAgain: document.getElementById("btnMasterPlayAgain"),
  btnMasterMenu: document.getElementById("btnMasterMenu"),
  btnFullscreen: document.getElementById("btnFullscreen"),
  btnMusicToggle: document.getElementById("btnMusicToggle"),
  btnThemeDark: document.getElementById("btnThemeDark"),
  btnThemeLight: document.getElementById("btnThemeLight"),
  themeSwitch: document.getElementById("themeSwitch"),
  fullscreenHint: document.getElementById("fullscreenHint"),
  settingsMsg: document.getElementById("settingsMsg"),
  musicTrackGrid: document.getElementById("musicTrackGrid"),
  phoneZoomRow: document.getElementById("phoneZoomRow"),
  phoneZoomValue: document.getElementById("phoneZoomValue"),
  btnZoomOut: document.getElementById("btnZoomOut"),
  btnZoomIn: document.getElementById("btnZoomIn"),
  btnRedeemCode: document.getElementById("btnRedeemCode"),
  redeemPanel: document.getElementById("redeemPanel"),
  redeemInput: document.getElementById("redeemInput"),
  btnRedeemSubmit: document.getElementById("btnRedeemSubmit"),
  redeemMsg: document.getElementById("redeemMsg"),
  btnAdmin: document.getElementById("btnAdmin"),
  btnAdminBack: document.getElementById("btnAdminBack"),
  btnAdminTools: document.getElementById("btnAdminTools"),
  btnAdminPlayers: document.getElementById("btnAdminPlayers"),
  btnAdminReports: document.getElementById("btnAdminReports"),
  adminToolsOverlay: document.getElementById("adminToolsOverlay"),
  btnAdminToolsBack: document.getElementById("btnAdminToolsBack"),
  adminPlayersOverlay: document.getElementById("adminPlayersOverlay"),
  adminPlayersList: document.getElementById("adminPlayersList"),
  adminPlayersMsg: document.getElementById("adminPlayersMsg"),
  btnAdminPlayersRefresh: document.getElementById("btnAdminPlayersRefresh"),
  btnAdminPlayersBack: document.getElementById("btnAdminPlayersBack"),
  adminPlayerDetailOverlay: document.getElementById("adminPlayerDetailOverlay"),
  adminPlayerTitle: document.getElementById("adminPlayerTitle"),
  adminPlayerSub: document.getElementById("adminPlayerSub"),
  adminPlayerAvatar: document.getElementById("adminPlayerAvatar"),
  adminPlayerName: document.getElementById("adminPlayerName"),
  adminPlayerKind: document.getElementById("adminPlayerKind"),
  adminPlayerStats: document.getElementById("adminPlayerStats"),
  adminPlayerAmount: document.getElementById("adminPlayerAmount"),
  adminPlayerMsg: document.getElementById("adminPlayerMsg"),
  adminPlayerControls: document.getElementById("adminPlayerControls"),
  adminDaddyMsg: document.getElementById("adminDaddyMsg"),
  adminBanDuration: document.getElementById("adminBanDuration"),
  adminBanDurationLabel: document.getElementById("adminBanDurationLabel"),
  btnAdminGivePts: document.getElementById("btnAdminGivePts"),
  btnAdminRemovePts: document.getElementById("btnAdminRemovePts"),
  btnAdminGiveXp: document.getElementById("btnAdminGiveXp"),
  btnAdminRemoveXp: document.getElementById("btnAdminRemoveXp"),
  btnAdminKickPlayer: document.getElementById("btnAdminKickPlayer"),
  btnAdminBanPlayer: document.getElementById("btnAdminBanPlayer"),
  btnAdminUnbanPlayer: document.getElementById("btnAdminUnbanPlayer"),
  adminRoleSection: document.getElementById("adminRoleSection"),
  adminRoleActions: document.getElementById("adminRoleActions"),
  btnAdminGrantAdmin: document.getElementById("btnAdminGrantAdmin"),
  btnAdminRevokeAdmin: document.getElementById("btnAdminRevokeAdmin"),
  btnAdminPlayerDetailBack: document.getElementById("btnAdminPlayerDetailBack"),
  adminReportsOverlay: document.getElementById("adminReportsOverlay"),
  adminReportsList: document.getElementById("adminReportsList"),
  adminReportsMsg: document.getElementById("adminReportsMsg"),
  btnAdminReportsRefresh: document.getElementById("btnAdminReportsRefresh"),
  btnAdminReportsBack: document.getElementById("btnAdminReportsBack"),
  adminReportDetailOverlay: document.getElementById("adminReportDetailOverlay"),
  adminReportTitle: document.getElementById("adminReportTitle"),
  adminReportMeta: document.getElementById("adminReportMeta"),
  adminReportBody: document.getElementById("adminReportBody"),
  adminReportResolution: document.getElementById("adminReportResolution"),
  adminReportOutcome: document.getElementById("adminReportOutcome"),
  adminPasswordResetBox: document.getElementById("adminPasswordResetBox"),
  btnApprovePasswordReset: document.getElementById("btnApprovePasswordReset"),
  btnDenyPasswordReset: document.getElementById("btnDenyPasswordReset"),
  adminResetCodeMsg: document.getElementById("adminResetCodeMsg"),
  adminChatHistoryBox: document.getElementById("adminChatHistoryBox"),
  btnAdminCheckChat: document.getElementById("btnAdminCheckChat"),
  adminChatLog: document.getElementById("adminChatLog"),
  adminChatHistoryMsg: document.getElementById("adminChatHistoryMsg"),
  adminReportMsg: document.getElementById("adminReportMsg"),
  btnReportOpen: document.getElementById("btnReportOpen"),
  btnReportResolved: document.getElementById("btnReportResolved"),
  btnReportClosed: document.getElementById("btnReportClosed"),
  btnAdminReportDetailBack: document.getElementById("btnAdminReportDetailBack"),
  ticketNoticeOverlay: document.getElementById("ticketNoticeOverlay"),
  ticketNoticeTitle: document.getElementById("ticketNoticeTitle"),
  ticketNoticeSubject: document.getElementById("ticketNoticeSubject"),
  ticketNoticeBody: document.getElementById("ticketNoticeBody"),
  btnTicketNoticeOk: document.getElementById("btnTicketNoticeOk"),
  contactOverlay: document.getElementById("contactOverlay"),
  btnContact: document.getElementById("btnContact"),
  btnContactBack: document.getElementById("btnContactBack"),
  btnContactGoProfile: document.getElementById("btnContactGoProfile"),
  btnContactSubmit: document.getElementById("btnContactSubmit"),
  contactGuest: document.getElementById("contactGuest"),
  contactForm: document.getElementById("contactForm"),
  contactCategory: document.getElementById("contactCategory"),
  contactSubject: document.getElementById("contactSubject"),
  contactReported: document.getElementById("contactReported"),
  contactMessage: document.getElementById("contactMessage"),
  contactMsg: document.getElementById("contactMsg"),
  btnInbox: document.getElementById("btnInbox"),
  inboxOverlay: document.getElementById("inboxOverlay"),
  inboxBadge: document.getElementById("inboxBadge"),
  inboxGuest: document.getElementById("inboxGuest"),
  inboxSignedIn: document.getElementById("inboxSignedIn"),
  btnInboxGoProfile: document.getElementById("btnInboxGoProfile"),
  btnInboxBack: document.getElementById("btnInboxBack"),
  btnInboxRulesToggle: document.getElementById("btnInboxRulesToggle"),
  inboxRulesList: document.getElementById("inboxRulesList"),
  btnInboxNew: document.getElementById("btnInboxNew"),
  btnInboxRefresh: document.getElementById("btnInboxRefresh"),
  inboxListView: document.getElementById("inboxListView"),
  inboxThreadList: document.getElementById("inboxThreadList"),
  inboxListMsg: document.getElementById("inboxListMsg"),
  inboxComposeView: document.getElementById("inboxComposeView"),
  inboxLookupUser: document.getElementById("inboxLookupUser"),
  btnInboxLookup: document.getElementById("btnInboxLookup"),
  inboxLookupMsg: document.getElementById("inboxLookupMsg"),
  inboxComposeBody: document.getElementById("inboxComposeBody"),
  btnInboxSendNew: document.getElementById("btnInboxSendNew"),
  btnInboxComposeBack: document.getElementById("btnInboxComposeBack"),
  inboxComposeMsg: document.getElementById("inboxComposeMsg"),
  inboxThreadView: document.getElementById("inboxThreadView"),
  inboxThreadTitle: document.getElementById("inboxThreadTitle"),
  inboxThreadAvatar: document.getElementById("inboxThreadAvatar"),
  inboxMessages: document.getElementById("inboxMessages"),
  inboxReplyBody: document.getElementById("inboxReplyBody"),
  btnInboxReply: document.getElementById("btnInboxReply"),
  btnInboxThreadBack: document.getElementById("btnInboxThreadBack"),
  btnInboxReport: document.getElementById("btnInboxReport"),
  inboxThreadMsg: document.getElementById("inboxThreadMsg"),
  btnReportPlayer: document.getElementById("btnReportPlayer"),
  reportPlayerOverlay: document.getElementById("reportPlayerOverlay"),
  reportPlayerLead: document.getElementById("reportPlayerLead"),
  reportPlayerName: document.getElementById("reportPlayerName"),
  reportPlayerReason: document.getElementById("reportPlayerReason"),
  reportPlayerDetails: document.getElementById("reportPlayerDetails"),
  btnReportPlayerSubmit: document.getElementById("btnReportPlayerSubmit"),
  reportPlayerMsg: document.getElementById("reportPlayerMsg"),
  btnReportPlayerBack: document.getElementById("btnReportPlayerBack"),
  adminOverlay: document.getElementById("adminOverlay"),
  adminWelcome: document.getElementById("adminWelcome"),
  adminPoints: document.getElementById("adminPoints"),
  adminPointsInput: document.getElementById("adminPointsInput"),
  adminXp: document.getElementById("adminXp"),
  adminXpLevel: document.getElementById("adminXpLevel"),
  adminXpInput: document.getElementById("adminXpInput"),
  btnAdminAddPts: document.getElementById("btnAdminAddPts"),
  btnAdminSetPts: document.getElementById("btnAdminSetPts"),
  btnAdminAddXp: document.getElementById("btnAdminAddXp"),
  btnAdminSetXp: document.getElementById("btnAdminSetXp"),
  btnAdminUnlockAll: document.getElementById("btnAdminUnlockAll"),
  btnAdminMaxPts: document.getElementById("btnAdminMaxPts"),
  btnAdminMaxXp: document.getElementById("btnAdminMaxXp"),
  btnAdminUnlockLevels: document.getElementById("btnAdminUnlockLevels"),
  btnAdminUnlockChaos: document.getElementById("btnAdminUnlockChaos"),
  btnAdminUnlockSurvival: document.getElementById("btnAdminUnlockSurvival"),
  btnAdminUnlockBoss: document.getElementById("btnAdminUnlockBoss"),
  btnAdminUnlockCupPong: document.getElementById("btnAdminUnlockCupPong"),
  adminLevel: document.getElementById("adminLevel"),
  adminLevelInput: document.getElementById("adminLevelInput"),
  btnAdminSetLevel: document.getElementById("btnAdminSetLevel"),
  btnAdminResetScoreboard: document.getElementById("btnAdminResetScoreboard"),
  adminMsg: document.getElementById("adminMsg"),
  abMegaPaddle: document.getElementById("abMegaPaddle"),
  abFreeShop: document.getElementById("abFreeShop"),
  abSlowBot: document.getElementById("abSlowBot"),
  abPauseBot: document.getElementById("abPauseBot"),
  abBonusPts: document.getElementById("abBonusPts"),
  passkeyOverlay: document.getElementById("passkeyOverlay"),
  passkeyInput: document.getElementById("passkeyInput"),
  passkeyMsg: document.getElementById("passkeyMsg"),
  btnPasskeySubmit: document.getElementById("btnPasskeySubmit"),
  btnPasskeyCancel: document.getElementById("btnPasskeyCancel"),
};

let audioCtx = null;
let musicPlaying = false;
let musicPreviewing = false;
let musicTimer = null;
let musicStep = 0;
let musicGainNode = null;
let musicBlendFrom = 1;
let musicBlendTo = 1;
let musicBlendStart = 0;
const MUSIC_BLEND_MS = 1400;

const MUSIC_TRACKS = {
  arcade: {
    name: "Arcade Pulse",
    interval: 220,
    melody: [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23],
    bass: [130.81, 130.81, 146.83, 146.83],
    melodyType: "square",
    bassType: "triangle",
    melodyVol: 0.045,
    bassVol: 0.035,
  },
  neon: {
    name: "Neon Drift",
    interval: 260,
    melody: [220, 277.18, 329.63, 440, 392, 329.63, 277.18, 246.94],
    bass: [110, 110, 123.47, 98],
    melodyType: "sawtooth",
    bassType: "sine",
    melodyVol: 0.038,
    bassVol: 0.04,
    pad: [440, 554.37],
    padVol: 0.018,
  },
  ocean: {
    name: "Ocean Calm",
    interval: 320,
    melody: [196, 246.94, 293.66, 349.23, 329.63, 293.66, 246.94, 220],
    bass: [98, 98, 110, 87.31],
    melodyType: "sine",
    bassType: "triangle",
    melodyVol: 0.05,
    bassVol: 0.03,
    pad: [392, 493.88],
    padVol: 0.022,
  },
  storm: {
    name: "Storm Rush",
    interval: 180,
    melody: [311.13, 369.99, 466.16, 554.37, 466.16, 369.99, 349.23, 415.3],
    bass: [77.78, 92.5, 103.83, 92.5],
    melodyType: "square",
    bassType: "sawtooth",
    melodyVol: 0.042,
    bassVol: 0.028,
  },
  cuplounge: {
    name: "Cup Lounge",
    interval: 480,
    melody: [174.61, 196, 220, 246.94, 220, 196, 164.81, 196],
    bass: [87.31, 87.31, 98, 82.41],
    melodyType: "sine",
    bassType: "triangle",
    melodyVol: 0.018,
    bassVol: 0.014,
    pad: [349.23, 392, 440],
    padVol: 0.012,
  },
};

const PHONE_ZOOM_DEFAULT = 0.82;
const PHONE_ZOOM_MIN = 0.55;
const PHONE_ZOOM_MAX = 1.35;
const PHONE_PAN_LIMIT = 220;

const settings = {
  musicOn: true,
  musicTrack: "arcade",
  fullscreen: false,
  phoneZoom: PHONE_ZOOM_DEFAULT,
  theme: "dark",
};

let phonePanX = 0;
let phonePanY = 0;

function clampPhoneZoom(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return PHONE_ZOOM_DEFAULT;
  return Math.max(PHONE_ZOOM_MIN, Math.min(PHONE_ZOOM_MAX, n));
}

function clampPhonePan(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-PHONE_PAN_LIMIT, Math.min(PHONE_PAN_LIMIT, n));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.musicOn === "boolean") settings.musicOn = data.musicOn;
    if (data.musicTrack && MUSIC_TRACKS[data.musicTrack]) settings.musicTrack = data.musicTrack;
    if (typeof data.phoneZoom === "number") settings.phoneZoom = clampPhoneZoom(data.phoneZoom);
    if (data.theme === "light" || data.theme === "dark") settings.theme = data.theme;
  } catch {
    /* ignore */
  }
}

function persistSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        musicOn: settings.musicOn,
        musicTrack: settings.musicTrack,
        phoneZoom: clampPhoneZoom(settings.phoneZoom),
        theme: settings.theme === "light" ? "light" : "dark",
      })
    );
  } catch {
    /* ignore */
  }
}

function applyTheme() {
  const light = settings.theme === "light";
  if (light) document.body.dataset.theme = "light";
  else delete document.body.dataset.theme;
  const darkBtn = ui.btnThemeDark || document.getElementById("btnThemeDark");
  const lightBtn = ui.btnThemeLight || document.getElementById("btnThemeLight");
  if (darkBtn) {
    darkBtn.classList.toggle("active", !light);
    darkBtn.setAttribute("aria-pressed", !light ? "true" : "false");
  }
  if (lightBtn) {
    lightBtn.classList.toggle("active", light);
    lightBtn.setAttribute("aria-pressed", light ? "true" : "false");
  }
}

function setTheme(theme) {
  settings.theme = theme === "light" ? "light" : "dark";
  persistSettings();
  applyTheme();
}

function isLightTheme() {
  return settings.theme === "light";
}

function courtStockColor() {
  return isLightTheme() ? "#d4d4d8" : "#000000";
}

function courtInkColor() {
  return isLightTheme() ? "#27272a" : "#ffffff";
}

let ws = null;
let presenceHeartbeatTimer = null;
let presenceReconnectTimer = null;
let presenceConnecting = false;

const net = {
  player: 0,
  code: "",
  connected: false,
  snap: null,
  snapPrev: null,
  snapAt: 0,
  snapPrevAt: 0,
  remotePaddleY: null,
  lastPaddleSend: 0,
  lastPaddleSentY: -1,
  opponentCosmetics: null,
  opponentName: "",
  opponentLevel: 0,
  opponentProfile: null,
  rematchReady: [false, false],
  searching: false,
  searchStartedAt: 0,
};

let searchTimerInterval = null;

function formatSearchTime(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateSearchTimerDisplay() {
  if (!ui.lobbySearchTimer || !net.searching) return;
  ui.lobbySearchTimer.textContent = formatSearchTime(Date.now() - net.searchStartedAt);
}

function startSearchTimer() {
  stopSearchTimer();
  updateSearchTimerDisplay();
  searchTimerInterval = setInterval(updateSearchTimerDisplay, 250);
}

function stopSearchTimer() {
  if (searchTimerInterval) {
    clearInterval(searchTimerInterval);
    searchTimerInterval = null;
  }
}

function setOnlineStatus(msg, where = "both") {
  if (where === "lobby" || where === "both") {
    if (ui.lobbyStatus) ui.lobbyStatus.textContent = msg;
  }
  if (where === "search" || where === "both") {
    if (ui.searchLobbyStatus) ui.searchLobbyStatus.textContent = msg;
  }
}

function beginSearchUI(startedAt) {
  net.searching = true;
  net.searchStartedAt = startedAt || Date.now();
  ui.lobbyActions?.classList.add("hidden");
  ui.searchLobbyActions?.classList.add("hidden");
  ui.searchPanel?.classList.remove("hidden");
  if (ui.lobbySearchStatus) {
    ui.lobbySearchStatus.textContent = "Searching for opponent...";
    ui.lobbySearchStatus.classList.remove("match-found");
  }
  setOnlineStatus("Looking for an active player...", "search");
  startSearchTimer();
}

function showMatchFoundUI() {
  net.searching = false;
  stopSearchTimer();
  if (ui.lobbySearchStatus) {
    ui.lobbySearchStatus.textContent = "MATCH FOUND!";
    ui.lobbySearchStatus.classList.add("match-found");
  }
  updateSearchTimerDisplay();
  setOnlineStatus("Starting match...", "search");
}

function stopSearchUI() {
  net.searching = false;
  net.searchStartedAt = 0;
  stopSearchTimer();
  ui.lobbyActions?.classList.remove("hidden");
  ui.searchLobbyActions?.classList.remove("hidden");
  ui.searchPanel?.classList.add("hidden");
  if (ui.lobbySearchStatus) ui.lobbySearchStatus.classList.remove("match-found");
  if (ui.lobbySearchTimer) ui.lobbySearchTimer.textContent = "0:00";
}

function startMatchSearch() {
  connectWs(() => sendWs({ type: "search", ...presencePayload("search") }));
}

function cancelMatchSearch() {
  if (net.searching) sendWs({ type: "cancelSearch" });
  stopSearchUI();
  setOnlineStatus("Search cancelled. Try again when ready.", "search");
}

const NET_INTERP_MS = 72;
const NET_EXTRAP_MAX = 0.055;

function inCenterCourt(ballX) {
  const margin = 220;
  return ballX > table.x + margin && ballX < table.x + table.w - margin;
}

function nearPaddleZone(ballX) {
  return ballX < table.x + 200 || ballX > table.x + table.w - 200;
}

function ballOverlapsPaddleRect(bx, by, px, py, pw, ph) {
  const edgePad = 4;
  const r = ballCfg.r;
  return (
    bx + r > px &&
    bx - r < px + pw &&
    by + r > py - edgePad &&
    by - r < py + ph + edgePad
  );
}

function clampVisualBallAtPaddles() {
  if (!net.snap?.ball) return;
  if (nearPaddleZone(net.snap.ball.x)) {
    s.ball.x = net.snap.ball.x;
    s.ball.y = net.snap.ball.y;
    s.ball.vx = net.snap.ball.vx;
    s.ball.vy = net.snap.ball.vy;
  }
}

function expandState(d) {
  if (!d) return null;
  if (d.p1y != null) return d;
  return {
    t: d.t,
    p1y: d.y1,
    p2y: d.y2,
    ball: { x: d.b[0], y: d.b[1], vx: d.b[2], vy: d.b[3] },
    p1Score: d.s[0],
    p2Score: d.s[1],
    running: d.r === 1,
    gameOver: d.o > 0,
    winner: d.o === 1 ? "p1" : d.o === 2 ? "p2" : null,
  };
}

const s = {
  mode: "menu",
  botMode: "classic",
  running: false,
  gameOver: false,
  botLevel: 1,
  lastT: performance.now(),
  mouseY: table.y + table.h / 2,
  mouseX: table.x + 40,
  ai: { timer: 0, interval: 0.11, targetY: table.y + table.h / 2, errorPx: 28, speed: 560, track: 0.55 },
  ability: { parries: 0, ready: false, armed: false, smashing: false, breakFx: null, flames: [] },
  fx: { scoreT: 0, who: "p1", particles: [] },
  chaos: { hitCount: 0, shake: 0, fogTimer: 0, fogHits: 0, nextFogAt: 6, nextSplitAt: 5 },
  survival: { timeLeft: SURVIVAL_MATCH_SECONDS, active: false },
  boss: {
    id: 1,
    hpPlayer: BOSS_HP,
    hpBoss: BOSS_HP,
    parryHits: 0,
    decoyReadyAt: 4,
    laser: { phase: "idle", t: 0, aimY: 0 },
    growT: 0,
    growMul: 1.55,
    teleportCd: 0,
    fogT: 0,
    slowT: 0,
    teleportFlash: 0,
    brokenPlayerT: 0,
    shake: 0,
    powers: {
      blockArmed: false,
      blockCd: 0,
      ironT: 0,
      slowT: 0,
      reflectArmed: false,
      reflectCd: 0,
      freezeT: 0,
    },
  },
  p1: { x: table.x + paddle.inset, y: table.y + (table.h - paddle.h) / 2, score: 0 },
  p2: {
    x: table.x + table.w - paddle.inset - paddle.w,
    y: table.y + (table.h - paddle.h) / 2,
    score: 0,
    broken: false,
  },
  ball: { x: table.x + table.w / 2, y: table.y + table.h / 2, vx: 0, vy: 0 },
  balls: [],
};

function isChaosMode() {
  return s.mode === "local" && s.botMode === "chaos";
}

function isSurvivalMode() {
  return s.mode === "local" && s.botMode === "survival";
}

function isBossMode() {
  return s.mode === "local" && s.botMode === "boss";
}

function isCupPongMode() {
  return s.mode === "local" && s.botMode === "cuppong";
}

const BOSS_DEFS = [
  null,
  {
    id: 1,
    name: "Verdant Warden",
    style: "boss-warden",
    eyeColor: "#4ade80",
    eyeStyle: "twin",
    decoy: true,
    decoyAfter: 4,
    teleport: false,
    grow: false,
    laser: false,
    laserTrack: false,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 55,
    fill: ["#052e16", "#14532d", "#166534"],
  },
  {
    id: 2,
    name: "Blink Shade",
    style: "boss-blink",
    eyeColor: "#c084fc",
    eyeStyle: "slit",
    decoy: true,
    decoyAfter: 4,
    teleport: true,
    grow: false,
    laser: false,
    laserTrack: false,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 60,
    fill: ["#1e0533", "#4c1d95", "#2e1065"],
  },
  {
    id: 3,
    name: "Ember Maw",
    style: "boss-ember",
    eyeColor: "#fb923c",
    eyeStyle: "twin",
    decoy: true,
    decoyAfter: 4,
    teleport: false,
    grow: true,
    laser: false,
    laserTrack: false,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 65,
    fill: ["#1c0a05", "#7c2d12", "#431407"],
  },
  {
    id: 4,
    name: "Iris Laser",
    style: "boss-iris",
    eyeColor: "#86efac",
    eyeStyle: "twin",
    decoy: false,
    decoyAfter: 99,
    teleport: false,
    grow: false,
    laser: true,
    laserTrack: false,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 70,
    fill: ["#111827", "#374151", "#6b7280"],
  },
  {
    id: 5,
    name: "Twin Fang",
    style: "boss-fang",
    eyeColor: "#4ade80",
    eyeStyle: "dual",
    decoy: true,
    decoyAfter: 3,
    teleport: false,
    grow: false,
    laser: true,
    laserTrack: false,
    decoyCurve: true,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 74,
    fill: ["#0f172a", "#334155", "#1e293b"],
  },
  {
    id: 6,
    name: "Rift Howler",
    style: "boss-howler",
    eyeColor: "#67e8f9",
    eyeStyle: "twin",
    decoy: false,
    decoyAfter: 99,
    teleport: true,
    grow: false,
    laser: false,
    laserTrack: false,
    decoyCurve: false,
    shake: true,
    fog: true,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 78,
    fill: ["#0a0510", "#831843", "#0e7490"],
  },
  {
    id: 7,
    name: "Colossus",
    style: "boss-colossus",
    eyeColor: "#fde047",
    eyeStyle: "twin",
    decoy: true,
    decoyAfter: 3,
    teleport: false,
    grow: true,
    laser: false,
    laserTrack: false,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 82,
    fill: ["#1c1917", "#57534e", "#292524"],
  },
  {
    id: 8,
    name: "Chrono Serpent",
    style: "boss-chrono",
    eyeColor: "#a3e635",
    eyeStyle: "slit",
    decoy: false,
    decoyAfter: 99,
    teleport: true,
    grow: false,
    laser: false,
    laserTrack: false,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: true,
    doubleDecoy: false,
    classicEquiv: 86,
    fill: ["#052e16", "#365314", "#1a2e05"],
  },
  {
    id: 9,
    name: "Null Priest",
    style: "boss-null",
    eyeColor: "#34d399",
    eyeStyle: "twin",
    decoy: true,
    decoyAfter: 3,
    teleport: true,
    grow: false,
    laser: true,
    laserTrack: true,
    decoyCurve: false,
    shake: false,
    fog: false,
    slowField: false,
    doubleDecoy: false,
    classicEquiv: 90,
    fill: ["#fafafa", "#18181b", "#e4e4e7"],
  },
  {
    id: 10,
    name: "Overlord",
    style: "overlord",
    eyeColor: "#86efac",
    eyeStyle: "multi",
    decoy: true,
    decoyAfter: 2,
    teleport: true,
    grow: true,
    laser: true,
    laserTrack: true,
    decoyCurve: true,
    shake: true,
    fog: true,
    slowField: true,
    doubleDecoy: true,
    classicEquiv: 95,
    fill: ["#450a0a", "#14532d", "#7f1d1d"],
  },
];

function bossDef() {
  if (!isBossMode()) return null;
  const id = clamp(Math.round(s.boss?.id || s.botLevel || 1), 1, BOSS_MAX_LEVEL);
  return BOSS_DEFS[id] || BOSS_DEFS[1];
}

function chaosSpeed0() {
  if (isBossMode()) return ballCfg.speed0 * 1.25;
  if (isSurvivalMode()) return ballCfg.speed0 * 1.45;
  return isChaosMode() ? ballCfg.speed0 * 2 : ballCfg.speed0;
}

function chaosSpeedMax() {
  if (isBossMode()) return ballCfg.speedMax * 1.12;
  if (isSurvivalMode()) return ballCfg.speedMax * 1.18;
  return isChaosMode() ? ballCfg.speedMax * 1.35 : ballCfg.speedMax;
}

function formatSurvivalClock(sec) {
  const t = Math.max(0, Math.ceil(sec));
  const m = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

function setSurvivalTimerVisible(on) {
  if (!ui.survivalTimer) return;
  ui.survivalTimer.classList.toggle("hidden", !on);
  if (!on) ui.survivalTimer.classList.remove("survival-urgent");
}

function updateSurvivalHud() {
  if (!ui.survivalTimer) return;
  if (!isSurvivalMode() || s.gameOver) {
    setSurvivalTimerVisible(false);
    return;
  }
  const clock = formatSurvivalClock(s.survival.timeLeft);
  const urgent = s.survival.timeLeft <= 10;
  setSurvivalTimerVisible(true);
  ui.survivalTimer.textContent = clock;
  ui.survivalTimer.classList.toggle("survival-urgent", urgent);
}

function resolveSurvivalTimeUp() {
  if (!isSurvivalMode() || s.gameOver) return;
  s.survival.timeLeft = 0;
  s.survival.active = false;
  s.running = false;
  if (s.p1.score > s.p2.score) endGame("p1");
  else if (s.p2.score > s.p1.score) endGame("p2");
  else endGame(null, { draw: true });
}

function resetBossFx(soft = false) {
  const def = bossDef();
  s.boss.parryHits = 0;
  s.boss.decoyReadyAt = def?.decoyAfter || 4;
  const prev = s.boss.laser;
  const keepShot = soft && prev && (prev.phase === "aim" || prev.phase === "fire");
  if (keepShot) {
    // Keep an in-flight Overlord shot / countdown intact across soft resets.
  } else {
    s.boss.laser = {
      phase: soft && prev?.phase === "cd" ? "cd" : "idle",
      t: soft ? (prev?.t || 0) : 2.5 + Math.random() * 2,
      aimY: table.y + table.h / 2,
      lockedY: table.y + table.h / 2,
      beamX: s.p2.x,
      beamSpeed: 0,
      aimDur: 0,
      pulseN: 0,
      hit: false,
    };
  }
  if (!soft) {
    s.boss.growT = 0;
    s.boss.growMul = def?.id === 7 || def?.id === 10 ? 1.75 : 1.55;
    s.boss.teleportCd = 3 + Math.random() * 2;
    s.boss.fogT = 0;
    s.boss.slowT = 0;
    s.boss.teleportFlash = 0;
    s.boss.brokenPlayerT = 0;
    s.boss.shake = 0;
  }
}

function setBossHudVisible(on) {
  if (!ui.bossHud) return;
  ui.bossHud.classList.toggle("hidden", !on);
}

function updateBossHud() {
  if (!ui.bossHud) return;
  if (!isBossMode() || s.gameOver) {
    setBossHudVisible(false);
    return;
  }
  const def = bossDef();
  const hpP = s.boss.hpPlayer ?? BOSS_HP;
  const hpB = s.boss.hpBoss ?? BOSS_HP;
  setBossHudVisible(true);
  if (ui.bossHudName) ui.bossHudName.textContent = `BOSS · ${(def?.name || "UNKNOWN").toUpperCase()}`;
  if (ui.bossHudYouHp) ui.bossHudYouHp.textContent = String(hpP);
  if (ui.bossHudBossHp) ui.bossHudBossHp.textContent = String(hpB);
  if (ui.bossHudYouFill) ui.bossHudYouFill.style.width = `${(hpP / BOSS_HP) * 100}%`;
  if (ui.bossHudBossFill) ui.bossHudBossFill.style.width = `${(hpB / BOSS_HP) * 100}%`;
}

function damageBoss() {
  if (!isBossMode() || s.gameOver) return;
  s.boss.hpBoss = Math.max(0, (s.boss.hpBoss ?? BOSS_HP) - 1);
  updateBossHud();
  if (s.boss.hpBoss <= 0) {
    endGame("p1");
    return;
  }
  resetBall(true);
  resetBossFx(true);
}

function damagePlayer() {
  if (!isBossMode() || s.gameOver) return;
  s.boss.hpPlayer = Math.max(0, (s.boss.hpPlayer ?? BOSS_HP) - 1);
  updateBossHud();
  if (s.boss.hpPlayer <= 0) {
    endGame("p2");
    return;
  }
  resetBall(false);
  ui.status.textContent = "Parry charge lost — " + serveHint();
}

function bumpBossShake(amount) {
  if (!isBossMode()) return;
  const def = bossDef();
  if (!def?.shake && amount < 8) return;
  s.boss.shake = Math.max(s.boss.shake || 0, amount);
}

function tryBossDecoy(source) {
  if (!isBossMode() || !s.balls) return;
  const def = bossDef();
  if (!def?.decoy) return;
  const maxBalls = def.doubleDecoy ? 3 : 2;
  if (s.balls.length >= maxBalls) return;
  s.boss.parryHits += 1;
  if (s.boss.parryHits < (s.boss.decoyReadyAt || def.decoyAfter)) return;
  s.boss.parryHits = 0;
  s.boss.decoyReadyAt = Math.max(2, (def.decoyAfter || 4) - (def.doubleDecoy ? 1 : 0));
  const spawnOne = () => {
    if (s.balls.length >= maxBalls) return;
    const speed = (Math.hypot(source.vx, source.vy) || chaosSpeed0()) * (0.55 + Math.random() * 0.15);
    const baseAng = Math.atan2(source.vy, source.vx);
    const split = baseAng + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.5);
    const decoy = {
      x: source.x,
      y: clamp(source.y + (Math.random() * 28 - 14), table.y + ballCfg.r + 2, table.y + table.h - ballCfg.r - 2),
      vx: Math.cos(split) * speed,
      vy: Math.sin(split) * speed,
      decoyCurve: !!def.decoyCurve,
    };
    s.balls.push(decoy);
  };
  spawnOne();
  if (def.doubleDecoy && Math.random() < 0.32) spawnOne();
  bumpBossShake(6);
  if (ui.status && s.running) ui.status.textContent = "DECOY BALL!";
}

function tryBossTeleport(dt) {
  if (!isBossMode() || !s.running || s.gameOver) return;
  const def = bossDef();
  if (!def?.teleport) return;
  s.boss.teleportCd = Math.max(0, (s.boss.teleportCd || 0) - dt);
  if (s.boss.teleportCd > 0) return;
  const ball = pickThreatBall();
  if (!ball || ball.vx >= -40) return;
  const midL = table.x + table.w * 0.32;
  const midR = table.x + table.w * 0.72;
  if (ball.x < midL || ball.x > midR) return;
  if (Math.random() > (def.id >= 10 ? 0.018 : 0.01)) return;
  ball.x = table.x + table.w * (0.22 + Math.random() * 0.14);
  ball.y = clamp(
    s.p1.y + effectivePaddleH("p1") * (0.25 + Math.random() * 0.5) + (Math.random() * 40 - 20),
    table.y + ballCfg.r + 4,
    table.y + table.h - ballCfg.r - 4
  );
  s.boss.teleportFlash = 0.4;
  s.boss.teleportCd = (def.id >= 10 ? 4.2 : 6.2) + Math.random() * 2.4;
  bumpBossShake(9);
  if (def.fog && Math.random() < 0.45) s.boss.fogT = 1.8 + Math.random() * 1.2;
  if (ui.status && s.running) ui.status.textContent = "TELEPORT!";
}

function tryBossGrow(dt) {
  if (!isBossMode() || s.gameOver) return;
  const def = bossDef();
  if (s.boss.growT > 0) {
    s.boss.growT = Math.max(0, s.boss.growT - dt);
    return;
  }
  if (!def?.grow || !s.running) return;
  if (Math.random() > (def.id >= 10 ? 0.0045 : def.id === 7 ? 0.0055 : 0.0035)) return;
  s.boss.growMul = def.id === 7 || def.id === 10 ? 1.75 : 1.5;
  s.boss.growT = (def.id === 7 || def.id === 10 ? 4.5 : 3.2) + Math.random() * 1.4;
  bumpBossShake(5);
  if (ui.status && s.running) ui.status.textContent = "BOSS GROWS!";
}

function updateBossLaser(dt) {
  if (!isBossMode() || s.gameOver) return false;
  const def = bossDef();
  const laser = s.boss.laser || { phase: "idle", t: 0, aimY: 0 };
  s.boss.laser = laser;
  if (!def?.laser) {
    laser.phase = "idle";
    return false;
  }
  const overlord = def.id >= 10;
  const p1h = effectivePaddleH("p1");
  const p1Mid = s.p1.y + p1h / 2;

  // Don't tick the travel timer the same way during Overlord fire — shot ends by position.
  if (!(overlord && laser.phase === "fire")) {
    laser.t = Math.max(0, (laser.t || 0) - dt);
  }

  if (laser.phase === "idle" || laser.phase === "cd") {
    if (laser.t > 0 || !s.running) return false;
    laser.phase = "aim";
    laser.t = overlord ? 4 : 1.05 + Math.random() * 0.35;
    laser.aimDur = laser.t;
    laser.aimY = p1Mid;
    laser.lockedY = p1Mid;
    laser.beamX = s.p2.x + paddle.w * 0.5;
    laser.pulseN = overlord ? 4 : 0;
    laser.hit = false;
    if (ui.status) ui.status.textContent = overlord ? "LASER 4…" : "LASER LOCK…";
    return false;
  }

  if (laser.phase === "aim") {
    if (def.laserTrack && !overlord) {
      laser.aimY += (p1Mid - laser.aimY) * Math.min(1, dt * 3.2);
    } else if (overlord && def.laserTrack) {
      laser.aimY += (p1Mid - laser.aimY) * Math.min(1, dt * 1.1);
    }
    if (overlord) {
      const n = Math.max(1, Math.ceil(Math.max(0, laser.t)));
      if (n !== laser.pulseN) {
        laser.pulseN = n;
        bumpBossShake(3);
      }
      if (ui.status) ui.status.textContent = `LASER ${n}…`;
    }
    if (laser.t > 0) return false;
    laser.phase = "fire";
    laser.lockedY = laser.aimY;
    laser.aimY = laser.lockedY;
    laser.beamX = s.p2.x + paddle.w * 0.5;
    laser.beamSpeed = overlord ? 520 : 0;
    laser.t = overlord ? 0 : 0.32 + Math.random() * 0.08;
    laser.hit = false;
    bumpBossShake(overlord ? 5 : 7);
    if (ui.status) ui.status.textContent = "LASER!";
    return false;
  }

  if (laser.phase === "fire") {
    const beamHalf = overlord ? 22 : 14;
    const yLine = laser.lockedY ?? laser.aimY;

    if (overlord) {
      const speed = laser.beamSpeed || 520;
      const prevX = laser.beamX ?? s.p2.x;
      laser.beamX = prevX - speed * dt;
      const tipX = laser.beamX;
      const paddleLeft = s.p1.x;
      const paddleRight = s.p1.x + paddle.w;
      // Swept hit so large frames can't tunnel through the paddle.
      const crossedPaddle = prevX >= paddleLeft - 4 && tipX <= paddleRight + 4;
      const hitY = Math.abs(p1Mid - yLine) <= p1h / 2 + beamHalf;

      if (crossedPaddle && hitY && !laser.hit) {
        laser.hit = true;
        breakPlayerBat();
        if (ui.status) ui.status.textContent = "LASER HIT!";
        return true;
      }

      // Always run all the way off the left side of the court.
      if (tipX < table.x - 24) {
        laser.phase = "cd";
        laser.t = 8 + Math.random() * 3;
        if (ui.status && (ui.status.textContent === "LASER!" || ui.status.textContent === "LASER HIT!")) {
          ui.status.textContent = "Playing";
        }
        return false;
      }
      return false;
    }

    const hit = Math.abs(p1Mid - yLine) < p1h / 2 + beamHalf;
    if (hit && laser.t > 0.08) {
      breakPlayerBat();
      laser.phase = "cd";
      laser.t = 9 + Math.random() * 3;
      return true;
    }
    if (laser.t > 0) return false;
    laser.phase = "cd";
    laser.t = 10 + Math.random() * 2.5;
    if (ui.status?.textContent === "LASER!") ui.status.textContent = "Playing";
  }
  return false;
}

function breakPlayerBat() {
  if (!isBossMode() || s.gameOver) return;
  if (tryConsumeBossBlock()) {
    resetBall(true);
    resetBossFx(true);
    ui.status.textContent = "BLOCKED LASER!";
    return;
  }
  s.boss.brokenPlayerT = 0.55;
  playBatBreakSound();
  bumpBossShake(11);
  resetAbility();
  playPointLossSound();
  s.p2.score += 1;
  ui.p2.textContent = String(s.p2.score);
  scoreFx("p2", { silent: true });
  ui.status.textContent = "BAT SHATTERED!";
  damagePlayer();
}

function applyBossSlowField(ball, dt) {
  if (!isBossMode()) return;
  const def = bossDef();
  if (!def?.slowField) return;
  if (s.boss.slowT > 0) {
    s.boss.slowT = Math.max(0, s.boss.slowT - dt);
  } else if (s.running && Math.random() < 0.0028) {
    s.boss.slowT = 1.6 + Math.random() * 1.1;
    if (ui.status) ui.status.textContent = "SLOW FIELD!";
  }
  if (s.boss.slowT <= 0) return;
  const mid = table.x + table.w / 2;
  if (ball.vx < 0 && ball.x < mid && ball.x > mid - 90) {
    const sp = Math.hypot(ball.vx, ball.vy) || 0;
    if (sp < 1) return;
    // Ease toward ~70% speed; never decay below a playable floor.
    const floor = Math.max(chaosSpeed0() * 0.62, sp * 0.68);
    const next = Math.max(floor, sp * Math.pow(0.88, dt * 3));
    const scale = next / sp;
    ball.vx *= scale;
    ball.vy *= scale;
  }
}

function applyBossDecoyCurve(ball, dt) {
  if (!ball?.decoyCurve) return;
  ball.vy += Math.sin(performance.now() * 0.008 + ball.x * 0.02) * 220 * dt;
}

function applyBossBotLevel(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, BOSS_MAX_LEVEL);
  s.botLevel = lv;
  s.boss.id = lv;
  const def = BOSS_DEFS[lv] || BOSS_DEFS[1];
  const classicEquiv = def.classicEquiv || 55 + ((lv - 1) / 9) * 40;
  const t = (classicEquiv - 1) / 99;
  s.ai.errorPx = 72 - t * 70;
  s.ai.interval = 0.28 - t * 0.255;
  s.ai.speed = 220 + t * 980;
  s.ai.track = 0.35 + t * 0.62;
  if (lv >= 7) s.ai.track = Math.min(0.98, s.ai.track + 0.08);
  if (isAdmin() && save.abilities.slowBot) s.ai.speed *= 0.45;
}

function bossPalette(def) {
  return def?.fill || ["#111", "#333", "#222"];
}

function drawBossPaddleEyes(x, y, w, h, def) {
  if (!def) return;
  const t = performance.now() * 0.001;
  const ball = pickThreatBall() || s.ball;
  const lookY = clamp(((ball?.y || y + h / 2) - (y + h / 2)) / (h * 0.5), -1, 1);
  const pupilOff = lookY * Math.min(3.5, h * 0.04);
  const eyeColor = def.eyeColor || "#4ade80";
  const drawEye = (ex, ey, ew, eh, slit) => {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#052e16";
    ctx.beginPath();
    if (slit) {
      ctx.ellipse(ex, ey, ew * 0.55, eh, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    const pulse = 0.75 + Math.sin(t * 4) * 0.25;
    ctx.globalAlpha = 0.55 * pulse;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew * 1.35, eh * 1.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    if (slit) {
      ctx.ellipse(ex, ey + pupilOff * 0.4, ew * 0.22, eh * 0.85, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(ex + 0.5, ey + pupilOff, ew * 0.45, eh * 0.45, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(ex - ew * 0.2, ey - eh * 0.25 + pupilOff * 0.3, Math.max(0.8, ew * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const cx = x + w * 0.45;
  if (def.eyeStyle === "multi") {
    drawEye(cx, y + h * 0.22, 3.2, 2.4, false);
    drawEye(cx, y + h * 0.5, 3.6, 2.8, false);
    drawEye(cx, y + h * 0.78, 3.2, 2.4, false);
  } else if (def.eyeStyle === "dual") {
    drawEye(cx, y + h * 0.28, 3.4, 2.6, false);
    drawEye(cx, y + h * 0.42, 3.4, 2.6, false);
    drawEye(cx, y + h * 0.62, 3.4, 2.6, false);
    drawEye(cx, y + h * 0.76, 3.4, 2.6, false);
  } else if (def.eyeStyle === "slit") {
    drawEye(cx, y + h * 0.35, 2.8, 4.2, true);
    drawEye(cx, y + h * 0.65, 2.8, 4.2, true);
  } else {
    drawEye(cx, y + h * 0.32, 3.5, 2.8, false);
    drawEye(cx, y + h * 0.68, 3.5, 2.8, false);
  }
}

function drawBossPaddle(p, h) {
  const def = bossDef();
  const cols = bossPalette(def);
  const t = performance.now() * 0.001;
  const g = ctx.createLinearGradient(p.x, p.y, p.x + paddle.w, p.y + h);
  safeColorStop(g, 0, cols[0]);
  safeColorStop(g, 0.45 + Math.sin(t) * 0.05, cols[1]);
  safeColorStop(g, 1, cols[2] || cols[0]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(p.x, p.y, paddle.w, h);
  if (def?.style === "overlord" || def?.id === 10) {
    drawEpicOverlay(ctx, { style: "overlord", boss: true }, p.x, p.y, paddle.w, h, 0.9);
  }
  if (s.boss.growT > 0) {
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(t * 8) * 0.2;
    ctx.strokeStyle = def?.eyeColor || "#86efac";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(p.x - 3, p.y - 3, paddle.w + 6, h + 6);
    ctx.restore();
  }
  drawBossPaddleEyes(p.x, p.y, paddle.w, h, def);
  ctx.globalAlpha = 1;
}

function drawBossTableHalf() {
  const def = bossDef();
  const cols = bossPalette(def);
  const halfW = table.w / 2;
  const x = table.x + halfW;
  const t = performance.now() * 0.001;
  const g = ctx.createLinearGradient(x, table.y, x + halfW, table.y + table.h);
  safeColorStop(g, 0, cols[0]);
  safeColorStop(g, 0.5, cols[1]);
  safeColorStop(g, 1, cols[2] || cols[0]);
  ctx.globalAlpha = 0.42 + Math.sin(t * 1.2) * 0.04;
  ctx.fillStyle = g;
  ctx.fillRect(x, table.y, halfW, table.h);
  if (def?.id === 10) {
    drawEpicOverlay(ctx, { style: "overlord", boss: true }, x, table.y, halfW, table.h, 0.55);
  }
  ctx.globalAlpha = 1;
}

function drawBossFx() {
  if (!isBossMode()) return;
  const def = bossDef();
  const laser = s.boss.laser;
  if (def?.laser && laser && (laser.phase === "aim" || laser.phase === "fire")) {
    const overlord = def.id >= 10;
    const x0 = s.p2.x;
    const y0 = laser.phase === "fire" ? laser.lockedY ?? laser.aimY : laser.aimY;
    const x1 = overlord && laser.phase === "fire" ? laser.beamX ?? x0 : table.x + 8;
    ctx.save();
    if (laser.phase === "aim") {
      const pulse = 0.35 + Math.sin(performance.now() * (overlord ? 0.014 : 0.02)) * 0.2;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = def.eyeColor || "#86efac";
      ctx.setLineDash(overlord ? [10, 8] : [6, 6]);
      ctx.lineWidth = overlord ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(table.x + 8, y0);
      ctx.stroke();
      ctx.setLineDash([]);
      if (overlord) {
        const n = Math.max(1, Math.ceil(laser.t || 0));
        const beat = 0.55 + Math.sin(performance.now() * 0.012) * 0.45;
        ctx.globalAlpha = clamp(beat, 0.35, 1);
        ctx.fillStyle = def.eyeColor || "#86efac";
        ctx.font = `900 ${Math.round(42 + beat * 18)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(220,38,38,0.85)";
        ctx.shadowBlur = 18;
        ctx.fillText(String(n), table.x + table.w * 0.5, y0);
        ctx.shadowBlur = 0;
      }
    } else {
      const tipX = overlord ? laser.beamX ?? x0 : x1;
      ctx.globalAlpha = 0.95;
      const beam = ctx.createLinearGradient(x0, y0, tipX, y0);
      beam.addColorStop(0, "rgba(255,255,255,0.35)");
      beam.addColorStop(0.55, def.eyeColor || "#86efac");
      beam.addColorStop(1, overlord ? "rgba(239,68,68,0.95)" : "rgba(220,38,38,0.15)");
      ctx.strokeStyle = beam;
      ctx.lineWidth = overlord ? 10 : 10;
      ctx.shadowColor = def.eyeColor || "#4ade80";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(tipX, y0);
      ctx.stroke();
      if (overlord) {
        // Laser ball projectile — travels the full locked line.
        const r = 10;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.shadowColor = def.eyeColor || "#86efac";
        ctx.shadowBlur = 26;
        ctx.beginPath();
        ctx.arc(tipX, y0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = def.eyeColor || "#86efac";
        ctx.beginPath();
        ctx.arc(tipX, y0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fff";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(tipX, y0);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  if (s.boss.teleportFlash > 0) {
    const ball = s.ball;
    const r = 18 + (1 - s.boss.teleportFlash / 0.4) * 28;
    ctx.save();
    ctx.globalAlpha = clamp(s.boss.teleportFlash * 2.2, 0, 0.85);
    ctx.strokeStyle = def?.eyeColor || "#a855f7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (def?.fog && s.boss.fogT > 0) {
    const hx = table.x + table.w / 2;
    const fadeOut = clamp(s.boss.fogT / 0.45, 0, 1);
    const fadeIn = clamp((2.8 - s.boss.fogT) / 0.3, 0, 1);
    const strength = Math.min(fadeIn, fadeOut);
    const fog = ctx.createLinearGradient(table.x, table.y, hx, table.y);
    fog.addColorStop(0, `rgba(0,0,0,${0.92 * strength})`);
    fog.addColorStop(0.55, `rgba(5,5,8,${0.8 * strength})`);
    fog.addColorStop(1, `rgba(0,0,0,${0.35 * strength})`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fog;
    ctx.fillRect(table.x, table.y, table.w / 2, table.h);
  }

  if (s.boss.brokenPlayerT > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.boss.brokenPlayerT * 2);
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(s.p1.x - 16, table.y, paddle.w + 32, table.h);
    ctx.restore();
  }
}

function ensureBossPowersState() {
  if (!s.boss.powers) {
    s.boss.powers = {
      blockArmed: false,
      blockCd: 0,
      ironT: 0,
      slowT: 0,
      reflectArmed: false,
      reflectCd: 0,
      freezeT: 0,
    };
  }
  return s.boss.powers;
}

function resetBossPowersFx() {
  const p = ensureBossPowersState();
  p.blockArmed = false;
  p.blockCd = 0;
  p.ironT = 0;
  p.slowT = 0;
  p.reflectArmed = false;
  p.reflectCd = 0;
  p.freezeT = 0;
  clearBossReflectBoost();
  updateBossPowerBar();
}

function ownsBossPower(id) {
  return Array.isArray(save.bossPowers) && save.bossPowers.includes(id);
}

function clearBossReflectBoost() {
  for (const ball of activeBalls()) {
    if (ball) ball.reflectBoost = false;
  }
  if (s.ball) s.ball.reflectBoost = false;
}

function bossTimeScale() {
  if (!isBossMode()) return 1;
  const p = ensureBossPowersState();
  if (p.freezeT > 0) return 0;
  if (p.slowT > 0) return 0.6;
  return 1;
}

function tryConsumeBossBlock() {
  if (!isBossMode()) return false;
  const p = ensureBossPowersState();
  if (!p.blockArmed) return false;
  p.blockArmed = false;
  p.blockCd = 15;
  bumpBossShake(8);
  updateBossPowerBar();
  return true;
}

function tickBossPowers(dt) {
  if (!isBossMode()) return;
  const p = ensureBossPowersState();
  if (p.blockCd > 0) p.blockCd = Math.max(0, p.blockCd - dt);
  if (p.reflectCd > 0) p.reflectCd = Math.max(0, p.reflectCd - dt);
  if (p.ironT > 0) p.ironT = Math.max(0, p.ironT - dt);
  if (p.slowT > 0) p.slowT = Math.max(0, p.slowT - dt);
  if (p.freezeT > 0) p.freezeT = Math.max(0, p.freezeT - dt);
  updateBossPowerBar();
}

function setBossPowerBarVisible(on) {
  if (!ui.bossPowerBar) return;
  ui.bossPowerBar.classList.toggle("hidden", !on);
}

function updateBossPowerBar() {
  if (!ui.bossPowerBar) return;
  const show = isBossMode() && !s.gameOver;
  setBossPowerBarVisible(show);
  if (!show) return;
  const p = ensureBossPowersState();
  const configs = [
    {
      id: "block",
      btn: ui.btnBossPowerBlock,
      meta: ui.bossPowerMetaBlock,
      ready: () => !p.blockArmed && p.blockCd <= 0,
      armed: () => p.blockArmed,
      active: () => false,
      cooling: () => p.blockCd > 0,
      label: () => (p.blockArmed ? "ARMED" : p.blockCd > 0 ? `${Math.ceil(p.blockCd)}s` : "Ready"),
    },
    {
      id: "iron",
      btn: ui.btnBossPowerIron,
      meta: ui.bossPowerMetaIron,
      ready: () => p.ironT <= 0,
      armed: () => false,
      active: () => p.ironT > 0,
      cooling: () => false,
      label: () => (p.ironT > 0 ? `${Math.ceil(p.ironT)}s` : "Ready"),
    },
    {
      id: "timeslow",
      btn: ui.btnBossPowerTimeslow,
      meta: ui.bossPowerMetaTimeslow,
      ready: () => p.slowT <= 0 && p.freezeT <= 0,
      armed: () => false,
      active: () => p.slowT > 0,
      cooling: () => false,
      label: () => (p.slowT > 0 ? `${Math.ceil(p.slowT)}s` : "Ready"),
    },
    {
      id: "reflect",
      btn: ui.btnBossPowerReflect,
      meta: ui.bossPowerMetaReflect,
      ready: () => !p.reflectArmed && p.reflectCd <= 0,
      armed: () => p.reflectArmed,
      active: () => p.freezeT > 0,
      cooling: () => p.reflectCd > 0 && !p.reflectArmed,
      label: () =>
        p.freezeT > 0
          ? `FREEZE ${Math.ceil(p.freezeT)}s`
          : p.reflectArmed
            ? "ARMED"
            : p.reflectCd > 0
              ? `${Math.ceil(p.reflectCd)}s`
              : "Ready",
    },
  ];
  let anyOwned = false;
  for (const cfg of configs) {
    if (!cfg.btn) continue;
    const owned = ownsBossPower(cfg.id);
    cfg.btn.classList.toggle("hidden", !owned);
    if (!owned) continue;
    anyOwned = true;
    const canUse = cfg.ready();
    cfg.btn.disabled = !canUse;
    cfg.btn.classList.toggle("armed", cfg.armed());
    cfg.btn.classList.toggle("active", cfg.active());
    cfg.btn.classList.toggle("cooling", cfg.cooling());
    if (cfg.meta) cfg.meta.textContent = cfg.label();
  }
  if (!anyOwned) setBossPowerBarVisible(false);
}

function activateBossPower(id) {
  if (!isBossMode() || s.gameOver || !ownsBossPower(id)) return false;
  const p = ensureBossPowersState();
  ensureAudio();
  if (id === "block") {
    if (p.blockArmed || p.blockCd > 0) return false;
    p.blockArmed = true;
    ui.status.textContent = "Block armed — next goal against you is negated.";
  } else if (id === "iron") {
    if (p.ironT > 0) return false;
    p.ironT = 30;
    ui.status.textContent = "Iron Paddle — +30% size for 30s!";
  } else if (id === "timeslow") {
    if (p.slowT > 0) return false;
    p.slowT = 5;
    ui.status.textContent = "Time Slow — boss slowed 40% for 5s!";
  } else if (id === "reflect") {
    if (p.reflectArmed || p.reflectCd > 0) return false;
    p.reflectArmed = true;
    ui.status.textContent = isTouchDevice
      ? "Reflect armed — next paddle hit launches the ball!"
      : "Reflect armed — next paddle hit launches the ball!";
  } else {
    return false;
  }
  const t = audioCtx.currentTime;
  playTone(260, t, 0.08, "square", 0.1);
  playTone(420, t + 0.06, 0.1, "triangle", 0.08);
  updateBossPowerBar();
  return true;
}

function openBossHub() {
  hideOverlay(ui.menuOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.bossHubOverlay);
  setStagePlaying(false);
  startMenuBg();
  ui.hint.textContent = "Boss Battles — shop powers or pick a boss.";
  updateNameUI();
}

function closeBossHub() {
  hideOverlay(ui.bossHubOverlay);
  showOverlay(ui.campaignHubOverlay);
  startMenuBg();
  updateNameUI();
}

function openBossShop() {
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  showOverlay(ui.bossShopOverlay);
  setStagePlaying(false);
  startMenuBg();
  renderBossShop();
  ui.hint.textContent = "Boss Shop — buy support powers for hard fights.";
  updateNameUI();
}

function closeBossShop() {
  hideOverlay(ui.bossShopOverlay);
  showOverlay(ui.bossHubOverlay);
  startMenuBg();
  updateNameUI();
}

function renderBossShop() {
  if (ui.bossShopPoints) ui.bossShopPoints.textContent = String(save.points || 0);
  if (!ui.bossShopList) return;
  ui.bossShopList.innerHTML = "";
  for (const item of BOSS_SHOP) {
    const owned = ownsBossPower(item.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `boss-shop-item${owned ? " owned" : ""}`;
    btn.disabled = owned;
    btn.innerHTML = `
      <div class="boss-shop-item-top">
        <span class="boss-shop-item-name">${item.name}</span>
        <span class="boss-shop-item-price">${owned ? "OWNED" : `${item.price} PTS`}</span>
      </div>
      <div class="boss-shop-item-desc">${item.desc}</div>
    `;
    if (!owned) {
      btn.addEventListener("click", () => {
        playMenuClick();
        buyBossPower(item.id);
      });
    }
    ui.bossShopList.appendChild(btn);
  }
  if (ui.bossShopHint) {
    const ownedCount = (save.bossPowers || []).length;
    ui.bossShopHint.textContent =
      ownedCount >= BOSS_SHOP.length
        ? "All Boss powers owned — use them under the table in Boss fights."
        : "Buy once. In Boss fights, tap/click the buttons under the table to activate.";
  }
}

function buyBossPower(id) {
  const item = BOSS_SHOP.find((x) => x.id === id);
  if (!item || ownsBossPower(id)) return;
  if ((save.points || 0) < item.price) {
    if (ui.bossShopHint) {
      ui.bossShopHint.textContent = `Need ${item.price - (save.points || 0)} more pts for ${item.name}.`;
    }
    return;
  }
  save.points -= item.price;
  if (!Array.isArray(save.bossPowers)) save.bossPowers = [];
  save.bossPowers.push(id);
  persistSave();
  updatePointsUI();
  renderBossShop();
  if (ui.bossShopHint) ui.bossShopHint.textContent = `${item.name} unlocked — available in Boss fights.`;
}

function openBossLevelSelect() {
  hideOverlay(ui.menuOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.bossLevelOverlay);
  setStagePlaying(false);
  startMenuBg();
  renderBossLevelGrid();
  ui.hint.textContent = "Select a Boss battle.";
  updateNameUI();
}

function closeBossLevelSelect() {
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  showOverlay(ui.bossHubOverlay);
  startMenuBg();
  updateNameUI();
}

function renderBossLevelGrid() {
  if (!ui.bossLevelGrid) return;
  ui.bossLevelGrid.innerHTML = "";
  const nextUnlock = Math.min(BOSS_MAX_LEVEL, (save.maxBossCleared || 0) + 1);
  for (let i = 1; i <= BOSS_MAX_LEVEL; i++) {
    const unlocked = isBossLevelUnlocked(i);
    const cleared = i <= (save.maxBossCleared || 0);
    const def = BOSS_DEFS[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `bot-level-btn ${botTierClass(Math.min(100, def?.classicEquiv || 55))}`;
    if (!unlocked) btn.classList.add("locked");
    if (cleared) btn.classList.add("cleared");
    if (i === nextUnlock && unlocked) btn.classList.add("next");
    btn.textContent = unlocked ? String(i) : "🔒";
    btn.disabled = !unlocked;
    btn.title = unlocked
      ? `Boss ${i} — ${def?.name || "Boss"} · +${POINTS_PER_BOSS_WIN} pts${cleared ? " (cleared)" : ""}`
      : `Locked — clear Boss ${i - 1} first`;
    btn.addEventListener("click", () => {
      if (!unlocked) {
        if (ui.bossLevelHint) {
          ui.bossLevelHint.textContent = `Locked. Clear Boss ${i - 1} to unlock.`;
        }
        return;
      }
      playMenuClick();
      startBossMode(i);
    });
    btn.addEventListener("mouseenter", () => {
      if (!ui.bossLevelHint) return;
      if (!unlocked) {
        ui.bossLevelHint.textContent = `Locked — beat Boss ${i - 1} first.`;
      } else if (cleared) {
        ui.bossLevelHint.textContent = `B${i} cleared — ${def?.name || "Boss"} · Rematch for +${POINTS_PER_BOSS_WIN} pts`;
      } else {
        ui.bossLevelHint.textContent = `B${i} — ${def?.name || "Boss"} · Win for +${POINTS_PER_BOSS_WIN} pts`;
      }
    });
    ui.bossLevelGrid.appendChild(btn);
  }
  if (ui.bossLevelHint) {
    const cleared = save.maxBossCleared || 0;
    ui.bossLevelHint.textContent =
      cleared >= BOSS_MAX_LEVEL
        ? "All Boss battles cleared — Overlord unlocked!"
        : `Progress: B${cleared}/${BOSS_MAX_LEVEL} · Next: B${nextUnlock} · B10 unlocks Overlord`;
  }
}

function resetChaosFx(soft = false) {
  s.chaos.hitCount = 0;
  s.chaos.nextSplitAt = 4 + Math.floor(Math.random() * 3);
  s.chaos.fogHits = 0;
  s.chaos.nextFogAt = 5 + Math.floor(Math.random() * 5);
  s.chaos.fogTimer = 0;
  if (!soft) s.chaos.shake = 0;
}

function bumpChaosShake(amount) {
  if (isBossMode()) {
    bumpBossShake(amount);
    return;
  }
  if (!isChaosMode()) return;
  s.chaos.shake = Math.max(s.chaos.shake || 0, amount);
}

function chaosFogUnlocked() {
  return isChaosMode() && s.botLevel >= 10;
}

function tryTriggerChaosFog() {
  if (!chaosFogUnlocked()) return;
  if (s.chaos.fogTimer > 0) return;
  s.chaos.fogHits += 1;
  if (s.chaos.fogHits < s.chaos.nextFogAt) return;
  // Random chance after the hit threshold so it feels unpredictable
  if (Math.random() > 0.72) {
    s.chaos.nextFogAt = s.chaos.fogHits + 2 + Math.floor(Math.random() * 3);
    return;
  }
  s.chaos.fogTimer = 2.6 + Math.random() * 1.6;
  s.chaos.fogHits = 0;
  s.chaos.nextFogAt = 5 + Math.floor(Math.random() * 5);
  bumpChaosShake(5);
  if (ui.status && s.running) ui.status.textContent = "FOG OF WAR!";
}

function drawChaosFogOfWar() {
  if (!isChaosMode() || !(s.chaos.fogTimer > 0)) return;
  const hx = table.x + table.w / 2;
  const fadeOut = clamp(s.chaos.fogTimer / 0.55, 0, 1);
  const fadeIn = clamp((3.5 - s.chaos.fogTimer) / 0.35, 0, 1);
  const strength = Math.min(fadeIn, fadeOut);
  const pulse = 0.92 + Math.sin(performance.now() * 0.008) * 0.04;

  // Near-opaque smoke on the bot (opponent) half — hides the ball there
  const fog = ctx.createLinearGradient(hx, table.y, table.x + table.w, table.y);
  fog.addColorStop(0, `rgba(0,0,0,${0.55 * strength * pulse})`);
  fog.addColorStop(0.2, `rgba(5,5,8,${0.88 * strength * pulse})`);
  fog.addColorStop(0.55, `rgba(0,0,0,${0.96 * strength})`);
  fog.addColorStop(1, `rgba(0,0,0,${0.99 * strength})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = fog;
  ctx.fillRect(hx, table.y, table.w / 2, table.h);

  // Soft smoke wisps
  for (let i = 0; i < 7; i++) {
    const t = performance.now() * 0.001;
    const wx = hx + ((i * 0.13 + t * 0.08) % 1) * (table.w / 2);
    const wy = table.y + ((Math.sin(t * 1.3 + i) * 0.5 + 0.5) * 0.85 + 0.08) * table.h;
    const wr = table.h * (0.12 + (i % 3) * 0.04);
    const wg = ctx.createRadialGradient(wx, wy, 1, wx, wy, wr);
    wg.addColorStop(0, `rgba(30,30,35,${0.35 * strength})`);
    wg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function syncPrimaryBall() {
  if (s.balls && s.balls.length) s.ball = s.balls[0];
}

function activeBalls() {
  if (s.balls && s.balls.length) return s.balls;
  return [s.ball];
}

function pickThreatBall() {
  const balls = activeBalls();
  let best = balls[0];
  let bestScore = -Infinity;
  for (const b of balls) {
    const towardBot = b.vx > 0 ? b.vx : b.vx * 0.15;
    const proximity = 1 - clamp((s.p2.x - b.x) / table.w, 0, 1);
    const score = towardBot * 2 + proximity * 400 + Math.abs(b.vy) * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = b;
    }
  }
  return best;
}

function tryChaosBallSplit(source) {
  if (!isChaosMode() || !s.balls || s.balls.length >= 2) return;
  s.chaos.hitCount += 1;
  if (s.chaos.hitCount < s.chaos.nextSplitAt) return;
  s.chaos.nextSplitAt = s.chaos.hitCount + 4 + Math.floor(Math.random() * 3);
  const speed = Math.hypot(source.vx, source.vy) || chaosSpeed0();
  const baseAng = Math.atan2(source.vy, source.vx);
  const split = baseAng + (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.45);
  s.balls.push({
    x: source.x,
    y: clamp(source.y + (Math.random() * 24 - 12), table.y + ballCfg.r + 2, table.y + table.h - ballCfg.r - 2),
    vx: Math.cos(split) * speed,
    vy: Math.sin(split) * speed,
  });
  bumpChaosShake(7);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function botTierClass(level) {
  if (level <= 20) return "tier-easy";
  if (level <= 40) return "tier-medium";
  if (level <= 60) return "tier-hard";
  if (level <= 80) return "tier-expert";
  return "tier-master";
}

function botLevelLabel(level) {
  if (level <= 20) return "Slow & clumsy";
  if (level <= 40) return "Getting sharper";
  if (level <= 60) return "Fast reactions";
  if (level <= 80) return "Near perfect";
  return "Unforgiving master";
}

function applyBotLevel(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, 100);
  s.botLevel = lv;
  const t = (lv - 1) / 99;
  s.ai.errorPx = 72 - t * 70;
  s.ai.interval = 0.28 - t * 0.255;
  s.ai.speed = 220 + t * 980;
  s.ai.track = 0.35 + t * 0.62;
  if (isAdmin() && save.abilities.slowBot) s.ai.speed *= 0.45;
}

function applyChaosBotLevel(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, CHAOS_MAX_LEVEL);
  s.botLevel = lv;
  // Map Chaos 1–25 onto Classic ~4–70 difficulty
  const classicEquiv = 4 + ((lv - 1) / (CHAOS_MAX_LEVEL - 1)) * 66;
  const t = (classicEquiv - 1) / 99;
  s.ai.errorPx = 72 - t * 70;
  s.ai.interval = 0.28 - t * 0.255;
  s.ai.speed = 220 + t * 980;
  s.ai.track = 0.35 + t * 0.62;
  if (isAdmin() && save.abilities.slowBot) s.ai.speed *= 0.45;
}

function applySurvivalBotLevel(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, SURVIVAL_MAX_ROUND);
  s.botLevel = lv;
  // Map Survival 1–25 onto Classic ~L6–L85
  const classicEquiv = 6 + ((lv - 1) / (SURVIVAL_MAX_ROUND - 1)) * 79;
  const t = (classicEquiv - 1) / 99;
  s.ai.errorPx = 72 - t * 70;
  s.ai.interval = 0.28 - t * 0.255;
  s.ai.speed = 220 + t * 980;
  s.ai.track = 0.35 + t * 0.62;
  if (isAdmin() && save.abilities.slowBot) s.ai.speed *= 0.45;
}

function chaosLevelLabel(level) {
  if (level <= 5) return "Wild opener";
  if (level <= 10) return "Unstable court";
  if (level <= 15) return "Mayhem rising";
  if (level <= 20) return "Rift storm";
  return "Absolute chaos";
}

function survivalRoundLabel(level) {
  if (level <= 5) return "Warm-up pace";
  if (level <= 10) return "Steady grind";
  if (level <= 15) return "Pressure climb";
  if (level <= 20) return "Endurance test";
  return "Final stretch";
}

function hideBotCategoryOverlays() {
  hideOverlay(ui.botModesOverlay);
  hideOverlay(ui.classicGamesOverlay);
  hideOverlay(ui.campaignHubOverlay);
  hideOverlay(ui.arcadeHubOverlay);
  hideOverlay(ui.challengeMapOverlay);
}
window.hideBotCategoryOverlays = hideBotCategoryOverlays;

function logMenuTileAlignment(overlay, label) {
  // #region agent log
  requestAnimationFrame(() => {
    const card = overlay?.querySelector(".overlay-card, .menu-card");
    const tiles = [...(overlay?.querySelectorAll(".menu-tile, .online-menu-tile") || [])];
    const back = overlay?.querySelector(".menu-panel-footer .link-btn, .online-panel-footer .link-btn");
    const title = overlay?.querySelector(".overlay-title");
    const widths = tiles.map((t) => Math.round(t.getBoundingClientRect().width));
    const cardR = card?.getBoundingClientRect();
    const backR = back?.getBoundingClientRect();
    const titleR = title?.getBoundingClientRect();
    fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
      body: JSON.stringify({
        sessionId: "38eb5e",
        runId: "menu-align",
        hypothesisId: "MENU-A",
        location: "game.js:logMenuTileAlignment",
        message: "menu tile/back button alignment",
        data: {
          label,
          tileCount: tiles.length,
          widths,
          widthsEqual: widths.length ? widths.every((w) => w === widths[0]) : null,
          cardW: cardR ? Math.round(cardR.width) : null,
          titleCenterOffset:
            titleR && cardR
              ? Math.round(titleR.left + titleR.width / 2 - (cardR.left + cardR.width / 2))
              : null,
          backCenterOffset:
            backR && cardR
              ? Math.round(backR.left + backR.width / 2 - (cardR.left + cardR.width / 2))
              : null,
          sampleHint: tiles[0]?.querySelector(".menu-tile-hint, .online-menu-tile-hint")?.textContent || null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
  // #endregion
}

function openBotModes() {
  if (typeof stopCupPongMusic === "function") stopCupPongMusic();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.updatesOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  hideBotCategoryOverlays();
  showOverlay(ui.botModesOverlay);
  setStagePlaying(false);
  startMenuBg();
  ui.hint.textContent = "Choose Classic Games, Campaign, or Arcade.";
  updateNameUI();
  logMenuTileAlignment(ui.botModesOverlay, "botModes");
}

function closeBotModes() {
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  showOverlay(ui.menuOverlay);
  startMenuBg();
  updateNameUI();
}

function openClassicGamesHub() {
  hideBotCategoryOverlays();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.modeSoonOverlay);
  showOverlay(ui.classicGamesOverlay);
  setStagePlaying(false);
  startMenuBg();
  ui.hint.textContent = "Classic Games — levels, Chaos, or Survival.";
  updateNameUI();
  logMenuTileAlignment(ui.classicGamesOverlay, "classicGames");
}

function closeClassicGamesHub() {
  hideOverlay(ui.classicGamesOverlay);
  showOverlay(ui.botModesOverlay);
  startMenuBg();
  updateNameUI();
}

function openCampaignHub() {
  hideBotCategoryOverlays();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.modeSoonOverlay);
  showOverlay(ui.campaignHubOverlay);
  setStagePlaying(false);
  startMenuBg();
  ui.hint.textContent = "Campaign — Boss Battles or Challenge map.";
  updateNameUI();
  logMenuTileAlignment(ui.campaignHubOverlay, "campaign");
}

function closeCampaignHub() {
  hideOverlay(ui.campaignHubOverlay);
  showOverlay(ui.botModesOverlay);
  startMenuBg();
  updateNameUI();
}

function openArcadeHub() {
  hideBotCategoryOverlays();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideOverlay(ui.modeSoonOverlay);
  showOverlay(ui.arcadeHubOverlay);
  setStagePlaying(false);
  startMenuBg();
  ui.hint.textContent = "Arcade — Cup Pong and party modes.";
  updateNameUI();
  logMenuTileAlignment(ui.arcadeHubOverlay, "arcade");
}

function closeArcadeHub() {
  hideOverlay(ui.arcadeHubOverlay);
  showOverlay(ui.botModesOverlay);
  startMenuBg();
  updateNameUI();
}

let challengeMapLoadPromise = null;
let challengeActiveRegionId = null;
let challengeOpenTauntBotId = null;

const CHALLENGE_REGIONS = {
  america: {
    id: "america",
    label: "America",
    lon: -97,
    lat: 39,
    bots: [
      { id: "am-jordan", name: "Jordan Blake", stars: 2 },
      { id: "am-sofia", name: "Sofia Reyes", stars: 3 },
      { id: "am-marcus", name: "Marcus Cole", stars: 1 },
      { id: "am-avery", name: "Avery Quinn", stars: 4 },
      { id: "am-devon", name: "Devon Hart", stars: 3 },
      { id: "am-nina", name: "Nina Vasquez", stars: 5 },
      { id: "am-caleb", name: "Caleb Brooks", stars: 2 },
    ],
  },
  europe: {
    id: "europe",
    label: "Europe",
    lon: 10,
    lat: 50,
    bots: [
      { id: "eu-luca", name: "Luca Moretti", stars: 3 },
      { id: "eu-elise", name: "Elise Laurent", stars: 4 },
      { id: "eu-jonas", name: "Jonas Berg", stars: 2 },
      { id: "eu-anya", name: "Anya Kowalski", stars: 5 },
      { id: "eu-felix", name: "Felix Hartmann", stars: 3 },
      { id: "eu-isla", name: "Isla MacLeod", stars: 1 },
      { id: "eu-mateo", name: "Mateo Ruiz", stars: 4 },
    ],
  },
  asia: {
    id: "asia",
    label: "Asia",
    lon: 105,
    lat: 35,
    bots: [
      { id: "as-mei", name: "Mei Nakamura", stars: 4 },
      { id: "as-arjun", name: "Arjun Patel", stars: 3 },
      { id: "as-yuna", name: "Yuna Choi", stars: 5 },
      { id: "as-kenji", name: "Kenji Sato", stars: 2 },
      { id: "as-priya", name: "Priya Sharma", stars: 3 },
      { id: "as-hao", name: "Hao Chen", stars: 4 },
      { id: "as-rina", name: "Rina Wijaya", stars: 1 },
    ],
  },
  africa: {
    id: "africa",
    label: "Africa",
    lon: 20,
    lat: 5,
    bots: [
      { id: "af-amara", name: "Amara Okonkwo", stars: 4 },
      { id: "af-kwame", name: "Kwame Mensah", stars: 3 },
      { id: "af-zahra", name: "Zahra Hassan", stars: 5 },
      { id: "af-tumi", name: "Tumi Ndlovu", stars: 2 },
      { id: "af-aisha", name: "Aisha Diallo", stars: 3 },
      { id: "af-jabari", name: "Jabari Okello", stars: 4 },
      { id: "af-nia", name: "Nia Abara", stars: 1 },
    ],
  },
};

const CHALLENGE_TAUNTS = [
  "Hope you packed a spare paddle.",
  "Cute serve. I’ll still own the table.",
  "Don’t blink — you’ll miss the point.",
  "I’ve practiced against better ghosts than you.",
  "Ready to lose politely?",
  "Your backhand looks nervous already.",
  "I don’t do warm-ups. I do wipeouts.",
  "Bring confidence. Leave with a lesson.",
  "That scoreboard’s about to get lonely.",
  "I read your spin like last week’s news.",
  "Try harder. I’m bored already.",
  "One rally and you’ll want a rematch.",
  "Keep talking — my paddle does the talking.",
  "You swing. I decide.",
  "Champions don’t flinch. You will.",
  "Save the excuses for after game point.",
  "I eat soft serves for breakfast.",
  "Your legend ends at this table.",
  "Relax. This won’t take long.",
  "Is that your A-game? Adorable.",
  "I don’t lose. I collect highlights.",
  "Aim carefully. I’m not.",
  "Your paddle’s shaking. Or is that you?",
  "Come on — make me break a sweat.",
  "I’ve seen tougher lobbies than this.",
  "Don’t worry. I’ll keep the score tasteful.",
  "Step up or step aside.",
  "That serve has tourist written all over it.",
  "I’m not trash-talking. I’m forecasting.",
  "Blink twice if you need a timeout already.",
  "Your confidence just checked out.",
  "I play clean. You play catch-up.",
  "Nice form. Shame about the results.",
  "I’ll let you touch the ball. Once.",
  "This table remembers winners. Guess which one.",
  "You’re one edge short of interesting.",
  "Save the victory dance. You’ll need the energy.",
  "My worst day still clears your best rally.",
  "Go ahead — serve. I’ll handle the rest.",
  "You’re not late. You’re already behind.",
  "I don’t chase points. Points chase me.",
  "That was cute. Now watch how it’s done.",
  "Bring friends. You’ll need witnesses.",
  "I’m allergic to easy wins… almost.",
  "Your spin is loud. Mine is lethal.",
  "Keep the receipts. You’ll want them later.",
  "I came for sport. You’ll leave for practice.",
  "Don’t clutch the paddle so hard. Clutch the hope.",
  "If style points counted, you’d still lose.",
  "I’m the final boss of polite disrespect.",
  "You talk game. I am game.",
  "Sit down, stand up — either way, I’m scoring.",
  "Your highlight reel starts after mine ends.",
  "I don’t need luck. You do.",
  "That edge? Mine. That point? Also mine.",
  "Smile for the scoreboard.",
  "You’re not warming up. You’re warning me you’re soft.",
  "I’ve beaten louder egos with quieter shots.",
  "Call it a challenge. I’ll call it a tutorial.",
  "When I miss, it’s strategy. When you miss, it’s destiny.",
];

function challengeStarsHtml(stars) {
  const filled = Math.max(1, Math.min(5, Number(stars) || 1));
  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    html += i <= filled ? "★" : '<span class="star-empty">☆</span>';
  }
  return html;
}

function clearChallengeTaunt() {
  challengeOpenTauntBotId = null;
  const roster = ui.challengeRegionRoster;
  if (!roster) return;
  roster.querySelectorAll(".challenge-bot-row.is-taunting").forEach((row) => {
    row.classList.remove("is-taunting");
  });
  roster.querySelectorAll(".challenge-bot-taunt").forEach((el) => el.remove());
}

function dismissChallengeTaunt() {
  clearChallengeTaunt();
}

function showChallengeTaunt(row, bot) {
  if (!row || !bot) return;
  clearChallengeTaunt();
  challengeOpenTauntBotId = bot.id;
  row.classList.add("is-taunting");
  const taunt =
    CHALLENGE_TAUNTS[Math.floor(Math.random() * CHALLENGE_TAUNTS.length)] ||
    CHALLENGE_TAUNTS[0];
  const bubble = document.createElement("div");
  bubble.className = "challenge-bot-taunt";
  bubble.setAttribute("role", "status");
  bubble.innerHTML = `<span class="challenge-bot-taunt-text"></span><button type="button" class="challenge-bot-taunt-close" aria-label="Dismiss taunt">×</button>`;
  bubble.querySelector(".challenge-bot-taunt-text").textContent = taunt;
  bubble.querySelector(".challenge-bot-taunt-close").addEventListener("click", (e) => {
    e.stopPropagation();
    dismissChallengeTaunt();
  });
  row.appendChild(bubble);
  requestAnimationFrame(() => {
    bubble.classList.add("is-open");
    // #region agent log
    requestAnimationFrame(() => {
      const card = ui.challengeMapOverlay?.querySelector(".challenge-map-card");
      const roster = ui.challengeRegionRoster;
      const view = ui.challengeRegionView;
      const cardR = card?.getBoundingClientRect();
      const rosterR = roster?.getBoundingClientRect();
      const rowR = row.getBoundingClientRect();
      const bubbleR = bubble.getBoundingClientRect();
      const viewR = view?.getBoundingClientRect();
      const rosterCs = roster ? getComputedStyle(roster) : null;
      const cardCs = card ? getComputedStyle(card) : null;
      const bubbleCs = getComputedStyle(bubble);
      fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
        body: JSON.stringify({
          sessionId: "38eb5e",
          runId: "layout-fit",
          hypothesisId: "A-B-E",
          location: "game.js:showChallengeTaunt",
          message: "taunt bubble layout vs card/roster clip",
          data: {
            vw: window.innerWidth,
            mediaBelow720: window.matchMedia("(max-width: 720px)").matches,
            botId: bot.id,
            card: cardR
              ? { w: Math.round(cardR.width), r: Math.round(cardR.right), overflow: cardCs?.overflow }
              : null,
            roster: rosterR
              ? {
                  w: Math.round(rosterR.width),
                  r: Math.round(rosterR.right),
                  overflowX: rosterCs?.overflowX,
                  overflowY: rosterCs?.overflowY,
                  scrollbarGutter: rosterCs?.scrollbarGutter,
                  padL: rosterCs?.paddingLeft,
                  padR: rosterCs?.paddingRight,
                }
              : null,
            view: viewR
              ? { w: Math.round(viewR.width), overflow: view ? getComputedStyle(view).overflow : null }
              : null,
            row: { w: Math.round(rowR.width), r: Math.round(rowR.right), l: Math.round(rowR.left) },
            bubble: {
              w: Math.round(bubbleR.width),
              h: Math.round(bubbleR.height),
              l: Math.round(bubbleR.left),
              r: Math.round(bubbleR.right),
              t: Math.round(bubbleR.top),
              b: Math.round(bubbleR.bottom),
              leftCss: bubbleCs.left,
              topCss: bubbleCs.top,
              opacity: bubbleCs.opacity,
            },
            clippedRightOfCard: cardR ? bubbleR.right > cardR.right + 1 : null,
            clippedRightOfRoster: rosterR ? bubbleR.right > rosterR.right + 1 : null,
            clippedBottomOfRoster: rosterR ? bubbleR.bottom > rosterR.bottom + 1 : null,
            spaceRightOfRowInCard: cardR ? Math.round(cardR.right - rowR.right) : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    });
    // #endregion
  });
}

function showChallengeWorldView() {
  challengeActiveRegionId = null;
  clearChallengeTaunt();
  ui.challengeWorldView?.classList.remove("hidden");
  ui.challengeRegionView?.classList.add("hidden");
  if (ui.challengeRegionView) ui.challengeRegionView.setAttribute("aria-hidden", "true");
  if (ui.challengeMapLead) ui.challengeMapLead.textContent = "Pick a region on the map.";
  if (ui.hint) ui.hint.textContent = "Challenge — pick a region.";
  mountChallengeRegionDots();
}

function isChallengeRegionOpen() {
  return (
    !!challengeActiveRegionId ||
    (ui.challengeRegionView && !ui.challengeRegionView.classList.contains("hidden"))
  );
}

function onChallengeMapBack() {
  if (isChallengeRegionOpen()) {
    showChallengeWorldView();
    return;
  }
  closeChallengeMap();
}

function openChallengeRegion(regionId) {
  const region = CHALLENGE_REGIONS[regionId];
  if (!region || !ui.challengeRegionRoster) return;
  challengeActiveRegionId = regionId;
  clearChallengeTaunt();
  ui.challengeWorldView?.classList.add("hidden");
  ui.challengeRegionView?.classList.remove("hidden");
  if (ui.challengeRegionView) ui.challengeRegionView.setAttribute("aria-hidden", "false");
  if (ui.challengeRegionTitle) ui.challengeRegionTitle.textContent = region.label.toUpperCase();
  if (ui.challengeMapLead) {
    ui.challengeMapLead.textContent = `${region.label} — pick a rival.`;
  }
  if (ui.hint) ui.hint.textContent = `Challenge — ${region.label}.`;
  ui.challengeRegionRoster.innerHTML = "";
  region.bots.forEach((bot) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "challenge-bot-row";
    row.setAttribute("role", "listitem");
    row.dataset.botId = bot.id;
    row.innerHTML = `<span class="challenge-bot-name"></span><span class="challenge-bot-stars" aria-label="${bot.stars} of 5 difficulty"></span>`;
    row.querySelector(".challenge-bot-name").textContent = bot.name;
    row.querySelector(".challenge-bot-stars").innerHTML = challengeStarsHtml(bot.stars);
    row.addEventListener("click", () => showChallengeTaunt(row, bot));
    ui.challengeRegionRoster.appendChild(row);
  });
}

function challengeLonLatToViewBox(lon, lat) {
  const ox = ((Number(lon) + 180) / 360) * 1000;
  const oy = ((90 - Number(lat)) / 180) * 500;
  return {
    x: 8 + ox * 0.984,
    y: 14 + oy * 0.984,
  };
}

function challengeViewBoxToFramePercent(pt, frameEl, mediaEl) {
  const frame = frameEl?.getBoundingClientRect();
  const media = mediaEl?.getBoundingClientRect();
  if (!frame || !media || frame.width < 1 || frame.height < 1 || media.width < 1 || media.height < 1) {
    return { left: 50, top: 50 };
  }
  const vb = { x: -20, y: -28, w: 1040, h: 556 };
  const vbAspect = vb.w / vb.h;
  const elAspect = media.width / media.height;
  let drawW;
  let drawH;
  let offX;
  let offY;
  if (elAspect > vbAspect) {
    drawH = media.height;
    drawW = drawH * vbAspect;
    offX = (media.width - drawW) / 2;
    offY = 0;
  } else {
    drawW = media.width;
    drawH = drawW / vbAspect;
    offX = 0;
    offY = (media.height - drawH) / 2;
  }
  const px = media.left - frame.left + offX + ((pt.x - vb.x) / vb.w) * drawW;
  const py = media.top - frame.top + offY + ((pt.y - vb.y) / vb.h) * drawH;
  return {
    left: (px / frame.width) * 100,
    top: (py / frame.height) * 100,
  };
}

function mountChallengeRegionDotsHtml(mediaEl) {
  const host = ui.challengeRegionDots;
  const frame = host?.closest(".challenge-map-frame") || mediaEl?.closest(".challenge-map-frame");
  if (!host || !frame || !mediaEl) return;
  host.innerHTML = "";
  host.dataset.ready = "html";
  host.removeAttribute("aria-hidden");
  host.style.display = "block";
  Object.values(CHALLENGE_REGIONS).forEach((region) => {
    const pt = challengeLonLatToViewBox(region.lon, region.lat);
    const pos = challengeViewBoxToFramePercent(pt, frame, mediaEl);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "challenge-region-dot";
    btn.dataset.region = region.id;
    btn.style.left = `${pos.left}%`;
    btn.style.top = `${pos.top}%`;
    btn.setAttribute("aria-label", `Open ${region.label}`);
    btn.title = region.label;
    const label = document.createElement("span");
    label.className = "challenge-region-dot-label";
    label.textContent = region.label;
    btn.appendChild(label);
    btn.addEventListener("click", () => openChallengeRegion(region.id));
    host.appendChild(btn);
  });
}

function mountChallengeRegionDots() {
  const mapHost =
    document.getElementById("challengeWorldMapHost") ||
    ui.challengeMapOverlay?.querySelector(".challenge-world-map");
  const svg = mapHost?.querySelector("svg");
  const img = mapHost?.querySelector("img.challenge-world-map-img");
  const htmlHost = ui.challengeRegionDots;

  if (img && !svg) {
    const place = () => mountChallengeRegionDotsHtml(img);
    if (img.complete && img.naturalWidth) place();
    else img.addEventListener("load", place, { once: true });
    return;
  }

  if (htmlHost) {
    htmlHost.innerHTML = "";
    htmlHost.dataset.ready = "";
    htmlHost.setAttribute("aria-hidden", "true");
    htmlHost.style.display = "none";
  }
  if (!svg) return;

  svg.querySelector("#challengeRegionDotsSvg")?.remove();
  const NS = "http://www.w3.org/2000/svg";
  const layer = document.createElementNS(NS, "g");
  layer.setAttribute("id", "challengeRegionDotsSvg");
  layer.setAttribute("class", "challenge-region-dots-svg");

  const placed = [];
  Object.values(CHALLENGE_REGIONS).forEach((region) => {
    const pt = challengeLonLatToViewBox(region.lon, region.lat);
    const hit = document.createElementNS(NS, "g");
    hit.setAttribute("class", "challenge-region-dot-svg");
    hit.dataset.region = region.id;
    hit.setAttribute("role", "button");
    hit.setAttribute("tabindex", "0");
    hit.setAttribute("aria-label", `Open ${region.label}`);
    hit.style.cursor = "pointer";

    const pulse = document.createElementNS(NS, "circle");
    pulse.setAttribute("class", "challenge-region-dot-pulse");
    pulse.setAttribute("cx", String(pt.x));
    pulse.setAttribute("cy", String(pt.y));
    pulse.setAttribute("r", "14");
    pulse.setAttribute("fill", "rgba(255,255,255,0.12)");
    pulse.setAttribute("stroke", "none");

    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", String(pt.x));
    ring.setAttribute("cy", String(pt.y));
    ring.setAttribute("r", "8");
    ring.setAttribute("fill", "rgba(255,255,255,0.18)");
    ring.setAttribute("stroke", "#fff");
    ring.setAttribute("stroke-width", "2");

    const core = document.createElementNS(NS, "circle");
    core.setAttribute("cx", String(pt.x));
    core.setAttribute("cy", String(pt.y));
    core.setAttribute("r", "3.2");
    core.setAttribute("fill", "#fff");
    core.setAttribute("stroke", "none");

    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "challenge-region-dot-svg-label");
    label.setAttribute("x", String(pt.x));
    label.setAttribute("y", String(pt.y + 22));
    label.setAttribute("text-anchor", "middle");
    label.textContent = region.label;

    hit.append(pulse, ring, core, label);
    const open = () => openChallengeRegion(region.id);
    hit.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      open();
    });
    hit.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    layer.appendChild(hit);
    placed.push({
      id: region.id,
      lon: region.lon,
      lat: region.lat,
      vbX: Math.round(pt.x * 10) / 10,
      vbY: Math.round(pt.y * 10) / 10,
    });
  });
  svg.appendChild(layer);

  // #region agent log
  requestAnimationFrame(() => {
    const frame = mapHost?.closest(".challenge-map-frame");
    const fr = frame?.getBoundingClientRect();
    const sr = svg.getBoundingClientRect();
    const vb = svg.viewBox?.baseVal;
    fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
      body: JSON.stringify({
        sessionId: "38eb5e",
        runId: "map-load",
        hypothesisId: "DOT-A",
        location: "game.js:mountChallengeRegionDots",
        message: "region dots placed in svg viewBox space",
        data: {
          mode: "inline-svg",
          frameAspect: fr ? Math.round((fr.width / fr.height) * 100) / 100 : null,
          svgAspect: sr.width && sr.height ? Math.round((sr.width / sr.height) * 100) / 100 : null,
          vbAspect: vb ? Math.round((vb.width / vb.height) * 100) / 100 : null,
          placed,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
  // #endregion
}

function applyChallengeWorldSvg(host, svgMarkup, mapVersion) {
  host.innerHTML = svgMarkup;
  host.dataset.mapVersion = mapVersion;
  host.dataset.mapMode = "inline-svg";
  const svg = host.querySelector("svg");
  if (svg) {
    svg.setAttribute("viewBox", "-20 -28 1040 556");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    const land = svg.querySelector("g");
    if (land && !land.getAttribute("transform")) {
      land.setAttribute("transform", "translate(8 14) scale(0.984)");
    }
    svg.querySelectorAll("circle").forEach((c) => c.remove());
  }
  mountChallengeRegionDots();
  return { ok: true, mode: "inline-svg", pathCount: host.querySelectorAll("path").length };
}

function loadChallengeWorldMapImgFallback(host, url, mapVersion) {
  return new Promise((resolve) => {
    host.innerHTML = "";
    const img = document.createElement("img");
    img.className = "challenge-world-map-img";
    img.alt = "Equirectangular world map";
    img.decoding = "async";
    img.src = url;
    img.addEventListener(
      "load",
      () => {
        host.dataset.mapVersion = mapVersion;
        host.dataset.mapMode = "img-fallback";
        mountChallengeRegionDots();
        // #region agent log
        fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
          body: JSON.stringify({
            sessionId: "38eb5e",
            runId: "map-load",
            hypothesisId: "A-FILE",
            location: "game.js:loadChallengeWorldMapImgFallback",
            message: "map loaded via img fallback",
            data: {
              protocol: location.protocol,
              href: location.href.slice(0, 120),
              naturalW: img.naturalWidth,
              naturalH: img.naturalHeight,
              url,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        resolve({ ok: true, mode: "img-fallback", cached: false });
      },
      { once: true }
    );
    img.addEventListener(
      "error",
      () => {
        host.dataset.mapVersion = "";
        host.dataset.mapMode = "failed";
        host.innerHTML =
          '<p class="challenge-map-missing">Map asset missing. Open via the local server (http://localhost:3000) or keep assets/world-map.svg next to index.html.</p>';
        // #region agent log
        fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
          body: JSON.stringify({
            sessionId: "38eb5e",
            runId: "map-load",
            hypothesisId: "B-PATH",
            location: "game.js:loadChallengeWorldMapImgFallback",
            message: "map img fallback failed",
            data: { protocol: location.protocol, href: location.href.slice(0, 120), url },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        resolve({ ok: false, reason: "img-error", mode: "img-fallback" });
      },
      { once: true }
    );
    host.appendChild(img);
  });
}

function ensureChallengeWorldMap() {
  const host =
    document.getElementById("challengeWorldMapHost") ||
    ui.challengeMapOverlay?.querySelector(".challenge-world-map");
  if (!host) return Promise.resolve({ ok: false, reason: "no-host" });
  const mapVersion = "20260712t";
  const url = `assets/world-map.svg?v=${mapVersion}`;
  if (
    host.dataset.mapVersion === mapVersion &&
    (host.querySelector("svg") || host.querySelector("img.challenge-world-map-img"))
  ) {
    mountChallengeRegionDots();
    return Promise.resolve({ ok: true, cached: true, mode: host.dataset.mapMode || "cached" });
  }
  host.innerHTML = "";
  host.dataset.mapVersion = "";
  host.dataset.mapMode = "";
  // #region agent log
  fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
    body: JSON.stringify({
      sessionId: "38eb5e",
      runId: "map-load",
      hypothesisId: "A-FILE",
      location: "game.js:ensureChallengeWorldMap:start",
      message: "challenge map load start",
      data: {
        protocol: location.protocol,
        href: location.href.slice(0, 160),
        isFile: location.protocol === "file:",
        url,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  challengeMapLoadPromise = fetch(url)
    .then(async (r) => {
      const text = await r.text();
      if (!r.ok) throw new Error(`status ${r.status}`);
      const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
      if (!svgMatch) throw new Error("no-svg-markup");
      const result = applyChallengeWorldSvg(host, svgMatch[0], mapVersion);
      // #region agent log
      fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
        body: JSON.stringify({
          sessionId: "38eb5e",
          runId: "map-load",
          hypothesisId: "C-HTTP",
          location: "game.js:ensureChallengeWorldMap:fetch-ok",
          message: "challenge map fetch succeeded",
          data: {
            protocol: location.protocol,
            status: r.status,
            pathCount: result.pathCount,
            mode: result.mode,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return { ok: true, cached: false, mode: result.mode };
    })
    .catch((err) => {
      // #region agent log
      fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
        body: JSON.stringify({
          sessionId: "38eb5e",
          runId: "map-load",
          hypothesisId: "A-FILE",
          location: "game.js:ensureChallengeWorldMap:fetch-fail",
          message: "challenge map fetch failed; trying img fallback",
          data: {
            protocol: location.protocol,
            href: location.href.slice(0, 160),
            reason: String(err && err.message ? err.message : err),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return loadChallengeWorldMapImgFallback(host, url, mapVersion);
    });
  return challengeMapLoadPromise;
}

function openChallengeMap() {
  hideBotCategoryOverlays();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.modeSoonOverlay);
  showChallengeWorldView();
  showOverlay(ui.challengeMapOverlay);
  setStagePlaying(false);
  startMenuBg();
  updateNameUI();
  ensureChallengeWorldMap().then(() => {
    // #region agent log
    requestAnimationFrame(() => {
      const overlay = ui.challengeMapOverlay;
      const card = overlay?.querySelector(".challenge-map-card");
      const body = card?.querySelector(".challenge-map-body");
      const world = ui.challengeWorldView;
      const frame = world?.querySelector(".challenge-map-frame");
      const banner = world?.querySelector(".challenge-map-banner");
      const header = card?.querySelector(".menu-panel-header");
      const footer = card?.querySelector(".menu-panel-footer");
      const oR = overlay?.getBoundingClientRect();
      const cR = card?.getBoundingClientRect();
      const bR = body?.getBoundingClientRect();
      const fR = frame?.getBoundingClientRect();
      const bnR = banner?.getBoundingClientRect();
      const hR = header?.getBoundingClientRect();
      const ftR = footer?.getBoundingClientRect();
      const frameCs = frame ? getComputedStyle(frame) : null;
      const host = document.getElementById("challengeWorldMapHost");
      const hostR = host?.getBoundingClientRect();
      const svg = host?.querySelector("svg");
      const svgR = svg?.getBoundingClientRect();
      fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
        body: JSON.stringify({
          sessionId: "38eb5e",
          runId: "map-restore",
          hypothesisId: "F-G-L-M",
          location: "game.js:openChallengeMap",
          message: "challenge world view viewport fit",
          data: {
            vw: window.innerWidth,
            vh: window.innerHeight,
            overlayH: oR ? Math.round(oR.height) : null,
            overlayClientH: overlay ? overlay.clientHeight : null,
            overlayScrollH: overlay ? overlay.scrollHeight : null,
            card: cR
              ? {
                  w: Math.round(cR.width),
                  h: Math.round(cR.height),
                  t: Math.round(cR.top),
                  b: Math.round(cR.bottom),
                }
              : null,
            bodyH: bR ? Math.round(bR.height) : null,
            headerH: hR ? Math.round(hR.height) : null,
            footerH: ftR ? Math.round(ftR.height) : null,
            frame: fR
              ? {
                  w: Math.round(fR.width),
                  h: Math.round(fR.height),
                  minH: frameCs?.minHeight,
                  maxH: frameCs?.maxHeight,
                  aspect: frameCs?.aspectRatio,
                }
              : null,
            host: hostR
              ? { w: Math.round(hostR.width), h: Math.round(hostR.height) }
              : null,
            svg: svgR
              ? {
                  w: Math.round(svgR.width),
                  h: Math.round(svgR.height),
                  pathCount: host ? host.querySelectorAll("path").length : 0,
                  hasSvg: !!svg,
                }
              : { hasSvg: !!svg, pathCount: host ? host.querySelectorAll("path").length : 0 },
            bannerH: bnR ? Math.round(bnR.height) : null,
            cardOverflowsOverlay: cR && oR ? cR.height > oR.height + 1 : null,
            cardOverflowsViewportBottom: cR ? cR.bottom > window.innerHeight + 1 : null,
            cardOverflowsViewportRight: cR ? cR.right > window.innerWidth + 1 : null,
            overlayScrollable: overlay ? overlay.scrollHeight > overlay.clientHeight + 1 : null,
            frameVisibleInOverlay:
              fR && oR
                ? fR.top < oR.bottom - 8 && fR.bottom > oR.top + 8 && fR.height > 40
                : null,
            sumChromePlusFrame: hR && fR && bnR && ftR
              ? Math.round(hR.height + fR.height + bnR.height + ftR.height)
              : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    });
    // #endregion
  });
}

function closeChallengeMap() {
  showChallengeWorldView();
  hideOverlay(ui.challengeMapOverlay);
  showOverlay(ui.campaignHubOverlay);
  startMenuBg();
  updateNameUI();
}

function openModeSoon(modeName) {
  hideBotCategoryOverlays();
  if (ui.modeSoonLead) {
    ui.modeSoonLead.textContent = `Sorry — ${modeName || "this mode"} is under construction.`;
  }
  showOverlay(ui.modeSoonOverlay);
  setStagePlaying(false);
  startMenuBg();
  // #region agent log
  requestAnimationFrame(() => {
    const overlay = ui.modeSoonOverlay;
    const card = overlay?.querySelector(".mode-soon-card, .overlay-card");
    const title = overlay?.querySelector(".overlay-title");
    if (!overlay || !card || !title) return;
    const or = overlay.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const tr = title.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const ts = getComputedStyle(title);
    const os = getComputedStyle(overlay);
    const clippedByCard = tr.top < cr.top + 0.5;
    const clippedByOverlay = tr.top < or.top + 0.5;
    const clippedXByCard = tr.left < cr.left - 0.5 || tr.right > cr.right + 0.5;
    const clippedXByOverlay = tr.left < or.left - 0.5 || tr.right > or.right + 0.5;
    const titlePadTop = parseFloat(ts.paddingTop) || 0;
    const cardPadTop = parseFloat(cs.paddingTop) || 0;
    const data = {
      hypothesisId: "A-E",
      modeName: modeName || "",
      phoneMode: document.body.classList.contains("phone-mode"),
      clippedByCard,
      clippedByOverlay,
      clippedXByCard,
      clippedXByOverlay,
      titleFullyVisible:
        tr.top >= cr.top - 0.5 &&
        tr.bottom <= cr.bottom + 0.5 &&
        tr.left >= cr.left - 0.5 &&
        tr.right <= cr.right + 0.5,
      titleTop: Math.round(tr.top * 10) / 10,
      titleLeft: Math.round(tr.left * 10) / 10,
      titleRight: Math.round(tr.right * 10) / 10,
      cardTop: Math.round(cr.top * 10) / 10,
      cardLeft: Math.round(cr.left * 10) / 10,
      cardRight: Math.round(cr.right * 10) / 10,
      overlayTop: Math.round(or.top * 10) / 10,
      titleHeight: Math.round(tr.height * 10) / 10,
      titleWidth: Math.round(tr.width * 10) / 10,
      titleFontSize: ts.fontSize,
      titleLineHeight: ts.lineHeight,
      titlePadding: ts.padding,
      titleOverflow: ts.overflow,
      titleWhiteSpace: ts.whiteSpace,
      cardPadding: cs.padding,
      cardOverflow: cs.overflow,
      cardOverflowX: cs.overflowX,
      cardOverflowY: cs.overflowY,
      cardMaxHeight: cs.maxHeight,
      overlayOverflow: os.overflow,
      overlayAlignItems: os.alignItems,
      cardPadTop,
      titlePadTop,
      gapTitleAboveCardInner: Math.round((tr.top - (cr.top + cardPadTop)) * 10) / 10,
    };
    fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
      body: JSON.stringify({
        sessionId: "38eb5e",
        runId: "post-fix",
        hypothesisId: "D",
        location: "game.js:openModeSoon",
        message: "modeSoon title geometry",
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
  // #endregion
}

function closeModeSoon() {
  hideOverlay(ui.modeSoonOverlay);
  showOverlay(ui.botModesOverlay);
  startMenuBg();
}

function openBotLevelSelect() {
  hideOverlay(ui.menuOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.botLevelOverlay);
  setStagePlaying(false);
  startMenuBg();
  renderBotLevelGrid();
  ui.hint.textContent = "Select a bot level.";
  updateNameUI();
  // #region agent log
  requestAnimationFrame(() => {
    const overlay = ui.botLevelOverlay;
    const card = overlay?.querySelector(".bot-level-card");
    const header = overlay?.querySelector(".bot-level-header");
    const body = overlay?.querySelector(".bot-level-body");
    const footer = overlay?.querySelector(".bot-level-footer");
    const grid = overlay?.querySelector(".bot-level-grid") || ui.botLevelGrid;
    const firstBtn = grid?.querySelector(".bot-level-btn");
    const title = overlay?.querySelector(".overlay-title");
    if (!card || !grid) return;
    const or = overlay.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    const br = firstBtn?.getBoundingClientRect();
    const tr = title?.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const gs = getComputedStyle(grid);
    const data = {
      vw: window.innerWidth,
      vh: window.innerHeight,
      phoneMode: document.body.classList.contains("phone-mode"),
      landscape: document.body.classList.contains("phone-landscape"),
      overlayH: Math.round(or.height),
      cardH: Math.round(cr.height),
      cardTop: Math.round(cr.top),
      cardBottom: Math.round(cr.bottom),
      cardClientH: card.clientHeight,
      cardScrollH: card.scrollHeight,
      cardOverflowY: cs.overflowY,
      cardMaxH: cs.maxHeight,
      cardDisplay: cs.display,
      cardFlexDir: cs.flexDirection,
      headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
      bodyClientH: body?.clientHeight ?? null,
      bodyScrollH: body?.scrollHeight ?? null,
      footerH: footer ? Math.round(footer.getBoundingClientRect().height) : null,
      titleTop: tr ? Math.round(tr.top) : null,
      titleVisible: !!(tr && tr.top >= -2 && tr.bottom <= window.innerHeight + 2),
      gridH: Math.round(gr.height),
      gridClientH: grid.clientHeight,
      gridScrollH: grid.scrollHeight,
      gridOverflowY: gs.overflowY,
      gridMaxH: gs.maxHeight,
      gridTouchAction: gs.touchAction,
      btnCount: grid.querySelectorAll(".bot-level-btn").length,
      firstBtnH: br ? Math.round(br.height) : null,
      firstBtnVisibleH: br
        ? Math.round(Math.min(br.bottom, gr.bottom, window.innerHeight) - Math.max(br.top, gr.top, 0))
        : null,
      btnClipped: !!(br && (br.bottom > gr.bottom + 1 || br.top < gr.top - 1)),
      cardClippedByViewport: cr.bottom > window.innerHeight + 2 || cr.top < -2,
      gridScrollNeeded: grid.scrollHeight > grid.clientHeight + 1,
      cardScrollNeeded: card.scrollHeight > card.clientHeight + 1,
      hasHeaderBodyFooter: !!(header && body && footer),
      cssHref: [...document.styleSheets].map((s) => s.href).filter(Boolean).slice(-1)[0] || null,
    };
    agentLog("A-E", "game.js:openBotLevelSelect", "bot level geometry", data, "post-fix");
  });
  // #endregion
}

function closeBotLevelSelect() {
  hideOverlay(ui.botLevelOverlay);
  showOverlay(ui.classicGamesOverlay);
  startMenuBg();
  updateNameUI();
}

function renderBotLevelGrid() {
  if (!ui.botLevelGrid) return;
  ui.botLevelGrid.innerHTML = "";
  const nextUnlock = Math.min(100, (save.maxBotCleared || 0) + 1);
  for (let i = 1; i <= 100; i++) {
    const unlocked = isBotLevelUnlocked(i);
    const cleared = i <= (save.maxBotCleared || 0);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `bot-level-btn ${botTierClass(i)}`;
    if (!unlocked) btn.classList.add("locked");
    if (cleared) btn.classList.add("cleared");
    if (i === nextUnlock && unlocked) btn.classList.add("next");
    btn.textContent = unlocked ? String(i) : "🔒";
    btn.disabled = !unlocked;
    btn.title = unlocked
      ? `Level ${i} — ${botLevelLabel(i)}${cleared ? " (cleared)" : ""}`
      : `Locked — clear level ${i - 1} first`;
    btn.addEventListener("click", () => {
      if (!unlocked) {
        if (ui.botLevelHint) {
          ui.botLevelHint.textContent = `Locked. Clear level ${i - 1} to unlock.`;
        }
        return;
      }
      playMenuClick();
      startLocalMode(i);
    });
    btn.addEventListener("mouseenter", () => {
      if (!ui.botLevelHint) return;
      if (!unlocked) {
        ui.botLevelHint.textContent = `Locked — beat level ${i - 1} first (+5 pts on clear).`;
      } else if (cleared) {
        ui.botLevelHint.textContent = `Level ${i} cleared — ${botLevelLabel(i)}`;
      } else {
        ui.botLevelHint.textContent = `Level ${i} — ${botLevelLabel(i)} · Clear for +5 pts`;
      }
    });
    ui.botLevelGrid.appendChild(btn);
  }
  if (ui.botLevelHint) {
    const cleared = save.maxBotCleared || 0;
    ui.botLevelHint.textContent =
      cleared >= 100
        ? "All 100 levels cleared. Master status!"
        : `Progress: L${cleared}/100 · Next unlock: L${nextUnlock} · Clear = +5 pts`;
  }
}

function openChaosLevelSelect() {
  hideOverlay(ui.menuOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.chaosLevelOverlay);
  setStagePlaying(false);
  startMenuBg();
  renderChaosLevelGrid();
  ui.hint.textContent = "Select a Chaos level.";
  updateNameUI();
}

function closeChaosLevelSelect() {
  hideOverlay(ui.chaosLevelOverlay);
  showOverlay(ui.classicGamesOverlay);
  startMenuBg();
  updateNameUI();
}

function renderChaosLevelGrid() {
  if (!ui.chaosLevelGrid) return;
  ui.chaosLevelGrid.innerHTML = "";
  const nextUnlock = Math.min(CHAOS_MAX_LEVEL, (save.maxChaosCleared || 0) + 1);
  for (let i = 1; i <= CHAOS_MAX_LEVEL; i++) {
    const unlocked = isChaosLevelUnlocked(i);
    const cleared = i <= (save.maxChaosCleared || 0);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `bot-level-btn ${botTierClass(Math.min(100, Math.round(4 + ((i - 1) / 24) * 66)))}`;
    if (!unlocked) btn.classList.add("locked");
    if (cleared) btn.classList.add("cleared");
    if (i === nextUnlock && unlocked) btn.classList.add("next");
    btn.textContent = unlocked ? String(i) : "🔒";
    btn.disabled = !unlocked;
    const reward = chaosWinPoints(i);
    btn.title = unlocked
      ? `Chaos ${i} — ${chaosLevelLabel(i)} · ${reward} pts${cleared ? " (cleared)" : ""}`
      : `Locked — clear Chaos ${i - 1} first`;
    btn.addEventListener("click", () => {
      if (!unlocked) {
        if (ui.chaosLevelHint) {
          ui.chaosLevelHint.textContent = `Locked. Clear Chaos ${i - 1} to unlock.`;
        }
        return;
      }
      playMenuClick();
      startChaosMode(i);
    });
    btn.addEventListener("mouseenter", () => {
      if (!ui.chaosLevelHint) return;
      if (!unlocked) {
        ui.chaosLevelHint.textContent = `Locked — beat Chaos ${i - 1} first.`;
      } else if (cleared) {
        ui.chaosLevelHint.textContent = `Chaos ${i} cleared — ${chaosLevelLabel(i)} · Rematch for ${reward} pts`;
      } else {
        ui.chaosLevelHint.textContent = `Chaos ${i} — ${chaosLevelLabel(i)} · Win for ${reward} pts`;
      }
    });
    ui.chaosLevelGrid.appendChild(btn);
  }
  if (ui.chaosLevelHint) {
    const cleared = save.maxChaosCleared || 0;
    ui.chaosLevelHint.textContent =
      cleared >= CHAOS_MAX_LEVEL
        ? "All Chaos levels cleared — Chaos Rift unlocked!"
        : `Progress: L${cleared}/${CHAOS_MAX_LEVEL} · Next: L${nextUnlock} · L25 unlocks Chaos Rift`;
  }
}

function openSurvivalLevelSelect() {
  hideOverlay(ui.menuOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.gameOver);
  showOverlay(ui.survivalLevelOverlay);
  setStagePlaying(false);
  startMenuBg();
  renderSurvivalLevelGrid();
  ui.hint.textContent = "Select a Survival round.";
  updateNameUI();
}

function closeSurvivalLevelSelect() {
  hideOverlay(ui.survivalLevelOverlay);
  showOverlay(ui.classicGamesOverlay);
  startMenuBg();
  updateNameUI();
}

function renderSurvivalLevelGrid() {
  if (!ui.survivalLevelGrid) return;
  ui.survivalLevelGrid.innerHTML = "";
  const nextUnlock = Math.min(SURVIVAL_MAX_ROUND, (save.maxSurvivalCleared || 0) + 1);
  for (let i = 1; i <= SURVIVAL_MAX_ROUND; i++) {
    const unlocked = isSurvivalRoundUnlocked(i);
    const cleared = i <= (save.maxSurvivalCleared || 0);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `bot-level-btn ${botTierClass(Math.min(100, Math.round(6 + ((i - 1) / 24) * 79)))}`;
    if (!unlocked) btn.classList.add("locked");
    if (cleared) btn.classList.add("cleared");
    if (i === nextUnlock && unlocked) btn.classList.add("next");
    btn.textContent = unlocked ? String(i) : "🔒";
    btn.disabled = !unlocked;
    btn.title = unlocked
      ? `Survival R${i} — ${survivalRoundLabel(i)} · +${POINTS_PER_SURVIVAL_WIN} pts${cleared ? " (cleared)" : ""}`
      : `Locked — clear Survival R${i - 1} first`;
    btn.addEventListener("click", () => {
      if (!unlocked) {
        if (ui.survivalLevelHint) {
          ui.survivalLevelHint.textContent = `Locked. Clear Survival R${i - 1} to unlock.`;
        }
        return;
      }
      playMenuClick();
      startSurvivalMode(i);
    });
    btn.addEventListener("mouseenter", () => {
      if (!ui.survivalLevelHint) return;
      if (!unlocked) {
        ui.survivalLevelHint.textContent = `Locked — beat Survival R${i - 1} first.`;
      } else if (cleared) {
        ui.survivalLevelHint.textContent = `R${i} cleared — ${survivalRoundLabel(i)} · Rematch for +${POINTS_PER_SURVIVAL_WIN} pts`;
      } else {
        ui.survivalLevelHint.textContent = `R${i} — ${survivalRoundLabel(i)} · Win for +${POINTS_PER_SURVIVAL_WIN} pts`;
      }
    });
    ui.survivalLevelGrid.appendChild(btn);
  }
  if (ui.survivalLevelHint) {
    const cleared = save.maxSurvivalCleared || 0;
    ui.survivalLevelHint.textContent =
      cleared >= SURVIVAL_MAX_ROUND
        ? "All Survival rounds cleared — Endurance unlocked!"
        : `Progress: R${cleared}/${SURVIVAL_MAX_ROUND} · Next: R${nextUnlock} · R25 unlocks Endurance`;
  }
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!musicGainNode && audioCtx) {
    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.value = 1;
    musicGainNode.connect(audioCtx.destination);
  }
  // #region agent log
  if (!ensureAudio._loggedState || ensureAudio._loggedState !== audioCtx.state) {
    ensureAudio._loggedState = audioCtx.state;
    agentLog("B", "game.js:ensureAudio", "audio context state", {
      state: audioCtx.state,
      hasGain: !!musicGainNode,
    }, "pre-fix");
  }
  // #endregion
}

function playTone(freq, start, duration, type = "sine", peak = 0.18, dest = null) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    const safePeak = Math.max(0.0002, peak || 0.0002);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(safePeak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(dest || audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch (err) {
    // #region agent log
    if (!playTone._errLogged) {
      playTone._errLogged = true;
      agentLog("C", "game.js:playTone", "playTone threw", {
        err: String(err && err.message ? err.message : err),
        freq,
        peak,
        type,
      }, "pre-fix");
    }
    // #endregion
  }
}

function playMenuClick() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(880, t, 0.05, "square", 0.1);
  playTone(1320, t + 0.03, 0.06, "triangle", 0.08);
}

function playPaddleHit() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(920 + Math.random() * 120, t, 0.09, "triangle", 0.22);
  playTone(360, t + 0.02, 0.07, "triangle", 0.08);
}

function playScoreSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(523.25, t, 0.1, "sine", 0.2);
  playTone(659.25, t + 0.09, 0.14, "sine", 0.22);
}

function playWinSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    playTone(freq, t + i * 0.11, 0.2, "square", 0.14);
  });
}

function playLossSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  [392, 349.23, 293.66, 220].forEach((freq, i) => {
    playTone(freq, t + i * 0.13, 0.22, "triangle", 0.16);
  });
}

function playPointLossSound() {
  ensureAudio();
  const t = audioCtx.currentTime;
  playTone(280, t, 0.12, "sawtooth", 0.16);
  playTone(180, t + 0.08, 0.16, "triangle", 0.14);
  playTone(110, t + 0.16, 0.22, "square", 0.1);
}

function currentMusicTrack() {
  return MUSIC_TRACKS[settings.musicTrack] || MUSIC_TRACKS.arcade;
}

function musicMasterGain() {
  if (!musicGainNode || !audioCtx) return 1;
  const now = performance.now();
  if (now - musicBlendStart >= MUSIC_BLEND_MS) return musicBlendTo;
  const t = Math.min(1, (now - musicBlendStart) / MUSIC_BLEND_MS);
  const eased = t * t * (3 - 2 * t);
  return musicBlendFrom + (musicBlendTo - musicBlendFrom) * eased;
}

function scheduleMusicStep() {
  if (!musicPlaying && !musicPreviewing) return;
  if (!settings.musicOn && !musicPreviewing) return;
  ensureAudio();
  const track = currentMusicTrack();
  const t = audioCtx.currentTime;
  const vol = musicMasterGain();
  // #region agent log
  if (musicStep < 2 || musicStep % 20 === 0) {
    agentLog("D", "game.js:scheduleMusicStep", "music tick", {
      step: musicStep,
      track: settings.musicTrack,
      vol,
      musicPlaying,
      musicPreviewing,
      musicOn: settings.musicOn,
      audioState: audioCtx && audioCtx.state,
      interval: track.interval,
    }, "pre-fix");
  }
  // #endregion
  const melody = track.melody[musicStep % track.melody.length];
  playTone(melody, t, Math.min(0.22, track.interval / 1000 * 0.75), track.melodyType, track.melodyVol * vol, musicGainNode);
  if (musicStep % 2 === 0) {
    playTone(
      track.bass[(musicStep / 2) % track.bass.length],
      t,
      Math.min(0.3, track.interval / 1000 * 1.05),
      track.bassType,
      track.bassVol * vol,
      musicGainNode
    );
  }
  if (track.pad && musicStep % 4 === 0) {
    const padNote = track.pad[(musicStep / 4) % track.pad.length];
    playTone(padNote, t, track.interval / 1000 * 3.2, "sine", (track.padVol || 0.02) * vol, musicGainNode);
  }
  musicStep += 1;
  musicTimer = setTimeout(scheduleMusicStep, track.interval);
}

function startGameMusic() {
  // #region agent log
  agentLog("A", "game.js:startGameMusic", "startGameMusic called", {
    musicOn: settings.musicOn,
    track: settings.musicTrack,
    musicPlaying,
    musicPreviewing,
    mode: s.mode,
    gameOver: s.gameOver,
  }, "pre-fix");
  // #endregion
  if (!settings.musicOn) return;
  musicPreviewing = false;
  if (musicPlaying) return;
  ensureAudio();
  musicPlaying = true;
  musicBlendFrom = 0;
  musicBlendTo = 1;
  musicBlendStart = performance.now();
  scheduleMusicStep();
  // #region agent log
  agentLog("E", "game.js:startGameMusic", "music started", {
    musicPlaying,
    audioState: audioCtx && audioCtx.state,
    track: settings.musicTrack,
  }, "pre-fix");
  // #endregion
}

function startMusicPreview() {
  // #region agent log
  agentLog("E", "game.js:startMusicPreview", "preview start", {
    track: settings.musicTrack,
    musicOn: settings.musicOn,
  }, "pre-fix");
  // #endregion
  ensureAudio();
  stopMusicTimerOnly();
  musicPreviewing = true;
  musicPlaying = false;
  musicBlendFrom = musicMasterGain() > 0.05 ? musicMasterGain() : 0;
  musicBlendTo = 1;
  musicBlendStart = performance.now();
  musicStep = 0;
  scheduleMusicStep();
}

function stopMusicTimerOnly() {
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

function stopGameMusic() {
  // #region agent log
  agentLog("E", "game.js:stopGameMusic", "music stopped", {
    wasPlaying: musicPlaying,
    wasPreview: musicPreviewing,
    mode: s.mode,
  }, "pre-fix");
  // #endregion
  musicPlaying = false;
  musicPreviewing = false;
  stopMusicTimerOnly();
}

function setMusicEnabled(on) {
  settings.musicOn = !!on;
  persistSettings();
  if (settings.musicOn) {
    const inMatch = (s.mode === "local" || s.mode === "online") && !s.gameOver;
    const settingsOpen = ui.settingsOverlay && !ui.settingsOverlay.classList.contains("hidden");
    if (inMatch) startGameMusic();
    else if (settingsOpen) startMusicPreview();
  } else {
    stopGameMusic();
  }
  refreshSettingsUI();
  if (ui.settingsMsg) {
    ui.settingsMsg.textContent = settings.musicOn
      ? `Music on · ${currentMusicTrack().name}`
      : "Music off — tap a track to preview";
  }
}

function setMusicTrack(trackId, { preview = false } = {}) {
  if (!MUSIC_TRACKS[trackId]) return;
  settings.musicTrack = trackId;
  persistSettings();
  musicBlendFrom = musicMasterGain();
  musicBlendTo = 1;
  musicBlendStart = performance.now();
  musicStep = 0;

  const settingsOpen = ui.settingsOverlay && !ui.settingsOverlay.classList.contains("hidden");
  const inMatch = (s.mode === "local" || s.mode === "online") && !s.gameOver;

  if (preview || settingsOpen) {
    startMusicPreview();
    if (ui.settingsMsg) ui.settingsMsg.textContent = `Preview: ${MUSIC_TRACKS[trackId].name}`;
  } else if (inMatch && settings.musicOn) {
    stopMusicTimerOnly();
    musicPlaying = false;
    startGameMusic();
    if (ui.settingsMsg) ui.settingsMsg.textContent = `Now playing: ${MUSIC_TRACKS[trackId].name}`;
  } else {
    refreshSettingsUI();
    if (ui.settingsMsg) ui.settingsMsg.textContent = `Selected: ${MUSIC_TRACKS[trackId].name}`;
    return;
  }
  refreshSettingsUI();
}

function isFullscreenActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function fitGameStage() {
  if (!stageEl || !canvas) return;
  const phone = document.body.classList.contains("phone-mode");
  if (!phone) {
    stageEl.style.width = "";
    stageEl.style.height = "";
    stageEl.style.maxWidth = "";
    stageEl.style.maxHeight = "";
    canvas.style.width = "";
    canvas.style.height = "";
    canvas.style.maxWidth = "";
    canvas.style.maxHeight = "";
    return;
  }

  const wrap = document.querySelector(".wrap");
  const top = document.querySelector(".top");
  const bottom = document.querySelector(".bottom");
  const ability = ui.abilityBar;
  const resign = ui.btnResign;
  const wrapStyle = wrap ? getComputedStyle(wrap) : null;
  const gap = wrapStyle ? parseFloat(wrapStyle.rowGap || wrapStyle.gap || "0") || 0 : 0;
  const padY = wrapStyle
    ? (parseFloat(wrapStyle.paddingTop) || 0) + (parseFloat(wrapStyle.paddingBottom) || 0)
    : 0;
  const padX = wrapStyle
    ? (parseFloat(wrapStyle.paddingLeft) || 0) + (parseFloat(wrapStyle.paddingRight) || 0)
    : 0;
  // Court border (2px each side) + stage padding must stay inside the viewport.
  const cupMode = typeof isCupPongMode === "function" && isCupPongMode();
  const BORDER_PAD = cupMode ? 2 : 8;
  const availW = Math.max(
    120,
    (wrap ? wrap.clientWidth : window.innerWidth) - padX - BORDER_PAD
  );
  const abilityH =
    ability && !ability.classList.contains("hidden") ? ability.offsetHeight + 8 : 0;
  const resignH =
    resign && !resign.classList.contains("hidden") ? resign.offsetHeight + 10 : 0;
  const chromeH =
    (top ? top.offsetHeight : 0) +
    (bottom ? bottom.offsetHeight : 0) +
    abilityH +
    resignH +
    gap * 2 +
    padY +
    BORDER_PAD +
    (cupMode ? 2 : 8);
  const availH = Math.max(100, window.innerHeight - chromeH);
  // Cup Pong: fill the phone width hard — table is now nearly full-canvas wide.
  let scale = Math.min(availW / W, availH / H);
  if (cupMode) {
    scale = Math.min(availW / W, availH / H);
    // Prefer width fill; allow slight height crop only if it still fits comfortably.
    const widthFill = availW / W;
    if (widthFill * H <= availH * 1.02) scale = widthFill;
  }
  const drawW = Math.max(1, Math.floor(W * scale));
  const drawH = Math.max(1, Math.floor(H * scale));
  canvas.style.boxSizing = "border-box";
  canvas.style.width = `${drawW}px`;
  canvas.style.height = `${drawH}px`;
  canvas.style.maxWidth = `min(100%, ${drawW}px)`;
  canvas.style.maxHeight = `min(100%, ${drawH}px)`;
  // Keep stage full-bleed on phone so menus/overlays aren't clipped to the canvas band.
  stageEl.style.width = "100%";
  stageEl.style.height = "100%";
  stageEl.style.maxWidth = "100%";
  stageEl.style.maxHeight = "100%";

  // #region agent log
  requestAnimationFrame(() => {
    const cr = canvas.getBoundingClientRect();
    const sr = stageEl.getBoundingClientRect();
    agentLog("B1", "game.js:fitGameStage", "phone court border fit", {
      vw: window.innerWidth,
      vh: window.innerHeight,
      portrait: window.innerHeight >= window.innerWidth,
      availW: Math.round(availW),
      availH: Math.round(availH),
      drawW,
      drawH,
      canvasL: Math.round(cr.left),
      canvasR: Math.round(cr.right),
      canvasT: Math.round(cr.top),
      canvasB: Math.round(cr.bottom),
      canvasW: Math.round(cr.width),
      canvasH: Math.round(cr.height),
      stageW: Math.round(sr.width),
      stageH: Math.round(sr.height),
      clippedRight: cr.right > window.innerWidth - 1,
      clippedLeft: cr.left < 1,
      clippedTop: cr.top < 1,
      clippedBottom: cr.bottom > window.innerHeight - 1,
      borderBox: getComputedStyle(canvas).boxSizing,
      zoom: settings.phoneZoom,
    }, "post-fix");
  });
  // #endregion
}

function applyPhoneUiTransform() {
  const phone = document.body.classList.contains("phone-mode");
  const zoom = clampPhoneZoom(settings.phoneZoom);
  settings.phoneZoom = zoom;
  if (!phone) {
    document.body.style.removeProperty("--phone-ui-scale");
    document.body.style.removeProperty("--phone-pan-x");
    document.body.style.removeProperty("--phone-pan-y");
    return;
  }
  if (zoom <= PHONE_ZOOM_DEFAULT + 0.02) {
    phonePanX = clampPhonePan(phonePanX * 0.85);
    phonePanY = clampPhonePan(phonePanY * 0.85);
    if (Math.abs(phonePanX) < 2) phonePanX = 0;
    if (Math.abs(phonePanY) < 2) phonePanY = 0;
  }
  document.body.style.setProperty("--phone-ui-scale", String(zoom));
  document.body.style.setProperty("--phone-pan-x", `${phonePanX}px`);
  document.body.style.setProperty("--phone-pan-y", `${phonePanY}px`);
}

function refreshPhoneZoomUI() {
  const zoom = clampPhoneZoom(settings.phoneZoom);
  settings.phoneZoom = zoom;
  if (ui.phoneZoomValue) ui.phoneZoomValue.textContent = `${Math.round(zoom * 100)}%`;
  if (ui.btnZoomOut) ui.btnZoomOut.disabled = zoom <= PHONE_ZOOM_MIN + 0.001;
  if (ui.btnZoomIn) ui.btnZoomIn.disabled = zoom >= PHONE_ZOOM_MAX - 0.001;
}

function setPhoneZoom(next, { persist = true, panX = null, panY = null } = {}) {
  settings.phoneZoom = clampPhoneZoom(next);
  if (panX != null) phonePanX = clampPhonePan(panX);
  if (panY != null) phonePanY = clampPhonePan(panY);
  refreshPhoneZoomUI();
  applyPhoneUiTransform();
  fitGameStage();
  // #region agent log
  if (persist) {
    agentLog("H2", "game.js:setPhoneZoom", "phone ui zoom applied", {
      zoom: settings.phoneZoom,
      panX: phonePanX,
      panY: phonePanY,
      phoneMode: document.body.classList.contains("phone-mode"),
      vw: window.innerWidth,
      vh: window.innerHeight,
      portrait: window.innerHeight >= window.innerWidth,
    });
  }
  // #endregion
  if (persist) persistSettings();
}

function nudgePhoneZoom(delta) {
  setPhoneZoom(settings.phoneZoom + delta);
}

function bindPhonePinchZoom() {
  let pinchStartDist = 0;
  let pinchStartZoom = PHONE_ZOOM_DEFAULT;
  let pinchMidStartX = 0;
  let pinchMidStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  function touchDist(touches) {
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function touchMid(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      if (!document.body.classList.contains("phone-mode") || e.touches.length !== 2) return;
      pinchStartDist = touchDist(e.touches);
      pinchStartZoom = settings.phoneZoom;
      const mid = touchMid(e.touches);
      pinchMidStartX = mid.x;
      pinchMidStartY = mid.y;
      panStartX = phonePanX;
      panStartY = phonePanY;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!document.body.classList.contains("phone-mode") || e.touches.length !== 2) return;
      if (!pinchStartDist) return;
      e.preventDefault();
      const dist = touchDist(e.touches);
      const ratio = dist / pinchStartDist;
      const mid = touchMid(e.touches);
      setPhoneZoom(pinchStartZoom * ratio, {
        persist: false,
        panX: panStartX + (mid.x - pinchMidStartX),
        panY: panStartY + (mid.y - pinchMidStartY),
      });
    },
    { passive: false }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!pinchStartDist) return;
      if (e.touches.length < 2) {
        pinchStartDist = 0;
        persistSettings();
        // #region agent log
        agentLog("H2", "game.js:bindPhonePinchZoom", "pinch ended", {
          zoom: settings.phoneZoom,
          panX: phonePanX,
          panY: phonePanY,
        });
        // #endregion
      }
    },
    { passive: true }
  );
}

function updatePhoneLayout() {
  const phone = isPhoneLike();
  document.body.classList.toggle("phone-mode", phone);
  document.body.classList.remove("phone-landscape", "phone-portrait", "ios-landscape-hint");
  applyPhoneUiTransform();
  fitGameStage();
  if (menuBg.active) resizeMenuBg();
  // #region agent log
  if (phone) {
    requestAnimationFrame(() => {
      const overlay = document.querySelector(".overlay:not(.hidden)");
      const card = overlay?.querySelector(".overlay-card");
      const wrap = document.querySelector(".wrap");
      if (!overlay || !card || !wrap || !stageEl) return;
      const or = overlay.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const sr = stageEl.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const cs = getComputedStyle(overlay);
      agentLog("H-A", "game.js:updatePhoneLayout", "phone portrait center check", {
        vw: window.innerWidth,
        vh: window.innerHeight,
        portrait: window.innerHeight >= window.innerWidth,
        zoom: settings.phoneZoom,
        panX: phonePanX,
        panY: phonePanY,
        overlayAlign: cs.alignItems,
        overlayJustify: cs.justifyContent,
        overlayOverflowY: cs.overflowY,
        stageW: Math.round(sr.width),
        stageH: Math.round(sr.height),
        stageTop: Math.round(sr.top),
        overlayW: Math.round(or.width),
        overlayH: Math.round(or.height),
        overlayScrollH: overlay.scrollHeight,
        overlayClientH: overlay.clientHeight,
        overlayScrollNeeded: overlay.scrollHeight > overlay.clientHeight + 1,
        cardH: Math.round(cr.height),
        cardScrollH: card.scrollHeight,
        cardClientH: card.clientHeight,
        cardScrollNeeded: card.scrollHeight > card.clientHeight + 1,
        cardOffsetX: Math.round(cr.left + cr.width / 2 - window.innerWidth / 2),
        cardOffsetY: Math.round(cr.top + cr.height / 2 - window.innerHeight / 2),
        stageFillsViewport: sr.height >= window.innerHeight * 0.55,
        wrapH: Math.round(wr.height),
        uiScale: getComputedStyle(document.body).getPropertyValue("--phone-ui-scale").trim(),
        runId: "post-fix",
      }, "post-fix");
    });
  }
  // #endregion
}

function initPhoneExperience() {
  updatePhoneLayout();
  refreshPhoneZoomUI();
  bindPhonePinchZoom();
  window.addEventListener("orientationchange", updatePhoneLayout);
  window.addEventListener("resize", updatePhoneLayout);
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener("change", updatePhoneLayout);
  }
}

async function enterFullscreenMode() {
  const root = document.documentElement;
  try {
    if (root.requestFullscreen) await root.requestFullscreen();
    else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
  } catch {
    /* ignore */
  }
  if (isPhoneLike() && !isFullscreenActive() && ui.fullscreenHint) {
    ui.fullscreenHint.textContent = isIOSLike()
      ? "iPhone: Add to Home Screen for a fuller display, or use your browser’s fullscreen if available."
      : "Fullscreen may be limited on this device. Try your browser’s fullscreen option.";
  }
  settings.fullscreen = isFullscreenActive();
  updatePhoneLayout();
  refreshSettingsUI();
}

async function exitFullscreenMode() {
  try {
    if (document.exitFullscreen && isFullscreenActive()) await document.exitFullscreen();
    else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    }
  } catch {
    /* ignore */
  }
  settings.fullscreen = false;
  if (ui.fullscreenHint) {
    ui.fullscreenHint.textContent = "Toggle for fullscreen when supported.";
  }
  updatePhoneLayout();
  refreshSettingsUI();
}

async function toggleFullscreenSetting() {
  if (isFullscreenActive()) {
    await exitFullscreenMode();
  } else {
    await enterFullscreenMode();
  }
}

function refreshSettingsUI() {
  if (ui.btnMusicToggle) {
    ui.btnMusicToggle.setAttribute("aria-pressed", settings.musicOn ? "true" : "false");
    ui.btnMusicToggle.textContent = settings.musicOn ? "On" : "Off";
  }
  const fsOn = isFullscreenActive();
  settings.fullscreen = fsOn;
  if (ui.btnFullscreen) {
    ui.btnFullscreen.setAttribute("aria-pressed", fsOn ? "true" : "false");
    ui.btnFullscreen.textContent = fsOn ? "On" : "Off";
  }
  if (ui.fullscreenHint && !fsOn) {
    ui.fullscreenHint.textContent = "Toggle for fullscreen when supported.";
  }
  document.querySelectorAll(".music-track-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.track === settings.musicTrack);
  });
  applyTheme();
  refreshPhoneZoomUI();
}

function openSettings() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.updatesOverlay);
  showOverlay(ui.settingsOverlay);
  setStagePlaying(false);
  refreshSettingsUI();
  ensureAudio();
  startMusicPreview();
  if (ui.settingsMsg) {
    ui.settingsMsg.textContent = settings.musicOn
      ? `Preview: ${currentMusicTrack().name}`
      : `Preview: ${currentMusicTrack().name} (music stays off in matches until you turn it on)`;
  }
  // #region agent log
  requestAnimationFrame(() => {
    const overlay = ui.settingsOverlay;
    const card = overlay?.querySelector(".settings-card");
    const body = overlay?.querySelector(".settings-body");
    const title = overlay?.querySelector(".settings-title, .overlay-title");
    if (!card || !title) return;
    const tr = title.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const or = overlay.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const ts = getComputedStyle(title);
    const ps = card.parentElement ? getComputedStyle(card.parentElement) : null;
    const clippedX = tr.left < cr.left - 0.5 || tr.right > cr.right + 0.5;
    const clippedY = tr.top < cr.top - 0.5 || tr.bottom > cr.bottom + 0.5;
    const clippedByOverlayY = tr.top < or.top - 0.5 || tr.bottom > or.bottom + 0.5;
    const titleFullyVisible = tr.top >= or.top - 0.5 && tr.bottom <= or.bottom + 0.5 && tr.height > 10;
    const scrollNeeded = !!(body && body.scrollHeight > body.clientHeight + 1);
    const bs = body ? getComputedStyle(body) : null;
    fetch("http://127.0.0.1:7263/ingest/7b680789-6fbf-44a7-9704-6ddeb5cf3ed6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38eb5e" },
      body: JSON.stringify({
        sessionId: "38eb5e",
        runId: "post-fix",
        hypothesisId: "S1",
        location: "game.js:openSettings",
        message: "settings scroll shell",
        data: {
          runTag: "post-fix",
          titleText: title.textContent,
          titleW: Math.round(tr.width),
          titleH: Math.round(tr.height),
          titleT: Math.round(tr.top),
          titleB: Math.round(tr.bottom),
          cardW: Math.round(cr.width),
          cardH: Math.round(cr.height),
          cardClientH: card.clientHeight,
          cardScrollH: card.scrollHeight,
          bodyClientH: body?.clientHeight ?? null,
          bodyScrollH: body?.scrollHeight ?? null,
          bodyOverflowY: bs?.overflowY || null,
          bodyTouchAction: bs?.touchAction || null,
          cardOverflowY: cs.overflowY,
          parentOverflowY: ps?.overflowY || null,
          clippedX,
          clippedY,
          clippedByOverlayY,
          titleFullyVisible,
          scrollNeeded,
          canReachEnd: !!(body && body.scrollHeight - body.clientHeight > 8),
          phoneMode: document.body.classList.contains("phone-mode"),
          vw: window.innerWidth,
          vh: window.innerHeight,
          cssHref: [...document.styleSheets].map((s) => s.href).filter(Boolean).slice(-1)[0] || null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
  // #endregion
}

function closeSettings() {
  hideOverlay(ui.settingsOverlay);
  if (ui.redeemPanel) ui.redeemPanel.classList.add("hidden");
  if (ui.redeemMsg) ui.redeemMsg.textContent = "";
  if (ui.redeemInput) ui.redeemInput.value = "";
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
  const inMatch = (s.mode === "local" || s.mode === "online") && !s.gameOver;
  if (inMatch && settings.musicOn) {
    musicPreviewing = false;
    if (!musicPlaying) startGameMusic();
  } else {
    stopGameMusic();
  }
}

function normalizeRedeemCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function grantRedeemReward(reward) {
  if (!reward) return null;
  if (reward.type === "cosmetic") {
    const kind = reward.kind === "table" ? "table" : "paddle";
    const item = shopItem(kind, reward.id);
    if (!item || item.id !== reward.id) return null;
    if (!save.owned[kind].includes(item.id)) save.owned[kind].push(item.id);
    save.equipped[kind] = item.id;
    return item.name;
  }
  if (reward.type === "ability" && reward.key && Object.prototype.hasOwnProperty.call(save.abilities, reward.key)) {
    save.abilities[reward.key] = true;
    persistAbilities();
    return reward.label || reward.key;
  }
  if (reward.type === "points") {
    const n = Math.max(0, Math.floor(Number(reward.amount) || 0));
    save.points += n;
    return `+${n} points`;
  }
  return null;
}

function isRedeemCodeExpired(entry) {
  if (!entry?.expiresAt) return false;
  const end = Date.parse(entry.expiresAt);
  if (!Number.isFinite(end)) return false;
  return Date.now() > end;
}

function formatRedeemExpiry(entry) {
  if (!entry?.expiresAt) return "";
  const end = Date.parse(entry.expiresAt);
  if (!Number.isFinite(end)) return "";
  const ms = end - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 1) return "expires today";
  if (days < 14) return `expires in ${days} days`;
  const d = new Date(end);
  return `expires ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function redeemCode(raw) {
  const code = normalizeRedeemCode(raw);
  if (!code) {
    if (ui.redeemMsg) ui.redeemMsg.textContent = "Enter a code.";
    return false;
  }
  const entry = REDEEM_CODES[code];
  if (!entry) {
    if (ui.redeemMsg) ui.redeemMsg.textContent = "Invalid code.";
    return false;
  }
  if (!Array.isArray(save.redeemedCodes)) save.redeemedCodes = [];
  if (save.redeemedCodes.includes(entry.id)) {
    if (ui.redeemMsg) ui.redeemMsg.textContent = "Code already redeemed — you keep your rewards.";
    return false;
  }
  if (isRedeemCodeExpired(entry)) {
    if (ui.redeemMsg) {
      ui.redeemMsg.textContent =
        "This code has expired. Players who already redeemed it keep their limited edition items.";
    }
    return false;
  }
  const granted = [];
  for (const reward of entry.rewards || []) {
    const label = grantRedeemReward(reward);
    if (label) granted.push(label);
  }
  save.redeemedCodes.push(entry.id);
  persistSave();
  updatePointsUI();
  sanitizeEquippedCosmetics();
  const expiryNote = formatRedeemExpiry(entry);
  if (ui.redeemMsg) {
    ui.redeemMsg.textContent = granted.length
      ? `Unlocked: ${granted.join(" · ")}${expiryNote ? ` · code ${expiryNote}` : ""}`
      : `Redeemed ${entry.label || entry.id}.`;
  }
  if (ui.settingsMsg) ui.settingsMsg.textContent = `Code ${entry.id} redeemed!`;
  return true;
}

function toggleRedeemPanel() {
  if (!ui.redeemPanel) return;
  const open = ui.redeemPanel.classList.toggle("hidden") === false;
  if (open) {
    if (ui.redeemMsg) {
      ui.redeemMsg.textContent =
        "Enter a redeem code. Codes can expire, but unlocked items stay yours.";
    }
    if (ui.redeemInput) {
      ui.redeemInput.value = "";
      ui.redeemInput.focus();
    }
  }
}

function updateResignButton() {
  if (!ui.btnResign) return;
  const inMatch = (s.mode === "local" || s.mode === "online") && !s.gameOver;
  const overlayBlocking = (el) =>
    !!(el && !el.classList.contains("hidden") && !el.classList.contains("closing"));
  const lobbyOpen = overlayBlocking(ui.lobbyOverlay);
  const menuOpen = overlayBlocking(ui.menuOverlay);
  const botSelectOpen =
    overlayBlocking(ui.botLevelOverlay) ||
    overlayBlocking(ui.chaosLevelOverlay) ||
    overlayBlocking(ui.survivalLevelOverlay) ||
    overlayBlocking(ui.bossLevelOverlay) ||
    overlayBlocking(ui.botModesOverlay) ||
    overlayBlocking(ui.classicGamesOverlay) ||
    overlayBlocking(ui.campaignHubOverlay) ||
    overlayBlocking(ui.arcadeHubOverlay) ||
    overlayBlocking(ui.challengeMapOverlay) ||
    overlayBlocking(ui.bossHubOverlay) ||
    overlayBlocking(ui.cupPongLevelOverlay);
  const settingsOpen = overlayBlocking(ui.settingsOverlay);
  const onlineMenuOpen =
    overlayBlocking(ui.onlineHubOverlay) ||
    overlayBlocking(ui.onlineSearchOverlay) ||
    overlayBlocking(ui.scoreboardOverlay);
  const otherMenuOpen =
    overlayBlocking(ui.customizeOverlay) ||
    overlayBlocking(ui.shopHubOverlay) ||
    overlayBlocking(ui.profileOverlay) ||
    overlayBlocking(ui.updatesOverlay) ||
    overlayBlocking(ui.inboxOverlay) ||
    overlayBlocking(ui.contactOverlay) ||
    overlayBlocking(ui.profileViewOverlay);
  const show =
    inMatch &&
    !lobbyOpen &&
    !menuOpen &&
    !botSelectOpen &&
    !settingsOpen &&
    !onlineMenuOpen &&
    !otherMenuOpen;
  ui.btnResign.classList.toggle("hidden", !show);
}

function resignMatch() {
  if (s.gameOver || (s.mode !== "local" && s.mode !== "online")) return;
  ensureAudio();
  if (s.mode === "local") {
    endGame("p2", { resigned: true, resignedByMe: true });
    return;
  }
  sendWs({ type: "resign" });
}

function updateNameUI() {
  const name = getPlayerName();
  const level = getPlayerLevel();
  if (ui.hint && hasValidName()) {
    ui.hint.innerHTML = "";
    ui.hint.append("Playing as ");
    const span = document.createElement("span");
    span.className = "player-level-inline";
    span.textContent = formatNameWithLevel(name, level);
    applyLevelClass(span, level);
    ui.hint.appendChild(span);
  }
}

function setScoreboardLabels(left, right, opts = {}) {
  const trim = (s) => {
    const t = String(s || "");
    return t.length > 18 ? `${t.slice(0, 17)}…` : t;
  };
  ui.p1Label.textContent = trim(left);
  ui.p2Label.textContent = trim(right);
  applyLevelClass(ui.p1Label, opts.p1Level != null ? opts.p1Level : null);
  applyLevelClass(ui.p2Label, opts.p2Level != null ? opts.p2Level : null);
}

function openNameOverlay(fromMenu = false) {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.passkeyOverlay);
  showOverlay(ui.nameOverlay);
  if (ui.nameInput) {
    ui.nameInput.value = getPlayerName();
    ui.nameInput.focus();
    ui.nameInput.select();
  }
  if (ui.nameMsg) ui.nameMsg.textContent = fromMenu ? "Update your name." : "Name is required to play.";
}

function closeNameOverlay() {
  hideOverlay(ui.nameOverlay);
  if (hasValidName()) {
    showOverlay(ui.menuOverlay);
    updateNameUI();
    startMenuBg();
  }
}

function submitName() {
  const raw = ui.nameInput?.value || "";
  if (!sanitizeName(raw)) {
    if (ui.nameMsg) ui.nameMsg.textContent = "Enter a name (letters/numbers).";
    return;
  }
  setPlayerName(raw);
  if (ui.nameMsg) ui.nameMsg.textContent = "";
  closeNameOverlay();
}

function requireName(action) {
  if (!hasValidName()) {
    openNameOverlay();
    return;
  }
  action();
}

const OVERLAY_FADE_MS = 200;
const overlayHideTimers = new WeakMap();

const MENU_STAGE_OVERLAYS = () => [
  ui.nameOverlay,
  ui.menuOverlay,
  ui.botModesOverlay,
  ui.classicGamesOverlay,
  ui.campaignHubOverlay,
  ui.arcadeHubOverlay,
  ui.challengeMapOverlay,
  ui.modeSoonOverlay,
  ui.botLevelOverlay,
  ui.chaosLevelOverlay,
  ui.survivalLevelOverlay,
  ui.bossHubOverlay,
  ui.bossShopOverlay,
  ui.bossLevelOverlay,
  ui.cupPongLevelOverlay,
  ui.lobbyOverlay,
  ui.onlineHubOverlay,
  ui.onlineSearchOverlay,
  ui.scoreboardOverlay,
  ui.customizeOverlay,
  ui.shopHubOverlay,
  ui.profileOverlay,
  ui.settingsOverlay,
  ui.updatesOverlay,
  ui.adminOverlay,
  ui.adminToolsOverlay,
  ui.adminPlayersOverlay,
  ui.adminPlayerDetailOverlay,
  ui.adminReportsOverlay,
  ui.adminReportDetailOverlay,
  ui.contactOverlay,
  ui.inboxOverlay,
  ui.reportPlayerOverlay,
  ui.forgotPasswordOverlay,
  ui.resetPasswordOverlay,
  ui.ticketNoticeOverlay,
  ui.passkeyOverlay,
  ui.masterClearOverlay,
];

function isMenuStageOverlay(el) {
  return MENU_STAGE_OVERLAYS().includes(el);
}

function shouldFadeOverlay(el) {
  if (!el || !isMenuStageOverlay(el)) return false;
  if (el === ui.levelUpOverlay || el === ui.gameOverOverlay) return false;
  return true;
}

function showOverlay(el) {
  if (!el) return;
  const pending = overlayHideTimers.get(el);
  if (pending) {
    clearTimeout(pending);
    overlayHideTimers.delete(el);
  }
  el.classList.remove("closing");
  if (shouldFadeOverlay(el)) el.classList.add("overlay-fade");
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  if (stageEl && isMenuStageOverlay(el)) {
    stageEl.classList.add("menu-open");
  }
  updateResignButton();
}

function hideOverlay(el, { instant = false } = {}) {
  if (!el) return;
  const pending = overlayHideTimers.get(el);
  if (pending) {
    clearTimeout(pending);
    overlayHideTimers.delete(el);
  }

  const finishHide = () => {
    el.classList.add("hidden");
    el.classList.remove("closing");
    el.setAttribute("aria-hidden", "true");
    overlayHideTimers.delete(el);
    if (stageEl && isMenuStageOverlay(el)) {
      const anyOpen = MENU_STAGE_OVERLAYS().some((o) => o && !o.classList.contains("hidden") && !o.classList.contains("closing"));
      if (!anyOpen) stageEl.classList.remove("menu-open");
    }
    updateResignButton();
  };

  if (instant || !shouldFadeOverlay(el) || el.classList.contains("hidden")) {
    finishHide();
    return;
  }

  el.classList.add("overlay-fade", "closing");
  el.setAttribute("aria-hidden", "true");
  updateResignButton();
  const timer = setTimeout(finishHide, OVERLAY_FADE_MS);
  overlayHideTimers.set(el, timer);
}

function normalizedMouseY() {
  return clamp((s.mouseY - table.y) / table.h, 0, 1);
}

function setStagePlaying(on) {
  if (!stageEl) return;
  stageEl.classList.toggle("playing", on);
  stageEl.classList.toggle("menu-open", !on && s.mode === "menu");
  updateResignButton();
  if (on) stopMenuBg();
}

function resetBall(servingToRight = true) {
  const dir = servingToRight ? 1 : -1;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  const sp = chaosSpeed0();
  const b = {
    x: table.x + table.w / 2,
    y: table.y + table.h / 2,
    vx: Math.cos(angle) * sp * dir,
    vy: Math.sin(angle) * sp,
  };
  s.balls = [b];
  s.ball = b;
  s.running = false;
  s.ability.smashing = false;
  if (!s.ability.breakFx) s.p2.broken = false;
  if (isChaosMode()) resetChaosFx(true);
  if (isBossMode()) resetBossFx(true);
  if (!s.gameOver) {
    if (isSurvivalMode()) updateSurvivalHud();
    if (isBossMode()) updateBossHud();
    ui.status.textContent = serveHint();
  }
}

function scoreFx(who, opts = {}) {
  s.fx.scoreT = 0.65;
  s.fx.who = who;
  s.fx.particles.length = 0;
  if (!opts.silent) playScoreSound();
  const cx = table.x + table.w / 2;
  const cy = table.y + table.h / 2;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.15;
    const sp = 220 + Math.random() * 360;
    s.fx.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.6 + Math.random() * 0.25,
      t: 0,
    });
  }
  const el = who === "p1" ? ui.p1 : ui.p2;
  el.classList.remove("score-pop");
  void el.offsetWidth;
  el.classList.add("score-pop");
}

function setGameOverReward(pts) {
  if (!ui.gameOverReward) return;
  if (pts > 0) {
    ui.gameOverReward.textContent = `+${pts} POINTS`;
    ui.gameOverReward.classList.remove("hidden");
  } else {
    ui.gameOverReward.textContent = "";
    ui.gameOverReward.classList.add("hidden");
  }
}

function setGameOverXp(xp) {
  if (!ui.gameOverXp) return;
  if (xp > 0) {
    ui.gameOverXp.textContent = `+${xp} XP`;
    ui.gameOverXp.classList.remove("hidden");
  } else {
    ui.gameOverXp.textContent = "";
    ui.gameOverXp.classList.add("hidden");
  }
}

let confettiRaf = 0;
let confettiPieces = [];
let confettiRunning = false;
let confettiCtx = null;

const CONFETTI_COLORS = [
  "#fef08a", "#fde047", "#ffffff", "#86efac", "#93c5fd",
  "#f9a8d4", "#fdba74", "#c4b5fd", "#67e8f9", "#fca5a5",
];

function resizeConfettiCanvas() {
  const canvas = ui.confettiCanvas;
  if (!canvas || !ui.masterClearOverlay) return;
  const rect = ui.masterClearOverlay.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  confettiCtx = canvas.getContext("2d");
  if (confettiCtx) confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

function spawnConfettiBurst(count, w, h) {
  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.35,
      w: 4 + Math.random() * 7,
      h: 6 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 3.2,
      vy: 1.2 + Math.random() * 3.4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.22,
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      flip: Math.random() * Math.PI * 2,
      vf: 0.08 + Math.random() * 0.14,
    });
  }
}

function tickConfetti() {
  if (!confettiRunning || !confettiCtx || !ui.confettiCanvas) {
    confettiRaf = 0;
    return;
  }
  const w = ui.confettiCanvas.clientWidth || 1;
  const h = ui.confettiCanvas.clientHeight || 1;
  confettiCtx.clearRect(0, 0, w, h);

  if (confettiPieces.length < 140) {
    spawnConfettiBurst(8, w, h);
  }

  for (let i = confettiPieces.length - 1; i >= 0; i--) {
    const p = confettiPieces[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.012;
    p.vx += Math.sin(p.flip) * 0.015;
    p.rot += p.vr;
    p.flip += p.vf;
    if (p.y > h + 30 || p.x < -40 || p.x > w + 40) {
      confettiPieces.splice(i, 1);
      continue;
    }
    const scaleX = Math.cos(p.flip);
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.scale(scaleX, 1);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = 0.75 + Math.abs(scaleX) * 0.25;
    confettiCtx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
    confettiCtx.restore();
  }

  confettiRaf = requestAnimationFrame(tickConfetti);
}

function startConfetti() {
  stopConfetti();
  confettiRunning = true;
  const size = resizeConfettiCanvas() || { w: 400, h: 600 };
  confettiPieces = [];
  spawnConfettiBurst(90, size.w, size.h);
  confettiRaf = requestAnimationFrame(tickConfetti);
}

function stopConfetti() {
  confettiRunning = false;
  if (confettiRaf) {
    cancelAnimationFrame(confettiRaf);
    confettiRaf = 0;
  }
  confettiPieces = [];
  if (confettiCtx && ui.confettiCanvas) {
    confettiCtx.clearRect(0, 0, ui.confettiCanvas.width, ui.confettiCanvas.height);
  }
}

function setMasterClearReward(pts, xp = 0) {
  if (ui.masterClearReward) {
    if (pts > 0) {
      ui.masterClearReward.textContent = `+${pts} POINTS`;
      ui.masterClearReward.classList.remove("hidden");
    } else {
      ui.masterClearReward.textContent = "";
      ui.masterClearReward.classList.add("hidden");
    }
  }
  if (ui.masterClearXp) {
    if (xp > 0) {
      ui.masterClearXp.textContent = `+${xp} XP`;
      ui.masterClearXp.classList.remove("hidden");
    } else {
      ui.masterClearXp.textContent = "";
      ui.masterClearXp.classList.add("hidden");
    }
  }
}

function openMasterClearCelebration(totalPts, opts = {}) {
  hideOverlay(ui.gameOver);
  if (ui.masterClearTitle) {
    ui.masterClearTitle.textContent = opts.title || "CONGRATULATIONS!";
  }
  if (ui.masterClearLead) {
    ui.masterClearLead.textContent =
      opts.lead || "You beat Master Bot — Level 100.";
  }
  if (ui.masterClearMsg) {
    ui.masterClearMsg.textContent =
      opts.msg ||
      "More updates with more bots, abilities, and different levels are coming soon!";
  }
  if (ui.masterClearScore) {
    ui.masterClearScore.textContent = `${s.p1.score} : ${s.p2.score}`;
  }
  setMasterClearReward(totalPts || 0, opts.xp || 0);
  showOverlay(ui.masterClearOverlay);
  requestAnimationFrame(() => startConfetti());
}

function closeMasterClearCelebration() {
  stopConfetti();
  hideOverlay(ui.masterClearOverlay);
}

function openUpdates() {
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.profileOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.masterClearOverlay);
  stopConfetti();
  showOverlay(ui.updatesOverlay);
  setStagePlaying(false);
  startMenuBg();
}

function closeUpdates() {
  hideOverlay(ui.updatesOverlay);
  showOverlay(ui.menuOverlay);
  startMenuBg();
}

function endGame(winner, opts = {}) {
  if (typeof stopCupPongMusic === "function" && isCupPongMode()) stopCupPongMusic();
  const justEnded = !s.gameOver;
  s.gameOver = true;
  s.running = false;
  const xpBefore = justEnded ? Math.max(0, Math.floor(save.xp || 0)) : 0;
  const xpLevelBefore = getXpLevel();
  if (isSurvivalMode()) {
    s.survival.active = false;
    setSurvivalTimerVisible(false);
  }
  if (isBossMode()) {
    setBossHudVisible(false);
    setBossPowerBarVisible(false);
  }
  ui.status.textContent = "Game over";
  stopGameMusic();
  updateResignButton();
  resetAbility();
  if (ui.abilityBar) ui.abilityBar.classList.add("hidden");
  setGameOverReward(0);
  setGameOverXp(0);

  let youWon = false;
  let clearBonus = 0;
  let winPts = 0;
  if (opts.draw) {
    youWon = false;
    ui.gameOverTitle.textContent = "DRAW";
    setGameOverReward(0);
  } else if (opts.resigned) {
    if (s.mode === "local") {
      youWon = false;
      ui.gameOverTitle.textContent = "YOU RESIGNED";
    } else {
      youWon = !opts.resignedByMe;
      ui.gameOverTitle.textContent = opts.resignedByMe ? "YOU RESIGNED" : "OPPONENT RESIGNED — YOU WIN";
      if (justEnded && youWon) {
        winPts = awardWinPoints(winner || (net.player === 1 ? "p1" : "p2"));
        setGameOverReward(winPts || POINTS_PER_WIN);
      }
    }
  } else if (s.mode === "local") {
    youWon = winner === "p1";
    if (justEnded && youWon) {
      if (s.botMode === "chaos") {
        winPts = chaosWinPoints(s.botLevel);
        if (isAdmin() && save.abilities.bonusPts) winPts = Math.max(winPts, 10);
        save.points += winPts;
        awardXp(XP_PER_CHAOS_WIN + Math.floor(s.botLevel / 2));
        clearBonus = awardChaosClear(s.botLevel);
        persistSave();
        updatePointsUI();
        const total = winPts + clearBonus;
        if (clearBonus > 0) {
          ui.gameOverTitle.textContent = `CHAOS L${s.botLevel} CLEARED`;
          setGameOverReward(total);
        } else {
          ui.gameOverTitle.textContent = "YOU WIN";
          setGameOverReward(winPts);
        }
      } else if (s.botMode === "survival") {
        winPts = POINTS_PER_SURVIVAL_WIN;
        if (isAdmin() && save.abilities.bonusPts) winPts = Math.max(winPts, 10);
        save.points += winPts;
        awardXp(XP_PER_SURVIVAL_WIN);
        clearBonus = awardSurvivalClear(s.botLevel);
        persistSave();
        updatePointsUI();
        if (clearBonus > 0) {
          ui.gameOverTitle.textContent = `SURVIVAL R${s.botLevel} CLEARED`;
          setGameOverReward(winPts);
        } else {
          ui.gameOverTitle.textContent = "YOU WIN";
          setGameOverReward(winPts);
        }
      } else if (s.botMode === "boss") {
        winPts = POINTS_PER_BOSS_WIN;
        if (isAdmin() && save.abilities.bonusPts) winPts = Math.max(winPts, 10);
        save.points += winPts;
        awardXp(XP_PER_BOSS_WIN + s.botLevel * 2);
        clearBonus = awardBossClear(s.botLevel);
        persistSave();
        updatePointsUI();
        const def = bossDef();
        if (clearBonus > 0) {
          ui.gameOverTitle.textContent = `BOSS ${s.botLevel} CLEARED`;
          setGameOverReward(winPts);
        } else {
          ui.gameOverTitle.textContent = def ? `${def.name.toUpperCase()} FALLEN` : "YOU WIN";
          setGameOverReward(winPts);
        }
      } else if (s.botMode === "cuppong") {
        winPts = POINTS_PER_CUP_PONG_WIN;
        if (isAdmin() && save.abilities.bonusPts) winPts = Math.max(winPts, 10);
        save.points += winPts;
        awardXp(XP_PER_CUP_PONG_WIN);
        clearBonus = typeof awardCupPongClear === "function" ? awardCupPongClear(s.botLevel) : 0;
        persistSave();
        updatePointsUI();
        if (clearBonus > 0) {
          ui.gameOverTitle.textContent = `CUP ${s.botLevel} CLEARED`;
          setGameOverReward(winPts);
        } else {
          ui.gameOverTitle.textContent = "YOU WIN";
          setGameOverReward(winPts);
        }
      } else {
        winPts = awardWinPoints(winner);
        clearBonus = awardBotClear(s.botLevel);
        const total = winPts + clearBonus;
        if (clearBonus > 0) {
          ui.gameOverTitle.textContent = `LEVEL ${s.botLevel} CLEARED`;
          setGameOverReward(total);
        } else {
          ui.gameOverTitle.textContent = "YOU WIN";
          setGameOverReward(winPts || POINTS_PER_WIN);
        }
      }
    } else {
      ui.gameOverTitle.textContent = youWon ? "YOU WIN" : "BOT WINS";
    }
  } else {
    youWon = (winner === "p1" && net.player === 1) || (winner === "p2" && net.player === 2);
    if (justEnded && youWon) {
      winPts = awardWinPoints(winner);
      ui.gameOverTitle.textContent = "YOU WIN";
      setGameOverReward(winPts || POINTS_PER_WIN);
    } else {
      ui.gameOverTitle.textContent = youWon ? "YOU WIN" : "YOU LOSE";
    }
  }

  const xpGained = justEnded ? Math.max(0, Math.floor(save.xp || 0) - xpBefore) : 0;
  setGameOverXp(xpGained);
  const xpLevelAfter = getXpLevel();

  ui.gameOverScore.textContent = `${s.p1.score} : ${s.p2.score}`;
  if (s.mode === "online") {
    if (justEnded) net.rematchReady = [false, false];
    updateOnlineRematchUI();
    if (ui.btnReportPlayer) {
      const canReport = !!(net.opponentName && String(net.opponentName).trim());
      ui.btnReportPlayer.classList.toggle("hidden", !canReport);
    }
  } else if (ui.gameOverRematchMsg) {
    ui.gameOverRematchMsg.textContent = "";
    ui.gameOverRematchMsg.classList.add("hidden");
    if (ui.btnReportPlayer) ui.btnReportPlayer.classList.add("hidden");
  }
  if (ui.playAgain && s.mode !== "online") {
    ui.playAgain.disabled = false;
    ui.playAgain.textContent = "Play again";
    delete ui.playAgain.dataset.onlineRematch;
  }
  if (ui.btnNextLevel) {
    const maxLevel =
      s.botMode === "chaos"
        ? CHAOS_MAX_LEVEL
        : s.botMode === "survival"
          ? SURVIVAL_MAX_ROUND
          : s.botMode === "boss"
            ? BOSS_MAX_LEVEL
            : s.botMode === "cuppong"
              ? CUP_PONG_MAX_LEVEL
              : 100;
    const showNext =
      s.mode === "local" && youWon && !opts.resigned && !opts.draw && s.botLevel < maxLevel;
    ui.btnNextLevel.classList.toggle("hidden", !showNext);
    if (showNext) {
      ui.btnNextLevel.textContent =
        s.botMode === "chaos"
          ? `Next Chaos (L${s.botLevel + 1})`
          : s.botMode === "survival"
            ? `Next round (R${s.botLevel + 1})`
            : s.botMode === "boss"
              ? `Next boss (B${s.botLevel + 1})`
              : s.botMode === "cuppong"
                ? `Next Cup (L${s.botLevel + 1})`
                : `Next level (L${s.botLevel + 1})`;
    }
  }
  if (justEnded) {
    if (opts.draw) playLossSound();
    else if (youWon) playWinSound();
    else playLossSound();
  }

  const chaosRiftUnlock =
    s.mode === "local" &&
    s.botMode === "chaos" &&
    youWon &&
    !opts.resigned &&
    s.botLevel === CHAOS_MAX_LEVEL &&
    clearBonus > 0;
  const survivalEnduranceUnlock =
    s.mode === "local" &&
    s.botMode === "survival" &&
    youWon &&
    !opts.resigned &&
    s.botLevel === SURVIVAL_MAX_ROUND &&
    clearBonus > 0;
  const bossOverlordUnlock =
    s.mode === "local" &&
    s.botMode === "boss" &&
    youWon &&
    !opts.resigned &&
    s.botLevel === BOSS_MAX_LEVEL &&
    clearBonus > 0;
  const cupBeerPongUnlock =
    s.mode === "local" &&
    s.botMode === "cuppong" &&
    youWon &&
    !opts.resigned &&
    s.botLevel === CUP_PONG_MAX_LEVEL &&
    clearBonus > 0;
  const masterClear =
    s.mode === "local" &&
    s.botMode !== "chaos" &&
    s.botMode !== "survival" &&
    s.botMode !== "boss" &&
    s.botMode !== "cuppong" &&
    youWon &&
    !opts.resigned &&
    s.botLevel === 100;
  if (chaosRiftUnlock) {
    hideOverlay(ui.gameOver);
    openMasterClearCelebration(justEnded ? winPts + clearBonus : 0, {
      title: "CHAOS RIFT UNLOCKED",
      lead: "You cleared Chaos Mode — Level 25.",
      msg: "Chaos Rift legendary cosmetic is now yours in Customize.",
      xp: xpGained,
    });
  } else if (survivalEnduranceUnlock) {
    hideOverlay(ui.gameOver);
    openMasterClearCelebration(justEnded ? winPts : 0, {
      title: "SURVIVAL ENDURANCE UNLOCKED",
      lead: "You cleared Survival Mode — Round 25.",
      msg: "Endurance Survival cosmetic is now yours in Customize.",
      xp: xpGained,
    });
  } else if (bossOverlordUnlock) {
    hideOverlay(ui.gameOver);
    openMasterClearCelebration(justEnded ? winPts : 0, {
      title: "OVERLORD UNLOCKED",
      lead: "You cleared Boss Battles — Overlord defeated.",
      msg: "Overlord BOSS cosmetic is now yours in Customize. The climb is complete!",
      xp: xpGained,
    });
  } else if (cupBeerPongUnlock) {
    hideOverlay(ui.gameOver);
    openMasterClearCelebration(justEnded ? winPts : 0, {
      title: "BEER PONG UNLOCKED",
      lead: "You cleared Cup Pong — Level 50.",
      msg: "Beer Pong cosmetics are now yours in Customize.",
      xp: xpGained,
    });
  } else if (masterClear) {
    hideOverlay(ui.gameOver);
    openMasterClearCelebration(justEnded ? winPts + clearBonus : 0, { xp: xpGained });
  } else {
    closeMasterClearCelebration();
    showOverlay(ui.gameOver);
  }

  if (justEnded && xpLevelAfter > xpLevelBefore) {
    scheduleLevelUpCelebration(xpLevelBefore, xpLevelAfter);
  }
}

function resetLocalMatch() {
  s.gameOver = false;
  s.p1.score = 0;
  s.p2.score = 0;
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  hideOverlay(ui.gameOver);
  closeMasterClearCelebration();
  closeLevelUpOverlay();
  resetAbility();
  if (isChaosMode()) resetChaosFx();
  if (isBossMode()) {
    s.boss.hpPlayer = BOSS_HP;
    s.boss.hpBoss = BOSS_HP;
    resetBossFx();
    resetBossPowersFx();
    updateBossHud();
    updateBossPowerBar();
  } else {
    setBossHudVisible(false);
    setBossPowerBarVisible(false);
  }
  if (isSurvivalMode()) {
    s.survival.timeLeft = SURVIVAL_MATCH_SECONDS;
    s.survival.active = true;
  } else {
    s.survival.active = false;
    setSurvivalTimerVisible(false);
  }
  if (isCupPongMode() && typeof resetCupPongMatch === "function") {
    resetCupPongMatch();
    setStagePlaying(true);
    startGameMusic();
    updateResignButton();
    return;
  }
  if (typeof stopCupPongMusic === "function") stopCupPongMusic();
  resetBall(true);
  if (isSurvivalMode()) updateSurvivalHud();
  if (isBossMode()) updateBossHud();
  ui.status.textContent = serveHint();
  setStagePlaying(true);
  startGameMusic();
  updateAbilityUI();
}

function serve() {
  if (s.gameOver || s.running) return;
  ensureAudio();

  if (s.mode === "online") {
    sendWs({ type: "serve" });
    return;
  }

  s.running = true;
  ui.status.textContent = "Playing";
  if (isSurvivalMode()) updateSurvivalHud();
  if (isBossMode()) updateBossHud();
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function reflectFromPaddle(p, side, ball = s.ball) {
  const h = effectivePaddleH(side);
  const mid = p.y + h / 2;
  const t = clamp((ball.y - mid) / (h / 2), -1, 1);
  const fireSmash = side === "p1" && s.mode === "local" && s.ability.armed;
  const powers = isBossMode() ? ensureBossPowersState() : null;
  const reflectHit = side === "p1" && powers?.reflectArmed && !fireSmash;
  const speed = fireSmash
    ? FIRE_SMASH_SPEED
    : reflectHit
      ? Math.max(BOSS_REFLECT_SPEED, Math.hypot(ball.vx, ball.vy) * 1.55)
      : clamp(Math.hypot(ball.vx, ball.vy) * 1.065, chaosSpeed0(), chaosSpeedMax());
  const maxBounce = fireSmash ? 0.12 * Math.PI : reflectHit ? 0.28 * Math.PI : 0.42 * Math.PI;
  const a = t * maxBounce;
  const dir = side === "p1" ? 1 : -1;
  ball.vx = Math.cos(a) * speed * dir;
  ball.vy = Math.sin(a) * speed;
  bumpChaosShake(fireSmash ? 12 : reflectHit ? 10 : 4);
  if (fireSmash) {
    s.ability.armed = false;
    s.ability.smashing = true;
    s.p2.broken = false;
    playFireSmashSound();
    ui.status.textContent = "UNSTOPPABLE SMASH!";
    updateAbilityUI();
  } else {
    playPaddleHit();
    if (side === "p1") {
      if (reflectHit) {
        powers.reflectArmed = false;
        powers.reflectCd = 20;
        ball.reflectBoost = true;
        ui.status.textContent = "REFLECT!";
        updateBossPowerBar();
      }
      registerParry();
      tryBossDecoy(ball);
    }
    if (side === "p2" && powers && ball.reflectBoost) {
      ball.reflectBoost = false;
      powers.freezeT = Math.max(powers.freezeT || 0, 10);
      bumpBossShake(12);
      ui.status.textContent = "BOSS FROZEN!";
      updateBossPowerBar();
    }
    tryChaosBallSplit(ball);
    tryTriggerChaosFog();
  }
}

function tryLocalPaddleHit(p, side, ball = s.ball) {
  if (side === "p2" && s.ability.smashing) return false;
  if (side === "p2" && s.p2.broken) return false;
  const h = effectivePaddleH(side);
  const movingToward =
    (side === "p1" && ball.vx < 0) || (side === "p2" && ball.vx > 0);
  if (!movingToward) return false;
  if (!ballOverlapsPaddleRect(ball.x, ball.y, p.x, p.y, paddle.w, h)) return false;
  if (side === "p1") ball.x = p.x + paddle.w + ballCfg.r;
  else ball.x = p.x - ballCfg.r;
  reflectFromPaddle(p, side, ball);
  return true;
}

function updateLocal(dt) {
  if (isCupPongMode()) {
    if (typeof updateCupPong === "function") updateCupPong(dt);
    return;
  }
  const p1h = effectivePaddleH("p1");
  s.p1.y = clamp(s.mouseY - p1h / 2, table.y + 6, table.y + table.h - p1h - 6);

  if (isSurvivalMode() && s.survival.active && !s.gameOver) {
    s.survival.timeLeft = Math.max(0, s.survival.timeLeft - dt);
    updateSurvivalHud();
    if (s.survival.timeLeft <= 0) {
      resolveSurvivalTimeUp();
      return;
    }
  }

  if (isChaosMode() && s.chaos.shake > 0) {
    s.chaos.shake = Math.max(0, s.chaos.shake - dt * 18);
  }
  if (isChaosMode() && s.chaos.fogTimer > 0) {
    s.chaos.fogTimer = Math.max(0, s.chaos.fogTimer - dt);
    if (s.chaos.fogTimer <= 0 && s.running && !s.gameOver && ui.status?.textContent === "FOG OF WAR!") {
      ui.status.textContent = "Playing";
    }
  }

  if (isBossMode()) {
    tickBossPowers(dt);
    const bossDt = dt * bossTimeScale();
    if (s.boss.shake > 0) s.boss.shake = Math.max(0, s.boss.shake - dt * 16);
    if (s.boss.teleportFlash > 0) s.boss.teleportFlash = Math.max(0, s.boss.teleportFlash - dt);
    if (s.boss.fogT > 0) s.boss.fogT = Math.max(0, s.boss.fogT - dt);
    if (s.boss.brokenPlayerT > 0) s.boss.brokenPlayerT = Math.max(0, s.boss.brokenPlayerT - dt);
    if (bossDt > 0) {
      tryBossGrow(bossDt);
      tryBossTeleport(bossDt);
    }
    // Laser aim/fire uses real dt so the shot always reaches the player side.
    if (updateBossLaser(dt)) return;
    updateBossHud();
  }

  const threat = pickThreatBall();
  if (threat) s.ball = threat;

  const p2h = effectivePaddleH("p2");
  const bossFrozen = isBossMode() && ensureBossPowersState().freezeT > 0;
  if (!s.gameOver && !s.p2.broken && !bossFrozen && !(isAdmin() && save.abilities.pauseBot)) {
    const botSpeed = s.ai.speed * (isBossMode() ? bossTimeScale() || 0.001 : 1);
    s.ai.timer -= dt;
    if (s.ai.timer <= 0) {
      s.ai.timer = s.ai.interval + (Math.random() * 0.04 - 0.015);
      const err = (Math.random() * 2 - 1) * s.ai.errorPx;
      const trackBall = pickThreatBall() || s.ball;
      const chaosT = isChaosMode()
        ? (s.botLevel - 1) / Math.max(1, CHAOS_MAX_LEVEL - 1)
        : isSurvivalMode()
          ? (s.botLevel - 1) / Math.max(1, SURVIVAL_MAX_ROUND - 1)
          : isBossMode()
            ? (s.botLevel - 1) / Math.max(1, BOSS_MAX_LEVEL - 1)
            : (s.botLevel - 1) / 99;
      const lead = trackBall.vx > 0 ? trackBall.vy * 0.08 * chaosT : 0;
      s.ai.targetY = trackBall.y + lead - p2h / 2 + err;
    }
    const dy = s.ai.targetY - s.p2.y;
    const maxStep = botSpeed * dt;
    s.p2.y = clamp(
      s.p2.y + clamp(dy * s.ai.track, -maxStep, maxStep),
      table.y + 6,
      table.y + table.h - p2h - 6
    );
  }

  updateBatBreakFx(dt);

  if (!s.running || s.gameOver) return;

  const balls = activeBalls();
  const top = table.y;
  const bottom = table.y + table.h;

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    applyBossSlowField(ball, dt);
    applyBossDecoyCurve(ball, dt);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y - ballCfg.r <= top) {
      ball.y = top + ballCfg.r;
      ball.vy *= -1;
    } else if (ball.y + ballCfg.r >= bottom) {
      ball.y = bottom - ballCfg.r;
      ball.vy *= -1;
    }

    if (!(isBossMode() && s.boss.brokenPlayerT > 0)) tryLocalPaddleHit(s.p1, "p1", ball);
    if (!s.ability.smashing) tryLocalPaddleHit(s.p2, "p2", ball);

    if (s.ability.smashing && ball.vx > 0 && ball.x + ballCfg.r >= s.p2.x) {
      s.ball = ball;
      breakBotBatAndScore();
      return;
    }

    if (ball.x < table.x - 40) {
      scorePointLocal("p2");
      return;
    }
    if (ball.x > table.x + table.w + 40) {
      s.ball = ball;
      if (s.ability.smashing) breakBotBatAndScore();
      else scorePointLocal("p1");
      return;
    }
  }

  syncPrimaryBall();
}

function myPaddleY() {
  const side = mySide();
  const h = effectivePaddleH(side || "p1");
  return clamp(s.mouseY - h / 2, table.y + 6, table.y + table.h - h - 6);
}

function pushSnapshot(state, serverT) {
  if (net.snap) {
    net.snapPrev = net.snap;
    net.snapPrevAt = net.snapAt;
  }
  net.snap = state;
  net.snapAt = serverT || state.t || Date.now();
}

function renderInterpolatedBall() {
  if (!net.snap?.ball) return;

  if (!inCenterCourt(net.snap.ball.x)) {
    s.ball.x = net.snap.ball.x;
    s.ball.y = net.snap.ball.y;
    s.ball.vx = net.snap.ball.vx;
    s.ball.vy = net.snap.ball.vy;
    return;
  }

  const now = Date.now();
  const renderT = now - NET_INTERP_MS;

  if (net.snapPrev?.ball && net.snapPrevAt < net.snapAt) {
    const t0 = net.snapPrevAt;
    const t1 = net.snapAt;
    const alpha = clamp((renderT - t0) / (t1 - t0), 0, 1);
    s.ball.x = net.snapPrev.ball.x + (net.snap.ball.x - net.snapPrev.ball.x) * alpha;
    s.ball.y = net.snapPrev.ball.y + (net.snap.ball.y - net.snapPrev.ball.y) * alpha;
  } else {
    s.ball.x = net.snap.ball.x;
    s.ball.y = net.snap.ball.y;
  }

  s.ball.vx = net.snap.ball.vx;
  s.ball.vy = net.snap.ball.vy;

  if (!nearPaddleZone(s.ball.x)) {
    const extrap = clamp((Date.now() - net.snapAt) / 1000, 0, NET_EXTRAP_MAX);
    s.ball.x += s.ball.vx * extrap * 0.35;
    s.ball.y += s.ball.vy * extrap * 0.35;
  }
}

function updateOnlineRematchUI() {
  const msgEl = ui.gameOverRematchMsg;
  const btn = ui.playAgain;
  if (s.mode !== "online" || !s.gameOver) {
    if (msgEl) {
      msgEl.textContent = "";
      msgEl.classList.add("hidden");
    }
    if (btn) {
      btn.disabled = false;
      if (btn.dataset.onlineRematch === "1") {
        btn.textContent = "Play again";
        delete btn.dataset.onlineRematch;
      }
    }
    return;
  }
  const me = Math.max(0, Math.min(1, (net.player || 1) - 1));
  const them = me === 0 ? 1 : 0;
  const ready = Array.isArray(net.rematchReady) ? net.rematchReady : [false, false];
  const iReady = !!ready[me];
  const theyReady = !!ready[them];
  if (btn) {
    btn.dataset.onlineRematch = "1";
    btn.disabled = iReady;
    btn.textContent = iReady ? "Waiting…" : "Rematch";
  }
  if (msgEl) {
    msgEl.classList.remove("hidden");
    if (iReady && theyReady) msgEl.textContent = "Both ready — starting…";
    else if (iReady && !theyReady) msgEl.textContent = "Waiting for opponent to rematch…";
    else if (!iReady && theyReady) msgEl.textContent = "Opponent wants a rematch — tap Rematch";
    else msgEl.textContent = "Both players must tap Rematch";
  }
}

function beginOnlineRematch() {
  net.rematchReady = [false, false];
  s.gameOver = false;
  s.p1.score = 0;
  s.p2.score = 0;
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  hideOverlay(ui.gameOver);
  closeLevelUpOverlay();
  if (ui.playAgain) {
    ui.playAgain.disabled = false;
    ui.playAgain.textContent = "Play again";
    delete ui.playAgain.dataset.onlineRematch;
  }
  if (ui.gameOverRematchMsg) {
    ui.gameOverRematchMsg.textContent = "";
    ui.gameOverRematchMsg.classList.add("hidden");
  }
  ui.status.textContent = serveHint();
  startGameMusic();
  updateResignButton();
  setStagePlaying(true);
}

function requestOnlineRematch() {
  if (s.mode !== "online" || !s.gameOver || !net.connected) return;
  const me = Math.max(0, Math.min(1, (net.player || 1) - 1));
  if (net.rematchReady[me]) return;
  sendWs({ type: "rematch" });
  // Optimistic local mark until server confirms
  net.rematchReady[me] = true;
  updateOnlineRematchUI();
}

function applyServerState(state, serverT, forceSnap = false) {
  if (forceSnap) {
    net.snapPrev = null;
  }
  pushSnapshot(state, serverT);

  if (net.player === 1) {
    net.remotePaddleY = state.p2y;
    s.p2.y = state.p2y;
  } else if (net.player === 2) {
    net.remotePaddleY = state.p1y;
    s.p1.y = state.p1y;
  }

  s.p1.score = state.p1Score;
  s.p2.score = state.p2Score;
  s.running = state.running;
  ui.p1.textContent = String(state.p1Score);
  ui.p2.textContent = String(state.p2Score);

  if (state.ball) {
    s.ball.x = state.ball.x;
    s.ball.y = state.ball.y;
    s.ball.vx = state.ball.vx;
    s.ball.vy = state.ball.vy;
    if (forceSnap || !inCenterCourt(state.ball.x)) {
      net.snapPrev = null;
    }
  }

  if (state.gameOver && state.winner) {
    endGame(state.winner);
  } else if (s.running) {
    ui.status.textContent = "Playing";
  } else if (!state.gameOver) {
    ui.status.textContent = serveHint();
  }
}

function updateOnline(dt) {
  if (s.mode !== "online" || s.gameOver) return;

  const myY = myPaddleY();
  if (net.player === 1) s.p1.y = myY;
  else if (net.player === 2) s.p2.y = myY;

  if (net.remotePaddleY != null) {
    const remote = net.player === 1 ? s.p2 : s.p1;
    const blend = 1 - Math.exp(-16 * Math.max(0.001, dt));
    remote.y += (net.remotePaddleY - remote.y) * blend;
  }

  if (s.running && net.snap?.ball) {
    renderInterpolatedBall();
    clampVisualBallAtPaddles();
  }

  const normY = normalizedMouseY();
  const now = performance.now();
  const ballNear = net.snap?.ball && nearPaddleZone(net.snap.ball.x);
  const paddleInterval = ballNear ? 33 : 50;
  if (now - net.lastPaddleSend > paddleInterval || Math.abs(normY - net.lastPaddleSentY) > 0.008) {
    sendWs({ type: "paddle", y: normY });
    net.lastPaddleSend = now;
    net.lastPaddleSentY = normY;
  }
}

function updateFx(dt) {
  if (s.fx.scoreT > 0) s.fx.scoreT = Math.max(0, s.fx.scoreT - dt);
  for (const p of s.fx.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.985;
    p.vy *= 0.985;
  }
  s.fx.particles = s.fx.particles.filter((p) => p.t < p.life);
}

function draw() {
  if (isCupPongMode() && typeof drawCupPong === "function" && drawCupPong()) {
    return;
  }
  ctx.clearRect(0, 0, W, H);
  const stock = courtStockColor();
  const ink = courtInkColor();
  ctx.fillStyle = isLightTheme() ? "#e8e8ec" : "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = stock;
  ctx.fillRect(table.x, table.y, table.w, table.h);

  ctx.save();
  if (isChaosMode() && s.chaos.shake > 0) {
    const sh = s.chaos.shake;
    ctx.translate((Math.random() - 0.5) * 2 * sh, (Math.random() - 0.5) * 2 * sh);
  } else if (isBossMode() && s.boss.shake > 0) {
    const sh = s.boss.shake;
    ctx.translate((Math.random() - 0.5) * 2 * sh, (Math.random() - 0.5) * 2 * sh);
  }

  if (s.mode === "local" || s.mode === "online") {
    drawTableHalf("p1");
    drawTableHalf("p2");
  }

  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(table.x, table.y, table.w, table.h);
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2, table.y);
  ctx.lineTo(table.x + table.w / 2, table.y + table.h);
  ctx.stroke();

  ctx.globalAlpha = 1;
  drawPaddleRect(s.p1, "p1");
  if (!(s.mode === "local" && s.p2.broken)) drawPaddleRect(s.p2, "p2");
  if (s.mode === "local") drawBatBreakFx();

  if (s.mode === "local" || s.mode === "online") {
    const p1Name = ui.p1Label?.textContent || "";
    const p2Name = ui.p2Label?.textContent || "";
    const p1Lv = s.mode === "local" ? getPlayerLevel() : net.player === 1 ? getPlayerLevel() : net.opponentLevel || 0;
    const p2Lv = s.mode === "local" ? null : net.player === 2 ? getPlayerLevel() : net.opponentLevel || 0;
    ctx.font = `bold ${isTouchDevice ? 11 : 13}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = canvasLevelColor(p1Lv);
    ctx.fillText(p1Name, table.x + table.w * 0.25, table.y - 4);
    ctx.fillStyle = canvasLevelColor(p2Lv);
    ctx.fillText(p2Name, table.x + table.w * 0.75, table.y - 4);
    ctx.globalAlpha = 1;
  }

  const drawBalls = activeBalls();
  if (s.mode === "local" && s.ability.smashing) {
    const t = performance.now() * 0.001;
    const smashBall = s.ball;
    for (let i = 0; i < 5; i++) {
      const trail = i * 10;
      const bx = smashBall.x - Math.sign(smashBall.vx || 1) * trail;
      const by = smashBall.y - Math.sign(smashBall.vy || 0) * trail * 0.15;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, ballCfg.r + 8 - i);
      g.addColorStop(0, `rgba(255,220,120,${0.45 - i * 0.07})`);
      g.addColorStop(0.5, `rgba(255,90,0,${0.28 - i * 0.04})`);
      g.addColorStop(1, "rgba(180,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by + Math.sin(t * 20 + i) * 2, ballCfg.r + 6 - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const ball of drawBalls) {
    ctx.fillStyle = s.ability.smashing && ball === s.ball ? "#ffe08a" : ink;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballCfg.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fog drawn after balls so the opponent half is smoked out
  drawChaosFogOfWar();
  drawBossFx();

  if (!s.running && (s.mode === "local" || s.mode === "online") && !s.gameOver) {
    ctx.font = `${isTouchDevice ? 14 : 16}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = ink;
    ctx.fillText(serveHint().toUpperCase(), table.x + table.w / 2, table.y + table.h / 2);
    ctx.globalAlpha = 1;
  }

  if (s.fx.scoreT > 0) {
    const t = 1 - s.fx.scoreT / 0.65;
    const pop = Math.sin(Math.min(1, t) * Math.PI);
    const cx = table.x + table.w / 2;
    const cy = table.y + table.h / 2;
    ctx.save();
    ctx.translate(cx, cy - 10);
    ctx.scale(1 + pop * 0.08, 1 + pop * 0.08);
    ctx.globalAlpha = clamp(1 - t * 0.9, 0, 1);
    ctx.fillStyle = ink;
    ctx.font = "900 54px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCORE", 0, 0);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ink;
    for (const p of s.fx.particles) {
      ctx.globalAlpha = (1 - p.t / p.life) * 0.9;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function frame(t) {
  const dt = Math.min(0.03, (t - s.lastT) / 1000);
  s.lastT = t;
  if (menuBg.active) updateMenuBg(t);
  if (s.mode === "local") updateLocal(dt);
  if (s.mode === "online") updateOnline(dt);
  updateFx(dt);
  draw();
  requestAnimationFrame(frame);
}

function wsURL() {
  if (!location.host) return null;
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}`;
}

function closeWs({ allowPresenceReconnect = true } = {}) {
  if (presenceHeartbeatTimer) {
    clearInterval(presenceHeartbeatTimer);
    presenceHeartbeatTimer = null;
  }
  if (net.searching) sendWs({ type: "cancelSearch" });
  stopSearchUI();
  if (ws) {
    try {
      ws.onclose = null;
    } catch {
      /* ignore */
    }
    try {
      ws.close();
    } catch {
      /* ignore */
    }
    ws = null;
  }
  net.connected = false;
  net.player = 0;
  net.code = "";
  net.snap = null;
  net.snapPrev = null;
  net.snapAt = 0;
  net.snapPrevAt = 0;
  net.remotePaddleY = null;
  net.opponentCosmetics = null;
  net.opponentName = "";
  net.opponentLevel = 0;
  net.opponentProfile = null;
  net.rematchReady = [false, false];
  if (allowPresenceReconnect) schedulePresenceReconnect();
}

function presencePayload(kind = "presence") {
  return {
    type: kind,
    playerId: getPlayerId(),
    name: getPlayerName(),
    level: getPlayerLevel(),
    xp: Math.max(0, Math.floor(save.xp || 0)),
    xpLevel: getXpLevel(),
    avatar: String(save.avatar || "default").slice(0, 64),
    customAvatarUrl: String(save.customAvatarUrl || "").slice(0, 240),
  };
}

function sendPresence(kind = "presence") {
  sendWs(presencePayload(kind));
}

function startPresenceHeartbeat() {
  if (presenceHeartbeatTimer) clearInterval(presenceHeartbeatTimer);
  presenceHeartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === 1) sendPresence("presencePing");
  }, 20000);
}

function schedulePresenceReconnect() {
  if (!location.host) return;
  if (presenceReconnectTimer) clearTimeout(presenceReconnectTimer);
  presenceReconnectTimer = setTimeout(() => {
    presenceReconnectTimer = null;
    ensurePresence();
  }, 600);
}

function ensurePresence() {
  if (!location.host) return;
  if (ws && ws.readyState === 1) {
    sendPresence();
    startPresenceHeartbeat();
    return;
  }
  if (ws && ws.readyState === 0) return;
  if (presenceConnecting) return;
  presenceConnecting = true;
  const url = wsURL();
  if (!url) {
    presenceConnecting = false;
    return;
  }
  try {
    if (ws) {
      try {
        ws.onclose = null;
      } catch {
        /* ignore */
      }
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
    }
    ws = new WebSocket(url);
    ws.onopen = () => {
      presenceConnecting = false;
      net.connected = true;
      sendPresence();
      startPresenceHeartbeat();
    };
    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      handleWsMessage(msg);
    };
    ws.onclose = () => {
      presenceConnecting = false;
      net.connected = false;
      stopSearchUI();
      if (presenceHeartbeatTimer) {
        clearInterval(presenceHeartbeatTimer);
        presenceHeartbeatTimer = null;
      }
      if (s.mode === "online" && !s.gameOver) {
        ui.status.textContent = "Disconnected";
      }
      schedulePresenceReconnect();
    };
  } catch {
    presenceConnecting = false;
  }
}

function sendCosmetics() {
  sendWs({
    type: "cosmetics",
    paddle: save.equipped.paddle,
    table: save.equipped.table,
    name: getPlayerName(),
    level: getPlayerLevel(),
    playerId: getPlayerId(),
    xp: Math.max(0, Math.floor(save.xp || 0)),
    xpLevel: getXpLevel(),
    avatar: String(save.avatar || "default").slice(0, 64),
    customAvatarUrl: String(save.customAvatarUrl || "").slice(0, 240),
    maxBotCleared: Math.max(0, Math.floor(save.maxBotCleared || 0)),
    maxChaosCleared: Math.max(0, Math.floor(save.maxChaosCleared || 0)),
    maxSurvivalCleared: Math.max(0, Math.floor(save.maxSurvivalCleared || 0)),
    maxBossCleared: Math.max(0, Math.floor(save.maxBossCleared || 0)),
    maxCupPongCleared: Math.max(0, Math.floor(save.maxCupPongCleared || 0)),
  });
}

function sendWs(payload) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function connectWs(onOpen) {
  const url = wsURL();
  if (!url) {
    setOnlineStatus("Online mode needs the game server. Run Start Server.bat first.");
    return;
  }
  if (presenceReconnectTimer) {
    clearTimeout(presenceReconnectTimer);
    presenceReconnectTimer = null;
  }
  closeWs({ allowPresenceReconnect: false });
  presenceConnecting = true;
  ws = new WebSocket(url);
  ws.onopen = () => {
    presenceConnecting = false;
    net.connected = true;
    sendPresence();
    sendCosmetics();
    startPresenceHeartbeat();
    onOpen();
  };
  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleWsMessage(msg);
  };
  ws.onclose = () => {
    presenceConnecting = false;
    net.connected = false;
    stopSearchUI();
    if (presenceHeartbeatTimer) {
      clearInterval(presenceHeartbeatTimer);
      presenceHeartbeatTimer = null;
    }
    if (s.mode === "online" && !s.gameOver) {
      ui.status.textContent = "Disconnected";
    }
    schedulePresenceReconnect();
  };
}

function handleWsMessage(msg) {
  if (msg.type === "searching") {
    beginSearchUI(msg.startedAt);
    return;
  }

  if (msg.type === "matchFound") {
    net.code = msg.code;
    net.player = msg.player;
    s.mode = "online";
    setOnlineLabels();
    sendCosmetics();
    showMatchFoundUI();
    return;
  }

  if (msg.type === "searchCancelled") {
    stopSearchUI();
    setOnlineStatus("Search cancelled. Try again when ready.", "search");
    return;
  }

  if (msg.type === "roomCreated") {
    net.code = msg.code;
    net.player = msg.player;
    s.mode = "online";
    setOnlineStatus(`Room code: ${msg.code} — waiting for opponent...`, "lobby");
    setOnlineLabels();
    sendCosmetics();
    return;
  }

  if (msg.type === "joined") {
    net.code = msg.code;
    net.player = msg.player;
    s.mode = "online";
    setOnlineStatus(`Joined room ${msg.code}. Waiting for match...`, "lobby");
    setOnlineLabels();
    sendCosmetics();
    return;
  }

  if (msg.type === "oCos") {
    net.opponentCosmetics = { paddle: msg.paddle || "white", table: msg.table || "classic" };
    if (msg.name) net.opponentName = sanitizeName(msg.name) || "Opponent";
    if (typeof msg.xpLevel === "number") {
      net.opponentLevel = Math.max(1, Math.min(XP_MAX_LEVEL, Math.floor(msg.xpLevel)));
    } else if (typeof msg.level === "number") {
      net.opponentLevel = Math.max(0, Math.min(XP_MAX_LEVEL, Math.floor(msg.level)));
    }
    net.opponentProfile = {
      xp: typeof msg.xp === "number" ? Math.max(0, Math.floor(msg.xp)) : 0,
      xpLevel:
        typeof msg.xpLevel === "number"
          ? Math.max(1, Math.min(XP_MAX_LEVEL, Math.floor(msg.xpLevel)))
          : net.opponentLevel || 1,
      avatar: typeof msg.avatar === "string" && msg.avatar ? String(msg.avatar).slice(0, 64) : "default",
      customAvatarUrl:
        typeof msg.customAvatarUrl === "string" ? String(msg.customAvatarUrl).slice(0, 240) : "",
      maxBotCleared:
        typeof msg.maxBotCleared === "number"
          ? Math.max(0, Math.min(100, Math.floor(msg.maxBotCleared)))
          : 0,
      maxChaosCleared:
        typeof msg.maxChaosCleared === "number" ? Math.max(0, Math.floor(msg.maxChaosCleared)) : 0,
      maxSurvivalCleared:
        typeof msg.maxSurvivalCleared === "number" ? Math.max(0, Math.floor(msg.maxSurvivalCleared)) : 0,
      maxBossCleared:
        typeof msg.maxBossCleared === "number" ? Math.max(0, Math.floor(msg.maxBossCleared)) : 0,
    };
    setOnlineLabels();
    return;
  }

  if (msg.type === "waiting") {
    setOnlineStatus(
      msg.players < 2
        ? `Room ${msg.code}: waiting for opponent (${msg.players}/2)`
        : `Room ${msg.code}: both players connected`,
      "lobby"
    );
    return;
  }

  if (msg.type === "matchReady") {
    stopSearchUI();
    hideOverlay(ui.lobbyOverlay);
    hideOverlay(ui.onlineSearchOverlay);
    hideOverlay(ui.onlineHubOverlay);
    hideOverlay(ui.scoreboardOverlay);
    s.gameOver = false;
    hideOverlay(ui.gameOver);
    setOnlineLabels();
    updateNameUI();
    ui.hint.textContent = `Online 1v1 as ${getPlayerName()}. ` + controlHint().replace("paddle. ", "your paddle. ");
    ui.status.textContent = serveHint();
    setStagePlaying(true);
    startGameMusic();
    return;
  }

  if (msg.type === "p" && typeof msg.y === "number") {
    const centerY = table.y + clamp(msg.y, 0, 1) * table.h;
    const y = clamp(centerY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);
    net.remotePaddleY = y;
    if (net.snap?.ball && nearPaddleZone(net.snap.ball.x)) {
      const remote = net.player === 1 ? s.p2 : s.p1;
      remote.y = y;
    }
    return;
  }

  if (msg.type === "opponentPaddle" && typeof msg.y === "number") {
    const centerY = table.y + clamp(msg.y, 0, 1) * table.h;
    const y = clamp(centerY - paddle.h / 2, table.y + 6, table.y + table.h - paddle.h - 6);
    net.remotePaddleY = y;
    if (net.snap?.ball && nearPaddleZone(net.snap.ball.x)) {
      const remote = net.player === 1 ? s.p2 : s.p1;
      remote.y = y;
    }
    return;
  }

  if (msg.type === "s" && msg.d) {
    const state = expandState(msg.d);
    applyServerState(state, state.t, msg.h === 1);
    if (msg.h === 1) playPaddleHit();
    if (msg.g === 1) scoreFx("p1");
    if (msg.g === 2) scoreFx("p2");
    return;
  }

  if (msg.type === "state") {
    const state = expandState(msg.state) || msg.state;
    applyServerState(state, state.t, !!msg.hit);
    if (msg.hit) playPaddleHit();
    if (msg.scored) scoreFx(msg.scored);
    return;
  }

  if (msg.type === "resigned") {
    if (Array.isArray(msg.score) && msg.score.length === 2) {
      s.p1.score = msg.score[0];
      s.p2.score = msg.score[1];
      ui.p1.textContent = String(msg.score[0]);
      ui.p2.textContent = String(msg.score[1]);
    }
    const winner = msg.by === 1 ? "p2" : "p1";
    const resignedByMe = msg.by === net.player;
    net.rematchReady = [false, false];
    endGame(winner, { resigned: true, resignedByMe });
    return;
  }

  if (msg.type === "rematchStatus") {
    const ready = Array.isArray(msg.ready) ? msg.ready : [false, false];
    net.rematchReady = [!!ready[0], !!ready[1]];
    updateOnlineRematchUI();
    return;
  }

  if (msg.type === "rematchStart") {
    beginOnlineRematch();
    return;
  }

  if (msg.type === "kicked") {
    stopGameMusic();
    stopSearchUI();
    closeWs();
    s.mode = "menu";
    s.running = false;
    s.gameOver = false;
    hideOverlay(ui.gameOver);
    hideOverlay(ui.lobbyOverlay);
    hideOverlay(ui.onlineHubOverlay);
    hideOverlay(ui.onlineSearchOverlay);
    showOverlay(ui.menuOverlay);
    setStagePlaying(false);
    ui.status.textContent = msg.reason || "Disconnected by admin";
    ui.hint.textContent = msg.reason || "You were kicked by an admin.";
    return;
  }

  if (msg.type === "profileForce" && msg.profile) {
    applyProfile(msg.profile, { replace: true });
    if (typeof msg.adminSyncedAt === "number") {
      save.adminSyncedAt = Math.max(save.adminSyncedAt || 0, Math.floor(msg.adminSyncedAt));
    }
    try {
      localStorage.setItem(SAVE_CACHE_KEY, JSON.stringify(profilePayload()));
    } catch {
      /* ignore */
    }
    updatePointsUI();
    refreshProfileUI();
    refreshAdminPanel();
    return;
  }

  if (msg.type === "opponentLeft") {
    stopGameMusic();
    stopSearchUI();
    setOnlineStatus("Opponent left the game.", "lobby");
    ui.status.textContent = "Opponent left";
    s.running = false;
    if (s.gameOver) hideOverlay(ui.gameOver);
    showOverlay(ui.lobbyOverlay);
    return;
  }

  if (msg.type === "error") {
    setOnlineStatus(msg.message);
  }
}

function setOnlineLabels() {
  const myName = formatNameWithLevel(getPlayerName() || "You", getPlayerLevel());
  const oppName = formatNameWithLevel(net.opponentName || "Opponent", net.opponentLevel || 0);
  if (net.player === 1) {
    setScoreboardLabels(myName, oppName, { p1Level: getPlayerLevel(), p2Level: net.opponentLevel || 0 });
  } else if (net.player === 2) {
    setScoreboardLabels(oppName, myName, { p1Level: net.opponentLevel || 0, p2Level: getPlayerLevel() });
  } else {
    setScoreboardLabels("LEFT", "RIGHT");
  }
}

function startLocalMode(level = 1) {
  if (!isBotLevelUnlocked(level)) {
    openBotLevelSelect();
    if (ui.botLevelHint) ui.botLevelHint.textContent = `Level ${level} is locked.`;
    return;
  }
  stopMenuBg();
  s.botMode = "classic";
  s.survival.active = false;
  applyBotLevel(level);
  s.mode = "local";
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  hideOverlay(ui.profileViewOverlay);
  setScoreboardLabels(
    formatNameWithLevel(getPlayerName() || "You", getPlayerLevel()),
    `BOT L${s.botLevel}`,
    { p1Level: getPlayerLevel(), p2Level: null }
  );
  ui.hint.textContent = `${getPlayerName()} (L${getPlayerLevel()}) vs BOT L${s.botLevel} — 10 parries → Fire Smash.`;
  resetLocalMatch();
}

function startChaosMode(level = 1) {
  if (!isChaosLevelUnlocked(level)) {
    openChaosLevelSelect();
    if (ui.chaosLevelHint) ui.chaosLevelHint.textContent = `Chaos ${level} is locked.`;
    return;
  }
  stopMenuBg();
  s.botMode = "chaos";
  s.survival.active = false;
  applyChaosBotLevel(level);
  s.mode = "local";
  resetChaosFx();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  hideOverlay(ui.profileViewOverlay);
  setScoreboardLabels(
    formatNameWithLevel(getPlayerName() || "You", getPlayerLevel()),
    `CHAOS L${s.botLevel}`,
    { p1Level: getPlayerLevel(), p2Level: null }
  );
  ui.hint.textContent = `Chaos L${s.botLevel} — 2× speed · multi-ball · shake${s.botLevel >= 10 ? " · fog after rallies" : ""}. Win for ${chaosWinPoints(s.botLevel)} pts.`;
  resetLocalMatch();
}

function startSurvivalMode(round = 1) {
  if (!isSurvivalRoundUnlocked(round)) {
    openSurvivalLevelSelect();
    if (ui.survivalLevelHint) ui.survivalLevelHint.textContent = `Survival R${round} is locked.`;
    return;
  }
  stopMenuBg();
  s.botMode = "survival";
  applySurvivalBotLevel(round);
  s.mode = "local";
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  hideOverlay(ui.profileViewOverlay);
  setScoreboardLabels(
    formatNameWithLevel(getPlayerName() || "You", getPlayerLevel()),
    `SURVIVAL R${s.botLevel}`,
    { p1Level: getPlayerLevel(), p2Level: null }
  );
  ui.hint.textContent = `Survival R${s.botLevel} — 2:00 · highest score wins · +${POINTS_PER_SURVIVAL_WIN} pts.`;
  resetLocalMatch();
}

function startBossMode(level = 1) {
  if (!isBossLevelUnlocked(level)) {
    openBossLevelSelect();
    if (ui.bossLevelHint) ui.bossLevelHint.textContent = `Boss ${level} is locked.`;
    return;
  }
  stopMenuBg();
  s.botMode = "boss";
  s.survival.active = false;
  applyBossBotLevel(level);
  s.mode = "local";
  s.boss.hpPlayer = BOSS_HP;
  s.boss.hpBoss = BOSS_HP;
  resetBossFx();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  hideOverlay(ui.profileViewOverlay);
  const def = bossDef();
  setScoreboardLabels(
    formatNameWithLevel(getPlayerName() || "You", getPlayerLevel()),
    `BOSS · ${(def?.name || `B${s.botLevel}`).toUpperCase()}`,
    { p1Level: getPlayerLevel(), p2Level: null }
  );
  ui.hint.textContent = `Boss ${s.botLevel} — ${def?.name || "Boss"} · 5 HP each · +${POINTS_PER_BOSS_WIN} pts.`;
  resetLocalMatch();
}

function openOnlineHub() {
  stopMenuBg();
  hideOverlay(ui.menuOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.gameOver);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.onlineSearchOverlay);
  hideOverlay(ui.scoreboardOverlay);
  showOverlay(ui.onlineHubOverlay);
  setStagePlaying(false);
  stopSearchUI();
  ui.hint.textContent = "Online — scoreboard, rooms, and matchmaking.";
}

function openCreateRoomLobby() {
  hideOverlay(ui.onlineHubOverlay);
  hideOverlay(ui.onlineSearchOverlay);
  hideOverlay(ui.scoreboardOverlay);
  showOverlay(ui.lobbyOverlay);
  setStagePlaying(false);
  stopSearchUI();
  setOnlineStatus("Create a room or join with a 4-letter code.", "lobby");
  ui.hint.textContent = "Create a room — share your code with a friend.";
}

function openOnlineSearchLobby() {
  hideOverlay(ui.onlineHubOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.scoreboardOverlay);
  showOverlay(ui.onlineSearchOverlay);
  setStagePlaying(false);
  stopSearchUI();
  setOnlineStatus("Ready to search for an opponent.", "search");
  ui.hint.textContent = "Online play — search for a random opponent.";
}

function scoreboardAvatarStyle(entry) {
  if (entry.customAvatarUrl) {
    return { backgroundImage: `url("${entry.customAvatarUrl}")`, text: "" };
  }
  const def = AVATAR_DEFS.find((a) => a.id === entry.avatar) || AVATAR_DEFS[0];
  if (def.image) {
    return { backgroundImage: `url("${def.image}")`, text: "" };
  }
  return { background: avatarCssBackground(def), text: def.emoji || "P" };
}

function renderOnlineScoreboard(entries) {
  const list = ui.onlineScoreboardList;
  if (!list) return;
  list.innerHTML = "";
  const rows = Array.isArray(entries) ? entries : [];
  if (!rows.length) {
    if (ui.onlineScoreboardMsg) {
      ui.onlineScoreboardMsg.textContent = "No online players logged yet. Play a match to appear here.";
    }
    return;
  }
  if (ui.onlineScoreboardMsg) {
    const onlineCount = rows.filter((e) => e.online).length;
    ui.onlineScoreboardMsg.textContent = `${rows.length} player${rows.length === 1 ? "" : "s"} · ${onlineCount} online · tap a row to view profile.`;
  }
  rows.forEach((entry) => {
    const placeNum = Math.max(1, Math.floor(entry.place || 0));
    const row = document.createElement("button");
    row.type = "button";
    row.className = `online-score-row online-score-row-btn${placeNum <= 3 ? ` place-${placeNum}` : ""}`;
    row.setAttribute("role", "listitem");
    row.title = `View ${entry.name || "player"}'s profile`;

    const place = document.createElement("div");
    place.className = "online-score-place";
    place.textContent = String(placeNum);

    const player = document.createElement("div");
    player.className = "online-score-player";
    const avatar = document.createElement("div");
    avatar.className = "online-score-avatar";
    const style = scoreboardAvatarStyle(entry);
    if (style.backgroundImage) avatar.style.backgroundImage = style.backgroundImage;
    else if (style.background) avatar.style.background = style.background;
    avatar.textContent = style.text || "";
    const meta = document.createElement("div");
    meta.className = "online-score-meta";
    const name = document.createElement("div");
    name.className = "online-score-name";
    name.textContent = entry.name || "Player";
    applyLevelClass(name, entry.rank || entry.xpLevel || 0);
    const status = document.createElement("span");
    status.className = `presence-pill presence-pill-inline ${entry.online ? "is-online" : "is-offline"}`;
    status.textContent = entry.online ? "Online" : "Offline";
    status.title = entry.online ? "Player is active now" : "Player is offline";
    const nameRow = document.createElement("div");
    nameRow.className = "online-score-name-row";
    nameRow.append(name, status);
    const stats = document.createElement("div");
    stats.className = "online-score-stats";
    stats.textContent = `L${entry.rank || 0} · XP ${entry.xpLevel || 1} · ${entry.matches || 0} played${
      entry.bestWinStreak > 0 ? ` · best ${entry.bestWinStreak} streak` : ""
    }${entry.winStreak > 1 ? ` · 🔥${entry.winStreak}` : ""}`;
    meta.append(nameRow, stats);
    player.append(avatar, meta);

    const record = document.createElement("div");
    record.className = "online-score-record";
    const wins = document.createElement("div");
    wins.className = "online-score-wins";
    wins.textContent = `${entry.wins || 0}W`;
    const wl = document.createElement("div");
    wl.className = "online-score-wl";
    wl.textContent = `${entry.wins || 0}-${entry.losses || 0}`;
    record.title = `${entry.wins || 0} wins · ${entry.losses || 0} losses · ${entry.goalsFor || 0} goals`;
    record.append(wins, wl);

    row.append(place, player, record);
    row.addEventListener("click", () => {
      playMenuClick();
      const profile = buildLeaderboardProfileView(entry);
      if (profile) openProfileView(profile);
    });
    list.appendChild(row);
  });
}

async function refreshOnlineScoreboard() {
  if (!ui.onlineScoreboardList) return;
  if (ui.onlineScoreboardMsg) ui.onlineScoreboardMsg.textContent = "Loading…";
  if (!location.host) {
    if (ui.onlineScoreboardMsg) {
      ui.onlineScoreboardMsg.textContent = "Start the game server to load the scoreboard.";
    }
    return;
  }
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 500 }),
    });
    const data = await res.json();
    if (!data?.ok) throw new Error("bad response");
    renderOnlineScoreboard(data.entries || []);
  } catch {
    if (ui.onlineScoreboardMsg) {
      ui.onlineScoreboardMsg.textContent = "Could not load scoreboard. Is the server running?";
    }
  }
}

function openOnlineScoreboard() {
  hideOverlay(ui.onlineHubOverlay);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.onlineSearchOverlay);
  showOverlay(ui.scoreboardOverlay);
  setStagePlaying(false);
  ui.hint.textContent = "Server scoreboard — online wins, rank, XP, profiles.";
  refreshOnlineScoreboard();
}

function openLobby() {
  openOnlineHub();
}

function backToMenu() {
  closeWs();
  stopGameMusic();
  stopConfetti();
  s.mode = "menu";
  s.gameOver = false;
  s.running = false;
  s.survival.active = false;
  setSurvivalTimerVisible(false);
  setBossHudVisible(false);
  setBossPowerBarVisible(false);
  hideOverlay(ui.gameOver);
  hideOverlay(ui.lobbyOverlay);
  hideOverlay(ui.onlineHubOverlay);
  hideOverlay(ui.onlineSearchOverlay);
  hideOverlay(ui.scoreboardOverlay);
  hideOverlay(ui.botLevelOverlay);
  hideOverlay(ui.chaosLevelOverlay);
  hideOverlay(ui.survivalLevelOverlay);
  hideOverlay(ui.bossHubOverlay);
  hideOverlay(ui.bossShopOverlay);
  hideOverlay(ui.bossLevelOverlay);
  hideOverlay(ui.cupPongLevelOverlay);
  hideBotCategoryOverlays();
  hideOverlay(ui.modeSoonOverlay);
  hideOverlay(ui.customizeOverlay);
  hideOverlay(ui.shopHubOverlay);
  hideOverlay(ui.settingsOverlay);
  hideOverlay(ui.updatesOverlay);
  hideOverlay(ui.adminOverlay);
  hideOverlay(ui.adminToolsOverlay);
  hideOverlay(ui.adminPlayersOverlay);
  hideOverlay(ui.adminPlayerDetailOverlay);
  hideOverlay(ui.adminReportsOverlay);
  hideOverlay(ui.adminReportDetailOverlay);
  hideOverlay(ui.contactOverlay);
  hideOverlay(ui.inboxOverlay);
  hideOverlay(ui.reportPlayerOverlay);
  hideOverlay(ui.forgotPasswordOverlay);
  hideOverlay(ui.resetPasswordOverlay);
  hideOverlay(ui.passkeyOverlay);
  hideOverlay(ui.masterClearOverlay);
  hideOverlay(ui.profileOverlay);
  closeLevelUpOverlay();
  showOverlay(ui.menuOverlay);
  setStagePlaying(false);
  setScoreboardLabels("LEFT", "RIGHT");
  ui.p1.textContent = "0";
  ui.p2.textContent = "0";
  refreshInboxBadge();
  ui.status.textContent = "Ready";
  updateNameUI();
  if (!hasValidName()) ui.hint.textContent = "Enter your name to start.";
  updatePointsUI();
  updateResignButton();
  resetAbility();
  if (ui.abilityBar) ui.abilityBar.classList.add("hidden");
  startMenuBg();
}

let adminBound = false;

function bindAdminControls() {
  if (adminBound || !isAdmin()) return;
  adminBound = true;
  const bind = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", handler);
  };
  bind(ui.btnAdminAddPts, () => {
    const n = parseInt(ui.adminPointsInput?.value, 10);
    adminAddPoints(Number.isFinite(n) ? n : 10);
  });
  bind(ui.btnAdminSetPts, () => {
    const n = parseInt(ui.adminPointsInput?.value, 10);
    adminSetPoints(Number.isFinite(n) ? n : 0);
  });
  bind(ui.btnAdminAddXp, () => {
    const n = parseInt(ui.adminXpInput?.value, 10);
    adminAddXp(Number.isFinite(n) ? n : 100);
  });
  bind(ui.btnAdminSetXp, () => {
    const n = parseInt(ui.adminXpInput?.value, 10);
    adminSetXp(Number.isFinite(n) ? n : 0);
  });
  bind(ui.btnAdminUnlockAll, adminUnlockAll);
  bind(ui.btnAdminMaxPts, () => adminAddPoints(999));
  bind(ui.btnAdminMaxXp, () => adminAddXp(999));
  bind(ui.btnAdminUnlockLevels, adminUnlockAllLevels);
  bind(ui.btnAdminUnlockChaos, adminUnlockAllChaosLevels);
  bind(ui.btnAdminUnlockSurvival, adminUnlockAllSurvivalRounds);
  bind(ui.btnAdminUnlockBoss, adminUnlockAllBossLevels);
  bind(ui.btnAdminUnlockCupPong, adminUnlockAllCupPongLevels);
  bind(ui.btnAdminSetLevel, () => {
    const n = parseInt(ui.adminLevelInput?.value, 10);
    adminSetPlayerLevel(Number.isFinite(n) ? n : 0);
  });
  bind(ui.btnAdminResetScoreboard, () => {
    adminResetScoreboard();
  });
  bind(ui.btnAdminTools, openAdminTools);
  bind(ui.btnAdminPlayers, openAdminPlayers);
  bind(ui.btnAdminReports, openAdminReports);
  bind(ui.btnAdminToolsBack, closeAdminTools);
  bind(ui.btnAdminPlayersBack, closeAdminPlayers);
  bind(ui.btnAdminPlayersRefresh, refreshAdminPlayers);
  bind(ui.btnAdminPlayerDetailBack, closeAdminPlayerDetail);
  bind(ui.btnAdminGivePts, () => {
    const n = parseInt(ui.adminPlayerAmount?.value, 10);
    adminPlayerAction("givePoints", Number.isFinite(n) ? n : 10);
  });
  bind(ui.btnAdminRemovePts, () => {
    const n = parseInt(ui.adminPlayerAmount?.value, 10);
    adminPlayerAction("removePoints", Number.isFinite(n) ? n : 10);
  });
  bind(ui.btnAdminGiveXp, () => {
    const n = parseInt(ui.adminPlayerAmount?.value, 10);
    adminPlayerAction("giveXp", Number.isFinite(n) ? n : 10);
  });
  bind(ui.btnAdminRemoveXp, () => {
    const n = parseInt(ui.adminPlayerAmount?.value, 10);
    adminPlayerAction("removeXp", Number.isFinite(n) ? n : 10);
  });
  bind(ui.btnAdminKickPlayer, () => adminPlayerAction("kick"));
  bind(ui.btnAdminBanPlayer, () => {
    const dur = ui.adminBanDuration?.value || "permanent";
    const labels = {
      "2h": "2 hours",
      "7h": "7 hours",
      "24h": "24 hours",
      "2d": "2 days",
      "7d": "7 days",
      "30d": "30 days",
      permanent: "permanently",
    };
    if (window.confirm(`Ban this player for ${labels[dur] || dur}? They will be kicked and cannot log in.`)) {
      adminPlayerAction("ban");
    }
  });
  bind(ui.btnAdminUnbanPlayer, () => adminPlayerAction("unban"));
  bind(ui.btnAdminGrantAdmin, () => {
    if (window.confirm("Give this player admin access? They will see the Admin menu.")) {
      adminPlayerAction("grantAdmin");
    }
  });
  bind(ui.btnAdminRevokeAdmin, () => {
    if (window.confirm("Remove admin access from this player?")) {
      adminPlayerAction("revokeAdmin");
    }
  });
  bind(ui.btnAdminReportsBack, closeAdminReports);
  bind(ui.btnAdminReportsRefresh, refreshAdminReports);
  bind(ui.btnAdminReportDetailBack, closeAdminReportDetail);
  bind(ui.btnReportOpen, () => adminSetTicketStatus("open"));
  bind(ui.btnReportResolved, () => adminSetTicketStatus("resolved"));
  bind(ui.btnReportClosed, () => adminSetTicketStatus("closed"));
  bind(ui.btnApprovePasswordReset, () => {
    playMenuClick();
    adminApprovePasswordReset();
  });
  bind(ui.btnDenyPasswordReset, () => {
    playMenuClick();
    adminDenyPasswordReset();
  });
  bind(ui.btnAdminCheckChat, () => {
    playMenuClick();
    adminCheckChatHistory();
  });
  bind(ui.btnForgotPassword, () => {
    playMenuClick();
    openForgotPassword();
  });
  bind(ui.btnForgotPasswordBack, () => {
    playMenuClick();
    closeForgotPassword();
  });
  bind(ui.btnForgotRequest, () => {
    playMenuClick();
    submitForgotRequest();
  });
  bind(ui.btnForgotSubmitNew, () => {
    playMenuClick();
    submitForgotNewPassword();
  });
  bind(ui.btnResetPasswordLater, () => {
    playMenuClick();
    closeResetPasswordPopup({ keepPending: true });
    showOverlay(ui.menuOverlay);
  });
  if (ui.adminLevelInput) {
    ui.adminLevelInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        const n = parseInt(ui.adminLevelInput.value, 10);
        adminSetPlayerLevel(Number.isFinite(n) ? n : 0);
      }
    });
  }
  if (ui.adminXpInput) {
    ui.adminXpInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        const n = parseInt(ui.adminXpInput.value, 10);
        adminAddXp(Number.isFinite(n) ? n : 100);
      }
    });
  }
  const bindToggle = (el, key) => {
    if (!el) return;
    el.addEventListener("change", (e) => setAdminAbility(key, e.target.checked));
  };
  bindToggle(ui.abMegaPaddle, "megaPaddle");
  bindToggle(ui.abFreeShop, "freeShop");
  bindToggle(ui.abSlowBot, "slowBot");
  bindToggle(ui.abPauseBot, "pauseBot");
  bindToggle(ui.abBonusPts, "bonusPts");
}

function submitPasskey() {
  if (ui.passkeyMsg) {
    ui.passkeyMsg.textContent = "Admin is account-only. Sign in as MikLoit in Profile.";
  }
}

function openPasskeyOverlay() {
  hideOverlay(ui.passkeyOverlay);
}

function closePasskeyOverlay() {
  hideOverlay(ui.passkeyOverlay);
  showOverlay(ui.menuOverlay);
}

function bindUi() {
  const bind = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", () => {
      playMenuClick();
      handler();
    });
  };

  bind(ui.btnLocal, () => requireName(openBotModes));
  bind(ui.btnOnline, () => requireName(openOnlineHub));
  bind(ui.btnOnlineHubBack, () => {
    hideOverlay(ui.onlineHubOverlay);
    showOverlay(ui.menuOverlay);
    startMenuBg();
  });
  bind(ui.btnOnlineScoreboard, openOnlineScoreboard);
  bind(ui.btnOnlineCreateRoom, openCreateRoomLobby);
  bind(ui.btnOnlineSearch, openOnlineSearchLobby);
  bind(ui.btnScoreboardBack, () => {
    hideOverlay(ui.scoreboardOverlay);
    showOverlay(ui.onlineHubOverlay);
  });
  bind(ui.btnScoreboardRefresh, () => {
    playMenuClick();
    refreshOnlineScoreboard();
  });
  bind(ui.btnOnlineSearchBack, () => {
    cancelMatchSearch();
    hideOverlay(ui.onlineSearchOverlay);
    showOverlay(ui.onlineHubOverlay);
  });
  bind(ui.btnBackMenu, () => {
    cancelMatchSearch();
    hideOverlay(ui.lobbyOverlay);
    showOverlay(ui.onlineHubOverlay);
  });
  bind(ui.btnProfile, () => requireName(openProfile));
  bind(ui.btnProfileBack, closeProfile);
  bind(ui.btnProfileViewBack, closeProfileView);
  bind(ui.btnLevelUpContinue, closeLevelUpOverlay);
  bind(ui.btnProfileCustomize, () => requireName(openShopHub));
  bind(ui.btnShopHubPong, () => requireName(() => openCustomize({ catalog: "pong" })));
  bind(ui.btnShopHubCup, () => requireName(() => openCustomize({ catalog: "cup" })));
  bind(ui.btnShopHubBack, closeShopHub);
  if (ui.p1Label) {
    ui.p1Label.addEventListener("click", () => {
      playMenuClick();
      onScoreboardProfileClick("p1");
    });
  }
  if (ui.p2Label) {
    ui.p2Label.addEventListener("click", () => {
      playMenuClick();
      onScoreboardProfileClick("p2");
    });
  }
  bind(ui.btnProfileSaveName, () => {
    const ok = setPlayerName(ui.profileNameInput?.value || "");
    setAuthMsg(ok ? "Name saved." : "Enter a valid name.");
    refreshProfileUI();
  });
  bind(ui.btnAuthRegister, () => {
    playMenuClick();
    authRegister();
  });
  bind(ui.btnAuthLogin, () => {
    playMenuClick();
    authLogin();
  });
  bind(ui.btnAuthLogout, () => {
    playMenuClick();
    authLogout();
  });
  if (ui.profileAvatarFile) {
    ui.profileAvatarFile.addEventListener("change", () => {
      const file = ui.profileAvatarFile.files?.[0];
      uploadProfileAvatar(file);
      ui.profileAvatarFile.value = "";
    });
  }
  bind(ui.btnSettings, openSettings);
  bind(ui.btnSettingsBack, closeSettings);
  bind(ui.btnUpdates, openUpdates);
  bind(ui.btnUpdatesBack, closeUpdates);
  bind(ui.btnBotModesBack, closeBotModes);
  bind(ui.btnCatClassicGames, openClassicGamesHub);
  bind(ui.btnCatCampaign, openCampaignHub);
  bind(ui.btnCatArcade, openArcadeHub);
  bind(ui.btnClassicGamesBack, closeClassicGamesHub);
  bind(ui.btnCampaignHubBack, closeCampaignHub);
  bind(ui.btnArcadeHubBack, closeArcadeHub);
  bind(ui.btnModeChallenge, openChallengeMap);
  bind(ui.btnChallengeMapBack, onChallengeMapBack);
  bind(ui.btnChallengeRegionBack, showChallengeWorldView);
  bind(ui.btnModeClassic, openBotLevelSelect);
  bind(ui.btnModeChaos, openChaosLevelSelect);
  bind(ui.btnModeSurvival, openSurvivalLevelSelect);
  bind(ui.btnModeBoss, openBossHub);
  bind(ui.btnModeCupPong, () => {
    if (typeof openCupPongLevelSelect === "function") openCupPongLevelSelect();
  });
  bind(ui.btnCupPongLevelBack, () => {
    if (typeof closeCupPongLevelSelect === "function") closeCupPongLevelSelect();
  });
  bind(ui.btnModeSoonBack, closeModeSoon);
  bind(ui.btnModeSoonUpdates, () => {
    hideOverlay(ui.modeSoonOverlay);
    hideBotCategoryOverlays();
    openUpdates();
  });
  bind(ui.btnChaosLevelBack, closeChaosLevelSelect);
  bind(ui.btnSurvivalLevelBack, closeSurvivalLevelSelect);
  bind(ui.btnBossHubLevels, () => {
    playMenuClick();
    openBossLevelSelect();
  });
  bind(ui.btnBossHubShop, () => {
    playMenuClick();
    openBossShop();
  });
  bind(ui.btnBossHubBack, closeBossHub);
  bind(ui.btnBossShopBack, closeBossShop);
  bind(ui.btnBossLevelBack, closeBossLevelSelect);
  const bindBossPower = (btn, id) => {
    if (!btn) return;
    const fire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      activateBossPower(id);
    };
    btn.addEventListener("click", fire);
  };
  bindBossPower(ui.btnBossPowerBlock, "block");
  bindBossPower(ui.btnBossPowerIron, "iron");
  bindBossPower(ui.btnBossPowerTimeslow, "timeslow");
  bindBossPower(ui.btnBossPowerReflect, "reflect");
  document.querySelectorAll(".chaos-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      playMenuClick();
      const level = parseInt(btn.dataset.level, 10) || 1;
      if (!isChaosLevelUnlocked(level)) {
        if (ui.chaosLevelHint) {
          ui.chaosLevelHint.textContent = `Locked — clear Chaos ${level - 1} first.`;
        }
        return;
      }
      startChaosMode(level);
    });
  });
  document.querySelectorAll(".survival-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      playMenuClick();
      const level = parseInt(btn.dataset.level, 10) || 1;
      if (!isSurvivalRoundUnlocked(level)) {
        if (ui.survivalLevelHint) {
          ui.survivalLevelHint.textContent = `Locked — clear Survival R${level - 1} first.`;
        }
        return;
      }
      startSurvivalMode(level);
    });
  });
  document.querySelectorAll(".boss-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      playMenuClick();
      const level = parseInt(btn.dataset.level, 10) || 1;
      if (!isBossLevelUnlocked(level)) {
        if (ui.bossLevelHint) {
          ui.bossLevelHint.textContent = `Locked — clear Boss ${level - 1} first.`;
        }
        return;
      }
      startBossMode(level);
    });
  });
  bind(ui.btnMasterMenu, backToMenu);
  bind(ui.btnMasterPlayAgain, () => {
    closeMasterClearCelebration();
    if (s.mode === "local") resetLocalMatch();
  });
  bind(ui.btnRedeemCode, toggleRedeemPanel);
  bind(ui.btnRedeemSubmit, () => {
    redeemCode(ui.redeemInput?.value);
  });
  if (ui.redeemInput) {
    ui.redeemInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        redeemCode(ui.redeemInput.value);
      }
    });
  }
  bind(ui.btnFullscreen, () => {
    toggleFullscreenSetting();
  });
  bind(ui.btnZoomOut, () => {
    nudgePhoneZoom(-0.06);
  });
  bind(ui.btnZoomIn, () => {
    nudgePhoneZoom(0.06);
  });
  bind(ui.btnMusicToggle, () => {
    setMusicEnabled(!settings.musicOn);
  });
  if (ui.themeSwitch) {
    ui.themeSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-switch-btn");
      if (!btn || !btn.dataset.theme) return;
      playMenuClick();
      setTheme(btn.dataset.theme);
    });
  }
  if (ui.musicTrackGrid) {
    ui.musicTrackGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".music-track-btn");
      if (!btn || !btn.dataset.track) return;
      playMenuClick();
      setMusicTrack(btn.dataset.track, { preview: true });
    });
  } else {
    document.querySelectorAll(".music-track-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        playMenuClick();
        setMusicTrack(btn.dataset.track, { preview: true });
      });
    });
  }
  document.addEventListener("fullscreenchange", refreshSettingsUI);
  document.addEventListener("webkitfullscreenchange", refreshSettingsUI);
  bind(ui.btnNameSubmit, submitName);
  bind(ui.btnBotLevelBack, closeBotLevelSelect);
  document.querySelectorAll(".bot-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      playMenuClick();
      const level = parseInt(btn.dataset.level, 10) || 1;
      if (!isBotLevelUnlocked(level)) {
        if (ui.botLevelHint) {
          ui.botLevelHint.textContent = `Locked — clear level ${level - 1} first.`;
        }
        return;
      }
      startLocalMode(level);
    });
  });
  if (ui.nameInput) {
    ui.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        submitName();
      }
    });
  }
  bind(ui.btnCustomizeBack, closeCustomize);
  bind(ui.btnAdmin, openAdminOrPasskey);
  bind(ui.btnAdminBack, closeAdmin);
  bind(ui.btnContact, openContact);
  bind(ui.btnContactBack, closeContact);
  bind(ui.btnContactGoProfile, () => {
    hideOverlay(ui.contactOverlay);
    if (typeof openProfile === "function") openProfile();
    else {
      showOverlay(ui.profileOverlay);
      refreshProfileUI();
    }
  });
  bind(ui.btnContactSubmit, submitContactTicket);
  bind(ui.btnInbox, openInbox);
  bind(ui.btnInboxBack, closeInbox);
  bind(ui.btnInboxGoProfile, () => {
    hideOverlay(ui.inboxOverlay);
    openProfile();
  });
  bind(ui.btnInboxRulesToggle, () => {
    playMenuClick();
    toggleInboxRules();
  });
  bind(ui.btnInboxNew, () => {
    playMenuClick();
    openInboxCompose();
  });
  bind(ui.btnInboxRefresh, () => {
    playMenuClick();
    refreshInboxThreads();
  });
  bind(ui.btnInboxLookup, () => {
    playMenuClick();
    lookupInboxUser();
  });
  bind(ui.btnInboxSendNew, () => {
    playMenuClick();
    sendInboxCompose();
  });
  bind(ui.btnInboxComposeBack, () => {
    playMenuClick();
    showInboxPane("list");
    refreshInboxThreads();
  });
  bind(ui.btnInboxReply, () => {
    playMenuClick();
    sendInboxReply();
  });
  bind(ui.btnInboxThreadBack, () => {
    playMenuClick();
    showInboxPane("list");
    refreshInboxThreads();
  });
  bind(ui.btnInboxReport, () => {
    playMenuClick();
    reportInboxPlayer();
  });
  if (ui.inboxReplyBody) {
    ui.inboxReplyBody.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendInboxReply();
      }
    });
  }
  bind(ui.btnReportPlayer, () => {
    playMenuClick();
    openReportPlayer();
  });
  bind(ui.btnReportPlayerBack, () => {
    playMenuClick();
    closeReportPlayer();
  });
  bind(ui.btnReportPlayerSubmit, () => {
    playMenuClick();
    submitReportPlayer();
  });
  bind(ui.btnTicketNoticeOk, dismissTicketNotice);
  bind(ui.backToMenu, backToMenu);
  bind(ui.btnCreateRoom, () => connectWs(() => sendWs({ type: "create", ...presencePayload("create") })));
  bind(ui.btnSearch, startMatchSearch);
  bind(ui.btnCancelSearch, cancelMatchSearch);
  bind(ui.btnJoinRoom, () => {
    const code = ui.roomCodeInput.value.trim().toUpperCase();
    if (code.length !== 4) {
      ui.lobbyStatus.textContent = "Enter a 4-letter room code.";
      return;
    }
    connectWs(() => sendWs({ type: "join", code, ...presencePayload("join") }));
  });
  bind(ui.playAgain, () => {
    if (s.mode === "online") {
      requestOnlineRematch();
      return;
    }
    if (s.botMode === "chaos") {
      applyChaosBotLevel(s.botLevel);
      resetLocalMatch();
      return;
    }
    if (s.botMode === "survival") {
      applySurvivalBotLevel(s.botLevel);
      resetLocalMatch();
      return;
    }
    if (s.botMode === "boss") {
      applyBossBotLevel(s.botLevel);
      resetLocalMatch();
      return;
    }
    if (s.botMode === "cuppong") {
      if (typeof applyCupPongBotLevel === "function") applyCupPongBotLevel(s.botLevel);
      resetLocalMatch();
      return;
    }
    applyBotLevel(s.botLevel);
    resetLocalMatch();
  });
  bind(ui.btnNextLevel, () => {
    if (s.mode !== "local") return;
    if (s.botMode === "chaos") {
      const next = Math.min(CHAOS_MAX_LEVEL, (s.botLevel || 1) + 1);
      if (!isChaosLevelUnlocked(next)) {
        openChaosLevelSelect();
        if (ui.chaosLevelHint) {
          ui.chaosLevelHint.textContent = `Chaos ${next} is locked. Clear Chaos ${next - 1} first.`;
        }
        return;
      }
      startChaosMode(next);
      return;
    }
    if (s.botMode === "survival") {
      const next = Math.min(SURVIVAL_MAX_ROUND, (s.botLevel || 1) + 1);
      if (!isSurvivalRoundUnlocked(next)) {
        openSurvivalLevelSelect();
        if (ui.survivalLevelHint) {
          ui.survivalLevelHint.textContent = `Survival R${next} is locked. Clear R${next - 1} first.`;
        }
        return;
      }
      startSurvivalMode(next);
      return;
    }
    if (s.botMode === "boss") {
      const next = Math.min(BOSS_MAX_LEVEL, (s.botLevel || 1) + 1);
      if (!isBossLevelUnlocked(next)) {
        openBossLevelSelect();
        if (ui.bossLevelHint) {
          ui.bossLevelHint.textContent = `Boss ${next} is locked. Clear Boss ${next - 1} first.`;
        }
        return;
      }
      startBossMode(next);
      return;
    }
    if (s.botMode === "cuppong") {
      const next = Math.min(CUP_PONG_MAX_LEVEL, (s.botLevel || 1) + 1);
      if (typeof isCupPongLevelUnlocked === "function" && !isCupPongLevelUnlocked(next)) {
        openCupPongLevelSelect();
        if (ui.cupPongLevelHint) {
          ui.cupPongLevelHint.textContent = `Cup ${next} is locked. Clear Cup ${next - 1} first.`;
        }
        return;
      }
      startCupPongMode(next);
      return;
    }
    const next = Math.min(100, (s.botLevel || 1) + 1);
    if (!isBotLevelUnlocked(next)) {
      openBotLevelSelect();
      if (ui.botLevelHint) {
        ui.botLevelHint.textContent = `Level ${next} is locked. Clear level ${next - 1} first.`;
      }
      return;
    }
    startLocalMode(next);
  });

  bind(ui.btnResign, resignMatch);

  bindAdminControls();

  bind(ui.btnPasskeySubmit, submitPasskey);
  bind(ui.btnPasskeyCancel, closePasskeyOverlay);
  if (ui.passkeyInput) {
    ui.passkeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        playMenuClick();
        submitPasskey();
      }
    });
  }

  let titleClicks = 0;
  let titleClickTimer = null;
  if (ui.titleEl) {
    ui.titleEl.style.cursor = "default";
    ui.titleEl.addEventListener("click", () => {
      titleClicks += 1;
      clearTimeout(titleClickTimer);
      titleClickTimer = setTimeout(() => {
        titleClicks = 0;
      }, 700);
      if (titleClicks >= 3) {
        titleClicks = 0;
        playMenuClick();
        if (isAdmin()) openAdmin();
      }
    });
  }

}

function setPointerFromClient(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  if (typeof clientX === "number") {
    s.mouseX = ((clientX - r.left) / r.width) * W;
  }
  if (typeof clientY === "number") {
    const y = ((clientY - r.top) / r.height) * H;
    // Cup Pong uses the full canvas (portrait court); classic modes stay table-clamped.
    if (typeof isCupPongMode === "function" && isCupPongMode()) {
      s.mouseY = clamp(y, 0, H);
    } else {
      s.mouseY = clamp(y, table.y, table.y + table.h);
    }
  }
}

function setPaddleFromClientY(clientY) {
  setPointerFromClient(undefined, clientY);
}

function bindCanvasInput() {
  canvas.style.touchAction = "none";

  canvas.addEventListener("mousemove", (e) => setPointerFromClient(e.clientX, e.clientY));

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setPointerFromClient(e.clientX, e.clientY);
    if (s.mode !== "local" && s.mode !== "online") return;
    if (isCupPongMode()) {
      if (typeof cupPongPointerDown === "function") cupPongPointerDown(s.mouseX, s.mouseY);
      return;
    }
    if (s.mode === "local" && s.running && tryActivateFireSmash()) return;
    serve();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    setPointerFromClient(e.clientX, e.clientY);
    if (isCupPongMode() && typeof cupPongPointerMove === "function") {
      cupPongPointerMove(s.mouseX, s.mouseY);
    }
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches[0]) setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
        if (isCupPongMode() && typeof cupPongPointerMove === "function") {
          cupPongPointerMove(s.mouseX, s.mouseY);
        }
      }
    },
    { passive: false }
  );
}

bindCanvasInput();

const MENU_BG_COLORS = [
  "#ff4d6d", "#ff9f1c", "#2ec4b6", "#7b2cbf", "#4361ee",
  "#06d6a0", "#ef476f", "#ffd166", "#118ab2", "#f72585",
  "#4cc9f0", "#80ed99", "#f4a261", "#e76f51", "#a2d2ff",
];
const MENU_BG_SHAPES = ["circle", "square", "triangle", "diamond", "ring"];

const menuBg = {
  canvas: document.getElementById("menuBg"),
  ctx: null,
  shapes: [],
  active: false,
  lastT: 0,
  w: 0,
  h: 0,
};

function resizeMenuBg() {
  if (!menuBg.canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  menuBg.w = window.innerWidth;
  menuBg.h = window.innerHeight;
  menuBg.canvas.width = Math.floor(menuBg.w * dpr);
  menuBg.canvas.height = Math.floor(menuBg.h * dpr);
  menuBg.ctx = menuBg.canvas.getContext("2d");
  menuBg.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnMenuShape(fromEdge = true) {
  const size = 10 + Math.random() * 42;
  const color = MENU_BG_COLORS[Math.floor(Math.random() * MENU_BG_COLORS.length)];
  const kind = MENU_BG_SHAPES[Math.floor(Math.random() * MENU_BG_SHAPES.length)];
  const speed = 18 + Math.random() * 55;
  const angle = Math.random() * Math.PI * 2;
  let x;
  let y;
  if (fromEdge) {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      x = -size;
      y = Math.random() * menuBg.h;
    } else if (edge === 1) {
      x = menuBg.w + size;
      y = Math.random() * menuBg.h;
    } else if (edge === 2) {
      x = Math.random() * menuBg.w;
      y = -size;
    } else {
      x = Math.random() * menuBg.w;
      y = menuBg.h + size;
    }
  } else {
    x = Math.random() * menuBg.w;
    y = Math.random() * menuBg.h;
  }
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    color,
    kind,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.4,
    life: 0,
    maxLife: 6 + Math.random() * 10,
    alpha: 0,
  };
}

function drawMenuShape(ctx, sh) {
  ctx.save();
  ctx.translate(sh.x, sh.y);
  ctx.rotate(sh.rot);
  ctx.globalAlpha = sh.alpha;
  ctx.fillStyle = sh.color;
  ctx.strokeStyle = sh.color;
  ctx.lineWidth = Math.max(2, sh.size * 0.12);
  const r = sh.size;
  if (sh.kind === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sh.kind === "ring") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sh.kind === "square") {
    ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
  } else if (sh.kind === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.45, 0);
    ctx.lineTo(0, r * 0.55);
    ctx.lineTo(-r * 0.45, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.5, r * 0.45);
    ctx.lineTo(-r * 0.5, r * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function updateMenuBg(now) {
  if (!menuBg.active || !menuBg.ctx) return;
  const dt = Math.min(0.05, (now - menuBg.lastT) / 1000 || 0.016);
  menuBg.lastT = now;
  const ctx = menuBg.ctx;
  ctx.clearRect(0, 0, menuBg.w, menuBg.h);

  const light = isLightTheme();
  const g = ctx.createRadialGradient(
    menuBg.w * 0.5,
    menuBg.h * 0.45,
    40,
    menuBg.w * 0.5,
    menuBg.h * 0.5,
    Math.max(menuBg.w, menuBg.h) * 0.75
  );
  if (light) {
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, "#f4f4f6");
    g.addColorStop(1, "#e8e9ee");
  } else {
    g.addColorStop(0, "#12121a");
    g.addColorStop(0.55, "#08080c");
    g.addColorStop(1, "#030305");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, menuBg.w, menuBg.h);

  while (menuBg.shapes.length < 42) {
    menuBg.shapes.push(spawnMenuShape(menuBg.shapes.length > 12));
  }

  for (const sh of menuBg.shapes) {
    sh.life += dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.rot += sh.spin * dt;
    const fadeIn = Math.min(1, sh.life / 0.8);
    const fadeOut = Math.min(1, (sh.maxLife - sh.life) / 1.2);
    const peak = light ? 0.42 : 0.72;
    sh.alpha = Math.max(0, Math.min(peak, fadeIn * fadeOut * peak));
    drawMenuShape(ctx, sh);
  }

  menuBg.shapes = menuBg.shapes.filter((sh) => {
    if (sh.life >= sh.maxLife) return false;
    const m = sh.size + 60;
    return sh.x > -m && sh.x < menuBg.w + m && sh.y > -m && sh.y < menuBg.h + m;
  });
}

function startMenuBg() {
  if (!menuBg.canvas) return;
  resizeMenuBg();
  if (!menuBg.shapes.length) {
    for (let i = 0; i < 36; i++) menuBg.shapes.push(spawnMenuShape(false));
  }
  menuBg.active = true;
  menuBg.lastT = performance.now();
  document.body.classList.add("menu-bg-active");
}

function stopMenuBg() {
  menuBg.active = false;
  document.body.classList.remove("menu-bg-active");
  if (menuBg.ctx && menuBg.w) menuBg.ctx.clearRect(0, 0, menuBg.w, menuBg.h);
}

window.addEventListener("resize", () => {
  updatePhoneLayout();
  if (menuBg.active) resizeMenuBg();
  if (confettiRunning) resizeConfettiCanvas();
});

async function boot() {
  loadSettings();
  applyTheme();
  await loadSave();
  updatePointsUI();
  initAdminUi();
  bindUi();
  initPhoneExperience();
  refreshSettingsUI();
  if (hasValidName()) {
    hideOverlay(ui.nameOverlay);
    showOverlay(ui.menuOverlay);
    updateNameUI();
    startMenuBg();
  } else {
    hideOverlay(ui.menuOverlay);
    showOverlay(ui.nameOverlay);
    if (ui.nameInput) ui.nameInput.focus();
    ui.hint.textContent = "Enter your name to start.";
    startMenuBg();
  }
  if (stageEl) stageEl.classList.add("menu-open");
  updatePhoneLayout();
  if (getPendingResetUsername()) startPasswordResetPoll(getPendingResetUsername());
  ensurePresence();
  requestAnimationFrame(frame);
}

boot();
