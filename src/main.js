import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

__CONTENT__

/* ================= SETTINGS YOU CAN CHANGE ================= */
const QUOTES = [
  "Every great career begins with one bright spark.",
  "You bring the dream. We light the path to it.",
  "Among a million stars, we help you find yours.",
  "No offer, no fee. Your success is our only measure.",
  "From your first visit to your first day at work, we walk with you."
];
const TEX = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/';

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);
const B = document.body, PI = Math.PI;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const seg = (t, a, b) => cl((t - a) / (b - a));
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const bell = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
const sstep = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const MOB = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(hover:none)').matches;
const LOGO_SRC = $('logo').src;
document.querySelectorAll('[data-logo]').forEach(e => e.tagName === 'LINK' ? e.href = LOGO_SRC : e.src = LOGO_SRC);
const logoImg = new Image(); logoImg.src = LOGO_SRC;

/* ================= RENDERER ================= */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const PR = Math.min(devicePixelRatio || 1, MOB ? 1.4 : 1.75);
renderer.setPixelRatio(PR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ANISO = renderer.capabilities.getMaxAnisotropy();
const ADD = THREE.AdditiveBlending;

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function ctex(c, srgb = true, rep) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function glowTex() { const c = cnv(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.22, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return ctex(c); }
const GT = glowTex();

const NOISE = `vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 nm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.03;a*=.5;}return f;}`;
const VS_UV = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

/* ================= LOADING ================= */
let pending = 0, done = 0;
const loadBar = $('lbar');
function track() { pending++; return () => { done++; loadBar.style.width = (done / pending * 100) + '%'; }; }
const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
function loadTex(name, srgb = true) {
  const fin = track();
  return new Promise(res => {
    const to = setTimeout(() => { fin(); res(null); }, 9000);
    loader.load(TEX + name, t => { clearTimeout(to); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; fin(); res(t); }, undefined, () => { clearTimeout(to); fin(); res(null); });
  });
}

/* ======================================================================
   PART 1 — SPACE
   ====================================================================== */
const space = new THREE.Scene();
const sCam = new THREE.PerspectiveCamera(45, 1, .5, 4000);
const S = { star: new THREE.Vector3(32, 22, -150), earthC: new THREE.Vector3(0, -79, -72), R: 60 };

/* sky (Milky Way photo) */
const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, color: 0x8a8a8a });
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 64, 32), skyMat); sky.rotation.set(.4, 2.2, .3); sky.visible = false; space.add(sky);

/* twinkling stars (appear one by one, random bright flares) */
const NS = MOB ? 4000 : 9000, sg = new THREE.BufferGeometry();
const sp = new Float32Array(NS * 3), sc = new Float32Array(NS * 3), sa = new Float32Array(NS * 6);
const PAL = [[.92, .96, 1], [.65, .78, 1], [1, .86, .64], [.6, .9, 1], [1, .78, .86]];
for (let i = 0; i < NS; i++) {
  const u = rnd() * 2 - 1, a = rnd() * PI * 2, r = 900 + rnd() * 500, s = Math.sqrt(1 - u * u);
  let x = Math.cos(a) * s, y = u, z = Math.sin(a) * s; if (z > .2 && rnd() < .7) z = -z;
  sp.set([x * r, y * r, z * r], i * 3);
  const c = PAL[rnd() < .62 ? 0 : (rnd() * 5 | 0)]; sc.set(c, i * 3);
  sa.set([.6 + Math.pow(rnd(), 3) * 3, .15 + Math.pow(rnd(), .75) * 4.4, rnd() * 30, 4 + rnd() * 10, rnd() < .2 ? 1 : 0, 1 + rnd() * 4], i * 6);
}
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
sg.setAttribute('aC', new THREE.BufferAttribute(sc, 3));
sg.setAttribute('aA', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(sa, 6), 3, 0));
sg.setAttribute('aB', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(sa, 6), 3, 3));
const starU = { uT: { value: 0 }, uPR: { value: PR }, uDim: { value: 1 }, uWarp: { value: 0 } };
const stars = new THREE.Points(sg, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: ADD, uniforms: starU,
  vertexShader: `attribute vec3 aC,aA,aB;uniform float uT,uPR,uDim,uWarp;varying vec3 vC;varying float vA,vX;
  void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
  float born=smoothstep(aA.y,aA.y+.5,uT);float bf=exp(-pow((uT-aA.y-.2)*4.,2.))*1.8;float ph=mod(uT+aA.z,aB.x);
  float fl=exp(-pow((ph-1.)*3.5,2.))*aB.y*step(aA.y+1.,uT);float tw=.6+.4*sin(uT*aB.z+aA.z*7.);
  vA=born*(tw*uDim+fl*2.6)+bf+uWarp*2.;vX=fl+bf;vC=aC;gl_PointSize=(aA.x*(1.+vX*1.8)+uWarp*6.)*uPR*1.6+1.;}`,
  fragmentShader: `varying vec3 vC;varying float vA,vX;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);
  float g=exp(-d*d*55.)+exp(-d*d*10.)*.22;float cr=(exp(-abs(p.x)*45.)*exp(-abs(p.y)*5.)+exp(-abs(p.y)*45.)*exp(-abs(p.x)*5.))*clamp(vX,0.,1.);
  gl_FragColor=vec4(mix(vC,vec3(1.),cr*.6)*1.3,(g+cr)*vA);}`
}));
stars.frustumCulled = false; space.add(stars);

