/* =====================================================================
   ZENBYTE — walk through the real Zenbyte office, room by room.
   In every room you walk up to a real screen, our page lights up on it,
   then the camera zooms into that screen and the page opens full screen.
   ===================================================================== */
__CONTENT__

/* ---------- settings you can change ---------- */
const QUOTES = [
  "Every great career begins with one bright step.",
  "You bring the dream. We open the door to it.",
  "No offer, no fee. Your success is our only measure.",
  "From your first visit to your first day at work, we walk with you."
];
/* The rooms. All positions are in pixels of the original 816×464 video.
   frame : the video frame where we stop in front of the screen (30 frames per second)
   walk  : the parts of the video we walk through to get there, [from, to] in seconds
   screen: the 4 corners of the real screen in that frame — top-left, top-right, bottom-right, bottom-left
   ratio : shape of the page drawn on the screen (width / height)
   cover : parts of the room that stand IN FRONT of the screen (a glass frame, a pillar), [x1, y1, x2, y2] */
const ROOMS_3D = [
  { name: 'Reception',       frame: 285,  walk: [[0, 9.5]],                    screen: [[334.3, 175.7], [396.7, 190], [396.7, 245], [333.3, 249]], ratio: 16 / 9 },
  { name: 'Glass lounge',    frame: 2232, walk: [[61, 74.4]],                  screen: [[566.7, 129], [676, 93.3], [674, 233.3], [566.7, 219]],      ratio: 16 / 9, cover: [[579.3, 0, 592, 464]] },
  { name: 'Conference room', frame: 2388, walk: [[74.4, 79.6]],                screen: [[310.7, 55], [515.7, 58.3], [515.7, 162.7], [310.7, 162.7]], ratio: 16 / 9, cover: [[350.8, 30, 419.4, 200]] },
  { name: 'Strategy room',   frame: 2724, walk: [[79.6, 88.35], [89.0, 90.8]], screen: [[359.5, 153], [552, 148.5], [552, 252], [359.5, 251]],       ratio: 16 / 9 },
  { name: 'Innovation wall', frame: 2904, walk: [[90.8, 95.35], [95.5, 96.8]], screen: [[195, 74], [505, 101], [505, 297], [195, 305]],             ratio: 1.5 },
  { name: 'Board room',      frame: 3150, walk: [[96.8, 105.0]],               screen: [[481.7, 195], [679.3, 184], [678.3, 304], [481.7, 278.3]],  ratio: 16 / 9 }
];
/* which room shows which page (page numbers start at 0) */
const PAGE_AT = [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5];
const WALK_SECONDS = 6.5;   // how long a walk between rooms should take
const VW = 816, VH = 464;   // size of the original video

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id), B = document.body;
const wait = ms => new Promise(r => setTimeout(r, ms));
const MOB = Math.min(innerWidth, innerHeight) < 700;
const LOGO_SRC = $('logo').src;
document.querySelectorAll('[data-logo]').forEach(e => e.tagName === 'LINK' ? e.href = LOGO_SRC : e.src = LOGO_SRC);
document.documentElement.style.setProperty('--logo', `url(${LOGO_SRC})`);
const stillURL = r => `media/stops/stop-${r.frame}${MOB ? '-m' : ''}.jpg`;

const video = $('walk'), stage = $('stage'), still = $('still'), occ = $('occ'), scr = $('scr'), scrIn = $('scrIn'), full = $('full');
const big = innerWidth * (devicePixelRatio || 1) > 1500 && !MOB;
video.src = big ? 'media/walk-1080.mp4' : 'media/walk-720.mp4';
video.addEventListener('error', () => { if (big && !video.dataset.retry) { video.dataset.retry = 1; video.src = 'media/walk-720.mp4'; } });
/* preload the room photos (sharp AI-upscaled frames) */
const okStill = {};
ROOMS_3D.forEach((r, k) => { const im = new Image(); im.onload = () => okStill[k] = true; im.src = stillURL(r); });

