/* =====================================================================
   ZENBYTE INTRO — under the sea
   The Zenbyte star is a starfish. It swims through a coral reef full of
   fish, then rises to the centre; the name and "Enter Zenbyte" appear.
   ===================================================================== */
function ZenSea(renderer, CAPTURE) {
  const T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  let rnd = 7; const R = () => { rnd = (rnd * 16807) % 2147483647; return (rnd - 1) / 2147483646; };   // repeatable random
  const MOB = () => innerWidth < 900;

  const scene = new T.Scene();
  const FOG = new T.Color(0x0b5a7e);
  scene.fog = new T.FogExp2(FOG, .034);
  const camera = new T.PerspectiveCamera(48, 1, .1, 800);
  const uTime = { value: 0 };

  /* ---------- sky of the sea: brighter towards the surface ---------- */
  const sky = new T.Mesh(new T.SphereGeometry(700, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { fogC: { value: FOG } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 fogC;varying vec3 vP;void main(){float h=vP.y;vec3 deep=fogC*.45,mid=fogC,top=vec3(.36,.8,.92);vec3 c=mix(deep,mid,smoothstep(-.6,0.,h));c=mix(c,top,smoothstep(.25,.98,h));gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}'
  }));
  scene.add(sky);

  /* ---------- lights ---------- */
  scene.add(new T.HemisphereLight(0xaef3ff, 0x0b3044, 1.5));
  const sun = new T.DirectionalLight(0xd8fbff, 2.4); sun.position.set(4, 20, 6); scene.add(sun);
  const rim = new T.DirectionalLight(0x4fd2ff, 1.2); rim.position.set(-8, 4, -10); scene.add(rim);
  const starLight = new T.PointLight(0x9fe2ff, 6, 9, 1.6); scene.add(starLight);

  /* ---------- shader helpers (fog + sway) ---------- */
  const fogChunk = `float fd=length(vV);float ff=1.-exp(-fogD*fogD*fd*fd);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogC,clamp(ff,0.,1.));`;
  const fogU = { fogC: { value: FOG }, fogD: { value: .034 } };
  function sway(mat, amp, freq = 1.2) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float sw = pow(max(position.y,0.)/${(1).toFixed(1)},1.3);
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
        #else
          vec3 ip = vec3(modelMatrix[3][0],modelMatrix[3][1],modelMatrix[3][2]);
        #endif
        float ph = ip.x*.37+ip.z*.53;
        transformed.x += sin(uTime*${freq.toFixed(2)}+ph+position.y*.7)*sw*${amp.toFixed(3)};
        transformed.z += cos(uTime*${(freq * .8).toFixed(2)}+ph*1.3+position.y*.5)*sw*${(amp * .6).toFixed(3)};`);
    };
    return mat;
  }

  /* ---------- sandy sea floor with moving caustic light ---------- */
  const floorGeo = new T.PlaneGeometry(600, 600, 220, 220); floorGeo.rotateX(-Math.PI / 2);
  { const p = floorGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Math.sin(x * .21) * .35 + Math.cos(z * .17 + x * .05) * .45 + Math.sin(x * .9 + z * .7) * .06); } floorGeo.computeVertexNormals(); }
  const floorMat = new T.ShaderMaterial({
    uniforms: Object.assign({ uTime }, fogU),
    vertexShader: 'varying vec3 vW;varying vec3 vV;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mv=viewMatrix*w;vV=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader: `uniform float uTime;uniform vec3 fogC;uniform float fogD;varying vec3 vW;varying vec3 vV;varying vec3 vN;
      float caustic(vec2 uv,float t){vec2 p=mod(uv*6.2831,6.2831)-250.;vec2 i=p;float c=1.;float inten=.005;
        for(int n=0;n<4;n++){float tt=t*(1.-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}
        c/=4.;c=1.17-pow(c,1.4);return pow(abs(c),8.);}
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec3 sand=vec3(.78,.7,.52);float g=h(floor(vW.xz*40.));sand*=.88+g*.16;
        float light=.35+.55*max(dot(normalize(vN),normalize(vec3(.2,1.,.3))),0.);
        float c=caustic(vW.xz*.07,uTime*.35)+caustic(vW.xz*.11+.3,uTime*.28)*.6;
        vec3 col=sand*light*vec3(.55,.85,.95)+vec3(.6,.95,1.)*c*.55;
        gl_FragColor=vec4(col,1.);${fogChunk}
#include <colorspace_fragment>
}`
  });
  floorMat.vertexShader = floorMat.vertexShader; scene.add(new T.Mesh(floorGeo, floorMat));

  /* ---------- the water surface seen from below ---------- */
  const surf = new T.Mesh(new T.PlaneGeometry(600, 600, 1, 1), new T.ShaderMaterial({
    side: T.DoubleSide, transparent: true, depthWrite: false, uniforms: Object.assign({ uTime }, fogU),
    vertexShader: 'varying vec3 vW;varying vec3 vV;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vV=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader: `uniform float uTime;uniform vec3 fogC;uniform float fogD;varying vec3 vW;varying vec3 vV;
      float n(vec2 p){return sin(p.x)*sin(p.y);}
      void main(){vec2 p=vW.xz*.18;float w=n(p+uTime*.3)+n(p*1.7-uTime*.25)*.6+n(p*3.1+vec2(uTime*.4,0.))*.3;
        float s=smoothstep(.55,1.4,w);vec3 col=mix(vec3(.25,.7,.85),vec3(.9,1.,1.),s);
        gl_FragColor=vec4(col,1.);float fd=length(vV);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogC,clamp(1.-exp(-.0012*fd*fd),0.,1.));
#include <colorspace_fragment>
}`
  }));
  surf.rotation.x = Math.PI / 2; surf.position.y = 20; scene.add(surf);

  /* ---------- god rays from the surface ---------- */
  const rayMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false, uniforms: { uTime, k: { value: 1 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform float uTime;uniform float k;varying vec2 vUv;void main(){float e=smoothstep(0.,.5,vUv.x)*smoothstep(1.,.5,vUv.x);float a=e*pow(vUv.y,1.6)*.14*k;gl_FragColor=vec4(vec3(.75,.97,1.)*a,a);}'
  });
  const rays = [];
  for (let i = 0; i < 14; i++) {
    const w = 1.5 + R() * 3.5, m = new T.Mesh(new T.PlaneGeometry(w, 30), rayMat.clone());
    m.material.uniforms.uTime = uTime; m.material.uniforms.k.value = .5 + R() * .7;
    m.position.set(-20 + R() * 40, 6, -36 + R() * 34); m.rotation.z = -.25 + R() * .12; m.userData = { s: R() * 10, x: m.position.x };
    rays.push(m); scene.add(m);
  }

  /* ---------- rocks and coral reef ---------- */
  function noiseBlob(geo, amt, seed) {
    const p = geo.attributes.position, v = V3(0, 0, 0);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 2) * Math.sin(v.z * 3.3 + seed * .5); v.multiplyScalar(1 + n * amt); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); return geo;
  }
  const rockMat = new T.MeshStandardMaterial({ color: 0x6b6a5e, roughness: .95 });
  const reef = new T.Group(); scene.add(reef);
  const CORAL = [0xff6f61, 0xff9a3c, 0xd94f9c, 0x9b5de5, 0xf15bb5, 0xfee440, 0x00bbf9, 0xff4d6d];
  function branchCoral(x, z, s, col) {
    const g = new T.Group(), mat = sway(new T.MeshStandardMaterial({ color: col, roughness: .7 }), .06, 1.4);
    const geo = new T.CylinderGeometry(.06, .1, 1, 6); geo.translate(0, .5, 0);
    const tip = new T.SphereGeometry(.09, 8, 6);
    (function grow(parent, len, depth) {
      const n = depth === 0 ? 4 : 2 + (R() < .5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const b = new T.Mesh(geo, mat); b.scale.set(1, len, 1);
        const pivot = new T.Group(); pivot.rotation.set((R() - .5) * (depth ? 1.1 : .7), R() * 6.28, (R() - .5) * (depth ? 1.1 : .7));
        pivot.add(b); parent.add(pivot);
        const end = new T.Group(); end.position.y = len; pivot.add(end);
        if (depth < 2) grow(end, len * .7, depth + 1); else { const t = new T.Mesh(tip, mat); end.add(t); }
      }
    })(g, .8, 0);
    g.position.set(x, -.1, z); g.scale.setScalar(s); reef.add(g);
  }
  function brainCoral(x, z, s, col) {
    const m = new T.Mesh(noiseBlob(new T.SphereGeometry(1, 40, 24), .08, R() * 9), new T.MeshStandardMaterial({ color: col, roughness: .85 }));
    m.scale.set(s, s * .6, s); m.position.set(x, s * .25, z); reef.add(m);
  }
  function fanCoral(x, z, s, col) {
    const sh = new T.Shape(); sh.moveTo(0, 0); for (let a = 0; a <= 1; a += .1) sh.lineTo(Math.cos(Math.PI * a) * 1.2 * (1 + .1 * Math.sin(a * 17)), .2 + Math.sin(Math.PI * a) * 1.5); sh.lineTo(0, 0);
    const g = new T.ShapeGeometry(sh, 12);
    const m = new T.Mesh(g, sway(new T.MeshStandardMaterial({ color: col, roughness: .8, side: T.DoubleSide, transparent: true, opacity: .92 }), .12, 1));
    m.position.set(x, 0, z); m.rotation.y = R() * 3; m.scale.setScalar(s); reef.add(m);
  }
  function anemone(x, z, s) {
    const g = new T.Group(); g.position.set(x, .1, z); g.scale.setScalar(s); reef.add(g);
    const base = new T.Mesh(new T.CylinderGeometry(.45, .55, .35, 16), new T.MeshStandardMaterial({ color: 0x7a2e5c, roughness: .8 })); base.position.y = .15; g.add(base);
    const tGeo = new T.CylinderGeometry(.025, .045, .9, 5, 6); tGeo.translate(0, .45, 0);
    const inst = new T.InstancedMesh(tGeo, sway(new T.MeshStandardMaterial({ color: 0xffb4d9, roughness: .5, emissive: 0x3a0a20 }), .25, 1.6), 90);
    const o = new T.Object3D();
    for (let i = 0; i < 90; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * .42; o.position.set(Math.cos(a) * r, .3, Math.sin(a) * r); o.rotation.set(Math.sin(a) * r * 1.2, 0, -Math.cos(a) * r * 1.2); o.scale.setScalar(.7 + R() * .6); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }
    g.add(inst);
  }
  function rock(x, z, s) { const m = new T.Mesh(noiseBlob(new T.IcosahedronGeometry(1, 3), .25, R() * 9), rockMat); m.scale.set(s * (1 + R() * .5), s * (.5 + R() * .4), s); m.position.set(x, s * .15, z); m.rotation.y = R() * 6; reef.add(m); }
  for (let i = 0; i < 70; i++) {
    const x = -28 + R() * 56, z = -48 + R() * 46;
    if (Math.abs(x) < 3.5 && z > -6) continue;           // keep the hero spot clear
    const r = R(), col = CORAL[Math.floor(R() * CORAL.length)];
    if (r < .3) rock(x, z, .6 + R() * 1.6);
    else if (r < .55) branchCoral(x, z, .7 + R() * .9, col);
    else if (r < .75) brainCoral(x, z, .5 + R() * .8, col);
    else if (r < .92) fanCoral(x, z, .7 + R() * .8, col);
    else anemone(x, z, 1 + R() * .6);
  }
  anemone(-3.6, -3.2, 1.5); brainCoral(4.2, -3.5, 1.1, 0xff9a3c); branchCoral(-5.5, -1.5, 1.2, 0xff6f61); fanCoral(5.8, -5.5, 1.4, 0xd94f9c); rock(3, -6, 1.6); rock(-7, -6, 2);
  /* kelp forest framing the sides */
  const kelpGeo = new T.PlaneGeometry(.5, 1, 2, 24); kelpGeo.translate(0, .5, 0);
  { const p = kelpGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (.35 + .9 * Math.sin(Math.PI * Math.min(1, y * 1.05)) ) * (1 + .25 * Math.sin(y * 40))); } kelpGeo.computeVertexNormals(); }
  const kelpMat = sway(new T.MeshStandardMaterial({ color: 0x6b7f2c, roughness: .6, side: T.DoubleSide, emissive: 0x101c04, transparent: true, opacity: .95 }), .9, .7);
  const KN = 40, kelp = new T.InstancedMesh(kelpGeo, kelpMat, KN), ko = new T.Object3D();
  for (let i = 0; i < KN; i++) { const sd = i % 2 ? 1 : -1; ko.position.set(sd * (11 + R() * 16), 0, -45 + R() * 40); ko.scale.set(1 + R(), 7 + R() * 9, 1); ko.rotation.y = R() * 3; ko.updateMatrix(); kelp.setMatrixAt(i, ko.matrix); }
  scene.add(kelp);

  /* ---------- fish ---------- */
  function mergeGeos(list) {
    const pos = [], nor = [], col = [];
    list.forEach(([g, c]) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); const p = n.attributes.position, q = n.attributes.normal;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(q.getX(i), q.getY(i), q.getZ(i)); const cc = typeof c === 'function' ? c(p.getX(i), p.getY(i), p.getZ(i)) : c; col.push(cc.r, cc.g, cc.b); } });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); return g;
  }
  const C = h => new T.Color(h);
  function fishGeo(sp) {
    /* body along +x (head) to -x (tail), height y, thin in z */
    const body = new T.SphereGeometry(.5, 28, 16), p = body.attributes.position;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const taper = x < 0 ? 1 + x * 1.15 : 1 - x * x * .9; p.setXYZ(i, x, y * sp.h * taper * 2, z * sp.w * taper * 2); }
    const tail = new T.Shape(); tail.moveTo(-.42, 0); tail.quadraticCurveTo(-.62, sp.tail * .55, -.78, sp.tail); tail.quadraticCurveTo(-.68, 0, -.78, -sp.tail); tail.quadraticCurveTo(-.62, -sp.tail * .55, -.42, 0);
    const fin = new T.Shape(); fin.moveTo(.12, sp.h * .9); fin.quadraticCurveTo(-.05, sp.h * .9 + sp.fin, -.3, sp.h * .55); fin.lineTo(.12, sp.h * .9);
    const fin2 = new T.Shape(); fin2.moveTo(.0, -sp.h * .85); fin2.quadraticCurveTo(-.12, -sp.h * .85 - sp.fin * .6, -.28, -sp.h * .5); fin2.lineTo(0, -sp.h * .85);
    const eye = new T.SphereGeometry(.045, 10, 8);
    const eL = eye.clone().translate(.3, sp.h * .25, sp.w * .62), eR = eye.clone().translate(.3, sp.h * .25, -sp.w * .62);
    return mergeGeos([[body, sp.col], [new T.ShapeGeometry(tail, 6), sp.tailCol || sp.col], [new T.ShapeGeometry(fin, 6), sp.finCol || sp.col], [new T.ShapeGeometry(fin2, 6), sp.finCol || sp.col], [eL, C(0x111111)], [eR, C(0x111111)]]);
  }
  const SPECIES = {
    clown: { h: .22, w: .1, tail: .2, fin: .12, col: (x, y) => { const b = Math.abs(x - .22) < .05 || Math.abs(x + .12) < .045 || x < -.38; const e = Math.abs(x - .22) < .07 || Math.abs(x + .12) < .065; return b ? C(0xffffff) : e ? C(0x111111) : C(0xff7a12); }, finCol: C(0xff7a12), tailCol: (x) => x < -.72 ? C(0x111111) : C(0xff7a12) },
    tang: { h: .3, w: .09, tail: .26, fin: .1, col: (x, y) => (y > .03 && y < .14 && x < .2 && x > -.3) || (x > -.25 && x < -.05 && y < .02 && y > -.1) ? C(0x0b1220) : C(0x1f5fd6), finCol: C(0x0b1a40), tailCol: C(0xffd23f) },
    yellow: { h: .4, w: .08, tail: .26, fin: .2, col: C(0xffd60a), finCol: C(0xffc300), tailCol: C(0xffc300) },
    angel: { h: .48, w: .07, tail: .28, fin: .45, col: (x) => Math.sin(x * 38) > .55 ? C(0x1a1a1a) : C(0xf5e9c9), finCol: C(0xffd23f), tailCol: C(0xffd23f) },
    silver: { h: .14, w: .07, tail: .16, fin: .05, col: (x, y) => y > .02 ? C(0x5f87a8) : C(0xdfe9f0), finCol: C(0xb8c9d6) },
    parrot: { h: .3, w: .11, tail: .26, fin: .12, col: (x, y) => x > .3 ? C(0x2ec4b6) : Math.sin(x * 25 + y * 18) > .7 ? C(0xff70a6) : C(0x2ec4b6), finCol: C(0xff70a6), tailCol: C(0xff70a6) }
  };
  const schools = [];
  function school(sp, n, size, metal, path) {
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: metal ? .25 : .45, metalness: metal ? .55 : .05, side: T.DoubleSide });
    mat.onBeforeCompile = sh => { sh.uniforms.uTime = uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float fk = smoothstep(.25,-.8,position.x); float fid = float(gl_InstanceID);
      transformed.z += sin(uTime*${(path.beat || 9).toFixed(1)} + fid*1.7 - position.x*5.)*fk*.12;`); };
    const im = new T.InstancedMesh(fishGeo(sp), mat, n); im.frustumCulled = false; scene.add(im);
    const fish = []; for (let i = 0; i < n; i++) fish.push({ a: R() * 6.28, r: (.6 + R() * .8), y: (R() - .5), s: size * (.8 + R() * .4), v: .7 + R() * .6, o: [R() - .5, R() - .5, R() - .5] });
    schools.push({ im, fish, path }); return im;
  }
  school(SPECIES.silver, 180, .5, true, { kind: 'ball', c: V3(7, 6, -9), R: 3.2, spread: 2.4, speed: .9, beat: 14 });
  school(SPECIES.tang, 14, .9, false, { kind: 'loop', c: V3(0, 4, -8), R: 10, spread: 3, speed: .25 });
  school(SPECIES.yellow, 12, .8, false, { kind: 'loop', c: V3(-2, 3, -16), R: 8, spread: 3, speed: -.22 });
  school(SPECIES.clown, 6, .55, false, { kind: 'home', c: V3(-3.6, 1.3, -3.2), R: .9, spread: .6, speed: .6, beat: 12 });
  school(SPECIES.angel, 5, 1.1, false, { kind: 'loop', c: V3(3, 2.8, -12), R: 6, spread: 2, speed: .18 });
  school(SPECIES.parrot, 6, 1, false, { kind: 'loop', c: V3(-6, 2.2, -10), R: 7, spread: 2.5, speed: .2 });
  school(SPECIES.silver, 140, .45, true, { kind: 'ball', c: V3(-10, 8, -22), R: 3, spread: 2.2, speed: -.8, beat: 14 });
  const fo = new T.Object3D(), fp = V3(0, 0, 0), fq = V3(0, 0, 0);
  function fishPos(f, path, t, out) {
    const P = path, ang = f.a + t * P.speed * f.v / Math.max(.5, P.R * f.r * .3);
    if (P.kind === 'ball') {
      const c = P.c.clone().add(V3(Math.sin(t * .15) * 3, Math.sin(t * .23) * 1.2, Math.cos(t * .11) * 3));
      const rr = P.R * f.r, tilt = f.o[0] * 1.6;
      out.set(Math.cos(ang) * rr, Math.sin(ang * 1.0) * rr * Math.sin(tilt) + f.y * P.spread, Math.sin(ang) * rr * Math.cos(tilt)).add(c);
    } else {
      const rr = P.R * (.8 + f.r * .3);
      out.set(Math.cos(ang) * rr + f.o[0] * P.spread, f.y * P.spread + Math.sin(t * .6 + f.a) * .3, Math.sin(ang) * rr * .6 + f.o[2] * P.spread).add(P.c);
    }
    return out;
  }
  function updateFish(t) {
    schools.forEach(({ im, fish, path }) => {
      fish.forEach((f, i) => {
        fishPos(f, path, t, fp); fishPos(f, path, t + .05, fq);
        fo.position.copy(fp); fo.lookAt(fq); fo.rotateY(-Math.PI / 2); fo.scale.setScalar(f.s); fo.updateMatrix(); im.setMatrixAt(i, fo.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    });
  }

  /* ---------- floating particles and bubbles ---------- */
  function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); }
  function bubbleTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 3; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.stroke(); x.fillStyle = 'rgba(200,245,255,.18)'; x.fill(); x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(22, 22, 6, 0, 7); x.fill(); return new T.CanvasTexture(c); }
  const SN = 1400, snowPos = new Float32Array(SN * 3), snowBase = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { snowBase[i * 3] = -30 + R() * 60; snowBase[i * 3 + 1] = R() * 20; snowBase[i * 3 + 2] = -50 + R() * 60; }
  const snowGeo = new T.BufferGeometry(); snowGeo.setAttribute('position', new T.BufferAttribute(snowPos, 3));
  scene.add(new T.Points(snowGeo, new T.PointsMaterial({ size: .07, map: dotTex(), transparent: true, depthWrite: false, color: 0xd9fbff, opacity: .6 })));
  const BN = 260, bubPos = new Float32Array(BN * 3), bubSeed = [];
  for (let i = 0; i < BN; i++) bubSeed.push([R(), R(), R(), R()]);
  const bubGeo = new T.BufferGeometry(); bubGeo.setAttribute('position', new T.BufferAttribute(bubPos, 3));
  const bubbles = new T.Points(bubGeo, new T.PointsMaterial({ size: .16, map: bubbleTex(), transparent: true, depthWrite: false, opacity: .85 })); scene.add(bubbles);

  /* ---------- the Zenbyte starfish (your logo in 3D) ---------- */
  const star = new T.Group(), starInner = new T.Group(); star.add(starInner); scene.add(star);
  const starU = { uTime };
  function starMat(o) {
    const m = new T.MeshPhysicalMaterial(Object.assign({ metalness: .1, roughness: .32, clearcoat: 1, clearcoatRoughness: .08, sheen: .6, sheenColor: new T.Color(0xbff0ff) }, o));
    m.onBeforeCompile = sh => { sh.uniforms.uTime = uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float sr = length(position.xy); float sa = atan(position.y, position.x);
      transformed.z += sin(uTime*2.6 + sa*5.) * sr*sr * .16;`); };
    return m;
  }
  const mLight = starMat({ color: 0x22a8f4, emissive: 0x06345a, emissiveIntensity: .6 }), mDark = starMat({ color: 0x1d64c4, emissive: 0x041c40, emissiveIntensity: .6 });
  const mEdge = starMat({ color: 0xbfe9ff, metalness: .9, roughness: .2 });
  LOGO_SHAPES.forEach((s, idx) => {
    const sh = new T.Shape(s.o.map(p => new T.Vector2(p[0], p[1])));
    s.h.forEach(h => sh.holes.push(new T.Path(h.map(p => new T.Vector2(p[0], p[1])))));
    const depth = idx > 2 ? .1 : .2;
    const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: .05, bevelSize: .03, bevelSegments: 5, curveSegments: 8, steps: 1 });
    g.translate(0, 0, -depth / 2);
    /* more vertices on the faces so the arms can bend smoothly */
    g.computeVertexNormals();
    starInner.add(new T.Mesh(g, [idx === 0 ? mDark : mLight, mEdge]));
  });
  /* starfish texture: little bumps along the arms */
  { const bumps = new T.InstancedMesh(new T.SphereGeometry(.028, 8, 6), starMat({ color: 0xdff6ff, emissive: 0x0a3a5a }), 70), o = new T.Object3D(); let k = 0;
    const outer = LOGO_SHAPES[0].o.concat(LOGO_SHAPES[1].o);
    for (let i = 0; i < outer.length && k < 70; i += Math.max(1, Math.floor(outer.length / 70))) { const [x, y] = outer[i]; o.position.set(x * .86, y * .86, .14); o.updateMatrix(); bumps.setMatrixAt(k++, o.matrix); }
    bumps.count = k; starInner.add(bumps); }
  const glow = new T.Sprite(new T.SpriteMaterial({ map: dotTex(), color: 0x5fd0ff, transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(4.5, 4.5, 1); glow.position.z = -.4; star.add(glow);
  const trailN = 60, trailPos = new Float32Array(trailN * 3), trail = []; for (let i = 0; i < trailN; i++) trail.push({ p: V3(0, -50, 0), age: 9 });
  const trailGeo = new T.BufferGeometry(); trailGeo.setAttribute('position', new T.BufferAttribute(trailPos, 3));
  scene.add(new T.Points(trailGeo, new T.PointsMaterial({ size: .12, map: bubbleTex(), transparent: true, depthWrite: false, opacity: .9 })));

  /* ---------- the story ---------- */
  const HERO = V3(0, 5.4, 0);
  const swimPath = new T.CatmullRomCurve3([V3(-12, 9, -30), V3(-9, 5, -22), V3(-2, 3.2, -16), V3(6, 3.6, -11), V3(7, 5.2, -5), V3(3, 5.6, -1.5), HERO.clone()]);
  const camOff = new T.CatmullRomCurve3([V3(2.5, 4.5, 8.5), V3(5, 2.5, 8), V3(-6, 1.5, 7), V3(-4, 1, 7.5), V3(0, .2, 7.2)]);
  const END = 10.5;                              // seconds until the starfish reaches the centre
  let tLast = 0, mx = 0, my = 0, leaving = -1;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const qa = new T.Quaternion(), qb = new T.Quaternion(), mtx = new T.Matrix4(), tmp = V3(0, 0, 0), look = V3(0, 0, 0);
  function render(t) {
    const dt = Math.min(.05, Math.max(0, t - tLast)); tLast = t; uTime.value = t;
    const u = ease(clamp((t - .6) / (END - .6)));
    swimPath.getPointAt(u, star.position);
    if (t > END) star.position.y += Math.sin((t - END) * 1.2) * .12;
    /* orientation: swim along the path, then turn to face us */
    swimPath.getPointAt(Math.min(1, u + .02), tmp);
    const travel = tmp.sub(star.position);
    mtx.lookAt(camera.position, star.position, V3(0, 1, 0)); qa.setFromRotationMatrix(mtx);      // face the camera
    qa.multiply(qb.setFromEuler(new T.Euler(Math.sin(t * 1.3) * .35, clamp(travel.x * 8, -.7, .7), t * 1.1 + Math.sin(t * 2) * .2)));
    const face = sstep(END - 2.6, END - .2, t);
    const idle = new T.Quaternion().setFromEuler(new T.Euler(Math.sin(t * .8) * .12 + my * .25, Math.sin(t * .6) * .25 + mx * .5, Math.sin(t * .5) * .05));
    star.quaternion.copy(qa).slerp(idle, face);
    star.scale.setScalar((MOB() ? .95 : 1) * (1 + .22 * sstep(END - 3, END, t)));
    starLight.position.copy(star.position).add(V3(0, .5, 1.8));
    glow.material.opacity = .25 + .35 * sstep(END - 2, END + 1, t) + .08 * Math.sin(t * 2);
    /* camera follows the starfish */
    camOff.getPointAt(ease(clamp(t / END)), tmp);
    if (MOB()) tmp.multiplyScalar(1.35);
    camera.position.copy(star.position).add(tmp);
    if (t > END) camera.position.set(HERO.x + mx * 1.2, HERO.y + (MOB() ? .6 : -.1) - my * .6, HERO.z + (MOB() ? 8.6 : 7.2));
    look.copy(star.position); if (t > END - 1) look.y -= sstep(END - 1, END + .5, t) * (MOB() ? -.1 : .95);
    if (leaving >= 0) { const k = ease(clamp((t - leaving) / 1.4)); camera.position.lerp(V3(HERO.x, HERO.y + 1, HERO.z + .9), k); look.y += k * 2; }
    camera.lookAt(look);
    /* bubbles: a rush when we dive in, then streams from the reef, plus the starfish trail */
    const bp = bubGeo.attributes.position.array, dive = 1 - sstep(.4, 2.6, t);
    for (let i = 0; i < BN; i++) {
      const s = bubSeed[i];
      if (i < 120) { const k = ((t * (1.6 + s[3]) + s[0] * 6) % 6); bp[i * 3] = camera.position.x + (s[1] - .5) * 6 * (dive > .01 ? 1 : 0) + (dive > .01 ? 0 : -999); bp[i * 3 + 1] = camera.position.y - 4 + k * 1.6; bp[i * 3 + 2] = camera.position.z - 2 - s[2] * 6; if (dive <= .01) bp[i * 3 + 1] = -999; }
      else { const src = [[-3.6, -3.2], [4.2, -3.5], [-7, -6], [5, -12], [-10, -14]][i % 5], k = ((t * (.8 + s[3] * .7) + s[0] * 30) % 20); bp[i * 3] = src[0] + Math.sin(t * 2 + i) * .15 + (s[1] - .5) * .4; bp[i * 3 + 1] = .5 + k; bp[i * 3 + 2] = src[1] + Math.cos(t * 1.7 + i) * .15; }
    }
    bubGeo.attributes.position.needsUpdate = true;
    if (Math.floor(t * 20) !== Math.floor((t - dt) * 20) && t < END + .5) { const b = trail.reduce((a, c) => c.age > a.age ? c : a); b.p.copy(star.position).add(V3((R() - .5) * .5, (R() - .5) * .5, (R() - .5) * .5)); b.age = 0; }
    trail.forEach((b, i) => { b.age += dt; b.p.y += dt * .9; trailPos[i * 3] = b.p.x; trailPos[i * 3 + 1] = b.age < 4 ? b.p.y : -999; trailPos[i * 3 + 2] = b.p.z; });
    trailGeo.attributes.position.needsUpdate = true;
    /* marine snow */
    for (let i = 0; i < SN; i++) { snowPos[i * 3] = snowBase[i * 3] + Math.sin(t * .2 + i) * .4; snowPos[i * 3 + 1] = (snowBase[i * 3 + 1] - t * .12 + 400) % 20; snowPos[i * 3 + 2] = snowBase[i * 3 + 2] + Math.cos(t * .17 + i) * .4; }
    snowGeo.attributes.position.needsUpdate = true;
    rays.forEach(r => { r.position.x = r.userData.x + Math.sin(t * .2 + r.userData.s) * 1.2; r.lookAt(camera.position.x, r.position.y, camera.position.z); r.rotation.z = -.22; });
    updateFish(t);
    /* captions */
    document.body.classList.toggle('s-name', t > END - .6);
    document.body.classList.toggle('s-cta', t > END + .9);
    renderer.render(scene, camera);
  }
  function resize() { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 64 : 46; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  const api = { active: true, render, t0: performance.now(), skip() { api.t0 = performance.now() - END * 1000; },
    leave(done) { leaving = (performance.now() - api.t0) / 1000; setTimeout(() => { api.active = false; done(); }, 1250); } };
  if (!CAPTURE) (function loop() { if (!api.active) return; render((performance.now() - api.t0) / 1000); requestAnimationFrame(loop); })();
  return api;
}