/* Earth — real NASA textures (falls back to a generated planet if offline) */
const earthU = {
  uDay: { value: null }, uNight: { value: null }, uSpec: { value: null }, uHas: { value: 0 },
  uSun: { value: new THREE.Vector3(0, 1, 0) }, uLit: { value: 0 }, uT: { value: 0 },
  uSpot: { value: new THREE.Vector3() }, uSpotI: { value: 0 }
};
const earth = new THREE.Mesh(new THREE.SphereGeometry(S.R, 160, 120), new THREE.ShaderMaterial({
  uniforms: earthU,
  vertexShader: `varying vec2 vUv;varying vec3 vN,vP,vW;void main(){vUv=uv;vP=normalize(position);vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: NOISE + `uniform sampler2D uDay,uNight,uSpec;uniform float uHas,uLit,uT,uSpotI;uniform vec3 uSun,uSpot;varying vec2 vUv;varying vec3 vN,vP,vW;
  void main(){vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uSun);float d=dot(N,L);
  vec3 day,night;float water;
  if(uHas>.5){day=texture2D(uDay,vUv).rgb;night=texture2D(uNight,vUv).rgb;water=texture2D(uSpec,vUv).r;}
  else{float n=fbm(vP*2.2);float land=smoothstep(.02,.09,n);vec3 oc=mix(vec3(.004,.02,.07),vec3(.01,.06,.16),smoothstep(-.5,.05,n));
   vec3 gr=mix(vec3(.04,.1,.03),vec3(.25,.18,.08),smoothstep(-.2,.5,fbm(vP*6.+3.)));gr=mix(gr,vec3(.8),smoothstep(.8,.95,abs(vP.y)));
   day=mix(oc,gr,land);water=1.-land;night=vec3(1.,.7,.35)*land*smoothstep(.6,.9,snoise(vP*40.))*.6;}
  float dayK=smoothstep(-.12,.3,d);
  vec3 c=day*(max(d,0.)*1.9*uLit+.012);
  c+=night*(1.-dayK)*1.4;
  vec3 H=normalize(L+V);c+=vec3(1.,.93,.8)*pow(max(dot(N,H),0.),45.)*water*.9*uLit*step(0.,d);
  float cl=smoothstep(.12,.7,fbm(vP*3.2+vec3(uT*.006,0.,uT*.004)))*.85;
  c=mix(c,vec3(1.)*(max(d,0.)*1.5*uLit+.008),cl);
  float fr=pow(1.-max(dot(N,V),0.),3.);c+=vec3(.25,.55,1.)*fr*smoothstep(-.25,.4,d)*(.3+uLit)*.9;
  c+=vec3(.55,.85,1.)*exp(-dot(vW-uSpot,vW-uSpot)*.12)*uSpotI;
  gl_FragColor=vec4(c,1.);}`
}));
earth.position.copy(S.earthC); earth.rotation.set(.35, 2.6, .1); space.add(earth);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(S.R * 1.035, 120, 80), new THREE.ShaderMaterial({
  side: THREE.BackSide, transparent: true, depthWrite: false, blending: ADD, uniforms: { uSun: earthU.uSun, uLit: { value: 0 } },
  vertexShader: `varying vec3 vN,vWN;void main(){vN=normalize(normalMatrix*normal);vWN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform vec3 uSun;uniform float uLit;varying vec3 vN,vWN;void main(){float i=pow(clamp(-vN.z*3.6,0.,1.),2.2)*1.4;
  float s=smoothstep(-.4,.6,dot(-vWN,normalize(uSun)));gl_FragColor=vec4(vec3(.32,.62,1.)*i*(.25+s*1.4*uLit),1.);}`
}));
atmo.position.copy(S.earthC); space.add(atmo);

/* hero star + lens flare */
const heroU = { uI: { value: 0 }, uR: { value: 0 }, uT: { value: 0 } };
const hero = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: ADD, uniforms: heroU, vertexShader: VS_UV,
  fragmentShader: `uniform float uI,uR,uT;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float d=length(p);
  float core=exp(-d*d*120.)*3.+exp(-d*d*14.)*.6+exp(-d*3.2)*.25;float c=cos(uR),s=sin(uR);vec2 q=mat2(c,-s,s,c)*p;
  float sp=exp(-abs(q.y)*140.)*exp(-abs(q.x)*2.2)+exp(-abs(q.x)*140.)*exp(-abs(q.y)*2.2);vec2 r=mat2(.7071,-.7071,.7071,.7071)*q;
  float sp2=(exp(-abs(r.y)*200.)*exp(-abs(r.x)*5.)+exp(-abs(r.x)*200.)*exp(-abs(r.y)*5.))*.5;
  float a=(core+sp*.9+sp2)*uI*(1.-smoothstep(.85,1.,d));vec3 col=mix(vec3(.5,.82,1.),vec3(1.,.98,.92),clamp(core*.7,0.,1.));gl_FragColor=vec4(col*2.,clamp(a,0.,3.));}`
}));
hero.position.copy(S.star); space.add(hero);
function sprite(color, tex = GT) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: ADD, opacity: 0 })); return s; }
const flares = [[.5, .18, 0x7fc8ff], [.9, .07, 0xffd28a], [1.25, .12, 0x9a7fff], [1.7, .25, 0x5fe0ff], [2.1, .05, 0xffffff]].map(f => { const s = sprite(f[2]); s.userData = f; space.add(s); return s; });
const bloomS = sprite(0xcff3ff); space.add(bloomS);

/* person (realistic back-lit silhouette, reaching to the star) */
function personTex() {
  const c = cnv(256, 512), x = c.getContext('2d');
  const body = new Path2D();
  body.ellipse(128, 70, 26, 31, 0, 0, PI * 2);
  body.moveTo(112, 98); body.lineTo(144, 98); body.lineTo(146, 112);
  body.bezierCurveTo(172, 116, 182, 126, 186, 140);                        // right shoulder
  body.bezierCurveTo(198, 110, 212, 70, 226, 22);                           // raised right arm (outer)
  body.bezierCurveTo(232, 12, 244, 14, 240, 28);
  body.bezierCurveTo(228, 80, 214, 130, 196, 178);                          // inner arm back down
  body.bezierCurveTo(190, 196, 180, 206, 176, 214);
  body.bezierCurveTo(176, 250, 172, 278, 168, 300);                         // waist right
  body.bezierCurveTo(174, 360, 172, 420, 168, 492); body.lineTo(146, 496);  // right leg
  body.bezierCurveTo(142, 430, 136, 370, 130, 318);
  body.bezierCurveTo(124, 370, 118, 430, 112, 496); body.lineTo(90, 492);   // left leg
  body.bezierCurveTo(86, 420, 82, 360, 88, 300);
  body.bezierCurveTo(84, 270, 82, 240, 82, 214);
  body.bezierCurveTo(74, 250, 66, 290, 60, 318); body.lineTo(48, 316);     // left arm down
  body.bezierCurveTo(52, 270, 56, 210, 66, 150);
  body.bezierCurveTo(72, 124, 88, 114, 110, 112); body.closePath();
  x.fillStyle = '#05070d'; x.fill(body);
  x.save(); x.clip(body); x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(256, 0, 60, 300); g.addColorStop(0, 'rgba(170,230,255,.9)'); g.addColorStop(.25, 'rgba(90,170,230,.25)'); g.addColorStop(.6, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 512); x.restore();
  x.globalCompositeOperation = 'destination-over'; x.shadowColor = 'rgba(140,220,255,.9)'; x.shadowBlur = 18; x.fillStyle = 'rgba(120,200,255,.35)'; x.fill(body);
  return ctex(c);
}
const person = new THREE.Sprite(new THREE.SpriteMaterial({ map: personTex(), transparent: true, depthWrite: false, opacity: 0 }));
person.center.set(.5, .015); space.add(person);
const halo = sprite(0x6fdcff), ground = sprite(0x8fe6ff); space.add(halo, ground);
const footDir = new THREE.Vector3(-7, 60, 10).normalize(), FOOT = S.earthC.clone().addScaledVector(footDir, S.R);

/* light beam — camera-facing volumetric cone */
const beamGeo = new THREE.BufferGeometry();
beamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
beamGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
beamGeo.setIndex([0, 1, 2, 2, 1, 3]);
const beamU = { uT: { value: 0 }, uG: { value: 0 }, uLo: { value: 0 }, uOp: { value: 0 } };
const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: ADD, side: THREE.DoubleSide, uniforms: beamU, vertexShader: VS_UV,
  fragmentShader: `uniform float uT,uG,uLo,uOp;varying vec2 vUv;void main(){float y=vUv.y,x=(vUv.x-.5)*2.;
  float core=exp(-x*x*3.);float inner=exp(-x*x*45.);float vis=smoothstep(1.-uG,1.-uG+.04,y)*smoothstep(uLo,uLo+.06,y);
  float tip=exp(-pow((y-(1.-uG))*30.,2.))*step(uG,.995)*core*2.5;float st=.72+.28*sin(y*90.-uT*18.)*sin(x*7.+uT*2.);
  float a=((core*.35+inner*.9)*st*vis+tip)*uOp*smoothstep(0.,.05,y);vec3 c=mix(vec3(.35,.75,1.),vec3(1.,.97,.9),clamp(inner+tip,0.,1.));gl_FragColor=vec4(c*1.6,a);}`
}));
beam.frustumCulled = false; space.add(beam);
const NP = 360, pg = new THREE.BufferGeometry(), pa = new Float32Array(NP * 2);
for (let i = 0; i < NP; i++) { pa[i * 2] = rnd(); pa[i * 2 + 1] = rnd() * 2 - 1; }
pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
pg.setAttribute('aT', new THREE.BufferAttribute(pa, 2));
const partU = { uT: { value: 0 }, uA: { value: FOOT }, uB: { value: S.star }, uS: { value: new THREE.Vector3(1, 0, 0) }, uG: { value: 0 }, uLo: { value: 0 }, uOp: { value: 0 }, uPR: { value: PR } };
const parts = new THREE.Points(pg, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: ADD, uniforms: partU,
  vertexShader: `attribute vec2 aT;uniform float uT,uG,uLo,uOp,uPR;uniform vec3 uA,uB,uS;varying float vA;void main(){float t=fract(aT.x+uT*.28);float s=1.-t;
  vec3 p=mix(uB,uA,t)+uS*aT.y*mix(.3,3.2,t);vA=step(1.-uG,s)*step(uLo,s)*uOp*(.4+.6*fract(aT.x*13.));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(2.+fract(aT.x*7.)*4.)*uPR;}`,
  fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.8,.95,1.,exp(-d*d*30.)*vA);}`
}));
parts.frustumCulled = false; space.add(parts);

/* ======================================================================
   PART 2 — THE ZENBYTE OFFICE (walk-through, one room per chapter)
   ====================================================================== */
const office = new THREE.Scene();
const oCam = new THREE.PerspectiveCamera(MOB ? 62 : 52, 1, .05, 400);
const RW = 12, RH = 3.4, RD = 16, NR = ROOMS.length;
const pmrem = new THREE.PMREMGenerator(renderer);
office.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

