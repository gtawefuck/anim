/* Full-screen crossfading video background.
 * - Two stacked <video> layers; we fade between them for a seamless blend.
 * - Lazy: waits for window 'load' so it never competes with first paint.
 * - Respects prefers-reduced-motion and Save-Data, and skips video on tiny
 *   screens, falling back to an animated gradient (the .static state).
 * - Sits behind all UI (z-index:-1) with an overlay for text legibility.
 */
(function () {
  function init() {
    var cfg = window.SS_CONFIG || {};
    var sources = cfg.VIDEO_SOURCES || [];

    var layer = document.createElement("div");
    layer.id = "video-bg";
    var overlay = document.createElement("div");
    overlay.className = "vb-overlay";
    var a = document.createElement("video");
    var b = document.createElement("video");
    [a, b].forEach(function (v) {
      v.muted = true; v.defaultMuted = true; v.autoplay = true; v.loop = false;
      v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
      v.preload = "auto"; v.className = "vb-video";
    });
    layer.appendChild(a); layer.appendChild(b); layer.appendChild(overlay);
    document.body.appendChild(layer);

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (!sources.length || reduce || saveData || innerWidth < 560) {
      layer.classList.add("static");
      return;
    }

    var idx = 0, front = a, back = b, last = 0;
    function play(v, src) {
      if (v.getAttribute("src") !== src) { v.src = src; v.load(); }
      var p = v.play();
      if (p && p.catch) p.catch(function () {}); // ignore autoplay rejections
    }
    play(front, sources[0]);
    front.classList.add("active");

    function next() {
      var now = Date.now();
      if (now - last < 3000) return; // debounce timer + 'ended' both firing
      last = now;
      idx = (idx + 1) % sources.length;
      play(back, sources[idx]);
      back.classList.add("active");
      front.classList.remove("active");
      var tmp = front; front = back; back = tmp;
    }
    a.addEventListener("ended", next);
    b.addEventListener("ended", next);
    setInterval(next, cfg.VIDEO_ROTATE_MS || 14000);
  }

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
