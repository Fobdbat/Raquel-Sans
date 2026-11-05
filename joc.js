'use strict';
/* «Raquel Sans» — joc de ritme. El món va lligat a la música (150 BPM exactes); els tocs només validen. */
const $=id=>document.getElementById(id);
const cv=$('c'),cx=cv.getContext('2d');
const TILE=RS.T,SV=RS.S,C30=Math.sqrt(3)/2,VEL=RS.VEL,B=RS.B,O=RS.O,YR=.36,LEAD=.8,DUR=RS.DUR,FINAL_T=RS.FINAL_T;
const ZN=RS.zones,AIR={G:0,S:B,L:2*B},ALT={S:7,L:12.5};
const WIN={G:[.22,.18],S:[.18,.14],L:[.18,.14]};          // [aviat, tard] en segons
const PERFECTE=.07,DBG=/[?&]dt\b/.test(location.search);   // ?dt=1 mostra l'error de cada toc en ms (per comprovar el ritme a cada aparell)
const ms=d=>(d>0?'+':d<0?'−':'')+Math.abs(Math.round(d*1000))+' ms';
let W=0,H=0,DPR=1,zoom=.5,vign=null;
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cx.setTransform(DPR,0,0,DPR,0,0);
  zoom=Math.max(W/980,H/1650);
  vign=document.createElement('canvas');vign.width=Math.max(2,W>>1);vign.height=Math.max(2,H>>1);const v=vign.getContext('2d'),g=v.createRadialGradient(vign.width/2,vign.height*.45,Math.min(vign.width,vign.height)*.35,vign.width/2,vign.height/2,Math.hypot(vign.width,vign.height)*.62);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');v.fillStyle=g;v.fillRect(0,0,vign.width,vign.height)}
addEventListener('resize',resize);resize();

/* ============================ àudio ============================ */
let ac=null,buf=null,src=null,gain=null,base=0;
try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
const latencia=()=>ac?(ac.outputLatency||ac.baseLatency||0):0;
let AJUST=0;try{const a=parseFloat(localStorage.getItem('raquelsans-ajust'));if(isFinite(a))AJUST=Math.max(-.4,Math.min(.4,a))}catch(e){}
const rel={off:null};
/* ac.currentTime avança a salts i cada navegador diu la latència a la seva manera: es lliga a performance.now() i se suavitza.
   Els tocs fan servir l'instant real del dit (ev.timeStamp), no el moment en què el codi els atén. */
function desfasa(){
  const p=performance.now()/1000;let raw=ac.currentTime-base-latencia();
  if(ac.getOutputTimestamp){try{const ts=ac.getOutputTimestamp();if(ts&&ts.performanceTime>0&&ts.contextTime>0){const r2=ts.contextTime+(p-ts.performanceTime/1000)-base;if(r2<=ac.currentTime-base+.03&&r2>=ac.currentTime-base-.6)raw=r2}}catch(e){}}
  const o=raw-p;if(rel.off===null||Math.abs(o-rel.off)>.08)rel.off=o;else rel.off+=(o-rel.off)*.05;return rel.off}
const instant=ev=>{const ts=ev&&ev.timeStamp,n=performance.now();return ts>0&&ts<=n+5&&n-ts<500?ts:n};
const tempsCru=ms=>(ms!==undefined?ms:performance.now())/1000+desfasa();
const tNow=ms=>window.__vt!==undefined?window.__vt:(ac&&buf&&src?tempsCru(ms)-AJUST:0);
/* Alguns navegadors deixen el silenci inicial de l'MP3 dins del so descodificat i tot arriba uns 25 ms tard.
   Es mesura on comença el primer so (a l'original és a 0,0397 s) i es compensa. */
let OFFMP3=0;
function mesuraInici(b){try{const d0=b.getChannelData(0),d1=b.numberOfChannels>1?b.getChannelData(1):d0,n=Math.min(d0.length,Math.round(b.sampleRate*.6));
  for(let i=0;i<n;i++){if(Math.abs((d0[i]+d1[i])/2)>.005){const dt=i/b.sampleRate-.03968;if(Math.abs(dt)<.12)OFFMP3=dt;return}}}catch(e){}}
function sona(off,pre){atura(true);rel.off=null;src=ac.createBufferSource();src.buffer=buf;gain=ac.createGain();src.connect(gain);gain.connect(ac.destination);
  const at=ac.currentTime+.06+pre,o=Math.max(0,off)+OFFMP3;if(o>=0)src.start(at,o);else src.start(at-o,0);base=at-Math.max(0,off)}
function atura(rapid){if(src){try{gain.gain.setTargetAtTime(0,ac.currentTime,rapid?.01:.12);src.stop(ac.currentTime+(rapid?.05:.5))}catch(e){}src=null}}

/* ============================ càrrega ============================ */
const PACK={},BMP={},TM={};
const SPR=new Image(),INTRO=new Image();let sprOk=false,introOk=false;
SPR.onload=()=>sprOk=true;INTRO.onload=()=>introOk=true;SPR.src='sprites.webp';INTRO.src='intro.webp';
const fetchPack=zi=>PACK[zi]||(PACK[zi]=fetch('z'+zi+'.bin').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}));
function bitmaps(zi){if(zi<1)return Promise.resolve(null);
  return BMP[zi]||(BMP[zi]=(async()=>{const buf=await fetchPack(zi),g=RS.geo[zi],m=new Map();
    await Promise.all(g.tiles.map(async k=>{const [o,l]=g.idx[k],bl=new Blob([buf.slice(o,o+l)],{type:'image/webp'});m.set(k,await createImageBitmap(bl))}));TM[zi]=m;return m})())}
