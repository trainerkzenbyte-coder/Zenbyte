import * as THREE from 'three';
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
document.documentElement.style.setProperty('--logo', `url(${LOGO_SRC})`);
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
    const to = setTimeout(() => { fin(); res(null); }, 6000);
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
  sCam.aspect = w / h; sCam.fov = w / h < .9 ? 62 : 45; sCam.updateProjectionMatrix();
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
function enterNow(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (mode === 'loading') { B.classList.add('leaving'); $('load').classList.add('off'); $('fade').style.background = '#000'; $('fade').style.opacity = 1; T = END; enterOffice(); return; }
  if (mode === 'space' && warp < 0) { warp = 0; if (T < 8) T = 8; B.classList.add('leaving'); }
}
$('cta').addEventListener('pointerup', enterNow); $('cta').addEventListener('click', enterNow);

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
   PART 2 — THE REAL ZENBYTE OFFICE (real filmed video, people working)
   ----------------------------------------------------------------------
   Every page shows a real office clip. Clips live in the  videos/  folder
   of the website (copied there automatically by the GitHub workflow
   .github/workflows/fetch-videos.yml). Your own clip  videos/roomN.mp4
   always wins for room N. Each clip's photo (videos/<id>.jpg) shows
   instantly, so the background is never empty.
   ====================================================================== */
const CLIPS = {
  917: 'Open office space and staircase', 4809: 'Business people at work meeting',
  918: 'Busy office space', 42617: 'People working in the office',
  42620: 'People working on laptops', 5676: 'Businesswoman asks coworker about idea', 4835: 'Office workers typing on their devices',
  4872: 'Two coworkers talking and laughing', 315: 'Two business people walk in an office hall',
  4547: 'People having a work meeting around a table', 42644: 'Business meeting in a meeting room',
  313: 'Colleagues reading a report together', 46680: 'Brainstorming over the meeting table',
  30010: 'Two office men approving data with a handshake', 46750: 'CEO giving feedback to his team', 42666: 'Presentation during a work team meeting'
};
const ROOM_CLIPS = [[917, 4809], [918, 42617], [42620, 5676, 4835], [4872, 315], [4547, 42644], [313, 46680], [30010, 46750, 42666]];
const MIX = 'https://assets.mixkit.co/videos/';
function clipOf(i) { const k = PAGE_ROOM[i], j = ROOMS[k].pages.indexOf(i), c = ROOM_CLIPS[k]; return { k, id: c[j % c.length], key: k + ':' + c[j % c.length] }; }
const srcList = c => [`videos/room${c.k + 1}.mp4`, `videos/${c.id}.mp4`, `${MIX}${c.id}/${c.id}-720.mp4`];
const posterCSS = c => `url(videos/${c.id}.jpg), url(${MIX}${c.id}/${c.id}-thumb-720-0.jpg)`;

