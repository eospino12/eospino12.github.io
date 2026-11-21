/* ============================================================
   site.js — idioma, toro de la portada y figura de muestra
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Idioma ---------- */
  var LANGS = ["es", "en", "pt"];

  function pickLang() {
    var saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) {}
    if (saved && LANGS.indexOf(saved) >= 0) return saved;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) >= 0 ? nav : "en";
  }

  function setLang(l) {
    document.body.setAttribute("data-lang", l);
    document.documentElement.setAttribute("lang", l);
    document.querySelectorAll(".langs button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.lang === l ? "true" : "false");
    });
    var t = document.querySelector('meta[name="title-' + l + '"]');
    if (t) document.title = t.content;
    try { localStorage.setItem("lang", l); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  }
  window.currentLang = function () { return document.body.getAttribute("data-lang") || "en"; };

  document.querySelectorAll(".langs button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); });
  });
  setLang(pickLang());

  /* ---------- Fórmulas (KaTeX, incluido en assets/katex) ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }],
        throwOnError: false
      });
    }
    document.dispatchEvent(new CustomEvent("mathready"));
  });

  /* ---------- Utilidades de color ---------- */
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var NEU = hex("#E9EAE4"), BLU = hex("#2F5DA8"), CRI = hex("#C0305E");
  function diverge(v) {           // v en [-1, 1] → azul · neutro · carmesí
    var t = Math.min(1, Math.abs(v)), c = v >= 0 ? CRI : BLU;
    return [NEU[0] + (c[0] - NEU[0]) * t, NEU[1] + (c[1] - NEU[1]) * t, NEU[2] + (c[2] - NEU[2]) * t];
  }
  window.divergeColor = diverge;

  /* ---------- Toro T² con el carácter e_ξ ---------- */
  var cv = document.getElementById("torus");
  if (cv) {
    var ctx = cv.getContext("2d");
    var xi = [3, 2];
    var spin = 0.6, tilt = 1.05;           // ángulos de vista
    var NU = 96, NV = 36, R = 1, r = 0.44;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dragging = false, last = null, visible = true, dirty = true;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = cv.clientWidth, h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    }

    function draw() {
      var w = cv.clientWidth, h = cv.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var s = Math.min(w / 2.9, h / 2.2);
      var cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
      var L = [-0.35, -0.55, 0.76];
      var faces = [];
      for (var i = 0; i < NU; i++) {
        for (var j = 0; j < NV; j++) {
          var uc = (i + 0.5) / NU, vc = (j + 0.5) / NV;
          // normal en el centro, rotada
          var nx = Math.cos(2 * Math.PI * vc) * Math.cos(2 * Math.PI * uc);
          var ny = Math.cos(2 * Math.PI * vc) * Math.sin(2 * Math.PI * uc);
          var nz = Math.sin(2 * Math.PI * vc);
          var rx = cs * nx - ss * ny, ry = ss * nx + cs * ny;
          var ny2 = ct * ry - st * nz, nz2 = st * ry + ct * nz;
          if (nz2 < -0.05) continue;                         // cara trasera
          var pts = [], depth = 0;
          var corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
          for (var k = 0; k < 4; k++) {
            var u = corners[k][0] / NU, v = corners[k][1] / NV;
            var rho = R + r * Math.cos(2 * Math.PI * v);
            var X = rho * Math.cos(2 * Math.PI * u), Y = rho * Math.sin(2 * Math.PI * u), Z = r * Math.sin(2 * Math.PI * v);
            var X1 = cs * X - ss * Y, Y1 = ss * X + cs * Y;
            var Y2 = ct * Y1 - st * Z, Z2 = st * Y1 + ct * Z;
            pts.push(w / 2 + s * X1, h / 2 + s * Y2);
            depth += Z2;
          }
          var val = Math.cos(2 * Math.PI * (xi[0] * uc + xi[1] * vc));
          var lam = Math.max(0, rx * L[0] + ny2 * L[1] + nz2 * L[2]);
          var shade = 0.62 + 0.38 * lam;
          var c = diverge(val);
          faces.push({ d: depth, p: pts, c: "rgb(" + (c[0] * shade | 0) + "," + (c[1] * shade | 0) + "," + (c[2] * shade | 0) + ")" });
        }
      }
      faces.sort(function (a, b) { return a.d - b.d; });
      ctx.lineJoin = "round"; ctx.lineWidth = 0.6;
      for (var f = 0; f < faces.length; f++) {
        var P = faces[f].p;
        ctx.beginPath();
        ctx.moveTo(P[0], P[1]); ctx.lineTo(P[2], P[3]); ctx.lineTo(P[4], P[5]); ctx.lineTo(P[6], P[7]);
        ctx.closePath();
        ctx.fillStyle = faces[f].c; ctx.strokeStyle = faces[f].c;
        ctx.fill(); ctx.stroke();
      }
      dirty = false;
    }

    function loop() {
      if (visible && !dragging && !reduce) { spin += 0.0022; dirty = true; }
      if (dirty && visible) draw();
      requestAnimationFrame(loop);
    }

    cv.addEventListener("pointerdown", function (e) { dragging = true; last = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      spin -= (e.clientX - last[0]) * 0.008;
      tilt = Math.max(0.15, Math.min(1.45, tilt - (e.clientY - last[1]) * 0.006));
      last = [e.clientX, e.clientY]; dirty = true;
    });
    cv.addEventListener("pointerup", function () { dragging = false; });
    cv.addEventListener("pointercancel", function () { dragging = false; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
    }
    window.addEventListener("resize", resize);

    // Red Z² de frecuencias
    var lat = document.getElementById("lattice"), out = document.getElementById("xi-out");
    for (var b = 4; b >= -4; b--) {
      for (var a = -4; a <= 4; a++) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.a = a; btn.dataset.b = b;
        btn.setAttribute("aria-label", "ξ = (" + a + ", " + b + ")");
        btn.setAttribute("aria-pressed", a === xi[0] && b === xi[1] ? "true" : "false");
        if (a === 0 || b === 0) btn.className = "axis";
        btn.addEventListener("click", function () {
          xi = [+this.dataset.a, +this.dataset.b];
          lat.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          this.setAttribute("aria-pressed", "true");
          out.textContent = "ξ = (" + xi[0] + ", " + xi[1] + ")";
          dirty = true;
        });
        lat.appendChild(btn);
      }
    }
    resize(); loop();
  }

  /* ---------- Figura de muestra: onda cuadrada y Op(2⟨ξ⟩^{-2}) ---------- */
  var tz = document.getElementById("teaser");
  if (tz) {
    var tctx = tz.getContext("2d");
    function drawTeaser() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = tz.clientWidth, h = tz.clientHeight;
      tz.width = w * dpr; tz.height = h * dpr; tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.clearRect(0, 0, w, h);
      var M = 400, N = 61, f = [], g = [];
      for (var i = 0; i < M; i++) {
        var x = i / (M - 1), sf = 0, sg = 0;
        for (var k = 1; k <= N; k += 2) {           // onda cuadrada: (4/π) Σ sin(2πkx)/k
          var term = (4 / Math.PI) * Math.sin(2 * Math.PI * k * x) / k;
          sf += term; sg += term * 2 / (1 + k * k); // σ(ξ) = 2⟨ξ⟩^{-2}
        }
        f.push(sf); g.push(sg);
      }
      var pad = 16, y0 = h / 2, sy = (h / 2 - pad) / 1.25;
      tctx.strokeStyle = "#D3D7CE"; tctx.lineWidth = 1;
      tctx.beginPath(); tctx.moveTo(pad, y0); tctx.lineTo(w - pad, y0); tctx.stroke();
      [[f, "#2F5DA8"], [g, "#C0305E"]].forEach(function (s) {
        tctx.strokeStyle = s[1]; tctx.lineWidth = 2; tctx.beginPath();
        for (var i = 0; i < M; i++) {
          var X = pad + (w - 2 * pad) * i / (M - 1), Y = y0 - sy * s[0][i];
          i ? tctx.lineTo(X, Y) : tctx.moveTo(X, Y);
        }
        tctx.stroke();
      });
    }
    drawTeaser();
    window.addEventListener("resize", drawTeaser);
  }
})();