function allibera(zi){if(window.__keep)return;if(BMP[zi]){const m=TM[zi];if(m)m.forEach(b=>{try{b.close()}catch(e){}});delete TM[zi];delete BMP[zi]}}
let wantZ=-1;
function volTrams(zi){ // la zona actual i la següent a memòria; la resta es descarta
  if(zi===wantZ)return;wantZ=zi;for(const k of Object.keys(BMP)){const j=+k;if(j!==zi&&j!==zi+1)allibera(j)}
  bitmaps(zi);if(RS.geo[zi+1])bitmaps(zi+1)}
let carregat=false;
async function carrega(){
  const st=$('estat'),bar=$('barra').firstElementChild;
  if(!ac){st.textContent='Aquest navegador no pot reproduir la cançó.';return}
  try{
    st.textContent='Carregant la cançó…';
    const r=await fetch('raquel.mp3');if(!r.ok)throw 0;const tot=+r.headers.get('content-length')||8445430;let got=0,parts=[];
    if(r.body&&r.body.getReader){const rd=r.body.getReader();for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;bar.style.width=Math.min(80,got/tot*80)+'%'}
      const ab=new Uint8Array(got);let p=0;for(const c of parts){ab.set(c,p);p+=c.length;}buf0=ab.buffer}else buf0=await r.arrayBuffer();
    st.textContent='Preparant el so…';
    buf=await new Promise((res,rej)=>ac.decodeAudioData(buf0,res,rej));mesuraInici(buf);bar.style.width='88%';
    st.textContent='Carregant els mons…';await bitmaps(1);bar.style.width='96%';await bitmaps(2);bar.style.width='100%';
    carregat=true;st.textContent='Tot a punt.';$('b-joc').disabled=false;$('b-passeig').disabled=false;
    for(let z=3;z<=8;z++)fetchPack(z).catch(()=>{})            // la resta, en segon pla
  }catch(e){st.textContent="No s'ha pogut carregar. Torna a obrir la pàgina."}
}
let buf0=null;

/* ============================ geometria del camí ============================ */
function posZ(zi,t){const g=RS.geo[zi],V=g.verts;t=Math.max(V[0][0],Math.min(t,V[V.length-1][0]));
  let k=0;while(k<V.length-2&&V[k+1][0]<t)k++;const a=V[k],b=V[k+1],u=b[0]>a[0]?(t-a[0])/(b[0]-a[0]):0;
  return{x:a[1]+(b[1]-a[1])*u+.5,y:a[2]+(b[2]-a[2])*u+.5,d:g.dirs[k],k}}
const pX=(x,y)=>(x-y)*C30*SV,pY=(x,y,z)=>(x+y)*.5*SV-(z||0)*SV;
const perp=d=>d==='x'?[0,1]:[-1,0];
function latVec(zi,T){const g=RS.geo[zi],V=g.verts,p=posZ(zi,T),k=p.k,cur=perp(g.dirs[k]);
  if(k>0){const u=(T-V[k][0])/.38;if(u<1){const pr=perp(g.dirs[k-1]),s=u<=0?0:u*u*(3-2*u);return[pr[0]+(cur[0]-pr[0])*s,pr[1]+(cur[1]-pr[1])*s]}}return cur}
function zoneAt(T){let z=0;for(let i=0;i<ZN.length;i++)if(T>=ZN[i].t0)z=i;return z}
const HEROI={miki:'miki',tyet1:'tyetA',tyet2:'tyetB'};
function formacio(zi){const L=ZN[zi].lead; // dx,dy: desplaçament en píxels de món (horitzontal a pantalla) perquè no es tapin
  if(L.length===1)return[{id:HEROI[L[0]],dx:0,dy:0}];
  if(L.length===2)return[{id:HEROI[L[0]],dx:-50,dy:0},{id:HEROI[L[1]],dx:50,dy:0}];
  return[{id:HEROI[L[1]],dx:-78,dy:-12},{id:HEROI[L[2]],dx:78,dy:-12},{id:HEROI[L[0]],dx:0,dy:6}]}

/* ============================ estat de joc ============================ */
const EV=RS.events.map(e=>({t:e.t,k:e.k,z:e.z,b:e.b,st:0,pts:0,dt:0,perfect:false,g:null}));
const G={on:false,paused:false,mode:'joc',zr:0,ni:0,fail:null,score:0,combo:0,maxCombo:0,falls:0,fallsZ:{},cam:{x:0,y:0},snap:true,lastZi:-1,pops:[],puffs:[],conf:[],yr:YR,cd:-1,cal:false,fin:false,hits:0,perf:0,wipe:-9,assistMsg:0};
function evGeo(e){if(e.g)return e.g;const zi=e.z,p=posZ(zi,e.t),dIn=posZ(zi,e.t-.002).d,dOut=posZ(zi,e.t+.002).d;
  const g={x:p.x,y:p.y,dIn,dOut};if(e.k!=='G'){const q=posZ(zi,e.t+AIR[e.k]/2);g.ox=q.x;g.oy=q.y;g.od=q.d}return e.g=g}
