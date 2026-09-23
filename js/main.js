/* ============ NecxaWA — Interactions ============ */
(function () {
  'use strict';

  /* ---------- Navbar scroll state ---------- */
  var nav = document.getElementById('nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile hamburger ---------- */
  var burger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', function () { navLinks.classList.toggle('mobile-open'); });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('mobile-open'); });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Marquee: duplicate for seamless loop ---------- */
  var track = document.getElementById('marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------- Feature card spotlight follows mouse ---------- */
  document.querySelectorAll('.feat-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Code tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (tabWrap) {
    var key = tabWrap.getAttribute('data-tabs');
    var bodyWrap = document.querySelector('[data-bodies="' + key + '"]');
    if (!bodyWrap) return;
    tabWrap.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabWrap.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var tab = btn.getAttribute('data-tab');
        bodyWrap.querySelectorAll('pre').forEach(function (pre) {
          pre.classList.toggle('active', pre.getAttribute('data-body') === tab);
        });
      });
    });
  });

  /* ---------- Copy buttons ---------- */
  function showToast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(18,18,24,.95);border:1px solid rgba(232,33,45,.4);color:#fff;padding:13px 26px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;opacity:0;transition:all .3s;backdrop-filter:blur(12px);box-shadow:0 12px 40px rgba(0,0,0,.5);';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2200);
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-copy');
      var bodyWrap = document.querySelector('[data-bodies="' + key + '"]');
      var active = bodyWrap ? bodyWrap.querySelector('pre.active') : null;
      var text = active ? active.innerText : '';
      function done() {
        var label = btn.querySelector('span');
        var orig = label ? label.textContent : '';
        if (label) label.textContent = 'Copied!';
        showToast('Code copied to clipboard');
        setTimeout(function () { if (label) label.textContent = orig; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { showToast('Copy failed'); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { showToast('Copy failed'); }
        ta.remove();
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Dashboard panel switching ---------- */
  var dashLinks = document.querySelectorAll('.dash-link[data-panel]');
  var panelBodies = document.querySelectorAll('[data-panelbody]');
  var panelTitle = document.getElementById('panelTitle');
  var titles = { overview: 'Overview', chats: 'Chats', autoreply: 'Auto-Reply Bots', bulk: 'Bulk Sender', scheduler: 'Scheduler', logs: 'Event Logs', settings: 'Settings' };
  dashLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      var p = link.getAttribute('data-panel');
      dashLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
      panelBodies.forEach(function (b) {
        b.style.display = b.getAttribute('data-panelbody') === p ? '' : 'none';
      });
      if (panelTitle && titles[p]) panelTitle.textContent = titles[p];
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ---------- Dashboard demo actions (front-end only) ---------- */
  window.fakeSend = function (btn) {
    var orig = btn.innerHTML;
    btn.innerHTML = 'Sending...'; btn.disabled = true;
    setTimeout(function () {
      btn.innerHTML = 'Done — check logs'; btn.style.background = 'rgba(34,192,122,.15)'; btn.style.borderColor = 'rgba(34,192,122,.4)';
      showToast('Action queued — connect the backend to go live');
      setTimeout(function () { btn.innerHTML = orig; btn.disabled = false; btn.style.background = ''; btn.style.borderColor = ''; }, 2200);
    }, 900);
  };
  window.refreshQR = function (btn) {
    btn.innerHTML = 'Generating...'; btn.disabled = true;
    setTimeout(function () { btn.innerHTML = 'Generate new QR'; btn.disabled = false; showToast('New QR generated — scan to pair'); }, 1200);
  };
  window.startBulk = function (btn) {
    var bar = document.getElementById('bulkBar');
    var label = document.getElementById('bulkLabel');
    btn.disabled = true; btn.innerHTML = 'Campaign running...';
    var pct = 0;
    var iv = setInterval(function () {
      pct += Math.random() * 14;
      if (pct >= 100) { pct = 100; clearInterval(iv); btn.disabled = false; btn.innerHTML = 'Launch campaign'; label.textContent = 'Complete — 500/500 delivered. See logs for details.'; showToast('Bulk campaign finished'); }
      else { label.textContent = 'Sending... ' + Math.round(pct) + '% complete (rate limited)'; }
      if (bar) bar.style.width = pct + '%';
    }, 600);
  };

  /* ---------- Active nav link highlight ---------- */
  var sections = document.querySelectorAll('section[id]');
  var navAs = document.querySelectorAll('.nav-links a[href^="#"]');
  function highlightNav() {
    var cur = '';
    sections.forEach(function (s) {
      if (window.scrollY >= s.offsetTop - 200) cur = s.getAttribute('id');
    });
    navAs.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });
})();
