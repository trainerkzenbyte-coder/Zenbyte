/* ================= CONTENT (from your existing site) ================= */
const P = __PDATA__;
/* room (chapter) for each page */
const ROOMS = [
  {name:'Welcome',          pages:[0,1,2],          theme:'lobby'},
  {name:'Our record',       pages:[3,4],            theme:'record'},
  {name:'Your journey',     pages:[5,6,7,8,9,10],   theme:'journey'},
  {name:'Visits and timing',pages:[11,12,13],       theme:'visits'},
  {name:'Fees',             pages:[14,15],          theme:'fees'},
  {name:'Policies',         pages:[16,17,18],       theme:'policies'},
  {name:'Rewards and next steps',pages:[19,20,21,22],theme:'rewards'}
];
const PAGE_ROOM = []; ROOMS.forEach((r,k)=>r.pages.forEach(p=>PAGE_ROOM[p]=k));

const E = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const H = s => E(s).replace(/\*(.+?)\*/,'<em>$1</em>');
function K(inner,i,cls){return `<div class="k ${cls||''}" style="--i:${i}">${inner}</div>`}
function card(x,i,cls){return K((x[0]?`<b>${E(x[0])}</b>`:'')+(x[1]?`<h4>${E(x[1])}</h4>`:'')+(x[2]?`<p>${E(x[2])}</p>`:'')+(x[3]&&x[3].length?`<div class="cp">${x[3].map(c=>`<span>${E(c)}</span>`).join('')}</div>`:''),i,(x[4]||'')+' '+(cls||''))}

/* record data (same numbers as your site) */
const Y25=[28,31,36,40,33,39,44,38,35,42,37,34],Y26=[46,43,52,48,55,50,58,58],FC=[1,.96,1.08,.98,1.04,.94,1.06,1,1,.96,1.08,.98];
function months(y){const n=new Date(),yn=n.getFullYear(),m=n.getMonth(),d=n.getDate(),o=[];if(y===2025)return Y25;
 for(let i=0;i<12;i++){if(y===2026&&i<8)o.push(Y26[i]);else if(y<yn||(y===yn&&i<m))o.push(Math.round(50*FC[i]));else if(y===yn&&i===m){const dm=new Date(y,i+1,0).getDate();o.push(Math.round(50*FC[i]*d/dm))}else o.push(0)}return o}
const sum=a=>a.reduce((x,y)=>x+y,0);
function rec(p){const a=months(2025),b=months(2026),mx=Math.max(...a,...b),t=sum(a)+sum(b);let dn=0;
 const bars=a.map((v,i)=>`<div class="bg"><div class="bp"><i data-h="${v/mx*100}"></i><i data-h="${b[i]/mx*100}"></i></div><span>${'JFMAMJJASOND'[i]}</span></div>`).join('');
 const sk=p.i.map((k,i)=>{const n=i===p.i.length-1?t-dn:Math.round(t*k[1]/100);dn+=n;return `<div><i data-w="${k[1]/13*100}"></i><span>${E(k[0])}<b>${n}</b></span></div>`}).join('');
 return `<div class="g one">${K(`<div class="stats"><div>2025<b>${sum(a)}</b>offers</div><div>2026 so far<b>${sum(b)}</b>offers</div><div>Every month<b>≈50</b>offers</div></div><div class="bars">${bars}</div><div class="cp"><span>Cyan: 2025</span><span>Gold: 2026</span></div>`,0)}${K(`<h4>Skills we place for</h4><div class="sk">${sk}</div>`,1)}</div>`}
const SAL=[4,5,6,8,10,12,15,18,20,25,30,35,40];
const fee=c=>c<=6?2.75:c<=10?3:c<=15?3.25:c<=20?3.5:c<=30?3.75:4;
function calcHTML(){return `<div class="g one">${K(`<p>Example salary (CTC)</p><div class="ct" id="ct"></div><input type="range" min="0" max="12" value="5" aria-label="Example salary"><div id="cb"></div><p id="cm" class="nt"></p>`,0,'cal')}</div>`}
function calcUpd(v){const c=SAL[v],f=fee(c),e=f+.5,r=(l,x,w)=>`<div class="cr"><span>${l}</span><u><i style="width:${w}%"></i></u><em>₹${x.toFixed(2)} lakh</em></div>`;
 document.getElementById('ct').textContent=c+' LPA';document.getElementById('cb').innerHTML=r('Yearly salary',c,100)+r('Fee, pay once',f,f/c*100)+r('Fee, EMI option',e,Math.min(100,e/c*100));
 document.getElementById('cm').textContent=(f/(c/12)).toFixed(1)+' months of salary (CTC, before tax) equal the one-time fee'}
function tlHTML(){return `<div class="g one">${K(`<p>Usual time to get placed</p><div class="big-n">5 – 45 days</div><div class="trk"><i></i><em></em>${[0,15,30,45,60].map(d=>`<span style="left:${d/60*100}%">Day ${d}</span>`).join('')}</div>`,0)}</div>`}

function pageHTML(i){const p=P[i];let body='';
 if(p.t==='rec')body=rec(p);else if(p.t==='calc')body=calcHTML();else if(p.t==='tl')body=tlHTML();
 else{const v=p.v,n=p.i.length;
  if(v==='steps')body=`<div class="g one">${p.i.map((x,j)=>card(x,j,'step')).join('')}</div>`;
  else if(v==='faq')body=`<div class="g">${p.i.map((x,j)=>card(x,j,'faq')).join('')}</div>`;
  else if(v==='stag')body=`<div class="g one">${p.i.map((x,j)=>card(x,j)).join('')}</div>`;
  else if(v==='big')body=`<div class="g ${n===3?'three':''}">${p.i.map((x,j)=>card(x,j,'big')).join('')}</div>`;
  else if(v==='office')body=`<div class="g three">${p.i.map((x,j)=>card(x,j,'tile')).join('')}</div>`;
  else if(v==='tiles')body=`<div class="g ${n===3?'three':''}">${p.i.map((x,j)=>card(x,j,'tile')).join('')}</div>`;
  else body=`<div class="g ${v==='chk'?'':''}">${p.i.map((x,j)=>card(x,j)).join('')}</div>`}
 const note=p.n&&p.t!=='tl'?`<p class="nt">${E(p.n)}</p>`:(p.t==='tl'&&p.n?`<p class="nt">${E(p.n)}</p>`:'');
 return `<div class="card"><div class="ey">${E(p.e)}</div><h2>${H(p.h)}</h2><p class="lede">${E(p.d)}</p>${body}${note}</div>`}
function afterRender(i,el){if(P[i].t==='calc'){const r=el.querySelector('input');calcUpd(5);r.addEventListener('input',()=>calcUpd(+r.value))}
 setTimeout(()=>{el.querySelectorAll('[data-h]').forEach(e=>e.style.height=e.dataset.h+'%');el.querySelectorAll('[data-w]').forEach(e=>e.style.width=e.dataset.w+'%')},80)}