/* --- procedural textures --- */
function woodCanvas(base, dark, cols = 8, w = 1024, h = 2048) {
  const c = cnv(w, h), x = c.getContext('2d'), pw = w / cols;
  for (let i = 0; i < cols; i++) {
    let y = -rnd() * 600;
    while (y < h) {
      const L = 500 + rnd() * 700, l = (rnd() - .5) * 14;
      x.fillStyle = `hsl(${base[0] + (rnd() - .5) * 6},${base[1]}%,${base[2] + l}%)`; x.fillRect(i * pw, y, pw, L);
      for (let k = 0; k < 26; k++) {
        x.strokeStyle = `rgba(${dark},${.05 + rnd() * .12})`; x.lineWidth = .6 + rnd() * 2; x.beginPath();
        const ox = i * pw + rnd() * pw; x.moveTo(ox, y);
        for (let yy = 0; yy < L; yy += 40) x.lineTo(ox + Math.sin((yy + k * 30) * .01 + k) * 4, y + yy);
        x.stroke();
      }
      x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(i * pw, y, pw, 3); y += L;
    }
    x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(i * pw, 0, 2, h);
  }
  return c;
}
function noiseCanvas(w, base, amp, scale = 1) {
  const c = cnv(w, w), x = c.getContext('2d'), d = x.createImageData(w, w);
  for (let i = 0; i < w * w; i++) { const n = (rnd() - .5) * amp; d.data[i * 4] = base[0] + n; d.data[i * 4 + 1] = base[1] + n; d.data[i * 4 + 2] = base[2] + n; d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0); if (scale > 1) { x.globalAlpha = .5; x.filter = 'blur(2px)'; x.drawImage(c, 0, 0); } return c;
}
function stoneCanvas() {
  const c = cnv(1024, 1024), x = c.getContext('2d');
  for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
    const l = 26 + (rnd() - .5) * 6; x.fillStyle = `hsl(30,6%,${l}%)`; x.fillRect(k * 512, r * 256, 512, 256);
    for (let n = 0; n < 900; n++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${rnd() * .05})`; x.fillRect(k * 512 + rnd() * 512, r * 256 + rnd() * 256, 2 + rnd() * 6, 2 + rnd() * 6); }
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(k * 512, r * 256, 512, 3); x.fillRect(k * 512, r * 256, 3, 256);
  }
  return c;
}
function codeCanvas(seedHue) {
  const c = cnv(512, 320), x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, 512, 320);
  x.fillStyle = '#161b22'; x.fillRect(0, 0, 512, 22); x.fillRect(0, 22, 60, 298);
  const cols = ['#ff7b72', '#79c0ff', '#d2a8ff', '#a5d6ff', '#7ee787', '#ffa657', '#8b949e'];
  for (let i = 0; i < 24; i++) { let xx = 72 + (rnd() * 4 | 0) * 18; const y = 34 + i * 12; while (xx < 480 && rnd() < .85) { const w = 14 + rnd() * 60; x.fillStyle = cols[(rnd() * 7 + seedHue) % 7 | 0]; x.fillRect(xx, y, w, 6); xx += w + 8; } }
  return c;
}
function artCanvas(h1, h2) {
  const c = cnv(512, 640), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 512, 640);
  g.addColorStop(0, `hsl(${h1},45%,82%)`); g.addColorStop(1, `hsl(${h2},40%,62%)`); x.fillStyle = g; x.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 6; i++) { x.fillStyle = `hsla(${rnd() < .5 ? h1 : h2},55%,${30 + rnd() * 40}%,.75)`; x.beginPath(); x.arc(rnd() * 512, rnd() * 640, 40 + rnd() * 160, 0, PI * 2); x.fill(); }
  return c;
}
function skyCanvas() {
  const c = cnv(2048, 1024), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, '#6f9fd6'); g.addColorStop(.45, '#b9cde6'); g.addColorStop(.7, '#f6d8b4'); g.addColorStop(1, '#f3c79a'); x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);
  const s = x.createRadialGradient(1500, 560, 0, 1500, 560, 520); s.addColorStop(0, 'rgba(255,248,230,1)'); s.addColorStop(.15, 'rgba(255,230,190,.8)'); s.addColorStop(1, 'rgba(255,220,180,0)'); x.fillStyle = s; x.fillRect(0, 0, 2048, 1024);
  for (let layer = 0; layer < 3; layer++) {
    let xx = -40; const base = 760 + layer * 70, col = ['rgba(120,140,170,.55)', 'rgba(90,105,130,.75)', 'rgba(60,70,88,.9)'][layer];
    while (xx < 2048) { const w = 40 + rnd() * 120, hh = 80 + rnd() * (340 - layer * 80); x.fillStyle = col; x.fillRect(xx, base - hh, w, 1024);
      if (layer == 2) for (let wy = base - hh + 12; wy < base; wy += 18) for (let wx = xx + 6; wx < xx + w - 8; wx += 14) if (rnd() < .35) { x.fillStyle = 'rgba(255,225,170,.5)'; x.fillRect(wx, wy, 6, 8); }
      xx += w + rnd() * 30; }
  }
  x.fillStyle = '#3d4a3a'; for (let i = 0; i < 80; i++) { x.beginPath(); x.arc(rnd() * 2048, 980 + rnd() * 30, 30 + rnd() * 50, 0, PI * 2); x.fill(); }
  return c;
}
function textCanvas(lines, w = 2048, h = 256, opts = {}) {
  const c = cnv(w, h), x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach(l => { x.font = l.f; x.fillStyle = l.c || '#fff'; if (l.ls) x.letterSpacing = l.ls; x.fillText(l.t, w / 2, l.y * h); });
  return c;
}

/* --- materials --- */
const M = {
  floor: new THREE.MeshPhysicalMaterial({ map: ctex(woodCanvas([30, 38, 52], '60,35,15'), true, [RW / 1.6, RD / 3.2]), roughness: .48, clearcoat: .35, clearcoatRoughness: .22 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xece7df, roughness: .93, map: ctex(noiseCanvas(256, [240, 238, 234], 10), true, [4, 2]) }),
  ceil: new THREE.MeshStandardMaterial({ color: 0xf2f1ee, roughness: 1 }),
  skirt: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .6 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x2b2f36, metalness: .85, roughness: .32 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xb9bec6, metalness: 1, roughness: .22 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x17191d, metalness: .6, roughness: .38 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xdcecf5, metalness: 0, roughness: .04, transparent: true, opacity: .16, envMapIntensity: 2, side: THREE.DoubleSide, depthWrite: false }),
  walnut: new THREE.MeshStandardMaterial({ map: ctex(woodCanvas([24, 42, 28], '30,15,5', 4, 512, 1024), true, [1, 1]), roughness: .42 }),
  oak: new THREE.MeshStandardMaterial({ map: ctex(woodCanvas([34, 40, 58], '80,50,20', 6, 512, 1024), true, [1, 1]), roughness: .5 }),
  white: new THREE.MeshPhysicalMaterial({ color: 0xf4f3f0, roughness: .25, clearcoat: .6 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0x3a4352, roughness: .95 }),
  fabric2: new THREE.MeshStandardMaterial({ color: 0x8a6b4f, roughness: .95 }),
  fabric3: new THREE.MeshStandardMaterial({ color: 0x5d6b5a, roughness: .95 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: .35, metalness: .2 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3d6f35, roughness: .65, side: THREE.DoubleSide }),
  leaf2: new THREE.MeshStandardMaterial({ color: 0x55893f, roughness: .65, side: THREE.DoubleSide }),
  pot: new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: .55 }),
  soil: new THREE.MeshStandardMaterial({ color: 0x2b2017, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ map: ctex(stoneCanvas(), true, [6, 3]), roughness: .75 }),
  paver: new THREE.MeshStandardMaterial({ map: ctex(stoneCanvas(), true, [14, 12]), roughness: .85, color: 0xb8b2aa }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: 1, roughness: .2 }),
  light: new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.8, 3.4) }),
  rug: new THREE.MeshStandardMaterial({ map: ctex(noiseCanvas(256, [60, 70, 88], 18), true, [6, 4]), roughness: 1 }),
  board: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: .3 })
};
const CODE = [0, 2, 4].map(h => new THREE.MeshBasicMaterial({ map: ctex(codeCanvas(h)), color: new THREE.Color(1.15, 1.15, 1.15) }));
const ACCENT = [0x1f2b40, 0x22313a, 0x2c2a3c, 0x203431, 0x3a2e28, 0x262b33, 0x1d2a3f];

/* --- geometry helpers --- */
function box(w, h, d, mat, x, y, z, parent, cast = true, rec = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = rec; (parent || office).add(m); return m;
}
function rbox(w, h, d, r, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
function cyl(rt, rb, h, mat, x, y, z, parent, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
function plane(w, h, mat, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = true; parent.add(m); return m; }
function grp(parent, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }

/* --- furniture --- */
function desk(p, x, z, ry, codeI = 0) {
  const g = grp(p, x, 0, z, ry);
  rbox(1.6, .04, .8, .015, M.oak, 0, .75, 0, g);
  [[-.75, -.35], [.75, -.35], [-.75, .35], [.75, .35]].forEach(([a, b]) => box(.04, .73, .04, M.metal, a, .365, b, g));
  box(.06, .3, .05, M.metal, 0, .92, -.22, g); box(.25, .015, .18, M.metal, 0, .775, -.22, g);
  rbox(.92, .54, .03, .01, M.black, 0, 1.2, -.24, g);
  const sc = plane(.88, .5, CODE[codeI % 3], g); sc.position.set(0, 1.2, -.223);
  rbox(.42, .015, .14, .005, M.frame, 0, .765, .1, g); box(.07, .01, .1, M.frame, .32, .765, .12, g);
  if (rnd() < .6) cyl(.04, .035, .1, M.white, -.6, .8, .15, g);
  chair(g, 0, .55, (rnd() - .5) * .4);
  return g;
}
function chair(p, x, z, ry) {
  const g = grp(p, x, 0, z, ry);
  rbox(.5, .08, .48, .03, M.fabric, 0, .47, 0, g); rbox(.48, .55, .07, .03, M.fabric, 0, .8, .22, g);
  cyl(.025, .025, .38, M.steel, 0, .25, 0, g, 12);
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; const l = box(.3, .03, .04, M.frame, Math.cos(a) * .15, .05, Math.sin(a) * .15, g); l.rotation.y = -a; }
  return g;
}
function plant(p, x, z, s = 1) {
  const g = grp(p, x, 0, z, rnd() * 6); g.scale.setScalar(s);
  cyl(.24, .19, .5, M.pot, 0, .25, 0, g, 32); cyl(.22, .22, .02, M.soil, 0, .48, 0, g);
  const lg = new THREE.SphereGeometry(.2, 10, 8); lg.scale(.35, 1, .08); lg.translate(0, .2, 0);
  for (let i = 0; i < 26; i++) {
    const l = new THREE.Mesh(lg, rnd() < .5 ? M.leaf : M.leaf2); l.castShadow = true; const h = .5 + rnd() * .9;
    l.position.set((rnd() - .5) * .15, .5 + h * .25, (rnd() - .5) * .15); l.rotation.set((rnd() - .5) * 1.3, rnd() * 6.3, (rnd() - .5) * 1.3);
    l.scale.setScalar(.8 + h); g.add(l);
  }
  return g;
}
function sofa(p, x, z, ry, mat = M.fabric2) {
  const g = grp(p, x, 0, z, ry);
  rbox(2.1, .42, .9, .08, mat, 0, .3, 0, g); rbox(2.1, .5, .22, .08, mat, 0, .65, .34, g);
  rbox(.22, .55, .9, .08, mat, -1.05, .45, 0, g); rbox(.22, .55, .9, .08, mat, 1.05, .45, 0, g);
  rbox(.9, .14, .66, .06, mat, -.47, .56, -.05, g); rbox(.9, .14, .66, .06, mat, .47, .56, -.05, g);
  [[-1, -.38], [1, -.38], [-1, .38], [1, .38]].forEach(([a, b]) => cyl(.025, .02, .1, M.walnut, a, .05, b, g, 10));
  return g;
}
function armchair(p, x, z, ry, mat = M.fabric3) {
  const g = grp(p, x, 0, z, ry);
  rbox(.85, .4, .8, .08, mat, 0, .3, 0, g); rbox(.85, .5, .2, .08, mat, 0, .65, .3, g);
  rbox(.16, .45, .8, .06, mat, -.4, .45, 0, g); rbox(.16, .45, .8, .06, mat, .4, .45, 0, g);
  return g;
}
function coffeeTable(p, x, z) { const g = grp(p, x, 0, z); cyl(.55, .55, .04, M.walnut, 0, .42, 0, g, 48); cyl(.05, .2, .4, M.metal, 0, .2, 0, g); return g; }
function pendant(p, x, z, h = 2.2) {
  const g = grp(p, x, 0, z); cyl(.004, .004, RH - h, M.frame, 0, (RH + h) / 2, 0, g, 6);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(.08, .26, .22, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: .7, roughness: .35, side: THREE.DoubleSide })); sh.position.y = h; g.add(sh);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), M.light); b.position.y = h - .08; g.add(b);
  return g;
}
function bookshelf(p, x, z, ry) {
  const g = grp(p, x, 0, z, ry); const W = 2, H = 2.3;
  box(W, .04, .4, M.walnut, 0, .02, 0, g); for (let i = 1; i <= 5; i++) box(W, .03, .4, M.walnut, 0, i * .45, 0, g);
  box(.04, H, .4, M.walnut, -W / 2, H / 2, 0, g); box(.04, H, .4, M.walnut, W / 2, H / 2, 0, g); box(W, H, .02, M.walnut, 0, H / 2, -.19, g, false);
  const cols = [0x6b2d2d, 0x2d3f6b, 0x3b5a3b, 0xc9b28a, 0x222222, 0x8a5a2b, 0xe8e2d6, 0x4a3b5a];
  for (let s = 0; s < 5; s++) { let xx = -W / 2 + .06; while (xx < W / 2 - .1) { const bw = .03 + rnd() * .04, bh = .26 + rnd() * .12;
    if (rnd() < .1) { xx += .12; continue; }
    const bk = box(bw, bh, .24 + rnd() * .06, new THREE.MeshStandardMaterial({ color: cols[rnd() * 8 | 0], roughness: .8 }), xx + bw / 2, s * .45 + .035 + bh / 2, .02, g); if (rnd() < .08) bk.rotation.z = .2; xx += bw + .004; } }
  return g;
}
function framedArt(p, x, y, z, ry, w, h, tex) {
  const g = grp(p, x, y, z, ry); rbox(w + .08, h + .08, .04, .005, M.frame, 0, 0, 0, g);
  const a = plane(w, h, new THREE.MeshStandardMaterial({ map: tex, roughness: .6 }), g); a.position.z = .022; return g;
}
function logoMat(intensity = 1.6) { const t = new THREE.Texture(logoImg); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(intensity, intensity, intensity), depthWrite: false }); }
function glowPlane(p, w, h, color, op = .5) { const m = plane(w, h, new THREE.MeshBasicMaterial({ map: GT, color, transparent: true, opacity: op, blending: ADD, depthWrite: false }), p); m.receiveShadow = false; return m; }

/* --- big wall screens (one per room) --- */
function screenCanvas(k) {
  const r = ROOMS[k], c = cnv(1600, 900), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1600, 900); g.addColorStop(0, '#081226'); g.addColorStop(1, '#0d2340'); x.fillStyle = g; x.fillRect(0, 0, 1600, 900);
  x.strokeStyle = 'rgba(80,170,255,.08)'; x.lineWidth = 1; for (let i = 0; i < 1600; i += 50) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 900); x.stroke(); } for (let i = 0; i < 900; i += 50) { x.beginPath(); x.moveTo(0, i); x.lineTo(1600, i); x.stroke(); }
  const rg = x.createRadialGradient(1250, 300, 0, 1250, 300, 520); rg.addColorStop(0, 'rgba(34,196,255,.35)'); rg.addColorStop(1, 'rgba(34,196,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, 1600, 900);
  try { x.drawImage(logoImg, 1060, 110, 380, 380); } catch (e) {}
  x.fillStyle = '#22c4ff'; x.font = '700 34px Inter,sans-serif'; x.letterSpacing = '10px'; x.fillText('ROOM ' + String(k + 1).padStart(2, '0') + '  ·  ZENBYTE TECHNOLOGIES', 110, 200);
  x.letterSpacing = '0px'; x.fillStyle = '#fff'; x.font = '800 118px "Exo 2",sans-serif';
  const words = r.name.split(' '); let line = '', yy = 340; words.forEach(w => { if (x.measureText(line + w).width > 900) { x.fillText(line, 106, yy); line = ''; yy += 130; } line += w + ' '; }); x.fillText(line, 106, yy);
  x.fillStyle = '#9fb6d6'; x.font = '500 40px Inter,sans-serif'; x.fillText(P[r.pages[0]].d.slice(0, 64) + (P[r.pages[0]].d.length > 64 ? '…' : ''), 110, yy + 90);
  /* theme graphics */
  x.save(); x.translate(110, 640);
  if (r.theme === 'record') { months(2025).forEach((v, i) => { x.fillStyle = '#22c4ff'; x.fillRect(i * 52, 200 - v * 3.2, 20, v * 3.2); x.fillStyle = '#f5c463'; const w = months(2026)[i]; x.fillRect(i * 52 + 22, 200 - w * 3.2, 20, w * 3.2); }); }
  else if (r.theme === 'journey') { ['Join', 'Profile', 'Calls', 'Interview', 'Offer'].forEach((s, i) => { x.strokeStyle = '#22c4ff'; x.lineWidth = 4; x.beginPath(); x.arc(40 + i * 230, 100, 40, 0, 7); x.stroke(); if (i < 4) { x.beginPath(); x.moveTo(80 + i * 230, 100); x.lineTo(230 + i * 230 - 40, 100); x.stroke(); } x.fillStyle = '#fff'; x.font = '800 40px "Exo 2"'; x.textAlign = 'center'; x.fillText(i + 1, 40 + i * 230, 114); x.font = '600 28px Inter'; x.fillText(s, 40 + i * 230, 190); x.textAlign = 'left'; }); }
  else if (r.theme === 'visits') { ['Chennai', 'Coimbatore', 'Bengaluru'].forEach((s, i) => { x.fillStyle = '#22c4ff'; x.beginPath(); x.arc(30 + i * 380, 90, 16, 0, 7); x.fill(); x.fillStyle = 'rgba(34,196,255,.25)'; x.beginPath(); x.arc(30 + i * 380, 90, 40, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '700 44px Inter'; x.fillText(s, 70 + i * 380, 106); }); }
  else if (r.theme === 'fees') { x.fillStyle = '#fff'; x.font = '800 90px "Exo 2"'; x.fillText('50%  +  EMI', 0, 130); }
  else if (r.theme === 'policies') { ['Replacement', 'Client rounds', 'Exit options'].forEach((s, i) => { x.strokeStyle = 'rgba(255,255,255,.3)'; x.strokeRect(i * 400, 30, 360, 130); x.fillStyle = '#fff'; x.font = '700 38px Inter'; x.fillText(s, i * 400 + 24, 110); }); }
  else if (r.theme === 'rewards') { x.fillStyle = '#f5c463'; x.font = '800 90px "Exo 2"'; x.fillText('Refer · Earn · Grow', 0, 130); }
  else { x.fillStyle = '#fff'; x.font = '800 80px "Exo 2"'; x.fillText('No offer, no fee.', 0, 120); }
  x.restore();
  return c;
}
function wallScreen(p, x, y, z, ry, k, w = 3.4) {
  const g = grp(p, x, y, z, ry), h = w * 9 / 16;
  rbox(w + .08, h + .08, .06, .02, M.black, 0, 0, 0, g);
  const tex = ctex(screenCanvas(k));
  const s = plane(w, h, new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.25, 1.25, 1.25) }), g); s.position.z = .032; s.receiveShadow = false;
  const gl = glowPlane(g, w * 1.6, h * 1.8, 0x2a8fff, .18); gl.position.z = -.02;
  g.userData.tex = tex; g.userData.k = k; return g;
}
const SCREENS = [];

/* --- doors (automatic glass double doors) --- */
const DOORS = [];
function door(p, z, label) {
  const g = grp(p, 0, 0, z), W = .95, H = 2.48, leaves = [];
  box(.08, H + .08, .16, M.frame, -W - .04, (H + .08) / 2, 0, g); box(.08, H + .08, .16, M.frame, W + .04, (H + .08) / 2, 0, g); box(2 * W + .16, .08, .16, M.frame, 0, H + .04, 0, g);
  [-1, 1].forEach(sd => {
    const piv = grp(g, sd * W, 0, 0); const leaf = grp(piv, -sd * W / 2, 0, 0);
    box(W, .06, .05, M.frame, 0, .03, 0, leaf); box(W, .06, .05, M.frame, 0, H - .03, 0, leaf);
    box(.05, H, .05, M.frame, -W / 2 + .025, H / 2, 0, leaf); box(.05, H, .05, M.frame, W / 2 - .025, H / 2, 0, leaf);
    const gl = plane(W - .1, H - .12, M.glass, leaf); gl.position.y = H / 2; gl.castShadow = false;
    cyl(.016, .016, 1.1, M.steel, sd * (W / 2 - .14), 1.05, .06, leaf, 12); cyl(.016, .016, 1.1, M.steel, sd * (W / 2 - .14), 1.05, -.06, leaf, 12);
    leaves.push({ piv, sd });
  });
  if (label) { const t = ctex(textCanvas([{ t: label, f: '700 120px Inter,sans-serif', y: .5, c: '#e9eef6', ls: '20px' }], 2048, 220));
    const sgn = plane(2.4, .26, new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(1.6, 1.6, 1.6) }), g); sgn.position.set(0, H + .45, .13); sgn.receiveShadow = false; }
  const d = { z, leaves, open: 0 }; DOORS.push(d); return d;
}

/* --- one room per chapter --- */
const ROOMG = [];
const LA = new THREE.PointLight(0xffe9cf, 26, 16, 2), LB = new THREE.PointLight(0xfff1df, 26, 16, 2); office.add(LA, LB);
const winZ = [.18, .5, .82];
function buildRoom(k) {
  const zf = -RD * k, zb = zf - RD, zc = (zf + zb) / 2, g = grp(office);
  ROOMG.push(g); g.userData.zc = zc;
  const fl = plane(RW, RD, M.floor, g); fl.rotation.x = -PI / 2; fl.position.set(0, 0, zc);
  const ce = plane(RW, RD, M.ceil, g); ce.rotation.x = PI / 2; ce.position.set(0, RH, zc); ce.castShadow = true;
  const acc = new THREE.MeshStandardMaterial({ color: ACCENT[k], roughness: .85 });
  /* left wall (solid) */
  box(.2, RH, RD, M.wall, -RW / 2 - .1, RH / 2, zc, g);
  box(.02, .1, RD, M.skirt, -RW / 2 + .01, .05, zc, g, false);
  /* right wall with windows + mullions (cast striped sunlight) */
  const sill = .75, top = 2.85, ww = 2.8;
  box(.2, sill, RD, M.wall, RW / 2 + .1, sill / 2, zc, g); box(.2, RH - top, RD, M.wall, RW / 2 + .1, (RH + top) / 2, zc, g);
  let zPrev = zf;
  winZ.forEach(f => { const wz = zf - RD * f; const a = wz + ww / 2, b = wz - ww / 2;
    box(.2, top - sill, zPrev - a, M.wall, RW / 2 + .1, (sill + top) / 2, (zPrev + a) / 2, g); zPrev = b;
    for (let m = 0; m <= 4; m++) box(.06, top - sill, .05, M.frame, RW / 2 + .02, (sill + top) / 2, a - m * ww / 4, g);
    box(.06, .05, ww, M.frame, RW / 2 + .02, sill, wz, g); box(.06, .05, ww, M.frame, RW / 2 + .02, top, wz, g); box(.06, .04, ww, M.frame, RW / 2 + .02, 2.25, wz, g);
    box(.32, .04, ww + .1, M.white, RW / 2 - .1, sill + .02, wz, g);
    const gp = plane(ww, top - sill, M.glass, g); gp.rotation.y = -PI / 2; gp.position.set(RW / 2 + .05, (sill + top) / 2, wz); gp.castShadow = false;
  });
  box(.2, top - sill, zPrev - zb, M.wall, RW / 2 + .1, (sill + top) / 2, (zPrev + zb) / 2, g);
  /* back wall (accent colour) with door, except the last room */
  if (k < NR - 1) {
    const dw = 1.03, dh = 2.56;
    box(RW / 2 - dw, RH, .2, acc, -(RW / 2 + dw) / 2, RH / 2, zb, g); box(RW / 2 - dw, RH, .2, acc, (RW / 2 + dw) / 2, RH / 2, zb, g); box(2 * dw, RH - dh, .2, acc, 0, (RH + dh) / 2, zb, g);
    door(g, zb, String(k + 2).padStart(2, '0') + '  ·  ' + ROOMS[k + 1].name.toUpperCase());
  } else box(RW, RH, .2, acc, 0, RH / 2, zb, g);
  /* ceiling light strips */
  [-2.6, 2.6].forEach(x => [zf - 4, zf - 12].forEach(z => { box(.16, .03, 3.2, M.light, x, RH - .015, z, g, false, false); box(.24, .02, 3.3, M.frame, x, RH - .005, z, g, false, false); }));
  /* big wall screen */
  SCREENS.push(wallScreen(g, -RW / 2 + .04, 1.75, zc, PI / 2, k));
  /* theme furniture */
  const T = ROOMS[k].theme;
  if (T === 'lobby') {
    const rd = grp(g, -2.4, 0, zb + 5.2); rbox(3.4, 1.05, .8, .06, M.white, 0, .525, 0, rd); rbox(3.5, .05, .9, .02, M.walnut, 0, 1.07, 0, rd);
    box(3.2, .03, .02, new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, 2.2, 3.2) }), 0, .12, .41, rd, false, false);
    const lg = plane(.62, .62, logoMat(1.4), rd); lg.position.set(0, .58, .405);
    chair(rd, -.6, -.75, PI); chair(rd, .7, -.8, PI + .2); pendant(rd, -.9, 0, 2.3); pendant(rd, 0, 0, 2.3); pendant(rd, .9, 0, 2.3);
    const bl = grp(g, -3.6, 1.95, zb + .12); glowPlane(bl, 3.6, 3.6, 0x2aa8ff, .55); const L = plane(1.7, 1.7, logoMat(1.9), bl); L.position.z = .01; L.receiveShadow = false;
    const nm = ctex(textCanvas([{ t: 'ZENBYTE', f: '900 150px "Exo 2",sans-serif', y: .38, c: '#ffffff' }, { t: 'TECHNOLOGIES', f: '600 70px Inter,sans-serif', y: .78, c: '#9fdcff', ls: '18px' }], 1024, 400));
    const N = plane(2.4, .94, new THREE.MeshBasicMaterial({ map: nm, transparent: true, color: new THREE.Color(1.3, 1.3, 1.3) }), g); N.position.set(3.4, 2.05, zb + .12); N.receiveShadow = false;
    const rug = plane(4.2, 3, M.rug, g); rug.rotation.x = -PI / 2; rug.position.set(3.2, .006, zf - 5.6);
    sofa(g, 3.2, zf - 4, 0); sofa(g, 4.9, zf - 5.6, PI / 2, M.fabric); coffeeTable(g, 3.2, zf - 5.6);
    plant(g, -5.3, zf - 1.2, 1.2); plant(g, 5.3, zb + .8, 1.1); plant(g, -.9 - 1.4, zb + .7, .9); plant(g, 1.6, zb + .7, .9);
    framedArt(g, -RW / 2 + .03, 1.7, zf - 2.6, PI / 2, .9, 1.2, ctex(artCanvas(200, 30)));
  } else if (T === 'record') {
    [-1.7, 1.9].forEach((x, i) => [-5, -8.4, -11.8].forEach((z, j) => desk(g, x, zf + z, 0, i + j)));
    plant(g, -5.2, zf - 1.2); plant(g, 5.1, zb + .9, 1.2); plant(g, -5.2, zb + .9);
    framedArt(g, -RW / 2 + .03, 1.7, zf - 13.2, PI / 2, 1, 1.3, ctex(artCanvas(180, 330)));
  } else if (T === 'journey') {
    const pos = [[-1.8, -3.6], [1.8, -5.6], [-1.8, -7.8], [1.8, -10], [-1.8, -12.2]];
    pos.forEach((p, i) => { desk(g, p[0], zf + p[1], 0, i);
      const n = ctex(textCanvas([{ t: String(i + 1), f: '900 200px "Exo 2"', y: .55, c: '#22c4ff' }], 256, 256));
      const d = plane(.7, .7, new THREE.MeshBasicMaterial({ map: n, transparent: true, depthWrite: false }), g); d.rotation.x = -PI / 2; d.position.set(p[0] + (p[0] < 0 ? 1.3 : -1.3), .008, zf + p[1] + .6); d.receiveShadow = false; });
    const wb = grp(g, -RW / 2 + .03, 1.55, zf - 13.4, PI / 2); rbox(2.2, 1.2, .03, .01, M.board, 0, 0, 0, wb);
    const wt = ctex(textCanvas([{ t: 'Join → Profile → Calls → Interview → Offer', f: '600 64px "Comic Sans MS",cursive', y: .45, c: '#1f4fa0' }, { t: 'Your placement journey', f: '600 48px "Comic Sans MS",cursive', y: .8, c: '#c0392b' }], 1600, 400));
    const w2 = plane(2.1, .52, new THREE.MeshStandardMaterial({ map: wt, transparent: true, roughness: .4 }), wb); w2.position.z = .02;
    plant(g, 5.2, zf - 1.2, 1.1); plant(g, -5.2, zb + .9, 1.2);
  } else if (T === 'visits') {
    armchair(g, 2.6, zf - 6, PI / 2 + .4); armchair(g, 2.6, zf - 8.2, PI / 2 - .4); coffeeTable(g, 1.6, zf - 7.1);
    const rug = plane(3.4, 4, M.rug, g); rug.rotation.x = -PI / 2; rug.position.set(2, .006, zf - 7.1);
    const clk = grp(g, 3.2, 2.5, zb + .12); cyl(.36, .36, .05, M.white, 0, 0, 0, clk, 48).rotation.x = PI / 2; const h1 = box(.02, .2, .01, M.black, 0, .08, .04, clk, false); const h2 = box(.015, .28, .01, M.black, .07, -.06, .045, clk, false); h2.rotation.z = -2.2; clk.userData.h = [h1, h2]; office.userData.clock = clk;
    desk(g, -2, zf - 12.2, 0, 1); plant(g, 5.2, zb + .9, 1.2); plant(g, -5.2, zf - 1.3, 1.1);
    framedArt(g, -3.4, 1.7, zb + .12, 0, 1.2, .9, ctex(artCanvas(20, 200)));
  } else if (T === 'fees') {
    const t = grp(g, 0, 0, zf - 8); rbox(4.4, .05, 1.5, .02, M.walnut, 0, .75, 0, t); box(.08, .72, 1, M.metal, -1.6, .36, 0, t); box(.08, .72, 1, M.metal, 1.6, .36, 0, t);
    [-1.5, -.5, .5, 1.5].forEach(x => { chair(t, x, -1.1, PI); chair(t, x, 1.1, 0); });
    pendant(t, -1.2, 0, 2.05); pendant(t, 0, 0, 2.05); pendant(t, 1.2, 0, 2.05);
    plant(g, 5.2, zf - 1.2); plant(g, -5.2, zb + .9, 1.1); plant(g, 5.2, zb + .9, .9);
    framedArt(g, 3.6, 1.7, zb + .12, 0, 1.3, .9, ctex(artCanvas(35, 220)));
  } else if (T === 'policies') {
    bookshelf(g, -RW / 2 + .25, zf - 3.2, PI / 2); bookshelf(g, -RW / 2 + .25, zf - 12.8, PI / 2); bookshelf(g, -3.4, zb + .25, 0); bookshelf(g, 3.4, zb + .25, 0);
    armchair(g, 2.4, zf - 5, PI / 2 + .3, M.fabric2); armchair(g, 2.4, zf - 7.2, PI / 2 - .3, M.fabric2); coffeeTable(g, 1.4, zf - 6.1);
    desk(g, 1.5, zf - 11.5, 0, 2); plant(g, 5.2, zf - 1.2, 1.1);
  } else if (T === 'rewards') {
    const bl = grp(g, 0, 1.9, zb + .12); glowPlane(bl, 5, 5, 0x2aa8ff, .6); const L = plane(2.2, 2.2, logoMat(2), bl); L.position.z = .01; L.receiveShadow = false;
    const ty = ctex(textCanvas([{ t: "Let's get you placed.", f: 'italic 300 110px "Exo 2",sans-serif', y: .5, c: '#ffd88a' }], 2048, 220));
    const tp = plane(4.4, .48, new THREE.MeshBasicMaterial({ map: ty, transparent: true, color: new THREE.Color(1.8, 1.6, 1.3) }), g); tp.position.set(0, 3.15, zb + .12); tp.receiveShadow = false;
    const sh = grp(g, 4, 1.4, zb + .2); box(2.2, .04, .3, M.walnut, 0, 0, 0, sh); box(2.2, .04, .3, M.walnut, 0, .6, 0, sh);
    [-.7, 0, .7].forEach((x, i) => { cyl(.12, .06, .22 + i * .04, M.gold, x, .13, 0, sh, 24); cyl(.04, .1, .05, M.gold, x, .03, 0, sh); cyl(.09, .09, .05, M.gold, x - .35, .64, 0, sh); });
    [[-3.2, -5], [-2, -6.4], [3, -5.6], [2, -7]].forEach(([x, z], i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.5, 32, 24), [M.fabric, M.fabric2, M.fabric3, M.fabric][i]); b.scale.set(1, .62, 1); b.position.set(x, .3, zf + z); b.castShadow = b.receiveShadow = true; g.add(b); });
    sofa(g, -3.8, zb + 3, 0); plant(g, -5.2, zb + .9, 1.2); plant(g, 5.3, zf - 1.2, 1.1); plant(g, -5.2, zf - 1.2, 1.1);
  }
}
for (let k = 0; k < NR; k++) buildRoom(k);

/* --- the building outside: facade, entrance, plaza, sky --- */
const ext = grp(office);
(function buildFacade() {
  const FW = 30, FH = 8.5, dw = 1.03, dh = 2.56, gx0 = 1.6, gx1 = 5.6, gy0 = .3, gy1 = 3.1;
  box((FW - 2 * gx1) / 2, FH, .4, M.stone, -(FW / 2 + gx1) / 2, FH / 2, .2, ext); box((FW - 2 * gx1) / 2, FH, .4, M.stone, (FW / 2 + gx1) / 2, FH / 2, .2, ext);
  box(2 * gx1, FH - gy1, .4, M.stone, 0, (FH + gy1) / 2, .2, ext); box(2 * gx1, gy0, .4, M.stone, 0, gy0 / 2, .2, ext);
  box(gx0 - dw, gy1 - gy0, .4, M.stone, -(gx0 + dw) / 2, (gy0 + gy1) / 2, .2, ext); box(gx0 - dw, gy1 - gy0, .4, M.stone, (gx0 + dw) / 2, (gy0 + gy1) / 2, .2, ext);
  box(2 * dw, gy1 - dh, .4, M.stone, 0, (gy1 + dh) / 2, .2, ext);
  [-1, 1].forEach(s => { const cx = s * (gx0 + gx1) / 2, w = gx1 - gx0;
    const gp = plane(w, gy1 - gy0, M.glass, ext); gp.position.set(cx, (gy0 + gy1) / 2, .25); gp.castShadow = false;
    for (let m = 0; m <= 3; m++) box(.06, gy1 - gy0, .08, M.frame, s * gx0 + s * m * w / 3, (gy0 + gy1) / 2, .3, ext);
    box(w, .06, .08, M.frame, cx, gy0, .3, ext); box(w, .06, .08, M.frame, cx, gy1, .3, ext); });
  door(ext, .2, null);
  /* wooden slat feature + canopy */
  for (let i = 0; i < 22; i++) box(.08, 4.6, .12, M.oak, -5.2 + i * .5, 5.95, .46, ext);
  box(6, .14, 2.2, M.frame, 0, 3.3, 1.3, ext);
  [-1.8, 0, 1.8].forEach(x => { const d = new THREE.Mesh(new THREE.CircleGeometry(.09, 24), M.light); d.rotation.x = PI / 2; d.position.set(x, 3.225, 1.6); ext.add(d); });
  const nm = ctex(textCanvas([{ t: 'ZENBYTE TECHNOLOGIES', f: '900 150px "Exo 2",sans-serif', y: .42, c: '#ffffff' }, { t: 'YOUR BRIDGE TO IT CAREERS', f: '600 58px Inter,sans-serif', y: .82, c: '#9fdcff', ls: '22px' }], 2048, 330));
  const N = plane(7.4, 1.2, new THREE.MeshBasicMaterial({ map: nm, transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }), ext); N.position.set(0, 4.15, .56); N.receiveShadow = false;
  const lb = grp(ext, 0, 6.6, .56); glowPlane(lb, 3.4, 3.4, 0x2aa8ff, .55); const L = plane(1.7, 1.7, logoMat(2), lb); L.position.z = .01; L.receiveShadow = false;
  const pv = plane(80, 40, M.paver, ext); pv.rotation.x = -PI / 2; pv.position.set(0, -.002, 20);
  [-3.2, 3.2].forEach(x => { const pl = grp(ext, x, 0, 2.2); rbox(1.4, .6, 1.4, .05, M.stone, 0, .3, 0, pl); plant(pl, 0, 0, 1.4).position.y = .3; });
  [-6.5, 6.5].forEach(x => { const sc = grp(ext, x, 2.6, .45); box(.18, .5, .14, M.frame, 0, 0, 0, sc); const d = plane(.12, .4, M.light, sc); d.position.z = .075; });
  /* outside world beyond the windows (golden-hour city) */
  const skyT = ctex(skyCanvas());
  const bd = plane(RD * NR + 40, 34, new THREE.MeshBasicMaterial({ map: skyT, color: new THREE.Color(1.5, 1.45, 1.4), fog: false }), office); bd.rotation.y = -PI / 2; bd.position.set(26, 10, -RD * NR / 2); bd.receiveShadow = false;
  const og = plane(40, RD * NR + 40, new THREE.MeshStandardMaterial({ color: 0xc9c2b6, roughness: .9 }), office); og.rotation.x = -PI / 2; og.position.set(RW / 2 + 20.2, -.01, -RD * NR / 2);
  const bgC = cnv(16, 512), bx = bgC.getContext('2d'), bgr = bx.createLinearGradient(0, 0, 0, 512); bgr.addColorStop(0, '#2a3f66'); bgr.addColorStop(.55, '#7a8fb5'); bgr.addColorStop(.85, '#e9b98d'); bgr.addColorStop(1, '#f2c999'); bx.fillStyle = bgr; bx.fillRect(0, 0, 16, 512);
  office.background = ctex(bgC);
})();

/* --- lighting --- */
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x6b5844, .55); office.add(hemi);
const sun = new THREE.DirectionalLight(0xffdcae, 5.2); sun.castShadow = true;
sun.shadow.mapSize.set(MOB ? 1024 : 2048, MOB ? 1024 : 2048); const sc2 = sun.shadow.camera; sc2.left = -14; sc2.right = 14; sc2.top = 12; sc2.bottom = -12; sc2.near = 1; sc2.far = 60;
sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 4; office.add(sun, sun.target);
const entrySpot = new THREE.SpotLight(0xfff0dc, 40, 14, .7, .6, 2); entrySpot.position.set(0, 3.1, 1.6); entrySpot.target.position.set(0, 0, 3); office.add(entrySpot, entrySpot.target);
office.traverse(o => { if (o.material && o.material.envMapIntensity !== undefined && o.material !== M.glass) o.material.envMapIntensity = .55; });

/* ======================================================================
   POST PROCESSING (bloom + film grain + vignette)
   ====================================================================== */
const composer = new EffectComposer(renderer);
const rp = new RenderPass(space, sCam); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .9, .55, .82); composer.addPass(bloom);
composer.addPass(new OutputPass());
const film = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uV: { value: 1.1 }, uG: { value: .035 } }, vertexShader: VS_UV,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uT,uV,uG;varying vec2 vUv;void main(){vec2 d=vUv-.5;vec4 c=texture2D(tDiffuse,vUv);
  c.r=texture2D(tDiffuse,vUv+d*.0025).r;c.b=texture2D(tDiffuse,vUv-d*.0025).b;c.rgb*=1.-dot(d,d)*uV;float n=fract(sin(dot(vUv*(uT+1.),vec2(12.9898,78.233)))*43758.5453);c.rgb+=(n-.5)*uG;gl_FragColor=c;}` });
