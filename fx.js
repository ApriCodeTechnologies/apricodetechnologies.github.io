/* Shared "delight" for every Apricode game: sounds, vibration and confetti. */
window.AP = (function () {
  var ac = null, muted = false;
  try { muted = localStorage.getItem('ap_mute') === '1'; } catch (e) {}

  function ctx() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) {}
    return ac;
  }
  function tone(f, t, type, v, d, f2) {
    if (muted) return;
    var c = ctx(); if (!c) return;
    var s = c.currentTime + (d || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, s);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + t);
    g.gain.setValueAtTime(v || 0.1, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + t);
    o.connect(g); g.connect(c.destination);
    o.start(s); o.stop(s + t + 0.02);
  }
  var sfx = {
    tap: function () { tone(520, 0.06, 'triangle', 0.08, 0, 700); },
    move: function () { tone(300, 0.07, 'triangle', 0.1, 0, 420); },
    pop: function () { tone(300, 0.08, 'sine', 0.12, 0, 620); },
    good: function () { tone(660, 0.1, 'square', 0.06); tone(990, 0.16, 'square', 0.06, 0.09); },
    bad: function () { tone(220, 0.22, 'sawtooth', 0.08, 0, 110); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 'square', 0.07, i * 0.11); }); },
    lose: function () { tone(330, 0.2, 'triangle', 0.1, 0, 220); tone(220, 0.35, 'triangle', 0.1, 0.2, 150); }
  };
  function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  function confetti(n) {
    n = n || 90;
    var c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    var x = c.getContext('2d'), cols = ['#ff5d8f', '#ffc21a', '#27c0ff', '#7c5cff', '#4cd97b', '#ff8a5c'], P = [];
    for (var i = 0; i < n; i++) P.push({ x: c.width / 2, y: c.height * 0.42, vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 4, r: Math.random() * 6, s: 6 + Math.random() * 8, c: cols[i % cols.length] });
    var t0 = performance.now();
    (function f(t) {
      var e = (t - t0) / 1000;
      x.clearRect(0, 0, c.width, c.height);
      P.forEach(function (p) {
        p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += 0.2;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
        x.globalAlpha = Math.max(0, 1 - e / 1.8);
        x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6); x.restore();
      });
      if (e < 1.8) requestAnimationFrame(f); else c.remove();
    })(t0);
  }
  function setMuted(m) { muted = m; try { localStorage.setItem('ap_mute', m ? '1' : '0'); } catch (e) {} }
  // Little "tap" sound on every button and link.
  function autoTap() {
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('button,a')) sfx.tap();
    }, true);
  }
  return { sfx: sfx, vib: vib, confetti: confetti, tone: tone, muted: function () { return muted; }, setMuted: setMuted, autoTap: autoTap };
})();
