/* =====================================================================
   ZENBYTE TECHNOLOGIES — cinematic scroll website
   One 3D studio (three.js) stays behind the page. As you scroll, the
   Zenbyte star, a bar chart, a "bridge" of light, office pillars, rings
   and a gold burst move into place for each part of the story.
   ===================================================================== */
(function () {
'use strict';
const CAPTURE = /[?&]capture/.test(location.search);       // used to record the promo video
const $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);

/* ---------------- 1. build the page from your content ---------------- */
const CHAPTER_TITLE = [
  ['A bright step <em>forward.</em>', 'Who we are, and the promise we keep.'],
  ['Proof, month <em>after month.</em>', 'Real offers, real companies, every month.'],
  ['Five steps to <em>your offer.</em>', 'From your first visit to your first day at work.'],
  ['Where, and <em>how long.</em>', 'Three offices, two ways to work with us, and a clear timeline.'],
  ['Pay only <em>after success.</em>', 'No offer, no fee. Then easy EMIs.'],
  ['Clear terms, <em>no surprises.</em>', 'Replacement, client rounds and your exit options.'],
  ['Your next <em>chapter.</em>', 'Rewards, answers and what happens next.']
];
const pagesEl = $('#pages');
let html = '';
const sideOf = {};
ROOMS.forEach((room, k) => {
  html += `<section class="chap" id="c${k + 1}" data-pose="chap" data-k="${k}">
    <p class="num rv">Chapter ${String(k + 1).padStart(2, '0')} · ${E(room.name)}</p>
    <h3 class="rv">${CHAPTER_TITLE[k][0]}</h3><p class="rv">${E(CHAPTER_TITLE[k][1])}</p><i class="rule rv"></i></section>`;
  room.pages.forEach((i, j) => {
    const side = i === 22 ? 'c' : (j % 2 ? 'r' : 'l');
    sideOf[i] = side;
    html += `<section class="pg ${side}" id="p${i + 1}" data-pose="page" data-i="${i}">${pageHTML(i)}</section>`;
  });
});
pagesEl.innerHTML = html;
document.querySelectorAll('.pg').forEach(sec => {
  const i = +sec.dataset.i;
  sec.querySelector('.ey').dataset.n = String(i + 1).padStart(2, '0');
  ['.ey', 'h2', '.lede', '.nt'].forEach(q => sec.querySelectorAll(q).forEach(e => e.classList.add('rv')));
  sec.querySelectorAll('.k').forEach(e => e.classList.add('rv'));
  if (i === 11 && OFFICE_IMGS.length) {
    sec.querySelector('.card').insertAdjacentHTML('beforeend', `<div class="photos">${OFFICE_IMGS.map(o => `<figure class="rv"><img src="${o.src}" alt="${E(o.cap)}" loading="lazy"><figcaption>${E(o.cap)}</figcaption></figure>`).join('')}</div>`);
  }
  sec.querySelectorAll('.nt').forEach(n => { if (/DataMeet/.test(n.textContent)) n.remove(); });
  afterRender(i, sec);
});
/* bars / skill bars grow with the scroll instead of on a timer */
document.querySelectorAll('[data-h],[data-w]').forEach(e => { e.style.transition = 'none'; });

/* navigation */
$('#chapters').innerHTML = ROOMS.map((r, k) => `<a href="#c${k + 1}">${E(r.name.replace(' and next steps', '').replace(' and timing', ''))}</a>`).join('');
$('#menuList').innerHTML = ROOMS.map((r, k) => `<a href="#c${k + 1}"><i>0${k + 1}</i>${E(r.name)}</a>`).join('');
const menu = $('#menu');
$('#menuBtn').onclick = () => { menu.classList.toggle('open'); $('#menuBtn').textContent = menu.classList.contains('open') ? 'Close' : 'Menu'; };
menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('open'); $('#menuBtn').textContent = 'Menu'; } });

/* quotes */
const QUOTES = ['Every great career begins with one bright step.', 'You bring the dream. We open the door to it.', 'No offer, no fee. Your success is our only measure.', 'From your first visit to your first day at work, we walk with you.'];
const qEl = $('#quote'); let qi = 0; qEl.textContent = QUOTES[0];
if (!CAPTURE) setInterval(() => { qEl.classList.add('out'); setTimeout(() => { qi = (qi + 1) % QUOTES.length; qEl.textContent = QUOTES[qi]; qEl.classList.remove('out'); }, 700); }, 4600);

