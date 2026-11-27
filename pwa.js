/* Shared by every ApriCode page: auto-updates, "new version" banner, install button. */
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

/* ------------------------------------------------------------------
   TEMPORARY NAME GATE
   Every player must write a name before playing. The name is kept on the
   phone (so it is asked only once) and sent to the place you choose below.
   - Change "version" to ask EVERYONE for their name again.
   - Set enabled to false (or an end date in "until") to switch it off.
------------------------------------------------------------------- */
(function () {
  var CFG = {
    enabled: true,   // false = never ask for a name
    until: '',       // optional last day, e.g. '2026-12-31' (nobody is asked after it)
    version: 3,      // change this number (2 -> 3 ...) and every player is asked again
    // Option A: any web address that accepts a JSON POST (Formspree, Firebase, your own server...)
   endpoint: 'https://sheetdb.io/api/v1/gadelfd8mgqqh',
   form: null
  };
  if (!CFG.enabled) return;
  if (CFG.until && new Date() > new Date(CFG.until + 'T23:59:59')) return;

  var KEY = 'ap_name_v' + CFG.version;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function configured() {
  return !!CFG.endpoint;
  }

  function post(rec) {
  return fetch(CFG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: [{
        name: rec.name,
        id: rec.id,
        time: rec.time,
        page: rec.page
      }]
    })
  }).then(function (response) {
    if (!response.ok) {
      throw new Error('SheetDB error: ' + response.status);
    }
    return response.json();
  });
}
  // If the phone is offline the name waits and is sent the next time the app opens.
  function flush() {
    if (!configured()) return;
    var list = []; try { list = JSON.parse(get('ap_pending') || '[]'); } catch (e) {}
    if (!list.length) return;
    set('ap_pending', '[]');
    list.forEach(function (rec) {
      post(rec).catch(function () {
        var p = []; try { p = JSON.parse(get('ap_pending') || '[]'); } catch (e) {}
        p.push(rec); set('ap_pending', JSON.stringify(p));
      });
    });
  }
  function queue(rec) {
    var p = []; try { p = JSON.parse(get('ap_pending') || '[]'); } catch (e) {}
    p.push(rec); set('ap_pending', JSON.stringify(p)); flush();
  }

  if (get(KEY)) { flush(); return; }

  var css = document.createElement('style');
  css.textContent =
    '#apgate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;' +
    'background:linear-gradient(#ffe6d6,#ffc9aa 55%,#ffa987);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#3a1d12;-webkit-user-select:auto;user-select:auto;touch-action:auto}' +
    '#apgate .c{width:100%;max-width:340px;background:#fff;border:3px solid #3a1d12;border-radius:28px;box-shadow:0 8px 0 #3a1d12;padding:22px 18px;text-align:center;display:flex;flex-direction:column;gap:12px}' +
    '#apgate img{height:54px;width:auto;align-self:center}' +
    '#apgate h2{margin:0;font-size:28px;font-weight:900}' +
    '#apgate p{margin:0;font-weight:700;color:#7a4a38}' +
    '#apgate input{font:inherit;font-size:20px;font-weight:800;text-align:center;padding:14px;border:3px solid #3a1d12;border-radius:16px;outline:none;width:100%;box-sizing:border-box;color:#3a1d12}' +
    '#apgate input:focus{box-shadow:0 0 0 4px #ffc21a}' +
    '#apgate button{font:inherit;font-weight:900;font-size:20px;color:#fff;border:3px solid #3a1d12;border-radius:20px;padding:14px;background:#ff5d6c;box-shadow:0 5px 0 #3a1d12;cursor:pointer}' +
    '#apgate button:active{transform:translateY(4px);box-shadow:0 1px 0 #3a1d12}' +
    '#apgate small{font-weight:600;color:#9a5a42;font-size:12px}' +
    '#aperr{min-height:18px;font-weight:800;font-size:14px;color:#d12b3c}';
  document.head.appendChild(css);

  var g = document.createElement('div');
  g.id = 'apgate';
  g.setAttribute('role', 'dialog');
  g.setAttribute('aria-modal', 'true');
  g.innerHTML =
    '<div class="c"><img src="logo.png" alt="ApriCode"><h2>Welcome! \uD83D\uDC4B</h2>' +
    '<p>Please write your name to start playing.</p>' +
    '<input id="apname" type="text" maxlength="30" placeholder="Your name" autocomplete="given-name" enterkeyhint="go">' +
    '<div id="aperr"></div><button id="apgo">Let\u2019s play</button>' +
    '<small>We save your name only to count how many people play.</small></div>';
  document.body.appendChild(g);

  var input = document.getElementById('apname'), err = document.getElementById('aperr');
  // keep typing from triggering game keys (e.g. Space)
  ['keydown', 'keyup', 'keypress'].forEach(function (t) { input.addEventListener(t, function (e) { e.stopPropagation(); }); });

  function go() {
    var name = input.value.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
    if (name.length < 2) { err.textContent = 'Please write your name (at least 2 letters).'; input.focus(); return; }
    var id = get('ap_id') || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    set('ap_id', id); set(KEY, name);
    queue({ name: name, id: id, time: new Date().toISOString(), page: location.pathname });
    g.remove(); css.remove();
  }
  document.getElementById('apgo').addEventListener('click', go);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  setTimeout(function () { try { input.focus(); } catch (e) {} }, 300);
})();
