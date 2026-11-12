/* Shared by every Apricode page: auto-updates, "new version" banner, install button. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var had = !!navigator.serviceWorker.controller;

  // A new service worker just took over: offer a one-tap reload.
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!had) { had = true; return; }
    if (document.getElementById('upd')) return;
    var d = document.createElement('div');
    d.id = 'upd';
    d.setAttribute('role', 'button');
    d.textContent = '\u2728 New version ready \u2014 tap to update';
    d.style.cssText = 'position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;background:#ff5e8a;color:#fff;font:800 15px system-ui,sans-serif;padding:12px 18px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer;white-space:nowrap';
    d.onclick = function () { location.reload(); };
    document.body.appendChild(d);
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) {
      // Look for a new version whenever the app is opened again, and every 10 minutes.
      document.addEventListener('visibilitychange', function () { if (!document.hidden) r.update(); });
      setInterval(function () { r.update(); }, 600000);
    }).catch(function () {});
  });
})();

/* Install button (only on pages that have #inst, i.e. the home page). */
(function () {
  var b = document.getElementById('inst'), h = document.getElementById('insthint');
  if (!b) return;
  var done = false, dip = null;
  try { done = localStorage.getItem('ff_inst') === '1'; } catch (x) {}
  function mark() { try { localStorage.setItem('ff_inst', '1'); } catch (x) {} }
  var standalone = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (standalone) { done = true; mark(); }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); dip = e; if (!done) b.style.display = 'block';
  });
  b.addEventListener('click', function () {
    if (!dip) return;
    dip.prompt();
    dip.userChoice.then(function (r) {
      dip = null; b.style.display = 'none';
      if (r && r.outcome === 'accepted') mark();
    }, function () {});
  });
  window.addEventListener('appinstalled', function () { b.style.display = 'none'; mark(); });
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !standalone && h) h.style.display = 'block';
})();
