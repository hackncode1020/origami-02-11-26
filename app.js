/* Origami Love 📄❤️ by @hack.n.code (Day 7/100)
   One sheet of paper folds itself: square -> crane -> heart -> love note.
   Pure canvas 2D + a tiny hand-written 3D engine. No libraries. */
(() => {
'use strict';
const Q = new URLSearchParams(location.search);
const DEMO = Q.has('demo'), REC = Q.has('rec');
const NAME = (Q.get('name') || '').replace(/[<>]/g, '').trim().slice(0, 16);
const $ = s => document.querySelector(s);
const cv = $('#c'), cx = cv.getContext('2d');

/* ---------- story timeline (seconds after the tap) ---------- */
const T = {
  f1: 3.0, f1e: 5.0, f2: 5.3, f2e: 7.3, crane: 7.7, cranee: 11.2, fly: 13.4, flye: 18.8,
  unf: 19.0, unfe: 21.8, heart: 22.0, hearte: 25.0, conf: 24.8, open: 28.6, opene: 30.6,
  write: 30.8, writee: 34.2, close: 36.6, closee: 37.5, gather: 37.2, gathere: 40.8,
  glow: 40.3, words: 40.9, wordse: 42.3, buttons: 43.0, done: 43.8
};
const CAPS = [
  ['one sheet of paper… 📄', 0.4, 2.9],
  ['one fold…', 3.1, 5.2],
  ['…and another', 5.4, 7.5],
  ['every fold, a little closer ✨', 7.9, 11.0],
  ['it became a paper crane 🕊️', 11.3, 13.3],
  ['they say 1000 cranes grant one wish…', 13.6, 16.4],
  ['mine was always you', 16.7, 18.9],
  ['so I unfolded my wish…', 19.1, 21.8],
  ['…and folded it into a heart ❤️', 22.1, 25.0],
  ['a paper heart for every smile you gave me', 25.3, 28.4],
  ['there’s a note inside 💌', 28.6, 30.6],
  ['every heart I’ll ever fold…', 37.0, 40.4],
];
const NOTE = NAME ? ['Every fold', 'of my heart', 'leads to you,', NAME + ' ❤️'] : ['Every fold', 'of my heart', 'leads to you ❤️'];
const FINAL = NAME ? 'is yours, ' + NAME + '.' : 'is yours.';

/* ---------- helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const prog = (a, b, t) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cen = tr => [(tr[0][0] + tr[1][0] + tr[2][0]) / 3, (tr[0][1] + tr[1][1] + tr[2][1]) / 3, (tr[0][2] + tr[1][2] + tr[2][2]) / 3];
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function rotAxis(v, k, a) { // Rodrigues
  const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), kd = dot(k, v);
  return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
}
const rotY = (p, a, c = [0, 0, 0]) => { const x = p[0] - c[0], z = p[2] - c[2], C = Math.cos(a), S = Math.sin(a); return [c[0] + x * C + z * S, p[1], c[2] - x * S + z * C]; };
const rotZ = (p, a, c = [0, 0, 0]) => { const x = p[0] - c[0], y = p[1] - c[1], C = Math.cos(a), S = Math.sin(a); return [c[0] + x * C - y * S, c[1] + x * S + y * C, p[2]]; };

/* ---------- the sheet: a diamond, cut into 24 facets along its fold lines ---------- */
const S = 1.15, DESK = -1.0;
const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const BASE = [];
for (const [O, A, B] of [[[0, 0], [S, 0], [0, -S]], [[0, 0], [0, -S], [-S, 0]], [[0, 0], [-S, 0], [0, S]], [[0, 0], [0, S], [S, 0]]]) {
  const G = [(O[0] + A[0] + B[0]) / 3, (O[1] + A[1] + B[1]) / 3], a = mid2(O, A), b = mid2(A, B), c = mid2(B, O);
  BASE.push([O, a, G], [a, A, G], [A, b, G], [b, B, G], [B, c, G], [c, O, G]);
}
const N = BASE.length; // 24
const onLine = (p, q) => (Math.abs(p[0]) < 1e-6 && Math.abs(q[0]) < 1e-6) || (Math.abs(p[1]) < 1e-6 && Math.abs(q[1]) < 1e-6) ||
  (Math.abs(Math.abs(p[0]) + Math.abs(p[1]) - S) < 1e-6 && Math.abs(Math.abs(q[0]) + Math.abs(q[1]) - S) < 1e-6 && Math.sign(p[0] || q[0]) * Math.sign(p[1] || q[1]) === Math.sign(q[0] || p[0]) * Math.sign(q[1] || p[1]));
const CREASE = BASE.map(t => [onLine(t[0], t[1]), onLine(t[1], t[2]), onLine(t[2], t[0])]);
const R0 = rnd(7), AX = BASE.map(() => norm([R0() - .5, R0() - .5, R0() - .5]));

// the flat sheet, with fold 1 (near half over the far half) and fold 2 (right half over the left half)
function flatState(a1, a2) {
  return BASE.map(tr => {
    const c = [(tr[0][0] + tr[1][0] + tr[2][0]) / 3, (tr[0][1] + tr[1][1] + tr[2][1]) / 3];
    return tr.map(([x, z]) => {
      let y = 0;
      if (c[1] > 0) { const h = .007, Y = y - h, Z = z; y = Y * Math.cos(a1) + Z * Math.sin(a1) + h; z = Z * Math.cos(a1) - Y * Math.sin(a1); }
      if (c[0] > 0) { const h = .022, Y = y - h, X = x; x = X * Math.cos(a2) - Y * Math.sin(a2); y = Y * Math.cos(a2) + X * Math.sin(a2) + h; }
      return [x, y, z];
    });
  });
}
// a classic paper crane, 24 facets
const CRANE = (() => {
  const Sp = [0, .1, 0], Bb = [-.42, -.05, 0], Bf = [.42, -.05, 0], K = [0, -.4, 0];
  const tris = [];
  for (const s of [1, -1]) {
    const M = [0, -.12, .17 * s];
    tris.push([Bb, K, M], [K, Bf, M], [Bb, M, Sp], [M, Bf, Sp]);
    const nb = [.12, -.32, .04 * s], N_ = [1.05, .8, 0], hd = [1.34, .58, 0], hm = [1.0, .72, .03 * s];
    tris.push([Bf, nb, N_], [N_, hm, hd]);
    const tb = [-.12, -.32, .04 * s], Tt = [-1.14, .74, 0], Tm = [-.62, .3, .02 * s];
    tris.push([Bb, tb, Tm], [tb, Tt, Tm]);
    const Sb = [-.38, .08, 0], Sf = [.32, .08, 0], Wm = [-.12, .33, .55 * s], Wf = [.28, .3, 1.0 * s], Wb = [-.64, .84, .93 * s];
    const w = [[Sb, Sf, Wm], [Sf, Wf, Wm], [Wf, Wb, Wm], [Wb, Sb, Wm]];
    w.forEach(t => { t.wing = s; tris.push(t); });
  }
  return tris;
})();
const CRANE_WING = CRANE.map(t => t.wing || 0);
function orient(tris, center) {
  return tris.map(t => { const n = cross(sub(t[1], t[0]), sub(t[2], t[0])); return dot(n, sub(cen(t), center)) < 0 ? [t[0], t[2], t[1]] : t; });
}
const CRANE_O = orient(CRANE, [0, -.08, 0]);
// heart outline
const HK = 1.25 / 16;
const heartPt = t => [16 * Math.pow(Math.sin(t), 3) * HK, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * HK];
const HEART = (() => {
  const P = []; for (let i = 0; i < 12; i++) P.push(heartPt(i / 12 * Math.PI * 2));
  const cy = -.05, F = [0, cy, .24], Bk = [0, cy, -.24], tr = [];
  for (let i = 0; i < 12; i++) { const a = [...P[i], 0], b = [...P[(i + 1) % 12], 0]; tr.push([F, a, b]); }
  for (let i = 0; i < 12; i++) { const a = [...P[i], 0], b = [...P[(i + 1) % 12], 0]; tr.push([Bk, b, a]); }
  return orient(tr, [0, cy, 0]);
})();
const HEART_TOP = Math.max(...HEART.flat().map(p => p[1]));
const HEART_OUT = []; for (let i = 0; i < 96; i++) HEART_OUT.push(heartPt(i / 96 * Math.PI * 2));

// pairing: which crane facet / heart facet each sheet facet becomes
const baseAng = BASE.map(t => { const c = mid2(mid2(t[0], t[1]), t[2]); return Math.atan2(c[1], c[0]); });
const pairBy = (srcKey, dstKey) => { const si = srcKey.map((k, i) => [k, i]).sort((a, b) => a[0] - b[0]).map(a => a[1]); const di = dstKey.map((k, i) => [k, i]).sort((a, b) => a[0] - b[0]).map(a => a[1]); const m = []; si.forEach((s, j) => m[s] = di[j]); return m; };
const TO_CRANE = pairBy(baseAng.map(a => -a), CRANE_O.map(t => { const c = cen(t); return Math.atan2(c[1] + .05, c[0]) + (c[2] > 0 ? .001 : 0); }));
const TO_HEART = (() => {
  const order = baseAng.map((a, i) => [Math.atan2(-mid2(mid2(BASE[i][0], BASE[i][1]), BASE[i][2])[1], mid2(mid2(BASE[i][0], BASE[i][1]), BASE[i][2])[0]), i]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
  const fr = [...Array(12).keys()].map(i => [Math.atan2(cen(HEART[i])[1] + .05, cen(HEART[i])[0]), i]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
  const bk = [...Array(12).keys()].map(i => [Math.atan2(cen(HEART[12 + i])[1] + .05, cen(HEART[12 + i])[0]), 12 + i]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
  const m = []; order.forEach((s, j) => m[s] = (j % 2 ? bk : fr)[j >> 1]); return m;
})();
const ORD_C = BASE.map((_, i) => { const c = mid2(mid2(BASE[i][0], BASE[i][1]), BASE[i][2]); return clamp(Math.hypot(c[0], c[1]) / S); });
const ORD_H = BASE.map((_, i) => ((i * 7) % N) / N);

/* ---------- poses ---------- */
const CR_SCALE = 1.22, CR_Y = DESK + .4 * CR_SCALE + .012;
function cranePose(flap, pos, yaw, pitch) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const t = CRANE_O[TO_CRANE[i]], w = CRANE_WING[TO_CRANE[i]];
    out.push(t.map(p => {
      let q = p;
      if (w && Math.abs(p[2]) > .01) { const Y = q[1] - .08, Z = q[2], a = flap * w; q = [q[0], Y * Math.cos(a) + Z * Math.sin(a) * w * w + .08, Z * Math.cos(a) - Y * Math.sin(a)]; }
      q = mul(q, CR_SCALE); q = rotZ(q, pitch); q = rotY(q, yaw); return add(q, [pos[0], pos[1] + CR_Y, pos[2]]);
    }));
  }
  return out;
}
const UP_Y = .32;
function upright(yaw) { return BASE.map(t => t.map(([x, z]) => rotY([x * 1.02, -z * 1.02 + UP_Y, 0], yaw, [0, UP_Y, 0]))); }
function heartPose(yaw, bob, lid, scale = 1) {
  return BASE.map((_, i) => {
    const j = TO_HEART[i], tr = HEART[j];
    return tr.map(p => {
      let q = p;
      if (j < 12 && lid) { const X = q[0] + 1.25, Z = q[2]; q = [X * Math.cos(lid) - Z * Math.sin(lid) - 1.25, q[1], X * Math.sin(lid) + Z * Math.cos(lid)]; }
      q = mul(q, scale); q = rotY(q, yaw); return add(q, [0, UP_Y + bob, 0]);
    });
  });
}
function morph(A, B, p, ord, spread, lift, flut, spin = 0) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const e = ease((p - ord[i] * spread) / (1 - spread));
    const a = A[i], b = B[i], ca = cen(a), cb = cen(b), c = lerp3(ca, cb, e);
    c[1] += lift * Math.sin(Math.PI * e);
    const ang = flut * Math.sin(Math.PI * e) * (i % 2 ? 1 : -1);
    out.push([0, 1, 2].map(k => { let r = lerp3(sub(a[k], ca), sub(b[k], cb), e); r = rotAxis(r, AX[i], ang); if (spin) r = rotY(r, spin * Math.sin(Math.PI * e)); return add(c, r); }));
  }
  return out;
}
const flatYaw = t => -.32 + .1 * sm(prog(0, T.f2e, t)) - .5 * sm(prog(T.f2 - .2, T.f2e, t)) * 0;
function flapAt(t) { const u = prog(T.fly, T.flye, t), amp = .78 * Math.pow(Math.sin(Math.PI * u), .5); return -.15 * Math.sin(Math.PI * u) + amp * Math.sin(2 * Math.PI * 2.1 * (t - T.fly)) + .06 * Math.sin(t * 1.7); }
function flyPose(t) {
  const u = prog(T.fly, T.flye, t), s = Math.sin(Math.PI * sm(u));
  const pos = [.3 * Math.sin(2 * Math.PI * u) * s, .72 * Math.pow(s, .8), .3 * s];
  const yaw = .5 + .45 * Math.sin(2 * Math.PI * u) * s;
  const pitch = .22 * Math.cos(Math.PI * u) * s;
  return { pos, yaw, pitch, flap: flapAt(t) };
}

/* ---------- camera ---------- */
const CAMK = [ // t, target y, pitch, distance
  [0, -.98, .78, 5.3], [3, -.98, .78, 5.3], [7.4, -.85, .62, 5.3], [10.8, -.3, .36, 6.3], [18.6, -.3, .36, 6.3], [21.5, .2, .2, 6.2],
  [28.4, .2, .2, 6.2], [30.2, .3, .16, 6.0], [36.4, .3, .16, 6.0], [37.6, .3, .2, 6.6], [99, .3, .2, 6.6]];
function camAt(t) {
  for (let i = 0; i < CAMK.length - 1; i++) { const a = CAMK[i], b = CAMK[i + 1]; if (t <= b[0]) { const k = sm(prog(a[0], b[0], t)); return { ty: lerp(a[1], b[1], k), ph: lerp(a[2], b[2], k), D: lerp(a[3], b[3], k) }; } }
  const l = CAMK[CAMK.length - 1]; return { ty: l[1], ph: l[2], D: l[3] };
}

/* ---------- scene at time t ---------- */
function scene(t) {
  let tris, flatW = 0, alpha = 1, lid = 0, red2 = 0;
  if (t < T.crane) {
    const drop = 1 - ease(prog(-.2, 1.6, t));
    const F = flatState(Math.PI * ease(prog(T.f1, T.f1e, t)), Math.PI * ease(prog(T.f2, T.f2e, t)));
    const sh = sm(prog(T.f2 + .4, T.crane, t)) * S / 3, yaw = flatYaw(t);
    tris = F.map(tr => tr.map(p => { let q = [p[0] + sh, p[1] + DESK + .004 + drop * .9, p[2] + sh]; q = rotY(q, yaw); q = rotZ(q, .25 * drop * Math.sin(t * 3)); return q; }));
    flatW = 1;
  } else if (t < T.cranee + .01) {
    const F = flatState(Math.PI, Math.PI).map(tr => tr.map(p => rotY([p[0] + S / 3, p[1] + DESK + .004, p[2] + S / 3], flatYaw(T.crane))));
    const p = prog(T.crane, T.cranee, t);
    tris = morph(F, cranePose(.05, [0, 0, 0], .5, 0), p, ORD_C, .4, .4, 1.1, .5);
    flatW = 1 - sm(p * 3); red2 = sm(p * 1.4);
  } else if (t < T.unf) {
    red2 = 1;
    const f = flyPose(t), hold = prog(T.cranee, T.fly, t);
    if (t < T.fly) tris = cranePose(.05 + .07 * Math.sin((t - T.cranee) * 2.2) * sm(hold * 2), [0, .03 * Math.sin((t - T.cranee) * 1.8), 0], .5 + .08 * Math.sin((t - T.cranee) * .9), 0);
    else tris = cranePose(f.flap, f.pos, f.yaw, f.pitch);
  } else if (t < T.unfe + .01) {
    tris = morph(cranePose(.05, [0, 0, 0], .5, 0), upright(0), prog(T.unf, T.unfe, t), ORD_C.map(o => 1 - o), .35, .25, .9, -.35); red2 = 1 - sm(prog(T.unf, T.unfe, t) * 1.6);
  } else if (t < T.heart) {
    tris = upright(0);
  } else if (t < T.hearte + .01) {
    tris = morph(upright(0), heartPose(0, 0, 0), prog(T.heart, T.hearte, t), ORD_H, .35, .2, 1.0, .45);
  } else {
    const yaw = t < T.open ? .42 * Math.sin(2 * Math.PI * sm(prog(T.hearte, T.open, t))) : 0;
    const bob = .04 * Math.sin((t - T.hearte) * 1.6) * (1 - sm(prog(T.open - 1, T.open, t))) ;
    lid = 2.62 * ease(prog(T.open, T.opene, t)) * (1 - ease(prog(T.close, T.closee, t)));
    const sc = 1 - .55 * ease(prog(T.closee - .2, T.gathere - 1.2, t));
    alpha = 1 - sm(prog(T.closee + .3, T.gathere - 1.0, t));
    tris = heartPose(yaw, bob, lid, sc);
  }
  return { tris, flatW, alpha, lid, red2 };
}

/* ---------- canvases ---------- */
let W = 0, H = 0, PR = 1, F = 1, CX = 0, CY = 0;
const bgC = document.createElement('canvas'), shC = document.createElement('canvas'), sx = shC.getContext('2d');
const hlC = document.createElement('canvas'), hx = hlC.getContext('2d');
let texPat = null;
const PAPER = { front: [214, 52, 70], back: [244, 230, 208] };
const L = norm([-.45, .82, .55]), HV = norm(add(L, [0, .3, 1]));

function paintPaperTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const R = rnd(42);
  const id = x.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = R(); const d = v < .5; id.data[i] = id.data[i + 1] = id.data[i + 2] = d ? 0 : 255; id.data[i + 3] = (R() * 16) | 0; }
  x.putImageData(id, 0, 0);
  for (let i = 0; i < 260; i++) {
    const px = R() * 256, py = R() * 256, a = R() * Math.PI, l = 6 + R() * 22;
    x.strokeStyle = R() < .55 ? `rgba(255,255,255,${.08 + R() * .12})` : `rgba(60,20,10,${.05 + R() * .08})`; x.lineWidth = .6 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + (R() - .5) * 6, py + Math.sin(a) * l * .5 + (R() - .5) * 6, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  texPat = cx.createPattern(c, 'repeat');
}