const assist=zi=>1+.2*Math.min(2,Math.floor((G.fallsZ[zi]||0)/3));
const winFor=e=>{const w=WIN[e.k],a=G.mode==='passeig'?1:assist(e.z);return[w[0]*a,w[1]*a]};
function primerEv(zi){const t0=ZN[zi].t0-.01;let i=0;while(i<EV.length&&EV[i].t<t0)i++;return i}
function popup(txt,col,wx,wy,T){G.pops.push({t:T,txt,col,wx,wy})}
function hit(e,dt,T){e.st=1;e.dt=dt;e.perfect=Math.abs(dt)<=PERFECTE;G.combo++;G.maxCombo=Math.max(G.maxCombo,G.combo);
  const m=1+Math.min(G.combo,20)*.05;e.pts=Math.round((e.perfect?150:100)*m);G.score+=e.pts;G.hits++;if(e.perfect)G.perf++;
  const g=evGeo(e),lab=e.perfect?'Perfecte!':(Math.abs(dt)>.11?(dt<0?'Aviat':'Tard'):'Bé');
  popup(DBG?lab+' '+ms(dt):lab,e.perfect?'#ffe36b':(lab==='Bé'?'#ffffff':'#ff9a6b'),pX(g.x,g.y),pY(g.x,g.y,22),T);
  for(let i=0;i<7;i++)G.puffs.push({t:T,wx:pX(g.x,g.y),wy:pY(g.x,g.y,0),vx:(Math.random()-.5)*160,vy:-Math.random()*90-20,c:e.k==='G'?'#3bd0ff':'#ffe36b',life:.5})}
function falla(e,T){if(G.fail||G.mode==='passeig')return;e.st=2;G.fail={t:Math.max(T,e.t),e,k:e.k==='G'?'gir':'salt'};G.falls++;G.combo=0;G.fallsZ[e.z]=(G.fallsZ[e.z]||0)+1;
  if(G.fallsZ[e.z]%3===0)G.assistMsg=T}
function judgeTap(T){let best=null,bd=9;for(let i=G.ni;i<EV.length;i++){const e=EV[i];if(e.st!==0)continue;if(e.t>T+.7)break;const d=Math.abs(T-e.t);if(d<bd){bd=d;best=e}}
  if(!best)return false;const dt=T-best.t,w=winFor(best);
  if(dt>=-w[0]&&dt<=w[1]){hit(best,dt,T);return true}
  if(dt<-w[0]&&dt>=-(w[0]+.12)){falla(best,T);return true}
  return false}
function update(T){
  while(G.ni<EV.length&&EV[G.ni].st!==0)G.ni++;
  if(G.fail){if(T>=G.fail.t+1.05&&window.__vt===undefined)reinicia(G.fail.e.z);return}
  for(let i=G.ni;i<EV.length;i++){const e=EV[i];if(e.t>T+1)break;if(e.st!==0)continue;
    if(G.mode==='passeig'){const j=Math.sin(e.b*2.399)*.018;if(T>=e.t+j)hit(e,j,T)}
    else{const w=winFor(e);if(T>e.t+w[1]){falla(e,T);break}}}
  if(T>=DUR-.02&&!G.fin)acaba()
}
function reinicia(zi){
  const z=ZN[zi],off=zi===0?0:Math.max(0,z.t0-2.4);
  for(const e of EV)if(e.t>=z.t0-.01){if(e.st===1){G.score-=e.pts;G.hits--;if(e.perfect)G.perf--}e.st=0;e.pts=0;e.perfect=false}
  G.score=Math.max(0,G.score);G.conf=[];G.zr=zi;G.fail=null;G.ni=primerEv(zi);G.snap=true;G.pops=[];G.puffs=[];G.combo=0;G.lastZi=-1;G.wipe=zi>=1?off-.35:-9;G.cd=zi>=1?zi:-1;
  if(window.__vt===undefined)sona(off,.35)
}
function acaba(){G.fin=true;G.on=false;atura(false);$('pau').hidden=true;
  const tot=EV.length;$('fi-stats').innerHTML=G.mode==='passeig'?`<span>Mode</span><b>Passeig</b><span>Zones</span><b>${ZN.length-1}</b>`:
    `<span>Punts</span><b>${G.score}</b><span>Girs i salts encertats</span><b>${G.hits} / ${tot}</b><span>Perfectes</span><b>${G.perf}</b><span>Millor ratxa</span><b>${G.maxCombo}</b><span>Caigudes</span><b>${G.falls}</b>`;
  $('fi').hidden=false}
function comenca(mode){
  if(!carregat)return;ac.resume&&ac.resume();$('inici').hidden=true;$('fi').hidden=true;$('pausa').hidden=true;$('calibra').hidden=true;
  G.mode=mode;G.score=0;G.combo=0;G.maxCombo=0;G.falls=0;G.hits=0;G.perf=0;G.fallsZ={};G.fin=false;G.conf=[];for(const e of EV){e.st=0;e.pts=0;e.perfect=false}
  G.on=true;G.paused=false;reinicia(0);$('pau').hidden=false}
function pausa(){if(!G.on||G.paused||G.fin)return;G.pauseT=tNow();G.paused=true;atura(true);$('b-mode').textContent=G.mode==='joc'?'Passa a «Passeig»':'Passa a «Joc»';$('pausa').hidden=false}
function continua(){$('pausa').hidden=true;G.paused=false;ac.resume&&ac.resume();reinicia(Math.max(zoneAt(Math.max(0,G.pauseT||0)),G.zr))}
addEventListener('blur',()=>{if(G.on&&!G.paused)pausa()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.on&&!G.paused)pausa()});