/* ---------------- 2. the story: one "pose" of the 3D studio per section ---------------- */
const BASE = { ax: 0, ay: 0, as: 1, lx: 0, ly: 0, lz: 0, ls: 1, ry: 0, spin: .45, bars: 0, bridge: 0, node: -1, pillars: 0, rings: 0, burst: 0, warm: 0 };
function poseFor(sec) {
  const p = Object.assign({}, BASE), t = sec.dataset.pose;
  if (t === 'hero') Object.assign(p, { ax: 1.9, ay: .45, ls: 1.18, spin: .5 });
  else if (t === 'end') Object.assign(p, { ax: 0, ay: 1.25, ls: .7, burst: .45, warm: .7, spin: .7 });
  else if (t === 'chap') {
    const k = +sec.dataset.k;
    Object.assign(p, { ax: 0, ay: 1.3, ls: .74, spin: 1.1, warm: [0, .2, .1, 0, .7, .3, .9][k] });
  } else {
    const i = +sec.dataset.i, side = sideOf[i];
    Object.assign(p, { ax: side === 'l' ? 2.75 : side === 'r' ? -2.75 : 0, ls: .88, ry: side === 'l' ? -.35 : .35 });
    if (i === 3 || i === 4) Object.assign(p, { bars: 1, ly: 1.45, ls: .48, ry: 0 });
    if (i >= 5 && i <= 10) {
      const n = i === 5 ? -1 : i - 6;
      Object.assign(p, { bridge: i === 5 ? 1 : (n + 1) / 5, node: n, lx: 1.95, ly: 1.62, lz: -.4, ls: .36, ry: 0 });
      if (i === 10) p.bridge = 1;
    }
    if (i >= 11 && i <= 13) Object.assign(p, { pillars: 1, ly: 1.55, ls: .42, ry: 0 });
    if (i === 14 || i === 15) Object.assign(p, { rings: 1, warm: .65 });
    if (i >= 16 && i <= 18) Object.assign(p, { rings: .55, warm: .25 });
    if (i === 19) Object.assign(p, { burst: .55, warm: .85 });
    if (i === 20 || i === 21) Object.assign(p, { warm: .4 });
    if (i === 22) Object.assign(p, { ay: 1.55, ls: .55, burst: 1, warm: 1, spin: 1.3 });
  }
  return p;
}
const SECTIONS = [...document.querySelectorAll('[data-pose]')];
const POSES = SECTIONS.map(poseFor);
let centres = [], revealEls = [], vh = innerHeight, docH = 1;
function measure() {
  vh = innerHeight; docH = document.documentElement.scrollHeight;
  const y = scrollY;
  centres = SECTIONS.map(s => { const r = s.getBoundingClientRect(); return r.top + y + r.height / 2; });
  revealEls = [...document.querySelectorAll('.rv')].map(e => {
    const r = e.getBoundingClientRect(); return { e, top: r.top + y, last: -1 };
  });
  growEls = [...document.querySelectorAll('[data-h],[data-w]')].map(e => {
    const r = e.closest('.k').getBoundingClientRect(); return { e, top: r.top + y, h: e.dataset.h, w: e.dataset.w, last: -1 };
  });
}
let growEls = [];
function poseAt(y) {
  const c = y + vh / 2; let k = 0;
  while (k < centres.length - 1 && centres[k + 1] < c) k++;
  if (c <= centres[0]) return POSES[0];
  if (k >= centres.length - 1) return POSES[POSES.length - 1];
  const f = ease(clamp((c - centres[k]) / (centres[k + 1] - centres[k])));
  const a = POSES[k], b = POSES[k + 1], o = {};
  for (const key in a) o[key] = a[key] + (b[key] - a[key]) * f;
  /* the highlighted node jumps cleanly between steps */
  o.node = f < .5 ? a.node : b.node; o.nodeMix = Math.abs(f - .5) * 2;
  return o;
}
function updateDOM(y) {
  for (const r of revealEls) {
    const p = easeOut(clamp((y + vh * .94 - r.top) / (vh * .3)));
    if (Math.abs(p - r.last) < .002) continue; r.last = p;
    r.e.style.opacity = p; r.e.style.transform = p >= 1 ? 'none' : `translate3d(0,${(1 - p) * 34}px,0)`;
  }
  for (const g of growEls) {
    const p = easeOut(clamp((y + vh * .85 - g.top) / (vh * .45)));
    if (Math.abs(p - g.last) < .002) continue; g.last = p;
    if (g.h) g.e.style.height = (g.h * p) + '%'; else g.e.style.width = (g.w * p) + '%';
  }
  $('#progBar').style.width = (y / Math.max(1, docH - vh) * 100) + '%';
  /* active chapter in the menu */
  const c = y + vh / 2; let ch = -1;
  SECTIONS.forEach((s, k) => { if (s.dataset.pose === 'chap' && centres[k] - vh / 2 < c) ch = +s.dataset.k; });
  document.querySelectorAll('#chapters a').forEach((a, k) => a.classList.toggle('on', k === ch));
}