composer.addPass(film);

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h);
  sCam.aspect = oCam.aspect = w / h; sCam.fov = w / h < .9 ? 62 : 45; sCam.updateProjectionMatrix(); oCam.updateProjectionMatrix();
}
resize(); addEventListener('resize', resize);

/* ======================================================================
   INTRO TIMELINE (space)
   ====================================================================== */
$('name').innerHTML = $('name').textContent.split('').map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
let qi = 0, qTimer = null;
function startQuotes() { if (qTimer) return; $('q').textContent = QUOTES[0]; qTimer = setInterval(() => { $('q').classList.add('out'); setTimeout(() => { qi = (qi + 1) % QUOTES.length; $('q').textContent = QUOTES[qi]; $('q').classList.remove('out'); }, 700); }, 4200); }
const STAGES = [[14.3, 's-logo'], [15.7, 's-name'], [16.9, 's-tag'], [17.6, 's-quote'], [18.4, 's-cta']];
const END = 18.6;
let T = 0, mode = 'loading', warp = -1, rt = 0;
function stage() { STAGES.forEach(s => { if (T >= s[0] && !B.classList.contains(s[1])) { B.classList.add(s[1]); if (s[1] === 's-quote') startQuotes(); } }); $('hint').style.opacity = mode === 'space' && T < 13.5 ? 1 : 0; }
function skip() { if (mode === 'space' && T < END) T = END; }
addEventListener('click', e => { if (!e.target.closest('button,input,.card')) skip(); });
$('cta').addEventListener('click', e => { e.stopPropagation(); if (mode === 'space' && warp < 0) warp = 0; });

