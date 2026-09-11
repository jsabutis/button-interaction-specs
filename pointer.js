/* Pointer-reactive button specimens.
   Same base button as the CSS set; the difference is that the response depends
   on where the pointer is, how fast it moves, or which edge it crossed, so the
   effect cannot be expressed as a hover state. One window listener feeds every
   specimen; each runs a damped spring so motion settles instead of snapping.
   Reduced motion turns the whole engine off and leaves the plain button. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- spring: critically-ish damped, integrated once per frame ---- */
  function sp() { return { v: 0, t: 0, vel: 0 }; }
  function step(s, k, d) { s.vel += (s.t - s.v) * k; s.vel *= d; s.v += s.vel; return s.v; }
  function snap(x) { x.v = x.t; x.vel = 0; }
  function clamp(n, a, b) { return n < a ? a : n > b ? b : n; }
  function px(n) { return n.toFixed(2) + 'px'; }

  /* ---- SVG border path: four edges, each a quadratic with a movable control ---- */
  var W = 160, H = 48, I = 1;                       /* viewBox and stroke inset */
  function edgePath(o) {
    /* o = [top, right, bottom, left] control offsets, positive = outward */
    var x0 = I, y0 = I, x1 = W - I, y1 = H - I, mx = W / 2, my = H / 2;
    return 'M' + x0 + ' ' + y0 +
      ' Q' + mx + ' ' + (y0 - o[0]) + ' ' + x1 + ' ' + y0 +
      ' Q' + (x1 + o[1]) + ' ' + my + ' ' + x1 + ' ' + y1 +
      ' Q' + mx + ' ' + (y1 + o[2]) + ' ' + x0 + ' ' + y1 +
      ' Q' + (x0 - o[3]) + ' ' + my + ' ' + x0 + ' ' + y0 + 'Z';
  }

  /* corner path: four corner points, each displaced by [dx, dy] */
  function cornerPath(c) {
    return 'M' + (I + c[0][0]) + ' ' + (I + c[0][1]) +
      ' L' + (W - I + c[1][0]) + ' ' + (I + c[1][1]) +
      ' L' + (W - I + c[2][0]) + ' ' + (H - I + c[2][1]) +
      ' L' + (I + c[3][0]) + ' ' + (H - I + c[3][1]) + 'Z';
  }
  /* point on the border where a ray from the centre at angle th lands */
  function rim(th) {
    var c = Math.cos(th), n = Math.sin(th);
    var t = Math.min((W / 2 - I) / Math.max(Math.abs(c), 1e-6), (H / 2 - I) / Math.max(Math.abs(n), 1e-6));
    return [W / 2 + t * c, H / 2 + t * n];
  }
  /* distance along the border, clockwise from the top-left corner, of a rim point */
  function rimPos(p) {
    var x = p[0], y = p[1], w = W - 2 * I, h = H - 2 * I;
    if (y < I + .5) return x - I;
    if (x > W - I - .5) return w + (y - I);
    if (y > H - I - .5) return w + h + (W - I - x);
    return 2 * w + h + (H - I - y);
  }
  var PERIM = 2 * ((W - 2 * I) + (H - 2 * I));
  /* set an angular target on a spring by the shortest way round */
  function aim(spr, th) {
    while (th - spr.v > Math.PI) th -= 2 * Math.PI;
    while (th - spr.v < -Math.PI) th += 2 * Math.PI;
    spr.t = th;
  }

  /* per-letter helpers: letter centres relative to the button, a bell curve
     around the pointer, and a weight setter that rounds to whole units */
  function centres(s) {
    var r = s.el.getBoundingClientRect(); s.cxs = [];
    for (var i = 0; i < s.letters.length; i++) { var b = s.letters[i].getBoundingClientRect(); s.cxs.push(b.left + b.width / 2 - r.left); }
  }
  function bell(d, sig) { return Math.exp(-(d * d) / (2 * sig * sig)); }
  function letters(s) { s.letters = s.el.querySelectorAll('.label i'); s.cxs = null; }
  function seed(arr, v) { for (var i = 0; i < arr.length; i++) { arr[i].v = arr[i].t = v; arr[i].vel = 0; } }

  /* hatching helpers: a dot with a cached radius, a seeded scatter, SVG
     element creation, and the 4x4 Bayer matrix read row by row */
  var PITCH = 12, RAMP = 64, UID = 0, NS = 'http://www.w3.org/2000/svg';
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function mk(parent, tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el); return el;
  }
  function dot(svg, x, y) { return { x: x, y: y, r: 0, soak: 0, el: mk(svg, 'circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 0 }) }; }
  function setR(d, r) { r = Math.max(0, r); if (Math.abs(r - d.r) < .01) return; d.r = r; d.el.setAttribute('r', r.toFixed(2)); }
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

  /* ---- 02-intent helpers ---- */
  /* intent helpers: a short position history for heading estimates, and the
     angle of travel across it. hist holds [x, y, t] triples, newest last. */
  function histPush(s, x, y, t, span) {
    var l = s.hist[s.hist.length - 1];
    if (l && (t - l[2] > 100 || Math.abs(x - l[0]) + Math.abs(y - l[1]) > 120)) s.hist.length = 0;   /* asleep or jumped: start over */
    s.hist.push([x, y, t]);
    while (s.hist.length > 2 && t - s.hist[0][2] > span) s.hist.shift();
  }
  /* heading in radians over the whole history, or null if it barely moved */
  function histHeading(s, min) {
    if (s.hist.length < 2) return null;
    var a = s.hist[0], b = s.hist[s.hist.length - 1], dx = b[0] - a[0], dy = b[1] - a[1];
    return dx * dx + dy * dy < min * min ? null : Math.atan2(dy, dx);
  }

  /* ---- 03-press helpers ---- */
  /* press helpers: a soft clamp that lets a drag run past L only slowly, and
     the release kick shared by the bounce for pointer and keyboard */
  function soft(d, L) { return L * Math.tanh(d / L); }
  function kick(s) { s.a.vel = .012 + .05 * clamp(s.held / 1000, 0, 1); }

  /* ---- 04-keyboard helpers ---- */
  /* keyboard focus only: true while the button is focused and the focus ring
     would show, so a mouse click that lands focus does not run the effect */
  function kbf(s) { return s.focused && s.el.matches(':focus-visible'); }

  /* ---- 05-shape helpers ---- */
  /* shape morph: the outline is rebuilt per frame from the rest rectangle.
     Sides are numbered clockwise from the top (0 top, 1 right, 2 bottom,
     3 left); u runs along a side in its clockwise direction and o is the
     outward distance, negative into the box. At rest every builder returns
     the same string as the markup: 'M1 1 L159 1 L159 47 L1 47Z'. */
  var SLEN = [W - 2 * I, H - 2 * I, W - 2 * I, H - 2 * I];
  var SIDE = { top: 0, right: 1, bottom: 2, left: 3 };
  var CX = [I, W - I, W - I, I], CY = [I, I, H - I, H - I];
  function num(v) { return String(Math.round(v * 100) / 100); }
  function pt(p) { return num(p[0]) + ' ' + num(p[1]); }
  function sidePt(k, u, o) {
    if (k === 0) return [I + u, I - o];
    if (k === 1) return [W - I + o, I + u];
    if (k === 2) return [W - I - u, H - I + o];
    return [I - o, H - I - u];
  }
  /* along-side coordinate of a point (x, y) projected onto side k */
  function along(k, x, y) { return k === 0 ? x - I : k === 1 ? y - I : k === 2 ? W - I - x : H - I - y; }
  /* which side a rim point sits on */
  function sideOf(p) { return p[1] <= I + .5 ? 0 : p[0] >= W - I - .5 ? 1 : p[1] >= H - I - .5 ? 2 : 3; }
  /* the rectangle with an optional path fragment inserted along each side */
  function outline(ins) {
    return 'M1 1' + ins[0] + ' L159 1' + ins[1] + ' L159 47' + ins[2] + ' L1 47' + ins[3] + 'Z';
  }
  /* a closed polygon */
  function poly(p) {
    var d = '';
    for (var i = 0; i < p.length; i++) d += (i ? ' L' : 'M') + pt(p[i]);
    return d + 'Z';
  }
  /* each corner cut back by c[k] along both of its edges, as a straight
     chamfer or, with round set, a quarter arc of radius c[k] */
  function cutPath(c, round) {
    var d = '';
    for (var k = 0; k < 4; k++) {
      var v = c[k] > .05 ? c[k] : 0, x = CX[k], y = CY[k];
      if (!v) { d += (k ? ' L' : 'M') + x + ' ' + y; continue; }
      var ix = (k === 0 || k === 3) ? 1 : -1, iy = k < 2 ? 1 : -1;      /* into the box */
      var a = k % 2 ? [x + ix * v, y] : [x, y + iy * v];                 /* arrive, clockwise */
      var b = k % 2 ? [x, y + iy * v] : [x + ix * v, y];                 /* leave */
      d += (k ? ' L' : 'M') + pt(a) + (round ? ' A' + num(v) + ' ' + num(v) + ' 0 0 1 ' : ' L') + pt(b);
    }
    return d + 'Z';
  }
  /* proximity of the nearest corner: sets one spring target per corner (only
     the nearest is non-zero, eased so it grows early) and returns the values */
  function cornerCut(s, amp) {
    var mi = -1, m = 0, c = [];
    if (s.near) for (var i = 0; i < 4; i++) {
      var ax = s.lxr - CX[i], ay = s.lyr - CY[i], w = 1 - Math.sqrt(ax * ax + ay * ay) / 100;
      if (w > m) { m = w; mi = i; }
    }
    for (var j = 0; j < 4; j++) { s.m[j].t = j === mi ? m * (2 - m) * amp : 0; c.push(Math.max(0, step(s.m[j], .18, .70))); }
    return c;
  }

  /* ---- 06-physics helpers ---- */
  /* physics helpers. calm() lands a spring exactly on its target once it is
     within eps, so a settled value is written in its rest form and never as
     a rounding remainder. The jelly outline is twelve points on the border
     rectangle, clockwise from the top-left corner: three between each pair
     of top and bottom corners, one in the middle of each side. */
  function calm(spr, eps) {
    if (Math.abs(spr.v - spr.t) < eps && Math.abs(spr.vel) < eps) { spr.v = spr.t; spr.vel = 0; return true; }
    return false;
  }
  var JN = 12;
  function jellyRest() {
    var p = [], x0 = I, x1 = W - I, y0 = I, y1 = H - I, i;
    for (i = 0; i < 4; i++) p.push([x0 + (x1 - x0) * i / 4, y0]);
    p.push([x1, y0]); p.push([x1, H / 2]);
    for (i = 0; i < 4; i++) p.push([x1 - (x1 - x0) * i / 4, y1]);
    p.push([x0, y1]); p.push([x0, H / 2]);
    return p;
  }
  function jellyPath(x) {
    var d = '';
    for (var i = 0; i < JN; i++) d += (i ? 'L' : 'M') + x[2 * i].v.toFixed(2) + ' ' + x[2 * i + 1].v.toFixed(2);
    return d + 'Z';
  }

  /* ---- 08-cursor helpers ---- */
  /* cursor helpers: the drawn cursor lives only while the pointer is over the
     card's stage. Stage enter shows it under the pointer in the same frame and
     stage leave hides it at once, so there is never a frame with no cursor. */
  function stageWatch(s, onEnter) {
    var st = s.el.parentElement, cur = s.q('.cur');
    st.addEventListener('pointerenter', function (e) {
      var r = s.el.getBoundingClientRect();
      s.lxr = e.clientX - r.left; s.lyr = e.clientY - r.top; s.on = 1;
      if (onEnter) onEnter(s);
      s.def.frame(s);
    });
    st.addEventListener('pointerleave', function () { s.on = 0; cur.style.visibility = 'hidden'; });
  }
  function curXY(cur, x, y) { cur.style.transform = 'translate(' + px(x) + ',' + px(y) + ')'; cur.style.visibility = 'visible'; }

  /* ---- 11-filters helpers ---- */
  /* filter helpers: an attribute value that is exactly '0' at rest, and a
     discrete alpha table of k zeros then ones, so the cut is binary */
  function filtNum(v) { return v ? v.toFixed(2) : '0'; }
  function filtCut(k) { var t = []; for (var i = 0; i < 64; i++) t.push(i < k ? 0 : 1); return t.join(' '); }

  /* ---- 13-after helpers ---- */
  /* after the press: states start on a completed click (up or keyup) and time
     themselves from s.t0; a drag off the button is not a click. creep() is a
     progress curve that stalls the way real progress does; ease() is smoothstep */
  function afterStart(s) { if (!s.t0) s.t0 = performance.now(); }
  function afterAgain(s) { s.t0 = performance.now(); }
  function afterNothing() {}
  function afterToggle(s) { if (s.t0) { s.t0 = 0; s.q('.ink').style.transform = ''; } else s.t0 = performance.now(); }
  var CREEP = [[0, 0], [.22, .48], [.6, .68], [.86, .78], [1, 1]];
  function creep(u) {
    for (var i = 1; i < CREEP.length; i++) if (u <= CREEP[i][0]) {
      var a = CREEP[i - 1], b = CREEP[i];
      return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]);
    }
    return 1;
  }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  /* the check path runs along the bottom and left border first (coincident with
     the rule, so unseen), then across to the check. The dash is exactly the
     check's length and slides from the border into place */
  var CHK_PTS = [[40, 47], [1, 47], [1, 24], [69, 24], [76, 31], [91, 16]];
  var CHK_PATH = CHK_PTS.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
  function seglen(a, b) { return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])); }
  var CHK_L = 0, CHK_D = seglen(CHK_PTS[3], CHK_PTS[4]) + seglen(CHK_PTS[4], CHK_PTS[5]);
  for (var ci = 1; ci < CHK_PTS.length; ci++) CHK_L += seglen(CHK_PTS[ci - 1], CHK_PTS[ci]);

  /* ---- 20-label helpers ---- */
  /* label content helpers. The word may change but the box may not: each
     letter remembers its source text and is fixed at its measured rest width
     once fonts are ready, glyphs centred in it (see pointer.css). With lower
     set, the lowercase advance of each letter is measured too, so Case morph
     can re-pack the word at natural spacing inside the fixed box. rest()
     puts every letter back to its source text with no inline colour, caret
     or case override; it only touches what differs. */
  var POOL = 'ABCDEFGHKLNOPRSTUVXYZ', ALT = 'BOUTON';
  function keepBox(s, lower) {
    letters(s); s.src = []; s.was = 0; s.t0 = 0; s.tx = 0; s.salt = 0;
    s.until = 1;   /* read every sample from the start, so the first entry edge is the real one */
    for (var i = 0; i < s.letters.length; i++) s.src.push(s.letters[i].textContent);
    document.fonts.ready.then(function () {
      var i, L, wu = [], wl = [];
      if (lower) {
        for (i = 0; i < s.letters.length; i++) { L = s.letters[i]; L.style.textTransform = 'none'; wl.push(L.getBoundingClientRect().width); L.style.textTransform = ''; }
      }
      for (i = 0; i < s.letters.length; i++) wu.push(s.letters[i].getBoundingClientRect().width);
      for (i = 0; i < s.letters.length; i++) s.letters[i].style.width = px(wu[i]);
      s.wu = wu; if (lower) s.wl = wl;
    });
  }
  function rest(s) {
    for (var i = 0; i < s.letters.length; i++) {
      var L = s.letters[i];
      if (L.textContent !== s.src[i]) L.textContent = s.src[i];
      if (L.style.color) L.style.color = '';
      if (L.style.boxShadow) L.style.boxShadow = '';
      if (L.style.textTransform) L.style.textTransform = '';
    }
  }
  /* entry and exit stamps taken in the frame loop: t0 is the frame the
     pointer was first seen inside, tx the frame it was first seen outside */
  function stamp(s) {
    if (s.inside && !s.was) { s.was = 1; s.t0 = s.now; s.ox = s.ex; s.salt++; }
    if (!s.inside && s.was) { s.was = 0; s.tx = s.now; s.xx = s.lx; }
  }
  /* letter index order starting from a side: 'right' counts down */
  function fromSide(side) { return side === 'right' ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5]; }
  /* which half a crossing belongs to: left and right edges answer for
     themselves, a top or bottom crossing answers with the half it came
     through, so every entry side has a direction and none is inert */
  function halfOf(s, side, x) {
    if (side === 'left' || side === 'right') return side;
    return (s.r && x > s.r.width / 2) ? 'right' : 'left';
  }
  /* re-pack the letters at their current advances, centred in the fixed
     label box: each glyph slides on a spring from its box centre to where
     it would sit if the word were laid out naturally */
  function pack(s) {
    if (!s.wu || !s.wl) return;
    var i, cur = [], total = 0, box = 0;
    for (i = 0; i < 6; i++) { cur[i] = s.letters[i].style.textTransform === 'none' ? s.wl[i] : s.wu[i]; total += cur[i]; box += s.wu[i]; }
    var pos = (box - total) / 2, bpos = 0;
    for (i = 0; i < 6; i++) {
      s.m[i].t = (pos + cur[i] / 2) - (bpos + s.wu[i] / 2); pos += cur[i]; bpos += s.wu[i];
      var v = step(s.m[i], .25, .65), L = s.letters[i];
      L.style.transform = Math.abs(v) < .01 ? '' : 'translateX(' + px(v) + ')';
    }
  }

  /* ---- 05-shape press helper ---- */
  /* the pressed form of cornerCut: the same four corner springs, but the
     target is a flat amount rather than the proximity easing, and with all
     set every corner takes it instead of only the nearest one. */
  function cornerHold(s, amp, all) {
    var mi = 0, m = -1e9, c = [], i, j, ax, ay, w;
    for (i = 0; i < 4; i++) {
      ax = s.lxr - CX[i]; ay = s.lyr - CY[i]; w = 1 - Math.sqrt(ax * ax + ay * ay) / 100;
      if (w > m) { m = w; mi = i; }
    }
    for (j = 0; j < 4; j++) { s.m[j].t = (all || j === mi) ? amp : 0; c.push(Math.max(0, step(s.m[j], .18, .70))); }
    return c;
  }

  /* ---- effects. s carries the shared pointer state; see read() below ---- */
  /* ---- 01-pointer press helpers: the point a press happened at, so a press
     state can pin itself there while the pointer keeps moving. A keyboard
     press has no point, so it falls back to the centre of the button. ---- */
  function ppt(s) { s.pxp = s.inside ? s.lx : W / 2; s.pyp = s.inside ? s.ly : H / 2; }

  var PFX = {

    /* 37 Magnet: the button drifts toward the pointer, up to 14px, and springs
       back. Reach extends past the edge so the pull starts before hover.
       Press: the pull completes, the plate centre lands under the pointer. */
    magnet: { reach: 90, frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = clamp(s.dx * (d ? 1 : 0.3), d ? -26 : -14, d ? 26 : 14) * s.near;
      s.b.t = clamp(s.dy * (d ? 1 : 0.3), d ? -15 : -10, d ? 15 : 10) * s.near;
      s.el.style.transform = 'translate(' + px(step(s.a, .16, .74)) + ',' + px(step(s.b, .16, .74)) + ')';
    } },

    /* 38 Label magnet: the frame is fixed, the label alone leans.
       Press: the lean carries on past the pointer to the near edge. */
    maglabel: { reach: 70, frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = clamp(s.dx * (d ? 1.6 : 0.16), d ? -26 : -12, d ? 26 : 12) * s.near;
      s.b.t = clamp(s.dy * (d ? 1.6 : 0.16), d ? -11 : -7, d ? 11 : 7) * s.near;
      s.q('.label').style.transform = 'translate(' + px(step(s.a, .14, .76)) + ',' + px(step(s.b, .14, .76)) + ')';
    } },

    /* 39 Ink bleed: the fill grows as a disc from the exact point of entry, so
       two approaches to the same button never fill the same way.
       Press: the fill drains back to a disc on the entry point it grew from. */
    bleed: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = d ? 30 : s.inside ? 190 : 0;
      var r = step(s.a, .085, d ? .62 : .72);
      s.q('.ink').style.clipPath = 'circle(' + Math.max(0, r).toFixed(1) + 'px at ' + px(s.ex) + ' ' + px(s.ey) + ')';
    } },

    /* 40 Follow disc: a black disc tracks the pointer inside the button.
       Press: the disc pins where it was pressed and draws in to a bead. */
    disc: { frame: function (s) {
      var d = s.down || s.kdown;
      if (!d) { s.a.t = s.lx; s.b.t = s.ly; }
      s.c.t = d ? 0.42 : s.inside ? 1 : 0;
      var d = s.q('.ink');
      d.style.transform = 'translate(' + px(step(s.a, .30, .60) - 34) + ',' + px(step(s.b, .30, .60) - 34) + ') scale(' + step(s.c, .18, .70).toFixed(3) + ')';
    }, init: function (s) { s.a.v = s.a.t = W / 2; s.b.v = s.b.t = H / 2; },
      keydown: function (s) { if (!s.inside) { s.a.t = W / 2; s.b.t = H / 2; } } },

    /* 41 Direction fill: the fill enters from the edge the pointer crossed.
       Press: the fill backs part way out of the edge it came in by. */
    dirfill: { frame: function (s) {
      s.a.t = (s.down || s.kdown) ? 0.62 : s.inside ? 0 : 1;
      var v = step(s.a, .16, .70), e = s.entry;
      var x = e === 'left' ? -v : e === 'right' ? v : 0;
      var y = e === 'top' ? -v : e === 'bottom' ? v : 0;
      s.q('.ink').style.transform = 'translate(' + (x * 101) + '%,' + (y * 101) + '%)';
    } },

    /* 42 Direction out: the fill enters from the crossed edge and leaves by the
       edge the pointer left through, so it reads as one continuous pass.
       Press: the pass starts early, half out by the far edge, and waits. */
    dirout: { frame: function (s) {
      var d = s.down || s.kdown, opp = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
      s.a.t = d ? 0.55 : s.inside ? 0 : 1;
      var v = step(s.a, .16, .70), e = d ? opp[s.entry] : s.inside ? s.entry : s.exit;
      var x = e === 'left' ? -v : e === 'right' ? v : 0;
      var y = e === 'top' ? -v : e === 'bottom' ? v : 0;
      s.q('.ink').style.transform = 'translate(' + (x * 101) + '%,' + (y * 101) + '%)';
    } },

    /* 43 Pointer tilt: a real 3D tilt that tracks the pointer, not a fixed one.
       Press: the same tilt driven near twice as far, as if leaned on. */
    ptilt: { frame: function (s) {
      var d = s.down || s.kdown, g = d ? 1.9 : 1;
      s.a.t = s.inside ? -s.ny * 11 * g : 0;
      s.b.t = s.inside ? s.nx * 15 * g : 0;
      s.el.style.transform = 'perspective(420px) rotateX(' + step(s.a, .20, .68).toFixed(2) + 'deg) rotateY(' + step(s.b, .20, .68).toFixed(2) + 'deg)';
    } },

    /* 44 Wobble tilt: the same tracking with a looser spring, so the plate
       overshoots and rocks once before it settles under the pointer.
       Press: the rocking is caught and the plate holds dead level. */
    wobble: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = s.inside && !d ? -s.ny * 13 : 0;
      s.b.t = s.inside && !d ? s.nx * 18 : 0;
      s.el.style.transform = 'perspective(420px) rotateX(' + step(s.a, d ? .22 : .10, d ? .68 : .875).toFixed(2) + 'deg) rotateY(' + step(s.b, d ? .22 : .10, d ? .68 : .875).toFixed(2) + 'deg)';
    } },

    /* 45 Squash: the button stretches along the direction of travel and thins
       across it, by pointer speed. Move slowly and nothing happens.
       Press: the same stretch with the sign flipped, short along travel. */
    squash: { frame: function (s) {
      var d = s.down || s.kdown;
      var sp2 = Math.min(Math.sqrt(s.vx * s.vx + s.vy * s.vy) / 22, 1);
      s.a.t = d ? -0.11 : s.inside ? sp2 * 0.26 : 0;
      if (s.inside && sp2 > 0.06) s.ang = Math.atan2(s.vy, s.vx) * 180 / Math.PI;
      var k = step(s.a, .22, .66);
      s.el.style.transform = 'rotate(' + s.ang.toFixed(1) + 'deg) scale(' + (1 + k).toFixed(3) + ',' + (1 - k * 0.62).toFixed(3) + ') rotate(' + (-s.ang).toFixed(1) + 'deg)';
    } },

    /* 46 Label lag: the label is dragged along behind the pointer and catches up
       when it stops, like something heavy on a short tether.
       Press: the tether goes taut and the label catches up all the way. */
    lag: { frame: function (s) {
      var d = s.down || s.kdown, g = d ? 1 : 0.5;
      s.a.t = s.inside ? clamp(s.lx - W / 2, -30, 30) * g : 0;
      s.b.t = s.inside ? clamp(s.ly - H / 2, -14, 14) * g : 0;
      s.q('.label').style.transform = 'translate(' + px(step(s.a, .055, .84)) + ',' + px(step(s.b, .055, .84)) + ')';
    } },

    /* 47 Edge bulge: the border edge nearest the pointer bows away from it, as
       if the rule were elastic and the pointer were pressing on it.
       Press: the same bow driven deeper and over a wider span of the edge. */
    bulge: { svg: 1, frame: function (s) {
      var t = [0, 0, 0, 0], dn = s.down || s.kdown;
      if (s.inside || dn) {
        var d = [s.ly, W - s.lx, H - s.ly, s.lx];          /* distance to each edge */
        var m = 0, mi = 0, fall = dn ? 70 : 26, amp = dn ? 26 : 16;
        for (var i = 0; i < 4; i++) { var w = Math.max(0, 1 - d[i] / fall); if (w > m) { m = w; mi = i; } }
        t[mi] = m * amp;                                     /* positive = away from the pointer */
      }
      for (var j = 0; j < 4; j++) { s.o[j].t = t[j]; step(s.o[j], .22, .66); }
      s.q('path').setAttribute('d', edgePath([s.o[0].v, s.o[1].v, s.o[2].v, s.o[3].v]));
    } },

    /* 48 Elastic frame: every edge is slack; all four lean toward the pointer at
       once, weighted by distance, so the whole outline leans with it.
       Press: the lean keeps its bias and every edge gathers inward. */
    cloth: { svg: 1, frame: function (s) {
      var t = [0, 0, 0, 0];
      if (s.inside) {
        var cx = [W / 2, W - I, W / 2, I], cy = [I, H / 2, H - I, H / 2];
        var nrm = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (var i = 0; i < 4; i++) {
          var ax = s.lx - cx[i], ay = s.ly - cy[i];
          var dist = Math.sqrt(ax * ax + ay * ay);
          t[i] = (ax * nrm[i][0] + ay * nrm[i][1]) / Math.max(dist, 1) * Math.max(0, 1 - dist / 90) * 13;
        }
      }
      if (s.down || s.kdown) for (var n = 0; n < 4; n++) t[n] = t[n] * 0.4 - 11;   /* press gathers every edge inward */
      for (var j = 0; j < 4; j++) { s.o[j].t = t[j]; step(s.o[j], .12, .78); }
      s.q('path').setAttribute('d', edgePath([s.o[0].v, s.o[1].v, s.o[2].v, s.o[3].v]));
    } },

    /* 49 Speed tracking: letter-spacing opens with pointer speed and closes
       again the moment the pointer rests.
       Press: the same track run below base, the letters packed tight. */
    speed: { frame: function (s) {
      var v = Math.min(Math.sqrt(s.vx * s.vx + s.vy * s.vy) / 30, 1);
      s.a.t = (s.down || s.kdown) ? 0 : s.inside ? 0.08 + v * 0.26 : 0.08;
      s.q('.label').style.letterSpacing = step(s.a, .14, .74).toFixed(3) + 'em';
    }, init: function (s) { s.a.v = s.a.t = 0.08; } },

    /* 50 Press ripple: the ring starts at the point pressed, not at the centre,
       and always runs its expansion out rather than retracting on release. */
    ripple: { frame: function (s) {
      var r = s.q('.ink');
      if (s.rip >= 1) { r.style.visibility = 'hidden'; return; }
      s.rip = Math.min(1, s.rip + 0.038);
      var e = 1 - Math.pow(1 - s.rip, 3);                 /* ease out, one pass */
      r.style.visibility = 'visible';
      r.style.left = px(s.px_); r.style.top = px(s.py_);
      r.style.transform = 'translate(-50%,-50%) scale(' + (e * 2.4).toFixed(3) + ')';
    }, down: function (s) { s.rip = 0; s.px_ = s.lx; s.py_ = s.ly; } },

    /* 51 Proximity wake: the rule thickens as the pointer approaches, before
       any hover has happened, and thins again as it leaves. */
    awake: { reach: 150, frame: function (s) {
      s.a.t = s.near;
      var v = step(s.a, .16, .74);
      s.el.style.setProperty('--near', v.toFixed(3));
    } },

    /* 52 Cast shadow: the pointer is the light; a hard shadow falls on the far
       side and shortens as the pointer comes closer.
       Press: the light crosses over and the shadow swings to the near side. */
    cast: { reach: 170, frame: function (s) {
      var d = Math.max(Math.sqrt(s.dx * s.dx + s.dy * s.dy), 1), g = (s.down || s.kdown) ? 1 : -1;
      s.a.t = g * s.dx / d * 12 * s.near;
      s.b.t = g * s.dy / d * 12 * s.near;
      s.el.style.boxShadow = px(step(s.a, .18, .72)) + ' ' + px(step(s.b, .18, .72)) + ' 0 0 #000';
    } },

    /* 53 Label repel: the frame stays, the label shies away from the pointer.
       Press: the shy goes the whole way, the label jammed to the far edge. */
    repel: { reach: 60, frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = -clamp(s.dx * (d ? 0.9 : 0.18), d ? -28 : -14, d ? 28 : 14) * s.near;
      s.b.t = -clamp(s.dy * (d ? 0.9 : 0.18), d ? -13 : -8, d ? 13 : 8) * s.near;
      s.q('.label').style.transform = 'translate(' + px(step(s.a, .14, .76)) + ',' + px(step(s.b, .14, .76)) + ')';
    } },

    /* 54 Lean: a 2D skew toward the pointer, the top edge leading.
       Press: the same skew on the other sign, the top edge falling back. */
    lean: { frame: function (s) {
      var d = s.down || s.kdown, sg = s.nx >= 0 ? 1 : -1;
      s.a.t = d ? sg * Math.max(Math.abs(s.nx) * 14, 6) : s.inside ? -s.nx * 12 : 0;
      s.el.style.transform = 'skewX(' + step(s.a, .16, .72).toFixed(2) + 'deg)';
    } },

    /* 55 Sway: rotates against the direction of travel, like a body leaning
       into a turn, and rights itself when the pointer stops.
       Press: the lean of the turn is held at full instead of righting. */
    sway: { frame: function (s) {
      if (s.inside && Math.abs(s.vx) > 1.2) s.sgn = s.vx > 0 ? 1 : -1;
      s.a.t = (s.down || s.kdown) ? -6 * (s.sgn || 1) : s.inside ? clamp(-s.vx * 0.45, -8, 8) : 0;
      s.el.style.transform = 'rotate(' + step(s.a, .12, .80).toFixed(2) + 'deg)';
    } },

    /* 56 Slinky: each letter follows the pointer on a looser spring than the
       one before it, so the word stretches out under motion and regathers. */
    slinky: { frame: function (s) {
      var d = s.down || s.kdown, n = s.letters.length;
      var t = (s.inside || d) ? clamp((s.lx - W / 2) * 0.3, -18, 18) : 0;
      for (var i = 0; i < n; i++) {
        s.m[i].t = !d ? t : s.inside ? clamp(t * (0.2 + i * 0.5), -30, 30)   /* held: the looseness is held open */
          : (i - (n - 1) / 2) * 5;                       /* a keyboard press fans the word about its middle */
        s.letters[i].style.transform = 'translateX(' + px(step(s.m[i], .30 - i * .04, .70)) + ')';
      }
    }, init: function (s) { s.letters = s.el.querySelectorAll('.label i'); } },

    /* 57 Dimple: the button shrinks a little, pivoting on the pointer itself. */
    dimple: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = d ? 0.90 : s.inside ? 0.95 : 1;
      s.b.t = d ? s.pxp : s.lx; s.c.t = d ? s.pyp : s.ly;
      s.el.style.transformOrigin = px(step(s.b, .25, .65)) + ' ' + px(step(s.c, .25, .65));
      s.el.style.transform = 'scale(' + step(s.a, .18, .70).toFixed(4) + ')';
    }, init: function (s) { s.a.v = s.a.t = 1; s.b.v = W / 2; s.c.v = H / 2; }, down: ppt, keydown: ppt },

    /* 58 Fill to pointer: the fill comes in from the entry edge and stops at
       the pointer, so it tracks back and forth as the pointer does. */
    reach: { frame: function (s) {
      var e = s.entry, ink = s.q('.ink');
      var horiz = e === 'left' || e === 'right';
      var d = s.down || s.kdown;
      s.a.t = d ? (e === 'left' ? W : e === 'right' ? 0 : e === 'top' ? H : 0)   /* held: the fill runs on to the far edge */
        : s.inside ? (horiz ? s.lx : s.ly) : (e === 'left' ? 0 : e === 'right' ? W : e === 'top' ? 0 : H);
      var f = step(s.a, .20, .68);
      ink.style.clipPath = e === 'left' ? 'inset(0 ' + px(W - f) + ' 0 0)' : e === 'right' ? 'inset(0 0 0 ' + px(f) + ')' :
        e === 'top' ? 'inset(0 0 ' + px(H - f) + ' 0)' : 'inset(' + px(f) + ' 0 0 0)';
    }, enter: function (s) { s.a.v = s.entry === 'right' ? W : s.entry === 'bottom' ? H : 0; s.a.vel = 0; } },

    /* 59 Angle wipe: a straight edge sweeps across along the true angle of
       entry, not the nearest of four sides, and leaves along the exit angle. */
    angle: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = d ? -260 : s.inside ? 0 : 260;             /* held: the edge carries on out the far side */
      var th = (s.inside || d) ? s.eth : s.xth;
      s.q('.ink').style.transform = 'translate(-50%,-50%) rotate(' + (th * 180 / Math.PI).toFixed(1) + 'deg) translateX(' + px(step(s.a, .14, .72)) + ')';
    }, init: function (s) { s.a.v = s.a.t = 260; }, enter: function (s) { s.a.v = 260; s.a.vel = 0; } },

    /* 60 Momentum: the same edge fill as 41, but it fills at the speed the
       pointer arrived. Enter slowly and it creeps; flick in and it slams. */
    momentum: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = (s.inside && !d) ? 0 : 1;                  /* held: it leaves the way it came */
      var k = (s.inside || d) ? 0.05 + Math.min(s.espd / 30, 1) * 0.25 : 0.16;
      var v = step(s.a, k, .70), e = s.entry;
      var x = e === 'left' ? -v : e === 'right' ? v : 0;
      var y = e === 'top' ? -v : e === 'bottom' ? v : 0;
      s.q('.ink').style.transform = 'translate(' + (x * 101) + '%,' + (y * 101) + '%)';
    }, init: function (s) { s.a.v = s.a.t = 1; } },

    /* 61 Pinhole: the button goes black and a white hole rides under the
       pointer; on exit the hole swallows the black. */
    pinhole: { frame: function (s) {
      var ink = s.q('.ink'), hole = s.q('.hole');
      var d = s.down || s.kdown;
      if ((s.inside || d) && !s.pin) { s.pin = 1; s.a.v = 0; s.a.vel = 0; }
      s.a.t = d ? 7 : s.inside ? 22 : 220;               /* held: the hole closes to a pinprick */
      s.b.t = d ? s.pxp : s.lx; s.c.t = d ? s.pyp : s.ly;
      var r = step(s.a, .14, .72);
      if (!s.inside && !d && r > 200) { s.pin = 0; ink.style.visibility = 'hidden'; hole.style.transform = 'scale(0)'; return; }
      ink.style.visibility = 'visible';
      hole.style.transform = 'translate(' + px(step(s.b, .30, .60) - 22) + ',' + px(step(s.c, .30, .60) - 22) + ') scale(' + (r / 22).toFixed(3) + ')';
    }, down: ppt, keydown: ppt },

    /* 62 Reticle: a hollow ring rides under the pointer. */
    reticle: { frame: function (s) {
      var d = s.down || s.kdown, ink = s.q('.ink');
      s.a.t = d ? s.pxp : s.lx; s.b.t = d ? s.pyp : s.ly; s.c.t = (s.inside || d) ? 1 : 0;
      s.x[0].t = d ? 1 : 0;                              /* held: the ring fills in from its own edge */
      var f = Math.max(0, step(s.x[0], .16, .70)) * 17;
      ink.style.boxShadow = f > .05 ? 'inset 0 0 0 ' + px(f) + ' #000' : '';
      ink.style.transform = 'translate(' + px(step(s.a, .30, .60) - 18) + ',' + px(step(s.b, .30, .60) - 18) + ') scale(' + step(s.c, .18, .70).toFixed(3) + ')';
    }, init: function (s) { s.x.push(sp()); }, down: ppt, keydown: ppt },

    /* 63 Crosshair: a rule through the pointer on each axis, growing out from
       the pointer itself. */
    xhair: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = d ? s.pxp : s.lx; s.b.t = d ? s.pyp : s.ly; s.c.t = (s.inside || d) ? 1 : 0;
      s.x[0].t = d ? 1 : 0;                              /* held: the arms run back into the press point */
      var x = step(s.a, .30, .60), y = step(s.b, .30, .60), g = step(s.c, .16, .72);
      var k = g * (1 - 0.85 * clamp(step(s.x[0], .16, .70), 0, 1));
      var hx = s.q('.hx'), vy = s.q('.vy');
      hx.style.transformOrigin = px(x) + ' 50%'; hx.style.transform = 'translateY(' + px(y - 1) + ') scaleX(' + k.toFixed(3) + ')';
      vy.style.transformOrigin = '50% ' + px(y); vy.style.transform = 'translateX(' + px(x - 1) + ') scaleY(' + k.toFixed(3) + ')';
    }, init: function (s) { s.x.push(sp()); }, down: ppt, keydown: ppt },

    /* 64 Scanner bar: a full-height bar tracks the pointer sideways. */
    scan: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = d ? s.pxp : s.lx; s.c.t = (s.inside || d) ? 1 : 0;
      s.x[0].t = d ? 1 : 0;                              /* held: the bar covers everything it was sampling */
      var w = 1 + 15 * Math.max(0, step(s.x[0], .16, .62));
      s.q('.ink').style.transform = 'translateX(' + px(step(s.a, .24, .64) - 10) + ') scaleY(' + step(s.c, .18, .70).toFixed(3) + ') scaleX(' + w.toFixed(3) + ')';
    }, init: function (s) { s.x.push(sp()); }, down: ppt, keydown: ppt },

    /* 65 Comet: four discs follow the pointer on progressively looser
       springs, so a fast pointer draws a tail and a still one a single dot. */
    comet: { frame: function (s) {
      var d = s.down || s.kdown;
      s.c.t = (s.inside || d) ? 1 : 0;
      s.x[0].t = d ? 1 : 0;                              /* held: the tail motion drew is laid out and kept */
      var g = step(s.c, .18, .70), K = [.34, .22, .14, .09], R = [20, 14, 9, 5];
      var tl = Math.max(0, step(s.x[0], .12, .70)) * 14, ax = Math.cos(s.eth) * tl, ay = Math.sin(s.eth) * tl;
      for (var i = 0; i < 4; i++) {
        s.m[i].t = (d ? s.pxp : s.lx) + ax * i; s.m[i + 4].t = (d ? s.pyp : s.ly) + ay * i;
        s.dots[i].style.transform = 'translate(' + px(step(s.m[i], K[i], .64) - R[i]) + ',' + px(step(s.m[i + 4], K[i], .64) - R[i]) + ') scale(' + g.toFixed(3) + ')';
      }
    }, init: function (s) { s.dots = s.el.querySelectorAll('.dot'); s.x.push(sp()); }, down: ppt, keydown: ppt },

    /* 66 Dwell bloom: a disc under the pointer grows while the pointer rests
       and shrinks while it moves, so the fill is a measure of hesitation. */
    dwell: { frame: function (s) {
      var d = s.down || s.kdown;
      if (!d) { if (s.inside) s.dw = clamp(s.dw + (s.spd < 1.5 ? 2.4 : -5), 0, 150); else s.dw = 0; }
      s.a.t = d ? 26 : s.dw;                             /* held: the hesitation collapses onto the point decided on */
      s.b.t = d ? s.pxp : s.lx; s.c.t = d ? s.pyp : s.ly;
      s.q('.ink').style.clipPath = 'circle(' + Math.max(0, step(s.a, .10, .74)).toFixed(1) + 'px at ' + px(step(s.b, .25, .65)) + ' ' + px(step(s.c, .25, .65)) + ')';
    }, init: function (s) { s.dw = 0; }, down: ppt, keydown: ppt },

    /* 67 Corner pull: the corner nearest the pointer reaches toward it, from
       outside as the pointer approaches and from inside once it is over. */
    cpull: { reach: 60, svg: 'corner', frame: function (s) {
      var cx = [I, W - I, W - I, I], cy = [I, I, H - I, H - I], c = [];
      var hd = s.down || s.kdown, tx = hd ? s.pxp : s.lxr, ty = hd ? s.pyp : s.lyr;
      for (var i = 0; i < 4; i++) {
        var ax = tx - cx[i], ay = ty - cy[i], d = Math.sqrt(ax * ax + ay * ay);
        var w = hd ? Math.min(d * 0.45, 18) : s.near ? Math.max(0, 1 - d / 80) * 18 : 0;   /* held: every corner comes, not just the near one */
        s.m[i].t = d ? ax / d * w : 0; s.m[i + 4].t = d ? ay / d * w : 0;
        c.push([step(s.m[i], .16, .72), step(s.m[i + 4], .16, .72)]);
      }
      s.q('path').setAttribute('d', cornerPath(c));
    }, down: ppt, keydown: ppt },

    /* 68 Push in: approach from outside and the edge you are nearing dents
       inward under the pressure; cross it and the dent releases. */
    push: { reach: 70, svg: 1, frame: function (s) {
      var t = [0, 0, 0, 0], i;
      if (s.down || s.kdown) {                           /* held: the dent comes back, deeper, from the inside */
        var ds = [s.pyp, W - s.pxp, H - s.pyp, s.pxp], mi = 0;
        for (i = 1; i < 4; i++) if (ds[i] < ds[mi]) mi = i;
        t[mi] = -18;
      } else if (!s.inside && s.near) {
        i = s.oside === 'top' ? 0 : s.oside === 'right' ? 1 : s.oside === 'bottom' ? 2 : 3;
        t[i] = -s.near * 12;
      }
      for (var j = 0; j < 4; j++) { s.o[j].t = t[j]; step(s.o[j], .18, .70); }
      s.q('path').setAttribute('d', edgePath([s.o[0].v, s.o[1].v, s.o[2].v, s.o[3].v]));
    }, down: ppt, keydown: ppt },

    /* 69 Gap follows: a gap opens in the border on the side facing the
       pointer and slides round the perimeter to keep facing it. */
    gap: { reach: 100, frame: function (s) {
      aim(s.a, Math.atan2(s.dy, s.dx));
      s.b.t = (s.down || s.kdown) ? 130 : s.near * 28;  /* held: the gap opens until the rule is two arcs */
      var th = step(s.a, .14, .74), g = Math.max(0, step(s.b, .16, .72));
      var pos = rimPos(rim(th)), rect = s.q('rect');
      rect.style.strokeDasharray = '0 ' + g.toFixed(2) + ' ' + (PERIM - g).toFixed(2);
      rect.style.strokeDashoffset = (-(pos - g / 2)).toFixed(2);
    } },

    /* 70 Bead: a bead sits on the border at the point nearest the pointer
       and slides round to stay there. */
    bead: { reach: 100, frame: function (s) {
      var d = s.down || s.kdown;
      aim(s.a, Math.atan2(s.dy, s.dx));
      s.b.t = d ? 14 : s.near * 5;                       /* held: the bead swells into a stud on the rule */
      var p = rim(step(s.a, .14, .74)), c = s.q('circle');
      c.setAttribute('cx', p[0].toFixed(2)); c.setAttribute('cy', p[1].toFixed(2));
      c.setAttribute('r', Math.max(0, step(s.b, .16, .72)).toFixed(2));
    } },

    /* 71 Swell: grows as the pointer approaches, by distance, before hover. */
    swell: { reach: 120, frame: function (s) {
      s.a.t = (s.down || s.kdown) ? 0.94 : 1 + s.near * 0.06;   /* held: the swell runs back the other way */
      s.el.style.transform = 'scale(' + step(s.a, .14, .74).toFixed(4) + ')';
    }, init: function (s) { s.a.v = s.a.t = 1; } },

    /* 72 Rise to meet: lifts off a hard shadow as the pointer approaches, and
       lands the moment the pointer arrives. */
    rise: { reach: 120, frame: function (s) {
      s.a.t = (s.down || s.kdown) ? -1 : s.inside ? 0 : s.near;  /* held: it goes below the plane, shadow overhead */
      var v = step(s.a, .14, .74);
      s.el.style.transform = 'translateY(' + px(-8 * v) + ')';
      s.el.style.boxShadow = '0 ' + px(8 * v) + ' 0 0 #000';
    } },

    /* ---- variable font: Inter wght 100..900 and opsz 14..32, plus per-letter transforms ---- */

    /* 73 Bolden: the whole label gains weight as the pointer approaches.
       Press flips the axis: the weight carries on past the base, out to the
       thin end, and comes back to the hover weight on release. */
    bolden: { reach: 120, frame: function (s) {
      s.a.t = (s.down || s.kdown) ? 300 : 600 + 300 * s.near;
      s.q('.label').style.fontWeight = Math.round(step(s.a, .14, .74));
    }, init: function (s) { s.a.v = s.a.t = 600; } },

    /* 74 Tracking by x: letter-spacing follows the pointer across the button,
       tight at the left edge and wide at the right. Press runs the track on
       past the pointer, wider than the right edge ever gives. */
    xtrack: { frame: function (s) {
      s.a.t = (s.down || s.kdown) ? 0.34 : s.inside ? 0.02 + (s.lx / W) * 0.28 : 0.08;
      s.q('.label').style.letterSpacing = step(s.a, .16, .72).toFixed(3) + 'em';
    }, init: function (s) { s.a.v = s.a.t = 0.08; } },

    /* 75 Weight by x: thin at the left edge, black at the right. Press
       finishes the ramp: the label commits to the end it was heading for. */
    weightx: { frame: function (s) {
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      s.a.t = d ? (x >= W / 2 ? 900 : 300) : s.inside ? 300 + (s.lx / W) * 600 : 600;
      s.q('.label').style.fontWeight = Math.round(step(s.a, .16, .72));
    }, init: function (s) { s.a.v = s.a.t = 600; } },

    /* 76 Weight keys: the letter under the pointer goes bold, its neighbours
       less so, on a bell curve, like keys under a hand. Press reverses the
       peak alone: the key taken down goes thin inside the bold shoulders. */
    wkeys: { frame: function (s) {
      if (!s.cxs) return;
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      for (var i = 0; i < 6; i++) {
        var g = s.cxs[i] - x;
        s.m[i].t = d ? 600 + 300 * bell(g, 16) - 600 * bell(g, 7) : s.inside ? 600 + 300 * bell(g, 16) : 600;
        s.letters[i].style.fontWeight = Math.round(step(s.m[i], .22, .68));
      }
    }, init: function (s) { letters(s); seed(s.m, 600); }, enter: centres,
      keydown: function (s) { if (!s.cxs) centres(s); } },

    /* 77 Dock: the letter under the pointer grows from its baseline, the
       neighbours a little, the way a dock magnifies. Press resolves the
       magnification onto one letter: the bell narrows and the rest sit down. */
    dock: { frame: function (s) {
      if (!s.cxs) return;
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      for (var i = 0; i < 6; i++) {
        var g = s.cxs[i] - x;
        s.m[i].t = d ? 1 + 0.75 * bell(g, 6) : s.inside ? 1 + 0.6 * bell(g, 18) : 1;
        s.letters[i].style.transform = 'scale(' + step(s.m[i], .22, .68).toFixed(3) + ')';
      }
    }, init: function (s) { letters(s); seed(s.m, 1); }, enter: centres,
      keydown: function (s) { if (!s.cxs) centres(s); } },

    /* 78 Keys press: the letter under the pointer sinks like a pressed key.
       Press takes the same key the rest of the way down to its bottom. */
    keys: { frame: function (s) {
      if (!s.cxs) return;
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      for (var i = 0; i < 6; i++) {
        var g = bell(s.cxs[i] - x, 16);
        s.m[i].t = d ? 10 * g : s.inside ? 5 * g : 0;
        s.letters[i].style.transform = 'translateY(' + px(step(s.m[i], .24, .66)) + ')';
      }
    }, init: function (s) { letters(s); }, enter: centres,
      keydown: function (s) { if (!s.cxs) centres(s); } },

    /* 79 Weight ripple: on hover every letter heads for bold, each on a
       looser spring than the one before, starting from the side you entered,
       so the weight travels through the word. Press sends a thinning wave
       back the other way, from the far side to the side you came in. */
    wripple: { frame: function (s) {
      var d = s.down || s.kdown, back = (s.entry === 'right') !== !!d;
      for (var i = 0; i < 6; i++) {
        var o = back ? 5 - i : i;
        s.m[i].t = d ? 400 : s.inside ? 900 : 600;
        s.letters[i].style.fontWeight = Math.round(step(s.m[i], .26 - o * .038, .70));
      }
    }, init: function (s) { letters(s); seed(s.m, 600); } },

    /* 80 Optical size: Inter's opsz axis, 14 (text) to 32 (display), by
       distance. Subtle: tighter apertures and spacing as the pointer nears.
       Press gives most of it back, down to 18, and the display cut returns
       on release. */
    opsz: { reach: 120, frame: function (s) {
      s.a.t = (s.down || s.kdown) ? 18 : 14 + 18 * s.near;
      s.q('.label').style.fontVariationSettings = '"opsz" ' + step(s.a, .14, .74).toFixed(2);
    }, init: function (s) { s.a.v = s.a.t = 14; } },

    /* 81 Face the pointer: each letter turns toward the pointer, the way a
       row of heads follows someone walking past. Press flips every angle:
       the same heads turn away by the same amount. */
    face: { frame: function (s) {
      if (!s.cxs) return;
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      for (var i = 0; i < 6; i++) {
        var g = clamp((x - s.cxs[i]) * 0.5, -24, 24);
        s.m[i].t = d ? -g : s.inside ? g : 0;
        s.letters[i].style.transform = 'rotate(' + step(s.m[i], .18, .70).toFixed(2) + 'deg)';
      }
    }, init: function (s) { letters(s); }, enter: centres,
      keydown: function (s) { if (!s.cxs) centres(s); } },

    /* 82 Part: letters near the pointer push apart to make room for it.
       Press finishes the parting: the bell goes flat and the word opens into
       two blocks with the press point in the gap. */
    part: { frame: function (s) {
      if (!s.cxs) return;
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      for (var i = 0; i < 6; i++) {
        var g = s.cxs[i] - x, sg = g < 0 ? -1 : 1;
        s.m[i].t = d ? sg * 20 : s.inside ? sg * 10 * bell(g, 60) : 0;   /* wide bell: a gap opens, neighbours do not crowd */
        s.letters[i].style.transform = 'translateX(' + px(step(s.m[i], .20, .70)) + ')';
      }
    }, init: function (s) { letters(s); }, enter: centres,
      keydown: function (s) { if (!s.cxs) centres(s); } },

    /* 83 Weight by speed: bolder the faster the pointer moves, back to the
       base weight the moment it stops. Press pays the same weight for a
       pointer that has stopped: holding stands in for moving. */
    wspeed: { frame: function (s) {
      s.a.t = (s.down || s.kdown) ? 900 : s.inside ? 600 + Math.min(s.spd / 30, 1) * 300 : 600;
      s.q('.label').style.fontWeight = Math.round(step(s.a, .14, .74));
    }, init: function (s) { s.a.v = s.a.t = 600; } },

    /* 84 Weight by dwell: bolder the longer the pointer rests on it. Press
       mirrors the dwell about the base weight: a long wait is spent back
       down to 600, and a press with no wait behind it takes the bold at once. */
    wdwell: { frame: function (s) {
      if (s.inside) s.dw = clamp(s.dw + (s.spd < 1.5 ? 0.016 : -0.04), 0, 1); else s.dw = 0;
      s.a.t = 600 + 300 * ((s.down || s.kdown) ? 1 - s.dw : s.dw);
      s.q('.label').style.fontWeight = Math.round(step(s.a, .10, .74));
    }, init: function (s) { s.a.v = s.a.t = 600; s.dw = 0; } },

    /* 85 Grass: letters lean away from the pointer, most where it is
       nearest, like grass parting round a foot. Press leans them further and
       wider, so the blades at the edge of the word go over too. */
    grass: { frame: function (s) {
      if (!s.cxs) return;
      var d = s.down || s.kdown, x = s.inside ? s.lx : W / 2;
      for (var i = 0; i < 6; i++) {
        var g = s.cxs[i] - x, sg = g < 0 ? 1 : -1;
        s.m[i].t = d ? sg * 28 * bell(g, 40) : s.inside ? sg * 18 * bell(g, 26) : 0;
        s.letters[i].style.transform = 'skewX(' + step(s.m[i], .20, .70).toFixed(2) + 'deg)';
      }
    }, init: function (s) { letters(s); }, enter: centres,
      keydown: function (s) { if (!s.cxs) centres(s); } },

    /* 86 Weight holds width: bold on hover, but letter-spacing gives back
       exactly what the heavier glyphs take, so the word does not grow. Press
       drops the compensation and keeps the weight, so the bold word finally
       takes the width it costs. */
    holdw: { frame: function (s) {
      var d = s.down || s.kdown, on = d || s.inside;
      s.a.t = on ? 1 : 0; s.b.t = (on && !d) ? 1 : 0;
      var t = step(s.a, .16, .72), c = step(s.b, .16, .72), lab = s.q('.label');
      lab.style.fontWeight = Math.round(600 + 300 * t);
      lab.style.letterSpacing = px(1.12 - (s.gain || 0) / 6 * c);
    }, init: function (s) {
      var lab = s.q('.label');
      document.fonts.ready.then(function () {
        var w6 = lab.getBoundingClientRect().width;
        lab.style.fontWeight = 900; var w9 = lab.getBoundingClientRect().width;
        lab.style.fontWeight = ''; s.gain = w9 - w6;
      });
    } },
    /* ---- hatching and halftone: darkness as line or dot density, so the fill
       is still only black on white. Grid dots and dither cells are built once
       in init; every frame writes sizes, never colours. ---- */

    /* 87 Hatch fill: parallel lines, perpendicular to the pointer, thicken
       from nothing at the edge of reach to a solid fill under the pointer. */
    hatch: { reach: 140, frame: function (s) {
      var d = s.down || s.kdown;
      aim(s.a, Math.atan2(s.dy, s.dx));
      s.b.t = d ? PITCH : s.near * PITCH;
      s.c.t = d ? 1 : 0;
      var th = step(s.a, .14, .74) * 180 / Math.PI + 90, t = clamp(step(s.b, .16, .72), 0, PITCH);
      /* press: the solid fill breaks back into an open hatch at half the pitch,
         a mid-ramp of its own hover held; a solid core keeps the label legible */
      var p = clamp(step(s.c, .18, .62), 0, 1), P = PITCH * (1 - .5 * p), t2 = Math.min(t, P) * (1 - .58 * p);
      var st = s.q('.ink').style, core = p > .005;
      st.backgroundImage = t2 < .05 && !core ? 'none' :
        (core ? 'linear-gradient(#000,#000),' : '') +
        'repeating-linear-gradient(' + th.toFixed(1) + 'deg,#000 0 ' + px(t2) + ',transparent ' + px(t2) + ' ' + P.toFixed(2) + 'px)';
      st.backgroundRepeat = core ? 'no-repeat,repeat' : '';
      st.backgroundPosition = core ? 'center,0 0' : '';
      st.backgroundSize = core ? '106px 22px,auto' : '';
    } },

    /* 88 Halftone bloom: a grid of dots; each dot's radius follows a bell
       centred on the pointer, so the dots under it merge into solid black
       and the ones at the far end stay pinpricks. */
    halftone: { reach: 60, frame: function (s) {
      /* press: the bell pins to the press point and tightens onto it, so the
         dots under the finger merge and the far end falls back to pinpricks */
      var dn = s.down || s.kdown;
      if (dn && !s.pinned) { s.pinned = 1; s.ppx = s.down ? s.lxr - 2 : W / 2; s.ppy = s.down ? s.lyr - 2 : H / 2; }
      if (!dn) s.pinned = 0;
      s.a.t = dn ? s.ppx : s.lxr - 2; s.b.t = dn ? s.ppy : s.lyr - 2; s.c.t = dn ? 1 : s.near;
      s.x[0].t = dn ? 1 : 0;
      var x = step(s.a, .28, .62), y = step(s.b, .28, .62), g = step(s.c, .16, .72);
      var p = clamp(step(s.x[0], .16, .70), 0, 1), sig = 26 - 12 * p, amp = 5.8 + 2.4 * p;
      for (var i = 0; i < s.dots.length; i++) {
        var d = s.dots[i], ax = d.x - x, ay = d.y - y;
        setR(d, g * amp * bell(Math.sqrt(ax * ax + ay * ay), sig));
      }
    }, init: function (s) {
      var svg = s.q('svg'); s.dots = []; s.pinned = 0; s.ppx = W / 2; s.ppy = H / 2; s.x.push(sp());
      for (var y = 6; y < H - 4; y += 8) for (var x = 6; x < W - 4; x += 8) s.dots.push(dot(svg, x, y));
    } },

    /* 89 Stipple bleed: ink soaks in from the entry point. The front is a
       ragged band of dots that swell as they sit; 40px behind it the dots have
       merged into solid ink, so the label is speckled only at the fringe. */
    stipple: { frame: function (s) {
      var dn = s.down || s.kdown;
      if (s.inside || dn) s.fr = Math.min(s.fr + 2.2, 300); else s.fr = Math.max(0, s.fr - 11);
      /* press: the soak runs backwards out of the press point. The core leaves
         the entry point for the pressed point and shrinks to a disc, and the
         dots around it come back off the page, so the ink is a fringe again. */
      if (dn && !s.pinned) { s.pinned = 1; s.ppx = s.down ? s.lx : W / 2; s.ppy = s.down ? s.ly : H / 2; }
      if (!dn) s.pinned = 0;
      s.a.t = dn ? 1 : 0;
      var p = clamp(step(s.a, .14, .62), 0, 1);
      for (var i = 0; i < s.dots.length; i++) {
        var d = s.dots[i], k = s.fr - d.soak;
        setR(d, k <= 0 ? 0 : (0.9 + 1.6 * Math.min(k / 40, 1)) * (1 - .44 * p));
      }
      var cr = Math.max(0, s.fr - 44) * (1 - p) + 56 * p;
      s.q('.ink').style.clipPath = 'circle(' + cr.toFixed(1) + 'px at ' + px(s.ex + (s.ppx - s.ex) * p) + ' ' + px(s.ey + (s.ppy - s.ey) * p) + ')';
    }, init: function (s) {
      var svg = s.q('svg'); s.dots = []; s.fr = 0; s.pinned = 0; s.ppx = W / 2; s.ppy = H / 2;
      for (var i = 0; i < 260; i++) {
        var d = dot(svg, 2 + rnd(i * 2) * (W - 8), 2 + rnd(i * 2 + 1) * (H - 8));
        d.j = 0.7 + 0.6 * rnd(600 + i); s.dots.push(d);
      }
    }, enter: function (s) {
      s.fr = 0;
      for (var i = 0; i < s.dots.length; i++) {
        var d = s.dots[i], ax = d.x - (s.ex - 2), ay = d.y - (s.ey - 2);
        d.soak = Math.sqrt(ax * ax + ay * ay) * d.j;
      }
    } },

    /* 90 Dither wipe: an ordered dither sweeps in from the entry edge. Sixteen
       layers, one per Bayer threshold, each clipped a little further back than
       the last, so the ramp between white and black is a dither, never a grey. */
    dither: { frame: function (s) {
      var e = s.entry, horiz = e === 'left' || e === 'right', w = W - 4, h = H - 4, span = horiz ? w : h;
      var dn = s.down || s.kdown;
      s.a.t = s.inside || dn ? span + RAMP : 0;
      s.b.t = dn ? 1 : 0;
      var f = step(s.a, .12, .74);
      /* press: the top eight thresholds run their own ramp back out the way it
         came, so the finished solid lifts to a half dither and the wipe is
         legible again; a solid core under the label is held while they go */
      var p = clamp(step(s.b, .14, .62), 0, 1), g = f - p * (span + RAMP);
      for (var k = 0; k < 16; k++) {
        var L = Math.round(clamp((k < 8 ? f : g) - k * RAMP / 16, 0, span) / 2) * 2, r = s.lay[k];
        if (horiz) { r.setAttribute('width', L); r.setAttribute('x', e === 'left' ? 0 : w - L); }
        else { r.setAttribute('height', L); r.setAttribute('y', e === 'top' ? 0 : h - L); }
      }
      if (p > .005) { s.core.setAttribute('width', 106); s.core.setAttribute('height', 22); }
      else { s.core.setAttribute('width', 0); s.core.setAttribute('height', 0); }
    }, init: function (s) {
      var svg = s.q('svg'), defs = mk(svg, 'defs'), id = 'bayer' + (++UID); s.lay = [];
      for (var k = 0; k < 16; k++) {
        var p = mk(defs, 'pattern', { id: id + '-' + k, width: 8, height: 8, patternUnits: 'userSpaceOnUse' });
        var i = BAYER.indexOf(k);
        mk(p, 'rect', { x: (i % 4) * 2, y: Math.floor(i / 4) * 2, width: 2, height: 2 });
        s.lay.push(mk(svg, 'rect', { x: 0, y: 0, width: 0, height: 0, fill: 'url(#' + id + '-' + k + ')' }));
      }
      s.core = mk(svg, 'rect', { x: 27, y: 13, width: 0, height: 0 });
    }, enter: function (s) {
      var horiz = s.entry === 'left' || s.entry === 'right';
      s.a.v = 0; s.a.vel = 0;
      for (var k = 0; k < 16; k++) { var r = s.lay[k]; r.setAttribute('x', 0); r.setAttribute('y', 0); r.setAttribute('width', horiz ? 0 : W - 4); r.setAttribute('height', horiz ? H - 4 : 0); }
    } }