const pls = [...document.querySelectorAll('#stage .pl')], vids = pls.map(p => p.querySelector('video')), phs = pls.map(p => p.querySelector('.ph'));
const stageEl = $('stage'), doorsEl = $('doors');
let front = 0; const loaded = ['', ''], inflight = [null, null];
function loadClip(vi, c) {
  const v = vids[vi];
  phs[vi].style.backgroundImage = posterCSS(c);
  if (loaded[vi] === c.key) return Promise.resolve(true);
  if (inflight[vi] && inflight[vi].key === c.key) return inflight[vi].p;
  const p = new Promise(res => {
    const list = srcList(c); let i = 0, finished = false;
    const fin = ok => { if (finished) return; finished = true; v.onloadeddata = v.onerror = null; loaded[vi] = ok ? c.key : ''; pls[vi].classList.toggle('vid', ok); res(ok); };
    const next = () => { if (finished) return; if (i >= list.length) return fin(false); v.src = list[i++]; v.load(); };
    pls[vi].classList.remove('vid'); v.onloadeddata = () => fin(true); v.onerror = next; next();
    setTimeout(() => fin(v.readyState >= 2), 9000);
  });
  inflight[vi] = { key: c.key, p }; p.then(() => { if (inflight[vi] && inflight[vi].p === p) inflight[vi] = null; });
  return p;
}
function view(i) {
  const j = ROOMS[PAGE_ROOM[i]].pages.indexOf(i);
  const OX = [50, 34, 66, 42, 60, 50], OY = [50, 45, 55, 58, 45, 50];
  return { s: 1.04 + (j % 3) * .04, ox: OX[j % 6], oy: OY[j % 6], t: (j * .37) % 1 };
}
function frame(s, ox, oy, ms) {
  stageEl.style.transition = `transform ${ms}ms cubic-bezier(.25,.8,.25,1)`;
  stageEl.style.transformOrigin = `${ox}% ${oy}%`; stageEl.style.transform = `scale(${s})`;
}
function seek(v, t) { try { if (v.duration && isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration - .5, t * v.duration)); } catch (e) {} }
function swapTo(back, t) {
  const v = vids[back]; seek(v, t); v.play().catch(() => {});
  pls[front].classList.remove('on'); pls[back].classList.add('on');
  const old = vids[front]; setTimeout(() => old.pause(), 900); front = back;
}