const v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), camDir = new THREE.Vector3();
let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

function spaceFrame(dt) {
  T += dt; stage();
  starU.uT.value = T; starU.uDim.value = 1 - .3 * seg(T, 4.5, 7);
  skyMat.opacity = eo(seg(T, 1, 6)) * .9;
  /* camera: slow cinematic push + parallax */
  const push = eio(seg(T, 0, 14)), base = new THREE.Vector3(0, 2 - push * 2, 12 - push * 10);
  sCam.position.set(base.x + mx * 2, base.y - my * 1.2, base.z);
  sCam.lookAt(mx * 1.5, -6 + push * 3, -100);
  /* hero star */
  const ign = eo(seg(T, 4.6, 6.8)), merge = bell(T, 13.9, .45), fadeH = 1 - seg(T, 14.8, 16.5) * .75;
  heroU.uI.value = (ign * (.85 + .15 * Math.sin(rt * 3)) + merge * 3 + bell(T, 5, .25) * .8) * fadeH; heroU.uR.value = rt * .12; heroU.uT.value = rt;
  hero.scale.setScalar(26 + ign * 26 + merge * 160); hero.lookAt(sCam.position);
  bloomS.position.copy(S.star); bloomS.material.opacity = (ign * .4 + merge * 1.4) * fadeH; bloomS.scale.setScalar(40 + merge * 300 + ign * 30);
  /* lens flares */
  sCam.getWorldDirection(camDir); const C = sCam.position.clone().addScaledVector(camDir, sCam.position.distanceTo(S.star));
  flares.forEach(f => { const [k, s] = f.userData; f.position.copy(S.star).lerp(C, k); f.material.opacity = ign * .25 * fadeH * (1 - seg(T, 13.6, 14)); f.scale.setScalar(140 * s); });
  /* earth */
  earth.rotation.y = 2.6 + rt * .004; earthU.uT.value = rt;
  earthU.uLit.value = .25 + .75 * ign; earthU.uSun.value.copy(S.star).sub(S.earthC).normalize(); atmo.material.uniforms.uLit.value = .3 + .7 * ign;
  /* beam */
  const grow = eio(seg(T, 8, 10)), asc = eio(seg(T, 10.8, 13.5)), bOp = seg(T, 8, 8.3) * (1 - seg(T, 13.5, 14.1));
  v3.copy(S.star).sub(FOOT); v4.copy(sCam.position).sub(FOOT).cross(v3).normalize();
  const pos = beamGeo.attributes.position, wF = 5.5, wS = .9;
  const a0 = FOOT.clone().addScaledVector(v4, -wF), a1 = FOOT.clone().addScaledVector(v4, wF), b0 = S.star.clone().addScaledVector(v4, -wS), b1 = S.star.clone().addScaledVector(v4, wS);
  [a0, a1, b0, b1].forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z)); pos.needsUpdate = true;
  beamU.uT.value = rt; beamU.uG.value = grow; beamU.uLo.value = asc; beamU.uOp.value = bOp; beam.visible = bOp > 0;
  partU.uT.value = rt; partU.uS.value.copy(v4); partU.uG.value = grow; partU.uLo.value = asc; partU.uOp.value = bOp;
  earthU.uSpot.value.copy(FOOT); earthU.uSpotI.value = seg(T, 9.6, 10.2) * (1 - seg(T, 11, 13));
  ground.position.copy(FOOT); ground.material.opacity = earthU.uSpotI.value; ground.scale.set(16, 5, 1);
  /* person */
  const ph = 5.2, pv = seg(T, 6.5, 7.6) * (1 - seg(T, 13.2, 13.7)), gl = seg(T, 9.6, 10.8);
  person.position.copy(FOOT).lerp(S.star, asc); const ps = 1 - asc * .8; person.scale.set(ph * .5 * ps, ph * ps, 1);
  person.material.opacity = pv; person.visible = pv > 0; person.material.color.setScalar(1 + gl * 1.5);
  halo.position.copy(person.position); halo.position.y += ph * .5 * ps; halo.material.opacity = gl * pv * (.7 + .2 * Math.sin(rt * 6)); halo.scale.setScalar(ph * (1.6 + asc * 2) * ps + 2);
  /* flash */
  $('flash').style.opacity = bell(T, 14.05, .3).toFixed(3);
  /* warp into the office */
  if (warp >= 0) {
    warp += dt; const w = cl(warp / 2.2);
    starU.uWarp.value = w * w; sCam.fov = (sCam.aspect < .9 ? 62 : 45) + w * w * 50; sCam.updateProjectionMatrix();
    sCam.position.lerp(S.star, w * w * .9);
    B.classList.add('leaving'); $('fade').style.opacity = cl((warp - 1.6) / .6).toFixed(3); $('fade').style.background = '#fff';
    if (warp > 2.3) enterOffice();
  }
}

