/* ============================================================
   explorer.js — herramientas interactivas en T¹ = R/Z
   Toda función se guarda por sus coeficientes f̂(ξ), |ξ| ≤ N,
   y todo operador por su símbolo σ(x, ξ).
   ============================================================ */
(function () {
  "use strict";

  var TAU = 2 * Math.PI;
  var COL = { blue: "#2F5DA8", crimson: "#C0305E", ink: "#1A2236", ink2: "#4A5366", ink3: "#6B7385",
              grid: "#E3E6DF", axis: "#C4C9BF", surface: "#FBFBF8" };
  function $(id) { return document.getElementById(id); }
  function lang() { return window.currentLang ? window.currentLang() : "es"; }
  function L3(es, en, pt) { var l = lang(); return l === "en" ? en : l === "pt" ? pt : es; }
  function fmt(v, d) { d = d == null ? 2 : d; return (Math.abs(v) < 1e-12 ? 0 : v).toFixed(d); }
  function minus(s) { return String(s).replace(/-/g, "−"); }
  function sci(v) {
    var a = Math.abs(v);
    if (a === 0) return "0";
    if (a >= 1e4 || a < 1e-3) { var e = Math.floor(Math.log10(a)); return minus((v / Math.pow(10, e)).toFixed(1) + "×10^" + e).replace("^", "<sup>").replace(/$/, "</sup>"); }
    return minus(+v.toPrecision(3));
  }

  /* ---------------- Textos de los menús ---------------- */
  var TX = {
    cos:    ["cos(2πx)", "cos(2πx)", "cos(2πx)"],
    mix:    ["Polinomio trigonométrico", "Trigonometric polynomial", "Polinômio trigonométrico"],
    square: ["Onda cuadrada", "Square wave", "Onda quadrada"],
    saw:    ["Diente de sierra", "Sawtooth wave", "Dente de serra"],
    tri:    ["Onda triangular", "Triangle wave", "Onda triangular"],
    bump:   ["Pulso gaussiano periódico", "Periodic Gaussian bump", "Pulso gaussiano periódico"],
    delta:  ["Delta de Dirac en x = 1/2", "Dirac delta at x = 1/2", "Delta de Dirac em x = 1/2"],
    frac:   ["Laplaciano fraccionario (−Δ)^(ν/2)", "Fractional Laplacian (−Δ)^(ν/2)", "Laplaciano fracionário (−Δ)^(ν/2)"],
    bessel: ["Potencial de Bessel ⟨ξ⟩^m", "Bessel potential ⟨ξ⟩^m", "Potencial de Bessel ⟨ξ⟩^m"],
    xdep:   ["Depende de x: (1 + a sin 2πx)⟨ξ⟩^m", "x-dependent: (1 + a sin 2πx)⟨ξ⟩^m", "Depende de x: (1 + a sin 2πx)⟨ξ⟩^m"],
    trans:  ["Traslación e^(2πihξ)", "Translation e^(2πihξ)", "Translação e^(2πihξ)"]
  };
  function tx(k) { var o = TX[k]; return o ? L3(o[0], o[1], o[2]) : k; }

  /* ---------------- Funciones por sus coeficientes ---------------- */
  var FN = {
    cos:    function (k) { return (k === 1 || k === -1) ? [0.5, 0] : [0, 0]; },
    mix:    function (k) {                     // cos 2πx + ½ cos 6πx + ¼ sin 14πx
      var a = Math.abs(k);
      if (a === 1) return [0.5, 0];
      if (a === 3) return [0.25, 0];
      if (k === 7) return [0, -0.125];
      if (k === -7) return [0, 0.125];
      return [0, 0];
    },
    square: function (k) { return (k % 2 !== 0) ? [0, -2 / (Math.PI * k)] : [0, 0]; },       // sign(sin 2πx)
    saw:    function (k) { return k === 0 ? [0, 0] : [0, 1 / (Math.PI * k)]; },             // 2x − 1 en [0,1)
    tri:    function (k) { return (k % 2 !== 0) ? [-4 / (Math.PI * Math.PI * k * k), 0] : [0, 0]; }, // 1 − 4|x − ½|
    bump:   function (k) {                     // Gaussiana periodizada centrada en ½, ancho 0.06
      var w = 0.06, A = Math.sqrt(TAU) * w * Math.exp(-2 * Math.PI * Math.PI * w * w * k * k);
      return [(k % 2 === 0 ? 1 : -1) * A, 0];
    },
    delta:  function (k) { return [(k % 2 === 0) ? 1 : -1, 0]; }                              // δ_{1/2}
  };
  function coefArr(name, N) {
    var re = new Float64Array(2 * N + 1), im = new Float64Array(2 * N + 1);
    for (var k = -N; k <= N; k++) { var c = FN[name](k); re[k + N] = c[0]; im[k + N] = c[1]; }
    return { re: re, im: im, N: N };
  }
  function l2(c) { var s = 0; for (var i = 0; i < c.re.length; i++) s += c.re[i] * c.re[i] + c.im[i] * c.im[i]; return Math.sqrt(s); }

  /* ---------------- Símbolos ---------------- */
  var SYM = {
    frac: {
      xdep: false,
      ev: function (x, k, p, S) { S[0] = Math.pow(TAU * Math.abs(k), p.nu); S[1] = 0; },
      order: function (p) { return p.nu; },
      tex: function (p) { return "\\sigma(x,\\xi)=(2\\pi|\\xi|)^{" + fmt(p.nu) + "}"; }
    },
    bessel: {
      xdep: false,
      ev: function (x, k, p, S) { S[0] = Math.pow(1 + k * k, p.m / 2); S[1] = 0; },
      order: function (p) { return p.m; },
      tex: function (p) { return "\\sigma(x,\\xi)=\\langle\\xi\\rangle^{" + fmt(p.m, 1) + "}=(1+\\xi^2)^{" + fmt(p.m / 2) + "}"; }
    },
    xdep: {
      xdep: true,
      ev: function (x, k, p, S) { S[0] = (1 + p.a * Math.sin(TAU * x)) * Math.pow(1 + k * k, p.m / 2); S[1] = 0; },
      order: function (p) { return p.m; },
      tex: function (p) { return "\\sigma(x,\\xi)=\\bigl(1+" + fmt(p.a) + "\\sin 2\\pi x\\bigr)\\,\\langle\\xi\\rangle^{" + fmt(p.m, 1) + "}"; }
    },
    trans: {
      xdep: false,
      ev: function (x, k, p, S) { S[0] = Math.cos(TAU * p.h * k); S[1] = Math.sin(TAU * p.h * k); },
      order: function () { return 0; },
      tex: function (p) { return "\\sigma(x,\\xi)=e^{2\\pi i\\,(" + fmt(p.h) + ")\\,\\xi}"; }
    }
  };

  /* Re Σ_ξ e^{2πi(x+s)ξ} σ(x+s, ξ) c(ξ) en cada punto de xs */
  function synth(c, xs, sym, p, shift) {
    var N = c.N, nz = [], S = [1, 0], out = new Float64Array(xs.length);
    for (var k = -N; k <= N; k++) if (c.re[k + N] !== 0 || c.im[k + N] !== 0) nz.push(k);
    shift = shift || 0;
    for (var j = 0; j < xs.length; j++) {
      var x = xs[j] + shift, s = 0;
      for (var q = 0; q < nz.length; q++) {
        var kk = nz[q], cr = c.re[kk + N], ci = c.im[kk + N];
        if (sym) sym.ev(x, kk, p, S); else { S[0] = 1; S[1] = 0; }
        var ar = S[0] * cr - S[1] * ci, ai = S[0] * ci + S[1] * cr, th = TAU * kk * x;
        s += Math.cos(th) * ar - Math.sin(th) * ai;
      }
      out[j] = s;
    }
    return out;
  }

  /* Coeficientes de Op(σ)f (exactos) */
  function applyCoef(c, name, p) {
    var N = c.N, re = new Float64Array(2 * N + 1), im = new Float64Array(2 * N + 1), S = [0, 0];
    if (name === "xdep") {
      // (1 + a sin 2πx)·h, con ĥ(ξ) = ⟨ξ⟩^m f̂(ξ); sin 2πx·h tiene coeficientes (ĥ(ξ−1) − ĥ(ξ+1)) / 2i
      var hr = function (k) { return (k < -N || k > N) ? 0 : Math.pow(1 + k * k, p.m / 2) * c.re[k + N]; };
      var hi = function (k) { return (k < -N || k > N) ? 0 : Math.pow(1 + k * k, p.m / 2) * c.im[k + N]; };
      for (var k = -N; k <= N; k++) {
        var zr = hr(k - 1) - hr(k + 1), zi = hi(k - 1) - hi(k + 1);
        re[k + N] = hr(k) + (p.a / 2) * zi;
        im[k + N] = hi(k) - (p.a / 2) * zr;
      }
    } else {
      for (var j = -N; j <= N; j++) {
        SYM[name].ev(0, j, p, S);
        re[j + N] = S[0] * c.re[j + N] - S[1] * c.im[j + N];
        im[j + N] = S[0] * c.im[j + N] + S[1] * c.re[j + N];
      }
    }
    return { re: re, im: im, N: N };
  }
  function absArr(c, from) {
    var N = c.N, out = [];
    for (var k = from; k <= N; k++) out.push(Math.hypot(c.re[k + N], c.im[k + N]));
    return out;
  }
  function grid(M) { var xs = new Float64Array(M); for (var i = 0; i < M; i++) xs[i] = i / (M - 1); return xs; }

  /* ---------------- Fórmulas dinámicas (KaTeX) ---------------- */
  function tex(el, s) {
    if (el._s === s) return;
    if (!window.katex) { el.textContent = s; el._s = null; return; }
    el._s = s;
    try { katex.render(s, el, { displayMode: true, throwOnError: false }); } catch (e) { el.textContent = s; }
  }
  document.addEventListener("mathready", function () { schedule(); });

  /* ============================================================
     Gráficos en canvas
     ============================================================ */
  function setup(cv) {
    if (!cv._h) { cv._h = +cv.getAttribute("height"); cv.style.height = cv._h + "px"; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 640, h = cv._h;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = "11px 'Public Sans', system-ui, sans-serif";
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  }
  function niceTicks(lo, hi, n) {
    var span = hi - lo, raw = span / n, step = Math.pow(10, Math.floor(Math.log10(raw))), e = raw / step;
    step *= e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1;
    var t = [];
    for (var v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) t.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return t;
  }
  function tickLabel(v) {
    var a = Math.abs(v);
    if (a === 0) return "0";
    if (a >= 1e4 || a < 1e-3) return minus(v.toExponential(0));
    return minus(+v.toPrecision(3));
  }
  function snapshot(cv, g) { cv._base = g.ctx.getImageData(0, 0, cv.width, cv.height); }
  function restore(cv) { if (cv._base) cv.getContext("2d").putImageData(cv._base, 0, 0); }
  function tipFor(cv) { var t = cv.nextElementSibling; return t && t.classList.contains("tip") ? t : null; }
  function showTip(cv, html, px, py) {
    var t = tipFor(cv); if (!t) return;
    t.innerHTML = html;
    var left = cv.offsetLeft + px, maxL = cv.offsetLeft + cv.clientWidth - 70;
    t.style.left = Math.max(cv.offsetLeft + 70, Math.min(maxL, left)) + "px";
    t.style.top = (cv.offsetTop + py) + "px";
    t.classList.add("on");
  }
  function hideTip(cv) { var t = tipFor(cv); if (t) t.classList.remove("on"); restore(cv); }
  function sw(color, dash) {
    return '<span style="display:inline-block;width:12px;height:0;border-top:2px ' + (dash ? "dashed" : "solid") + " " + color + ';vertical-align:middle;margin-right:5px"></span>';
  }
  function bindHover(cv) {
    if (cv._bound) return;
    cv._bound = true;
    cv.addEventListener("pointermove", function (e) {
      if (!cv._hover) return;
      var r = cv.getBoundingClientRect();
      cv._hover(e.clientX - r.left, e.clientY - r.top);
    });
    cv.addEventListener("pointerleave", function () { hideTip(cv); });
  }

  /* --- Gráfico de líneas en [0,1] --- */
  function lineChart(cv, o) {
    var g = setup(cv), ctx = g.ctx, w = g.w, h = g.h;
    var Lm = 50, Rm = 12, Tm = 10, Bm = 24, pw = w - Lm - Rm, ph = h - Tm - Bm;
    var lo = Infinity, hi = -Infinity;
    o.series.forEach(function (s) { for (var i = 0; i < s.y.length; i++) { if (s.y[i] < lo) lo = s.y[i]; if (s.y[i] > hi) hi = s.y[i]; } });
    if (o.arrow != null) { lo = Math.min(lo, 0); hi = Math.max(hi, 1); }
    if (!isFinite(lo)) { lo = -1; hi = 1; }
    var mr = o.minRange || 1e-9;
    if (hi - lo < mr) { var mid = (hi + lo) / 2; lo = mid - mr / 2; hi = mid + mr / 2; }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var ticks = niceTicks(lo, hi, 4);
    function X(x) { return Lm + pw * x; }
    function Y(v) { return Tm + ph * (hi - v) / (hi - lo); }

    ctx.lineWidth = 1; ctx.textBaseline = "middle"; ctx.textAlign = "right";
    ticks.forEach(function (v) {
      ctx.strokeStyle = v === 0 ? COL.axis : COL.grid;
      ctx.beginPath(); ctx.moveTo(Lm, Math.round(Y(v)) + 0.5); ctx.lineTo(Lm + pw, Math.round(Y(v)) + 0.5); ctx.stroke();
      ctx.fillStyle = COL.ink3; ctx.fillText(tickLabel(v), Lm - 8, Y(v));
    });
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (x) { ctx.fillStyle = COL.ink3; ctx.fillText(String(x), X(x), Tm + ph + 7); });

    o.series.forEach(function (s) {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = "round";
      ctx.setLineDash(s.dash ? [7, 5] : []);
      ctx.beginPath();
      for (var i = 0; i < s.y.length; i++) { var px = X(o.xs[i]), py = Y(s.y[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    });
    ctx.setLineDash([]);
    if (o.arrow != null) {                       // la delta de Dirac
      var ax = X(o.arrow), y0 = Y(0), y1 = Y(hi - (hi - lo) * 0.12);
      ctx.strokeStyle = COL.blue; ctx.fillStyle = COL.blue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax, y1 + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, y1); ctx.lineTo(ax - 5, y1 + 9); ctx.lineTo(ax + 5, y1 + 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = COL.ink2; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = "italic 15px Spectral, serif"; ctx.fillText("δ", ax + 8, y1 + 6);
    }
    snapshot(cv, g);
    bindHover(cv);
    cv._hover = function (mx, my) {
      if (mx < Lm || mx > Lm + pw || !o.series.length) { hideTip(cv); return; }
      var t = (mx - Lm) / pw, i = Math.round(t * (o.xs.length - 1));
      restore(cv);
      var c2 = cv.getContext("2d"); c2.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      c2.strokeStyle = COL.ink3; c2.lineWidth = 1; c2.setLineDash([]);
      c2.beginPath(); c2.moveTo(X(o.xs[i]), Tm); c2.lineTo(X(o.xs[i]), Tm + ph); c2.stroke();
      var html = "x = " + o.xs[i].toFixed(3), topY = Infinity;
      o.series.forEach(function (s) {
        var py = Y(s.y[i]); topY = Math.min(topY, py);
        c2.fillStyle = s.color; c2.strokeStyle = COL.surface; c2.lineWidth = 2;
        c2.beginPath(); c2.arc(X(o.xs[i]), py, 4.5, 0, TAU); c2.fill(); c2.stroke();
        html += "<br>" + sw(s.color, s.dash) + s.name + " = " + minus(s.y[i].toFixed(4));
      });
      showTip(cv, html, X(o.xs[i]), Math.max(Tm + 30, topY));
    };
  }

  /* --- Coeficientes en escala logarítmica --- */
  function specChart(cv, o) {
    var g = setup(cv), ctx = g.ctx, w = g.w, h = g.h;
    var Lm = 50, Rm = 14, Tm = 10, Bm = 26, pw = w - Lm - Rm, ph = h - Tm - Bm;
    var ymax = 0;
    o.series.forEach(function (s) { s.y.forEach(function (v) { if (v > ymax) ymax = v; }); });
    if (ymax <= 0) ymax = 1;
    var floor = ymax * 1e-12, ymin = ymax;
    o.series.forEach(function (s) { s.y.forEach(function (v) { if (v > floor && v < ymin) ymin = v; }); });
    var dHi = Math.ceil(Math.log10(ymax) + 0.05), dLo = Math.floor(Math.log10(ymin) - 0.05);
    if (dHi - dLo < 2) dLo = dHi - 2;
    var k0 = o.ks[0], k1 = o.ks[o.ks.length - 1];
    function X(k) {
      if (o.logX) return Lm + pw * Math.log(k / k0) / Math.log(k1 / k0);
      return Lm + pw * (k - k0) / Math.max(1, k1 - k0);
    }
    function Y(v) { return Tm + ph * (dHi - Math.log10(v)) / (dHi - dLo); }

    var dstep = Math.max(1, Math.ceil((dHi - dLo) / 6));
    ctx.lineWidth = 1; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (var d = dHi; d >= dLo; d -= dstep) {
      var yy = Math.round(Y(Math.pow(10, d))) + 0.5;
      ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(Lm, yy); ctx.lineTo(Lm + pw, yy); ctx.stroke();
      ctx.fillStyle = COL.ink3;
      if (d === 0) { ctx.fillText("1", Lm - 8, yy); }
      else {                                               // 10 con el exponente como superíndice
        var es = minus(String(d));
        ctx.save(); ctx.font = "9px 'Public Sans', system-ui, sans-serif"; var we = ctx.measureText(es).width;
        ctx.textAlign = "left"; ctx.fillText(es, Lm - 8 - we, yy - 5); ctx.restore();
        ctx.fillText("10", Lm - 8 - we - 1, yy);
      }
    }
    // marcas del eje ξ
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = COL.ink3;
    var xt = [];
    if (o.logX) { [1, 2, 4, 8, 16, 32, 64, 128, 256].forEach(function (k) { if (k >= k0 && k <= k1) xt.push(k); }); }
    else { niceTicks(k0, k1, 6).forEach(function (k) { if (k >= k0 && k <= k1) xt.push(k); }); }
    xt.forEach(function (k) { ctx.fillText(String(k), X(k), Tm + ph + 7); });
    ctx.textAlign = "right"; ctx.fillText("|ξ|", Lm - 8, Tm + ph + 7);

    var r = o.ks.length > 140 ? 2.2 : 3;
    o.series.forEach(function (s) {
      ctx.fillStyle = s.color; ctx.strokeStyle = COL.surface; ctx.lineWidth = 1.2;
      for (var i = 0; i < s.y.length; i++) {
        if (s.y[i] <= floor) continue;
        ctx.beginPath(); ctx.arc(X(o.ks[i]), Y(s.y[i]), r, 0, TAU); ctx.fill(); ctx.stroke();
      }
    });
    // rectas de ajuste
    (o.fits || []).forEach(function (f) {
      ctx.strokeStyle = COL.ink3; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(X(f.from), Y(f.C * Math.pow(f.from, -f.p))); ctx.lineTo(X(f.to), Y(f.C * Math.pow(f.to, -f.p))); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.ink2; ctx.font = "12px 'Public Sans', system-ui, sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      var lx = X(f.to) - 4, ly = Y(f.C * Math.pow(f.to, -f.p)) - 6;
      var tw = ctx.measureText(f.label).width, ty = Math.max(Tm + 14, ly);
      ctx.fillStyle = COL.surface; ctx.fillRect(lx - tw - 4, ty - 15, tw + 8, 17);
      ctx.fillStyle = COL.ink2; ctx.fillText(f.label, lx, ty);
      ctx.font = "11px 'Public Sans', system-ui, sans-serif";
    });

    snapshot(cv, g);
    bindHover(cv);
    cv._hover = function (mx) {
      if (mx < Lm - 4 || mx > Lm + pw + 4) { hideTip(cv); return; }
      var best = 0, bd = Infinity;
      for (var i = 0; i < o.ks.length; i++) { var dd = Math.abs(X(o.ks[i]) - mx); if (dd < bd) { bd = dd; best = i; } }
      restore(cv);
      var c2 = cv.getContext("2d"); c2.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      c2.strokeStyle = COL.ink3; c2.lineWidth = 1;
      c2.beginPath(); c2.moveTo(X(o.ks[best]), Tm); c2.lineTo(X(o.ks[best]), Tm + ph); c2.stroke();
      var html = "ξ = " + o.ks[best], topY = Tm + ph;
      o.series.forEach(function (s) {
        var v = s.y[best];
        html += "<br>" + sw(s.color) + s.name + " = " + (v <= floor ? "0" : sci(v));
        if (v > floor) topY = Math.min(topY, Y(v));
      });
      showTip(cv, html, X(o.ks[best]), Math.max(Tm + 30, topY));
    };
  }

  /* --- Mapa de calor del símbolo en T¹ × Z --- */
  function mix3(t, a, b, c) {
    var p = t < 0.5 ? [a, b, t * 2] : [b, c, (t - 0.5) * 2];
    return [p[0][0] + (p[1][0] - p[0][0]) * p[2], p[0][1] + (p[1][1] - p[0][1]) * p[2], p[0][2] + (p[1][2] - p[0][2]) * p[2]];
  }
  var SEQ = [[238, 240, 234], [214, 128, 158], [110, 21, 51]];
  function heatChart(cv, o) {
    var g = setup(cv), ctx = g.ctx, w = g.w, h = g.h;
    var Lm = 50, Rm = 12, Tm = 8, Bm = 24, pw = w - Lm - Rm, ph = h - Tm - Bm;
    var K = o.K, nx = 120, rows = 2 * K + 1, vals = [], vmin = Infinity, vmax = -Infinity, amax = 0;
    for (var r = 0; r < rows; r++) {
      var k = K - r, row = [];
      for (var i = 0; i < nx; i++) {
        var v = o.val((i + 0.5) / nx, k); row.push(v);
        if (v < vmin) vmin = v; if (v > vmax) vmax = v; if (Math.abs(v) > amax) amax = Math.abs(v);
      }
      vals.push(row);
    }
    var eps = Math.max(vmax, 1e-12) * 1e-3;
    var lmin = Math.log(Math.max(vmin, 0) + eps), lmax = Math.log(vmax + eps);
    var cw = pw / nx, ch = ph / rows;
    for (r = 0; r < rows; r++) {
      for (i = 0; i < nx; i++) {
        var c;
        if (o.diverging) c = window.divergeColor(vals[r][i] / (amax || 1));
        else { var tt = lmax - lmin < 1e-9 ? 0.5 : (Math.log(Math.max(vals[r][i], 0) + eps) - lmin) / (lmax - lmin); c = mix3(tt, SEQ[0], SEQ[1], SEQ[2]); }
        ctx.fillStyle = "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")";
        ctx.fillRect(Lm + i * cw, Tm + r * ch, cw + 0.6, ch + 0.6);
      }
    }
    ctx.fillStyle = COL.ink3; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [K, Math.round(K / 2), 0, -Math.round(K / 2), -K].forEach(function (k) { ctx.fillText(minus(String(k)), Lm - 8, Tm + (K - k + 0.5) * ch); });
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (x) { ctx.fillText(String(x), Lm + pw * x, Tm + ph + 7); });
    ctx.save(); ctx.translate(14, Tm + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText("ξ", 0, 0); ctx.restore();
    snapshot(cv, g);
    bindHover(cv);
    cv._hover = function (mx, my) {
      if (mx < Lm || mx > Lm + pw || my < Tm || my > Tm + ph) { hideTip(cv); return; }
      var i = Math.min(nx - 1, Math.floor((mx - Lm) / cw)), r = Math.min(rows - 1, Math.floor((my - Tm) / ch));
      restore(cv);
      var c2 = cv.getContext("2d"); c2.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      c2.strokeStyle = COL.ink; c2.lineWidth = 1.5; c2.strokeRect(Lm + i * cw, Tm + r * ch, cw, ch);
      showTip(cv, "x = " + ((i + 0.5) / nx).toFixed(3) + "<br>ξ = " + minus(K - r) + "<br>" + o.label + " = " + minus(vals[r][i].toPrecision(4)), mx, my - 6);
    };
  }

  /* ============================================================
     Controles
     ============================================================ */
  function fillSelect(sel, keys) {
    var v = sel.value;
    sel.innerHTML = "";
    keys.forEach(function (k) { var op = document.createElement("option"); op.value = k; op.textContent = tx(k); sel.appendChild(op); });
    if (v && keys.indexOf(v) >= 0) sel.value = v;
  }
  function val(id) { return +$(id).value; }
  function showRows(panel, name) {
    panel.querySelectorAll("[data-show]").forEach(function (el) {
      el.hidden = el.getAttribute("data-show").split(" ").indexOf(name) < 0;
    });
  }
  function setOut(id, d) { var o = $(id + "-o"); if (o) o.textContent = minus(fmt(val(id), d)); }

  function orderNote(m) {
    var M = minus(fmt(m)), A = fmt(Math.abs(m));
    if (m > 0.001) return L3(
      "Orden m = " + M + ": Op(σ) ∈ Op S<sup>m</sup> y pierde " + A + " derivadas, H<sup>s</sup> → H<sup>s−" + A + "</sup>.",
      "Order m = " + M + ": Op(σ) ∈ Op S<sup>m</sup> loses " + A + " derivatives, H<sup>s</sup> → H<sup>s−" + A + "</sup>.",
      "Ordem m = " + M + ": Op(σ) ∈ Op S<sup>m</sup> perde " + A + " derivadas, H<sup>s</sup> → H<sup>s−" + A + "</sup>.");
    if (m < -0.001) return L3(
      "Orden m = " + M + ": Op(σ) gana " + A + " derivadas, H<sup>s</sup> → H<sup>s+" + A + "</sup>. Suaviza.",
      "Order m = " + M + ": Op(σ) gains " + A + " derivatives, H<sup>s</sup> → H<sup>s+" + A + "</sup>. It smooths.",
      "Ordem m = " + M + ": Op(σ) ganha " + A + " derivadas, H<sup>s</sup> → H<sup>s+" + A + "</sup>. Suaviza.");
    return L3("Orden 0: Op(σ) es acotado en cada H<sup>s</sup>.", "Order 0: Op(σ) is bounded on every H<sup>s</sup>.", "Ordem 0: Op(σ) é limitado em cada H<sup>s</sup>.");
  }

  /* ---------------- Herramienta 1: cuantización ---------------- */
  function updateQ() {
    var fname = $("q-f").value, sname = $("q-sym").value, N = val("q-N");
    var p = { nu: val("q-nu"), m: val("q-m"), a: val("q-a"), h: val("q-h") };
    setOut("q-nu"); setOut("q-m", 1); setOut("q-a"); setOut("q-h"); setOut("q-N", 0);
    showRows($("tool-q"), sname);
    var sym = SYM[sname], c = coefArr(fname, N), xs = grid(600);
    var f = synth(c, xs, null, p), gv = synth(c, xs, sym, p);
    lineChart($("q-plot-f"), { xs: xs, series: [{ y: f, color: COL.blue, name: "f" }] });
    lineChart($("q-plot-g"), { xs: xs, series: [{ y: gv, color: COL.crimson, name: "Op(σ)f" }] });
    var gc = applyCoef(c, sname, p), ks = [];
    for (var k = 0; k <= N; k++) ks.push(k);
    specChart($("q-spec"), { ks: ks, series: [
      { y: absArr(c, 0), color: COL.blue, name: "|f̂(ξ)|" },
      { y: absArr(gc, 0), color: COL.crimson, name: "|(Op(σ)f)^(ξ)|" }] });
    var S = [0, 0];
    heatChart($("q-heat"), {
      K: Math.min(N, 20), diverging: sname === "trans", label: sname === "trans" ? "Re σ" : "σ",
      val: function (x, kk) { sym.ev(x, kk, p, S); return S[0]; }
    });
    $("q-heat-key").textContent = sname === "trans"
      ? L3("color: Re σ, azul negativo, carmesí positivo", "colour: Re σ, blue negative, crimson positive", "cor: Re σ, azul negativo, carmesim positivo")
      : L3("color: σ en escala logarítmica, claro es pequeño", "colour: σ on a log scale, light is small", "cor: σ em escala logarítmica, claro é pequeno");
    tex($("q-tex"), sym.tex(p));

    var note = sname === "trans"
      ? L3("Orden 0 y |σ| = 1: T_h mueve la función sin cambiar su norma ni su regularidad.",
           "Order 0 and |σ| = 1: T_h moves the function without changing its norm or regularity.",
           "Ordem 0 e |σ| = 1: T_h move a função sem mudar sua norma nem sua regularidade.")
      : orderNote(sym.order(p));
    if (sname === "frac") note += " " + L3("El símbolo se anula en ξ = 0, así que se pierde el promedio de f.",
      "The symbol vanishes at ξ = 0, so the mean of f is lost.", "O símbolo se anula em ξ = 0, então a média de f é perdida.");
    if (sname === "xdep") note += " " + L3("El factor 1 + a sin 2πx modula la amplitud: ya no es un multiplicador de Fourier y mezcla cada frecuencia ξ con ξ ± 1.",
      "The factor 1 + a sin 2πx modulates the amplitude: it is no longer a Fourier multiplier and mixes each frequency ξ with ξ ± 1.",
      "O fator 1 + a sin 2πx modula a amplitude: já não é um multiplicador de Fourier e mistura cada frequência ξ com ξ ± 1.");
    $("q-note").innerHTML = note;

    var read = "‖f‖<sub>L²</sub> = <strong>" + l2(c).toFixed(4) + "</strong>&emsp;‖Op(σ)f‖<sub>L²</sub> = <strong>" + l2(gc).toFixed(4) + "</strong>";
    if (fname === "cos" && sname === "xdep" && Math.abs(p.a - 1) < 1e-9 && Math.abs(p.m - 1) < 1e-9) {
      var err = 0;
      for (var j = 0; j < xs.length; j++) err = Math.max(err, Math.abs(gv[j] - Math.SQRT2 * (1 + Math.sin(TAU * xs[j])) * Math.cos(TAU * xs[j])));
      read += "<br>" + L3("Coincide con el ejemplo 2.0.30, √2(1 + sin 2πx) cos 2πx: error máximo ",
        "Matches example 2.0.30, √2(1 + sin 2πx) cos 2πx: maximum error ",
        "Coincide com o exemplo 2.0.30, √2(1 + sin 2πx) cos 2πx: erro máximo ") + "<strong>" + sci(err) + "</strong>.";
    }
    $("q-read").innerHTML = read;
  }

  /* ---------------- Herramienta 2: traslaciones ---------------- */
  function updateT() {
    var fname = $("t-f").value, sname = $("t-sym").value, N = val("t-N");
    var p = { nu: val("t-nu"), m: val("t-m"), a: val("t-a"), h: val("t-h") };
    setOut("t-nu"); setOut("t-m", 1); setOut("t-a"); setOut("t-h"); setOut("t-N", 0);
    showRows($("tool-t"), sname);
    var sym = SYM[sname], c = coefArr(fname, N), xs = grid(600);
    var ch = { re: new Float64Array(2 * N + 1), im: new Float64Array(2 * N + 1), N: N };
    for (var k = -N; k <= N; k++) {                     // (T_h f)^(ξ) = e^{2πihξ} f̂(ξ)
      var cr = Math.cos(TAU * p.h * k), si = Math.sin(TAU * p.h * k);
      ch.re[k + N] = cr * c.re[k + N] - si * c.im[k + N];
      ch.im[k + N] = cr * c.im[k + N] + si * c.re[k + N];
    }
    var A = synth(ch, xs, sym, p, 0), B = synth(c, xs, sym, p, p.h), D = new Float64Array(xs.length);
    var nd = 0, nb = 0, mb = 0;
    for (var j = 0; j < xs.length; j++) { D[j] = A[j] - B[j]; nd += D[j] * D[j]; nb += B[j] * B[j]; mb = Math.max(mb, Math.abs(B[j])); }
    lineChart($("t-plot"), { xs: xs, series: [
      { y: A, color: COL.blue, name: "P(T<sub>h</sub>f)" },
      { y: B, color: COL.crimson, name: "T<sub>h</sub>(Pf)", dash: true }] });
    lineChart($("t-diff"), { xs: xs, minRange: 0.4 * mb + 1e-9, series: [{ y: D, color: COL.blue, name: "[P, T<sub>h</sub>]f" }] });
    var tp = sname === "xdep" ? "\\sigma(x,\\xi)=\\bigl(1+" + fmt(p.a) + "\\sin 2\\pi x\\bigr)\\langle\\xi\\rangle^{" + fmt(p.m, 1) + "}" : SYM[sname].tex(p);
    tex($("t-tex"), tp);
    var rel = Math.sqrt(nd / Math.max(nb, 1e-300));
    var commute = rel < 1e-9;
    $("t-read").innerHTML = "‖[P, T<sub>h</sub>]f‖ / ‖Pf‖ = <strong>" + sci(rel) + "</strong><br><span class='small'>" +
      (commute
        ? L3("Conmutan, salvo error de redondeo: P es un multiplicador de Fourier.", "They commute up to rounding error: P is a Fourier multiplier.", "Comutam, a menos de erro de arredondamento: P é um multiplicador de Fourier.")
        : L3("No conmutan: el símbolo depende de x, y trasladar cambia dónde actúa la modulación.", "They do not commute: the symbol depends on x, and shifting changes where the modulation acts.", "Não comutam: o símbolo depende de x, e transladar muda onde a modulação atua.")) + "</span>";
  }

  /* ---------------- Herramienta 3: regularidad elíptica ---------------- */
  function fitPower(ks, ys, floor, mask) {
    var n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0, k0 = ks[ks.length - 1], k1 = 0;
    var lo = Math.max(4, Math.floor(ks[ks.length - 1] / 8));
    for (var i = 0; i < ks.length; i++) {
      if (ks[i] < lo || !(ys[i] > floor) || (mask && !mask[i])) continue;
      var x = Math.log(ks[i]), y = Math.log(ys[i]);
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
      k0 = Math.min(k0, ks[i]); k1 = Math.max(k1, ks[i]);
    }
    if (n < 3) return null;
    var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), icpt = (sy - slope * sx) / n;
    return { p: -slope, C: Math.exp(icpt), from: k0, to: k1 };
  }
  function updateE() {
    var fname = $("e-f").value, N = val("e-N"), nu = val("e-nu"), q = val("e-q"), b = val("e-b");
    setOut("e-nu"); setOut("e-q", 1); setOut("e-b"); setOut("e-N", 0);
    var c = coefArr(fname, N), n = 2 * N + 1, off = q * b / 2;
    // ((2π|ξ|)^ν + q) û(ξ) + (qb/2)(û(ξ−1) + û(ξ+1)) = f̂(ξ): sistema tridiagonal (algoritmo de Thomas)
    var d = new Float64Array(n), cp = new Float64Array(n), ur = new Float64Array(n), ui = new Float64Array(n);
    for (var i = 0; i < n; i++) d[i] = Math.pow(TAU * Math.abs(i - N), nu) + q;
    function thomas(rhs, out) {
      var dp = new Float64Array(n);
      cp[0] = off / d[0]; dp[0] = rhs[0] / d[0];
      for (var i = 1; i < n; i++) {
        var den = d[i] - off * cp[i - 1];
        cp[i] = off / den; dp[i] = (rhs[i] - off * dp[i - 1]) / den;
      }
      out[n - 1] = dp[n - 1];
      for (i = n - 2; i >= 0; i--) out[i] = dp[i] - cp[i] * out[i + 1];
    }
    thomas(c.re, ur); thomas(c.im, ui);
    var u = { re: ur, im: ui, N: N };
    var res = 0;
    for (i = 0; i < n; i++) {
      var rr = d[i] * ur[i] + off * ((i > 0 ? ur[i - 1] : 0) + (i < n - 1 ? ur[i + 1] : 0)) - c.re[i];
      var ri = d[i] * ui[i] + off * ((i > 0 ? ui[i - 1] : 0) + (i < n - 1 ? ui[i + 1] : 0)) - c.im[i];
      res += rr * rr + ri * ri;
    }
    res = Math.sqrt(res) / l2(c);

    var xs = grid(600);
    if (fname === "delta") lineChart($("e-plot-f"), { xs: xs, series: [], arrow: 0.5 });
    else lineChart($("e-plot-f"), { xs: xs, series: [{ y: synth(c, xs, null, {}), color: COL.blue, name: "f" }] });
    lineChart($("e-plot-u"), { xs: xs, series: [{ y: synth(u, xs, null, {}), color: COL.crimson, name: "u" }] });

    var ks = []; for (var k = 1; k <= N; k++) ks.push(k);
    var af = absArr(c, 1), au = absArr(u, 1), mx = Math.max.apply(null, af.concat(au)), floor = mx * 1e-12;
    var smooth = fname === "bump";
        // se ajusta |û| sobre las mismas frecuencias donde f̂ ≠ 0 (la onda cuadrada solo tiene ξ impares)
    var mask = af.map(function (v) { return v > floor; });
    var ff = smooth ? null : fitPower(ks, af, floor), fu = smooth ? null : fitPower(ks, au, floor, mask);
    var fits = [];
    if (ff) { ff.label = "f: p ≈ " + fmt(ff.p); fits.push(ff); }
    if (fu) { fu.label = "u: p ≈ " + fmt(fu.p); fits.push(fu); }
    specChart($("e-spec"), { ks: ks, logX: true, fits: fits, series: [
      { y: af, color: COL.blue, name: "|f̂(ξ)|" },
      { y: au, color: COL.crimson, name: "|û(ξ)|" }] });

    tex($("e-tex"), "\\begin{aligned}P&=(-\\Delta)^{" + fmt(nu / 2) + "}+Q(x)\\\\ Q(x)&=" + fmt(q, 1) + "\\bigl(1+" + fmt(b) + "\\cos 2\\pi x\\bigr)\\end{aligned}");

    var out;
    if (smooth) {
      out = L3("Los coeficientes de f decaen más rápido que cualquier potencia de |ξ|: f ∈ C<sup>∞</sup>, y por regularidad elíptica u también.",
        "The coefficients of f decay faster than any power of |ξ|: f ∈ C<sup>∞</sup>, and by elliptic regularity so is u.",
        "Os coeficientes de f decaem mais rápido que qualquer potência de |ξ|: f ∈ C<sup>∞</sup>, e por regularidade elíptica u também.");
    } else if (ff && fu) {
      var sf = ff.p - 0.5, su = fu.p - 0.5;
      out = L3("Un decaimiento |ĝ(ξ)| ≈ C|ξ|<sup>−p</sup> significa que g ∈ H<sup>s</sup> justo cuando s &lt; p − ½. Aquí ",
               "A decay |ĝ(ξ)| ≈ C|ξ|<sup>−p</sup> means g ∈ H<sup>s</sup> exactly when s &lt; p − ½. Here ",
               "Um decaimento |ĝ(ξ)| ≈ C|ξ|<sup>−p</sup> significa que g ∈ H<sup>s</sup> exatamente quando s &lt; p − ½. Aqui ") +
        "f ∈ H<sup>s</sup>, s &lt; <strong>" + minus(fmt(sf)) + "</strong>; u ∈ H<sup>s</sup>, s &lt; <strong>" + minus(fmt(su)) + "</strong>. " +
        L3("La solución gana ", "The solution gains ", "A solução ganha ") + "<strong>" + minus(fmt(su - sf)) + "</strong> " +
        L3("derivadas; la teoría predice ν = ", "derivatives; the theory predicts ν = ", "derivadas; a teoria prevê ν = ") + fmt(nu) + ".";
    } else out = "";
    out += "<br><span class='small'>" + L3("Residuo relativo ‖Pu − f‖ / ‖f‖ = ", "Relative residual ‖Pu − f‖ / ‖f‖ = ", "Resíduo relativo ‖Pu − f‖ / ‖f‖ = ") + sci(res) + "</span>";
    $("e-read").innerHTML = out;
  }

  /* ============================================================
     Pestañas, eventos y arranque
     ============================================================ */
  var TOOLS = { q: { up: updateQ, hash: "cuantizacion" }, t: { up: updateT, hash: "traslaciones" }, e: { up: updateE, hash: "regularidad" } };
  var active = "q", pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; TOOLS[active].up(); });
  }
  function activate(id, focus) {
    active = id;
    Object.keys(TOOLS).forEach(function (k) {
      var tab = $("tab-" + k), on = k === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      $("tool-" + k).hidden = !on;
    });
    if (focus) $("tab-" + id).focus();
    if (location.hash.slice(1) !== TOOLS[id].hash) { try { history.replaceState(null, "", "#" + TOOLS[id].hash); } catch (e) {} }
    TOOLS[id].up();
  }
  var order = ["q", "t", "e"];
  order.forEach(function (k, idx) {
    var tab = $("tab-" + k);
    tab.addEventListener("click", function () { activate(k); });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        activate(order[(idx + (e.key === "ArrowRight" ? 1 : order.length - 1)) % order.length], true);
      }
    });
  });

  function fillAll() {
    fillSelect($("q-f"), ["cos", "mix", "square", "saw", "tri", "bump"]);
    fillSelect($("q-sym"), ["xdep", "bessel", "frac", "trans"]);
    fillSelect($("t-f"), ["bump", "square", "mix", "saw", "tri", "cos"]);
    fillSelect($("t-sym"), ["xdep", "bessel", "frac"]);
    fillSelect($("e-f"), ["square", "saw", "tri", "delta", "bump"]);
  }
  fillAll();

  ["q", "t", "e"].forEach(function (k) {
    $("tool-" + k).querySelectorAll("input, select").forEach(function (el) {
      el.addEventListener("input", schedule);
      el.addEventListener("change", schedule);
    });
  });
  $("q-preset").addEventListener("click", function () {
    $("q-f").value = "cos"; $("q-sym").value = "xdep"; $("q-a").value = 1; $("q-m").value = 1;
    updateQ();
  });
  document.addEventListener("langchange", function () { fillAll(); schedule(); });
  window.addEventListener("resize", schedule);

  function fromHash() {
    var hsh = location.hash.slice(1);
    for (var k in TOOLS) if (TOOLS[k].hash === hsh) return k;
    return "q";
  }
  window.addEventListener("hashchange", function () { var k = fromHash(); if (k !== active) activate(k); });

  // Ejemplo de la tesis como punto de partida
  $("q-f").value = "cos"; $("q-sym").value = "xdep"; $("q-m").value = 1; $("q-a").value = 1;
  activate(fromHash());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