/* ============================ dibuix ============================ */
const sx=wx=>(wx-G.cam.x)*zoom+W/2,sy=wy=>(wy-G.cam.y)*zoom+H*G.yr;
function camera(T,zi,dt){
  let Tc=T;if(G.fail)Tc=Math.min(T,G.fail.e.t+.1);
  const a=posZ(zi,Tc+LEAD),b=posZ(zi,Tc),tx=pX(a.x,a.y),ty=pY(b.x,b.y,2);
  if(G.snap||dt>.5){G.cam.x=tx;G.snap=false}else G.cam.x+=(tx-G.cam.x)*(1-Math.exp(-dt*7));
  G.cam.y=ty;G.yr=YR+.24*Math.max(0,Math.min(1,(T-(FINAL_T-1.2))/1.6))}
function poly(pts,fill,stroke,lw,dark){cx.beginPath();for(let i=0;i<pts.length;i++){const q=pts[i];i?cx.lineTo(sx(q[0]),sy(q[1])):cx.moveTo(sx(q[0]),sy(q[1]))}cx.closePath();if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){if(dark){cx.strokeStyle='rgba(10,6,20,.7)';cx.lineWidth=(lw||2)+3;cx.stroke()}cx.strokeStyle=stroke;cx.lineWidth=lw||2;cx.stroke()}}
const P3=(x,y,z)=>[pX(x,y),pY(x,y,z)];
function rombe(x,y,hs,z){return[P3(x-hs,y-hs,z),P3(x+hs,y-hs,z),P3(x+hs,y+hs,z),P3(x-hs,y+hs,z)]}
function capsa(x0,y0,w,d,h,cTop,cX,cY){ // paral·lelepípede amb 3 cares visibles
  poly([P3(x0,y0,h),P3(x0+w,y0,h),P3(x0+w,y0+d,h),P3(x0,y0+d,h)],cTop);
  poly([P3(x0+w,y0,0),P3(x0+w,y0+d,0),P3(x0+w,y0+d,h),P3(x0+w,y0,h)],cX);
  poly([P3(x0,y0+d,0),P3(x0+w,y0+d,0),P3(x0+w,y0+d,h),P3(x0,y0+d,h)],cY)}
const COLK={G:'#3bd0ff',S:'#7dff6a',L:'#ffa23b'};
function fletxa(x,y,dx,dy,l,fill){ // fletxa al terra
  const px=-dy,py=dx,pts=[[x-dx*l*.7,y-dy*l*.7],[x-dx*l*.7+px*l*.28,y-dy*l*.7+py*l*.28],[x+dx*l*.1+px*l*.28,y+dy*l*.1+py*l*.28],[x+dx*l*.1+px*l*.6,y+dy*l*.1+py*l*.6],[x+dx*l*.9,y+dy*l*.9],[x+dx*l*.1-px*l*.6,y+dy*l*.1-py*l*.6],[x+dx*l*.1-px*l*.28,y+dy*l*.1-py*l*.28],[x-dx*l*.7-px*l*.28,y-dy*l*.7-py*l*.28]];
  poly(pts.map(q=>P3(q[0],q[1],.2)),fill)}
const DV=d=>d==='x'?[1,0]:[0,1];
function dibuixaPad(e,T,zi,bp){
  const g=evGeo(e),u=(e.t-T)/.8,col=COLK[e.k];
  const viu=e.st===0||(T-e.t<.35);if(!viu)return;
  const pulse=1+.08*(1-bp);
  if(e.st===0||e.st===2){
    const alt=e.k==='G'?3.8:3.4;
    poly(rombe(g.x,g.y,alt*pulse,.1),col+'55',col,2.6,1);
    const dv=DV(g.dOut);
    if(e.k==='G')fletxa(g.x,g.y,dv[0],dv[1],3.2,'rgba(255,255,255,.88)');
    else{const dd=DV(g.dIn);for(let k=0;k<(e.k==='L'?2:1);k++){const ox=g.x+dd[0]*(k*2.2-1),oy=g.y+dd[1]*(k*2.2-1);
      poly([P3(ox-dd[0]*1.2+dd[1]*2,oy-dd[1]*1.2-dd[0]*2,.2),P3(ox+dd[0]*1.4,oy+dd[1]*1.4,.2),P3(ox-dd[0]*1.2-dd[1]*2,oy-dd[1]*1.2+dd[0]*2,.2),P3(ox-dd[0]*2.4-dd[1]*.0,oy-dd[1]*2.4,.2)],'rgba(255,255,255,.88)')}}
    if(u>0&&u<=1){const hs=alt*(1+1.6*u);cx.globalAlpha=.95-.4*u;poly(rombe(g.x,g.y,hs,.3),null,col,4.5-2.5*u,1);cx.globalAlpha=1}
  }else if(e.st===1){const k=(T-e.t)/.35;cx.globalAlpha=1-k;poly(rombe(g.x,g.y,3.8+k*5,.3),null,e.perfect?'#ffe36b':'#ffffff',4);cx.globalAlpha=1}
}
function obstacle(e,T,zi){ // barrera que cal saltar (només per a S i L)
  const g=evGeo(e),dd=DV(g.od),L=e.k==='L'?8:4,h=e.k==='L'?4.2:3.2,a=9;
  const w=g.od==='x'?L:a,d=g.od==='x'?a:L;
  return{depth:g.ox+g.oy,f:()=>{
    cx.save();cx.globalAlpha=e.st===1&&T>e.t+AIR[e.k]+.4?.55:1;
    const x0=g.ox-w/2,y0=g.oy-d/2;
    capsa(x0,y0,w,d,h,'#fff0a8','#e0a418','#b97d10');
    // ratlles negres (advertència)
    cx.restore()}}}