/* ---------- intro: logo first ---------- */
$('name').innerHTML = $('name').textContent.split('').map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
let qi = 0; $('q').textContent = QUOTES[0];
const qTimer = setInterval(() => { $('q').classList.add('out'); setTimeout(() => { qi = (qi + 1) % QUOTES.length; $('q').textContent = QUOTES[qi]; $('q').classList.remove('out'); }, 700); }, 4200);
requestAnimationFrame(() => B.classList.add('s-intro'));
let mode = 'intro';
function enterNow(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (mode !== 'intro') return;
  mode = 'office'; clearInterval(qTimer); B.classList.add('entering');
  video.play().then(() => video.pause()).catch(() => {});  // unlock playback on mobile (inside the tap)
  setTimeout(() => { B.classList.add('office'); go(0, true); }, 900);
}
$('cta').addEventListener('pointerup', enterNow); $('cta').addEventListener('click', enterNow);

/* ---------- camera: the video is laid out to cover the screen, then panned / zoomed ---------- */
let S = 1, panX = 0, panY = 0, focus = null;          // focus = room whose screen we look at
function layout() {
  const W = innerWidth, H = innerHeight;
  S = Math.max(W / VW, H / VH);
  const w = VW * S, h = VH * S;
  panX = (W - w) / 2; panY = (H - h) / 2;
  if (focus) {                                         // keep the screen in view on narrow (phone) screens
    const c = centre(focus.screen);
    panX = Math.min(0, Math.max(W - w, W / 2 - c[0] * S));
    panY = Math.min(0, Math.max(H - h, H * .46 - c[1] * S));
  }
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  stage.style.left = panX + 'px'; stage.style.top = panY + 'px';
  if (focus) placeScreen(focus);
}
const centre = q => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
function zoomTo(r, on, ms) {
  stage.style.transition = ms ? `transform ${ms}ms cubic-bezier(.62,0,.22,1), left .9s cubic-bezier(.4,0,.2,1), top .9s cubic-bezier(.4,0,.2,1)` : 'none';
  if (!on) { stage.style.transform = 'none'; return; }
  const q = r.screen, xs = q.map(p => p[0]), ys = q.map(p => p[1]);
  const x0 = Math.min(...xs) * S, x1 = Math.max(...xs) * S, y0 = Math.min(...ys) * S, y1 = Math.max(...ys) * S;
  const W = innerWidth, H = innerHeight;
  const z = Math.min(W / (x1 - x0), H / (y1 - y0)) * 1.04;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;            // centre of the screen inside the stage
  const tx = W / 2 - panX - cx * z, ty = H / 2 - panY - cy * z;
  stage.style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
}

