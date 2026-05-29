/*!
 * SparkPage heatmap tracker (first-party). Served from /h.js on the SparkPage
 * app domain; injected into published pages by composeV1Template.ts.
 *
 * Self-config: reads `?p=<projectId>` off its own <script src> attribute and
 * derives the ingest endpoint from the same origin. No external deps.
 *
 * Captures clicks, rage-clicks, dead-clicks, and per-session max scroll depth.
 * Coordinates are normalised to the full document (0..1) at capture time so a
 * single server-side snapshot can back heatmaps from any viewport.
 *
 * PII safe: `target_text` is only captured for BUTTON / A / H1..H6 elements
 * and is trimmed to 60 chars; INPUT / TEXTAREA / LABEL / SELECT text is
 * never read.
 */
(function () {
  'use strict';
  if (window.__sparkpageHeatmap) return;
  window.__sparkpageHeatmap = true;

  // Skip our own deploy-time snapshot bot so the capture run doesn't seed
  // synthetic events. The capture lib in src/lib/snapshots sets this UA.
  if ((navigator.userAgent || '').indexOf('SparkPageSnapshot') !== -1) return;

  var self = document.currentScript;
  if (!self || !self.src) return;
  var srcUrl;
  try { srcUrl = new URL(self.src); } catch (e) { return; }
  var projectId = srcUrl.searchParams.get('p');
  if (!projectId) return;
  var endpoint = srcUrl.origin + '/api/heatmap/ingest/' + encodeURIComponent(projectId);

  // Session id — sessionStorage-scoped so a tab refresh keeps the same id but
  // new tabs/visits get fresh ones. Falls back to in-memory if storage blocked.
  var SESS_KEY = '__sp_hm_sid';
  var sessionId;
  try {
    sessionId = window.sessionStorage.getItem(SESS_KEY);
    if (!sessionId) {
      sessionId = uuid();
      window.sessionStorage.setItem(SESS_KEY, sessionId);
    }
  } catch (e) { sessionId = uuid(); }

  // Stamp the session id onto the visitor's URL via history.replaceState so
  // CallRail's landing_page_url and AudienceLab's full_url / referrer_url
  // both carry it. Dashboard normalisers parse spk_sid back out to deep-link
  // a call / identified-visitor to that one session's heatmap. Idempotent:
  // if spk_sid is already present (e.g. after an SPA-like nav) we leave it.
  try {
    if (window.history && typeof window.history.replaceState === 'function') {
      var loc = window.location;
      var qs = loc.search || '';
      if (qs.indexOf('spk_sid=') === -1) {
        var sep = qs ? '&' : '?';
        var nextSearch = qs + sep + 'spk_sid=' + encodeURIComponent(sessionId);
        window.history.replaceState(window.history.state, '', loc.pathname + nextSearch + (loc.hash || ''));
      }
    }
  } catch (e) { /* history blocked / sandboxed iframe — pageview still tracked */ }

  function uuid() {
    var c = window.crypto;
    if (c && c.randomUUID) return c.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
      var r = (Math.random() * 16) | 0;
      var v = ch === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Two-bucket classification to match the deploy-time snapshot set (desktop +
  // mobile). 768px is the standard Tailwind `md` breakpoint; below it pages
  // render in mobile layout, at/above it they render in desktop layout. We
  // could keep a 'tablet' bucket but there's no tablet snapshot to overlay
  // events on, so they'd be unrenderable.
  function deviceFor(w) { return w < 768 ? 'mobile' : 'desktop'; }

  var TEXT_OK = { BUTTON: 1, A: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1 };
  function targetMeta(el) {
    if (!el || el.nodeType !== 1) return { tag: null, text: null };
    var tag = el.tagName;
    var text = null;
    if (TEXT_OK[tag]) {
      var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) text = t.length > 60 ? t.slice(0, 60) : t;
    }
    return { tag: tag, text: text };
  }

  // ── Event queue + flush ────────────────────────────────────────────────────
  var queue = [];
  var FLUSH_MS = 5000;
  var MAX_BATCH = 20;
  var flushTimer = null;

  function schedule() {
    if (flushTimer != null) return;
    flushTimer = window.setTimeout(flush, FLUSH_MS);
  }

  function flush(useBeacon) {
    if (flushTimer != null) { window.clearTimeout(flushTimer); flushTimer = null; }
    if (queue.length === 0) return;
    var batch = queue.splice(0, queue.length);
    var body = JSON.stringify({
      sessionId: sessionId,
      device: deviceFor(window.innerWidth),
      viewport: { w: window.innerWidth | 0, h: window.innerHeight | 0 },
      pathname: window.location.pathname || '/',
      events: batch,
    });
    if (useBeacon && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
        return;
      } catch (e) { /* fall through to fetch */ }
    }
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
      }).catch(function () { /* drop on failure — analytics is best-effort */ });
    } catch (e) { /* ignore */ }
  }

  function push(ev) {
    queue.push(ev);
    if (queue.length >= MAX_BATCH) flush(false);
    else schedule();
  }

  // ── Click + rage-click + dead-click ────────────────────────────────────────
  var recent = []; // sliding window for rage detection
  var RAGE_WINDOW_MS = 1000;
  var RAGE_RADIUS_PX = 30;
  var RAGE_MIN = 3;

  document.addEventListener('click', function (e) {
    var docW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    var docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    var pageX = (e.pageX != null ? e.pageX : e.clientX + window.scrollX);
    var pageY = (e.pageY != null ? e.pageY : e.clientY + window.scrollY);
    var x = Math.max(0, Math.min(1, pageX / docW));
    var y = Math.max(0, Math.min(1, pageY / docH));
    var meta = targetMeta(e.target);
    var now = Date.now();

    push({ t: 'click', x: x, y: y, tag: meta.tag, text: meta.text });

    // Rage-click: 3+ within RAGE_WINDOW_MS and RAGE_RADIUS_PX (Manhattan).
    recent.push({ ts: now, px: pageX, py: pageY });
    while (recent.length && (now - recent[0].ts) > RAGE_WINDOW_MS) recent.shift();
    if (recent.length >= RAGE_MIN) {
      var first = recent[0];
      var close = recent.every(function (r) {
        return Math.abs(r.px - first.px) + Math.abs(r.py - first.py) <= RAGE_RADIUS_PX;
      });
      if (close) {
        push({ t: 'rage_click', x: x, y: y, tag: meta.tag, text: meta.text });
        recent = []; // reset so we don't emit on every subsequent click
      }
    }

    // Dead-click: no DOM mutation, no navigation, no selection within 250ms.
    var preUrl = window.location.href;
    var mutated = false;
    var mo = new MutationObserver(function () { mutated = true; mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    window.setTimeout(function () {
      mo.disconnect();
      if (mutated) return;
      if (window.location.href !== preUrl) return;
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString && sel.toString().length > 0) return;
      push({ t: 'dead_click', x: x, y: y, tag: meta.tag, text: meta.text });
    }, 250);
  }, true);

  // ── Scroll depth ───────────────────────────────────────────────────────────
  var maxScrollPct = 0;
  window.addEventListener('scroll', function () {
    var docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    var seen = window.scrollY + window.innerHeight;
    var pct = Math.max(0, Math.min(100, Math.round((seen / docH) * 100)));
    if (pct > maxScrollPct) maxScrollPct = pct;
  }, { passive: true });

  function finalFlush() {
    if (maxScrollPct > 0) {
      push({ t: 'scroll', pct: maxScrollPct });
      maxScrollPct = 0;
    }
    flush(true);
  }
  window.addEventListener('pagehide', finalFlush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') finalFlush();
  });
})();