function sprite(id,nom,wx,wy,o){o=o||{};const m=RS.spr.atles[id]&&RS.spr.atles[id][nom];if(!m||!sprOk)return;
  const k=(SV/RS.spr.sc)*zoom;cx.save();cx.globalAlpha=o.a==null?1:o.a;cx.translate(sx(wx),sy(wy));if(o.rot)cx.rotate(o.rot);
  cx.drawImage(SPR,m[0],m[1],m[2],m[3],-m[4]*k,-m[5]*k*(o.sq||1)+(o.sq?m[5]*k*(1-o.sq):0),m[2]*k,m[3]*k*(o.sq||1));cx.restore()}
/* posició d'un personatge de la formació a l'instant T (té en compte salts i caigudes) */
function personatge(zi,T,fm,Tref){
  const p=posZ(zi,T);let x=p.x,y=p.y,z=0,rot=0,a=1,d=p.d,mode='run',sq=1;
  for(let i=Math.max(0,G.ni-3);i<EV.length;i++){const e=EV[i];if(e.t>T+.1)break;if(e.k==='G'||e.st!==1)continue;const air=AIR[e.k];
    if(T>=e.t&&T<=e.t+air){const u=(T-e.t)/air;z=ALT[e.k]*4*u*(1-u);mode='salt'}}
  const f=G.fail;
  if(f&&T>=f.e.t){const e=f.e,g=evGeo(e);
    if(f.k==='gir'){const dv=DV(g.dIn),s=VEL*(T-e.t);x=g.x+dv[0]*s;y=g.y+dv[1]*s;d=g.dIn;const tf=5.4/VEL;
      if(T-e.t>tf){const q=T-e.t-tf;z=-.5*80*q*q;a=Math.max(0,1-q/.75);rot=Math.min(.5,q*1.2)}}
    else{const tb=e.t+AIR[e.k]/2;if(T>tb){const q=T-tb,q0=posZ(zi,tb);const dv=DV(q0.d);x=q0.x-dv[0]*Math.min(2,q*10);y=q0.y-dv[1]*Math.min(2,q*10);z=0;d=q0.d;mode='run';rot=-Math.min(1.45,q*7);a=q>.7?Math.max(0,1-(q-.7)/.35):1;sq=1}}
  }
  return{id:fm.id,x,y,z,rot,a,d,mode,sq,dx:fm.dx||0,dy:fm.dy||0}}
function dibuixaPers(h,T,zi,pre){
  const fr=(Math.floor((T-O)/(B/2))&1)&&!pre?1:0,m=h.d==='y'?0:1;let nom=h.mode==='salt'?'salt_'+m:'run_'+m+'_'+fr;
  if(G.fail&&G.fail.k==='salt'&&h.rot)nom='run_'+m+'_0';
  sprite(h.id,nom,pX(h.x,h.y)+h.dx,pY(h.x,h.y,h.z)+h.dy,{rot:h.rot,a:h.a});
  if(h.z>.5&&h.a>.2){cx.save();cx.globalAlpha=.28*h.a*Math.max(.2,1-h.z/16);const e=pX(h.x,h.y)+h.dx,f=pY(h.x,h.y,0)+h.dy;cx.fillStyle='#000';cx.beginPath();cx.ellipse(sx(e),sy(f),22*zoom*(1-h.z/40),9*zoom*(1-h.z/40),0,0,6.3);cx.fill();cx.restore()}}
function dibuixaTrams(zi){
  const m=TM[zi],g=RS.geo[zi];cx.fillStyle=g.bg||'#000';cx.fillRect(0,0,W,H);if(!m)return;
  const ov=1/zoom;for(const k of g.tiles){const b=m.get(k);if(!b)continue;const u=k.indexOf('_'),i=+k.slice(0,u),j=+k.slice(u+1);
    const x=sx(i*TILE),y=sy(j*TILE);if(x>W||y>H||x+TILE*zoom<0||y+TILE*zoom<0)continue;cx.drawImage(b,Math.floor(x),Math.floor(y),Math.ceil(TILE*zoom)+1,Math.ceil(TILE*zoom)+1)}}
let estatic=null,estCx=null;
function soroll(a,T){if(a<=.01)return;if(!estatic){estatic=document.createElement('canvas');estatic.width=96;estatic.height=170;estCx=estatic.getContext('2d')}
  const im=estCx.createImageData(96,170),d=im.data;for(let i=0;i<d.length;i+=4){const v=60+Math.random()*195|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}estCx.putImageData(im,0,0);
  cx.save();cx.globalAlpha=Math.min(1,a);cx.imageSmoothingEnabled=false;cx.drawImage(estatic,0,0,W,H);cx.imageSmoothingEnabled=true;
  cx.fillStyle='rgba(0,0,0,.35)';for(let y=(Math.random()*6)|0;y<H;y+=6)cx.fillRect(0,y,W,2);
  const by=Math.random()*H;cx.fillStyle='rgba(255,255,255,.5)';cx.fillRect(0,by,W,10+Math.random()*30);cx.restore()}
