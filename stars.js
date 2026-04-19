(() => {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');

  let W = 0;
  let H = 0;
  const stars = [];
  const shooters = [];

  let lastTs = 0;
  let sinceLastSpawn = 0;
  let nextSpawnAt = 2500 + Math.random() * 2000;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeStar() {
    const rng = Math.random();
    let radius;
    if (rng < 0.60) radius = rand(0.15, 0.65);
    else if (rng < 0.88) radius = rand(0.65, 1.3);
    else if (rng < 0.97) radius = rand(1.3, 2.1);
    else radius = rand(2.1, 3.2);

    const ct = Math.random();
    let color;
    if (ct < 0.55) color = [205, 218, 240];
    else if (ct < 0.80) color = [235, 238, 255];
    else if (ct < 0.93) color = [255, 248, 225];
    else color = [160, 195, 255];

    const baseOp = rand(0.25, 0.85);

    return {
      x: rand(0, W),
      y: rand(0, H),
      radius,
      color,
      baseOp,
      op: baseOp,
      phase: rand(0, Math.PI * 2),
      period: rand(4000, 12000),
      amp: rand(0.08, 0.32) * (radius > 1.5 ? 1.4 : 1),
    };
  }

  function initStars() {
    stars.length = 0;
    const count = Math.min(420, Math.floor((W * H) / 3500) + 60);
    for (let i = 0; i < count; i++) {
      const s = makeStar();
      s.phase = rand(0, Math.PI * 2);
      stars.push(s);
    }
  }

  function updateStar(s, dt) {
    s.phase += (Math.PI * 2 * dt) / s.period;
    s.op = s.baseOp + Math.sin(s.phase) * s.amp * s.baseOp;
    s.op = Math.max(0.04, Math.min(1, s.op));
  }

  function drawStar(s) {
    const [r, g, b] = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${s.op.toFixed(3)})`;
    ctx.fill();

    if (s.radius > 1.5) {
      const glowR = s.radius * 4.5;
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
      grd.addColorStop(0, `rgba(${r},${g},${b},${(s.op * 0.25).toFixed(3)})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  function makeShooter() {
    const angle = Math.PI / 4 + rand(-0.3, 0.3);
    const speed = rand(0.38, 0.72);
    const startX = rand(W * 0.25, W * 1.05);
    const startY = rand(-20, H * 0.42);
    const tailMax = Math.floor(rand(18, 32));
    const totalLife = rand(900, 1800);

    return {
      x: startX,
      y: startY,
      dx: -Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      tail: [],
      tailMax,
      width: rand(0.6, 1.8),
      life: totalLife,
      maxLife: totalLife,
      active: true,
    };
  }

  function spawnShooter() {
    shooters.push(makeShooter());
    if (Math.random() < 0.2) {
      setTimeout(() => shooters.push(makeShooter()), rand(200, 600));
    }
  }

  function updateShooter(s, dt) {
    s.tail.push({ x: s.x, y: s.y });
    if (s.tail.length > s.tailMax) s.tail.shift();
    s.x += s.dx * dt;
    s.y += s.dy * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x < -200 || s.y > H + 100) {
      s.active = false;
    }
  }

  function drawShooter(s) {
    if (s.tail.length < 2) return;

    const lifeRatio = s.life / s.maxLife;
    const birthEase = Math.min(1, (1 - lifeRatio) * 5);
    const masterAlpha = birthEase * lifeRatio;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < s.tail.length; i++) {
      const t = i / s.tail.length;
      const segAlpha = t * masterAlpha;
      const segWidth = t * s.width;
      ctx.beginPath();
      ctx.moveTo(s.tail[i - 1].x, s.tail[i - 1].y);
      ctx.lineTo(s.tail[i].x, s.tail[i].y);
      ctx.strokeStyle = `rgba(210,230,255,${segAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(0.1, segWidth);
      ctx.stroke();
    }

    if (masterAlpha > 0.05) {
      const headR = s.width * 3.5;
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, headR);
      grd.addColorStop(0, `rgba(255,255,255,${masterAlpha.toFixed(3)})`);
      grd.addColorStop(0.4, `rgba(200,220,255,${(masterAlpha * 0.5).toFixed(3)})`);
      grd.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, headR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  function tick(ts) {
    const dt = Math.min(ts - lastTs, 60);
    lastTs = ts;
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      updateStar(s, dt);
      drawStar(s);
    }

    sinceLastSpawn += dt;
    if (sinceLastSpawn >= nextSpawnAt) {
      spawnShooter();
      sinceLastSpawn = 0;
      nextSpawnAt = rand(2000, 7000);
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      updateShooter(s, dt);
      drawShooter(s);
      if (!s.active) shooters.splice(i, 1);
    }

    requestAnimationFrame(tick);
  }

  resize();
  initStars();

  window.addEventListener('resize', () => {
    resize();
    initStars();
  });

  requestAnimationFrame((ts) => {
    lastTs = ts;
    requestAnimationFrame(tick);
  });
})();
