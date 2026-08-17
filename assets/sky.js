/* ══════════════════════════════════════════════
   sky.js — PC表示時、本文の両脇に広がる空
   晴れ・くもり・雨・雨上がり・夕暮れ・夜を
   ゆっくり巡る。どんな天気の日もある、という
   メタファーとして。
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('sky');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');

  // 両脇が見えない幅では描かない（スマホの電池を使わないため）
  var MIN_WIDTH = 900;
  var FRAME = 520;          // 本文カラムの幅
  var HOLD  = 15000;        // ひとつの天気にとどまる時間
  var FADE  = 7000;         // 次の天気へ移り変わる時間
  var CYCLE = HOLD + FADE;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 天気。色はサイトのパレット（sky / cream / orange）に寄せている
  var STATES = [
    { top: '#6FA8DC', bot: '#CDE4F5', light: 1.00, lightY: 0.20, cloud: 0.18, rain: 0.00, star: 0.00 }, // 晴れ
    { top: '#9BAAB8', bot: '#D2DAE0', light: 0.22, lightY: 0.18, cloud: 0.80, rain: 0.00, star: 0.00 }, // くもり
    { top: '#66757F', bot: '#9CA9B3', light: 0.00, lightY: 0.18, cloud: 0.95, rain: 1.00, star: 0.00 }, // 雨
    { top: '#8FBEDF', bot: '#F0DFC8', light: 0.55, lightY: 0.30, cloud: 0.45, rain: 0.14, star: 0.00 }, // 雨上がり
    { top: '#E8A065', bot: '#FBE3CE', light: 0.85, lightY: 0.62, cloud: 0.30, rain: 0.00, star: 0.00 }, // 夕暮れ
    { top: '#33455F', bot: '#6C82A0', light: 0.42, lightY: 0.22, cloud: 0.22, rain: 0.00, star: 1.00 }  // 夜
  ];

  var W = 0, H = 0, dpr = 1;
  var drops = [], clouds = [], stars = [];
  var cloudSprite = null;
  var running = false, rafId = 0, startedAt = 0;

  // ── 小物 ───────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16),
            parseInt(h.slice(3, 5), 16),
            parseInt(h.slice(5, 7), 16)];
  }
  function mixHex(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return 'rgb(' + Math.round(lerp(x[0], y[0], t)) + ',' +
                    Math.round(lerp(x[1], y[1], t)) + ',' +
                    Math.round(lerp(x[2], y[2], t)) + ')';
  }

  // ぼんやりした雲のスプライトを一度だけ作る（毎フレームの勾配生成を避ける）
  function buildCloudSprite() {
    var s = 256;
    var c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rg.addColorStop(0.00, 'rgba(255,255,255,0.95)');
    rg.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    rg.addColorStop(1.00, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, s, s);
    return c;
  }

  // ── 粒の生成 ───────────────────────────────
  function seed() {
    var area = W * H;

    var dropCount = Math.min(150, Math.round(area / 9000));
    drops = [];
    for (var i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 10 + Math.random() * 18,
        v: 480 + Math.random() * 420,
        a: 0.15 + Math.random() * 0.35
      });
    }

    clouds = [];
    for (var j = 0; j < 8; j++) {
      clouds.push({
        x: Math.random() * W,
        y: H * (0.04 + Math.random() * 0.5),
        scale: 0.5 + Math.random() * 1.1,
        v: 5 + Math.random() * 12,
        a: 0.4 + Math.random() * 0.6
      });
    }

    var starCount = Math.min(90, Math.round(area / 16000));
    stars = [];
    for (var k = 0; k < starCount; k++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        r: 0.5 + Math.random() * 1.3,
        ph: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.6
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  // ── 描画 ───────────────────────────────────
  function draw(elapsed, dt) {
    var total = CYCLE * STATES.length;
    var t = elapsed % total;
    var i = Math.floor(t / CYCLE);
    var local = t - i * CYCLE;
    var p = local < HOLD ? 0 : smoothstep((local - HOLD) / FADE);

    var a = STATES[i];
    var b = STATES[(i + 1) % STATES.length];

    var topC   = mixHex(a.top, b.top, p);
    var botC   = mixHex(a.bot, b.bot, p);
    var light  = lerp(a.light,  b.light,  p);
    var lightY = lerp(a.lightY, b.lightY, p);
    var cloudA = lerp(a.cloud,  b.cloud,  p);
    var rainA  = lerp(a.rain,   b.rain,   p);
    var starA  = lerp(a.star,   b.star,   p);

    // 空
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, topC);
    g.addColorStop(1, botC);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 星（本文カラムの裏に隠れない位置だけ瞬く）
    if (starA > 0.01) {
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        var tw = 0.45 + 0.55 * Math.sin(elapsed / 1000 * st.sp + st.ph);
        ctx.globalAlpha = starA * tw * 0.9;
        ctx.fillStyle = '#FFFCF5';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 光源（昼は陽、夜は月）— 左の余白の中央に置く
    if (light > 0.01) {
      var gapX = Math.max(0, (W - FRAME) / 4);
      var lx = gapX, ly = H * lightY;
      var rad = Math.min(W, H) * 0.28;
      var warm = starA > 0.5 ? [255, 252, 245] : [255, 244, 214];
      var glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, rad);
      glow.addColorStop(0.00, 'rgba(' + warm.join(',') + ',' + (0.85 * light).toFixed(3) + ')');
      glow.addColorStop(0.25, 'rgba(' + warm.join(',') + ',' + (0.30 * light).toFixed(3) + ')');
      glow.addColorStop(1.00, 'rgba(' + warm.join(',') + ',0)');
      ctx.fillStyle = glow;
      ctx.fillRect(lx - rad, ly - rad, rad * 2, rad * 2);
    }

    // 雲
    if (cloudA > 0.01 && cloudSprite) {
      for (var c = 0; c < clouds.length; c++) {
        var cl = clouds[c];
        cl.x += cl.v * dt;
        var size = 240 * cl.scale;
        if (cl.x - size > W) cl.x = -size;
        ctx.globalAlpha = cloudA * cl.a;
        ctx.drawImage(cloudSprite, cl.x - size / 2, cl.y - size / 2, size, size * 0.62);
      }
      ctx.globalAlpha = 1;
    }

    // 雨
    if (rainA > 0.01) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var d = 0; d < drops.length; d++) {
        var dr = drops[d];
        dr.y += dr.v * dt;
        dr.x += dr.v * dt * 0.18;   // 少し斜めに
        if (dr.y > H) { dr.y = -dr.len; dr.x = Math.random() * W; }
        if (dr.x > W) { dr.x = -4; }
        ctx.globalAlpha = rainA * dr.a;
        ctx.moveTo(dr.x, dr.y);
        ctx.lineTo(dr.x - dr.len * 0.18, dr.y - dr.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── ループ ─────────────────────────────────
  var last = 0;
  function frame(now) {
    if (!running) return;
    if (!startedAt) { startedAt = now; last = now; }
    var dt = Math.min((now - last) / 1000, 0.05);   // タブ復帰時の飛びを抑える
    last = now;
    draw(now - startedAt, dt);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0; startedAt = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // ── 制御 ───────────────────────────────────
  // 表示/非表示は CSS のメディアクエリが決める。
  // JS は「描くかどうか」だけを同じ条件で合わせる。
  var mq = window.matchMedia('(min-width: ' + MIN_WIDTH + 'px)');
  function wide() { return mq.matches; }

  function apply() {
    if (!wide()) {
      // 描かない幅では消しておく。#sky の背景色（stone）がそのまま余白になる
      stop();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    resize();
    // まず一枚を同期で描く。rAF は裏タブでは動かないので、
    // これが無いと非表示のまま読み込まれたとき空が白いままになる。
    draw(0, 0);
    if (reduced) { stop(); return; }   // 動きを減らす設定なら、この一枚で止める
    start();
  }

  cloudSprite = buildCloudSprite();
  apply();

  var rt = 0;
  function scheduleApply() {
    clearTimeout(rt);
    rt = setTimeout(apply, 180);
  }

  // ブレークポイントの出入り（最も確実）
  if (mq.addEventListener) mq.addEventListener('change', scheduleApply);
  else if (mq.addListener) mq.addListener(scheduleApply);

  // 同じ幅帯の中でのサイズ変更（キャンバスの寸法を合わせ直すため）
  window.addEventListener('resize', scheduleApply);
  if (window.ResizeObserver) {
    var lastW = 0;
    new ResizeObserver(function () {
      var w = document.documentElement.clientWidth;
      if (w !== lastW) { lastW = w; scheduleApply(); }
    }).observe(document.documentElement);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (wide() && !reduced) { last = 0; start(); }
  });
})();