function placa(z,T,t0){const u=T-t0;if(u<0||u>2.8)return;const a=u<.25?u/.25:u>2.3?(2.8-u)/.5:1,y=Math.max(60,H*.07)+(1-a)*-20;
  cx.save();cx.globalAlpha=a;const s=Math.min(1,W/420),w=Math.min(W-24,(100+Math.max(120,z.nom.length*11.5))*s+20*s),h=46*s,x=(W-w)/2;
  cx.fillStyle='rgba(10,8,20,.82)';rr(x,y,w,h,12);cx.fill();cx.strokeStyle='#ffd23f';cx.lineWidth=2;cx.stroke();
  cx.fillStyle='#ffd23f';rr(x+6,y+6,84*s,h-12,8);cx.fill();cx.fillStyle='#1a1020';cx.font='800 '+Math.round(15*s)+'px system-ui,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('CANAL '+z.canal,x+6+42*s,y+h/2+1);
  cx.fillStyle='#fff7e6';cx.font='800 '+Math.round(19*s)+'px system-ui,sans-serif';cx.fillText(z.nom,x+90*s+(w-90*s)/2,y+h/2+1);cx.restore()}
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function txt(t,x,y,px,col,o){o=o||{};cx.save();cx.font='800 '+px+'px system-ui,sans-serif';cx.textAlign=o.al||'center';cx.textBaseline='middle';cx.lineJoin='round';cx.lineWidth=px/5;cx.strokeStyle=o.st||'rgba(20,10,30,.85)';cx.strokeText(t,x,y);cx.fillStyle=col;cx.fillText(t,x,y);cx.restore()}
function dibuixaIntro(T){
  const k=introOk?Math.max(W/INTRO.width,H/INTRO.height):1,z=1+.045*Math.max(0,Math.min(1,T/6.7)),w=INTRO.width*k*z,h=INTRO.height*k*z;
  cx.fillStyle='#0b0b14';cx.fillRect(0,0,W,H);if(introOk)cx.drawImage(INTRO,(W-w)/2,(H-h)*.45,w,h)}
function dibuixaPartic(T){
  for(const p of G.puffs){const a=1-(T-p.t)/p.life;if(a<=0)continue;const q=T-p.t;cx.globalAlpha=a;cx.fillStyle=p.c;cx.beginPath();cx.arc(sx(p.wx+p.vx*q),sy(p.wy+p.vy*q+q*q*160),Math.max(1,5*zoom*a+1),0,6.3);cx.fill()}cx.globalAlpha=1;
  G.puffs=G.puffs.filter(p=>T-p.t<p.life)}
function dibuixaPops(T){for(const p of G.pops){const q=T-p.t;if(q<0||q>.75)continue;cx.globalAlpha=1-q/.75;txt(p.txt,sx(p.wx),sy(p.wy)-q*50*zoom,Math.round(22*Math.max(.9,zoom*1.6)),p.col);cx.globalAlpha=1}G.pops=G.pops.filter(p=>T-p.t<.8)}
function confeti(T,dt){const cols=['#ff4ba0','#3bd0ff','#ffe36b','#9b5cff','#7dff6a','#ffffff'];
  if(T>=FINAL_T&&T<DUR+2){for(let i=0;i<4;i++)G.conf.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*60,vy:90+Math.random()*120,c:cols[(Math.random()*cols.length)|0],r:Math.random()*6,s:3+Math.random()*4,w:Math.random()*6})}
  for(const c of G.conf){c.x+=c.vx*dt+Math.sin(c.w+=dt*5)*.8;c.y+=c.vy*dt;c.r+=dt*6;cx.fillStyle=c.c;cx.save();cx.translate(c.x,c.y);cx.rotate(c.r);cx.fillRect(-c.s,-c.s/2,c.s*2,c.s);cx.restore()}
  G.conf=G.conf.filter(c=>c.y<H+20)}