/* ---------------- 3. the 3D studio ---------------- */
const T = THREE, canvas = $('#gl');
const MOB = () => innerWidth < 980;
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene();
scene.background = new T.Color(0x05070d);
scene.fog = new T.FogExp2(0x05070d, .05);
const camera = new T.PerspectiveCamera(32, 1, .1, 100);
camera.position.set(0, .25, 10); camera.lookAt(0, 0, 0);
const pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new T.RoomEnvironment(renderer), .04).texture;

function glowTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(s => g.addColorStop(s[0], s[1]));
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
const softDot = glowTex([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
const add = (o, p) => (p || scene).add(o) && o;

/* lights */
const key = add(new T.SpotLight(0xffffff, 220, 30, .42, .55, 1.6)); key.position.set(0, 7.5, 2.5);
const keyTarget = add(new T.Object3D()); key.target = keyTarget;
const rimL = add(new T.DirectionalLight(0x58b6ff, 2.4)); rimL.position.set(-6, 2, -4);
const rimR = add(new T.DirectionalLight(0xffc98a, 1.4)); rimR.position.set(6, 1, -3);
add(new T.HemisphereLight(0x223355, 0x05070d, .35));

/* backdrop glow + floor + light pool */
const backGlow = add(new T.Mesh(new T.PlaneGeometry(30, 18), new T.MeshBasicMaterial({ map: glowTex([[0, 'rgba(40,80,150,.55)'], [.45, 'rgba(20,40,90,.22)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })));
backGlow.position.set(0, .8, -9);
const floor = add(new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ color: 0x05070d, roughness: .35, metalness: .7, envMapIntensity: .18 })));
floor.rotation.x = -Math.PI / 2; floor.position.y = -2.35;
const pool = add(new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ map: glowTex([[0, 'rgba(255,255,255,.32)'], [.35, 'rgba(255,255,255,.1)'], [1, 'rgba(255,255,255,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
pool.rotation.x = -Math.PI / 2; pool.position.y = -2.33;

/* light beam from above (soft volumetric cone) */
const beamMat = new T.ShaderMaterial({
  transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
  uniforms: { col: { value: new T.Color(0xcfe4ff) }, k: { value: 1 } },
  vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'uniform vec3 col;uniform float k;varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){float f=pow(abs(dot(vN,vV)),2.2);float a=f*pow(vUv.y,1.6)*.16*k;gl_FragColor=vec4(col*a,a);}'
});
const beam = add(new T.Mesh(new T.CylinderGeometry(.25, 2.4, 9, 64, 1, true), beamMat));
beam.position.set(0, 2.2, 0);

/* dust in the light */
const DUST = 700, dGeo = new T.BufferGeometry(), dPos = new Float32Array(DUST * 3), dSeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) { dPos[i * 3] = (Math.random() - .5) * 9; dPos[i * 3 + 1] = (Math.random() - .5) * 7; dPos[i * 3 + 2] = (Math.random() - .5) * 6; dSeed[i] = Math.random() * 100; }
dGeo.setAttribute('position', new T.BufferAttribute(dPos.slice(), 3));
const dust = add(new T.Points(dGeo, new T.PointsMaterial({ size: .035, map: softDot, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xbfd8ff, opacity: .55 })));

/* everything that moves together with the story */
const anchor = add(new T.Group());

/* the Zenbyte logo in 3D (traced from your logo file) */
const logo = add(new T.Group(), anchor), logoSpin = add(new T.Group(), logo);
const matLight = new T.MeshPhysicalMaterial({ color: 0x1fa6f2, metalness: .15, roughness: .28, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: .75, sheen: .4, sheenColor: new T.Color(0x9fdcff) });
const matDark = new T.MeshPhysicalMaterial({ color: 0x1b62bd, metalness: .15, roughness: .3, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: .75 });
const matEdge = new T.MeshPhysicalMaterial({ color: 0xe6c27e, metalness: 1, roughness: .22, envMapIntensity: 1.3 });
LOGO_SHAPES.forEach((s, idx) => {
  const sh = new T.Shape(s.o.map(p => new T.Vector2(p[0], p[1])));
  s.h.forEach(h => sh.holes.push(new T.Path(h.map(p => new T.Vector2(p[0], p[1])))));
  const depth = idx > 2 ? .1 : .2;
  const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: .035, bevelSize: .022, bevelSegments: 4, curveSegments: 6 });
  g.translate(0, 0, -depth / 2); g.computeVertexNormals();
  const m = new T.Mesh(g, [idx === 0 ? matDark : matLight, matEdge]);
  logoSpin.add(m);
});
logoSpin.scale.setScalar(1.25);
const halo = add(new T.Sprite(new T.SpriteMaterial({ map: softDot, color: 0x3a8cff, transparent: true, opacity: .28, depthWrite: false, blending: T.AdditiveBlending })), logo);
halo.scale.set(5.2, 5.2, 1); halo.position.z = -.6;

/* rings around the logo (fees / policies) */
const ringMat = new T.MeshPhysicalMaterial({ color: 0xe8c27c, metalness: 1, roughness: .22, emissive: 0x3a2508, envMapIntensity: 1.4, transparent: true });
const rings = [[1.95, .018, 1.15, .2], [2.3, .01, -0.9, .5], [2.65, .006, .5, -.7]].map(([r, t, a, b]) => {
  const m = add(new T.Mesh(new T.TorusGeometry(r, t, 12, 220), ringMat), logo); m.rotation.set(a, b, 0); m.userData.base = [a, b]; return m;
});

/* gold burst (rewards / thank you) */
const BURST = 520, bGeo = new T.BufferGeometry(), bDir = new Float32Array(BURST * 3), bArr = new Float32Array(BURST * 3);
for (let i = 0; i < BURST; i++) { const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = Math.sqrt(1 - u * u), d = 1.4 + Math.random() * 3.4; bDir[i * 3] = r * Math.cos(th) * d; bDir[i * 3 + 1] = u * d * .8; bDir[i * 3 + 2] = r * Math.sin(th) * d * .6; }
bGeo.setAttribute('position', new T.BufferAttribute(bArr, 3));
const burstMat = new T.PointsMaterial({ size: .06, map: softDot, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xf3cf8a, opacity: 0 });
const burst = add(new T.Points(bGeo, burstMat), logo);

/* 3D bar chart: offers per month, 2025 (blue) and 2026 (gold) */
const bars = add(new T.Group(), anchor); bars.position.set(0, -2.3, .2);
const a25 = months(2025), a26 = months(2026), mx = Math.max(...a25, ...a26);
const barBlue = new T.MeshPhysicalMaterial({ color: 0x4fb8ff, metalness: .25, roughness: .18, clearcoat: 1, transmission: 0, emissive: 0x0a2440, envMapIntensity: 1.2 });
const barGold = new T.MeshPhysicalMaterial({ color: 0xe8c27c, metalness: .95, roughness: .2, emissive: 0x2a1a05, envMapIntensity: 1.4 });
const barGeo = new T.BoxGeometry(.13, 1, .13); barGeo.translate(0, .5, 0);
const barList = [];
for (let i = 0; i < 12; i++) [[a25[i], barBlue, -.075], [a26[i], barGold, .075]].forEach(([v, m, o]) => {
  const b = new T.Mesh(barGeo, m); b.position.set(-2.05 + i * .37 + o, 0, Math.sin(i / 11 * Math.PI) * -.5); b.userData.h = Math.max(.02, v / mx * 3.1); b.userData.i = i; bars.add(b); barList.push(b);
});
const barBase = add(new T.Mesh(new T.BoxGeometry(4.6, .04, 1.1), new T.MeshPhysicalMaterial({ color: 0x0d1220, metalness: .8, roughness: .3 })), bars);
barBase.position.set(0, -.02, -.25);

/* the bridge of light: 5 steps of your journey */
const bridge = add(new T.Group(), anchor);
const curve = new T.CatmullRomCurve3([new T.Vector3(-2.3, -1.75, .7), new T.Vector3(-1.2, -.35, .45), new T.Vector3(.05, .5, .1), new T.Vector3(1.15, 1.05, -.2), new T.Vector3(1.95, 1.4, -.4)]);
const TUB = 240, RAD = 10;
const tubeGeo = new T.TubeGeometry(curve, TUB, .022, RAD, false);
const tubeMat = new T.MeshBasicMaterial({ color: 0xf0cf8f, toneMapped: false, transparent: true });
const tube = add(new T.Mesh(tubeGeo, tubeMat), bridge);
const tubeGlow = add(new T.Mesh(new T.TubeGeometry(curve, TUB, .09, 8, false), new T.MeshBasicMaterial({ color: 0xffb86b, transparent: true, opacity: .12, blending: T.AdditiveBlending, depthWrite: false })), bridge);
const nodes = [0, .25, .5, .75, 1].map((u, k) => {
  const g = add(new T.Group(), bridge); g.position.copy(curve.getPointAt(u));
  const orb = add(new T.Mesh(new T.SphereGeometry(.09, 32, 16), new T.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xf5c77e, emissiveIntensity: .4, metalness: .2, roughness: .1, clearcoat: 1 })), g);
  const gl = add(new T.Sprite(new T.SpriteMaterial({ map: softDot, color: 0xffc87a, transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending })), g);
  gl.scale.setScalar(.7); g.userData = { orb, gl, u }; return g;
});

/* office pillars: Chennai, Coimbatore, Bengaluru */
const pillars = add(new T.Group(), anchor); pillars.position.y = -2.32;
const pillarMat = new T.ShaderMaterial({
  transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, uniforms: { o: { value: 1 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: 'uniform float o;varying vec2 vUv;void main(){float a=pow(1.-vUv.y,1.5)*.55*o;gl_FragColor=vec4(vec3(.55,.8,1.)*a,a);}'
});
const pillarList = [-1.5, 0, 1.5].map((x, k) => {
  const g = add(new T.Group(), pillars); g.position.set(x, 0, k === 1 ? -.6 : 0);
  const col = add(new T.Mesh(new T.CylinderGeometry(.16, .16, 3.4, 32, 1, true), pillarMat), g); col.position.y = 1.7;
  const core = add(new T.Mesh(new T.CylinderGeometry(.018, .018, 3.4, 8), new T.MeshBasicMaterial({ color: 0xcfe9ff, toneMapped: false })), g); core.position.y = 1.7;
  const ring = add(new T.Mesh(new T.RingGeometry(.22, .3, 64), new T.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: .7, side: T.DoubleSide, toneMapped: false })), g); ring.rotation.x = -Math.PI / 2; ring.position.y = .01;
  const top = add(new T.Sprite(new T.SpriteMaterial({ map: softDot, color: 0xbfe6ff, transparent: true, opacity: .9, depthWrite: false, blending: T.AdditiveBlending })), g); top.scale.setScalar(.6); top.position.y = 3.4;
  g.userData = { col, core, ring, top }; return g;
});

/* ---------------- 4. render loop ---------------- */
let W = 0, H = 0;
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setPixelRatio(CAPTURE ? 1 : Math.min(devicePixelRatio || 1, MOB() ? 1.6 : 2));
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = W / H < 1 ? 42 : 32; camera.updateProjectionMatrix();
  measure();
}
let spinAngle = 0, lastT = 0;
const tmpCol = new T.Color(), cool = new T.Color(0xcfe4ff), warmC = new T.Color(0xffd79a);
function update(t, y) {
  const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
  const p = poseAt(y);
  const mob = MOB();
  /* where the 3D action sits: beside the text on computers, above it on phones */
  const ax = mob ? 0 : p.ax, ay = mob ? 1.55 + p.ay * .25 : p.ay, as = mob ? .5 * (p.ax === 0 ? 1.1 : 1) : p.as;
  anchor.position.set(ax, ay, 0); anchor.scale.setScalar(as);
  logo.position.set(p.lx, p.ly + Math.sin(t * .9) * .06, p.lz); logo.scale.setScalar(p.ls);
  spinAngle += dt * p.spin;
  logoSpin.rotation.y = p.ry + Math.sin(spinAngle) * .55;
  logoSpin.rotation.x = Math.sin(t * .6) * .05;
  /* light follows the logo */
  const wp = new T.Vector3(); logo.getWorldPosition(wp);
  keyTarget.position.copy(wp); key.position.set(wp.x * .6, 7.5, 2.5);
  beam.position.set(wp.x, wp.y + 4.6 * as + .3, wp.z - .2); beam.scale.setScalar(Math.max(.35, as * p.ls * 1.1));
  pool.position.x = wp.x; pool.scale.setScalar(.6 + as * p.ls * .8);
  tmpCol.copy(cool).lerp(warmC, p.warm); key.color.copy(tmpCol); beamMat.uniforms.col.value.copy(tmpCol); pool.material.color.copy(tmpCol);
  halo.material.color.set(0x3a8cff).lerp(new T.Color(0xffb054), p.warm * .7);
  /* rings */
  rings.forEach((r, k) => { const v = clamp(p.rings * 1.3 - k * .15); r.visible = v > .01; r.scale.setScalar(.6 + .4 * easeOut(v)); r.rotation.x = r.userData.base[0] + t * (.12 + k * .05); r.rotation.y = r.userData.base[1] + t * (.08 - k * .03); });
  ringMat.opacity = clamp(p.rings * 1.4);
  /* burst */
  const bv = p.burst; burst.visible = bv > .01; burstMat.opacity = clamp(bv * 1.2) * .9;
  if (burst.visible) { const a = bGeo.attributes.position.array; for (let i = 0; i < BURST; i++) { const k = (.35 + .65 * easeOut(bv)) * (1 + .04 * Math.sin(t * 1.3 + i)); a[i * 3] = bDir[i * 3] * k; a[i * 3 + 1] = bDir[i * 3 + 1] * k + Math.sin(t * .5 + i) * .05; a[i * 3 + 2] = bDir[i * 3 + 2] * k; } bGeo.attributes.position.needsUpdate = true; }
  /* bars */
  bars.visible = p.bars > .01;
  if (bars.visible) barList.forEach(b => { const v = easeOut(clamp(p.bars * 1.5 - b.userData.i * .04)); b.scale.y = Math.max(.001, b.userData.h * v); b.scale.x = b.scale.z = v > .01 ? 1 : .001; });
  barBase.scale.x = Math.max(.001, easeOut(clamp(p.bars * 2)));
  /* bridge */
  bridge.visible = p.bridge > .01;
  if (bridge.visible) {
    const n = Math.floor(TUB * clamp(p.bridge)) * RAD * 6;
    tubeGeo.setDrawRange(0, n); tubeGlow.geometry.setDrawRange(0, Math.floor(TUB * clamp(p.bridge)) * 8 * 6);
    nodes.forEach((g, k) => {
      const on = clamp((p.bridge - g.userData.u) * 8 + .2);
      const hi = k === Math.round(p.node) ? (p.nodeMix ?? 1) : 0;
      g.scale.setScalar(.001 + on * (1 + hi * .7 + Math.sin(t * 3 + k) * .04 * hi));
      g.userData.orb.material.emissiveIntensity = .5 + hi * 3;
      g.userData.gl.material.opacity = .35 + hi * .6; g.userData.gl.scale.setScalar(.7 + hi * 1.4);
    });
  }
  /* pillars */
  pillars.visible = p.pillars > .01;
  if (pillars.visible) pillarList.forEach((g, k) => { const v = easeOut(clamp(p.pillars * 1.6 - k * .2)); g.scale.set(1, Math.max(.001, v), 1); g.userData.top.material.opacity = .9 * v; g.userData.ring.material.opacity = .7 * v; });
  pillarMat.uniforms.o.value = clamp(p.pillars);
  /* dust drifts slowly */
  const da = dGeo.attributes.position.array;
  for (let i = 0; i < DUST; i++) { const s = dSeed[i]; da[i * 3] = dPos[i * 3] + Math.sin(t * .15 + s) * .3; da[i * 3 + 1] = ((dPos[i * 3 + 1] + t * .08 + 3.5) % 7) - 3.5; da[i * 3 + 2] = dPos[i * 3 + 2] + Math.cos(t * .12 + s) * .3; }
  dGeo.attributes.position.needsUpdate = true;
  /* the camera breathes a little and follows the scroll */
  camera.position.set(Math.sin(t * .13) * .12, .25 + Math.sin(t * .17) * .06, 10);
  camera.lookAt(0, 0, 0);
  updateDOM(y);
  renderer.render(scene, camera);
}

addEventListener('resize', resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
addEventListener('load', measure);
resize();
if (CAPTURE) {
  document.documentElement.style.scrollBehavior = 'auto';
  window.renderAt = (y, t) => { window.scrollTo({ top: y, behavior: 'instant' }); update(t, y); };
  window.pageLength = () => document.documentElement.scrollHeight - innerHeight;
  window.sectionTop = id => { const e = document.getElementById(id); return e.getBoundingClientRect().top + scrollY; };
} else {
  const t0 = performance.now();
  (function loop() { update((performance.now() - t0) / 1000, scrollY); requestAnimationFrame(loop); })();
}
})();