/* ======================================================================
   OFFICE WALK-THROUGH
   ====================================================================== */
let page = -1, walk = null;
const camLook = new THREE.Vector3(0, 2.4, 0), curLook = new THREE.Vector3();
function pose(i) {
  const k = PAGE_ROOM[i], r = ROOMS[k], j = r.pages.indexOf(i), n = r.pages.length, zf = -RD * k, zb = zf - RD;
  if (i === P.length - 1) return { p: new THREE.Vector3(.4, 1.62, zb + 7.2), l: new THREE.Vector3(0, 1.95, zb), side: 'left' };
  const z = zf - 2.6 - ((j + .5) / n) * 9.4, right = i % 2 === 0;
  return right ? { p: new THREE.Vector3(1.6, 1.62, z), l: new THREE.Vector3(-RW / 2, 1.5, z - 3.4), side: 'right' }
               : { p: new THREE.Vector3(-1.4, 1.62, z), l: new THREE.Vector3(3.6, 1.35, z - 6.5), side: 'left' };
}
function go(i, fromStart) {
  i = Math.max(0, Math.min(P.length - 1, i)); if (i === page && !fromStart) return;
  const target = pose(i), start = oCam.position.clone();
  const pts = [start], kA = fromStart ? -1 : PAGE_ROOM[page], kB = PAGE_ROOM[i];
  if (kB > kA) for (let k = kA; k < kB; k++) { const zd = -RD * (k + 1); pts.push(new THREE.Vector3(0, 1.62, zd + 2.3), new THREE.Vector3(0, 1.62, zd - 2.6)); }
  else if (kB < kA) for (let k = kA; k > kB; k--) { const zd = -RD * k; pts.push(new THREE.Vector3(0, 1.62, zd - 2.3), new THREE.Vector3(0, 1.62, zd + 2.6)); }
  pts.push(target.p);
  const curve = pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal', .5) : new THREE.LineCurve3(pts[0], pts[1]);
  const len = curve.getLength(), crosses = kA !== kB;
  walk = { curve, t: 0, dur: crosses ? Math.min(11, Math.max(2.2, len / 3.4)) : Math.max(1.5, len / 2), crosses, l0: curLook.clone(), l1: target.l };
  page = i; B.classList.toggle('walking', crosses);
  showPanel(i, target.side, crosses ? walk.dur * .82 : .45);
  updateNav();
}
let panelTimer;
function showPanel(i, side, delay) {
  const el = $('panel'); el.classList.add('out'); clearTimeout(panelTimer);
  panelTimer = setTimeout(() => { el.className = side + ' out'; el.innerHTML = pageHTML(i); afterRender(i, el); requestAnimationFrame(() => el.classList.remove('out')); }, delay * 1000);
}
function officeFrame(dt) {
  if (walk) {
    walk.t = Math.min(1, walk.t + dt / walk.dur); const e = eio(walk.t);
    walk.curve.getPointAt(e, oCam.position);
    if (walk.crosses) { const ahead = walk.curve.getPointAt(Math.min(1, e + .06)); ahead.y = 1.55; const lk = sstep(.78, 1, walk.t);
      v3.copy(ahead).sub(oCam.position).normalize().multiplyScalar(4).add(oCam.position); v3.y = 1.5; curLook.copy(v3).lerp(walk.l1, lk);
      if (walk.t < .2) curLook.lerp(walk.l0, 1 - walk.t / .2);
      oCam.position.y += Math.sin(walk.t * walk.dur * 7.5) * .018 * (1 - lk); }
    else curLook.copy(walk.l0).lerp(walk.l1, e);
    if (walk.t >= 1) { walk = null; B.classList.remove('walking'); }
  }
  oCam.lookAt(curLook.x + mx * .8, curLook.y - my * .5, curLook.z);
  /* automatic doors */
  DOORS.forEach(d => { const near = Math.abs(oCam.position.z - d.z), tgt = sstep(4.6, 1.6, near) * (Math.abs(oCam.position.x) < 3 ? 1 : 0);
    d.open += (tgt - d.open) * Math.min(1, dt * 4); d.leaves.forEach(l => l.piv.rotation.y = l.sd * -d.open * 1.5); });
  /* only light & draw nearby rooms (keeps it fast) */
  const kc = Math.max(0, Math.min(NR - 1, Math.floor(-oCam.position.z / RD)));
  ROOMG.forEach((g, k) => { g.visible = Math.abs(k - kc) <= 1; });
  LA.position.set(0, RH - .4, -RD * kc - 4.5); LB.position.set(0, RH - .4, -RD * kc - 11.5);
  ext.visible = oCam.position.z > -RD * 1.2;
  sun.position.set(oCam.position.x + 16, 13, oCam.position.z - 2); sun.target.position.set(oCam.position.x, 0, oCam.position.z - 6);
  const clk = office.userData.clock; if (clk) { const d = new Date(); clk.userData.h[1].rotation.z = -d.getMinutes() / 60 * PI * 2; clk.userData.h[0].rotation.z = -(d.getHours() % 12 + d.getMinutes() / 60) / 12 * PI * 2; }
}
function enterOffice() {
  mode = 'office'; B.classList.add('office'); rp.scene = office; rp.camera = oCam;
  bloom.strength = .45; bloom.threshold = .9; bloom.radius = .5; renderer.toneMappingExposure = 1.05;
  oCam.position.set(0, 1.7, 13); curLook.set(0, 3, 0); clearInterval(qTimer);
  const f = $('fade'); f.style.transition = 'opacity 1.6s'; requestAnimationFrame(() => f.style.opacity = 0);
  setTimeout(() => go(0, true), 900);
}