let tPrev=0;
function render(T){
  const dt=Math.max(0,Math.min(.1,performance.now()/1000-tPrev));tPrev=performance.now()/1000;
  const zi=Math.max(zoneAt(T),G.zr),z=ZN[zi];
  if(zi!==G.lastZi){G.lastZi=zi;G.snap=true;volTrams(Math.max(1,zi))}
  const bp=((((T-O)/B)%1)+1)%1;
  if(zi===0){dibuixaIntro(T)}
  else{
    camera(T,zi,dt);dibuixaTrams(zi);
    const items=[],fm=formacio(zi),fi=T>=FINAL_T;
    // pads i anells (a terra)
    for(let i=Math.max(0,G.ni-2);i<EV.length;i++){const e=EV[i];if(e.z!==zi)continue;if(e.t>T+1.0)break;if(e.t<T-.5)continue;dibuixaPad(e,T,zi,bp)}
    // obstacles
    for(let i=Math.max(0,G.ni-4);i<EV.length;i++){const e=EV[i];if(e.t>T+2.4)break;if(e.z!==zi||e.k==='G'||e.t<T-1.2)continue;items.push(obstacle(e,T,zi))}
    // personatges
    const pre=T<z.t0;
    if(!fi){for(const f of fm){const h=personatge(zi,Math.max(T,z.t0*0+T),f);items.push({depth:h.x+h.y+(h.dy>0?.05:0),f:()=>dibuixaPers(h,T,zi,pre)})}}
    else{const e=posZ(zi,FINAL_T),px=pX(e.x,e.y),py=pY(e.x,e.y,0);
      if(T>FINAL_T+.35){const q=Math.min(1,(T-FINAL_T-.35)/.25);items.push({depth:e.x+e.y-1,f:()=>sprite('raquel','final_0',px,py-46+(1-q)*-10,{a:q})})}
      for(const f of fm){items.push({depth:e.x+e.y+(f.dy>0?.05:0),f:()=>sprite(f.id,'final_0',px+f.dx*1.5,py+f.dy*1.5)})}}
    items.sort((a,b)=>a.depth-b.depth);for(const it of items)it.f();
    dibuixaPartic(T);dibuixaPops(T);
    // pols de llum del batec
    cx.drawImage(vign,0,0,W,H);
    if(bp<.22&&!fi){cx.globalAlpha=.07*(1-bp/.22);cx.fillStyle='#fff';cx.fillRect(0,0,W,H);cx.globalAlpha=1}
  }
  // zap entre zones
  const zt=ZN[zi].t0;let a=0;
  if(zi>=1&&T>=zt-.14&&T<=zt+.5){a=T<zt-.04?(T-(zt-.14))/.1:T<zt+.08?1:Math.max(0,1-(T-zt-.08)/.42)}
  else if(zi===1||zi>=1){const nt=zi+1<ZN.length?ZN[zi+1].t0:null;if(nt&&T>=nt-.14&&T<=nt)a=(T-(nt-.14))/.1}
  if(zi===0&&ZN[1]&&T>=ZN[1].t0-.14)a=Math.min(1,(T-(ZN[1].t0-.14))/.1);
  if(G.wipe>-9){const q=(T-G.wipe)/.5;if(q<1)a=Math.max(a,1-q)}
  soroll(a,T);
  if(!G.fin)placa(z,T,Math.max(zt,0)+(zi===0?.4:0));
  if(T<DUR&&zi>=1)confeti(T,dt);
  hud(T,zi);
}
function hud(T,zi){
  if(!G.on)return;
  // barra de progrés amb marques de zona
  const pw=W-24,x0=12,y0=Math.max(8,0)+4;cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(x0,y0,pw,4);
  cx.fillStyle='#ffd23f';cx.fillRect(x0,y0,pw*Math.max(0,Math.min(1,T/DUR)),4);cx.fillStyle='rgba(255,255,255,.7)';for(const z of ZN)cx.fillRect(x0+pw*z.t0/DUR-1,y0-2,2,8);
  if(G.mode==='joc'){txt(String(G.score),16,34,26,'#fff7e6',{al:'left'});if(G.combo>=3)txt('×'+G.combo,16,62,20,'#ffd23f',{al:'left'})}
  else txt('PASSEIG',16,34,20,'#7dff6a',{al:'left'});
  // compte enrere en reiniciar
  const z=ZN[zi];if(zi>=1&&zi===G.cd&&T<z.t0+.35&&T>z.t0-1.25){const q=z.t0-T,n=q>.8?3:q>.4?2:q>0?1:0;{txt(n?String(n):'Va!',W/2,H*.5,Math.round(Math.min(W,H)*.2),'#ffd23f')}}
  if(G.assistMsg&&T-G.assistMsg<3.5&&T>=G.assistMsg)txt('Ajuda activada: finestres una mica més amples',W/2,H-60,15,'#7dff6a');
  // consells del primer tram
  if(zi===1&&G.mode==='joc'){for(let i=G.ni;i<Math.min(EV.length,G.ni+1);i++){const e=EV[i];if(e.z===1&&e.st===0&&e.t-T<1.1&&e.t-T>-.1&&G.hits<4)txt(e.k==='G'?'TOCA!':'TOCA PER SALTAR!',W/2,H*.78,26,'#ffffff')}}
  if(G.fail&&T>=G.fail.t+.12)txt(G.fail.k==='gir'?'Has caigut!':'Has ensopegat!',W/2,H*.45,34,'#ff6b6b');
}
function frame(){
  requestAnimationFrame(frame);
  if(G.paused||G.cal)return;
  if(!G.on){if(!G.fin){const dt=0;cx.setTransform(DPR,0,0,DPR,0,0);dibuixaIntro(0)}return}
  const T=tNow();cx.setTransform(DPR,0,0,DPR,0,0);update(T);render(T)}

/* ============================ entrada ============================ */
function tocPantalla(ev){if(!G.on||G.paused||G.fail||G.fin||G.mode==='passeig')return;
  const T=tNow(instant(ev));if(!judgeTap(T)){G.puffs.push({t:T,wx:G.cam.x,wy:G.cam.y,vx:0,vy:0,c:'rgba(255,255,255,.0)',life:.01})}}
cv.addEventListener('pointerdown',ev=>{ev.preventDefault();tocPantalla(ev)});
addEventListener('keydown',ev=>{if(ev.repeat)return;if(ev.code==='Space'||ev.code==='ArrowUp'||ev.code==='Enter'||ev.code==='KeyZ'||ev.code==='KeyX'){if(G.on&&!G.paused){ev.preventDefault();tocPantalla(ev)}}
  else if(ev.code==='Escape'||ev.code==='KeyP'){G.on&&(G.paused?continua():pausa())}});
$('b-joc').onclick=()=>comenca('joc');$('b-passeig').onclick=()=>comenca('passeig');
$('pau').onclick=pausa;
$('b-continua').onclick=continua;
$('b-mode').onclick=()=>{G.mode=G.mode==='joc'?'passeig':'joc';$('b-mode').textContent=G.mode==='joc'?'Passa a «Passeig»':'Passa a «Joc»'};
$('b-surt').onclick=()=>{G.on=false;G.paused=false;$('pausa').hidden=true;$('pau').hidden=true;$('inici').hidden=false;atura(true)};
$('b-torna').onclick=()=>{$('fi').hidden=true;$('inici').hidden=false;G.fin=false};