function paintDesk() {
  bgC.width = W * PR; bgC.height = H * PR; const x = bgC.getContext('2d'); x.scale(PR, PR);
  const R = rnd(20261102), hz = H * .2;
  // wall
  let g = x.createLinearGradient(0, 0, 0, hz + 30); g.addColorStop(0, '#120806'); g.addColorStop(1, '#2a1610');
  x.fillStyle = g; x.fillRect(0, 0, W, hz + 30);
  // fairy-light bokeh on the wall
  for (let i = 0; i < 26; i++) {
    const bx = R() * W, by = hz * (.15 + R() * .8), r = Math.min(W, H) * (.02 + R() * .045), a = .18 + R() * .3;
    const gg = x.createRadialGradient(bx, by, 0, bx, by, r); const warm = R() < .8;
    gg.addColorStop(0, warm ? `rgba(255,200,120,${a})` : `rgba(255,140,150,${a})`); gg.addColorStop(.75, warm ? `rgba(255,180,100,${a * .8})` : `rgba(255,120,140,${a * .8})`); gg.addColorStop(1, 'rgba(255,170,90,0)');
    x.fillStyle = gg; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill();
  }
  // desk: warm walnut wood with perspective grain
  g = x.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#3b2015'); g.addColorStop(.35, '#5a321e'); g.addColorStop(.7, '#4a2817'); g.addColorStop(1, '#22110a');
  x.fillStyle = g; x.fillRect(0, hz, W, H - hz);
  g = x.createLinearGradient(0, hz - 6, 0, hz + 18); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.4, 'rgba(255,200,150,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, hz - 6, W, 24);
  for (let i = 0; i < 150; i++) {
    const u = R(), yy = hz + (H - hz) * Math.pow(u, 1.7), amp = 2 + R() * 6, ph = R() * 9, fr = .004 + R() * .01;
    x.strokeStyle = R() < .6 ? `rgba(20,8,3,${.08 + R() * .14})` : `rgba(255,190,140,${.03 + R() * .06})`;
    x.lineWidth = .6 + R() * 1.6 * (.3 + u); x.beginPath();
    for (let xx = -10; xx <= W + 10; xx += 8) { const y2 = yy + Math.sin(xx * fr + ph) * amp * (.3 + u) + Math.sin(xx * fr * 3.1 + ph) * amp * .25; xx < 0 ? x.moveTo(xx, y2) : x.lineTo(xx, y2); }
    x.stroke();
  }
  // lamp light pool (warm, from the upper left)
  x.globalCompositeOperation = 'lighter';
  g = x.createRadialGradient(W * .42, H * .52, 0, W * .42, H * .52, Math.max(W, H) * .62);
  g.addColorStop(0, 'rgba(255,170,100,.30)'); g.addColorStop(.45, 'rgba(255,130,70,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  // vignette
  g = x.createRadialGradient(W * .5, H * .5, Math.min(W, H) * .3, W * .5, H * .5, Math.hypot(W, H) * .62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,3,1,.72)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  // grain
  const id = x.getImageData(0, 0, bgC.width, bgC.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(id, 0, 0);
}

function layout() {
  W = innerWidth; H = innerHeight; PR = REC ? devicePixelRatio : Math.min(2, devicePixelRatio || 1);
  cv.width = W * PR; cv.height = H * PR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  shC.width = Math.ceil(W / 4); shC.height = Math.ceil(H / 4);
  hlC.width = W * PR; hlC.height = H * PR;
  F = Math.min(2.15 * W, 1.22 * H); CX = W / 2; CY = H * .5;
  paintDesk(); if (!texPat) paintPaperTex();
  buildFormation();
}

/* ---------- 3D draw ---------- */
let cam = camAt(0);
function view(p) {
  const x = p[0], y = p[1] - cam.ty, z = p[2], c = Math.cos(cam.ph), s = Math.sin(cam.ph);
  return [x, y * c - z * s, y * s + z * c];
}
function proj(v) { const d = cam.D - v[2]; return [CX + F * v[0] / d, CY - F * v[1] / d, d]; }
function affine(u, s) { // uv triangle -> screen triangle
  const [u0, v0] = u[0], [u1, v1] = u[1], [u2, v2] = u[2];
  const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0); if (Math.abs(det) < 1e-9) return null;
  const a = ((s[1][0] - s[0][0]) * (v2 - v0) - (s[2][0] - s[0][0]) * (v1 - v0)) / det;
  const c = ((s[2][0] - s[0][0]) * (u1 - u0) - (s[1][0] - s[0][0]) * (u2 - u0)) / det;
  const b = ((s[1][1] - s[0][1]) * (v2 - v0) - (s[2][1] - s[0][1]) * (v1 - v0)) / det;
  const d = ((s[2][1] - s[0][1]) * (u1 - u0) - (s[1][1] - s[0][1]) * (u2 - u0)) / det;
  return [a, b, c, d, s[0][0] - a * u0 - c * v0, s[0][1] - b * u0 - d * v0];
}
function shadeCol(base, k, spec) { return `rgb(${clamp(base[0] * k + spec, 0, 255) | 0},${clamp(base[1] * k + spec, 0, 255) | 0},${clamp(base[2] * k + spec, 0, 255) | 0})`; }

function drawPaper(sc, t, afterBack) {
  const { tris, flatW, alpha, lid, red2 } = sc;
  const items = [];
  let minY = 9, sumY = 0;
  for (let i = 0; i < N; i++) {
    const tr = tris[i], v = tr.map(view), s = v.map(proj);
    const n = norm(cross(sub(tr[1], tr[0]), sub(tr[2], tr[0])));
    const nv = cross(sub(v[1], v[0]), sub(v[2], v[0])), c = cen(v);
    const facing = dot(nv, [-c[0], -c[1], cam.D - c[2]]) > 0;
    const c3 = cen(tr); for (const p of tr) minY = Math.min(minY, p[1]); sumY += c3[1];
    const depth = cam.D - c[2];
    items.push({ i, tr, s, n: facing ? n : mul(n, -1), facing, key: depth - flatW * 1000 * c3[1], lidTri: lid > .02 && TO_HEART[i] < 12 });
  }
  // soft shadow on the desk
  const hAvg = sumY / N - DESK;
  if (alpha > .01) {
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, shC.width, shC.height); sx.fillStyle = '#000';
    const Ls = mul(L, -1);
    sx.beginPath();
    for (const it of items) {
      const pts = it.tr.map(p => { const k = (p[1] - DESK) / -Ls[1]; return proj(view([p[0] + Ls[0] * k, DESK, p[2] + Ls[2] * k])); });
      sx.moveTo(pts[0][0] / 4, pts[0][1] / 4); sx.lineTo(pts[1][0] / 4, pts[1][1] / 4); sx.lineTo(pts[2][0] / 4, pts[2][1] / 4); sx.closePath();
    }
    sx.fill();
    cx.save(); cx.globalAlpha = alpha * clamp(.62 - hAvg * .16, .16, .62);
    cx.filter = `blur(${(1.5 + Math.max(0, minY - DESK) * 9) * PR}px)`;
    cx.drawImage(shC, 0, 0, shC.width, shC.height, 0, 0, shC.width * 4 * PR, shC.height * 4 * PR);
    cx.restore();
    // contact shadow when touching the desk
    if (minY - DESK < .06) { cx.save(); cx.globalAlpha = .35 * alpha; cx.filter = `blur(${.8 * PR}px)`; cx.drawImage(shC, 0, 0, shC.width, shC.height, 0, 0, shC.width * 4 * PR, shC.height * 4 * PR); cx.restore(); }
  }
  items.sort((a, b) => b.key - a.key);
  cx.save(); cx.scale(PR, PR); cx.globalAlpha = alpha; cx.lineJoin = 'round';
  const pass = it => {
    const s = it.s, base = it.facing ? PAPER.front : (red2 ? PAPER.back.map((v, j) => lerp(v, PAPER.front[j], red2)) : PAPER.back);
    const dif = Math.max(0, dot(it.n, L)), spec = Math.pow(Math.max(0, dot(it.n, HV)), 24) * 60;
    const bk = it.facing ? 0 : 1 - red2, k = lerp(.5 + .62 * dif, .7 + .26 * dif, bk);
    const col = shadeCol(base, k, spec);
    cx.beginPath(); cx.moveTo(s[0][0], s[0][1]); cx.lineTo(s[1][0], s[1][1]); cx.lineTo(s[2][0], s[2][1]); cx.closePath();
    cx.fillStyle = col; cx.fill(); cx.strokeStyle = col; cx.lineWidth = .9; cx.stroke();
    const m = affine(BASE[it.i], s);
    if (m && texPat && Math.abs(m[0] * m[3] - m[1] * m[2]) > 4) {
      texPat.setTransform(new DOMMatrix([m[0] * 1.15 / 256, m[1] * 1.15 / 256, m[2] * 1.15 / 256, m[3] * 1.15 / 256, m[4], m[5]]));
      cx.fillStyle = texPat; cx.globalAlpha = alpha * .9; cx.fill(); cx.globalAlpha = alpha;
    }
    // creases and paper edges
    const cr = CREASE[it.i];
    for (let e = 0; e < 3; e++) {
      const a = s[e], b = s[(e + 1) % 3];
      const w = cr[e] ? .55 : (1 - flatW) * .28; if (w < .02) continue;
      cx.strokeStyle = `rgba(255,236,220,${.22 * w})`; cx.lineWidth = .8; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke();
      cx.strokeStyle = `rgba(60,10,10,${.16 * w})`; cx.lineWidth = .6; cx.beginPath(); cx.moveTo(a[0] + .7, a[1] + .7); cx.lineTo(b[0] + .7, b[1] + .7); cx.stroke();
    }
  };
  for (const it of items) if (!it.lidTri) pass(it);
  cx.restore();
  if (afterBack) afterBack();
  cx.save(); cx.scale(PR, PR); cx.globalAlpha = alpha; cx.lineJoin = 'round';
  for (const it of items) if (it.lidTri) pass(it);
  cx.restore();
}

