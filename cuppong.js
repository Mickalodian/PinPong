/* CupPong — beer-pong style bot mode (loaded after game.js) */
(function () {
  const CUP_PONG_MAX_LEVEL = 50;
  const POINTS_PER_CUP_PONG_WIN = 4;
  const XP_PER_CUP_PONG_WIN = 50;
  const CUP_ROWS = [4, 3, 2, 1];
  const CUP_R_DESKTOP = 15;
  const CUP_R_PHONE = 22;
  const GRAVITY = 980;
  const BOUNCE_REST = 0.58;
  const FLICK_MIN_SPEED = 220;
  const FLICK_MAX_SPEED = 3200;
  const PICKUP_RADIUS_DESKTOP = 56;
  const PICKUP_RADIUS_PHONE = 78;
  const FLICK_SAMPLE_MS = 90;

  let musicRestoreTrack = "";
  let cupMusicActive = false;

  /** Portrait beer-pong court (you at bottom, bot at top). Independent of classic pong `table`. */
  const court = { x: 0, y: 0, w: 0, h: 0 };

  function cupPhoneLayout() {
    return typeof isPhoneLike === "function"
      ? isPhoneLike()
      : !!(typeof document !== "undefined" && document.body?.classList?.contains("phone-mode"));
  }

  function cupRadius() {
    return cupPhoneLayout() ? CUP_R_PHONE : CUP_R_DESKTOP;
  }

  function cupPickupRadius() {
    return cupPhoneLayout() ? PICKUP_RADIUS_PHONE : PICKUP_RADIUS_DESKTOP;
  }

  function refreshCupCourt() {
    const phone = cupPhoneLayout();
    // Phone: nearly full canvas width so the table fills the handset when scaled.
    // Desktop: classic portrait strip with room for side margins.
    const edge = phone ? 4 : 6;
    const h = H - edge * 2;
    const w = phone
      ? Math.round(Math.min(W - 12, Math.max(640, h * 1.55)))
      : Math.round(Math.min(420, Math.max(340, h * 0.78)));
    court.x = Math.round((W - w) / 2);
    court.y = edge;
    court.w = w;
    court.h = h;
  }

  function clampOnCourtX(x) {
    return clamp(x, court.x + 18, court.x + court.w - 18);
  }

  function clampHandBall(x, y) {
    return {
      x: clamp(x, court.x + 18, court.x + court.w - 18),
      y: clamp(y, court.y + court.h * 0.55, court.y + court.h - 22),
    };
  }

  function ensureCupState() {
    if (!s.cupPong) {
      s.cupPong = createCupState();
    }
    return s.cupPong;
  }

  function playerBallHome() {
    refreshCupCourt();
    return {
      x: court.x + court.w / 2,
      y: court.y + court.h - 34,
      z: 0,
    };
  }

  function createCupState() {
    const home = playerBallHome();
    return {
      playerCups: [],
      botCups: [],
      turn: "player",
      phase: "aim",
      holding: false,
      handBall: { x: home.x, y: home.y, z: home.z },
      flickSamples: [],
      aimY: home.y,
      throw: null,
      botThinkT: 0,
      botPlan: null,
      aimNoise: 42,
      powerErr: 0.22,
      thinkDelay: 1.1,
      rimOutChance: 0.28,
      splash: [],
    };
  }

  function resetHandBall() {
    const cp = ensureCupState();
    const home = playerBallHome();
    cp.handBall.x = home.x;
    cp.handBall.y = home.y;
    cp.handBall.z = home.z;
    cp.holding = false;
    cp.flickSamples = [];
  }

  function pushFlickSample(x, y) {
    const cp = ensureCupState();
    const t = performance.now();
    cp.flickSamples.push({ x, y, t });
    while (cp.flickSamples.length > 24) cp.flickSamples.shift();
    const cutoff = t - FLICK_SAMPLE_MS - 40;
    while (cp.flickSamples.length && cp.flickSamples[0].t < cutoff) cp.flickSamples.shift();
  }

  function estimateFlick() {
    const cp = ensureCupState();
    const samples = cp.flickSamples;
    if (samples.length < 2) return { vx: 0, vy: 0, speed: 0 };
    const last = samples[samples.length - 1];
    const window = samples.filter((p) => last.t - p.t <= FLICK_SAMPLE_MS);
    const a = window.length >= 2 ? window[0] : samples[samples.length - 2];
    const b = last;
    const dt = Math.max(0.012, (b.t - a.t) / 1000);
    const vx = (b.x - a.x) / dt;
    const vy = (b.y - a.y) / dt;
    return { vx, vy, speed: Math.hypot(vx, vy) };
  }

  function buildRack(side) {
    refreshCupCourt();
    const cups = [];
    const midX = court.x + court.w / 2;
    const r = cupRadius();
    const spacing = r * 2.18;
    const rowGap = r * 2.05;
    // Player at bottom (tip toward top); bot at top (tip toward bottom)
    const baseY = side === "player" ? court.y + court.h - (cupPhoneLayout() ? 88 : 72) : court.y + (cupPhoneLayout() ? 88 : 72);
    const dir = side === "player" ? -1 : 1;
    let id = 0;
    for (let r = 0; r < CUP_ROWS.length; r++) {
      const count = CUP_ROWS[r];
      const rowY = baseY + dir * r * rowGap;
      const span = (count - 1) * spacing;
      for (let i = 0; i < count; i++) {
        cups.push({
          id: id++,
          x: midX - span / 2 + i * spacing,
          y: rowY,
          alive: true,
          side,
        });
      }
    }
    return cups;
  }

  function isCupPongModeLocal() {
    return s.mode === "local" && s.botMode === "cuppong";
  }

  window.isCupPongLevelUnlocked = function isCupPongLevelUnlocked(level) {
    const lv = Math.max(1, Math.min(CUP_PONG_MAX_LEVEL, Math.floor(level || 1)));
    return lv === 1 || lv <= (save.maxCupPongCleared || 0) + 1;
  };

  window.applyCupPongBotLevel = function applyCupPongBotLevel(level) {
    const lv = Math.max(1, Math.min(CUP_PONG_MAX_LEVEL, Math.floor(level || 1)));
    s.botLevel = lv;
    const t = (lv - 1) / (CUP_PONG_MAX_LEVEL - 1);
    const cp = ensureCupState();
    cp.aimNoise = 48 - t * 38;
    cp.powerErr = 0.28 - t * 0.2;
    cp.thinkDelay = 1.35 - t * 0.85;
    cp.rimOutChance = 0.34 - t * 0.22;
  };

  window.resetCupPongMatch = function resetCupPongMatch() {
    const cp = ensureCupState();
    cp.playerCups = buildRack("player");
    cp.botCups = buildRack("bot");
    cp.turn = "player";
    cp.phase = "aim";
    cp.throw = null;
    cp.botThinkT = 0;
    cp.botPlan = null;
    cp.splash = [];
    resetHandBall();
    s.p1.score = 0;
    s.p2.score = 0;
    if (ui.p1) ui.p1.textContent = "0";
    if (ui.p2) ui.p2.textContent = "0";
    s.running = true;
    s.gameOver = false;
    if (ui.status) ui.status.textContent = "YOUR THROW — hold the ball, flick up toward the cups";
    ensureCupBounceSamples();
    startCupPongMusic();
  };

  function aliveCups(list) {
    return list.filter((c) => c.alive);
  }

  function syncCupScores() {
    const cp = ensureCupState();
    const pScore = (10 - aliveCups(cp.botCups).length) * 2;
    const bScore = (10 - aliveCups(cp.playerCups).length) * 2;
    s.p1.score = pScore;
    s.p2.score = bScore;
    if (ui.p1) ui.p1.textContent = String(pScore);
    if (ui.p2) ui.p2.textContent = String(bScore);
  }

  function checkCupPongWin() {
    const cp = ensureCupState();
    const pLeft = aliveCups(cp.playerCups).length;
    const bLeft = aliveCups(cp.botCups).length;
    if (bLeft <= 0) {
      endGame("p1");
      return true;
    }
    if (pLeft <= 0) {
      endGame("p2");
      return true;
    }
    return false;
  }

  const CUP_BOUNCE_URLS = [
    "sfx/hit1.wav",
    "sfx/hit2.wav",
    "sfx/hit3.wav",
    "sfx/hit4.wav",
    "sfx/hit5.wav",
    "sfx/hit6.wav",
    "sfx/hit7.wav",
    "sfx/hit8.wav",
    "sfx/hit9.wav",
    "sfx/hit10.wav",
    "sfx/hit11.wav",
    "sfx/hit12.wav",
  ];
  let cupBounceSamples = null; // AudioBuffer[]
  let cupBounceLoadPromise = null;

  function b64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function decodeWavBuffer(ctx, arrayBuffer) {
    return new Promise((resolve, reject) => {
      let done = false;
      const ok = (buf) => {
        if (done) return;
        done = true;
        resolve(buf);
      };
      const err = (e) => {
        if (done) return;
        done = true;
        reject(e || new Error("decodeAudioData failed"));
      };
      try {
        const copy = arrayBuffer.slice(0);
        const ret = ctx.decodeAudioData(copy, ok, err);
        if (ret && typeof ret.then === "function") ret.then(ok, err);
      } catch (e) {
        err(e);
      }
    });
  }

  function ensureCupBounceSamples() {
    if (cupBounceSamples && cupBounceSamples.length) return Promise.resolve(cupBounceSamples);
    if (cupBounceLoadPromise) return cupBounceLoadPromise;
    if (typeof ensureAudio === "function") ensureAudio();
    if (!audioCtx) return Promise.resolve([]);

    cupBounceLoadPromise = (async () => {
      const buffers = [];
      // Prefer embedded real recordings (no network / MIME issues)
      const embedded = typeof window.CUP_PONG_BOUNCE_WAVS !== "undefined" ? window.CUP_PONG_BOUNCE_WAVS : null;
      if (embedded && embedded.length) {
        for (const b64 of embedded) {
          try {
            const ab = b64ToArrayBuffer(b64);
            buffers.push(await decodeWavBuffer(audioCtx, ab));
          } catch (_) {
            /* skip bad clip */
          }
        }
      }
      // Fallback: fetch WAV files from /sfx
      if (!buffers.length) {
        for (const url of CUP_BOUNCE_URLS) {
          try {
            const res = await fetch(`${url}?v=20260711q`);
            if (!res.ok) continue;
            const raw = await res.arrayBuffer();
            buffers.push(await decodeWavBuffer(audioCtx, raw));
          } catch (_) {
            /* skip */
          }
        }
      }
      cupBounceSamples = buffers;
      cupBounceLoadPromise = null;
      return cupBounceSamples;
    })();

    return cupBounceLoadPromise;
  }

  function playCupSampleHit(opts = {}) {
    const strength = clamp(opts.strength == null ? 0.8 : opts.strength, 0.12, 1);
    const rateBias = opts.rateBias || 0;
    const gainMul = opts.gainMul == null ? 1 : opts.gainMul;
    if (typeof ensureAudio === "function") ensureAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();

    ensureCupBounceSamples().then((list) => {
      if (!list.length || !audioCtx) return;
      const pick = list[Math.floor(Math.random() * list.length)];
      const src = audioCtx.createBufferSource();
      src.buffer = pick;
      src.playbackRate.value = clamp(0.98 + Math.random() * 0.04 + rateBias * 0.35, 0.94, 1.08);

      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime;
      // Dry real sample — no filters that make it sound synthetic
      const peak = (0.85 + strength * 0.4) * gainMul;
      gain.gain.setValueAtTime(peak, t);
      gain.gain.linearRampToValueAtTime(peak * 0.35, t + 0.05);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.14);

      src.connect(gain);
      gain.connect(audioCtx.destination);
      try {
        src.start(t);
      } catch (_) {
        /* ignore */
      }
    });
  }

  function playCupThrowSound() {
    if (typeof ensureAudio !== "function" || typeof playTone !== "function") return;
    ensureAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    playTone(180 + Math.random() * 40, t, 0.11, "triangle", 0.09);
    playTone(420 + Math.random() * 80, t + 0.02, 0.08, "sine", 0.07);
    playTone(90, t, 0.14, "sine", 0.05);
  }

  function playCupBounceSound(strength01) {
    playCupSampleHit({
      strength: strength01 == null ? 0.85 : strength01,
      gainMul: 1.35,
    });
  }

  function playCupRimSound() {
    playCupSampleHit({
      strength: 0.55,
      rateBias: 0.1,
      gainMul: 0.95,
    });
  }

  function spawnSplash(x, y) {
    const cp = ensureCupState();
    for (let i = 0; i < 10; i++) {
      cp.splash.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120 - 40,
        t: 0,
        life: 0.35 + Math.random() * 0.25,
      });
    }
  }

  function launchThrow(fromSide, targetAcross, power01, forceRim) {
    refreshCupCourt();
    const cp = ensureCupState();
    const power = clamp(power01, 0.22, 1);
    const fromBottom = fromSide === "player";
    const y0 = fromBottom ? court.y + court.h - 28 : court.y + 28;
    const x0 = clampOnCourtX(targetAcross);
    const dist = court.h * (0.55 + power * 0.42);
    const vy = (fromBottom ? -1 : 1) * (280 + power * 420);
    const flight = dist / Math.abs(vy);
    const vz = 220 + power * 340;
    const aimX = x0 + (forceRim ? (Math.random() > 0.5 ? 1 : -1) * (cupRadius() * 0.9) : 0);
    cp.throw = {
      x: x0,
      y: y0,
      z: 18,
      vx: (aimX - x0) / Math.max(0.2, flight) * 0.85,
      vy,
      vz,
      bounces: 0,
      fromSide,
      age: 0,
    };
    cp.phase = "throwing";
    cp.holding = false;
    cp.flickSamples = [];
    playCupThrowSound();
    if (ui.status) ui.status.textContent = fromBottom ? "Ball in flight…" : "Bot toss…";
  }

  function launchFlickThrow(flick) {
    refreshCupCourt();
    const cp = ensureCupState();
    const hb = cp.handBall;
    const speed = flick.speed;
    const power = clamp(speed / FLICK_MAX_SPEED, 0.18, 1);
    // Toward cups is up (−Y); horizontal flick aims left/right
    let vy = Math.min(-140, flick.vy * 0.42);
    vy = -clamp(Math.abs(vy), 160 + power * 80, 220 + power * 520);
    let vx = clamp(flick.vx * 0.38, -420, 420);
    const loft = clamp((-flick.vy) / FLICK_MAX_SPEED, 0, 0.85);
    const vz = 160 + power * 300 + loft * 220;
    cp.throw = {
      x: clampOnCourtX(hb.x),
      y: clamp(hb.y, court.y + 16, court.y + court.h - 16),
      z: Math.max(14, hb.z),
      vx,
      vy,
      vz,
      bounces: 0,
      fromSide: "player",
      age: 0,
    };
    cp.phase = "throwing";
    cp.holding = false;
    cp.flickSamples = [];
    playCupThrowSound();
    if (ui.status) ui.status.textContent = "Ball in flight…";
  }

  function endThrowTurn() {
    const cp = ensureCupState();
    cp.throw = null;
    if (checkCupPongWin()) return;
    if (cp.turn === "player") {
      cp.turn = "bot";
      cp.phase = "botThink";
      cp.botThinkT = cp.thinkDelay * (0.75 + Math.random() * 0.5);
      cp.botPlan = null;
      cp.holding = false;
      if (ui.status) ui.status.textContent = "BOT THROW";
    } else {
      cp.turn = "player";
      cp.phase = "aim";
      resetHandBall();
      if (ui.status) ui.status.textContent = "YOUR THROW — hold the ball, flick up toward the cups";
    }
  }

  function trySinkOrRim(ball) {
    const cp = ensureCupState();
    const targets = ball.fromSide === "player" ? cp.botCups : cp.playerCups;
    let best = null;
    let bestD = 1e9;
    for (const cup of targets) {
      if (!cup.alive) continue;
      const d = Math.hypot(ball.x - cup.x, ball.y - cup.y);
      if (d < bestD) {
        bestD = d;
        best = cup;
      }
    }
    if (!best || bestD > cupRadius() * 1.35) return false;
    if (ball.z > 28) return false;

    const rimRoll = Math.random() < cp.rimOutChance * (0.55 + bestD / (cupRadius() * 2));
    if (rimRoll || bestD > cupRadius() * 0.92) {
      ball.vx *= -0.35;
      ball.vy += (Math.random() - 0.5) * 160;
      ball.vz = Math.abs(ball.vz) * 0.45 + 40;
      ball.bounces += 1;
      playCupRimSound();
      spawnSplash(best.x, best.y);
      return false;
    }

    best.alive = false;
    spawnSplash(best.x, best.y);
    syncCupScores();
    if (typeof playPointWinSound === "function") playPointWinSound();
    else if (typeof playTone === "function") {
      ensureAudio();
      playTone(520, audioCtx.currentTime, 0.12, "sine", 0.08);
    }
    cp.throw = null;
    if (checkCupPongWin()) return true;
    endThrowTurn();
    return true;
  }

  function updateThrow(dt) {
    refreshCupCourt();
    const cp = ensureCupState();
    const ball = cp.throw;
    if (!ball) return;
    ball.age += dt;
    ball.vz -= GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;

    if (ball.z <= 0) {
      ball.z = 0;
      const impact = Math.min(1, Math.abs(ball.vz) / 420);
      ball.vz = -ball.vz * BOUNCE_REST;
      ball.vx *= 0.88;
      ball.vy *= 0.88;
      ball.bounces += 1;
      // Always play a hit sound while the ball still has energy
      if (impact > 0.05 || Math.abs(ball.vz) >= 20) playCupBounceSound(Math.max(0.2, impact));
      if (Math.abs(ball.vz) < 40) ball.vz = 0;
      spawnSplash(ball.x, ball.y);
      if (trySinkOrRim(ball)) return;
    } else if (ball.z < 22 && ball.vz < 0) {
      if (trySinkOrRim(ball)) return;
    }

    const out =
      ball.x < court.x - 36 ||
      ball.x > court.x + court.w + 36 ||
      ball.y < court.y - 36 ||
      ball.y > court.y + court.h + 36 ||
      (ball.bounces >= 4 && ball.z <= 0.5 && Math.hypot(ball.vx, ball.vy) < 40) ||
      ball.age > 4.5;
    if (out) endThrowTurn();
  }

  function planBotThrow() {
    const cp = ensureCupState();
    const targets = aliveCups(cp.playerCups);
    if (!targets.length) return;
    const cup = targets[Math.floor(Math.random() * targets.length)];
    const noise = (Math.random() - 0.5) * 2 * cp.aimNoise;
    const power = clamp(0.55 + (Math.random() - 0.5) * cp.powerErr * 2, 0.28, 0.98);
    const forceRim = Math.random() < cp.rimOutChance * 0.65;
    cp.botPlan = { x: cup.x + noise, power, forceRim };
  }

  window.updateCupPong = function updateCupPong(dt) {
    if (!isCupPongModeLocal() || s.gameOver) return true;
    refreshCupCourt();
    const cp = ensureCupState();
    cp.aimY = s.mouseY;

    for (const p of cp.splash) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
    }
    cp.splash = cp.splash.filter((p) => p.t < p.life);

    if (cp.phase === "aim" && cp.turn === "player" && cp.holding) {
      const mx = typeof s.mouseX === "number" ? s.mouseX : cp.handBall.x;
      const my = typeof s.mouseY === "number" ? s.mouseY : cp.handBall.y;
      const pos = clampHandBall(mx, my);
      cp.handBall.x = pos.x;
      cp.handBall.y = pos.y;
      cp.handBall.z = 22;
      pushFlickSample(cp.handBall.x, cp.handBall.y);
    }

    if (cp.phase === "throwing" && cp.throw) {
      updateThrow(dt);
      return true;
    }

    if (cp.phase === "botThink" && cp.turn === "bot") {
      if (!cp.botPlan) planBotThrow();
      cp.botThinkT -= dt;
      if (cp.botThinkT <= 0 && cp.botPlan) {
        launchThrow("bot", cp.botPlan.x, cp.botPlan.power, cp.botPlan.forceRim);
        cp.botPlan = null;
      }
      return true;
    }

    return true;
  };

  window.cupPongPointerDown = function cupPongPointerDown(px, py) {
    if (!isCupPongModeLocal() || s.gameOver) return false;
    refreshCupCourt();
    const cp = ensureCupState();
    if (cp.turn !== "player" || cp.phase !== "aim" || cp.holding) return true;
    const x = typeof px === "number" ? px : s.mouseX;
    const y = typeof py === "number" ? py : s.mouseY;
    const hb = cp.handBall;
    const base = cupPickupRadius();
    const reach = typeof isTouchDevice !== "undefined" && isTouchDevice ? base + 22 : base;
    if (Math.hypot(x - hb.x, y - hb.y) > reach) {
      if (ui.status) ui.status.textContent = "Hold the ball at the bottom, then flick up";
      return true;
    }
    cp.holding = true;
    cp.flickSamples = [];
    const pos = clampHandBall(x, y);
    cp.handBall.x = pos.x;
    cp.handBall.y = pos.y;
    cp.handBall.z = 22;
    pushFlickSample(cp.handBall.x, cp.handBall.y);
    if (ui.status) ui.status.textContent = "Flick up toward the cups — faster = farther";
    return true;
  };

  window.cupPongPointerMove = function cupPongPointerMove(px, py) {
    if (!isCupPongModeLocal() || s.gameOver) return false;
    refreshCupCourt();
    const cp = ensureCupState();
    if (!cp.holding || cp.turn !== "player" || cp.phase !== "aim") return false;
    if (typeof px === "number") s.mouseX = px;
    if (typeof py === "number") s.mouseY = py;
    const pos = clampHandBall(px, py);
    cp.handBall.x = pos.x;
    cp.handBall.y = pos.y;
    pushFlickSample(cp.handBall.x, cp.handBall.y);
    return true;
  };

  window.cupPongPointerUp = function cupPongPointerUp() {
    if (!isCupPongModeLocal() || s.gameOver) return false;
    const cp = ensureCupState();
    if (cp.turn !== "player" || cp.phase !== "aim" || !cp.holding) return true;
    const flick = estimateFlick();
    cp.holding = false;
    if (flick.speed < FLICK_MIN_SPEED || flick.vy > -40) {
      resetHandBall();
      if (ui.status) {
        ui.status.textContent =
          flick.speed < FLICK_MIN_SPEED
            ? "Too soft — hold the ball and flick harder"
            : "Flick up toward the cups (slide upward)";
      }
      return true;
    }
    launchFlickThrow(flick);
    return true;
  };

  function drawHandBall(ball, opts = {}) {
    const ghost = !!opts.ghost;
    const highlight = !!opts.highlight;
    const phone = cupPhoneLayout();
    const ballR = phone ? 10 : 7;
    const scale = 1 + ball.z / 120;
    const shadow = Math.max(0.15, 0.55 - ball.z / 160);
    ctx.fillStyle = `rgba(0,0,0,${shadow * (ghost ? 0.45 : 1)})`;
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 4, ballR * scale, ballR * 0.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    const ink = typeof courtInkColor === "function" ? courtInkColor() : "#fff";
    ctx.fillStyle = ghost ? "rgba(253, 230, 138, 0.55)" : ink;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y - ball.z * 0.15, ballR * scale, 0, Math.PI * 2);
    ctx.fill();
    if (highlight) {
      ctx.strokeStyle = "rgba(125, 211, 252, 0.55)";
      ctx.lineWidth = phone ? 2 : 1.5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y - ball.z * 0.15, (ballR + 4) * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawCup(cup) {
    if (!cup.alive) return;
    const t = typeof cosmeticTime === "function" ? cosmeticTime() : performance.now() * 0.001;
    const bob = Math.sin(t * 2.2 + cup.id) * 0.6;
    const r = cupRadius();
    const g = ctx.createLinearGradient(cup.x - r, cup.y, cup.x + r, cup.y);
    g.addColorStop(0, "#f97316");
    g.addColorStop(0.45, "#fdba74");
    g.addColorStop(1, "#ea580c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y + bob, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(254, 243, 199, 0.55)";
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y - 2 + bob, r * 0.62, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y + bob, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawFancyCupTable() {
    refreshCupCourt();
    const t = typeof cosmeticTime === "function" ? cosmeticTime() : performance.now() * 0.001;
    const light = typeof isLightTheme === "function" && isLightTheme();

    ctx.fillStyle = light ? "#d4d4d8" : "#07090d";
    ctx.fillRect(0, 0, W, H);

    // Soft drop shadow only — no outer wood / border frame
    ctx.fillStyle = light ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.45)";
    ctx.fillRect(court.x + 5, court.y + 8, court.w, court.h);

    // Classic beer-pong felt — deep teal-blue that pairs with orange cups
    const felt = ctx.createLinearGradient(court.x, court.y, court.x + court.w * 0.2, court.y + court.h);
    felt.addColorStop(0, "#14324a");
    felt.addColorStop(0.4, "#1a4563");
    felt.addColorStop(0.7, "#18506f");
    felt.addColorStop(1, "#122c42");
    ctx.fillStyle = felt;
    ctx.fillRect(court.x, court.y, court.w, court.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(court.x, court.y, court.w, court.h);
    ctx.clip();
    for (let i = 0; i < 30; i++) {
      const gy = court.y + ((i * 41 + ((t * 6) % 41)) % court.h);
      ctx.strokeStyle = `rgba(255,255,255,${0.016 + (i % 3) * 0.007})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(court.x, gy);
      ctx.lineTo(court.x + court.w, gy + 1.2);
      ctx.stroke();
    }
    const sheen = ctx.createRadialGradient(
      court.x + court.w * 0.5,
      court.y + court.h * 0.48,
      24,
      court.x + court.w * 0.5,
      court.y + court.h * 0.48,
      court.h * 0.55
    );
    sheen.addColorStop(0, "rgba(120, 190, 220, 0.11)");
    sheen.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(court.x, court.y, court.w, court.h);

    ctx.strokeStyle = "rgba(226, 232, 240, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 9]);
    ctx.beginPath();
    ctx.moveTo(court.x + 16, court.y + court.h / 2);
    ctx.lineTo(court.x + court.w - 16, court.y + court.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  window.drawCupPong = function drawCupPong() {
    if (!isCupPongModeLocal()) return false;
    refreshCupCourt();
    const cp = ensureCupState();
    ctx.clearRect(0, 0, W, H);
    drawFancyCupTable();

    for (const cup of cp.botCups) drawCup(cup);
    for (const cup of cp.playerCups) drawCup(cup);

    if (cp.phase === "aim" && cp.turn === "player") {
      drawHandBall(cp.handBall, { highlight: true });
      if (cp.holding) {
        const flick = estimateFlick();
        const power = clamp(flick.speed / FLICK_MAX_SPEED, 0, 1);
        if (power > 0.08) {
          const len = 40 + power * 110;
          const ang = Math.atan2(Math.min(-40, flick.vy || -40), flick.vx || 0);
          const x1 = cp.handBall.x;
          const y1 = cp.handBall.y - cp.handBall.z * 0.15;
          const x2 = x1 + Math.cos(ang) * len;
          const y2 = y1 + Math.sin(ang) * len;
          ctx.strokeStyle = `rgba(125, 211, 252, ${0.4 + power * 0.5})`;
          ctx.lineWidth = 2 + power * 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
        ctx.font = `bold ${isTouchDevice ? 11 : 12}px system-ui, Segoe UI, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("HOLD + FLICK ↑", cp.handBall.x, cp.handBall.y - 18);
      }
    }

    if (cp.throw) {
      const b = cp.throw;
      drawHandBall(b);
      if (b.bounces > 0) {
        ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 10 + (b.age % 0.3) * 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const p of cp.splash) {
      const a = 1 - p.t / p.life;
      ctx.fillStyle = `rgba(186, 230, 253, ${a * 0.75})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Names on each end of the table (bot top, you bottom)
    const p1Name = ui.p1Label?.textContent || "You";
    const p2Name = ui.p2Label?.textContent || "Bot";
    const cx = court.x + court.w / 2;
    ctx.font = `bold ${isTouchDevice ? 12 : 14}px system-ui, Segoe UI, Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 4;
    ctx.textBaseline = "top";
    ctx.fillText(p2Name, cx, court.y + 10);
    ctx.textBaseline = "bottom";
    ctx.fillText(p1Name, cx, court.y + court.h - 10);
    ctx.shadowBlur = 0;
    return true;
  };

  window.grantBeerPongCosmeticIfEligible = function grantBeerPongCosmeticIfEligible() {
    if ((save.maxCupPongCleared || 0) < CUP_PONG_MAX_LEVEL) return false;
    let changed = false;
    for (const kind of ["paddle", "table"]) {
      if (!save.owned[kind].includes("beerpong")) {
        save.owned[kind].push("beerpong");
        changed = true;
      }
    }
    return changed;
  };

  window.awardCupPongClear = function awardCupPongClear(level) {
    if (s.mode !== "local" || s.botMode !== "cuppong") return 0;
    const lv = Math.max(1, Math.min(CUP_PONG_MAX_LEVEL, Math.floor(level || 1)));
    if (lv <= (save.maxCupPongCleared || 0)) {
      grantBeerPongCosmeticIfEligible();
      return 0;
    }
    save.maxCupPongCleared = lv;
    grantBeerPongCosmeticIfEligible();
    sanitizeEquippedCosmetics();
    return 1;
  };

  function restartCupTrack() {
    if (typeof stopMusicTimerOnly === "function") stopMusicTimerOnly();
    musicPlaying = false;
    musicStep = 0;
    musicBlendFrom = 0;
    musicBlendTo = 1;
    musicBlendStart = performance.now();
    if (typeof startGameMusic === "function") startGameMusic();
  }

  function startCupPongMusic() {
    if (!settings.musicOn) return;
    if (!MUSIC_TRACKS.cuplounge) return;
    if (!cupMusicActive) {
      musicRestoreTrack = settings.musicTrack === "cuplounge" ? "arcade" : settings.musicTrack;
      cupMusicActive = true;
    }
    if (settings.musicTrack !== "cuplounge") {
      settings.musicTrack = "cuplounge";
      restartCupTrack();
    } else if (!musicPlaying) {
      restartCupTrack();
    }
  }

  window.stopCupPongMusic = function stopCupPongMusic() {
    if (!cupMusicActive) return;
    cupMusicActive = false;
    const restore = musicRestoreTrack && MUSIC_TRACKS[musicRestoreTrack] && musicRestoreTrack !== "cuplounge"
      ? musicRestoreTrack
      : "arcade";
    musicRestoreTrack = "";
    settings.musicTrack = restore;
    if (typeof persistSettings === "function") persistSettings();
    if (settings.musicOn) restartCupTrack();
  };

  window.openCupPongLevelSelect = function openCupPongLevelSelect() {
    hideOverlay(ui.menuOverlay);
    if (typeof hideBotCategoryOverlays === "function") hideBotCategoryOverlays();
    else hideOverlay(ui.botModesOverlay);
    hideOverlay(ui.modeSoonOverlay);
    hideOverlay(ui.botLevelOverlay);
    hideOverlay(ui.chaosLevelOverlay);
    hideOverlay(ui.survivalLevelOverlay);
    hideOverlay(ui.bossLevelOverlay);
    hideOverlay(ui.bossHubOverlay);
    hideOverlay(ui.lobbyOverlay);
    hideOverlay(ui.customizeOverlay);
    hideOverlay(ui.settingsOverlay);
    hideOverlay(ui.adminOverlay);
    hideOverlay(ui.passkeyOverlay);
    hideOverlay(ui.gameOver);
    showOverlay(ui.cupPongLevelOverlay);
    setStagePlaying(false);
    startMenuBg();
    renderCupPongLevelGrid();
    ui.hint.textContent = "Select a Cup Pong bot level.";
    updateNameUI();
  };

  window.closeCupPongLevelSelect = function closeCupPongLevelSelect() {
    hideOverlay(ui.cupPongLevelOverlay);
    showOverlay(ui.arcadeHubOverlay || ui.botModesOverlay);
    startMenuBg();
    updateNameUI();
  };

  function cupLevelLabel(i) {
    if (i <= 5) return "Soft toss";
    if (i <= 15) return "Party pace";
    if (i <= 30) return "Sharp aim";
    if (i <= 45) return "Cup clutch";
    return "House legend";
  }

  window.renderCupPongLevelGrid = function renderCupPongLevelGrid() {
    if (!ui.cupPongLevelGrid) return;
    ui.cupPongLevelGrid.innerHTML = "";
    const nextUnlock = Math.min(CUP_PONG_MAX_LEVEL, (save.maxCupPongCleared || 0) + 1);
    for (let i = 1; i <= CUP_PONG_MAX_LEVEL; i++) {
      const unlocked = isCupPongLevelUnlocked(i);
      const cleared = i <= (save.maxCupPongCleared || 0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `bot-level-btn ${botTierClass(Math.min(100, Math.round(4 + ((i - 1) / 49) * 90)))}`;
      if (!unlocked) btn.classList.add("locked");
      if (cleared) btn.classList.add("cleared");
      if (i === nextUnlock && unlocked) btn.classList.add("next");
      btn.textContent = unlocked ? String(i) : "🔒";
      btn.disabled = !unlocked;
      btn.title = unlocked
        ? `Cup ${i} — ${cupLevelLabel(i)} · +${POINTS_PER_CUP_PONG_WIN} pts / ${XP_PER_CUP_PONG_WIN} XP`
        : `Locked — clear Cup ${i - 1} first`;
      btn.addEventListener("click", () => {
        if (!unlocked) {
          if (ui.cupPongLevelHint) ui.cupPongLevelHint.textContent = `Locked. Clear Cup ${i - 1} to unlock.`;
          return;
        }
        playMenuClick();
        startCupPongMode(i);
      });
      btn.addEventListener("mouseenter", () => {
        if (!ui.cupPongLevelHint) return;
        if (!unlocked) ui.cupPongLevelHint.textContent = `Locked — beat Cup ${i - 1} first.`;
        else if (cleared) ui.cupPongLevelHint.textContent = `Cup ${i} cleared — ${cupLevelLabel(i)} · Rematch`;
        else ui.cupPongLevelHint.textContent = `Cup ${i} — ${cupLevelLabel(i)} · Win for +${POINTS_PER_CUP_PONG_WIN} pts · ${XP_PER_CUP_PONG_WIN} XP`;
      });
      ui.cupPongLevelGrid.appendChild(btn);
    }
    if (ui.cupPongLevelHint) {
      const cleared = save.maxCupPongCleared || 0;
      ui.cupPongLevelHint.textContent =
        cleared >= CUP_PONG_MAX_LEVEL
          ? "All Cup Pong levels cleared — Beer Pong cosmetics unlocked!"
          : `Progress: L${cleared}/${CUP_PONG_MAX_LEVEL} · Next: L${nextUnlock} · L50 unlocks Beer Pong`;
    }
  };

  window.startCupPongMode = function startCupPongMode(level = 1) {
    if (!isCupPongLevelUnlocked(level)) {
      openCupPongLevelSelect();
      if (ui.cupPongLevelHint) ui.cupPongLevelHint.textContent = `Cup ${level} is locked.`;
      return;
    }
    stopMenuBg();
    s.botMode = "cuppong";
    s.survival.active = false;
    applyCupPongBotLevel(level);
    s.mode = "local";
    hideOverlay(ui.menuOverlay);
    hideOverlay(ui.botLevelOverlay);
    hideOverlay(ui.chaosLevelOverlay);
    hideOverlay(ui.survivalLevelOverlay);
    hideOverlay(ui.bossLevelOverlay);
    hideOverlay(ui.bossHubOverlay);
    hideOverlay(ui.cupPongLevelOverlay);
    hideOverlay(ui.botModesOverlay);
    hideOverlay(ui.lobbyOverlay);
    hideOverlay(ui.customizeOverlay);
    hideOverlay(ui.settingsOverlay);
    hideOverlay(ui.adminOverlay);
    hideOverlay(ui.gameOver);
    hideOverlay(ui.profileViewOverlay);
    setScoreboardLabels(
      formatNameWithLevel(getPlayerName() || "You", getPlayerLevel()),
      `CUP BOT L${s.botLevel}`,
      { p1Level: getPlayerLevel(), p2Level: null }
    );
    ui.hint.textContent = `Cup Pong L${s.botLevel} — hold ball at bottom, flick up · +${POINTS_PER_CUP_PONG_WIN} pts / ${XP_PER_CUP_PONG_WIN} XP on win.`;
    resetLocalMatch();
  };

  window.CUP_PONG_MAX_LEVEL = CUP_PONG_MAX_LEVEL;
  window.POINTS_PER_CUP_PONG_WIN = POINTS_PER_CUP_PONG_WIN;
  window.XP_PER_CUP_PONG_WIN = XP_PER_CUP_PONG_WIN;

  function bindCupPongUi() {
    if (ui) {
      ui.cupPongLevelOverlay = document.getElementById("cupPongLevelOverlay");
      ui.cupPongLevelGrid = document.getElementById("cupPongLevelGrid");
      ui.cupPongLevelHint = document.getElementById("cupPongLevelHint");
      ui.btnModeCupPong = document.getElementById("btnModeCupPong");
      ui.btnCupPongLevelBack = document.getElementById("btnCupPongLevelBack");
    }
    // Mode / back buttons are bound from game.js bindUi(); presets bind here.
    document.querySelectorAll(".cuppong-preset").forEach((btn) => {
      if (btn.dataset.cupBound) return;
      btn.dataset.cupBound = "1";
      btn.addEventListener("click", () => {
        const level = Number(btn.dataset.level || 1);
        if (!isCupPongLevelUnlocked(level)) {
          openCupPongLevelSelect();
          if (ui.cupPongLevelHint) ui.cupPongLevelHint.textContent = `Cup ${level} is locked.`;
          return;
        }
        if (typeof playMenuClick === "function") playMenuClick();
        startCupPongMode(level);
      });
    });

    window.addEventListener("pointerup", () => {
      if (isCupPongModeLocal()) cupPongPointerUp();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(bindCupPongUi, 0));
  } else {
    setTimeout(bindCupPongUi, 0);
  }
})();