/* ---------- calibrar el ritme: 16 cops, la persona toca quan els sent ---------- */
const CAL={actiu:false,tocs:[],n:16,t:null};
const fmtAj=v=>(v>0?'+':v<0?'−':'')+Math.abs(Math.round(v*1000))+' ms';
function pintaAjust(){$('aj-val').textContent=fmtAj(AJUST)}
function desaAjust(v){AJUST=Math.max(-.4,Math.min(.4,Math.round(v*200)/200));try{localStorage.setItem('raquelsans-ajust',String(AJUST))}catch(e){}pintaAjust()}
function pintaCal(){$('cal-punts').innerHTML=Array.from({length:CAL.n},(_,k)=>`<i class="${k<CAL.tocs.length?'on':''}"></i>`).join('')}
function cop(at,fort){const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=fort?1760:1320;
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.55,at+.002);g.gain.exponentialRampToValueAtTime(.001,at+.07);o.connect(g);g.connect(ac.destination);o.start(at);o.stop(at+.09)}
function comencaCal(){
  if(!ac)return;ac.resume&&ac.resume();atura(true);clearTimeout(CAL.t);
  const P=B,at=ac.currentTime+.9;for(let k=0;k<CAL.n;k++)cop(at+k*P,k%4===0);
  base=at;rel.off=null;CAL.actiu=true;CAL.tocs=[];pintaCal();
  $('cal-t').textContent='Escolta i toca';$('cal-p').textContent="Toca la pantalla, o prem l'espai, a cada cop. Els primers serveixen per agafar el ritme.";
  $('b-cal-comenca').disabled=true;CAL.t=setTimeout(acabaCal,(.9+CAL.n*P+.7)*1000)}
function tocCal(ev){if(!CAL.actiu)return;CAL.tocs.push(tempsCru(instant(ev)));if(CAL.tocs.length<=CAL.n)pintaCal()}
function acabaCal(){
  CAL.actiu=false;$('b-cal-comenca').disabled=false;$('b-cal-comenca').textContent='Torna-ho a provar';
  const P=B,d=[];for(const t of CAL.tocs){const k=Math.round(t/P);if(k>=3&&k<CAL.n){const x=t-k*P;if(Math.abs(x)<.3)d.push(x)}}
  if(d.length<6){$('cal-t').textContent='Calen més tocs';$('cal-p').textContent='Toca a cada cop que sentis, fins al final. Torna-ho a provar.';return}
  d.sort((a,b)=>a-b);const med=d[d.length>>1],disp=d.map(x=>Math.abs(x-med)).sort((a,b)=>a-b)[d.length>>1];desaAjust(med);
  $('cal-t').textContent='Ritme calibrat';
  $('cal-p').textContent=(Math.abs(med)<.015?'El so i el joc ja anaven junts.':`El so t'arriba ${Math.abs(Math.round(med*1000))} ms ${med>0?'més tard':'abans'} del que el navegador diu. Ja està corregit.`)+(disp>.05?' Els tocs han estat una mica irregulars: si vols més precisió, repeteix-ho.':'')+' Queda desat en aquest aparell.'}
$('b-calibra').onclick=()=>{if(!carregat)return;$('inici').hidden=true;$('calibra').hidden=false;G.cal=true;$('cal-t').textContent='Toca a cada cop';$('cal-p').textContent="Sonaran 16 cops. Toca la pantalla, o prem l'espai, just quan sentis cada cop. Fes-ho amb els auriculars o l'altaveu amb què jugaràs.";$('b-cal-comenca').textContent='Comença';CAL.tocs=[];pintaCal()};
$('b-cal-comenca').onclick=comencaCal;
$('b-cal-tanca').onclick=()=>{CAL.actiu=false;clearTimeout(CAL.t);G.cal=false;$('calibra').hidden=true;$('inici').hidden=false};
$('calibra').addEventListener('pointerdown',ev=>{if(!CAL.actiu||(ev.target.closest&&ev.target.closest('button,a')))return;ev.preventDefault();tocCal(ev)});
addEventListener('keydown',ev=>{if(CAL.actiu&&(ev.code==='Space'||ev.code==='Enter')){ev.preventDefault();tocCal(ev)}});
$('b-aj-menys').onclick=()=>desaAjust(AJUST-.01);$('b-aj-mes').onclick=()=>desaAjust(AJUST+.01);$('aj-val').onclick=()=>desaAjust(0);pintaAjust();

/* ============================ proves (temps virtual) ============================ */
window.__rs={G,EV,ZN,RS,
  prepara(mode){G.mode=mode||'joc';G.score=0;G.combo=0;G.falls=0;G.hits=0;G.perf=0;G.fallsZ={};G.fin=false;for(const e of EV){e.st=0;e.pts=0;e.perfect=false}G.on=true;G.paused=false;reinicia(0)},
  async carregaMons(){for(let z=1;z<=8;z++)await bitmaps(z)},
  pas(T){window.__vt=T;update(T);cx.setTransform(DPR,0,0,DPR,0,0);render(T)},
  toca(T){window.__vt=T;return judgeTap(T)},
  reinicia,tNow,carrega:()=>{carregat=true},posZ};
requestAnimationFrame(frame);
carrega();