/* ---------- the note inside the heart ---------- */
function drawNote(t) {
  const k = prog(T.open + .6, T.opene, t) * (1 - prog(T.close, T.close + .5, t));
  if (k <= 0) return;
  const pts = HEART_OUT.map(([x, y]) => proj(view([x * .93, y * .93 - .05 * .07 + UP_Y, -.02])));
  cx.save(); cx.scale(PR, PR); cx.globalAlpha = k;
  cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])); cx.closePath();
  const c0 = proj(view([0, UP_Y + .1, 0]));
  const g = cx.createRadialGradient(c0[0], c0[1], 0, c0[0], c0[1], W * .6);
  g.addColorStop(0, 'rgba(255,248,236,1)'); g.addColorStop(1, 'rgba(240,222,198,1)');
  cx.fillStyle = g; cx.fill(); cx.save(); cx.clip();
  if (texPat) { texPat.setTransform(new DOMMatrix([.5, 0, 0, .5, 0, 0])); cx.globalAlpha = k * .7; cx.fillStyle = texPat; cx.fillRect(0, 0, W, H); cx.globalAlpha = k; }
  // handwriting, revealed stroke by stroke
  const sc = F / cam.D; let fs = sc * (NOTE.length > 3 ? .34 : .4);
  cx.font = `700 ${fs}px Caveat, cursive`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = `700 ${fs}px Caveat, cursive`;
  const lines = NOTE, n = lines.length;
  const span = yy => { let lo = 1e9, hi = -1e9; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > yy) !== (b[1] > yy)) { const xx = a[0] + (b[0] - a[0]) * (yy - a[1]) / (b[1] - a[1]); lo = Math.min(lo, xx); hi = Math.max(hi, xx); } } return [lo, hi]; };
  let lh, y0;
  for (let it = 0; it < 3; it++) {
    lh = fs * 1.02; y0 = c0[1] - lh * (n - 1) / 2 - fs * .62; let k2 = 1;
    for (let i = 0; i < n; i++) { const yy = y0 + i * lh, s1 = span(yy - fs * .3), s2 = span(yy + fs * .3), wAv = Math.min(s1[1] - s1[0], s2[1] - s2[0]) * .84 - Math.abs(c0[0] - (s2[0] + s2[1]) / 2) * 2; k2 = Math.min(k2, wAv / cx.measureText(lines[i]).width); }
    if (k2 >= 1) break; fs *= Math.max(.7, k2); cx.font = `700 ${fs}px Caveat, cursive`;
  }
  const wp = prog(T.write, T.writee, t) * n;
  for (let i = 0; i < n; i++) {
    const r = clamp(wp - i); if (r <= 0) break;
    const tw = cx.measureText(lines[i]).width, x0 = c0[0] - tw / 2 - 4, yy = y0 + i * lh;
    cx.save(); cx.beginPath(); cx.rect(x0, yy - fs, (tw + 8) * r, fs * 2); cx.clip();
    cx.fillStyle = '#8a1f2c'; cx.shadowColor = 'rgba(120,20,30,.25)'; cx.shadowBlur = 2; cx.fillText(lines[i], c0[0], yy); cx.restore();
    if (r < 1) { const px = x0 + (tw + 8) * r; cx.fillStyle = 'rgba(138,31,44,.9)'; cx.beginPath(); cx.arc(px, yy + fs * .18, fs * .045, 0, 7); cx.fill(); }
  }
  cx.restore();
  // soft inner shading along the edge
  cx.lineWidth = 3; cx.strokeStyle = 'rgba(120,60,40,.25)'; cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])); cx.closePath(); cx.stroke();
  cx.restore();
}