/* --- office UI --- */
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
  $('hudN').textContent = String(page + 1).padStart(2, '0') + ' / ' + P.length + '  ·  Room ' + (PAGE_ROOM[page] + 1);
  $('prev').disabled = page === 0; $('next').disabled = page === P.length - 1;
}
let wheelLock = 0;
addEventListener('wheel', e => { if (mode !== 'office') { if (mode === 'space' && e.deltaY > 30) skip(); return; } if (e.target.closest('.card') && e.target.closest('.card').scrollHeight > e.target.closest('.card').clientHeight) return;
  const n = Date.now(); if (n < wheelLock || Math.abs(e.deltaY) < 10 || (walk && walk.crosses)) return; wheelLock = n + 900; go(page + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
addEventListener('keydown', e => {
  if (mode === 'space') { if ([' ', 'Enter', 'Escape'].includes(e.key)) { e.preventDefault(); if (T >= END && e.key === 'Enter') $('cta').click(); else skip(); } return; }
  if (mode !== 'office') return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(page + 1); }
  else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(page - 1); }
  else if (e.key === 'Home') go(0); else if (e.key === 'End') go(P.length - 1);
});
let ty0 = 0; addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', e => { const d = ty0 - e.changedTouches[0].clientY; if (mode === 'space') return; if (e.target.closest('.card')) return; if (Math.abs(d) > 50) go(page + (d > 0 ? 1 : -1)); }, { passive: true });

/* ======================================================================
   START
   ====================================================================== */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; rt += dt;
  if (mode === 'space') spaceFrame(dt); else if (mode === 'office') officeFrame(dt); else return;
  film.uniforms.uT.value = rt % 100;
  composer.render();
}
Promise.all([loadTex('earth-blue-marble.jpg'), loadTex('earth-night.jpg'), loadTex('earth-water.png', false), loadTex('night-sky.png'), logoImg.decode().catch(() => {}), document.fonts.ready])
  .then(([day, night, water, skyT]) => {
    if (day && night && water) { earthU.uDay.value = day; earthU.uNight.value = night; earthU.uSpec.value = water; earthU.uHas.value = 1; }
    if (skyT) { skyMat.map = skyT; skyMat.needsUpdate = true; sky.visible = true; }
    SCREENS.forEach(s => { const c = screenCanvas(s.userData.k); s.userData.tex.image = c; s.userData.tex.needsUpdate = true; });
    renderer.compile(space, sCam); renderer.compile(office, oCam);
    $('load').classList.add('off'); mode = 'space';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash === '#office') { mode = 'space'; T = END; enterOffice(); }
  });
requestAnimationFrame(loop);