let page = -1, busy = false, queued = null;
const wait = ms => new Promise(r => setTimeout(r, ms));
async function go(i, first) {
  i = Math.max(0, Math.min(P.length - 1, i));
  if (busy) { queued = i; return; }
  if (i === page && !first) return;
  busy = true;
  const kA = first ? -1 : PAGE_ROOM[page], C = clipOf(i), kB = C.k, V = view(i);
  const sameClip = !first && clipOf(page).key === C.key;
  page = i; updateNav(); hidePanel();
  if (kA !== kB) {
    /* ---- walk up to a glass door, it opens, walk into the next room ---- */
    B.classList.add('walking');
    $('sign').textContent = String(kB + 1).padStart(2, '0') + '  ·  ' + ROOMS[kB].name.toUpperCase();
    const back = 1 - front, ready = loadClip(back, C);
    if (!first) { stageEl.classList.add('blurwalk'); frame(1.3, 50, 50, 1100); doorsEl.className = 'closing'; await wait(1150); }
    else { doorsEl.className = 'closed'; }
    await Promise.race([ready, wait(first ? 3500 : 2500)]);
    swapTo(back, V.t);
    stageEl.style.transition = 'none'; stageEl.style.transformOrigin = '50% 50%'; stageEl.style.transform = 'scale(1.3)'; stageEl.classList.add('blurwalk');
    await wait(first ? 500 : 300);
    doorsEl.className = 'opening';
    requestAnimationFrame(() => { stageEl.classList.remove('blurwalk'); frame(V.s, V.ox, V.oy, 2600); });
    await wait(1700); B.classList.remove('walking'); doorsEl.className = '';
    showPanel(i);
  } else if (sameClip) {
    /* ---- step to another spot in the same scene ---- */
    stageEl.classList.add('blurwalk'); frame(V.s + .12, V.ox, V.oy, 700); await wait(520);
    seek(vids[front], V.t); stageEl.classList.remove('blurwalk'); frame(V.s, V.ox, V.oy, 1600);
    await wait(450); showPanel(i);
  } else {
    /* ---- walk deeper into the room: new people, new scene ---- */
    const back = 1 - front, ready = loadClip(back, C);
    stageEl.classList.add('blurwalk'); frame(V.s + .16, 50, 50, 900);
    await Promise.race([ready, wait(2200)]); await wait(200);
    swapTo(back, V.t);
    stageEl.style.transition = 'none'; stageEl.style.transform = `scale(${V.s + .14})`;
    requestAnimationFrame(() => { stageEl.classList.remove('blurwalk'); frame(V.s, V.ox, V.oy, 1800); });
    await wait(600); showPanel(i);
  }
  /* get the next page's clip ready in the hidden player */
  const nx = page + 1 < P.length ? clipOf(page + 1) : null;
  if (nx && nx.key !== clipOf(page).key) loadClip(1 - front, nx);
  busy = false;
  if (queued !== null) { const q = queued; queued = null; go(q); }
}
function hidePanel() { $('panel').classList.add('out'); }
function showPanel(i) {
  const el = $('panel'), side = i % 2 === 0 ? 'right' : 'left';
  el.className = side + ' out'; el.innerHTML = pageHTML(i); afterRender(i, el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('out')));
}
function enterOffice() {
  if (mode === 'office') return;
  mode = 'office'; B.classList.add('office'); clearInterval(qTimer); $('hint').style.display = 'none';
  const f = $('fade'); f.style.transition = 'opacity 1.8s';
  setTimeout(() => { f.style.opacity = 0; canvas.style.display = 'none'; }, 300);
  go(0, true);
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
addEventListener('wheel', e => {
  if (mode !== 'office') { if (mode === 'space' && e.deltaY > 30) skip(); return; }
  const c = e.target.closest('.card'); if (c && c.scrollHeight > c.clientHeight + 4) return;
  const n = Date.now(); if (n < wheelLock || Math.abs(e.deltaY) < 10 || busy) return; wheelLock = n + 1100; go(page + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
addEventListener('keydown', e => {
  if (mode === 'space') { if ([' ', 'Enter', 'Escape'].includes(e.key)) { e.preventDefault(); if (e.key === 'Enter') enterNow(); else skip(); } return; }
  if (mode !== 'office') return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(page + 1); }
  else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(page - 1); }
  else if (e.key === 'Home') go(0); else if (e.key === 'End') go(P.length - 1);
});
let ty0 = 0; addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', e => { if (mode !== 'office' || e.target.closest('.card')) return; const d = ty0 - e.changedTouches[0].clientY; if (Math.abs(d) > 50) go(page + (d > 0 ? 1 : -1)); }, { passive: true });
/* gentle "head movement" with the mouse */
addEventListener('pointermove', e => { if (mode === 'office') $('look').style.transform = `translate(${(e.clientX / innerWidth - .5) * -14}px,${(e.clientY / innerHeight - .5) * -9}px)`; });
document.addEventListener('visibilitychange', () => { if (mode === 'office') document.hidden ? vids[front].pause() : vids[front].play().catch(() => {}); });
/* mobile browsers sometimes block autoplay until a tap: retry on the first tap */
addEventListener('pointerdown', () => { if (mode === 'office' && vids[front].paused) vids[front].play().catch(() => {}); });

/* film grain for the real footage */
(function grain() {
  const c = $('grain'), x = c.getContext('2d'); c.width = c.height = 160; const d = x.createImageData(160, 160);
  let f = 0; (function tick() { if (mode === 'office' && f++ % 3 === 0) { for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } x.putImageData(d, 0, 0); } requestAnimationFrame(tick); })();
})();

/* ======================================================================
   START
   ====================================================================== */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; rt += dt;
  if (mode !== 'space') return;
  spaceFrame(dt);
  film.uniforms.uT.value = rt % 100;
  composer.render();
}
Promise.all([loadTex('earth-blue-marble.jpg'), loadTex('earth-night.jpg'), loadTex('earth-water.png', false), loadTex('night-sky.png'), logoImg.decode().catch(() => {}), document.fonts.ready])
  .then(([day, night, water, skyT]) => {
    if (day && night && water) { earthU.uDay.value = day; earthU.uNight.value = night; earthU.uSpec.value = water; earthU.uHas.value = 1; }
    if (skyT) { skyMat.map = skyT; skyMat.needsUpdate = true; sky.visible = true; }
    renderer.compile(space, sCam);
    $('load').classList.add('off'); if (mode === 'office') return; mode = 'space';
    loadClip(1, clipOf(0));   /* start downloading the first office video during the intro */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash === '#office') { T = END; $('fade').style.background = '#000'; $('fade').style.opacity = 1; enterOffice(); }
  });
requestAnimationFrame(loop);
