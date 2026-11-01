/* =====================================================================
   ZENBYTE — walk through the real Zenbyte office, computer to computer
   ===================================================================== */
__CONTENT__

/* ---------- settings you can change ---------- */
const QUOTES = [
  "Every great career begins with one bright step.",
  "You bring the dream. We open the door to it.",
  "No offer, no fee. Your success is our only measure.",
  "From your first visit to your first day at work, we walk with you."
];
/* Where each page's walk starts and stops in the office video (seconds).
   The walk ends at a desk; the computer then shows that page. */
const SEG = [
  [0, 6.6, 'Reception'], [6.6, 9.6, 'Reception desk'], [9.6, 14.3, 'MD cabin'],
  [14.3, 20.5, 'Waiting lounge'], [20.5, 26.2, 'Interview corner'],
  [28.4, 33.8, 'Counselling cabin'], [33.8, 37.5, 'Counselling cabin'], [37.5, 42, 'Corridor'], [42, 47.2, 'Café'],
  [48.6, 52.5, 'Front office'], [52.5, 56.5, 'Front office'],
  [56.5, 61, 'Future corridor'], [61, 65.5, 'Future corridor'], [65.5, 70.5, 'Glass lounge'],
  [70.5, 74, 'Glass lounge'], [74, 79.5, 'AI Innovation Room'],
  [79.5, 84.5, 'AI Innovation Room'], [84.5, 88.4, 'Tech corridor'], [89, 93, 'Conference room'],
  [93, 95.35, 'Conference room'], [95.5, 99.8, 'Tech corridor'], [99.8, 104, 'Board room'], [104, 107.4, 'Board room']
];
const RATE = 1.15;   // walking speed

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id), B = document.body;
const wait = ms => new Promise(r => setTimeout(r, ms));
const MOB = Math.min(innerWidth, innerHeight) < 700;
const LOGO_SRC = $('logo').src;
document.querySelectorAll('[data-logo]').forEach(e => e.tagName === 'LINK' ? e.href = LOGO_SRC : e.src = LOGO_SRC);
document.documentElement.style.setProperty('--logo', `url(${LOGO_SRC})`);

const video = $('walk');
const big = innerWidth * (devicePixelRatio || 1) > 1500 && !MOB;
video.src = big ? 'media/walk-1080.mp4' : 'media/walk-720.mp4';
video.playbackRate = RATE;
video.addEventListener('error', () => { if (big && !video.dataset.retry) { video.dataset.retry = 1; video.src = 'media/walk-720.mp4'; } });

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

/* ---------- the computer (monitor) ---------- */
const desk = $('desk'), mon = $('mon'), screenEl = $('screen'), vd = $('vd'), full = $('full'), scene = $('scene');
function fitVD() { const w = screenEl.clientWidth; vd.style.transform = `scale(${w / 1280})`; }
new ResizeObserver(fitVD).observe(screenEl);
function zoomTransform() {
  desk.style.transition = 'none'; const t = desk.style.transform; desk.style.transform = 'none';
  const r = screenEl.getBoundingClientRect(), d = desk.getBoundingClientRect(); desk.style.transform = t; void desk.offsetWidth;
  const z = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.002;
  const ox = r.left + r.width / 2 - d.left, oy = r.top + r.height / 2 - d.top;
  desk.style.transformOrigin = `${ox}px ${oy}px`;
  return `translate(${innerWidth / 2 - (r.left + r.width / 2)}px, ${innerHeight / 2 - (r.top + r.height / 2)}px) scale(${z})`;
}
function staticCopy(from, to) {
  to.innerHTML = from.innerHTML;
  to.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  to.querySelectorAll('[data-h]').forEach(e => { e.style.transition = 'none'; e.style.height = e.dataset.h + '%'; });
  to.querySelectorAll('[data-w]').forEach(e => { e.style.transition = 'none'; e.style.width = e.dataset.w + '%'; });
  to.querySelectorAll('input').forEach(e => e.disabled = true);
}

/* ---------- walking ---------- */
let page = -1, busy = false, queued = null, zoomed = false;
function playTo(end) {
  return new Promise(res => {
    let done = false;
    const stop = () => { if (done) return; done = true; video.pause(); res(); };
    const tick = () => { if (done) return; if (video.currentTime >= end - .04 || video.ended) stop(); else requestAnimationFrame(tick); };
    video.playbackRate = RATE; video.play().catch(() => {}); requestAnimationFrame(tick);
    setTimeout(stop, ((end - video.currentTime) / RATE) * 1000 + 6000);   // safety if the video stalls
  });
}
function seekTo(t) {
  return new Promise(res => { if (Math.abs(video.currentTime - t) < .05) return res();
    const on = () => { video.removeEventListener('seeked', on); res(); }; video.addEventListener('seeked', on); video.currentTime = t; setTimeout(res, 2500); });
}
async function leaveComputer() {
  if (!zoomed) return;
  full.classList.remove('show'); await wait(320);
  desk.classList.remove('hide'); desk.style.transition = 'transform 1s cubic-bezier(.6,0,.2,1)'; desk.style.transform = 'none';
  await wait(950);
  desk.classList.remove('up'); scene.classList.remove('dof'); await wait(650);
  zoomed = false;
}
async function arriveAt(i) {
  /* prepare the page: real one (full screen) + a copy on the computer screen */
  full.innerHTML = `<div class="site">${pageHTML(i)}</div>`; afterRender(i, full);
  staticCopy(full, vd); vd.scrollTop = 0;
  scene.classList.add('dof');
  desk.style.transition = 'none'; desk.style.transform = 'none'; desk.classList.remove('hide');
  await wait(30); desk.classList.add('up');                 // the computer comes into view
  await wait(1250);
  desk.style.transform = zoomTransform(); void desk.offsetWidth;
  desk.style.transition = 'transform 1.25s cubic-bezier(.65,0,.25,1)'; desk.style.transform = zoomTransform();
  await wait(1200);
  full.scrollTop = 0; full.classList.add('show'); zoomed = true;
  await wait(380); desk.classList.add('hide');
}
async function go(i, first) {
  i = Math.max(0, Math.min(P.length - 1, i));
  if (busy) { queued = i; return; }
  if (i === page && !first) return;
  busy = true;
  page = i; updateNav();
  await leaveComputer();
  const [s, e, place] = SEG[i];
  $('walkTo').textContent = place;
  B.classList.add('walking');
  if (Math.abs(video.currentTime - s) > .35) { B.classList.add('blink'); await wait(260); await seekTo(s); B.classList.remove('blink'); }
  await playTo(e);
  B.classList.remove('walking');
  await arriveAt(i);
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
  $('hudN').textContent = String(page + 1).padStart(2, '0') + ' / ' + P.length + '  ·  ' + SEG[page][2];
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
addEventListener('resize', () => { if (zoomed) { desk.style.transition = 'none'; desk.style.transform = zoomTransform(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && !video.paused) video.pause(); });

/* ---------- film grain over the footage ---------- */
(function () {
  const c = $('grain'), x = c.getContext('2d'); c.width = c.height = 160; const d = x.createImageData(160, 160); let f = 0;
  (function tick() { if (f++ % 3 === 0) { for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; } x.putImageData(d, 0, 0); } requestAnimationFrame(tick); })();
})();
if (location.hash === '#office') enterNow();
