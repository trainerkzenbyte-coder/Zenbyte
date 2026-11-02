/* =====================================================================
   ZENBYTE TECHNOLOGIES — 3D IT office with animated people
   Every chapter takes you to a different part of the office:
   reception, data wall, coding floor, meeting room, coffee break,
   manager cabin and celebration. Drag (or move the mouse) to look around.
   ===================================================================== */
(function () {
'use strict';
const CAPTURE = /[?&]capture/.test(location.search);
const $ = s => document.querySelector(s);
const T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const MOB = () => innerWidth < 900;

/* ---------------- renderer / scene ---------------- */
const canvas = $('#gl');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.background = new T.Color(0xdfe6ee);
scene.fog = new T.Fog(0xdfe6ee, 18, 42);
scene.environment = new T.PMREMGenerator(renderer).fromScene(new T.RoomEnvironment(renderer), .04).texture;
const camera = new T.PerspectiveCamera(42, 1, .1, 120);

function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const M = {
  wood: new T.MeshStandardMaterial({ roughness: .55, map: tex(1024, 1024, (x, w, h) => {
    for (let r = 0; r < 8; r++) for (let k = 0; k < 3; k++) {
      const y = r * h / 8, off = (r % 2) * w / 6 + k * w / 3, tone = 175 + Math.random() * 30;
      x.fillStyle = `rgb(${tone},${tone * .78 | 0},${tone * .56 | 0})`; x.fillRect(off % w, y, w / 3, h / 8);
      if (off % w + w / 3 > w) x.fillRect(0, y, (off % w + w / 3) - w, h / 8);
      for (let g = 0; g < 14; g++) { x.strokeStyle = `rgba(110,70,40,${.04 + Math.random() * .07})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const gy = y + Math.random() * h / 8; x.moveTo(0, gy); x.bezierCurveTo(w / 3, gy + 3, w * 2 / 3, gy - 3, w, gy + 1); x.stroke(); }
    }
    x.strokeStyle = 'rgba(60,40,25,.35)'; x.lineWidth = 2; for (let r = 0; r <= 8; r++) { x.beginPath(); x.moveTo(0, r * h / 8); x.lineTo(w, r * h / 8); x.stroke(); }
  }, [10, 10]) }),
  carpet: new T.MeshStandardMaterial({ roughness: .95, map: tex(512, 512, (x, w, h) => { x.fillStyle = '#5d6672'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,.05)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.strokeStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); } }, [8, 8]) }),
  wall: new T.MeshStandardMaterial({ color: 0xf1f1ee, roughness: .9 }),
  accent: new T.MeshStandardMaterial({ color: 0x0e2a4a, roughness: .7 }),
  ceil: new T.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 1 }),
  deskTop: new T.MeshStandardMaterial({ color: 0xf3f1ec, roughness: .45 }),
  oak: new T.MeshStandardMaterial({ color: 0xc89f72, roughness: .5 }),
  metal: new T.MeshStandardMaterial({ color: 0x2b2f36, metalness: .8, roughness: .35 }),
  steel: new T.MeshStandardMaterial({ color: 0xb9bec6, metalness: 1, roughness: .25 }),
  fabric: new T.MeshStandardMaterial({ color: 0x22262e, roughness: .9 }),
  fabricBlue: new T.MeshStandardMaterial({ color: 0x2d5a8a, roughness: .9 }),
  sofa: new T.MeshStandardMaterial({ color: 0x9aa7b5, roughness: .95 }),
  glass: new T.MeshPhysicalMaterial({ color: 0xe8f4ff, metalness: 0, roughness: .05, transmission: 0, transparent: true, opacity: .16, envMapIntensity: 1.5, depthWrite: false }),
  frame: new T.MeshStandardMaterial({ color: 0x1b1e23, metalness: .7, roughness: .4 }),
  black: new T.MeshStandardMaterial({ color: 0x0c0d10, roughness: .3, metalness: .4 }),
  white: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .4 }),
  cup: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .25 }),
  leaf: new T.MeshStandardMaterial({ color: 0x3f7a3a, roughness: .8 }),
  leaf2: new T.MeshStandardMaterial({ color: 0x2f6a34, roughness: .8 }),
  pot: new T.MeshStandardMaterial({ color: 0xe6e1d8, roughness: .7 }),
  lightPanel: new T.MeshBasicMaterial({ color: 0xffffff }),
  sky: new T.MeshBasicMaterial({ map: tex(512, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9cc4ea'); g.addColorStop(.62, '#dceaf6'); g.addColorStop(.63, '#8b98a6'); g.addColorStop(1, '#6f7c89'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const bx = Math.random() * w, bw = 14 + Math.random() * 40, bh = 40 + Math.random() * 150; x.fillStyle = `rgba(${120 + Math.random() * 40},${135 + Math.random() * 40},${150 + Math.random() * 40},.9)`; x.fillRect(bx, h * .63 - bh, bw, bh); x.fillStyle = 'rgba(255,255,255,.35)'; for (let wy = h * .63 - bh + 6; wy < h * .63 - 4; wy += 9) for (let wx = bx + 3; wx < bx + bw - 3; wx += 7) x.fillRect(wx, wy, 3, 4); }
  }), fog: false })
};
function box(w, h, d, m, x, y, z, parent, shadow = true) { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; (parent || scene).add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 24) { const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; (parent || scene).add(o); return o; }
function group(x, y, z, ry = 0, parent) { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || scene).add(g); return g; }

/* ---------------- screens with live content (code, charts) ---------------- */
const liveScreens = [];
const CODE = [
  ['k', 'import'], ['t', ' { Candidate, Offer } '], ['k', 'from'], ['s', " '@zenbyte/careers'"], ['n', ''],
  ['k', 'export async function'], ['f', ' placeCandidate'], ['t', '(profile) {'], ['n', ''],
  ['t', '  const '], ['v', 'skills'], ['t', ' = profile.skills.'], ['f', 'filter'], ['t', '(s => s.verified);'], ['n', ''],
  ['t', '  const '], ['v', 'matches'], ['t', ' = '], ['k', 'await'], ['f', ' findCompanies'], ['t', '({ skills, city });'], ['n', ''],
  ['k', '  for'], ['t', ' ('], ['k', 'const'], ['v', ' company'], ['k', ' of'], ['t', ' matches) {'], ['n', ''],
  ['t', '    '], ['k', 'await'], ['f', ' scheduleInterview'], ['t', '(profile, company);'], ['n', ''],
  ['t', '  }'], ['n', ''], ['c', '  // No offer, no fee.'], ['n', ''],
  ['k', '  return'], ['k', ' new'], ['f', ' Offer'], ['t', '({ ctc: '], ['v', 'expected'], ['t', ', joining });'], ['n', ''],
  ['t', '}'], ['n', ''], ['n', ''],
  ['k', 'def'], ['f', ' train_model'], ['t', '(data):'], ['n', ''],
  ['t', '    model = '], ['f', 'XGBClassifier'], ['t', '(n_estimators='], ['v', '400'], ['t', ')'], ['n', ''],
  ['t', '    model.'], ['f', 'fit'], ['t', '(data.X, data.y)'], ['n', ''],
  ['k', '    return'], ['t', ' model'], ['n', ''], ['n', ''],
  ['k', 'SELECT'], ['t', ' city, '], ['f', 'COUNT'], ['t', '(*) '], ['k', 'AS'], ['t', ' offers'], ['n', ''],
  ['k', 'FROM'], ['t', ' placements '], ['k', 'GROUP BY'], ['t', ' city;'], ['n', '']
];
const CC = { k: '#c792ea', t: '#d6deeb', s: '#ecc48d', f: '#82aaff', v: '#f78c6c', c: '#637777' };
function codeScreen(seed) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const x = c.getContext('2d');
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const s = { c, x, t, seed, draw(time) {
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, 512, 320);
    x.fillStyle = '#121a2b'; x.fillRect(0, 0, 512, 22); x.fillRect(0, 0, 34, 320);
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(12 + i * 14, 11, 4, 0, 7); x.fill(); });
    x.font = '13px monospace'; x.textBaseline = 'top';
    const total = Math.floor((time * 9 + seed * 37) % 160);
    let line = 0, col = 44, chars = 0;
    const scroll = Math.max(0, Math.floor(total / 22) * 0);
    for (const [k, txt] of CODE) {
      if (k === 'n') { line++; col = 44; continue; }
      const y = 30 + (line - scroll) * 17; if (y > 305) break;
      const n = Math.min(txt.length, Math.max(0, total * 1.6 - chars)); chars += txt.length;
      if (n <= 0) break;
      x.fillStyle = CC[k]; x.fillText(txt.slice(0, n), col, y); col += x.measureText(txt).width;
      x.fillStyle = '#4b5a75'; x.fillText(String(line + 1).padStart(2, ' '), 8, y);
    }
    t.needsUpdate = true;
  } };
  liveScreens.push(s); return s;
}
function chartScreen() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 576; const x = c.getContext('2d');
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const a = months(2025), b = months(2026), mx = Math.max(...a, ...b);
  const s = { t, draw(time) {
    const g = x.createLinearGradient(0, 0, 1024, 576); g.addColorStop(0, '#0c1830'); g.addColorStop(1, '#050a16'); x.fillStyle = g; x.fillRect(0, 0, 1024, 576);
    x.fillStyle = '#e8c27c'; x.font = '600 22px Inter, sans-serif'; x.fillText('ZENBYTE · PLACEMENT RECORD', 50, 60);
    x.fillStyle = '#fff'; x.font = '500 54px Cormorant, Georgia, serif'; x.fillText(`${a.reduce((p, q) => p + q, 0)} offers in 2025`, 50, 120);
    const k = clamp((time % 9) / 2.5);
    for (let i = 0; i < 12; i++) {
      const bx = 60 + i * 76, h1 = a[i] / mx * 300 * ease(clamp(k * 1.4 - i * .03)), h2 = b[i] / mx * 300 * ease(clamp(k * 1.4 - i * .03 - .05));
      x.fillStyle = '#4fb8ff'; x.fillRect(bx, 500 - h1, 28, h1); x.fillStyle = '#e8c27c'; x.fillRect(bx + 32, 500 - h2, 28, h2);
      x.fillStyle = '#8f9bb2'; x.font = '18px Inter, sans-serif'; x.fillText('JFMAMJJASOND'[i], bx + 22, 532);
    }
    t.needsUpdate = true;
  } };
  liveScreens.push(s); return s;
}
function logoTex() {
  return tex(1024, 512, (x, w, h) => {
    x.fillStyle = '#0e2a4a'; x.fillRect(0, 0, w, h);
    const im = $('#logoImg'); x.drawImage(im, w / 2 - 120, 40, 240, 244);
    x.fillStyle = '#ffffff'; x.font = '600 76px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('ZENBYTE TECHNOLOGIES', w / 2, 380);
    x.fillStyle = '#e8c27c'; x.font = '500 30px Inter, sans-serif'; x.fillText('YOUR BRIDGE TO IT CAREERS', w / 2, 440);
  });
}

/* ---------------- furniture ---------------- */
function monitor(parent, x, z, ry, seed) {
  const g = group(x, .76, z, ry, parent);
  box(.04, .3, .04, M.metal, 0, .15, -.05, g); box(.24, .015, .18, M.metal, 0, .008, -.05, g);
  box(.62, .38, .025, M.black, 0, .42, -.05, g);
  const scr = new T.Mesh(new T.PlaneGeometry(.58, .345), new T.MeshBasicMaterial({ map: codeScreen(seed).t, toneMapped: false }));
  scr.position.set(0, .42, -.036); g.add(scr);
  return g;
}
function deskUnit(parent, x, z, ry, seed, withChair = true) {
  const g = group(x, 0, z, ry, parent);
  box(1.4, .035, .75, M.deskTop, 0, .74, 0, g);
  [[-.66, -.33], [.66, -.33], [-.66, .33], [.66, .33]].forEach(([a, b]) => box(.04, .74, .04, M.metal, a, .37, b, g));
  monitor(g, 0, -.18, 0, seed);
  box(.44, .02, .14, M.black, 0, .76, .12, g);          // keyboard
  box(.06, .02, .1, M.black, .32, .76, .14, g);         // mouse
  if (Math.random() < .5) { const c = cyl(.035, .03, .1, M.cup, -.5, .8, .1, g); }
  if (withChair) chair(g, 0, .62, Math.PI);
  return g;
}
function chair(parent, x, z, ry) {
  const g = group(x, 0, z, ry, parent);
  box(.48, .07, .46, M.fabric, 0, .46, 0, g); box(.46, .55, .06, M.fabric, 0, .78, .22, g);
  cyl(.03, .03, .4, M.steel, 0, .24, 0, g, 12);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; box(.03, .03, .3, M.steel, Math.sin(a) * .14, .05, Math.cos(a) * .14, g).rotation.y = a; }
  return g;
}
function plant(parent, x, z, s = 1) {
  const g = group(x, 0, z, 0, parent); g.scale.setScalar(s);
  cyl(.22, .17, .45, M.pot, 0, .225, 0, g);
  for (let i = 0; i < 26; i++) {
    const l = new T.Mesh(new T.SphereGeometry(.12, 8, 6), i % 2 ? M.leaf : M.leaf2);
    const a = Math.random() * 6.28, r = Math.random() * .22, y = .55 + Math.random() * .9;
    l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); l.scale.set(1, 1.8, .5); l.rotation.set(Math.random(), a, Math.random() * .6); l.castShadow = true; g.add(l);
  }
  return g;
}
function glassWall(x, z, w, ry, parent) {
  const g = group(x, 0, z, ry, parent);
  const p = new T.Mesh(new T.PlaneGeometry(w, 3), M.glass); p.position.y = 1.5; g.add(p);
  box(w, .05, .06, M.frame, 0, .025, 0, g, false); box(w, .05, .06, M.frame, 0, 2.98, 0, g, false);
  for (let i = 0; i <= Math.round(w / 1.4); i++) box(.04, 3, .06, M.frame, -w / 2 + i * w / Math.round(w / 1.4), 1.5, 0, g, false);
  return g;
}

/* ---------------- the office building ---------------- */
const ZX = [0, 15, 30, 45, 60, 75, 90];     // centre of each zone along X
const LEN = 110;
const floor = new T.Mesh(new T.PlaneGeometry(LEN, 16), M.wood); floor.rotation.x = -Math.PI / 2; floor.position.set(45, 0, 0); floor.receiveShadow = true; scene.add(floor);
const ceil = new T.Mesh(new T.PlaneGeometry(LEN, 16), M.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(45, 3.2, 0); scene.add(ceil);
for (let x = -8; x < 100; x += 3) for (let z = -4.5; z <= 4.5; z += 3) { const l = new T.Mesh(new T.PlaneGeometry(1.2, .6), M.lightPanel); l.rotation.x = Math.PI / 2; l.position.set(x, 3.19, z); scene.add(l); }
/* back wall with big windows onto the city */
const back = group(45, 0, -6);
box(LEN, 3.2, .2, M.wall, 0, 1.6, -.1, back, false);
const win = new T.Mesh(new T.PlaneGeometry(LEN - 2, 2.2), M.sky); win.position.set(0, 1.65, .02); back.add(win);
for (let x = -LEN / 2; x <= LEN / 2; x += 2.4) box(.08, 2.3, .1, M.frame, x, 1.65, .05, back, false);
box(LEN, .08, .12, M.frame, 0, .53, .05, back, false); box(LEN, .08, .12, M.frame, 0, 2.77, .05, back, false);
/* side wall (behind the camera is open), partitions between zones */
for (let i = 0; i < ZX.length - 1; i++) glassWall((ZX[i] + ZX[i + 1]) / 2, -2, 7.8, Math.PI / 2);
const sun = new T.DirectionalLight(0xfff3e2, 2.6); sun.position.set(6, 10, -12); sun.castShadow = true;
sun.shadow.mapSize.set(MOB() ? 1024 : 2048, MOB() ? 1024 : 2048); sun.shadow.camera.left = -11; sun.shadow.camera.right = 11; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9; sun.shadow.camera.far = 40; sun.shadow.bias = -.0005; sun.shadow.normalBias = .02;
scene.add(sun); scene.add(sun.target);
scene.add(new T.HemisphereLight(0xffffff, 0xb59a7c, .9));
const fill = new T.DirectionalLight(0xdfe9ff, .6); fill.position.set(-4, 6, 10); scene.add(fill);

/* zone 1: reception with the Zenbyte wall */
const Z1 = group(ZX[0], 0, 0);
const logoWall = box(7, 3.2, .15, new T.MeshStandardMaterial({ map: null, color: 0xffffff, roughness: .6 }), 0, 1.6, -5.6, Z1, false);
const recDesk = group(0, 0, -3.2, 0, Z1);
box(3.2, 1.05, .7, M.white, 0, .525, 0, recDesk); box(3.3, .05, .8, M.oak, 0, 1.07, 0, recDesk);
box(3.22, .08, .72, new T.MeshBasicMaterial({ color: 0x3aa8ff, toneMapped: false }), 0, .06, 0, recDesk, false);
monitor(recDesk, -.7, -.05, Math.PI, 3).position.y = 1.07;
plant(Z1, -3.1, -4.6, 1.2); plant(Z1, 3.1, -4.6, 1.1); plant(Z1, -5.5, 2, 1);
const sofa1 = group(4.2, 0, 1.5, -Math.PI / 2, Z1); box(2.2, .42, .85, M.sofa, 0, .21, 0, sofa1); box(2.2, .5, .2, M.sofa, 0, .62, .35, sofa1);
box(1, .4, .6, M.oak, 3.1, .2, 1.5, Z1);

/* zone 2: data wall (our record) */
const Z2 = group(ZX[1], 0, 0);
const chart = chartScreen();
box(4.6, 2.65, .1, M.black, 0, 1.7, -5.75, Z2, false);
const chartMesh = new T.Mesh(new T.PlaneGeometry(4.45, 2.5), new T.MeshBasicMaterial({ map: chart.t, toneMapped: false })); chartMesh.position.set(0, 1.7, -5.69); Z2.add(chartMesh);
deskUnit(Z2, -3.6, -1.8, .3, 11); deskUnit(Z2, 3.6, -1.8, -.3, 12); plant(Z2, -5.6, -4.8);

/* zone 3: coding floor */
const Z3 = group(ZX[2], 0, 0);
const deskSpots = [];
for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
  const x = -3.3 + c * 3.3, z = -3.6 + r * 2.8;
  deskUnit(Z3, x, z, 0, 20 + r * 3 + c, true); deskSpots.push([x, z]);
}
plant(Z3, 5.8, -4.8); plant(Z3, -5.8, 1.5);

/* zone 4: meeting room */
const Z4 = group(ZX[3], 0, 0);
const table = group(0, 0, -2.6, 0, Z4);
const top4 = new T.Mesh(new T.CylinderGeometry(1, 1, .05, 48), M.oak); top4.scale.set(2.1, 1, 1); top4.position.y = .75; top4.castShadow = top4.receiveShadow = true; table.add(top4);
box(.1, .72, .9, M.metal, -1.2, .37, 0, table); box(.1, .72, .9, M.metal, 1.2, .37, 0, table);
const presSys = codeScreen(41);
box(3.2, 1.85, .08, M.black, 0, 1.65, -5.7, Z4, false);
const pres = new T.Mesh(new T.PlaneGeometry(3.1, 1.75), new T.MeshBasicMaterial({ map: tex(1024, 576, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0e2a4a'); g.addColorStop(1, '#071426'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#e8c27c'; x.font = '600 26px Inter, sans-serif'; x.fillText('CANDIDATE JOURNEY', 70, 90); x.fillStyle = '#fff'; x.font = '500 64px Cormorant, Georgia, serif'; x.fillText('Join · Profile · Calls', 70, 190); x.fillText('Interview · Offer', 70, 270); ['Bengaluru', 'Chennai', 'Coimbatore'].forEach((c, i) => { x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(70 + i * 300, 360, 270, 130); x.fillStyle = '#cfe9ff'; x.font = '600 30px Inter, sans-serif'; x.fillText(c, 95 + i * 300, 435); }); }), toneMapped: false }));
pres.position.set(0, 1.65, -5.65); Z4.add(pres);
plant(Z4, -5.6, -4.8);

/* zone 5: coffee break area */
const Z5 = group(ZX[4], 0, 0);
const counter = group(-2.4, 0, -5.1, 0, Z5);
box(4.4, .92, .65, M.white, 0, .46, 0, counter); box(4.5, .05, .72, M.oak, 0, .945, 0, counter);
box(1.2, 1.6, .5, M.oak, 0, 2.2, -.1, counter);
const cm = group(-1.3, .97, -.05, 0, counter); box(.38, .5, .38, M.steel, 0, .25, 0, cm); box(.3, .06, .2, M.black, 0, .1, .15, cm); cyl(.04, .035, .09, M.cup, 0, .05, .14, cm);
for (let i = 0; i < 5; i++) cyl(.04, .035, .1, M.cup, .4 + i * .14, 1.02, .1, counter);
const bar = group(2.6, 0, -2.4, 0, Z5); cyl(.4, .4, .04, M.oak, 0, 1.05, 0, bar, 32); cyl(.04, .04, 1.05, M.metal, 0, .52, 0, bar);
plant(Z5, 5.6, -4.8, 1.3); plant(Z5, -5.7, 1.8);
const sofa5 = group(3.8, 0, 1.2, -Math.PI / 2, Z5); box(2.2, .42, .85, M.fabricBlue, 0, .21, 0, sofa5); box(2.2, .5, .2, M.fabricBlue, 0, .62, .35, sofa5);

/* zone 6: manager cabin */
const Z6 = group(ZX[5], 0, 0);
const mdesk = group(0, 0, -3.4, 0, Z6);
box(2.2, .05, .95, M.oak, 0, .76, 0, mdesk); box(2.1, .72, .06, M.black, 0, .37, -.4, mdesk); box(.06, .72, .9, M.black, -1.05, .37, 0, mdesk); box(.06, .72, .9, M.black, 1.05, .37, 0, mdesk);
monitor(mdesk, .5, -.15, -.25, 55);
chair(Z6, 0, -4.35, 0); chair(Z6, -.6, -2.2, Math.PI); chair(Z6, .6, -2.2, Math.PI);
const shelf = group(-4.5, 0, -5.5, 0, Z6); box(2.4, 2.4, .4, M.oak, 0, 1.2, 0, shelf);
for (let i = 0; i < 18; i++) box(.06, .3, .25, [M.accent, M.white, M.black][i % 3], -1 + (i % 9) * .25, .65 + Math.floor(i / 9) * .8, .1, shelf);
plant(Z6, 4.8, -4.8, 1.2);

/* zone 7: celebration / town hall */
const Z7 = group(ZX[6], 0, 0);
const wall7 = box(5.5, 2.4, .12, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .6 }), 0, 1.75, -5.6, Z7, false);
plant(Z7, -4, -4.8, 1.2); plant(Z7, 4, -4.8, 1.2);
const CONF = 260, cGeo = new T.BufferGeometry(), cPos = new Float32Array(CONF * 3), cSeed = [];
for (let i = 0; i < CONF; i++) cSeed.push([Math.random() * 8 - 4, Math.random() * 3, Math.random() * 6 - 4, Math.random()]);
cGeo.setAttribute('position', new T.BufferAttribute(cPos, 3));
const confetti = new T.Points(cGeo, new T.PointsMaterial({ size: .06, color: 0xe8c27c })); Z7.add(confetti);

/* ---------------- people ---------------- */
const people = [], loader = new T.GLTFLoader();
const OUTFITS = [[0x24324a, 0xd9d2c5], [0xe9e6df, 0x2a3140], [0x3a5f8a, 0xe2dccf], [0x2f2f33, 0xc8a27a], [0x8aa0b8, 0x30343c], [0x6b4f3a, 0xe9e2d6], [0x1f6f78, 0xddd6c9], [0xb7c3cf, 0x1e2a38]];
const BONES = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot', 'LeftHandMiddle1', 'RightHandMiddle1'];
const _a = new T.Vector3(), _b = new T.Vector3(), _q = new T.Quaternion(), _q2 = new T.Quaternion(), _q3 = new T.Quaternion(), _d = new T.Vector3();
/* point a bone (towards its child) in a direction given in the person's own space */
function aim(p, name, child, dir, w = 1) {
  const bone = p.b[name], ch = p.b[child]; if (!bone || !ch) return;
  bone.updateWorldMatrix(true, false); ch.updateWorldMatrix(false, false);
  bone.getWorldPosition(_a); ch.getWorldPosition(_b);
  const cur = _b.sub(_a).normalize();
  _d.copy(dir).normalize().applyQuaternion(p.root.quaternion);
  _q.setFromUnitVectors(cur, _d);
  bone.getWorldQuaternion(_q2); _q.multiply(_q2);
  bone.parent.getWorldQuaternion(_q3); _q3.invert().multiply(_q);
  bone.quaternion.slerp(_q3, w); bone.updateMatrixWorld(true);
}
function spawn(gltf, zone, x, z, ry, mode, opts = {}) {
  const root = T.SkeletonUtils.clone(gltf.scene);
  const o = OUTFITS[people.length % OUTFITS.length];
  root.traverse(n => {
    if (n.isMesh) {
      n.castShadow = true; n.receiveShadow = true; n.frustumCulled = false;
      n.material = n.material.clone();
      if (/Joints/.test(n.material.name)) { n.material.color.setHex(o[1]); n.material.roughness = .5; n.material.metalness = .2; }
      else { n.material.color.setHex(o[0]); n.material.roughness = .55; n.material.metalness = .05; }
    }
  });
  const holder = group(ZX[zone] + x, 0, z, ry);
  holder.add(root); root.scale.setScalar(opts.s || 1.08);
  const mixer = new T.AnimationMixer(root);
  const clip = n => gltf.animations.find(a => a.name === n);
  const idle = mixer.clipAction(clip('idle')), walk = mixer.clipAction(clip('walk'));
  idle.play(); walk.play(); walk.setEffectiveWeight(0);
  idle.time = Math.random() * 3; walk.time = Math.random();
  const b = {}; BONES.forEach(n => b[n] = root.getObjectByName('mixamorig' + n));
  const p = { root: holder, model: root, mixer, idle, walk, b, mode, opts, phase: Math.random() * 10, zone };
  if (mode === 'coffee') { const cup = cyl(.045, .038, .11, M.cup, 0, 0, 0, null); p.cup = cup; }
  people.push(p); return p;
}
function seatHeight(p) { return -.43 * (p.opts.s || 1.08); }
function pose(p, t) {
  const L = V3, ph = t + p.phase, m = p.mode;
  if (m === 'walk') {
    const path = p.opts.path, sp = p.opts.speed || .9, len = p.opts.len;
    const d = ((t * sp + p.phase * 3) % len + len) % len;
    // walk back and forth along a straight line
    const half = len / 2, fwd = d < half, u = fwd ? d / half : 2 - d / half;
    const a = path[0], c = path[1];
    p.root.position.set(ZX[p.zone] + a[0] + (c[0] - a[0]) * u, 0, a[1] + (c[1] - a[1]) * u);
    const ang = Math.atan2(c[0] - a[0], c[1] - a[1]) + (fwd ? 0 : Math.PI);
    p.root.rotation.y = ang;
    p.walk.setEffectiveWeight(1); p.idle.setEffectiveWeight(0);
    return;
  }
  p.walk.setEffectiveWeight(0); p.idle.setEffectiveWeight(1);
  const R = p.opts.right === undefined ? 1 : p.opts.right;
  if (m === 'type' || m === 'sitTalk' || m === 'sitMeet') {
    p.model.position.y = seatHeight(p);
    aim(p, 'LeftUpLeg', 'LeftLeg', L(.12, -.05, 1)); aim(p, 'RightUpLeg', 'RightLeg', L(-.12, -.05, 1));
    aim(p, 'LeftLeg', 'LeftFoot', L(.04, -1, .12)); aim(p, 'RightLeg', 'RightFoot', L(-.04, -1, .12));
    aim(p, 'Spine', 'Spine2', L(0, 1, m === 'type' ? .2 : .08));
    if (m === 'type') {
      const k1 = Math.sin(ph * 15) * .07, k2 = Math.sin(ph * 13 + 1.3) * .07;
      aim(p, 'LeftArm', 'LeftForeArm', L(.28, -.8, .5)); aim(p, 'RightArm', 'RightForeArm', L(-.28, -.8, .5));
      aim(p, 'LeftForeArm', 'LeftHand', L(-.25, -.12 + k1, 1)); aim(p, 'RightForeArm', 'RightHand', L(.25, -.12 + k2, 1));
      aim(p, 'Neck', 'Head', L(Math.sin(ph * .4) * .15, 1, .25));
    } else {
      aim(p, 'LeftArm', 'LeftForeArm', L(.25, -.85, .4)); aim(p, 'RightArm', 'RightForeArm', L(-.25, -.85, .4));
      const g = m === 'sitTalk' ? Math.max(0, Math.sin(ph * 1.3)) * .5 : 0;
      aim(p, 'LeftForeArm', 'LeftHand', L(-.3, -.1, 1)); aim(p, 'RightForeArm', 'RightHand', L(.2, -.1 + g, 1));
      aim(p, 'Neck', 'Head', L(Math.sin(ph * .7) * .25, 1, .05));
    }
    return;
  }
  p.model.position.y = 0;
  if (m === 'shake') {
    const shaking = (ph % 6) < 2.6, s = shaking ? Math.sin(ph * 11) * .12 : 0;
    aim(p, 'RightArm', 'RightForeArm', L(-.12, -.85, .5)); aim(p, 'RightForeArm', 'RightHand', L(-.1, .05 + s, 1));
    aim(p, 'Neck', 'Head', L(0, 1, .08 + (shaking ? Math.sin(ph * 3) * .05 : 0)));
  } else if (m === 'coffee') {
    const sip = Math.max(0, Math.sin(ph * .7)) ** 6;
    aim(p, 'LeftArm', 'LeftForeArm', L(.18, -.95, .25 + sip * .2)); aim(p, 'LeftForeArm', 'LeftHand', L(-.35, .55 + sip * .9, .75 - sip * .3));
    const g = Math.max(0, Math.sin(ph * 1.6 + 1)) * .45;
    aim(p, 'RightArm', 'RightForeArm', L(-.2, -.95, .15 + g * .3)); aim(p, 'RightForeArm', 'RightHand', L(.25, -.4 + g, .8));
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .8) * .2, 1, .05 - sip * .2));
    if (p.cup) { p.b.LeftHand.updateWorldMatrix(true, false); p.b.LeftHand.getWorldPosition(_a); p.cup.position.copy(_a); p.cup.position.y -= .02; }
  } else if (m === 'talk') {
    const g1 = Math.max(0, Math.sin(ph * 1.7)) * .6, g2 = Math.max(0, Math.sin(ph * 1.3 + 2)) * .5;
    aim(p, 'RightArm', 'RightForeArm', L(-.25, -.9, .2 + g1 * .3)); aim(p, 'RightForeArm', 'RightHand', L(.15, -.3 + g1, .9));
    aim(p, 'LeftArm', 'LeftForeArm', L(.25, -.9, .2 + g2 * .3)); aim(p, 'LeftForeArm', 'LeftHand', L(-.15, -.4 + g2, .9));
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .9) * .25, 1, .05));
  } else if (m === 'present') {
    const g = Math.sin(ph * 1.1) * .15;
    aim(p, 'RightArm', 'RightForeArm', L(-.85 * R, .05 + g, .45)); aim(p, 'RightForeArm', 'RightHand', L(-.9 * R, .15 + g, .4));
    aim(p, 'LeftArm', 'LeftForeArm', L(.2, -.9, .25)); aim(p, 'LeftForeArm', 'LeftHand', L(-.2, -.2 + Math.max(0, Math.sin(ph * 1.5)) * .4, .9));
    aim(p, 'Neck', 'Head', L(-.35 * R + Math.sin(ph * .5) * .3, 1, .05));
  } else if (m === 'clap') {
    const c = Math.sin(ph * 12) * .14;
    aim(p, 'LeftArm', 'LeftForeArm', L(.25, -.75, .55)); aim(p, 'RightArm', 'RightForeArm', L(-.25, -.75, .55));
    aim(p, 'LeftForeArm', 'LeftHand', L(-.6 - c, .45, .7)); aim(p, 'RightForeArm', 'RightHand', L(.6 + c, .45, .7));
  } else if (m === 'look') {
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .4) * .2, 1, .25));
  }
}

/* ---------------- story: camera view for every chapter ---------------- */
const VIEWS = [
  { cam: [3.6, 1.75, 6.6], at: [-.2, 1.25, -2.6] },   // reception
  { cam: [-2.2, 1.8, 5.2], at: [.4, 1.55, -4] },       // data wall
  { cam: [4.6, 2.4, 4.8], at: [-.4, .95, -2.2] },      // coding floor
  { cam: [3.4, 1.7, 4.8], at: [0, 1.15, -3.2] },       // meeting room
  { cam: [-3.4, 1.7, 4.4], at: [.2, 1.25, -2.6] },     // coffee break
  { cam: [2.8, 1.65, 3.6], at: [-.2, 1.1, -3.2] },     // manager cabin
  { cam: [0, 1.7, 5.6], at: [0, 1.4, -3] }             // celebration
];
const ZONE_NAME = ['Reception', 'Data wall', 'Coding floor', 'Meeting room', 'Coffee break', 'Manager cabin', 'Celebration'];

/* ---------------- page UI ---------------- */
const panel = $('#panel'), chapNav = $('#chap'), rail = $('#rail');
chapNav.innerHTML = ROOMS.map((r, k) => `<button data-k="${k}">${E(r.name.replace(' and next steps', '').replace(' and timing', ''))}</button>`).join('');
rail.innerHTML = P.map((p, i) => `<button data-i="${i}" aria-label="Page ${i + 1}"></button>`).join('');
let page = -1, mode = 'intro';
function showPage(i) {
  i = Math.max(0, Math.min(P.length - 1, i)); if (i === page) return;
  const prevZone = page < 0 ? -1 : PAGE_ROOM[page];
  page = i; const z = PAGE_ROOM[i], j = ROOMS[z].pages.indexOf(i);
  panel.classList.add('out');
  setTimeout(() => {
    panel.className = 'panel out ' + (VIEWS[z].side || (z % 2 ? 'left' : 'right'));
    panel.innerHTML = `<div class="zone"><i></i>${E(ZONE_NAME[z])}</div>` + pageHTML(i);
    panel.querySelector('.ey').dataset.n = String(i + 1).padStart(2, '0');
    if (/DataMeet/.test(panel.textContent)) panel.querySelectorAll('.nt').forEach(n => { if (/DataMeet/.test(n.textContent)) n.remove(); });
    afterRender(i, panel); panel.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove('out')));
  }, prevZone === z ? 260 : 700);
  flyTo(z, j);
  [...chapNav.children].forEach((b, k) => b.classList.toggle('on', k === z));
  [...rail.children].forEach((b, k) => b.classList.toggle('on', k === i));
  $('#count').textContent = String(i + 1).padStart(2, '0') + ' / ' + P.length;
  $('#prev').disabled = i === 0; $('#next').disabled = i === P.length - 1;
}
chapNav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showPage(ROOMS[+b.dataset.k].pages[0]); });
rail.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showPage(+b.dataset.i); });
$('#prev').onclick = () => showPage(page - 1); $('#next').onclick = () => showPage(page + 1);
function enter() { if (mode !== 'intro') return; mode = 'office'; document.body.classList.add('office'); showPage(0); }
$('#enter').addEventListener('click', enter);
let wheelLock = 0;
addEventListener('wheel', e => {
  if (mode !== 'office') { if (e.deltaY > 20) enter(); return; }
  if (e.target.closest('#panel') && panel.scrollHeight > panel.clientHeight + 4) {
    const atEnd = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2, atTop = panel.scrollTop <= 0;
    if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atTop)) return;
  }
  const n = Date.now(); if (n < wheelLock || Math.abs(e.deltaY) < 15) return; wheelLock = n + 900; showPage(page + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
addEventListener('keydown', e => {
  if (mode !== 'office') { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') enter(); return; }
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) showPage(page + 1);
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) showPage(page - 1);
});

/* ---------------- camera: fly between zones, drag / mouse to look around ---------------- */
const cam = { from: null, to: null, t0: 0, dur: 1, pos: V3(3.6, 1.75, 6.6), at: V3(-.2, 1.25, -2.6) };
let yaw = 0, pitch = 0, yawT = 0, pitchT = 0, hoverX = 0, hoverY = 0, dragging = false, lx = 0, ly = 0, now = 0;
function viewOf(z, j) {
  const v = VIEWS[z], o = V3(ZX[z], 0, 0);
  const pos = V3(...v.cam).add(o), at = V3(...v.at).add(o);
  if (j > 0) { const s = (j % 2 ? 1 : -1) * Math.min(1.6, .55 * j); pos.x += s; pos.z -= .25 * j; }
  if (MOB()) { pos.sub(at).multiplyScalar(1.28).add(at); at.y -= .15; }
  return { pos, at };
}
function flyTo(z, j) {
  const v = viewOf(z, j);
  const far = Math.abs(v.pos.x - cam.pos.x) > 6;
  cam.from = { pos: cam.pos.clone(), at: cam.at.clone() }; cam.to = v; cam.t0 = now; cam.dur = far ? 2.4 : 1.2; cam.far = far;
  yawT = 0; pitchT = 0;
  sun.position.set(ZX[z] + 6, 10, -12); sun.target.position.set(ZX[z], 0, -1);
}
canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  hoverX = e.clientX / innerWidth - .5; hoverY = e.clientY / innerHeight - .5;
  if (!dragging) return;
  yawT = clamp(yawT - (e.clientX - lx) * .006, -1.3, 1.3); pitchT = clamp(pitchT + (e.clientY - ly) * .004, -.35, .5);
  lx = e.clientX; ly = e.clientY;
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('dblclick', () => { yawT = 0; pitchT = 0; });

/* ---------------- loading the people ---------------- */
const status = $('#loadTxt');
function loadPeople() {
  return new Promise(res => {
    loader.load(XBOT_URL, gltf => {
      gltf.animations.forEach(c => { c.tracks = c.tracks.filter(tr => !/Hips\.position/.test(tr.name) || c.name === 'idle'); });
      const ip = gltf.animations.find(a => a.name === 'idle'); ip.tracks.forEach(tr => { if (/Hips\.position/.test(tr.name)) { const v = tr.values; for (let i = 0; i < v.length; i += 3) { v[i] = 0; v[i + 2] = 0; } } });
      /* reception: welcome + handshake + visitors walking in */
      spawn(gltf, 0, -.3, -4.1, 0, 'look');
      spawn(gltf, 0, -.48, -.4, Math.PI / 2, 'shake'); spawn(gltf, 0, .48, -.4, -Math.PI / 2, 'shake');
      spawn(gltf, 0, 0, 0, 0, 'walk', { path: [[-5.4, .9], [1.6, .6]], len: 14, speed: .75 });
      spawn(gltf, 0, 0, 0, 0, 'walk', { path: [[-5.6, -2.4], [-2.4, 1.2]], len: 9.6, speed: .7 });
      /* data wall: presenter and team */
      spawn(gltf, 1, -1.6, -4.2, .25, 'present', { right: -1 });
      spawn(gltf, 1, -.3, -1.6, Math.PI, 'look'); spawn(gltf, 1, .7, -1.3, Math.PI + .2, 'coffee'); spawn(gltf, 1, 1.6, -2, Math.PI + .5, 'talk');
      spawn(gltf, 1, -3.6, -1.18, Math.PI + .3, 'type');
      /* coding floor: developers typing, a lead walking the floor */
      deskSpots.forEach(([x, z], k) => spawn(gltf, 2, x, z + .62, Math.PI, 'type'));
      spawn(gltf, 2, 0, 0, 0, 'walk', { path: [[-5, -.3], [5, -.3]], len: 20, speed: .8 });
      spawn(gltf, 2, 4.9, -3.1, -Math.PI / 2, 'talk');
      /* meeting room */
      [[-1.4, -3.35, 0], [0, -3.4, 0], [1.4, -3.35, 0], [-1.4, -1.85, Math.PI], [1.4, -1.85, Math.PI]].forEach(([x, z, r]) => { chair(Z4, x, z + (r ? .2 : -.2), r ? Math.PI : 0); spawn(gltf, 3, x, z, r ? 0 : Math.PI, 'sitMeet'); });
      spawn(gltf, 3, 2.6, -4.6, -.6, 'present', { right: 1 });
      /* coffee break */
      spawn(gltf, 4, -3.2, -4.1, 0, 'coffee'); spawn(gltf, 4, -2.4, -3.2, Math.PI * .85, 'talk');
      spawn(gltf, 4, 2.1, -2.1, Math.PI * .3, 'coffee'); spawn(gltf, 4, 3.1, -2.2, -Math.PI * .4, 'coffee');
      spawn(gltf, 4, 2.6, -1.4, Math.PI * 1.02, 'talk');
      spawn(gltf, 4, 0, 0, 0, 'walk', { path: [[-4.6, .6], [4.2, 1.0]], len: 18, speed: .8 });
      /* manager cabin */
      spawn(gltf, 5, 0, -4.15, 0, 'sitTalk'); spawn(gltf, 5, -.6, -2.42, Math.PI, 'sitTalk'); spawn(gltf, 5, .6, -2.42, Math.PI, 'sitMeet');
      /* celebration: offer handshake, team clapping */
      spawn(gltf, 6, -.48, -2.4, Math.PI / 2, 'shake'); spawn(gltf, 6, .48, -2.4, -Math.PI / 2, 'shake');
      [[-2.3, -2.9, .5], [2.3, -2.9, -.5], [-1.6, -1.2, .7], [1.6, -1.2, -.7], [0, -4.1, 0]].forEach(([x, z, r]) => spawn(gltf, 6, x, z, r, 'clap'));
      people.forEach(p => { if (p.cup) scene.add(p.cup); });
      res();
    }, ev => { if (ev.total) status.textContent = 'Loading the office · ' + Math.round(ev.loaded / ev.total * 100) + '%'; }, err => { status.textContent = 'Could not load the people'; console.error(err); res(); });
  });
}

/* ---------------- main loop ---------------- */
function resize() {
  renderer.setPixelRatio(CAPTURE ? 1 : Math.min(devicePixelRatio || 1, MOB() ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 58 : 42; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
let last = 0, screenTick = 0;
const tmpPos = V3(0, 0, 0), tmpAt = V3(0, 0, 0);
function frame(t) {
  const dt = Math.min(.05, Math.max(0, t - last)); last = t; now = t;
  /* camera */
  if (cam.to) {
    const u = clamp((t - cam.t0) / cam.dur), e = ease(u);
    cam.pos.lerpVectors(cam.from.pos, cam.to.pos, e); cam.at.lerpVectors(cam.from.at, cam.to.at, e);
    if (cam.far) cam.pos.y += Math.sin(u * Math.PI) * .6, cam.pos.z += Math.sin(u * Math.PI) * 1.5;
  }
  yaw += (yawT + (dragging ? 0 : -hoverX * .25) - yaw) * .08; pitch += (pitchT + (dragging ? 0 : hoverY * .12) - pitch) * .08;
  const off = tmpPos.copy(cam.pos).sub(cam.at), r = off.length();
  const a0 = Math.atan2(off.x, off.z) + yaw, e0 = Math.asin(clamp(off.y / r, -1, 1)) + pitch;
  camera.position.set(cam.at.x + Math.sin(a0) * Math.cos(e0) * r, Math.max(.4, cam.at.y + Math.sin(e0) * r), cam.at.z + Math.cos(a0) * Math.cos(e0) * r);
  camera.lookAt(cam.at);
  /* people */
  people.forEach(p => { p.mixer.update(dt); p.root.updateMatrixWorld(true); pose(p, t); });
  /* live screens (not every frame) */
  if (t - screenTick > .12) { screenTick = t; liveScreens.forEach(s => s.draw(t)); }
  /* confetti */
  const cp = cGeo.attributes.position.array;
  for (let i = 0; i < CONF; i++) { const s = cSeed[i]; cp[i * 3] = s[0] + Math.sin(t * 1.3 + i) * .2; cp[i * 3 + 1] = 3 - ((t * (.3 + s[3] * .4) + s[1]) % 3); cp[i * 3 + 2] = s[2] + Math.cos(t + i) * .2; }
  cGeo.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
}
logoWall.material.map = logoTex(); logoWall.material.needsUpdate = true;
wall7.material.map = tex(1024, 448, (x, w, h) => { x.fillStyle = '#0e2a4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8c27c'; x.font = '600 34px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('CONGRATULATIONS', w / 2, 120); x.fillStyle = '#fff'; x.font = 'italic 500 110px Cormorant, Georgia, serif'; x.fillText('Welcome aboard!', w / 2, 260); x.fillStyle = '#cfe9ff'; x.font = '500 30px Inter, sans-serif'; x.fillText('Another Zenbyte candidate placed', w / 2, 340); });
flyTo(0, 0); cam.pos.copy(cam.to.pos); cam.at.copy(cam.to.at); cam.to = null;

loadPeople().then(() => {
  document.body.classList.add('ready');
  if (CAPTURE) {
    window.renderAt = (t, pg, yw = 0) => { if (pg !== undefined && pg !== page) { mode = 'office'; document.body.classList.add('office'); showPage(pg); cam.t0 = t - 99; } yawT = yaw = yw; frame(t); };
    window.capReady = true;
  } else {
    const t0 = performance.now();
    (function loop() { frame((performance.now() - t0) / 1000); requestAnimationFrame(loop); })();
  }
});
})();