/* ---------- little folded paper hearts ---------- */
const MINI_COLS = [[226, 58, 74], [240, 96, 112], [250, 150, 160], [205, 40, 60], [255, 186, 178], [236, 120, 96], [248, 226, 208]];
function miniHeart(x, y, s, rot, flip, col, a, x2) {
  const ctx = x2 || cx;
  const fc = Math.cos(flip), front = fc >= 0, sxk = Math.max(.08, Math.abs(fc));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sxk * s, s); ctx.globalAlpha = a;
  const c = front ? col : [248, 236, 216];
  ctx.beginPath(); HEART_OUT.forEach(([hx, hy], i) => { const px = hx / 1.25, py = -(hy - .12) / 1.25; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath();
  ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(-1.2, -1.2, 1.2, 2.4);
  ctx.fillStyle = 'rgba(70,0,10,.16)'; ctx.beginPath(); ctx.moveTo(0, -.45); ctx.lineTo(1.2, -1.2); ctx.lineTo(1.2, 1.4); ctx.lineTo(0, 1.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(-1.2, -1.2); ctx.lineTo(0, -.45); ctx.lineTo(-1.2, .1); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(90,10,20,.25)'; ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(0, -.45); ctx.lineTo(0, 1.05); ctx.stroke();
  ctx.restore();
}
const CONF = (() => { const R = rnd(77), a = []; for (let i = 0; i < 46; i++) a.push({ x: R(), t0: T.conf + R() * 7.5, fr: 0, v: .1 + R() * .09, sw: R() * 6, sa: .02 + R() * .05, rs: (R() - .5) * 2.5, fs: 1.5 + R() * 3, s: .028 + R() * .03, c: MINI_COLS[(R() * MINI_COLS.length) | 0], front: R() < .45 }); return a; })();
function drawConfetti(t, front) {
  if (t < T.conf || t > T.gathere) return;
  cx.save(); cx.scale(PR, PR);
  const m = Math.min(W, H * .62);
  for (const p of CONF) {
    if (p.front !== front) continue;
    if (front && p.t0 > T.open - 2.2) continue;
    const dt = t - p.t0; if (dt < 0) continue;
    const y = -m * .1 + dt * p.v * H, x = p.x * W + Math.sin(dt * 1.3 + p.sw) * W * p.sa;
    if (y > H + 40) continue;
    const fade = 1 - sm(prog(T.gather - .2, T.gather + .8, t));
    miniHeart(x, y, p.s * m * (front ? 1.35 : 1), Math.sin(dt * .9 + p.sw) * .6 + p.rs * .2, dt * p.fs + p.sw, p.c, fade * (front ? .95 : .85));
  }
  cx.restore();
}

/* ---------- finale: many paper hearts make one big heart ---------- */
let FORM = [];
function buildFormation() {
  const R = rnd(1402), pts = [], g = .135;
  const inside = (x, y) => { let c = false; for (let i = 0, j = HEART_OUT.length - 1; i < HEART_OUT.length; j = i++) { const [xi, yi] = HEART_OUT[i], [xj, yj] = HEART_OUT[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
  for (let y = -1.6; y < 1.3; y += g * .87) for (let x = -1.4; x < 1.4; x += g) {
    const xx = x + ((Math.round(y / (g * .87)) % 2) ? g / 2 : 0) + (R() - .5) * g * .25, yy = y + (R() - .5) * g * .25;
    if (inside(xx, yy) && inside(xx * 1.06, (yy - .02) * 1.05 + .0)) pts.push([xx, yy]);
  }
  FORM = pts.map(([x, y], i) => { const a = R() * Math.PI * 2; return { x, y, sa: a, sr: .75 + R() * .5, d: Math.hypot(x, y - .05), rot: (R() - .5) * .5, flip0: R() * 9, c: MINI_COLS[(R() * 6) | 0], s: g * (.62 + R() * .2), del: 0 }; });
  const mx = Math.max(...FORM.map(f => f.d)); FORM.forEach(f => f.del = (1 - f.d / mx) * .55 + R() * .45);
}
function drawFinale(t) {
  if (t < T.gather) return;
  const m = Math.min(W * .9, H * .46) / 2.5, ccx = W / 2, ccy = H * (H / W < 1.95 ? .39 : .42);
  const glow = sm(prog(T.glow, T.glow + 1.4, t)), pulse = 1 + .022 * Math.sin((t - T.glow) * 2.4) * glow;
  // dim the desk, then warm glow
  cx.save(); cx.scale(PR, PR);
  cx.fillStyle = `rgba(10,3,2,${.42 * sm(prog(T.gather, T.gathere, t))})`; cx.fillRect(0, 0, W, H);
  if (glow > 0) {
    cx.globalCompositeOperation = 'lighter';
    let g = cx.createRadialGradient(ccx, ccy, 0, ccx, ccy, m * 2.2);
    g.addColorStop(0, `rgba(255,120,110,${.45 * glow})`); g.addColorStop(.5, `rgba(255,80,90,${.16 * glow})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.globalCompositeOperation = 'source-over';
  }
  cx.restore();
  hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, hlC.width, hlC.height); hx.setTransform(PR, 0, 0, PR, 0, 0);
  const span = T.gathere - T.gather - 2.0;
  for (const f of FORM) {
    const st = T.gather + f.del * span, k = ease(prog(st, st + 2.0, t)); if (k <= 0) continue;
    const r0 = Math.hypot(W, H) * .62 * f.sr, sxp = ccx + Math.cos(f.sa) * r0, syp = ccy + Math.sin(f.sa) * r0;
    const tx = ccx + f.x * m * pulse, ty = ccy - f.y * m * pulse;
    const bend = Math.sin(Math.PI * k) * m * .6;
    const px = lerp(sxp, tx, k) + Math.cos(f.sa + 1.57) * bend, py = lerp(syp, ty, k) + Math.sin(f.sa + 1.57) * bend;
    const flip = (1 - k) * (f.flip0 + 6), rot = lerp(f.sa, f.rot, k);
    const lit = glow * (.5 + .5 * Math.sin(t * 3 + f.flip0));
    const c = f.c.map(v => Math.min(255, v + 40 * lit));
    miniHeart(px, py, f.s * m * pulse * .5 * (1 + .25 * (1 - k)), rot, flip, c, clamp(k * 3), hx);
  }
  if (glow > 0) { cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .75 * glow; cx.filter = `blur(${14 * PR}px)`; cx.drawImage(hlC, 0, 0); cx.restore(); }
  cx.drawImage(hlC, 0, 0);
  if (glow > 0) {
    cx.save(); cx.scale(PR, PR); cx.globalCompositeOperation = 'lighter'; const R = rnd(9);
    for (let i = 0; i < 36; i++) { const a = R() * 7, rr = m * (1.2 + R() * 1.1), tw = Math.max(0, Math.sin(t * (1.5 + R() * 2) + R() * 9)); const x = ccx + Math.cos(a) * rr, y = ccy + Math.sin(a) * rr * .9; cx.fillStyle = `rgba(255,${200 + R() * 55 | 0},170,${.7 * tw * glow})`; cx.beginPath(); cx.arc(x, y, (1 + R() * 2.2) * tw, 0, 7); cx.fill(); }
    cx.restore();
  }
  // final words
  const wk = window.__noWords ? 0 : prog(T.words, T.wordse, t);
  if (wk > 0) {
    cx.save(); cx.scale(PR, PR);
    const fs = Math.min(W * .19, H * .085); cx.font = `700 ${fs}px Caveat, cursive`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    let tw = cx.measureText(FINAL).width; if (tw > W * .9) { const f2 = fs * W * .9 / tw; cx.font = `700 ${f2}px Caveat, cursive`; tw = cx.measureText(FINAL).width; }
    const y = ccy + m * (H / W < 1.95 ? 1.55 : 1.6);
    cx.beginPath(); cx.rect(W / 2 - tw / 2 - 10, y - fs, (tw + 20) * sm(wk), fs * 2); cx.clip();
    cx.shadowColor = 'rgba(255,90,110,.95)'; cx.shadowBlur = 26; cx.fillStyle = '#fff4ec'; cx.fillText(FINAL, W / 2, y);
    cx.shadowBlur = 0; cx.fillText(FINAL, W / 2, y); cx.restore();
  }
}

/* ---------- sound: paper rustles, a soft chime, a warm pad ---------- */
let AC = null, master = null, muted = false, noiseBuf = null;
function startAudio() {
  if (REC || AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .9; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const pad = AC.createGain(); pad.gain.value = 0; pad.connect(master); pad.gain.linearRampToValueAtTime(.05, AC.currentTime + 3);
    [[174.6, 0], [220, 0], [261.6, 0], [329.6, 0]].forEach(([f]) => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f; const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = .1 + Math.random() * .1; lg.gain.value = .6; l.connect(lg); lg.connect(o.detune); o.connect(pad); o.start(); l.start(); });
    $('#snd').style.display = 'block';
  } catch (e) { AC = null; }
}
function rustle(dur = .5, vol = .5) {
  if (!AC || muted) return; const t0 = AC.currentTime;
  const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600 + Math.random() * 1800; bp.Q.value = .8;
  const g = AC.createGain(); g.gain.value = 0;
  for (let k = 0; k < dur / .035; k++) g.gain.setValueAtTime(vol * (.25 + Math.random() * .75) * Math.sin(Math.PI * k * .035 / dur), t0 + k * .035);
  g.gain.setValueAtTime(0, t0 + dur);
  src.connect(bp); bp.connect(g); g.connect(master); src.start(t0, Math.random()); src.stop(t0 + dur + .05);
}
function chime() {
  if (!AC || muted) return; const t0 = AC.currentTime;
  [880, 1318.5, 1760].forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t0 + i * .12); g.gain.linearRampToValueAtTime(.12, t0 + i * .12 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + i * .12 + 2.2); o.connect(g); g.connect(master); o.start(t0 + i * .12); o.stop(t0 + i * .12 + 2.3); });
}
const SFX = [[.3, () => rustle(.6, .35)], [T.f1 + .1, () => rustle(1.4, .5)], [T.f2 + .1, () => rustle(1.4, .5)], [T.crane + .2, () => rustle(1.2, .55)], [T.crane + 1.4, () => rustle(1.2, .5)], [T.crane + 2.5, () => rustle(.8, .4)],
  [T.fly + .3, () => rustle(4.6, .22)], [T.unf + .1, () => rustle(1.6, .5)], [T.heart + .1, () => rustle(1.6, .55)], [T.heart + 1.6, () => rustle(1, .4)], [T.open, () => rustle(.9, .45)], [T.open + .8, chime], [T.gather, () => rustle(2.4, .3)], [T.glow + .2, chime]];

/* ---------- loop ---------- */
let started = false, startAt = 0, t = 0, prevT = -1, last = 0;
function update() {
  if (started) t = (performance.now() - startAt) / 1000;
  if (started) for (const [ts, fn] of SFX) if (prevT < ts && t >= ts) fn();
  let cap = '', ca = 0; if (started) for (const c of CAPS) if (t > c[1] && t < c[2]) { cap = c[0]; ca = Math.min(sm((t - c[1]) / .5), sm((c[2] - t) / .5)); }
  const ce = $('#cap'); if (ce.textContent !== cap && cap) ce.textContent = cap; ce.style.opacity = ca.toFixed(3);
  const ea = started && !REC ? sm(prog(T.buttons, T.buttons + .7, t)) : 0, en = $('#end'); en.style.opacity = ea.toFixed(3); en.style.transform = `translateY(${(1 - ea) * 30}px)`; en.classList.toggle('on', ea > .5);
  window.__t = t; window.__demo = !started ? 'start' : t >= T.done ? 'done' : 'play';
  prevT = t;
}
function render() {
  const tt = started ? t : 0;
  cam = camAt(tt);
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.filter = 'none'; cx.globalCompositeOperation = 'source-over';
  cx.drawImage(bgC, 0, 0);
  drawConfetti(tt, false);
  const sc = scene(tt);
  if (sc.alpha > .005) drawPaper(sc, tt, () => drawNote(tt));
  drawConfetti(tt, true);
  drawFinale(tt);
}
function loop() { update(); if (!REC) render(); requestAnimationFrame(loop); }

function begin() {
  if (started) return; started = true; startAt = performance.now(); prevT = 0; t = 0;
  const s = $('#start'); s.style.transition = 'opacity .8s'; s.style.opacity = '0'; s.style.pointerEvents = 'none';
  if (REC) { const t0 = performance.now(); const fade = () => { const k = clamp((performance.now() - t0) / 800); s.style.opacity = String(1 - k); if (k < 1) requestAnimationFrame(fade); else s.style.display = 'none'; }; fade(); }
  else setTimeout(() => s.style.display = 'none', 900);
  startAudio();
}
function replay() { startAt = performance.now(); prevT = 0; t = 0; }
function toast(m) { const e = $('#toast'); e.textContent = m; e.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => e.style.opacity = 0, 1800); }
function link(name) { const u = new URL(location.href.split('?')[0]); if (name) u.searchParams.set('name', name); return u.toString(); }
async function copy(s) { try { await navigator.clipboard.writeText(s); return true; } catch (e) { const a = document.createElement('textarea'); a.value = s; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) { } a.remove(); return ok; } }

$('#begin').addEventListener('click', begin);
$('#replay').addEventListener('click', replay);
$('#share').addEventListener('click', async () => {
  const u = link(NAME); if (navigator.share && !DEMO) { try { await navigator.share({ title: 'Origami Love 📄❤️', text: 'I folded something for you 📄❤️', url: u }); return; } catch (e) { } }
  toast((await copy(u)) ? 'Link copied 💌' : u);
});
$('#mk').addEventListener('click', () => { $('#make').classList.add('on'); $('#petname').value = NAME; $('#mklink').textContent = ''; });
$('#mkclose').addEventListener('click', () => $('#make').classList.remove('on'));
$('#mkcopy').addEventListener('click', async () => { const u = link($('#petname').value.replace(/[<>]/g, '').trim().slice(0, 16)); $('#mklink').textContent = u; toast((await copy(u)) ? 'Link copied 🔗' : 'Copy the link below'); });
$('#snd').addEventListener('click', () => { muted = !muted; if (master) master.gain.value = muted ? 0 : .9; $('#snd').textContent = muted ? '🔇' : '🔊'; });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); if (REC) render(); }, 200); });

window.__api = { T, phase: () => window.__demo || 'start', begin, replay, zero: () => { } };
window.__render = () => { update(); render(); };
const fontsReady = Promise.all([document.fonts.load('700 80px Caveat', 'Every fold of my heart'), document.fonts.load('700 30px Poppins')]).catch(() => { }).then(() => document.fonts.ready);
fontsReady.then(() => {
  layout(); window.__ready = true; requestAnimationFrame(loop);
  if (DEMO && !REC) { setTimeout(() => $('#begin').classList.add('pressed'), 1100); setTimeout(() => { $('#begin').classList.remove('pressed'); begin(); }, 1400); }
});
})();