/* ---------- perspective: map the flat page onto the 4 corners of the real screen ---------- */
function homography(w, h, q) {
  const src = [[0, 0], [w, 0], [w, h], [0, h]], A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = q[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  for (let c = 0; c < 8; c++) {                       // Gaussian elimination
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  const h8 = b.map((v, i) => v / A[i][i]);
  return `matrix3d(${h8[0]},${h8[3]},0,${h8[6]},${h8[1]},${h8[4]},0,${h8[7]},0,0,1,0,${h8[2]},${h8[5]},0,1)`;
}
const SW = 1280;
function placeScreen(r) {
  const SH = Math.round(SW / r.ratio);
  scr.style.width = SW + 'px'; scr.style.height = SH + 'px';
  scr.style.transform = homography(SW, SH, r.screen.map(p => [p[0] * S, p[1] * S]));
  /* things standing in front of the screen are drawn again on top of it */
  if (r.cover) occ.style.clipPath = 'polygon(evenodd,' + r.cover.map(([a, b2, c, d]) => {
    const X = v => (v / VW * 100) + '%', Y = v => (v / VH * 100) + '%';
    return `${X(a)} ${Y(b2)},${X(c)} ${Y(b2)},${X(c)} ${Y(d)},${X(a)} ${Y(d)},${X(a)} ${Y(b2)}`;
  }).join(',') + ')';
}
function fitCard() {
  const c = scrIn.querySelector('.card'); if (!c) return;
  const SH = parseFloat(scr.style.height);
  c.style.transform = 'none';
  const k = Math.min(1.25, (SW - 120) / c.offsetWidth, (SH - 110) / c.offsetHeight);
  c.style.transform = `scale(${k})`; c.style.marginTop = '46px';
}
function screenPage(i) {
  scrIn.innerHTML = pageHTML(i);
  scrIn.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  scrIn.querySelectorAll('[data-h]').forEach(e => { e.style.transition = 'none'; e.style.height = e.dataset.h + '%'; });
  scrIn.querySelectorAll('[data-w]').forEach(e => { e.style.transition = 'none'; e.style.width = e.dataset.w + '%'; });
  scrIn.querySelectorAll('input').forEach(e => e.disabled = true);
  fitCard();
}
function fullPage(i, r) {
  full.innerHTML = `<div class="fbg" style="background-image:url('${okStill[ROOMS_3D.indexOf(r)] ? stillURL(r) : 'media/poster.jpg'}')"></div><div class="fshade"></div><div class="site">${pageHTML(i)}</div>`;
  afterRender(i, full);
  full.scrollTop = 0;
  /* make the page fill big screens nicely */
  const c = full.querySelector('.card');
  if (c && innerWidth > 900) {
    const k = Math.max(1, Math.min(1.55, (innerWidth * .78) / c.offsetWidth, (innerHeight - 190) / c.offsetHeight));
    c.style.zoom = k.toFixed(3);
  }
}

/* ---------- walking ---------- */
let page = -1, room = -1, busy = false, queued = null, zoomed = false;
function playTo(end, rate) {
  return new Promise(res => {
    let done = false;
    const stop = () => { if (done) return; done = true; video.pause(); res(); };
    const tick = () => { if (done) return; if (video.currentTime >= end - .03 || video.ended) stop(); else requestAnimationFrame(tick); };
    video.playbackRate = rate; video.play().catch(() => {}); requestAnimationFrame(tick);
    setTimeout(stop, ((end - video.currentTime) / rate) * 1000 + 6000);   // safety if the video stalls
  });
}
function seekTo(t) {
  return new Promise(res => {
    if (Math.abs(video.currentTime - t) < .02) return res();
    const on = () => { video.removeEventListener('seeked', on); res(); };
    video.addEventListener('seeked', on); video.currentTime = t; setTimeout(res, 2500);
  });
}
async function zoomOut() {                       // from the full page back to the screen in the room
  if (!zoomed) return;
  full.classList.remove('show'); B.classList.remove('zoomin');
  zoomTo(ROOMS_3D[room], false, 1300); await wait(700);
  if (ROOMS_3D[room].cover && okStill[room]) occ.classList.add('on');
  await wait(650);
  zoomed = false;
}
async function leaveScreen() {
  await zoomOut();
  scr.classList.remove('on'); occ.classList.remove('on'); B.classList.remove('atscreen');
  await wait(250);
  still.classList.remove('on');
  focus = null; layout();
}
async function walkTo(k) {
  const r = ROOMS_3D[k], parts = r.walk;
  const total = parts.reduce((s, p) => s + p[1] - p[0], 0);
  const rate = Math.min(2.2, Math.max(1.1, total / WALK_SECONDS));
  $('walkTo').textContent = r.name; B.classList.add('walking');
  for (let j = 0; j < parts.length; j++) {
    const [s, e] = parts[j];
    if (Math.abs(video.currentTime - s) > .3) {
      const cut = j > 0;                          // a cut inside the walk is quick, a jump gets a blink
      B.classList.add('blink'); await wait(cut ? 120 : 260); await seekTo(s); B.classList.remove('blink');
    }
    await playTo(e, rate);
  }
  await seekTo((r.frame + .5) / 30);             // land exactly on the frame with the screen
  B.classList.remove('walking');
}
async function arrive(k, i) {
  const r = ROOMS_3D[k];
  focus = r; layout();                           // on phones the camera turns towards the screen
  if (okStill[k]) { still.src = occ.src = stillURL(r); still.classList.add('on'); }
  else { occ.removeAttribute('src'); }
  $('roomName').textContent = r.name; B.classList.add('atscreen');
  screenPage(i);
  await wait(MOB ? 700 : 350);
  scr.classList.add('on'); if (r.cover && okStill[k]) occ.classList.add('on');
  await wait(1500);                              // the page lights up on the screen
}
async function zoomIn(i) {
  const r = ROOMS_3D[room];
  fullPage(i, r);
  B.classList.add('zoomin'); occ.classList.remove('on');   // the camera moves past whatever stands in front
  zoomTo(r, true, 1500); await wait(1380);
  full.classList.add('show'); zoomed = true;
  await wait(400);
}
async function go(i, first) {
  i = Math.max(0, Math.min(P.length - 1, i));
  if (busy) { queued = i; return; }
  if (i === page && !first) return;
  busy = true;
  const k = PAGE_AT[i];
  page = i; updateNav();
  if (k === room && zoomed) {
    /* same room: back to the screen, it switches to the next page, zoom in again */
    await zoomOut();
    scr.classList.add('flick'); screenPage(i); await wait(700); scr.classList.remove('flick');
    await zoomIn(i);
  } else {
    await leaveScreen();
    room = k;
    await walkTo(k);
    await arrive(k, i);
    await zoomIn(i);
  }
  busy = false;
  if (queued !== null) { const q = queued; queued = null; go(q); }
}

/* ---------- navigation UI ---------- */
const chap = $('chap'), rail = $('rail');
chap.innerHTML = ROOMS.map((r, k) => `<button data-k="${k}">${E(r.name)}</button>`).join('');
rail.innerHTML = P.map((p, i) => `<button data-i="${i}" aria-label="Go to page ${i + 1}"></button>`).join('');
chap.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(ROOMS[+b.dataset.k].pages[0]); });
rail.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(+b.dataset.i); });
$('prev').onclick = () => go(page - 1); $('next').onclick = () => go(page + 1);
function updateNav() {
  [...chap.children].forEach((b, k) => b.classList.toggle('on', k === PAGE_ROOM[page]));
  [...rail.children].forEach((b, i) => b.classList.toggle('on', i === page));
  $('hudT').textContent = P[page].e; $('hudB').style.width = ((page + 1) / P.length * 100) + '%';
  $('hudN').textContent = String(page + 1).padStart(2, '0') + ' / ' + P.length + '  ·  ' + ROOMS_3D[PAGE_AT[page]].name;
  $('prev').disabled = page === 0; $('next').disabled = page === P.length - 1;
}
let wheelLock = 0;
addEventListener('wheel', e => {
  if (mode !== 'office') return;
  const sc = e.target.closest('#full'); if (sc && sc.scrollHeight > sc.clientHeight + 4) {
    const atEnd = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2, atTop = sc.scrollTop <= 0;
    if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atTop)) return; }
  const n = Date.now(); if (n < wheelLock || Math.abs(e.deltaY) < 12 || busy) return; wheelLock = n + 1200; go(page + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
addEventListener('keydown', e => {
  if (mode === 'intro') { if (e.key === 'Enter' || e.key === ' ') enterNow(e); return; }
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); go(page + 1); }
  else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(page - 1); }
  else if (e.key === 'Home') go(0); else if (e.key === 'End') go(P.length - 1);
});
let tx0 = 0, ty0 = 0;
addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', e => { if (mode !== 'office') return; const dx = tx0 - e.changedTouches[0].clientX, dy = ty0 - e.changedTouches[0].clientY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(page + (dx > 0 ? 1 : -1)); }, { passive: true });
addEventListener('resize', () => { layout(); if (zoomed) zoomTo(ROOMS_3D[room], true, 0); });
document.addEventListener('visibilitychange', () => { if (document.hidden && !video.paused) video.pause(); });
layout();

/* ---------- light film grain over the footage ---------- */
(function () {
  const c = $('grain'), x = c.getContext('2d'); c.width = c.height = 160; const d = x.createImageData(160, 160); let f = 0;
  (function tick() { if (f++ % 3 === 0) { for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14; } x.putImageData(d, 0, 0); } requestAnimationFrame(tick); })();
})();
if (location.hash === '#office') enterNow();