,

    /* ---- 02-intent ---- */
    /* Anticipation: the pointer's velocity, taken per frame from its unclamped
       position, is extrapolated 150ms ahead; if the predicted point lands in
       the box the fill blooms from that predicted landing point before the
       pointer arrives. A pointer passing alongside never predicts inside, so
       it never fills; a pointer that stops short loses its velocity within a
       few frames and the prediction collapses. */
    predict: { reach: 160, frame: function (s) {
      var rvx = s.lxr - s.hx, rvy = s.lyr - s.hy;
      if (s.now - s.ht > 100 || Math.abs(rvx) + Math.abs(rvy) > 120) rvx = rvy = 0;   /* loop was asleep or the pointer jumped: no stale delta */
      s.hx = s.lxr; s.hy = s.lyr; s.ht = s.now;
      s.pvx += (rvx - s.pvx) * .3; s.pvy += (rvy - s.pvy) * .3;    /* px per frame */
      var px2 = s.lxr + s.pvx * 9.4, py2 = s.lyr + s.pvy * 9.4;    /* 150ms at 16ms per frame */
      var dn = s.down || s.kdown;
      var hit = s.inside || dn || (s.near > 0 && px2 >= 0 && px2 <= W && py2 >= 0 && py2 <= H);
      if (hit && !s.pred) { s.pred = 1; s.pcx = clamp(px2, 0, W); s.pcy = clamp(py2, 0, H); }
      if (!hit) s.pred = 0;
      /* press: the bloom shrinks back onto the point it was predicted at, so
         the guess the hover acted on is what is left under the finger */
      s.a.t = hit ? (dn ? 34 : 190) : 0;
      var r = step(s.a, .10, .72);
      s.q('.ink').style.clipPath = r < .05 ? 'circle(0px at 50% 50%)' : 'circle(' + r.toFixed(1) + 'px at ' + px(s.pcx) + ' ' + px(s.pcy) + ')';
    }, init: function (s) { s.pred = 0; s.pcx = W / 2; s.pcy = H / 2; s.hx = s.hy = 0; s.ht = -1e9; s.pvx = s.pvy = 0; } },

    /* Hover intent: nothing happens until the pointer has been inside for
       80ms; a pass-through shorter than that leaves the button untouched.
       Once committed the fill grows from the centre. Invert, the first card,
       is the instant version of the same fill for comparison. */
    intent: { frame: function (s) {
      var dn = s.down || s.kdown;
      var go = (s.inside && s.now - s.enterT >= 80) || dn;
      /* press: the fill runs back down its own growth to the frame the gate
         let it start on, so the threshold the hover crossed is visible */
      s.a.t = dn ? .55 : go ? 1 : 0;
      var v = clamp(step(s.a, .14, .60), 0, 1);
      s.q('.ink').style.clipPath = v > .98 ? 'none' : 'inset(' + px(24 * (1 - v)) + ' ' + px(80 * (1 - v)) + ')';   /* no mask at full: a mask edge on the border leaves a grey seam */
    }, init: function (s) { s.enterT = 1e12; }, enter: function (s) { s.enterT = performance.now(); } },

    /* Exit grace: the fill holds for 200ms after the pointer leaves and only
       then retracts, so a pointer that brushes an edge or clips a corner does
       not flicker. Re-enter inside the grace and nothing has moved. */
    linger: { frame: function (s) {
      if (s.was && !s.inside) s.leftT = s.now;
      s.was = s.inside;
      var dn = s.down || s.kdown;
      var hold = s.inside || dn || s.now - s.leftT < 200;
      s.a.t = hold ? 1 : 0;
      /* press: the same retraction runs on the other axis, parting the fill
         around the label instead of across it, and stops at the grace width */
      s.b.t = dn ? 30 : 0;
      var v = clamp(step(s.a, .12, .62), 0, 1), hb = Math.max(0, step(s.b, .14, .62));
      s.q('.ink').style.clipPath = v > .98 && hb < .05 ? 'none' : 'inset(' + px(24 * (1 - v)) + ' ' + px(hb) + ')';
    }, init: function (s) { s.was = false; s.leftT = -1e9; } },

    /* Approach angle: a straight edge sweeps across along the pointer's
       heading over the last 300ms, not the point where it crossed the border.
       Clip a corner while travelling sideways and the wipe is still sideways.
       On exit the plate carries on along the exit heading, a pass-through;
       a brush that never covered keeps its entry heading so nothing jumps. */
    heading: { reach: 120, frame: function (s) {
      histPush(s, s.lxr, s.lyr, s.now, 300);
      if (s.was && !s.inside) {
        if (s.a.v > -70) { var th = histHeading(s, 3); if (th !== null) s.th = th; }   /* a brush that never covered keeps its entry heading */
        s.hist.length = 0;                                                          /* the return trip starts a fresh history */
      }
      s.was = s.inside;
      /* press: the plate backs off halfway along the same heading, so its
         straight edge crosses the button and the angle it came in on shows */
      var dn = s.down || s.kdown;
      s.a.t = s.inside || dn ? (dn ? 160 : 0) : 260;
      var u = step(s.a, .14, .60);
      s.q('.ink').style.transform = !s.inside && u > 259.5 ? 'translate(-50%,-50%) rotate(0deg) translateX(260px)' :
        'translate(-50%,-50%) rotate(' + (s.th * 180 / Math.PI).toFixed(1) + 'deg) translateX(' + px(u) + ')';
    }, init: function (s) { s.hist = []; s.th = 0; s.was = false; s.a.v = s.a.t = 260; },
    enter: function (s) {
      var th = histHeading(s, 3);
      if (th === null) th = s.rx < -1e8 ? s.eth + Math.PI : Math.atan2(s.ey - s.ry, s.ex - s.rx);
      s.th = th; s.a.v = -260; s.a.vel = 0; s.hist.length = 0;
    } },

    /* ---- 03-press ---- */
    /* Hold to confirm: the fill tracks the time held, full at 600ms, and stays
       black for as long as the button is down. Let go early or late and it
       retracts the way it came. Space or Enter held does the same. */
    confirm: { frame: function (s) {
      if (s.down || s.kdown) { s.a.v = s.a.t = clamp(s.held / 600, 0, 1); s.a.vel = 0; }
      else { s.a.t = 0; step(s.a, .16, .70); }
      s.q('.ink').style.clipPath = 'inset(0 ' + (100 - s.a.v * 100).toFixed(2) + '% 0 0)';
    } },

    /* Press depth by pressure: PointerEvent.pressure sets how far the button
       sinks and how deep the inner shadow falls. A pen or a force trackpad
       varies it; a mouse reports .5 while down, so its depth is fixed at half. */
    depth: { frame: function (s) {
      s.a.t = s.down ? s.pressure : 0;
      var p = step(s.a, .22, .66);
      if (!s.down && p < .002) { s.el.style.transform = ''; s.el.style.boxShadow = ''; return; }
      s.el.style.transform = 'scale(' + (1 - p * .06).toFixed(4) + ')';
      s.el.style.boxShadow = 'inset 0 ' + px(12 * p) + ' ' + px(22 * p) + ' rgba(0,0,0,.55)';
    } },

    /* Drag-off cancel: press and the fill rises from the bottom. Let go over
       the button and it sinks back down; drag off the edge while down and it
       drains out through the edge you left by instead. */
    dragoff: { frame: function (s) {
      var tx = 0, ty = 1, e = s.exit;
      if (s.down) { ty = 0; }
      else if (s.doff) { tx = e === 'left' ? -1 : e === 'right' ? 1 : 0; ty = e === 'top' ? -1 : e === 'bottom' ? 1 : 0; }
      s.a.t = tx; s.b.t = ty;
      var k = s.down ? .22 : .05, d = s.down ? .66 : .78;          /* fills in 80ms, drains over about 200ms */
      var x = step(s.a, k, d), y = step(s.b, k, d);
      if (s.doff && Math.abs(x - tx) < .005 && Math.abs(y - ty) < .005 && Math.abs(s.a.vel) + Math.abs(s.b.vel) < .005) { s.doff = 0; s.a.v = s.a.t = 0; s.b.v = s.b.t = 1; s.a.vel = s.b.vel = 0; x = 0; y = 1; }
      s.q('.ink').style.transform = 'translate(' + (x * 101).toFixed(2) + '%,' + (y * 101).toFixed(2) + '%)';
    }, init: function (s) { s.b.v = s.b.t = 1; s.doff = 0; }, down: function (s) { s.doff = 0; }, up: function (s) { s.doff = 0; }, cancel: function (s) { s.doff = 1; } },

    /* Release bounce: the button compresses while held, a little more the
       longer you hold, and on release springs past its size by an amount set
       by the hold: a tap barely bounces, a second's hold bounces to 1.11. */
    rebound: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = d ? .97 - .05 * clamp(s.held / 1000, 0, 1) : 1;
      var v = d ? step(s.a, .30, .60) : step(s.a, .13, .84);
      if (!d && Math.abs(v - 1) < .0005 && Math.abs(s.a.vel) < .0005) { s.a.v = 1; s.a.vel = 0; s.el.style.transform = ''; return; }
      s.el.style.transform = 'scale(' + v.toFixed(4) + ')';
    }, init: function (s) { s.a.v = s.a.t = 1; }, up: kick, keyup: kick },

    /* Throw: hold and drag and the button comes with the pointer, on a soft
       tether so it never gets far. Let go and it carries on along the throw,
       overshoots its place and springs back. It never moves under a hover. */
    throw: { frame: function (s) {
      if (s.down) { s.a.t = soft(s.lxr - s.gx, 70); s.b.t = soft(s.lyr - s.gy, 40); step(s.a, .5, .5); step(s.b, .5, .5); }
      else { s.a.t = 0; s.b.t = 0; step(s.a, .11, .82); step(s.b, .11, .82); }
      var x = s.a.v, y = s.b.v;
      if (!s.down && Math.abs(x) < .01 && Math.abs(y) < .01 && Math.abs(s.a.vel) < .01 && Math.abs(s.b.vel) < .01) { snap(s.a); snap(s.b); s.el.style.transform = ''; return; }
      s.el.style.transform = 'translate(' + px(x) + ',' + px(y) + ')';
    }, init: function (s) {
      s.gx = 80; s.gy = 24;
      /* runs before the engine's own pointerdown: record the grip point from
         the event itself and capture the pointer so the drag survives leaving the box */
      s.el.addEventListener('pointerdown', function (e) {
        var r = s.r || s.el.getBoundingClientRect(); s.gx = e.clientX - r.left; s.gy = e.clientY - r.top;
        try { s.el.setPointerCapture(e.pointerId); } catch (x) { }
      });
    }, up: function (s) { s.a.vel = clamp(s.vx, -24, 24) * .9; s.b.vel = clamp(s.vy, -24, 24) * .9; } },

    /* ---- 04-keyboard ---- */
    /* Direction-aware focus: Tab brings the fill in from the left, Shift-Tab
       from the right, and on blur it carries on out the far side, so the fill
       travels the way focus does. Mouse focus and hover do nothing. */
    tabfill: { frame: function (s) {
      s.a.t = kbf(s) ? 0 : 1;
      var v = clamp(step(s.a, .08, .78), 0, 1);
      if (!s.focused && v > .999) { s.sg = -1; v = 1; }   /* parked: one canonical rest side */
      s.q('.ink').style.transform = 'translate(' + (s.sg * v * 101).toFixed(1) + '%,0)';
    }, init: function (s) { s.a.v = s.a.t = 1; s.sg = -1; },
    focus: function (s) { s.sg = s.fdir === 'back' ? 1 : -1; s.a.v = 1; s.a.vel = 0; },
    blur: function (s) { s.sg = -s.sg; } },

    /* Key press: Space or Enter down sinks the button 3px under an inner
       shadow, the way Press in does on hover; release lets it back up. A
       pointer press does the same. Hover alone does nothing. */
    spacebar: { frame: function (s) {
      s.a.t = (s.kdown || s.down) ? 1 : 0;
      var v = clamp(step(s.a, .30, .60), 0, 1), el = s.el;
      if (v < .002) { el.style.transform = ''; el.style.boxShadow = ''; return; }
      el.style.transform = 'translateY(' + px(3 * v) + ') scale(' + (1 - .03 * v).toFixed(4) + ')';
      el.style.boxShadow = 'inset 0 ' + px(3 * v) + ' ' + px(6 * v) + ' rgba(0,0,0,' + (.35 * v).toFixed(3) + ')';
    } },

    /* Focus dwell: the label gains weight for as long as keyboard focus rests
       on the button, 600 to 900 over about a second, and holds at 900. Blur
       lets it back down. Weight by dwell, for the keyboard; hover does nothing. */
    fdwell: { frame: function (s) {
      s.fw = kbf(s) ? Math.min(s.fw + 0.016, 1) : 0;
      s.a.t = 600 + 300 * s.fw;
      s.q('.label').style.fontWeight = clamp(Math.round(step(s.a, .10, .74)), 600, 900);
    }, init: function (s) { s.a.v = s.a.t = 600; s.fw = 0; } },

    /* ---- 05-shape ---- */
    /* Speech tail: a point grows on the edge facing the pointer, from a
       distance, and slides round the perimeter to keep facing it. The tip
       leans along the edge toward the pointer, the way a bubble's tail does.
       Press and the tail keeps going: it reaches twice as far out and its
       base narrows to a third, so the point becomes a spike. */
    tail: { reach: 100, frame: function (s) {
      aim(s.a, Math.atan2(s.dy, s.dx));
      s.b.t = (s.down || s.kdown) ? 26 : s.near * 12;
      var th = step(s.a, .14, .74), h = Math.max(0, step(s.b, .16, .72));
      var HW = 6 - 4 * clamp((h - 12) / 14, 0, 1);
      var p = rim(th), k = sideOf(p), u = clamp(along(k, p[0], p[1]), HW + 1, SLEN[k] - HW - 1);
      var t = along(k, s.lxr, s.lyr) - u;                                /* pointer offset along the edge */
      s.c.t = s.near ? clamp(t * .25, -HW, HW) : 0;
      var lean = step(s.c, .16, .72), ins = ['', '', '', ''];
      if (h > .05) ins[k] = ' L' + pt(sidePt(k, u - HW, 0)) + ' L' + pt(sidePt(k, u + lean, h)) + ' L' + pt(sidePt(k, u + HW, 0));
      s.q('path').setAttribute('d', outline(ins));
    } },

    /* Notch: approach from outside and a semicircular bite opens in the
       border where the pointer is about to touch it, deepening as it nears
       and sliding along the edge with it. Cross the edge and the bite stays
       where the pointer came through; leave and it closes. Press and the
       bite turns inside out through the flat edge into a bulge of the same
       arc, half again as wide, on the same spot. */
    notch: { reach: 70, frame: function (s) {
      var k = s.side, u = s.a.t, r = 0, d = s.down || s.kdown;
      if (s.inside) { k = SIDE[s.entry]; u = along(k, s.ex, s.ey); r = -10; }
      else if (s.near) { k = SIDE[s.oside]; u = along(k, s.lxr, s.lyr); r = -10 * Math.pow(s.near, 1.5); }
      if (k !== s.side) { s.side = k; s.a.v = u; s.a.vel = 0; }         /* a new side: no flight across the box */
      s.a.t = u; s.b.t = d ? 15 : r;                                    /* negative bites in, positive bulges out */
      var pos = step(s.a, .25, .65), sig = step(s.b, .18, .70), rad = Math.abs(sig), ins = ['', '', '', ''];
      if (rad > .05) {
        var c = clamp(pos, rad + 1, SLEN[k] - rad - 1);
        ins[k] = ' L' + pt(sidePt(k, c - rad, 0)) + ' A' + num(rad) + ' ' + num(rad) + ' 0 0 ' + (sig > 0 ? 1 : 0) + ' ' + pt(sidePt(k, c + rad, 0));
      }
      s.q('path').setAttribute('d', outline(ins));
    }, init: function (s) { s.side = 0; s.a.v = s.a.t = SLEN[0] / 2; } },

    /* Chamfer: the corner nearest the pointer is cut at 45 degrees, deeper
       the closer the pointer comes to it, from outside or inside. Press and
       the cut spreads: all four corners take the same 16px chamfer. */
    chamfer: { reach: 60, frame: function (s) {
      var d = s.down || s.kdown;
      s.q('path').setAttribute('d', cutPath(d ? cornerHold(s, 16, 1) : cornerCut(s, 16), 0));
    } },

    /* Nearest corner rounds: the same corner, but it gains radius instead
       of a cut, so one corner of the square button turns into a pill end.
       Press and it finishes the job: the radius runs out to half the height,
       the largest a corner can take, so the end is a true half circle. */
    rounds: { reach: 60, frame: function (s) {
      var d = s.down || s.kdown;
      s.q('path').setAttribute('d', cutPath(d ? cornerHold(s, H / 2 - I, 0) : cornerCut(s, 22), 1));
    } },

    /* Parallelogram: the sides shear with pointer x, the top edge toward the
       pointer and the bottom away. Only the outline moves; the label stays
       upright and the box under the pointer does not change. Press and the
       lean reverses: the same shear on the same axis, the other sign, and
       past the hover amount. A keyboard press leans right. */
    shear: { frame: function (s) {
      var d = s.down || s.kdown, n = s.inside ? s.nx : (d ? -1 : 0);
      s.a.t = d ? clamp(-n * 20, -12, 12) : (s.inside ? s.nx * 12 : 0);
      var v = step(s.a, .16, .72);
      s.q('path').setAttribute('d', poly([[I + v, I], [W - I + v, I], [W - I - v, H - I], [I - v, H - I]]));
    } },

    /* ---- 06-physics ---- */
    /* Jelly: the border is a ring of twelve masses. Each is tied to its rest
       point and to its two neighbours, so a poke spreads along the outline and
       rings out; the pointer pushes any mass within 36px, from inside or out,
       and the ring settles back to the exact rectangle in under a second. */
    jelly: { reach: 36, frame: function (s) {
      var n = JN, x = s.x, i, j, ax, ay, d, f, hd = s.down || s.kdown;
      for (i = 0; i < n; i++) {                            /* neighbour springs */
        j = (i + 1) % n;
        ax = x[2 * j].v - x[2 * i].v; ay = x[2 * j + 1].v - x[2 * i + 1].v;
        d = Math.sqrt(ax * ax + ay * ay) || 1; f = (d - s.jl[i]) * .10 / d;
        x[2 * i].vel += ax * f; x[2 * i + 1].vel += ay * f; x[2 * j].vel -= ax * f; x[2 * j + 1].vel -= ay * f;
      }
      /* the poke, and under a press the same force with its sign turned
         over: the ring is pulled onto the press point and held dented in */
      if (s.inside || s.near || hd) for (i = 0; i < n; i++) {
        ax = x[2 * i].v - s.lxr; ay = x[2 * i + 1].v - s.lyr; d = Math.sqrt(ax * ax + ay * ay);
        if (hd) { if (d < 44 && d > 7) { f = -(44 - d) / 44 * 1.5 / d; x[2 * i].vel += ax * f; x[2 * i + 1].vel += ay * f; } }
        else if (d < 36 && d > .01) { f = (36 - d) / 36 * 2.4 / d; x[2 * i].vel += ax * f; x[2 * i + 1].vel += ay * f; }
      }
      var still = true;
      for (i = 0; i < 2 * n; i++) { step(x[i], .18, .74); if (!calm(x[i], .02)) still = false; }
      if (still && !s.inside && !s.near && !hd) for (i = 0; i < 2 * n; i++) snap(x[i]);
      s.q('path').setAttribute('d', jellyPath(x));
    }, init: function (s) {
      var p = jellyRest(), i, j, ax, ay; s.jl = [];
      for (i = 0; i < JN; i++) {
        var sx = sp(), sy = sp(); sx.v = sx.t = p[i][0]; sy.v = sy.t = p[i][1]; s.x.push(sx, sy);
        j = (i + 1) % JN; ax = p[j][0] - p[i][0]; ay = p[j][1] - p[i][1]; s.jl.push(Math.sqrt(ax * ax + ay * ay));
      }
      s.q('path').setAttribute('d', jellyPath(s.x));
    } },

    /* Pendulum: the button hangs from the middle of its top edge. Pointer
       motion across it is a push on the bob, so it swings in the direction of
       travel and gravity brings it back through a few damped swings. A resting
       pointer applies no force, so it never swings away from one. Press and
       the bob is caught: the swing stops dead and the button is held over at
       an angle set by where in the box the press landed. Let go and gravity
       takes it back through the same damped swings. */
    pendulum: { frame: function (s) {
      if (s.down || s.kdown) {                                          /* caught and held */
        s.a.t = s.inside ? clamp(s.nx * 12, -12, 12) : 11; s.pp = s.lx;
        var hh = step(s.a, .24, .58); s.a.t = 0;
        s.el.style.transform = 'rotate(' + hh.toFixed(2) + 'deg)';
        return;
      }
      if (s.inside) s.a.vel = clamp(s.a.vel - (s.lx - s.pp) * .11, -2.6, 2.6);
      s.pp = s.lx; s.a.t = 0;
      var th = clamp(step(s.a, .09, .86), -14, 14); s.a.v = th;
      s.el.style.transform = calm(s.a, .005) ? '' : 'rotate(' + th.toFixed(2) + 'deg)';
    }, init: function (s) { s.pp = W / 2; }, enter: function (s) { s.pp = s.ex; } },

    /* Rubber band: the label is elastic and pinned at the end away from the
       pointer; the near end stretches toward it, thinning a little as it goes.
       Leave and it snaps back on a stiffer spring, overshooting once. Press
       and the band is let go: it recoils through rest and compresses by as
       much as it had stretched, pinned at the other end. */
    rubber: { frame: function (s) {
      var d = s.down || s.kdown;
      s.a.t = s.inside ? s.nx * .42 : (d ? .30 : 0);
      s.b.t = d ? 1 : 0;
      var a = (s.inside || d) ? step(s.a, .22, .68) : step(s.a, .36, .58), lab = s.q('.label');
      var c = clamp(step(s.b, .20, .66), 0, 1), g = Math.abs(a) * (1 - 2 * c);
      if (!s.inside && !d && calm(s.a, .002) && calm(s.b, .002)) { lab.style.transform = ''; lab.style.transformOrigin = ''; return; }
      lab.style.transformOrigin = a > 0 ? '0% 50%' : '100% 50%';
      lab.style.transform = 'scale(' + (1 + g).toFixed(3) + ',' + (1 - g * .2).toFixed(3) + ')';
    } },

    /* Weight drop: on entry the label falls 4px under gravity, lands, bounces
       once and lies still on the lower position while the pointer stays. On
       exit it is lifted back to rest on a plain spring, no bounce. Press and
       the same drop happens again from where it lies: the weight falls a
       second 4px, bounces once more and lies still at 8px. */
    thud: { frame: function (s) {
      var lab = s.q('.label'), d = s.down || s.kdown, g = d ? 8 : 4;
      if (s.inside || d) {
        s.a.t = g;
        if (s.wb < 2) {
          s.a.vel += .22; s.a.v += s.a.vel;
          if (s.a.v >= g) { s.a.v = g; s.wb++; s.a.vel = s.wb < 2 ? -s.a.vel * .6 : 0; }
        } else if (s.a.v > g) { step(s.a, .18, .64); calm(s.a, .005); }   /* released: lifted back to the hover rest */
        else { s.a.v = g; s.a.vel = 0; }
      } else { s.a.t = 0; step(s.a, .18, .64); calm(s.a, .005); }
      lab.style.transform = s.a.v === 0 ? '' : 'translateY(' + px(s.a.v) + ')';
    }, init: function (s) { s.wb = 2; }, enter: function (s) { s.wb = 0; s.a.vel = 0; },
      down: function (s) { s.wb = 0; s.a.vel = 0; }, keydown: function (s) { s.wb = 0; s.a.vel = 0; } },

    /* ---- 08-cursor ---- */
    /* Cursor becomes button: an 8px dot rides under the pointer over the stage.
       Cross into the button and the dot grows into a black plate that fills the
       box; leave and the plate shrinks back to a dot under the pointer.
       Press and the growth runs backwards: the plate falls in to the dot it
       came from, at the point pressed rather than under the pointer, and
       grows back out of it on release. */
    become: { reach: 260, frame: function (s) {
      var cur = s.q('.cur'), d = s.down || s.kdown;
      s.a.t = (s.inside && !d) ? 1 : 0;
      var t = clamp(step(s.a, .16, .72), 0, 1);
      if (!s.on && t <= 0) { cur.removeAttribute('style'); return; }
      var x = (d ? s.qx : s.lxr) - 4, y = (d ? s.qy : s.lyr) - 4;
      cur.style.transform = 'translate(' + px(x * (1 - t)) + ',' + px(y * (1 - t)) + ')';
      cur.style.width = px(8 + (W - 12) * t); cur.style.height = px(8 + (H - 12) * t);
      cur.style.borderRadius = px(4 * (1 - t));
      cur.style.visibility = s.on ? 'visible' : 'hidden';
    }, init: function (s) { s.qx = W / 2; s.qy = H / 2; stageWatch(s); },
      down: function (s) { s.qx = s.lxr; s.qy = s.lyr; } },

    /* Sticky cursor: the dot trails the pointer on a loose spring. Once the
       pointer is inside the button the dot leaves it and snaps to the centre,
       where it stays put until the pointer leaves the box. Press and it lets
       go of the centre: the dot travels the rest of the way onto the press
       point and shrinks to 4px there, the size of a real cursor tip. */
    sticky: { reach: 260, frame: function (s) {
      var cur = s.q('.cur'), h = s.down || s.kdown;
      if (!s.on) { cur.removeAttribute('style'); return; }
      s.a.t = h ? s.qx : s.inside ? W / 2 : s.lxr; s.b.t = h ? s.qy : s.inside ? H / 2 : s.lyr;
      var k = (s.inside || h) ? .28 : .10, d = (s.inside || h) ? .62 : .80;
      s.c.t = h ? 1 : 0;
      var z = 8 - 4 * clamp(step(s.c, .22, .64), 0, 1);
      if (z > 7.99) { cur.style.width = ''; cur.style.height = ''; }
      else { cur.style.width = px(z); cur.style.height = px(z); }
      curXY(cur, step(s.a, k, d) - z / 2, step(s.b, k, d) - z / 2);
    }, init: function (s) {
      s.qx = W / 2; s.qy = H / 2;
      stageWatch(s, function (s) { s.a.v = s.a.t = s.lxr; s.b.v = s.b.t = s.lyr; s.a.vel = s.b.vel = 0; });
    }, down: function (s) { s.qx = s.lxr; s.qy = s.lyr; } },

    /* Inverting cursor: a white disc in difference blend rides under the
       pointer, so it reads black on the white stage. The button goes black
       while the pointer is inside, so the disc flips to white the instant its
       centre crosses the border, half and half while it straddles the rule.
       Press and the disc gives up its inversion from the middle outward
       until only a rim of it is left: a white ring around a black hole. */
    lens: { reach: 260, frame: function (s) {
      var cur = s.q('.cur'), ink = s.q('.ink');
      if (s.inside) ink.style.visibility = 'visible'; else ink.removeAttribute('style');
      if (!s.on) { cur.removeAttribute('style'); return; }
      s.a.t = (s.down || s.kdown) ? 8.5 : 0;                     /* the press empties the disc from the middle out */
      var o = Math.max(0, step(s.a, .20, .66));
      if (o < .05) { if (cur.style.background) cur.style.background = ''; }
      else cur.style.background = 'radial-gradient(circle at 50% 50%, transparent ' + o.toFixed(2) + 'px, #fff ' + o.toFixed(2) + 'px)';
      curXY(cur, s.lxr - 12, s.lyr - 12);
    }, init: function (s) { stageWatch(s); } },

    /* ---- 11-filters ---- */
    /* Displacement by speed: turbulence displaces the whole button, border and
       label together, by pointer speed. The scale is written per frame and the
       filter property is cleared once it settles to zero, so the resting render
       never passes through the filter. */
    displace: { frame: function (s) {
      /* press: the same scale is written past anything speed asks for and held
         there, so the warp the pointer was making settles at its limit */
      s.a.t = s.down || s.kdown ? 22 : s.inside ? Math.min(s.spd / 28, 1) * 16 : 0;
      var v = Math.max(0, step(s.a, .22, .68)); if (v < .05) v = 0;
      s.dm.setAttribute('scale', filtNum(v));
      s.el.style.filter = v ? 'url(#f-displace)' : '';
    }, init: function (s) { s.dm = s.q('feDisplacementMap'); s.dm.setAttribute('scale', filtNum(0)); } },

    /* Dilate weight: feMorphology dilates the label's strokes sideways as the
       pointer approaches, so stems gain and horizontals do not, the way weight
       does. Unlike the wght axis (Bolden) it keeps the outer contour and
       narrows the counters. The browser rounds the radius to whole device
       pixels, so the growth lands in one step; the cap is half a CSS pixel a side. */
    dilate: { reach: 120, frame: function (s) {
      /* press: the same radius doubles to the next whole device pixel a side,
         the only further step the browser's rounding allows */
      s.a.t = s.down || s.kdown ? 1.0 : s.near * 0.5;
      var v = Math.max(0, step(s.a, .14, .74)); if (v < .02) v = 0;
      s.mo.setAttribute('radius', v ? filtNum(v) + ' 0' : '0');
      s.q('.label').style.filter = v ? 'url(#f-dilate)' : '';
    }, init: function (s) { s.mo = s.q('feMorphology'); s.mo.setAttribute('radius', filtNum(0)); } },

    /* Threshold shadow: a blurred, offset copy of the silhouette is cut to
       hard black by a discrete alpha transfer, so the palette stays two
       colours. Proximity lowers the cut, and the shadow surfaces from under
       the right and bottom edges, corners last. */
    thresh: { reach: 150, frame: function (s) {
      /* press: the cut drops past where proximity alone can take it, so more of
         the same blur clears the threshold and the shadow surfaces further */
      s.a.t = s.down || s.kdown ? 1.35 : s.near;
      var v = clamp(step(s.a, .14, .74), 0, 1.35); if (v < .01) v = 0;
      s.fa.setAttribute('tableValues', filtCut(Math.round(64 - v * 40)));
      s.el.style.filter = v ? 'url(#f-thresh)' : '';
    }, init: function (s) { s.fa = s.q('feFuncA'); s.fa.setAttribute('tableValues', filtCut(64)); } },

    /* ---- 13-after ---- */
    /* Pending fill: a completed click starts a progress band that creeps left
       to right in uneven steps, is full at 1.6s, holds, then clears out by the
       right edge. Hover does nothing; a second click while pending is ignored. */
    pending: { frame: function (s) {
      if (!s.t0) return;
      var t = Math.max(0, s.now - s.t0) / 1000, ink = s.q('.ink');
      if (t >= 2.3) { s.t0 = 0; ink.style.clipPath = ''; return; }
      s.until = s.now + 500;
      /* the clip overshoots the plate by 2px on every covered side: a clip edge
         that sits exactly on the plate edge is antialiased into a grey hairline */
      var L = -2, R = -2, w = W - 4;
      if (t < 1.6) R = w * (1 - creep(t / 1.6));
      else if (t >= 1.9) L = w * ease((t - 1.9) / .4);
      ink.style.clipPath = 'inset(-2px ' + px(R) + ' -2px ' + px(L) + ')';
    }, init: function (s) { s.t0 = 0; }, up: afterStart, keyup: afterStart, cancel: afterNothing },

    /* Success check: a 2px line slides out of the left border, crosses to the
       centre and bends into a check, pushing the label out by the right edge.
       It holds 1.2s, then slides back into the border and the label returns. */
    check: { frame: function (s) {
      if (!s.t0) return;
      var t = Math.max(0, s.now - s.t0) / 1000, p = s.q('path'), lab = s.q('.label');
      if (t >= 2.3) { s.t0 = 0; p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; lab.style.transform = ''; return; }
      s.until = s.now + 500;
      var u = t < .55 ? ease(t / .55) : t < 1.75 ? 1 : 1 - ease((t - 1.75) / .55);
      p.style.strokeDasharray = CHK_D.toFixed(2) + ' ' + CHK_L.toFixed(2);
      p.style.strokeDashoffset = (-(CHK_L - CHK_D) * u).toFixed(2);
      var v = t < .45 ? ease(t / .45) : t < 1.85 ? 1 : 1 - ease((t - 1.85) / .45);
      lab.style.transform = 'translateX(' + px(120 * v) + ')';
    }, init: function (s) { s.t0 = 0; s.q('path').setAttribute('d', CHK_PATH); }, up: afterStart, keyup: afterStart, cancel: afterNothing },

    /* Error settle: the button shakes sideways once, three decaying cycles in
       half a second, then stands still. No fill and no colour, just the
       refusal. A second click shakes it again. */
    shake: { frame: function (s) {
      if (!s.t0) return;
      var t = Math.max(0, s.now - s.t0) / 1000;
      if (t >= .55) { s.t0 = 0; s.el.style.transform = ''; return; }
      s.until = s.now + 500;
      s.el.style.transform = 'translateX(' + px(6 * Math.exp(-5 * t) * (1 - t / .55) * Math.sin(t * Math.PI * 12)) + ')';
    }, init: function (s) { s.t0 = 0; }, up: afterAgain, keyup: afterAgain, cancel: afterNothing },

    /* Undo countdown: the click commits and a bar along the bottom edge drains
       from full width to nothing over three seconds. Click again before it is
       gone and the countdown cancels, bar and all. */
    undo: { frame: function (s) {
      if (!s.t0) return;
      var t = Math.max(0, s.now - s.t0) / 1000, ink = s.q('.ink');
      if (t >= 3) { s.t0 = 0; ink.style.transform = ''; return; }
      s.until = s.now + 500;
      ink.style.transform = 'scaleX(' + (1 - t / 3).toFixed(4) + ')';
    }, init: function (s) { s.t0 = 0; }, up: afterToggle, keyup: afterToggle, cancel: afterNothing },

    /* ---- 20-label ---- */
    /* Scramble settle: on entry every letter cycles through random capitals,
       a new glyph every 50ms, and settles on its own letter left to right in
       about 600ms. Leaving restores the word at once. Press and the settling
       runs backwards: the letters come apart again from the right, one every
       70ms, and stop on a fixed scramble that holds while the press holds. */
    scramble: { frame: function (s) {
      stamp(s);
      var i, g, d = s.down || s.kdown;
      if (d) {
        for (i = 0; i < 6; i++) {
          g = s.src[i];
          if (s.held >= 60 + (5 - i) * 70) {
            var j = Math.floor(rnd(s.psalt * 17 + i * 29) * POOL.length);
            if (POOL.charAt(j) === s.src[i]) j = (j + 1) % POOL.length;
            g = POOL.charAt(j);
          }
          if (s.letters[i].textContent !== g) s.letters[i].textContent = g;
        }
        return;
      }
      if (!s.inside) { rest(s); return; }
      var t = s.now - s.t0, k = Math.floor(t / 50);
      for (i = 0; i < 6; i++) {
        g = t >= 150 + i * 90 ? s.src[i] : POOL.charAt(Math.floor(rnd(k * 7 + i * 13 + s.salt * 31) * POOL.length));
        if (s.letters[i].textContent !== g) s.letters[i].textContent = g;
      }
    }, init: function (s) { keepBox(s); s.psalt = 1; },
      down: function (s) { s.psalt++; }, keydown: function (s) { s.psalt++; },
      up: function (s) { s.t0 = s.now; s.salt++; }, keyup: function (s) { s.t0 = s.now; s.salt++; } },

    /* Typewriter reveal: on entry the word is wiped and retyped from the
       side the pointer came in by, one letter every 85ms, a 2px caret on the
       letter about to appear. Letters are hidden by transparent colour so
       the boxes hold; the caret is an inset shadow so no width is added.
       Press and the caret grows: the same 2px bar widens across the cell it
       sits on until it fills it, and the letter reverses out of the block. */
    type: { frame: function (s) {
      stamp(s);
      var d = s.down || s.kdown;
      if (!s.inside && !d) { rest(s); return; }
      var n = s.inside ? Math.min(6, 1 + Math.floor((s.now - s.t0) / 85)) : 6;
      var rtl = s.entry === 'right', ord = fromSide(s.entry);
      var cw = (d && n >= 6) ? clamp(s.held / 160, 0, 1) : 0, hit = (d && n >= 6) ? 5 : -1;
      for (var o = 0; o < 6; o++) {
        var L = s.letters[ord[o]], c = o < n ? '' : 'transparent';
        var w = o === hit ? 2 + (((s.wu && s.wu[ord[o]]) || 20) - 2) * cw : 0;
        var b = o === n && n < 6 ? 'inset ' + (rtl ? '-2px' : '2px') + ' 0 0 #fff'
          : w > .05 ? 'inset ' + (rtl ? '-' : '') + w.toFixed(2) + 'px 0 0 #fff' : '';
        if (o === hit && cw > .995) c = '#000';                  /* the block has covered the cell: reverse the letter out */
        if (L.style.color !== c) L.style.color = c;
        if (L.style.boxShadow !== b) L.style.boxShadow = b;
      }
    }, init: keepBox },

    /* Word swap by direction: come in from the left half and the word stays
       BUTTON; come in from the right half and it reads BOUTON, the letters
       that differ swapping one by one from the side of entry. A top or
       bottom entry counts as the half it crossed. On exit they swap back one
       by one from the side of exit. Press and the swap runs the other way
       from whichever word is showing: the two letters that differ change
       over again, so a press reads the word that the entry side did not. */
    swap: { frame: function (s) {
      stamp(s);
      var i, j, o, ord, t, L;
      if (s.down || s.kdown) {
        var alt = s.inside && halfOf(s, s.entry, s.ex) === 'right';    /* showing BOUTON already: press puts BUTTON back */
        ord = fromSide(alt ? 'left' : 'right');
        for (o = 0, j = 0; o < 6; o++) {
          i = ord[o]; if (ALT.charAt(i) === s.src[i].toUpperCase()) continue;
          L = s.letters[i]; var gp = s.held >= 60 + j * 110 ? (alt ? s.src[i] : ALT.charAt(i)) : (alt ? ALT.charAt(i) : s.src[i]); j++;
          if (L.textContent !== gp) L.textContent = gp;
        }
        return;
      }
      if (s.inside) {
        if (halfOf(s, s.entry, s.ex) !== 'right') { rest(s); return; }
        t = s.now - s.t0; ord = fromSide('right');
        for (o = 0, j = 0; o < 6; o++) {
          i = ord[o]; if (ALT.charAt(i) === s.src[i].toUpperCase()) continue;
          L = s.letters[i]; var g = t >= 80 + j * 110 ? ALT.charAt(i) : s.src[i]; j++;
          if (L.textContent !== g) L.textContent = g;
        }
        return;
      }
      t = s.now - s.tx; ord = fromSide(halfOf(s, s.exit, s.xx));
      for (o = 0, j = 0; o < 6; o++) {
        i = ord[o]; if (ALT.charAt(i) === s.src[i].toUpperCase()) continue;
        L = s.letters[i]; if (t >= j * 110 && L.textContent !== s.src[i]) L.textContent = s.src[i]; j++;
      }
    }, init: keepBox },

    /* Case morph: letters drop to their source case one by one, spreading
       out from the point of entry at about a letter every 65ms, and climb
       back to capitals spreading from the point of exit. Lowercase glyphs
       are narrower, so the word is re-packed at natural spacing inside the
       fixed label box rather than left gappy in the capital-width cells. */
    case: { frame: function (s) {
      stamp(s);
      if (!s.cxs) { pack(s); return; }
      var i, L, v, d = s.down || s.kdown;
      if (d) {                                    /* the fall of case rolls back, and stops at the press point */
        var px0 = clamp(s.qx, s.cxs[0] - 40, s.cxs[5] + 40);
        for (i = 0; i < 6; i++) {
          L = s.letters[i];
          v = (s.cxs[i] <= px0 && px0 - s.cxs[i] <= s.held * 0.15) ? '' : L.style.textTransform;
          if (L.style.textTransform !== v) L.style.textTransform = v;
        }
        pack(s);
        return;
      }
      var t = s.inside ? s.now - s.t0 : s.now - s.tx, x = clamp(s.inside ? s.ox : s.xx, s.cxs[0], s.cxs[5]);
      for (i = 0; i < 6; i++) {
        L = s.letters[i];
        var hit = Math.abs(s.cxs[i] - x) <= t * 0.15;
        v = s.inside ? (hit ? 'none' : L.style.textTransform) : (hit ? '' : L.style.textTransform);
        if (L.style.textTransform !== v) L.style.textTransform = v;
      }
      pack(s);
    }, init: function (s) { keepBox(s, 1); s.qx = W / 2; }, enter: centres,
      down: function (s) { s.qx = s.lx; }, keydown: function (s) { s.qx = W / 2; } },
  };

  if (RM) { window.PFX = PFX; return; }

  /* ---- registration ---- */
  var live = [], running = false, items = [];
  document.querySelectorAll('[data-p]').forEach(function (el) {
    var def = PFX[el.dataset.p]; if (!def) return;
    var s = {
      el: el, def: def, r: null, reach: def.reach || 0,
      inside: false, near: 0, lx: 80, ly: 24, nx: 0, ny: 0, dx: 0, dy: 0,
      vx: 0, vy: 0, plx: 80, ply: 24, px_: 80, py_: 24, ex: 80, ey: 24, entry: 'left', exit: 'right', ang: 0, down: false, rip: 1,
      a: sp(), b: sp(), c: sp(), o: [sp(), sp(), sp(), sp()], m: [sp(), sp(), sp(), sp(), sp(), sp(), sp(), sp()], x: [], until: 0,
      spd: 0, espd: 0, rx: -1e9, ry: -1e9, eth: Math.PI, xth: 0, oside: 'left', lxr: 80, lyr: 24, dw: 0, pin: 0,
      q: function (sel) { return el.querySelector(sel); }
    };
    s.pressure = 0; s.tiltX = 0; s.tiltY = 0; s.ptype = 'mouse'; s.downT = 0; s.held = 0; s.now = 0;
    s.focused = false; s.fdir = 'fwd'; s.kdown = false; s.lastT = 0;
    if (def.init) def.init(s);
    if (def.svg === 'corner') s.q('path').setAttribute('d', cornerPath([[0, 0], [0, 0], [0, 0], [0, 0]]));
    else if (def.svg) s.q('path').setAttribute('d', edgePath([0, 0, 0, 0]));
    /* press, hold, release. up() runs on release over the button, cancel() when
       the pointer leaves while down (falls back to up); held is ms since down */
    function release(hook) {
      if (!s.down) return; s.down = false; s.held = performance.now() - s.downT;
      if (hook === 'cancel' && def.cancel) def.cancel(s); else if (def.up) def.up(s);
      wake(s);
    }
    el.addEventListener('pointerdown', function (e) {
      s.down = true; s.downT = performance.now(); s.held = 0; s.pressure = e.pressure;
      if (def.down) def.down(s); wake(s);
    });
    el.addEventListener('pointerup', function () { release('up'); });
    el.addEventListener('pointerleave', function () { release('cancel'); });
    /* keyboard and focus. fdir is 'fwd' after Tab and 'back' after Shift-Tab;
       Space and Enter set kdown so press effects can run from the keyboard */
    el.addEventListener('focus', function () { s.focused = true; s.fdir = FDIR; if (def.focus) def.focus(s); wake(s); });
    el.addEventListener('blur', function () { s.focused = false; if (s.kdown) { s.kdown = false; if (def.keyup) def.keyup(s); } if (def.blur) def.blur(s); wake(s); });
    el.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'Enter') { s.kdown = true; s.downT = performance.now(); s.held = 0; if (def.keydown) def.keydown(s); }
      if (def.key) def.key(s, e); wake(s);
    });
    el.addEventListener('keyup', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && s.kdown) { s.kdown = false; s.held = performance.now() - s.downT; if (def.keyup) def.keyup(s); }
      wake(s);
    });
    items.push(s);
  });
  if (!items.length) return;
  var FDIR = 'fwd';
  addEventListener('keydown', function (e) { if (e.key === 'Tab') FDIR = e.shiftKey ? 'back' : 'fwd'; }, true);
  addEventListener('pointerup', function () { for (var i = 0; i < items.length; i++) if (items[i].down) { items[i].down = false; items[i].held = performance.now() - items[i].downT; if (items[i].def.up) items[i].def.up(items[i]); wake(items[i]); } });

  function measure() { items.forEach(function (s) { s.r = s.el.getBoundingClientRect(); }); }
  measure();
  addEventListener('resize', measure, { passive: true });
  addEventListener('scroll', measure, { passive: true, capture: true });

  /* ---- one pointer stream feeds every specimen ---- */
  var lastT = 0;
  addEventListener('pointermove', function (e) {
    var now = e.timeStamp, dt = Math.min(Math.max(now - lastT, 8), 64); lastT = now;
    for (var i = 0; i < items.length; i++) read(items[i], e.clientX, e.clientY, dt, e);
  }, { passive: true });

  function read(s, cx, cy, dt, e) {
    var r = s.r; if (!r) return;
    var lx = cx - r.left, ly = cy - r.top;
    s.pressure = e.pressure || 0; s.tiltX = e.tiltX || 0; s.tiltY = e.tiltY || 0; s.ptype = e.pointerType || 'mouse';
    var inside = lx >= 0 && ly >= 0 && lx <= r.width && ly <= r.height;
    var ox = lx < 0 ? -lx : lx > r.width ? lx - r.width : 0;
    var oy = ly < 0 ? -ly : ly > r.height ? ly - r.height : 0;
    var out = Math.sqrt(ox * ox + oy * oy);
    var near = s.reach ? Math.max(0, 1 - out / s.reach) : (inside ? 1 : 0);
    if (!near && !s.near && !s.inside && !s.until) return;            /* far away, stay idle */

    if (inside && !s.inside) {
      var c = cross(s.rx, s.ry, lx, ly, r);              /* where the last segment crossed the border */
      s.entry = c[0]; s.ex = c[1]; s.ey = c[2];
      s.eth = Math.atan2(s.ey - r.height / 2, s.ex - r.width / 2);
      s.espd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (s.def.enter) s.def.enter(s);
    }
    if (!inside && s.inside) {
      var x = cross(lx, ly, s.rx, s.ry, r);              /* same segment, walked the other way */
      s.exit = x[0]; s.xth = Math.atan2(x[2] - r.height / 2, x[1] - r.width / 2);
    }
    s.rx = lx; s.ry = ly;
    if (!inside) s.oside = ox >= oy ? (lx < 0 ? 'left' : 'right') : (ly < 0 ? 'top' : 'bottom');
    s.lxr = lx; s.lyr = ly;
    s.inside = inside; s.near = near;
    s.lx = clamp(lx, 0, r.width); s.ly = clamp(ly, 0, r.height);
    s.nx = (s.lx / r.width - .5) * 2; s.ny = (s.ly / r.height - .5) * 2;
    s.dx = cx - (r.left + r.width / 2); s.dy = cy - (r.top + r.height / 2);
    if (!s.seen) { s.seen = 1; s.plx = s.lx; s.ply = s.ly; }   /* no spike on the first sample */
    var rvx = (s.lx - s.plx) / dt * 16, rvy = (s.ly - s.ply) / dt * 16;
    s.plx = s.lx; s.ply = s.ly;
    s.vx += (rvx - s.vx) * .35; s.vy += (rvy - s.vy) * .35;
    s.spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy); s.lastT = performance.now();
    wake(s);
  }

  /* where the segment from an outside point (ax, ay) to an inside point
     (bx, by) crosses the box: [edge, x, y]. Falls back to the nearest edge
     when there is no usable outside sample (first event lands inside). */
  function cross(ax, ay, bx, by, r) {
    var dx = bx - ax, dy = by - ay, best = -1, edge = null;
    function hit(t, e) { if (t >= 0 && t <= 1 && t > best) { best = t; edge = e; } }
    if (dx > 0 && ax < 0) hit(-ax / dx, 'left');
    if (dx < 0 && ax > r.width) hit((r.width - ax) / dx, 'right');
    if (dy > 0 && ay < 0) hit(-ay / dy, 'top');
    if (dy < 0 && ay > r.height) hit((r.height - ay) / dy, 'bottom');
    if (edge === null) {
      var d = [by, r.width - bx, r.height - by, bx], n = ['top', 'right', 'bottom', 'left'], mi = 0;
      for (var i = 1; i < 4; i++) if (d[i] < d[mi]) mi = i;
      return [n[mi], clamp(bx, 0, r.width), clamp(by, 0, r.height)];
    }
    return [edge, clamp(ax + dx * best, 0, r.width), clamp(ay + dy * best, 0, r.height)];
  }

  /* ---- frame loop: runs only while something is settling ---- */
  function wake(s) {
    s.until = performance.now() + 1800;                 /* long enough for the loosest spring */
    if (live.indexOf(s) < 0) live.push(s);
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick(t) {
    for (var i = live.length - 1; i >= 0; i--) {
      var s = live[i];
      s.now = t; if (s.down || s.kdown) s.held = t - s.downT;
      if ((!s.inside && !s.down && !s.near) || t - s.lastT > 50) { s.vx *= .8; s.vy *= .8; }   /* no event for 50ms: the pointer rests */
      s.spd *= .9;
      s.def.frame(s);
      if (t > s.until && !s.inside && !s.down && !s.kdown && !s.focused) {
        snap(s.a); snap(s.b); snap(s.c); s.o.forEach(snap); s.m.forEach(snap); s.x.forEach(snap);   /* land exactly on rest */
        s.def.frame(s);
        live.splice(i, 1);
      }
    }
    if (live.length) requestAnimationFrame(tick); else running = false;
  }

  window.PFX = PFX;
})();
