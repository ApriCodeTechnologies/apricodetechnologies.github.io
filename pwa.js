
/* Shared by every ApriCode page: auto-updates, new version banner, install button. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var had = !!navigator.serviceWorker.controller;

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
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) r.update();
      });
      setInterval(function () { r.update(); }, 600000);
    }).catch(function () {});
  });
})();

/* Install button */
(function () {
  var b = document.getElementById('inst'), h = document.getElementById('insthint');
  if (!b) return;

  var done = false, dip = null;
  try { done = localStorage.getItem('ff_inst') === '1'; } catch (x) {}

  function mark() {
    try { localStorage.setItem('ff_inst', '1'); } catch (x) {}
  }

  var standalone = window.navigator.standalone ||
    (window.matchMedia && matchMedia('(display-mode: standalone)').matches);

  if (standalone) { done = true; mark(); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    dip = e;
    if (!done) b.style.display = 'block';
  });

  b.addEventListener('click', function () {
    if (!dip) return;
    dip.prompt();
    dip.userChoice.then(function (r) {
      dip = null;
      b.style.display = 'none';
      if (r && r.outcome === 'accepted') mark();
    }, function () {});
  });

  window.addEventListener('appinstalled', function () {
    b.style.display = 'none';
    mark();
  });

  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !standalone && h) h.style.display = 'block';
})();

/* ApriCode name gate and player information */
(function () {
  var CFG = {
    enabled: true,
    until: '',
    version: 1,

    // Encoded SheetDB URL (not secure encryption)
    endpoint: atob('aHR0cHM6Ly9zaGVldGRiLmlvL2FwaS92MS9nYWRlbGZkOG1ncXFo')
  };

  if (!CFG.enabled) return;
  if (CFG.until && new Date() > new Date(CFG.until + 'T23:59:59')) return;

  var KEY = 'ap_name_v' + CFG.version;

  function get(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  function set(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function getDevice() {
    var ua = navigator.userAgent;

    if (/ipad|tablet/i.test(ua) ||
        (/android/i.test(ua) && !/mobile/i.test(ua))) return 'Tablet';

    if (/mobile|iphone|ipod|android/i.test(ua)) return 'Mobile';

    return 'Desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;

    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/CriOS\//.test(ua)) return 'Chrome iOS';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';

    return 'Other';
  }

  function getOS() {
    var ua = navigator.userAgent;

    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';

    return 'Other';
  }

  function isInstalled() {
    return !!(
      navigator.standalone ||
      (window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches)
    );
  }

  // Collect exactly the nine requested fields.
  function collect(name) {
    return {
      name: name,
      time: new Date().toISOString(),
      device: getDevice(),
      browser: getBrowser(),
      os: getOS(),
      screen: screen.width + 'x' + screen.height,
      language: navigator.language || '',
      page: location.pathname,
      installed: isInstalled() ? 'Yes' : 'No'
    };
  }

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
        data: [rec]
      })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('SheetDB error: ' + response.status);
      }
      return response.json();
    });
  }

  // Retry saved records when the phone comes online.
  function flush() {
    if (!configured()) return;

    var list = [];
    try {
      list = JSON.parse(get('ap_pending') || '[]');
    } catch (e) {}

    if (!list.length) return;

    set('ap_pending', '[]');

    list.forEach(function (rec) {
      post(rec).catch(function () {
        var p = [];
        try {
          p = JSON.parse(get('ap_pending') || '[]');
        } catch (e) {}

        p.push(rec);
        set('ap_pending', JSON.stringify(p));
      });
    });
  }

  function queue(rec) {
    var p = [];
    try {
      p = JSON.parse(get('ap_pending') || '[]');
    } catch (e) {}

    p.push(rec);
    set('ap_pending', JSON.stringify(p));
    flush();
  }

  // Existing players are not asked again.
  if (get(KEY)) {
    flush();
    return;
  }

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
    '<div id="aperr"></div><button id="apgo">Let\u2019s play</button>';

  document.body.appendChild(g);

  var input = document.getElementById('apname');
  var err = document.getElementById('aperr');

  ['keydown', 'keyup', 'keypress'].forEach(function (t) {
    input.addEventListener(t, function (e) {
      e.stopPropagation();
    });
  });

  function go() {
    var name = input.value
      .replace(/[\u0000-\u001f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30);

    if (name.length < 2) {
      err.textContent = 'Please write your name (at least 2 letters).';
      input.focus();
      return;
    }

    set(KEY, name);

    var rec = collect(name);
    queue(rec);

    g.remove();
    css.remove();
  }

  document.getElementById('apgo').addEventListener('click', go);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') go();
  });

  setTimeout(function () {
    try { input.focus(); } catch (e) {}
  }, 300);
})();
