(()=>{
'use strict';
const $=s=>document.querySelector(s);
const QS=new URLSearchParams(location.search);
const CAPTURE=QS.has('capture');
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches&&!CAPTURE;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eOut3=x=>1-Math.pow(1-x,3);
const eOutExpo=x=>x>=1?1:1-Math.pow(2,-10*x);
const eInOutS=x=>-(Math.cos(Math.PI*x)-1)/2;
const eInOut3=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u)};
const eBack=(x,c=1.9)=>1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);
const eElastic=x=>x<=0?0:x>=1?1:Math.pow(2,-10*x)*Math.sin((x*10-.75)*(2*Math.PI)/3)+1;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hex=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const rgbStr=(c,a=1)=>`rgba(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)},${a})`;
let W=innerWidth,H=innerHeight,PHONE=W<760;
const DPR=Math.min(window.devicePixelRatio||1,2);

/* =====================================================================
   COPY
   ===================================================================== */
const T={
 en:{org:'MSM Kochi Branch<small>with CIER</small>',kicker:'the stage awakens…',date:'Sat · 14 Nov 2026',venue:'QLS Panayappilly',cats:'Kids to Teens',
     reg:'Register now',due:'Entries close 10 November',skip:'Skip intro',sheetT:'Registration opens here',sheetP:'The form (category, items, age check) comes in the next step.',close:'Close',regShort:'Register →',tapClose:'Tap again to close',clickClose:'Click again to close'},
 ml:{org:'MSM കൊച്ചി ശാഖ<small>CIER-നൊപ്പം</small>',kicker:'അരങ്ങുണരുന്നു ഇനി സർഗവസന്തം',date:'നവംബർ 14 ശനി',venue:'QLS പനയപ്പിള്ളി',cats:'കിഡ്സ് മുതൽ ടീൻസ് വരെ',
     reg:'രജിസ്റ്റർ ചെയ്യൂ',due:'നവംബർ 10-ന് മുമ്പ് എൻട്രി ഉറപ്പാക്കൂ',skip:'സ്കിപ്പ്',sheetT:'രജിസ്ട്രേഷൻ ഇവിടെ',sheetP:'ഫോം (വിഭാഗം, ഇനങ്ങൾ, പ്രായം) അടുത്ത ഘട്ടത്തിൽ.',close:'അടയ്ക്കുക',regShort:'രജിസ്റ്റർ →',tapClose:'അടയ്ക്കാൻ വീണ്ടും തൊടൂ',clickClose:'അടയ്ക്കാൻ വീണ്ടും ക്ലിക്ക് ചെയ്യൂ'}
};
const CAT={en:['Kids','Children','Sub-Junior','Junior','Teens'],ml:['കിഡ്സ്','ചിൽഡ്രൻ','സബ്ജൂനിയർ','ജൂനിയർ','ടീൻസ്']};
let LANG='en';
function applyLang(l){
  LANG=l;document.documentElement.lang=l;
  document.querySelectorAll('[data-i18n]').forEach(e=>e.innerHTML=T[l][e.dataset.i18n]);
  document.querySelectorAll('#lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l));
  pillIndicator();
}
function pillIndicator(){const pill=$('#lang'),b=pill.querySelector('[aria-pressed=true]');if(!b)return;
  pill.style.setProperty('--pw',b.offsetWidth+'px');pill.style.setProperty('--px',b.offsetLeft+'px')}
let langBusy=false,DTW=null; // DTW: doodle glide between old and new layout
const EZ='cubic-bezier(.22,.9,.24,1)';
function setLang(l){
  if(l===LANG||langBusy)return;
  try{localStorage.setItem('sg-lang',l)}catch(e){}
  hideTip();
  const quick=REDUCED||!Element.prototype.animate;
  document.querySelectorAll('#lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l));pillIndicator();
  if(quick){applyLang(l);requestAnimationFrame(()=>relayout(true));return}
  langBusy=true;
  const txt=[...document.querySelectorAll('.hero [data-i18n],.top [data-i18n],#skip')].filter(e=>e.offsetParent!==null);
  // 1. current words lift away softly
  const outs=txt.map((e,i)=>e.animate([{opacity:1,filter:'blur(0px)',translate:'0 0'},{opacity:0,filter:'blur(4px)',translate:'0 -6px'}],
    {duration:190,delay:i*14,easing:'cubic-bezier(.5,0,.9,.5)',fill:'forwards'}));
  const phase2=()=>{
    // 2. swap while invisible, then glide the logo block and the doodles to their new places
    const hero=$('#hero'),y0=$('#logoWrap').getBoundingClientRect().top;
    for(const id in dEls){const e=dEls[id];e.ox=e.x;e.oy=e.y}
    applyLang(l);relayout(true);
    const dy=y0-$('#logoWrap').getBoundingClientRect().top;
    if(Math.abs(dy)>.5)hero.animate([{translate:`0 ${dy}px`},{translate:'0 0'}],{duration:560,easing:EZ});
    DTW={t0:performance.now(),dur:560};
    // 3. new words settle in, a little after one another
    txt.forEach((e,i)=>e.animate([{opacity:0,filter:'blur(4px)',translate:'0 7px'},{opacity:1,filter:'blur(0px)',translate:'0 0'}],
      {duration:380,delay:90+i*28,easing:EZ,fill:'backwards'}));
    outs.forEach(a=>a.cancel());
    setTimeout(()=>{langBusy=false;DTW=null},700);
  };
  if(outs.length)outs[outs.length-1].finished.then(phase2,phase2);else phase2();
}
document.querySelectorAll('#lang button').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));

/* =====================================================================
   TIMELINE  (seconds)
   ===================================================================== */
const TL={sweep:0, brushIn:2.2, brushStart:2.42, brushEnd:4.1, brushOut:4.36, penIn:4.25};
function setBrushTimes(){ // the desktop sweep is wider, give it a little longer
  TL.brushEnd=PHONE?4.1:4.3;TL.brushOut=TL.brushEnd+.26;TL.penIn=TL.brushEnd+.15;
}

/* =====================================================================
   PAINT ITEMS: splats with fingers, flung drops, spray, drips
   ===================================================================== */
const PAL={orange:'#F57A22',coral:'#F14F3A',magenta:'#E2246E',green:'#308E40',teal:'#2B7D60',blue:'#4581CB',indigo:'#4F5BA3',mint:'#7CC7AE',yellow:'#F6B731'};
let items=[],drips=[],iHead=0,introSkipped=false,baked=false;
function makeSplat(r,x,y,R,col,t0,hero){
  const nf=hero?14:10,F=new Float32Array(64),G=new Float32Array(64);
  let ext=0;
  for(let k=0;k<nf;k++){
    const ang=(k+r()*.8)/nf*Math.PI*2, long=r()<(hero?.5:.4);
    const len=R*(long?.3+r()*.72:.05+r()*.15);
    const wb=R*(long?.06+r()*.05:.055+r()*.05);
    const wt=wb*(long?.24+r()*.14:.5);
    const bulb=long?wt*(1.5+r()*1.2):0;
    const gap=long&&r()<.45?bulb*(.6+r()*2.4):0;
    F.set([ang,len,wb,wt],k*4);G.set([bulb,gap,0,0],k*4);
    ext=Math.max(ext,len+(gap>0?gap+2*bulb:bulb));
  }
  const ea=r()*Math.PI;
  return{type:0,x,y,R,col,seed:r(),t0,hero,tm:hero?1:.92,elong:1+r()*.2,dir:[Math.cos(ea),Math.sin(ea)],F,G,nf,
    reach:R*1.2+ext+4,grow:hero?.42:.34,life:hero?.5:.42,mix:1,useClr:true};
}
// a drop flung off a splat: round head where it lands, tail pointing the way it travelled
function makeDrop(r,s,spray){
  const a=r()*Math.PI*2;
  const d=s.R*(spray?1.15+r()*1.7:1.12+r()*(s.hero?1.1:.8));
  const sz=spray?Math.max(1.1,s.R*(.005+r()*.012)):s.R*(.022+r()*.05);
  return{type:1,x:s.x+Math.cos(a)*d,y:s.y+Math.sin(a)*d,R:sz,col:s.col,seed:r(),t0:s.t0+.03+(d/s.R)*.045,
    dir:[Math.cos(a),Math.sin(a)],tail:sz*(spray?r()*2.5:1.2+r()*4.5),tm:spray?.7:.85,grow:spray?.08:.1,life:spray?.1:.14,mix:1,useClr:true};
}
function buildSplats(){
  W=innerWidth;H=innerHeight;PHONE=W<760;
  const M=Math.max(W,H), land=W>H, r=rng(20261114), S=land?M:H*.62;
  const heroP=land?[[.30,.40,.30,'orange'],[.74,.30,.30,'blue'],[.50,.80,.28,'magenta'],[.12,.72,.27,'green'],[.90,.78,.27,'coral']]
                  :[[.52,.40,.40,'orange'],[.18,.14,.36,'magenta'],[.84,.20,.36,'blue'],[.18,.80,.36,'green'],[.82,.86,.36,'coral']];
  const secP=land?[[.06,.12,.17,'yellow'],[.52,.08,.18,'teal'],[.95,.06,.16,'indigo'],[.62,.50,.16,'yellow'],[.30,.96,.17,'indigo'],[.75,.98,.16,'teal'],[.02,.46,.15,'coral'],[.99,.50,.15,'mint']]
                 :[[.50,.04,.22,'teal'],[.04,.42,.22,'yellow'],[.97,.52,.22,'indigo'],[.55,.66,.24,'blue'],[.48,.97,.24,'yellow'],[.08,.98,.2,'indigo'],[.95,.99,.2,'teal'],[.78,.40,.18,'mint']];
  const heroT=[.40,.62,.84,1.04,1.22], secT=[1.34,1.42,1.5,1.58,1.66,1.74,1.82,1.9];
  const base=[];
  heroP.forEach((h,i)=>base.push(makeSplat(r,h[0]*W,h[1]*H,h[2]*S,hex(PAL[h[3]]),heroT[i],true)));
  secP.forEach((h,i)=>base.push(makeSplat(r,h[0]*W,h[1]*H,h[2]*S,hex(PAL[h[3]]),secT[i],false)));
  items=base.slice();
  for(const s of base){
    for(let k=0;k<(s.hero?10:5);k++)items.push(makeDrop(r,s,false));
    for(let k=0;k<(s.hero?16:7);k++)items.push(makeDrop(r,s,true));
  }
  items.sort((a,b)=>a.t0-b.t0);iHead=0;
  drips=[];
  for(const s of base){
    for(let k=0;k<(s.hero?3:1);k++){
      const ang=Math.PI/2+(r()-.5)*1.2, rr=s.R*(.8+r()*.1);
      drips.push({type:2,x:s.x+Math.cos(ang)*rr,y:s.y+Math.sin(ang)*rr,len:(PHONE?40:60)+r()*(PHONE?120:180),
        w:(PHONE?4.5:6)+r()*(PHONE?4:6),col:s.col,t0:s.t0+.45+r()*.75,dur:1.6+r()*1.6,seed:r(),tm:1,mix:1,useClr:true});
    }
  }
  drips.sort((a,b)=>a.t0-b.t0);
  balloons=[];shreds=[];base.forEach(s=>addBalloon(s,s.hero?.27:.2));
}
function colorAt(x,y,t){
  let c=null;
  for(const s of items){if(s.type!==0||s.t0>t)continue;const dx=x-s.x,dy=y-s.y;if(dx*dx+dy*dy<s.R*s.R*.92)c=s.col}
  return c;
}

/* =====================================================================
   WEBGL PAINT  (thickness + colour layer, glossy enamel display)
   ===================================================================== */
const cv=$('#paint');
const gl=cv.getContext('webgl2',{alpha:false,depth:false,stencil:false,antialias:false,preserveDrawingBuffer:CAPTURE,powerPreference:'high-performance'});
let FL=null;
const N_=`
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
`;
const SDF_=`
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float cro(vec2 a,vec2 b){return a.x*b.y-a.y*b.x;}
float sdUCap(vec2 p,vec2 pa,vec2 pb,float ra,float rb){
 p-=pa;pb-=pa;float h=dot(pb,pb);float b=ra-rb;
 if(h<=b*b+1e-3)return min(length(p)-ra,length(p-pb)-rb);
 vec2 q=vec2(dot(p,vec2(pb.y,-pb.x)),dot(p,pb))/h;q.x=abs(q.x);
 vec2 c=vec2(sqrt(h-b*b),b);
 float k=cro(c,q),m=dot(c,q),n=dot(q,q);
 if(k<0.)return sqrt(h*n)-ra;
 if(k>c.x)return sqrt(h*(n+1.-2.*q.y))-rb;
 return m-ra;}
`;
const VS=`#version 300 es
precision highp float;
in vec2 aPos;out vec2 vUv;
void main(){vUv=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}`;
const PU_=`uniform vec2 uRes;
vec2 P(vec2 uv){return vec2(uv.x*uRes.x,(1.-uv.y)*uRes.y);}
vec2 UV(vec2 p){return vec2(p.x/uRes.x,1.-p.y/uRes.y);}
`;
const H_=`#version 300 es
precision highp float;precision highp sampler2D;
in vec2 vUv;out vec4 o;
`+PU_;
// programs that write a paint surface: colour*thickness + the time the top layer landed
const HS_=`#version 300 es
precision highp float;precision highp sampler2D;
in vec2 vUv;layout(location=0) out vec4 o;layout(location=1) out vec4 o2;
uniform sampler2D uMeta;
`+PU_;
const FS={
copy:HS_+`uniform sampler2D uSrc;void main(){o=texture(uSrc,vUv);o2=texture(uMeta,vUv);}`,
wall:H_+N_+`void main(){vec2 p=P(vUv);o=vec4(noise(p*.06)*.55+noise(p*.21+3.)*.3+noise(p*.9+7.)*.15,0.,0.,1.);}`,
// cleared amount from the bristle mask: ragged, streaky edge
clr:H_+`uniform sampler2D uMask;`+N_+`
void main(){vec2 p=P(vUv);vec2 px=1./uRes;
 vec2 jit=(vec2(noise(p*.05),noise(p*.05+9.))-.5)*px*12.+(vec2(noise(p*.22+2.),noise(p*.22+5.))-.5)*px*4.;
 vec2 mu=vec2(vUv.x,1.-vUv.y)+jit;
 float m=texture(uMask,mu).r;
 // bristle clumps run along the stroke: broad bands with finer hairs inside
 float st=noise(vec2(p.x*.11,p.y*.005))*.55+noise(vec2(p.x*.27+4.,p.y*.01))*.3+noise(vec2(p.x*.6+9.,p.y*.03))*.15;
 // streaks hang down from paint above a cleared edge (they read as runs); paint below an edge keeps a tidier lip
 float gy=texture(uMask,mu+vec2(0.,8.*px.y)).r-texture(uMask,mu-vec2(0.,8.*px.y)).r;
 float sk=.25+.75*smoothstep(-.25,.25,gy);
 float c=smoothstep(.2+.42*st*sk,.45+.42*st*sk,m);
 // near an edge of the sweep a thin film of paint stays in some bristle tracks
 float mn=1.,ms=m;
 for(int k=0;k<8;k++){float a=float(k)*.785;float v=texture(uMask,mu+vec2(cos(a),sin(a))*px*10.).r;mn=min(mn,v);ms+=v;}
 ms/=9.;
 float near=1.-smoothstep(.3,.85,mn);
 float stri=smoothstep(.52,.72,noise(vec2(p.x*.2+3.,p.y*.006)))*.8+smoothstep(.6,.75,noise(vec2(p.x*.5+7.,p.y*.012)))*.3;
 c*=1.-.3*clamp(near*stri*sk,0.,1.);
 c=max(c,.5*smoothstep(.03,.5,ms));
 o=vec4(c,0.,0.,1.);}`,
bake:HS_+`uniform sampler2D uSrc,uClr;void main(){o=texture(uSrc,vUv)*(1.-texture(uClr,vUv).r);o2=texture(uMeta,vUv);}`,
// one paint item laid onto the layer: splat (body+fingers), flung drop, or drip
item:HS_+`uniform sampler2D uSrc,uClr;
uniform int uType,uNF;
uniform vec2 uC,uDir,uA2;
uniform vec3 uCol;
uniform float uR,uSeed,uTm,uGrowR,uMix,uElong,uUseClr,uAA,uTail,uW,uT0;
uniform vec4 uF[16],uG[16];
`+N_+SDF_+`
void main(){
 vec4 o0=texture(uSrc,vUv),m0=texture(uMeta,vUv);
 o=o0;o2=m0;
 if(uType==2&&m0.r>uT0+.004)return; // a drip never runs over paint that landed after it started
 vec2 p=P(vUv);
 float sd,mw,bonus=0.,rim=0.;
 if(uType==0){
  vec2 d=p-uC;
  vec2 e=vec2(dot(d,uDir)/uElong,dot(d,vec2(-uDir.y,uDir.x)));
  float L=length(e);vec2 dn=e/(L+1e-4);
  float w=(noise(dn*1.3+uSeed*17.)-.5)*.26+(noise(dn*3.2+uSeed*29.)-.5)*.13+(noise(dn*8.5+uSeed*5.)-.5)*.05;
  float fr=uGrowR*(1.+.3*(noise(dn*2.6+uSeed*41.)-.5)); // ragged spreading front
  float body=max(L-uR*(1.+w),length(d)-fr);
  float fing=1e5;
  for(int i=0;i<16;i++){
   if(i>=uNF)break;
   vec4 f=uF[i],g=uG[i];
   vec2 fd=vec2(cos(f.x),sin(f.x));
   float df=sdUCap(e,fd*uR*.55,fd*(uR+f.y),f.z,f.w);
   if(g.x>0.){
    float db=length(e-fd*(uR+f.y+(g.y>0.?g.y+g.x:0.)))-g.x;
    df=g.y>0.?min(df,db):smin(df,db,g.x*.9);
   }
   fing=min(fing,df);
  }
  fing=max(fing,length(d)-fr*1.3); // the jets shoot out ahead of the body
  sd=smin(body,fing,uR*.09);
  mw=max(2.,uR*.034);rim=1.;
 }else if(uType==1){
  vec2 tp=uC+uDir*uTail;
  sd=sdUCap(p,uC,tp,uR,uR*.3);
  sd=max(sd,dot(p-uC,uDir)+uR*1.1-uGrowR);
  mw=max(1.2,uR*.42);
 }else{
  vec2 q=p;float dy=p.y-uA2.y;
  q.x-=sin(dy*.045+uSeed*6.283)*1.3*smoothstep(0.,24.,dy);
  sd=sdUCap(q,uA2,uC,uW*.56,uW*.46);
  vec2 bc=uC+vec2(0.,uW*.28);
  float lb=length(q-bc);
  sd=smin(sd,lb-uW*.72,uW*.55);
  bonus=.35*(1.-smoothstep(0.,uW*.9,lb));
  mw=max(1.2,uW*.32);
 }
 float dist=-sd;
 float cov=smoothstep(-uAA,uAA,dist);
 if(cov<=0.)return;
 float th=uTm*(1.-exp(-max(dist,0.)/mw));
 float z=(dist-mw*1.7)/(mw*1.2);
 th+=rim*uTm*.15*exp(-z*z);
 th*=(1.+bonus)*(1.+.12*(noise(p*.035+uSeed*13.)-.5));
 float m=uUseClr>.5?1.-texture(uClr,vUv).r:1.;
 float c=cov*m;
 float oT=o0.a;vec3 oc=oT>1e-4?o0.rgb/oT:uCol;
 // thick new paint levels the relief of what it covers (wet paint flows flat)
 float oTs=oT*.2;
 for(int k=0;k<8;k++){float a=float(k)*.785+.39;vec2 dd=vec2(cos(a),sin(a));
  oTs+=.05*texture(uSrc,UV(p+dd*9.)).a+.05*texture(uSrc,UV(p+dd*19.)).a;}
 float base=mix(oT,oTs,smoothstep(.2,.8,th)*c);
 float nT=base+th*c*(1.-.3*smoothstep(.6,2.6,base));
 vec3 nc=mix(oc,uCol,clamp(c*uMix,0.,1.));
 o=vec4(nc*nT,nT);
 o2=vec4(c>.5?max(m0.r,uT0):m0.r,0.,0.,1.);
}`,
// flat brush dragged through wet paint: shoves ridges out to the sides, heaps carried paint in front
smudge:HS_+`uniform sampler2D uSrc;
uniform vec2 uA,uB,uRidge;
uniform float uHW,uPress,uRW,uBW,uSeed,uNow;
uniform vec3 uCarry[5];
`+N_+`
vec3 carry(float x){float f=clamp(x*.5+.5,0.,1.)*4.;float fi=min(floor(f),3.);int i=int(fi);return mix(uCarry[i],uCarry[i+1],f-fi);}
void main(){
 vec4 o0=texture(uSrc,vUv),m0=texture(uMeta,vUv);
 o=o0;o2=m0;
 vec2 p=P(vUv);
 vec2 ab=uB-uA;float len=length(ab);
 if(len<.05)return;
 vec2 dir=ab/len,pr=vec2(-dir.y,dir.x);
 float t0=o0.a;
 // the cleared edge wanders with the same field the clear pass uses, so the ridge hugs it
 vec2 pj=p+(vec2(noise(p*.05),noise(p*.05+9.))-.5)*12.+(vec2(noise(p*.22+2.),noise(p*.22+5.))-.5)*4.;
 float along=dot(p-uA,dir),lat=dot(pj-uB,pr),ahead=dot(p-uB,dir),al=abs(lat);
 float nT=o0.a;vec3 nc=nT>1e-4?o0.rgb/nT:vec3(.5);
 float e0=uHW*1.02;
 float wa=smoothstep(-3.,3.,along)*(1.-smoothstep(len-3.,len+3.,along));
 if(wa>0.&&al>e0-.3*uRW&&al<e0+uRW){
  float x=(al-e0)/uRW;
  float bump=smoothstep(-.3,.2,x)*(1.-smoothstep(.35,1.,x));
  float wob=(.45+noise(vec2(p.x*.03+uSeed*9.,p.y*.05+uSeed*3.)))*(.55+.9*noise(vec2(al*.35+uSeed*7.,p.y*.015)));
  vec4 s=texture(uSrc,UV(p-pr*sign(lat)*uRW*1.4));
  if(s.a>.02){
   vec3 sc=mix(s.rgb/s.a,carry(sign(lat)),.45);
   float add=bump*wob*(p.x<uB.x?uRidge.x:uRidge.y)*(.16+.45*min(s.a,1.8))*wa;
   nc=nT>.02?mix(nc,sc,smoothstep(0.,.25,add)*.9):sc;
   nT+=add;
  }
 }
 if(ahead>-3.&&ahead<uBW&&al<uHW*1.02){
  float f=1.-clamp(ahead/uBW,0.,1.);f*=f;
  float k=f*(1.-smoothstep(uHW*.7,uHW*1.02,al))*uPress;
  if(k>0.){
   vec3 cc=carry(lat/uHW);
   nc=nT>.02?mix(nc,cc,k*.32):cc;
   nT=min(nT+k*.3,max(nT,2.8));
  }
 }
 o=vec4(nc*nT,nT);
 if(nT>t0+.01)o2=vec4(max(m0.r,uNow),0.,0.,1.);
}`,
// finger smear after the intro
finger:HS_+`uniform sampler2D uSrc;uniform vec2 uA,uB;uniform float uRad;
void main(){
 vec4 o0=texture(uSrc,vUv);vec2 p=P(vUv);o2=texture(uMeta,vUv);
 vec2 ab=uB-uA;float l2=dot(ab,ab);
 float s=clamp(dot(p-uA,ab)/max(l2,1e-3),0.,1.);
 float f=1.-smoothstep(uRad*.4,uRad,length(p-(uA+ab*s)));
 if(f<=0.||l2<.1){o=o0;return;}
 o=mix(o0,texture(uSrc,UV(p-ab*.9)),f*.8);
}`,
display:H_+`uniform sampler2D uDye,uClr,uWall;
uniform vec2 uDyeTexel;
uniform vec3 uLight;
uniform float uTime,uSweep,uUseClr,uHS;
`+N_+`
float TT(vec2 uv){float t=texture(uDye,uv).a;return uUseClr>.5?t*(1.-texture(uClr,uv).r):t;}
float sbox(vec2 r,vec2 c,vec2 s,float soft){vec2 q=abs(r-c)-s;float d=length(max(q,0.))+min(max(q.x,q.y),0.);return 1.-smoothstep(-soft,soft,d);}
void main(){
 vec2 uv=vUv,p=P(uv);
 vec3 L=normalize(uLight);
 // ---- wall: soft plaster under a studio light
 vec2 wo=1.5/uRes;
 float h0=texture(uWall,uv).r,hx=texture(uWall,uv+vec2(wo.x,0.)).r,hy=texture(uWall,uv-vec2(0.,wo.y)).r;
 vec3 wn=normalize(vec3((h0-hx)*1.3,(hy-h0)*1.3,1.));
 vec3 wall=vec3(.962,.946,.914)*(.935+.08*dot(wn,L))*(.988+.024*h0);
 vec2 vu=uv-vec2(.5,.56);wall*=1.-.12*dot(vu,vu)*1.6;
 float sw=(uv.x-(uSweep*1.8-.4))/.22;
 wall+=vec3(.05,.045,.03)*exp(-sw*sw)*step(uSweep,.999);
 // ---- paint: height = thickness, enamel gloss
 vec4 d=texture(uDye,uv);
 float cl=uUseClr>.5?texture(uClr,uv).r:0.;
 float T=d.a*(1.-cl);
 vec3 pc=d.a>1e-4?d.rgb/d.a:vec3(0.);
 vec2 ex=vec2(uDyeTexel.x,0.),ey=vec2(0.,uDyeTexel.y),pxe=uDyeTexel*uRes;
 float tl=TT(uv-ex),tr=TT(uv+ex),tb=TT(uv-ey),tt=TT(uv+ey);
 vec3 n=normalize(vec3((tl-tr)*uHS/(2.*pxe.x),(tb-tt)*uHS/(2.*pxe.y),1.));
 float cov=smoothstep(.012,.07,T);
 vec2 mb=(vec2(noise(p*.09+uTime*.05),noise(p*.09+17.3-uTime*.04))-.5)*.02
        +(vec2(noise(p*.012+3.),noise(p*.012+9.))-.5)*.025*smoothstep(.2,1.,T);
 n=normalize(n+vec3(mb,0.)*cov);
 float ndl=dot(n,L);
 vec3 col=pc*clamp(1.+.7*(ndl-L.z),.4,1.16);
 col=mix(col,col+(1.-col)*.14,1.-smoothstep(.05,.4,T));
 col*=1.-.1*dot(vu,vu)*1.6;
 vec3 V=vec3(0.,0.,1.),Hh=normalize(L+V);
 float nh=max(dot(n,Hh),0.);
 float spec=pow(nh,220.)*1.3+pow(nh,48.)*.1;
 vec3 R=reflect(-V,n);
 float env=sbox(R.xy,vec2(-.36,.42),vec2(.17,.1),.05)*.75+sbox(R.xy,vec2(.44,.3),vec2(.12,.07),.05)*.28+.05*smoothstep(.15,.9,length(R.xy));
 float fres=.04+.96*pow(1.-clamp(n.z,0.,1.),5.);
 vec3 shine=vec3(1.,.985,.955)*(spec+env*(.6+2.*fres));
 // cast shadows, light from the top-left: paint onto the wall, raised paint onto lower paint
 vec2 lt=normalize(uLight.xy);
 float s1=TT(uv+lt*3./uRes),s2=TT(uv+lt*7./uRes);
 wall*=1.-(.13*smoothstep(.08,.8,s1)+.08*smoothstep(.35,1.3,s2))*(1.-cov);
 col*=1.-.16*smoothstep(.12,.7,s1-T)*cov;
 vec3 outc=mix(wall,col,cov)+shine*cov;
 o=vec4(clamp(outc,0.,1.),1.);
}`
};
function glInit(){
  if(!gl)return false;
  const extF=gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float');
  if(!extF)return false;
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s),src.slice(0,200));return null}return s};
  const vs=sh(gl.VERTEX_SHADER,VS);if(!vs)return false;
  const progs={};
  for(const k in FS){const fs=sh(gl.FRAGMENT_SHADER,FS[k]);if(!fs)return false;const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.bindAttribLocation(p,0,'aPos');gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(p));return false}
    const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const nm=gl.getActiveUniform(p,i).name;u[nm]=gl.getUniformLocation(p,nm)}
    progs[k]={p,u};}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const maskTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,maskTex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  FL={progs,maskTex};
  return true;
}
function fbo(w,h,ifmt,fmt,type,filter){
  const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,null);
  const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  return{tex,fb,w,h};
}
function freeFbo(f){if(f){gl.deleteTexture(f.tex);if(f.tex2)gl.deleteTexture(f.tex2);gl.deleteFramebuffer(f.fb)}}
function fbo2(w,h){ // paint (rgb*T, T) + meta (time the top layer landed)
  const mt=(ifmt,fmt,filter)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,gl.HALF_FLOAT,null);return t};
  const tex=mt(gl.RGBA16F,gl.RGBA,gl.LINEAR),tex2=mt(gl.R16F,gl.RED,gl.NEAREST);
  const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,tex2,0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  return{tex,tex2,fb,w,h};
}
function surface(w,h){return{a:fbo2(w,h),b:fbo2(w,h),w,h,swap(){const x=this.a;this.a=this.b;this.b=x}}}
let QUAL=1;
function glSize(){
  if(!FL)return;
  const sc=Math.min(DPR,PHONE?1.5:1.25)*QUAL;
  cv.width=Math.round(W*sc);cv.height=Math.round(H*sc);FL.scale=sc;
  const short=Math.round((PHONE?600:900)*Math.sqrt(QUAL)),asp=W/H;
  const dw=asp<1?short:Math.min(1800,Math.round(short*asp)), dh=asp<1?Math.min(1800,Math.round(short/asp)):short;
  for(const s of [FL.base,FL.comp])if(s){freeFbo(s.a);freeFbo(s.b)}
  freeFbo(FL.clr);freeFbo(FL.wall);
  FL.base=surface(dw,dh);FL.comp=surface(dw,dh);
  FL.clr=fbo(dw,dh,gl.R8,gl.RED,gl.UNSIGNED_BYTE,gl.LINEAR);
  FL.wall=fbo(cv.width,cv.height,gl.R16F,gl.RED,gl.HALF_FLOAT,gl.LINEAR);
  const u=use('wall');gl.uniform2f(u.uRes,W,H);drawTo(FL.wall);
  baked=false;maskDirty=true;compU=null;
}
// run every program once on a single pixel so drivers finish compiling before the first splat, not during it
function glWarm(){
  gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,1,1);
  for(const k in FL.progs){use(k);drawTo(k==='display'?null:(FS[k].includes('location=1')?FL.comp.b:FL.clr))}
  gl.disable(gl.SCISSOR_TEST);
  const px=new Uint8Array(4);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); // wait for it
}
function use(name){const P=FL.progs[name];gl.useProgram(P.p);return P.u}
function tex(unit,t){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);return unit}
function drawTo(f){gl.bindFramebuffer(gl.FRAMEBUFFER,f?f.fb:null);gl.viewport(0,0,f?f.w:cv.width,f?f.h:cv.height);gl.drawArrays(gl.TRIANGLES,0,3)}
// css-px box -> texel box (texel row 0 is the bottom of the screen)
function texBox(S,x0,y0,x1,y1){
  const sx=S.w/W,sy=S.h/H;
  const bx0=Math.max(0,Math.floor(x0*sx)-1),bx1=Math.min(S.w,Math.ceil(x1*sx)+1);
  const by0=Math.max(0,Math.floor((H-y1)*sy)-1),by1=Math.min(S.h,Math.ceil((H-y0)*sy)+1);
  return bx1>bx0&&by1>by0?[bx0,by0,bx1-bx0,by1-by0]:null;
}
// render a program over a small box of a surface, then copy the box back so .a stays the whole truth
function localPass(S,box,prog,set){
  const u=use(prog);gl.uniform2f(u.uRes,W,H);set(u);gl.uniform1i(u.uSrc,tex(0,S.a.tex));gl.uniform1i(u.uMeta,tex(3,S.a.tex2));
  gl.enable(gl.SCISSOR_TEST);gl.scissor(box[0],box[1],box[2],box[3]);
  drawTo(S.b);
  copyFull(S.b,S.a);
  gl.disable(gl.SCISSOR_TEST);
}
function copyFull(src,dst){const c=use('copy');gl.uniform2f(c.uRes,W,H);gl.uniform1i(c.uSrc,tex(0,src.tex));gl.uniform1i(c.uMeta,tex(3,src.tex2));drawTo(dst)}
function itemRect(s,t){
  const age=t-s.t0;
  const g=s.type===2?0:1-Math.pow(1-clamp(age/s.grow,0,1),4);
  let x0,y0,x1,y1,grow=0,hy=s.y;
  if(s.type===0){
    const rr=s.reach*s.elong;grow=lerp(s.R*.28,rr,g);const b=Math.min(grow*1.5,rr)+4; // jets run up to 1.3x the ragged front, which itself reaches 15% past grow
    x0=s.x-b;x1=s.x+b;y0=s.y-b;y1=s.y+b;
  }else if(s.type===1){
    const tx=s.x+s.dir[0]*s.tail,ty=s.y+s.dir[1]*s.tail;grow=(s.tail+s.R*2.2)*g;
    x0=Math.min(s.x,tx)-s.R-3;x1=Math.max(s.x,tx)+s.R+3;y0=Math.min(s.y,ty)-s.R-3;y1=Math.max(s.y,ty)+s.R+3;
  }else{
    const u=clamp(age/s.dur,0,1);hy=s.y+s.len*(1-Math.pow(1-u,2.2));
    x0=s.x-s.w*1.3-4;x1=s.x+s.w*1.3+4;y0=s.y-s.w-2;y1=hy+s.w*1.4+2;
  }
  return[x0,y0,x1,y1,grow,hy];
}
function drawItem(S,s,t){
  if(t<s.t0)return;
  const [x0,y0,x1,y1,grow,hy]=itemRect(s,t);
  const box=texBox(S,x0,y0,x1,y1);if(!box)return;
  localPass(S,box,'item',u=>{
    gl.uniform1i(u.uType,s.type);gl.uniform2f(u.uC,s.x,hy);gl.uniform2f(u.uA2,s.x,s.y);
    gl.uniform2f(u.uDir,s.dir?s.dir[0]:1,s.dir?s.dir[1]:0);gl.uniform3f(u.uCol,s.col[0],s.col[1],s.col[2]);
    gl.uniform1f(u.uR,s.R||0);gl.uniform1f(u.uSeed,s.seed);gl.uniform1f(u.uTm,s.tm);gl.uniform1f(u.uGrowR,grow);
    gl.uniform1f(u.uMix,s.mix);gl.uniform1f(u.uElong,s.elong||1);gl.uniform1f(u.uUseClr,s.useClr?1:0);
    gl.uniform1f(u.uAA,Math.max(.5,W/S.w*.7));gl.uniform1f(u.uTail,s.tail||0);gl.uniform1f(u.uW,s.w||0);gl.uniform1f(u.uT0,s.t0);
    if(s.type===0){gl.uniform1i(u.uNF,s.nf);gl.uniform4fv(u['uF[0]'],s.F);gl.uniform4fv(u['uG[0]'],s.G)}
    gl.uniform1i(u.uClr,tex(1,FL.clr.tex));
  });
}
const _ca=new Float32Array(15);
function carryArr(){
  const c=bState.carry;let last=null;
  for(let i=0;i<5;i++)if(c[i]){last=c[i];break}
  for(let i=0;i<5;i++){const v=c[i]||last||[.5,.5,.5];if(c[i])last=c[i];_ca[i*3]=v[0];_ca[i*3+1]=v[1];_ca[i*3+2]=v[2]}
  return _ca;
}
function smudge(A,B,press,seed,now,rl,rr){
  compU=null;const S=FL.base,hw=bw*.5,rw=Math.max(10,bw*.11),bwv=Math.max(16,bw*.17),m=hw+rw+bwv+6;
  const box=texBox(S,Math.min(A.x,B.x)-m,Math.min(A.y,B.y)-m,Math.max(A.x,B.x)+m,Math.max(A.y,B.y)+m);if(!box)return;
  localPass(S,box,'smudge',u=>{
    gl.uniform2f(u.uA,A.x,A.y);gl.uniform2f(u.uB,B.x,B.y);gl.uniform1f(u.uHW,hw);gl.uniform1f(u.uPress,press);gl.uniform2f(u.uRidge,rl,rr);
    gl.uniform1f(u.uRW,rw);gl.uniform1f(u.uBW,bwv);gl.uniform1f(u.uSeed,seed);gl.uniform3fv(u['uCarry[0]'],carryArr());gl.uniform1f(u.uNow,now);
  });
}
function fingerSmudge(A,B){
  compU=null;const S=FL.base,rad=PHONE?20:24,m=rad+Math.hypot(B.x-A.x,B.y-A.y)+4;
  const box=texBox(S,Math.min(A.x,B.x)-m,Math.min(A.y,B.y)-m,Math.max(A.x,B.x)+m,Math.max(A.y,B.y)+m);if(!box)return;
  localPass(S,box,'finger',u=>{gl.uniform2f(u.uA,A.x,A.y);gl.uniform2f(u.uB,B.x,B.y);gl.uniform1f(u.uRad,rad)});
}
let maskDirty=true;
function updateClr(){
  if(!maskDirty||!FL)return;
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,FL.maskTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mk);
  const u=use('clr');gl.uniform2f(u.uRes,W,H);gl.uniform1i(u.uMask,1);drawTo(FL.clr);
  maskDirty=false;
}
function bake(){ // the brushed area becomes real bare wall, so later taps can paint on it
  const S=FL.base,u=use('bake');gl.uniform2f(u.uRes,W,H);gl.uniform1i(u.uSrc,tex(0,S.a.tex));gl.uniform1i(u.uMeta,tex(3,S.a.tex2));gl.uniform1i(u.uClr,tex(1,FL.clr.tex));
  drawTo(S.b);S.swap();baked=true;compU=null;
}
const light={x:-.42,y:.55,z:.72,tx:-.42,ty:.55};
// commit finished items, then lay the live ones over a copy of the base
let compU=null; // null = composite must be refreshed in full (base changed outside item areas)
function paintFrame(t){
  while(iHead<items.length){const s=items[iHead];if(t>=s.t0+s.life){drawItem(FL.base,s,s.t0+s.life+9);s.hit=true;iHead++}else break}
  for(const d of drips)if(!d.done&&t>=d.t0+d.dur){drawItem(FL.base,d,d.t0+d.dur+9);d.done=true}
  if(!baked&&t>=TL.brushEnd+.08){updateClr();bake()}
  const act=[];
  for(let i=iHead;i<items.length;i++){const s=items[i];if(s.t0>t)break;act.push(s);
    if(!s.hit){s.hit=true;if((s.hero&&!introSkipped)||s.tap)onHeroHit(s)}}
  for(const d of drips)if(!d.done&&d.t0<=t)act.push(d);
  if(!act.length){compU=null;return FL.base}
  // only refresh the part of the composite that live items touch now or touched last frame
  let u=[1e9,1e9,-1e9,-1e9];
  for(const s of act){const r=itemRect(s,t);u=[Math.min(u[0],r[0]),Math.min(u[1],r[1]),Math.max(u[2],r[2]),Math.max(u[3],r[3])]}
  const cu=compU?[Math.min(u[0],compU[0]),Math.min(u[1],compU[1]),Math.max(u[2],compU[2]),Math.max(u[3],compU[3])]:null;compU=u;
  const box=cu&&texBox(FL.comp,cu[0],cu[1],cu[2],cu[3]);
  if(box){gl.enable(gl.SCISSOR_TEST);gl.scissor(box[0],box[1],box[2],box[3]);copyFull(FL.base.a,FL.comp.a);gl.disable(gl.SCISSOR_TEST)}
  else copyFull(FL.base.a,FL.comp.a);
  for(const s of act)drawItem(FL.comp,s,t);
  return FL.comp;
}
function glRender(t,src){
  const u=use('display');
  gl.uniform2f(u.uRes,W,H);
  gl.uniform1i(u.uDye,tex(0,src.a.tex));gl.uniform1i(u.uClr,tex(1,FL.clr.tex));gl.uniform1i(u.uWall,tex(2,FL.wall.tex));
  gl.uniform2f(u.uDyeTexel,1/src.w,1/src.h);gl.uniform3f(u.uLight,light.x,light.y,light.z);
  gl.uniform1f(u.uTime,t);gl.uniform1f(u.uSweep,clamp(t/1.2,0,1));gl.uniform1f(u.uUseClr,baked?0:1);gl.uniform1f(u.uHS,4.6);
  drawTo(null);
}
// jump the paint to its finished state (skip, return visit, big resize)
function finishPaint(target){
  introSkipped=true;compU=null;
  mx.clearRect(0,0,W,H);paintMaskTo(TL.brushEnd+.05,true);updateClr();
  while(iHead<items.length){const s=items[iHead];s.hit=true;drawItem(FL.base,s,s.t0+s.life+9);iHead++}
  for(const d of drips)if(!d.done){drawItem(FL.base,d,d.t0+d.dur+9);d.done=true}
  for(let st=lastSim+SIMDT;st<=TL.brushOut+.02;st+=SIMDT)simStep(st);
  brushPrev=null;
  if(!baked)bake();
  lastSim=Math.max(target,TL.brushOut+.1);
}

/* =====================================================================
   LAYOUT  (hero rect, clear zone, brush path)
   ===================================================================== */
const mk=document.createElement('canvas'),mx=mk.getContext('2d');const MS=.5;
function sizeMask(){mk.width=Math.max(2,Math.round(W*MS));mk.height=Math.max(2,Math.round(H*MS));mx.setTransform(MS,0,0,MS,0,0);mx.clearRect(0,0,W,H);maskDirty=true}
let zone,logoR,passes=[],bw=120;
function relayout(keepState){
  W=innerWidth;H=innerHeight;PHONE=W<760;
  const lr=$('#logoWrap').getBoundingClientRect();logoR={x:lr.left,y:lr.top,w:lr.width,h:lr.height,k:lr.width/SCRIPT.W};
  const hr=$('#hero').getBoundingClientRect();
  layoutDoodles();
  const db=doodleBounds();
  const padX=PHONE?16:34,padY=PHONE?26:44,mX=PHONE?12:20;
  zone={x0:PHONE?-14:Math.max(mX,Math.min(hr.left,db.x0)-padX),x1:PHONE?W+14:Math.min(W-mX,Math.max(hr.right,db.x1)+padX),
        y0:Math.max(PHONE?66:70,Math.min(hr.top,db.y0)-padY),y1:Math.min(H-(PHONE?12:18),Math.max(hr.bottom,db.y1)+padY)};
  buildBrushPath();
  sizeLogoCanvas();pillIndicator();
  if(keepState){sizeMask();if(clock>TL.brushStart)paintMaskTo(clock,true)}
}

/* =====================================================================
   BRUSH  (procedural realistic flat brush + clear mask + GPU push)
   ===================================================================== */
function buildBrushPath(){
  const zw=zone.x1-zone.x0, n=PHONE?3:clamp(Math.round(zw/260),3,5);
  bw=zw/n*1.16;
  passes=[];
  const r=rng(77);
  const T0=TL.brushStart,T1=TL.brushEnd, turn=.11, pd=((T1-T0)-(n-1)*turn)/n;
  const cy=(zone.y0+zone.y1)/2,hh=(zone.y1-zone.y0)/2;
  for(let i=0;i<n;i++){
    const xc=(i+.5)/n*2-1, x=zone.x0+zw*(i+.5)/n, down=(n-1-i)%2===0; // last pass always ends low
    // each stroke reaches a little past the content, by its own amount: the ends stagger like real brushwork
    const sa=(r()-.5)*.2,sb=(r()-.5)*.28, gs=(Math.abs(sa)+.05)*bw, ge=(Math.abs(sb)+.1)*bw; // what the ragged start / lift give back
    const gT=down?gs:ge, gB=down?ge:gs;
    const st=Math.min(bw*.3,hh*.16), top=Math.min(zone.y0-gT,Math.max(zone.y0-gT-r()*st,PHONE?80:84)),
      bot=Math.max(zone.y1+gB,Math.min(zone.y1+gB+r()*st,H-(PHONE?96:84)));
    const ya=down?top:bot, yb=down?bot:top;
    passes.push({x,ya,yb,t0:T0+i*(pd+turn),t1:T0+i*(pd+turn)+pd,wob:r()*6.28,lean:(r()-.5)*.06,seed:r(),sa,sb,i,n});
  }
}
// brush state at time t: contact point, pressure, velocity, tilt
let brushHidden=false;
function brushAt(t){
  const P=passes;if(!P.length)return null;
  const first=P[0],last=P[P.length-1];
  const at=(p,u)=>{const e=eInOutS(clamp(u,0,1));const y=lerp(p.ya,p.yb,e);const x=p.x+Math.sin(e*3.4+p.wob)*bw*.05+(e-.5)*bw*.16*(p.ya<p.yb?1:-1);return{x,y}};
  if(t<TL.brushIn||t>TL.brushOut+.05)return null;
  if(t<first.t0){ // enter from the right, lifted
    const e=eOut3(seg(t,TL.brushIn,first.t0));const s=at(first,0);
    return{x:lerp(W+bw*1.4,s.x,e),y:lerp(s.y-H*.25,s.y,e),press:0,lift:1-e*.6,pass:-1};
  }
  if(t>last.t1){
    const e=eInOut3(seg(t,last.t1,TL.brushOut));const s=at(last,1);
    return{x:lerp(s.x,W+bw*1.6,e),y:lerp(s.y,s.y+(last.yb>last.ya?H*.2:-H*.25),e),press:0,lift:.4+e*.6,pass:-1};
  }
  for(let i=0;i<P.length;i++){
    const p=P[i];
    if(t>=p.t0&&t<=p.t1){
      const u=(t-p.t0)/(p.t1-p.t0);const q=at(p,u);
      const press=Math.min(1,seg(u,0,.07)*1.0)*(1-seg(u,.93,1));
      return{x:q.x,y:q.y,press,lift:(1-press)*.4,pass:i};
    }
    if(i<P.length-1&&t>p.t1&&t<P[i+1].t0){ // hop to next pass, lifted
      const e=eInOutS(seg(t,p.t1,P[i+1].t0));const a=at(p,1),b=at(P[i+1],0);
      return{x:lerp(a.x,b.x,e),y:lerp(a.y,b.y,e)+Math.sin(e*Math.PI)*(p.yb>p.ya?16:-16),press:0,lift:.4+Math.sin(e*Math.PI)*.3,pass:-1};
    }
  }
  return null;
}
// clear-mask: bristle streaks painted into an offscreen canvas
const BR=(()=>{const r=rng(5),a=[];const N=40;for(let j=0;j<N;j++){const o=j/(N-1)-.5,edge=Math.abs(o)*2;a.push({o,w:(1.5+r()*1.9)/N,a:(.35+r()*.55)*(1-.35*edge),dry:edge*(.4+r()*.6),ph:r()*6.3,amp:.004+r()*.012,
  r1:r()*r(),r2:Math.pow(r(),2.2)})}return a})();
let maskT=0;
function paintMaskTo(t,full){
  const t0=full?TL.brushStart:maskT;if(t<=t0)return;
  const step=1/120;
  for(let x=t0;x<t;x+=step){
    const a=brushAt(x),b=brushAt(Math.min(t,x+step));
    if(!a||!b||a.press<.05||b.press<.05)continue;
    const p=passes[a.pass];if(!p)continue;const pu=seg(x,p.t0,p.t1);
    const Lp=Math.abs(p.yb-p.ya),dir=p.yb>p.ya?1:-1,va=(a.y-p.ya)*dir,vb=(b.y-p.ya)*dir;
    for(const s of BR){
      // slanted, feathered ends: each bristle starts a touch late and lifts a touch early
      const lo=(p.sa*s.o+Math.abs(p.sa)*.5)*bw+s.r1*bw*(dir>0?.06:.015), hi=Lp-(p.sb*s.o+Math.abs(p.sb)*.5)*bw-s.r2*bw*(dir>0?.025:.1);
      if(vb<lo||va>hi||vb<=va&&(va<lo||va>hi))continue;
      const f0=va<lo?(lo-va)/(vb-va):0, f1=vb>hi?(hi-va)/(vb-va):1;
      const fade=1-s.dry*.85*Math.pow(pu,2);
      const jx=Math.sin(pu*9+s.ph)*s.amp*bw, ox=s.o*bw+jx;
      mx.strokeStyle=`rgba(255,255,255,${(s.a*fade*Math.min(a.press,b.press)).toFixed(3)})`;mx.lineWidth=s.w*bw*1.04;mx.lineCap='round';
      mx.beginPath();mx.moveTo(lerp(a.x,b.x,f0)+ox,lerp(a.y,b.y,f0));mx.lineTo(lerp(a.x,b.x,f1)+ox,lerp(a.y,b.y,f1));mx.stroke();
    }
  }
  maskT=t;maskDirty=true;
}
// --- procedural brush drawing
const bState={bend:0,bendV:0,comp:0,carry:[null,null,null,null,null],load:0,px:null,py:null,vx:0,vy:0,lastT:0};
function updateCarry(b,st){ // paint the bristles pick up, five zones across the brush
  for(let i=0;i<5;i++){
    const c=colorAt(b.x+(i/4-.5)*bw*.9,b.y,st);if(!c)continue;
    const k=bState.carry[i];bState.carry[i]=k?[lerp(k[0],c[0],.22),lerp(k[1],c[1],.22),lerp(k[2],c[2],.22)]:c.slice();
  }
}
const GRAIN=(()=>{const r=rng(31),a=[];for(let i=0;i<9;i++)a.push({x:r()*.9-.45,w:.5+r()*1.4,ph:r()*6,a:.06+r()*.12});return a})();
const STR=(()=>{const r=rng(9),a=[];for(let i=0;i<160;i++)a.push({x:r()-.5,c:.86+r()*.14,a:.35+r()*.5,w:.8+r()*1.2,k:r(),pl:r()});return a})();
function shadowShape(ctx,tilt,sc,off,blur,alpha,path){
  ctx.save();ctx.shadowColor=`rgba(38,26,14,${alpha})`;ctx.shadowBlur=blur*DPR;
  ctx.shadowOffsetX=(Math.cos(tilt)*4000*sc+off[0])*DPR;ctx.shadowOffsetY=(Math.sin(tilt)*4000*sc+off[1])*DPR;
  ctx.translate(-4000,0);ctx.fillStyle='#000';ctx.beginPath();path(ctx);ctx.fill();ctx.restore();
}
function drawBrush(ctx,b,t){
  const u=bw;
  // bristle spring follows sideways speed, bristles compress with pressure
  const dt=clamp(t-bState.lastT,1/240,1/20);bState.lastT=t;
  if(bState.px!=null){const vx=(b.x-bState.px)/dt,vy=(b.y-bState.py)/dt;bState.vx=lerp(bState.vx,vx,.5);bState.vy=lerp(bState.vy,vy,.5)}
  bState.px=b.x;bState.py=b.y;
  const target=clamp(-bState.vx*.00026,-.2,.2)*u*(.4+b.press*.6);
  const acc=170*(target-bState.bend)-16*bState.bendV;bState.bendV+=acc*dt;bState.bend+=bState.bendV*dt;
  bState.comp=lerp(bState.comp,b.press,.25);
  const tilt=clamp(bState.vx*.00012,-.12,.12)+(b.lean||0)-.04, lift=b.lift||0, sc=1+lift*.06;
  const L=u*.8*(1-.06*bState.comp), fh=u*.42, hl=u*1.72, splay=1+.09*bState.comp, bend=bState.bend;
  const fy0=-L, fy1=-L-fh, hy0=fy1-u*.1, hy1=hy0-hl;
  const tipX=x=>x*u*splay+bend*Math.pow(Math.abs(x)*2,.5)*.2+bend;
  const hw=k=>u*(.17+.09*Math.sin(Math.min(1,k*1.5)*Math.PI/2)+.025*k);
  const pBristle=c=>{c.moveTo(-u*.5,fy0);c.bezierCurveTo(-u*.52,-L*.45,tipX(-.5)-u*.02+bend*.2,-L*.12,tipX(-.5),0);c.lineTo(tipX(.5),0);
    c.bezierCurveTo(tipX(.5)+u*.02+bend*.2,-L*.12,u*.52,-L*.45,u*.5,fy0);c.closePath()};
  const pFerrule=c=>{c.moveTo(-u*.52,fy0+u*.02);c.lineTo(u*.52,fy0+u*.02);c.lineTo(u*.5,fy1+u*.06);c.quadraticCurveTo(u*.48,fy1-u*.04,u*.2,hy0+u*.02);
    c.lineTo(-u*.2,hy0+u*.02);c.quadraticCurveTo(-u*.48,fy1-u*.04,-u*.5,fy1+u*.06);c.closePath()};
  const pHandle=c=>{const N=22;for(let i=0;i<=N;i++){const k=i/N;c.lineTo(hw(k),lerp(hy0+u*.04,hy1+u*.14,k))}
    c.quadraticCurveTo(hw(1),hy1-u*.02,0,hy1-u*.02);c.quadraticCurveTo(-hw(1),hy1-u*.02,-hw(1),hy1+u*.14);
    for(let i=N;i>=0;i--){const k=i/N;c.lineTo(-hw(k),lerp(hy0+u*.04,hy1+u*.14,k))}c.closePath()};
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(tilt);ctx.scale(sc,sc);
  // ---- layered shadows (light from the top-left): bristles touch the wall, the handle stands off it
  shadowShape(ctx,tilt,sc,[u*(.18+lift*.25),u*(.24+lift*.32)],u*(.12+lift*.2),.2,pHandle);
  shadowShape(ctx,tilt,sc,[u*(.08+lift*.2),u*(.1+lift*.26)],u*(.06+lift*.18),.24,pFerrule);
  shadowShape(ctx,tilt,sc,[u*(.025+lift*.15)+1.5,u*(.035+lift*.2)+2],u*(.025+lift*.12)+1.5,.32,pBristle);
  // ---- handle: varnished beech, beavertail shape
  ctx.beginPath();pHandle(ctx);
  let g=ctx.createLinearGradient(-u*.3,0,u*.3,0);
  g.addColorStop(0,'#5a2e12');g.addColorStop(.16,'#8e4f22');g.addColorStop(.36,'#c7853f');g.addColorStop(.5,'#e0a35c');g.addColorStop(.68,'#b8763a');g.addColorStop(.88,'#7b3f18');g.addColorStop(1,'#4a230c');
  ctx.fillStyle=g;ctx.fill();
  ctx.save();ctx.clip();
  for(const gr of GRAIN){ctx.beginPath();for(let i=0;i<=20;i++){const k=i/20,y=lerp(hy0,hy1,k);const x=gr.x*hw(k)*1.9+Math.sin(i*.5+gr.ph)*u*.012;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.strokeStyle=`rgba(70,30,8,${gr.a})`;ctx.lineWidth=gr.w*u*.006;ctx.stroke()}
  ctx.beginPath();for(let i=0;i<=20;i++){const k=i/20;ctx.lineTo(-hw(k)*.45,lerp(hy0,hy1+u*.12,k))}ctx.strokeStyle='rgba(255,240,215,.5)';ctx.lineWidth=u*.028;ctx.stroke();
  ctx.beginPath();for(let i=0;i<=20;i++){const k=i/20;ctx.lineTo(-hw(k)*.32,lerp(hy0,hy1+u*.12,k))}ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=u*.01;ctx.stroke();
  g=ctx.createLinearGradient(0,hy0+u*.04,0,hy0-u*.22);g.addColorStop(0,'rgba(40,18,4,.5)');g.addColorStop(1,'rgba(40,18,4,0)');ctx.fillStyle=g;ctx.fillRect(-u,hy0-u*.22,u*2,u*.27);
  ctx.restore();
  // hang hole, punched through so whatever is behind shows
  ctx.beginPath();ctx.ellipse(0,hy1+u*.13,u*.05,u*.055,0,0,Math.PI*2);ctx.fillStyle='rgba(30,14,4,.85)';ctx.fill();
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.ellipse(u*.007,hy1+u*.135,u*.036,u*.041,0,0,Math.PI*2);ctx.fill();ctx.restore();
  // ---- ferrule: brushed steel with two crimps and a pinched neck
  ctx.beginPath();pFerrule(ctx);
  g=ctx.createLinearGradient(-u*.52,0,u*.52,0);
  g.addColorStop(0,'#3f454c');g.addColorStop(.1,'#8d969f');g.addColorStop(.24,'#eef3f7');g.addColorStop(.33,'#c3cad1');g.addColorStop(.55,'#8a939c');g.addColorStop(.78,'#cfd6dc');g.addColorStop(.9,'#7d868f');g.addColorStop(1,'#3b4046');
  ctx.fillStyle=g;ctx.fill();
  ctx.save();ctx.clip();
  for(let i=0;i<14;i++){const x=-u*.5+i*u/13;ctx.beginPath();ctx.moveTo(x,fy0);ctx.lineTo(x,hy0);ctx.strokeStyle=`rgba(255,255,255,${.04+((i*37)%5)*.012})`;ctx.lineWidth=u*.006;ctx.stroke()}
  [.3,.48].forEach(k=>{const y=lerp(fy0,fy1,k);ctx.fillStyle='rgba(20,24,28,.38)';ctx.fillRect(-u*.6,y-u*.014,u*1.2,u*.026);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(-u*.6,y+u*.014,u*1.2,u*.01)});
  g=ctx.createLinearGradient(0,fy1+u*.06,0,hy0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.32)');ctx.fillStyle=g;ctx.fillRect(-u,hy0,u*2,fy1-hy0+u*.08);
  g=ctx.createLinearGradient(0,fy0+u*.02,0,fy0-u*.08);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-u*.6,fy0-u*.08,u*1.2,u*.1);
  ctx.restore();
  // ---- bristles
  ctx.beginPath();pBristle(ctx);
  g=ctx.createLinearGradient(0,fy0,0,0);
  g.addColorStop(0,'#5b4a35');g.addColorStop(.12,'#b9a37f');g.addColorStop(.35,'#e3d3b2');g.addColorStop(.75,'#efe3c9');g.addColorStop(1,'#f5ecd9');
  ctx.fillStyle=g;ctx.fill();
  ctx.save();ctx.clip();
  for(const s of STR){
    const x0=s.x*u,y0=fy0+u*.02,x1=tipX(s.x)+(s.k-.5)*u*.02;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(lerp(x0,x1,.35)+bend*.25,-L*.4,x1,0);
    const c=Math.round(200+55*s.c);
    ctx.strokeStyle=`rgba(${c},${Math.round(c*.93)},${Math.round(c*.8)},${s.a*.55})`;ctx.lineWidth=u*.006*s.w;ctx.stroke();
    if(s.k<.45){ctx.strokeStyle=`rgba(60,40,20,${.12*s.a})`;ctx.lineWidth=u*.004;ctx.stroke()}
  }
  // paint soaked up from the tips, in the colours the brush has dragged through
  const ld=bState.load;
  if(ld>.02&&bState.carry.some(Boolean)){
    const ca=carryArr();
    const cc=x=>{const f=clamp(x+.5,0,1)*4,i=Math.min(3,Math.floor(f)),k=f-i;return[lerp(ca[i*3],ca[i*3+3],k),lerp(ca[i*3+1],ca[i*3+4],k),lerp(ca[i*3+2],ca[i*3+5],k)]};
    // soaked band with a soft, clumpy top edge, then wet strands on top of it
    const top=x=>-L*ld*(.2+.07*Math.sin(x*9+1.3)+.04*Math.sin(x*23+.4)+.02*Math.sin(x*61));
    const lg=ctx.createLinearGradient(tipX(-.5),0,tipX(.5),0);for(let i=0;i<5;i++)lg.addColorStop(i/4,rgbStr([ca[i*3],ca[i*3+1],ca[i*3+2]],1));
    ctx.beginPath();ctx.moveTo(tipX(-.5)-3,3);for(let i=0;i<=40;i++){const x=i/40-.5;ctx.lineTo(tipX(x),top(x))}ctx.lineTo(tipX(.5)+3,3);ctx.closePath();
    ctx.globalAlpha=.9;ctx.fillStyle=lg;ctx.fill();ctx.globalAlpha=1;
    ctx.lineCap='round';
    for(const s of STR){if(s.k>.5)continue;
      const x=tipX(s.x),h=-top(s.x)*(.85+.45*s.pl);
      ctx.strokeStyle=rgbStr(cc(s.x),.85);ctx.lineWidth=u*(.006+.005*s.w);
      ctx.beginPath();ctx.moveTo(x,2);ctx.lineTo(x-bend*.05,-h);ctx.stroke()}
    ctx.lineCap='butt';
    for(const s of STR){if(s.k<.7)continue;const x=tipX(s.x);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,top(s.x)*.9);
      ctx.strokeStyle=`rgba(0,0,0,${(.09*s.a).toFixed(3)})`;ctx.lineWidth=u*.004;ctx.stroke()}
    const tp=-L*ld*.34;
    const sg=ctx.createLinearGradient(0,tp,0,0);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.55,'rgba(255,255,255,.3)');sg.addColorStop(.8,'rgba(255,255,255,.06)');sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fillRect(-u*.44,tp,u*.42,-tp);
    const dg=ctx.createLinearGradient(0,-L*.08,0,0);dg.addColorStop(0,'rgba(0,0,0,0)');dg.addColorStop(1,'rgba(0,0,0,.2)');ctx.fillStyle=dg;ctx.fillRect(-u,-L*.08,u*2,L*.08+3);
  }
  g=ctx.createLinearGradient(0,fy0,0,fy0+L*.25);g.addColorStop(0,'rgba(40,26,10,.55)');g.addColorStop(1,'rgba(40,26,10,0)');ctx.fillStyle=g;ctx.fillRect(-u,fy0,u*2,L*.25);
  ctx.restore();
  ctx.restore();
}

/* =====================================================================
   LOGO  (stroke-by-stroke reveal of the real artwork)
   ===================================================================== */
const logoCv=$('#logoCv'),lctx=logoCv.getContext('2d');
const LG={comps:{},strokes:[],ready:false};
function sizeLogoCanvas(){LG.still=false;logoCv.width=Math.round(logoR.w*DPR);logoCv.height=Math.round(logoR.h*DPR)}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
async function logoInit(){
  const [img,lab]=await Promise.all([loadImg(LOGO_SRC),loadImg(LABEL_SRC)]);
  const Wn=SCRIPT.W,Hn=SCRIPT.H;
  const c1=document.createElement('canvas');c1.width=Wn;c1.height=Hn;const x1=c1.getContext('2d',{willReadFrequently:true});
  x1.drawImage(lab,0,0);const L=x1.getImageData(0,0,Wn,Hn).data;
  x1.clearRect(0,0,Wn,Hn);x1.drawImage(img,0,0,Wn,Hn);const I=x1.getImageData(0,0,Wn,Hn).data;
  for(const k in SCRIPT.bbox){
    const id=+k,[bx,by,bw_,bh]=SCRIPT.bbox[k];
    const c=document.createElement('canvas');c.width=bw_;c.height=bh;const cx=c.getContext('2d');const d=cx.createImageData(bw_,bh);
    for(let y=0;y<bh;y++)for(let x=0;x<bw_;x++){const gx=bx+x,gy=by+y;if(gx<0||gy<0||gx>=Wn||gy>=Hn)continue;const gi=(gy*Wn+gx)*4;
      if(L[gi]!==id)continue;const di=(y*bw_+x)*4;d.data[di]=I[gi];d.data[di+1]=I[gi+1];d.data[di+2]=I[gi+2];d.data[di+3]=I[gi+3]}
    cx.putImageData(d,0,0);
    const m=document.createElement('canvas');m.width=bw_;m.height=bh;
    LG.comps[id]={id,x:bx,y:by,w:bw_,h:bh,img:c,mask:m,mx:m.getContext('2d'),cx:bx+bw_/2,cy:by+bh/2};
  }
  // strokes: cumulative arc length + writing-time weights (slower in corners)
  LG.strokes=SCRIPT.strokes.map(s=>{
    const P=s.pts;const cum=[0],wcum=[0],L=[0],F=[0],M=[0];
    for(let i=1;i<P.length;i++){
      const l=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);cum.push(cum[i-1]+l);L.push(l);M.push(cum[i-1]+l/2);
      let turn=0;if(i>1){const a1=Math.atan2(P[i-1][1]-P[i-2][1],P[i-1][0]-P[i-2][0]),a2=Math.atan2(P[i][1]-P[i-1][1],P[i][0]-P[i-1][0]);turn=Math.abs(Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)))}
      F.push(1+1.1*Math.min(1,turn/.5));
    }
    // slow-down factor blurred along the stroke (gaussian over arc length) so the pen eases into and out of corners instead of braking instantly
    for(let i=1;i<P.length;i++){let a=0,w=0;for(let j=1;j<P.length;j++){const d=(M[j]-M[i])/34;if(d*d>9)continue;const g=Math.exp(-d*d)*L[j];a+=g*F[j];w+=g}
      wcum.push(wcum[i-1]+L[i]*(w>0?a/w:F[i]))}
    return{...s,cum,wcum,len:cum[cum.length-1]||0,wlen:wcum[wcum.length-1]||0,R:(s.r||[]).map((v,i,a)=>{let m=0;for(let j=Math.max(0,i-3);j<=Math.min(a.length-1,i+3);j++)m=Math.max(m,a[j]);return m*(s.role==='write'?1.25:1.7)+(s.role==='write'?3:5)})};
  });
  scheduleWriting();
  LG.ready=true;
}
// ------- schedule: pencil writes 'write' strokes in order; accents hook onto it
const PEN={axis:Math.atan2(-12,56),tip:[5,493],coneLen:57.3,dockTip:[5,493]};
let WS=[]; // writing segments [{type:'write'|'travel', t0,t1, stroke, from,to}]
let SPEED=1;
function scheduleWriting(){
  const ws=LG.strokes.filter(s=>s.role==='write');
  const totalW=ws.reduce((a,s)=>a+s.wlen,0);
  const writeTime=(PHONE?2.15:2.3)/SPEED;
  const v=totalW/writeTime;
  let t=TL.penIn+.38/SPEED;
  WS=[];
  let prev=[1500,-260];
  WS.push({type:'enter',t0:TL.penIn,t1:t,from:prev,to:ws[0].pts[0],next:ws[0]});
  ws.forEach((s,i)=>{
    if(i>0){const a=ws[i-1].pts[ws[i-1].pts.length-1],b=s.pts[0];const d=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(d>4){const dur=(.06+Math.sqrt(d)*.0035)/SPEED;WS.push({type:'travel',t0:t,t1:t+dur,from:a,to:b,lift:Math.min(1,d/400),prev:ws[i-1],next:s});t+=dur}}
    const dur=i===ws.length-1?Math.max(s.wlen/v,.2/SPEED):s.wlen/v;WS.push({type:'write',t0:t,t1:t+dur,stroke:s});s.t0=t;s.t1=t+dur;t+=dur;
  });
  ws.forEach((s,i)=>s.last=i===ws.length-1);TL.write0=WS[0].t1;TL.writeEnd=t;
  const last=ws[ws.length-1].pts.slice(-1)[0];
  const dockDur=.62/SPEED;
  WS.push({type:'dock',t0:t,t1:t+dockDur,from:last,to:PEN.dockTip,prev:ws[ws.length-1]});TL.dock=t+dockDur;
  // Hermite tangents: every hop leaves at the speed/direction the last stroke ended with and arrives moving the way the next stroke starts
  const vel=(st,end)=>{const e=1e-3,a=end?strokeHead(st,st.t1-e).pt:strokeHead(st,st.t0).pt,b=end?strokeHead(st,st.t1).pt:strokeHead(st,st.t0+e).pt;return[(b[0]-a[0])/e,(b[1]-a[1])/e]};
  const lim=(v,dur,d)=>{let x=v[0]*dur,y=v[1]*dur;const m=Math.hypot(x,y),cap=Math.max(1.3*d,90);if(m>cap){x*=cap/m;y*=cap/m}return[x,y]};
  for(const w of WS){if(w.type==='write')continue;const dur=w.t1-w.t0,d=Math.hypot(w.to[0]-w.from[0],w.to[1]-w.from[1]);
    w.m0=w.prev?lim(vel(w.prev,1),dur,d):[(w.to[0]-w.from[0])*.9,(w.to[1]-w.from[1])*.9];
    w.m1=w.next?lim(vel(w.next,0),dur,d):[0,0];}
  // accents: hook to writing progress
  const at=(group,frac)=>{const s=ws.find(x=>x.group===group);return s?lerp(s.t0,s.t1,frac):TL.dock};
  const acc={
    sprig:[at('blue',0)+0.0,.42],  // after the first upstroke of row 3 (letterB is first 'blue' stroke)
    stem:[ws.filter(x=>x.group==='blue').slice(-1)[0].t1,.32],
    flower:[ws.filter(x=>x.group==='blue').slice(-1)[0].t1+.26,.5],
    squiggle:[at('coral',1)+.05,.36],
    leaf:[ws.filter(x=>x.group==='coral').slice(-1)[0].t1+.02,.55],
    zigzag:[at('teal',.45),.34],
    star:[at('teal2',.9),.6],
    plus:[at('orange',.22),.6],
  };
  const firstBlue=ws.find(x=>x.group==='blue');acc.sprig[0]=firstBlue.t1-.02;
  LG.strokes.forEach(s=>{
    if(s.role==='grow'||s.role==='pop'){const a=acc[s.group];s.t0=a[0];s.t1=a[0]+a[1];
      if(s.role==='grow'){ // stagger sub-strokes of same group
        const sib=LG.strokes.filter(x=>x.group===s.group&&x.role==='grow');const k=sib.indexOf(s);
        const d=a[1]/(sib.length*.6+.4);s.t0=a[0]+k*d*.6;s.t1=s.t0+d;}
    }
    if(s.role==='stamp'){const k=['d2a','d0','d2b','d6'].indexOf(s.group);s.t0=TL.dock-.05+k*.11;s.t1=s.t0+.5}
    if(s.role==='static'){s.t0=TL.dock;s.t1=TL.dock}
  });
  TL.logoDone=TL.dock+.05+3*.11+.5;
  TL.doodle=TL.dock-.2;TL.kicker=TL.dock+.35;TL.meta=TL.dock+.5;TL.cta=TL.dock+.65;TL.ui=TL.dock+.6;
}
// head position of a stroke at time t (native coords) + progress length
function strokeHead(s,t){
  if(t<=s.t0)return{len:0,i:0,pt:s.pts[0]};
  const u=clamp((t-s.t0)/(s.t1-s.t0),0,1);
  const ue=s.role!=='write'?eOut3(u):s.last?.65*u+1.7*u*u-1.35*u*u*u:lerp(u,eInOutS(u),.35); // last stroke settles to a stop before the pencil docks
  const wt=ue*s.wlen;
  let i=1;while(i<s.wcum.length-1&&s.wcum[i]<wt)i++;
  const f=(wt-s.wcum[i-1])/Math.max(1e-6,s.wcum[i]-s.wcum[i-1]);
  const a=s.pts[i-1],b=s.pts[i];
  return{len:lerp(s.cum[i-1],s.cum[i],f),i,f,pt:[lerp(a[0],b[0],f),lerp(a[1],b[1],f)]};
}
function drawStrokeMask(c,s,t){
  const h=strokeHead(s,t);if(h.len<=0&&t<=s.t0)return h;
  const m=c.mx,P=s.pts,R=s.R,ox=c.x,oy=c.y;
  m.lineCap='round';m.lineJoin='round';m.strokeStyle='#fff';m.fillStyle='#fff';
  if(t>=s.t1){ // finished: generous mask so every pixel of the stroke is in
    for(let i=1;i<P.length;i++){m.lineWidth=2*R[i-1];m.beginPath();m.moveTo(P[i-1][0]-ox,P[i-1][1]-oy);m.lineTo(P[i][0]-ox,P[i][1]-oy);m.stroke()}
    m.beginPath();m.arc(P[0][0]-ox,P[0][1]-oy,R[0],0,Math.PI*2);m.fill();
    return h;
  }
  // start cap: the real stroke end only
  m.beginPath();m.arc(P[0][0]-ox,P[0][1]-oy,s.r[0]*1.08+2,0,Math.PI*2);m.fill();
  m.lineCap='butt';
  for(let i=1;i<=h.i&&i<P.length;i++){
    const a=P[i-1],b=i===h.i?h.pt:P[i];
    m.lineWidth=2*R[i-1];
    m.beginPath();m.moveTo(a[0]-ox,a[1]-oy);m.lineTo(b[0]-ox,b[1]-oy);m.stroke();
    // joint disc only when it cannot poke out ahead of the pen
    if(i<h.i&&h.len-s.cum[i]>R[i]){m.beginPath();m.arc(P[i][0]-ox,P[i][1]-oy,R[i],0,Math.PI*2);m.fill()}
  }
  // rounded marker head the size of the real stroke
  const rh=(s.r[Math.min(h.i,s.r.length-1)]||20)*1.04+1.5;
  m.beginPath();m.arc(h.pt[0]-ox,h.pt[1]-oy,rh,0,Math.PI*2);m.fill();
  return h;
}
function wetSheen(c,s,t){ // fresh paint gloss along the newest part of the line
  const m=c.mx,P=s.pts,ox=c.x,oy=c.y;
  const ux=-.32,uy=-.38;
  for(let i=1;i<P.length;i++){
    const ti=s.t0+(s.wcum[i]/s.wlen)*(s.t1-s.t0);
    if(ti>t)break;
    const age=t-ti;if(age>1.3)continue;
    const a=.5*Math.exp(-age/.45)*(1-Math.exp(-age*60));
    const r=s.r[i]||20;
    m.strokeStyle=`rgba(255,255,255,${a.toFixed(3)})`;m.lineWidth=Math.max(1.5,r*.2);m.lineCap='round';
    m.beginPath();m.moveTo(P[i-1][0]-ox+ux*r,P[i-1][1]-oy+uy*r);m.lineTo(P[i][0]-ox+ux*r,P[i][1]-oy+uy*r);m.stroke();
  }
}
function logoRender(t){
  if(!LG.ready)return;
  if(t>TL.logoDone+1.5){if(LG.still)return;LG.still=true}else LG.still=false;
  const k=logoR.k*DPR;
  lctx.setTransform(1,0,0,1,0,0);lctx.clearRect(0,0,logoCv.width,logoCv.height);
  lctx.setTransform(k,0,0,k,0,0);
  for(const id in LG.comps){
    const c=LG.comps[id];
    const ss=LG.strokes.filter(s=>s.cid===c.id);
    if(!ss.length)continue;
    const role=ss[0].role;
    if(role==='write'||role==='grow'){
      const t0=Math.min(...ss.map(s=>s.t0)),t1=Math.max(...ss.map(s=>s.t1));
      if(t<t0)continue;
      const wetEnd=t1+(role==='write'?1.3:0);
      const fade=role==='grow'?seg(t,t1-.04,t1+.14):0;
      if(t>=wetEnd&&(role==='write'||fade>=1)){lctx.drawImage(c.img,c.x,c.y);continue}
      const m=c.mx;m.globalCompositeOperation='source-over';m.clearRect(0,0,c.w,c.h);
      for(const s of ss)drawStrokeMask(c,s,t);
      m.globalCompositeOperation='source-in';m.drawImage(c.img,0,0);
      if(role==='write'){m.globalCompositeOperation='source-atop';for(const s of ss)wetSheen(c,s,t)}
      m.globalCompositeOperation='source-over';
      if(role==='grow'&&fade>0){lctx.globalAlpha=1;lctx.drawImage(c.mask,c.x,c.y);lctx.globalAlpha=fade;lctx.drawImage(c.img,c.x,c.y);lctx.globalAlpha=1}
      else lctx.drawImage(c.mask,c.x,c.y);
    }else if(role==='pop'){
      const s=ss[0];if(t<s.t0)continue;const u=seg(t,s.t0,s.t1);
      const sc=u>=1?1:Math.max(0,eElastic(u)), rot={star:-1.6,plus:1.57,leaf:-.6,flower:.5}[s.group]||0;
      const ax={leaf:[c.x+c.w*.9,c.y+c.h*.55],flower:[c.cx,c.y+c.h]}[s.group]||[c.cx,c.cy];
      lctx.save();lctx.translate(ax[0],ax[1]);lctx.rotate(rot*(1-eOut3(u)));lctx.scale(sc,sc);lctx.globalAlpha=clamp(u*4,0,1);
      lctx.drawImage(c.img,c.x-ax[0],c.y-ax[1]);lctx.restore();
    }else if(role==='stamp'){
      const s=ss[0];if(t<s.t0)continue;const u=seg(t,s.t0,s.t1);
      const fall=seg(u,0,.38), land=seg(u,.38,1);
      const y=-(1-eOut3(fall))*c.h*.45*(fall<1?1:0);
      const sq=fall<1?1:1-.18*Math.sin(land*Math.PI)*Math.exp(-land*3);
      const sx=fall<1?1.25-.25*eOut3(fall):1+.12*Math.sin(land*Math.PI)*Math.exp(-land*3);
      const sy=fall<1?1.25-.25*eOut3(fall):sq;
      const rot=(s.group==='d0'?.12:-.1)*(1-eOut3(u));
      lctx.save();lctx.translate(c.cx,c.y+c.h);lctx.rotate(rot);lctx.scale(sx,sy);lctx.globalAlpha=clamp(fall*3,0,1);
      lctx.drawImage(c.img,c.x-c.cx,-c.h+y);lctx.restore();
    }else if(role==='static'){
      if(t>=ss[0].t0)lctx.drawImage(c.img,c.x,c.y);
    }
  }
}
// ------- pencil (the logo's own pencil, alive)
function herm(w,u){const u2=u*u,u3=u2*u,a=2*u3-3*u2+1,b=u3-2*u2+u,c=-2*u3+3*u2,d=u3-u2;
  return[a*w.from[0]+b*w.m0[0]+c*w.to[0]+d*w.m1[0],a*w.from[1]+b*w.m0[1]+c*w.to[1]+d*w.m1[1]]}
function penState(t){
  for(const w of WS){
    if(t<w.t0||t>w.t1)continue;
    if(w.type==='write'){const h=strokeHead(w.stroke,t);return{tip:h.pt,lift:0,dock:0,writing:1,group:w.stroke.group}}
    const u=seg(t,w.t0,w.t1),h=herm(w,u),s2=Math.sin(u*Math.PI)**2;
    if(w.type==='enter')return{tip:h,lift:1-.85*eInOutS(u),dock:0,writing:0};
    if(w.type==='travel')return{tip:[h[0],h[1]-s2*40*w.lift],lift:s2*.5*w.lift,dock:0,writing:0};
    if(w.type==='dock')return{tip:h,lift:s2*.22,dock:eInOutS(u),writing:0};
  }
  return null;
}
const penImg={};
async function penInit(){
  // cone + lead taken pixel-exact from the logo
  const wood=LG.comps[21],lead=LG.comps[6];
  const c=document.createElement('canvas');const x0=Math.min(wood.x,lead.x),y0=Math.min(wood.y,lead.y);
  c.width=Math.max(wood.x+wood.w,lead.x+lead.w)-x0;c.height=Math.max(wood.y+wood.h,lead.y+lead.h)-y0;
  const cx=c.getContext('2d');cx.drawImage(wood.img,wood.x-x0,wood.y-y0);cx.drawImage(lead.img,lead.x-x0,lead.y-y0);
  penImg.cone=c;penImg.x0=x0;penImg.y0=y0;
}
function drawPencil(ctx,t){
  const s=penState(t);if(!s)return;
  const k=logoR.k;
  const tipS=[logoR.x+s.tip[0]*k,logoR.y+s.tip[1]*k];
  const write=-.92+Math.sin(t*7.1)*.02; // hand pose: tip down-left
  const sd=smooth(0,.72,s.dock); // pose and size settle first, then the cone glides the last few pixels onto the logo
  const ang=lerp(write,PEN.axis,sd);
  const sc=k*lerp(PHONE?1.75:1.55,1,sd)*(1+s.lift*.1);
  const BL=300, bodyL=BL*(1-eInOut3(smooth(.04,.7,s.dock))), bh=48; // body retracts into the cone like a mechanical pencil
  ctx.save();ctx.translate(tipS[0],tipS[1]);
  // shadow
  if(s.dock<1){
    const sh=(3+s.lift*24)*(1-s.dock), a2=ang+.04+s.lift*.06;
    ctx.save();ctx.rotate(a2);ctx.scale(sc,sc);
    ctx.shadowColor=`rgba(30,20,10,${(.26*(1-s.dock)).toFixed(3)})`;ctx.shadowBlur=(2+s.lift*10)*DPR;
    ctx.shadowOffsetX=(Math.cos(a2)*4000*sc+sh*.55)*DPR;ctx.shadowOffsetY=(Math.sin(a2)*4000*sc+sh*.85)*DPR;
    ctx.translate(-4000,0);
    ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(PEN.coneLen,-bh/2);ctx.lineTo(PEN.coneLen+bodyL+2,-bh/2);ctx.lineTo(PEN.coneLen+bodyL+2,bh/2);ctx.lineTo(PEN.coneLen,bh/2);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  ctx.rotate(ang);ctx.scale(sc,sc);
  // body: hexagonal orange pencil with a metal band and eraser
  if(bodyL>.5){
    ctx.save();ctx.beginPath();ctx.rect(PEN.coneLen-1.5,-bh,BL+20,bh*2);ctx.clip();ctx.translate(bodyL-BL,0);
    const x0=PEN.coneLen-1.5,x1=x0+BL;
    let g=ctx.createLinearGradient(0,-bh/2,0,bh/2);
    g.addColorStop(0,'#F9A25A');g.addColorStop(.32,'#F57A22');g.addColorStop(.36,'#E86E18');g.addColorStop(.66,'#F57A22');g.addColorStop(.7,'#D9620F');g.addColorStop(1,'#C9560B');
    ctx.fillStyle=g;ctx.fillRect(x0,-bh/2,BL,bh);
    {
      const fb=x1-46;g=ctx.createLinearGradient(0,-bh/2,0,bh/2);g.addColorStop(0,'#eef2f5');g.addColorStop(.4,'#aab3bc');g.addColorStop(.6,'#d8dee3');g.addColorStop(1,'#7c858e');
      ctx.fillStyle=g;ctx.fillRect(fb,-bh/2-1,22,bh+2);
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(fb+6,-bh/2-1,2,bh+2);ctx.fillRect(fb+14,-bh/2-1,2,bh+2);
      ctx.fillStyle='#E2246E';ctx.beginPath();ctx.moveTo(fb+22,-bh/2);ctx.lineTo(x1-8,-bh/2);ctx.quadraticCurveTo(x1+2,-bh/2,x1+2,-bh/2+10);ctx.lineTo(x1+2,bh/2-10);ctx.quadraticCurveTo(x1+2,bh/2,x1-8,bh/2);ctx.lineTo(fb+22,bh/2);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(fb+24,-bh/2+4,x1-fb-30,5);
    }
    ctx.restore();
  }
  // cone + lead: exact logo pixels, rotated into the pencil frame
  ctx.save();ctx.rotate(-PEN.axis);ctx.drawImage(penImg.cone,penImg.x0-PEN.tip[0],penImg.y0-PEN.tip[1]);ctx.restore();
  ctx.restore();
}

/* =====================================================================
   DOODLES  (one per competition item, drawn in the logo's monoline style)
   ===================================================================== */
const DOODLES=[
 {id:'speech',c:'#F14F3A',ac:'#4581CB',rot:-8,en:'Speech',ml:'പ്രസംഗം',cats:[0,1,2,3,4],
  d:'M37 21a13 13 0 0 1 26 0v19a13 13 0 0 1-26 0z M25 38v3a25 25 0 0 0 50 0v-3 M50 66v15 M37 86h26',a:'M83 27q6 9 0 18 M92 20q11 16 0 32'},
 {id:'song',c:'#F57A22',ac:'#E2246E',rot:7,en:'Songs & Mappilappattu',ml:'ഗാനങ്ങൾ, മാപ്പിളപ്പാട്ട്',cats:[0,1,2,3,4],
  d:'M39 76V32l40-11v44 M39 76a9 7 0 1 1-18 0a9 7 0 1 1 18 0 M79 65a9 7 0 1 1-18 0a9 7 0 1 1 18 0',a:'M17 10v16 M9 18h16'},
 {id:'photo',c:'#E2246E',ac:'#F57A22',rot:8,en:'Mobile photography',ml:'മൊബൈൽ ഫോട്ടോഗ്രാഫി',cats:[3,4],
  d:'M34 10h32a9 9 0 0 1 9 9v62a9 9 0 0 1-9 9H34a9 9 0 0 1-9-9V19a9 9 0 0 1 9-9z M50 45m-13 0a13 13 0 1 0 26 0a13 13 0 1 0-26 0 M44 78h12 M64 21h.5',a:'M84 13l8-8 M86 26h11'},
 {id:'quran',c:'#308E40',ac:'#F6B731',rot:-5,en:'Tajweed & Hifz',ml:'തജ്‌വീദ്, ഹിഫ്ദ്',cats:[1,2,3,4],
  d:'M50 36c-9-7-21-8-34-4v25c13-3 25-2 34 5c9-7 21-8 34-5V32c-13-4-25-3-34 4z M50 36v26 M31 69l38 21 M69 69L31 90',a:'M50 6v13 M27 12l6 9 M73 12l-6 9'},
 {id:'reel',c:'#F14F3A',ac:'#4581CB',rot:6,en:'Reel making',ml:'റീൽ നിർമാണം',cats:[3,4],
  d:'M14 46h72v36a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z M14 46l66-18-3-12-66 18z M30 28l7 12 M50 22l7 12',a:'M44 57v20l17-10z'},
 {id:'quiz',c:'#F6B731',ac:'#F14F3A',rot:8,en:'Quiz & memory test',ml:'പ്രശ്നോത്തരി',cats:[1,2,3],
  d:'M50 19c-15 0-25 11-25 24c0 11 7 16 11 22v8h28v-8c4-6 11-11 11-22C75 30 65 19 50 19z M39 82h22 M43 91h14 M43 39q0-9 7-9t7 7q0 5-7 9v4 M50 57h.5',a:'M13 31l8 5 M87 31l-8 5 M50 3v7 M24 12l5 7 M76 12l-5 7'},
 {id:'draw',c:'#F6B731',ac:'#F14F3A',rot:0,en:'Drawing & colouring',ml:'ചിത്രരചന, കളറിംഗ്',cats:[0,1,2],
  d:'M32 70L70 32l12 12-38 38-17 5z M64 38l12 12 M27 87l5-17',a:'M20 95q7-8 14 0t14 0t14 0'},
 {id:'story',c:'#4581CB',ac:'#F14F3A',rot:5,en:'Storytelling & rhymes',ml:'കഥ പറയൽ, പാട്ട്',cats:[0,1],
  d:'M12 46c13-6 27-6 38 3c11-9 25-9 38-3v38c-13-6-27-6-38 3c-11-9-25-9-38-3z M50 49v38',a:'M58 8h26a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H72l-8 7v-7h-6a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z'},
 {id:'azan',c:'#2B7D60',ac:'#F57A22',rot:-6,en:'Azan',ml:'ബാങ്ക് വിളി',cats:[2],
  d:'M12 42h14l18-16v48L26 58H12z',a:'M58 40q8 10 0 20 M68 31q15 19 0 38 M78 22q22 28 0 56'},
 {id:'callig',c:'#4F5BA3',ac:'#F57A22',rot:-4,en:'Arabic calligraphy',ml:'അറബിക് കാലിഗ്രാഫി',cats:[4],
  d:'M10 46c3 30 44 32 54 4 M36 26h.5',a:'M68 86L90 16 M68 86l-1 9'},
 {id:'write',c:'#4F5BA3',ac:'#F14F3A',rot:6,en:'Essay, story & poetry writing',ml:'പ്രബന്ധം, കഥ, കവിത രചന',cats:[2,3,4],
  d:'M20 12h36l16 16v58H20z M56 12v16h16 M30 42h32 M30 54h32 M30 66h18',a:'M60 92l26-26 6 6-26 26-9 3z'},
 {id:'poster',c:'#2B7D60',ac:'#F57A22',rot:-6,en:'Digital poster making',ml:'ഡിജിറ്റൽ പോസ്റ്റർ',cats:[4],
  d:'M20 10h60v80H20z M28 62l14-16 10 10 8-8 12 14 M30 78h40',a:'M66 28m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0'},
 {id:'arabic',c:'#4581CB',ac:'#308E40',rot:5,en:'Arabic words & recitation',ml:'അറബി പദകേളി, പദ്യം',cats:[1,2,3],
  d:'M18 18h64a8 8 0 0 1 8 8v36a8 8 0 0 1-8 8H48L32 84V70H18a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z',a:'M31 30v26 M45 44c0 11 30 11 30 0 M60 61h.5'}
];
// positions: [fx, fy, size] — fx of the logo width, fy of the logo height (or of the anchor element's centre when a 4th field names it)
const DPOS_PHONE={speech:[.07,-.27,.2],song:[.5,-.4,.22],photo:[.93,-.27,.2],
  quran:[-.03,0,.18,'kicker'],reel:[1.03,0,.18,'kicker']};
// desktop: two staggered columns either side of the hero, nothing above the logo
const DPOS_DESK={speech:[-.2,.02,.15],song:[-.4,.33,.15],quran:[-.19,.66,.15],draw:[-.39,.98,.14],write:[-.21,1.28,.14],
  photo:[1.2,.02,.15],reel:[1.4,.33,.15],quiz:[1.19,.66,.15],story:[1.39,.98,.14],azan:[1.21,1.28,.14]};
const dEls={};
function buildDoodles(){
  const svg=$('#doodles');svg.innerHTML='';
  const NS='http://www.w3.org/2000/svg';
  DOODLES.forEach((d,i)=>{
    const g=document.createElementNS(NS,'g');g.setAttribute('class','dd');g.dataset.id=d.id;
    const hit=document.createElementNS(NS,'circle');hit.setAttribute('cx',50);hit.setAttribute('cy',50);hit.setAttribute('r',48);hit.style.stroke='none';hit.style.fill='rgba(0,0,0,0)';
    // measure each stroke once, then draw it with a dash on the canvas
    const len=dd=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',dd);svg.appendChild(p);const L=p.getTotalLength();p.remove();return L};
    const p={path:new Path2D(d.d),L:len(d.d)},pa=d.a?{path:new Path2D(d.a),L:len(d.a)}:null;
    g.appendChild(hit);svg.appendChild(g);
    g.addEventListener('pointerdown',e=>{e.stopPropagation();showTip(d,g,e)});
    dEls[d.id]={g,p,pa,d,i,sw:8};
  });
}
function layoutDoodles(){
  const lr=$('#logoWrap').getBoundingClientRect();
  const pos=PHONE?DPOS_PHONE:DPOS_DESK;
  const anchor={};
  for(const id of ['kicker']){const el=$('#'+id),tf=el.style.transform;el.style.transform='none';const r=el.getBoundingClientRect();anchor[id]=r.top+r.height/2;el.style.transform=tf}
  let k=0;
  for(const id in dEls){
    const e=dEls[id],p=pos[id];
    if(!p||!p[2]){e.on=false;e.g.style.display='none';continue}
    e.on=true;e.g.style.display='';
    const size=p[2]*lr.width;e.size=size;
    const cy=p[3]?anchor[p[3]]+p[1]*lr.height:lr.top+p[1]*lr.height;
    e.x=lr.left+p[0]*lr.width-size/2;e.y=cy-size/2;
    const sw=(PHONE?8.6:8)*Math.min(1,62/size)**.35; // a touch heavier when small, never thinner than ~5px
    e.sw=sw;
    e.order=k++;
  }
}
function doodleBounds(){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const id in dEls){const e=dEls[id];if(!e.on)continue;x0=Math.min(x0,e.x);y0=Math.min(y0,e.y);x1=Math.max(x1,e.x+e.size);y1=Math.max(y1,e.y+e.size)}
  return{x0,y0,x1,y1};
}
function renderDoodles(t,ctx){
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const id in dEls){
    const e=dEls[id];if(!e.on)continue;
    const st=TL.doodle+e.order*.09, dp=eOut3(seg(t,st,st+.6)), da=eOut3(seg(t,st+.42,st+.8));
    if(e.vis!==dp>0){e.vis=dp>0;e.g.style.visibility=e.vis?'visible':'hidden'} // tap target only once it is drawn
    // idle motion tied to each item
    let dx=0,dy=0,rot=e.d.rot||0,sc=1;
    if(dp>=1){const tt=t-st-.6;
      switch(id){
        case'speech':dy=-Math.abs(Math.sin(tt*2.2))*3;break;
        case'song':rot+=Math.sin(tt*1.6)*5;dy=-Math.abs(Math.sin(tt*1.6))*2;break;
        case'azan':sc=1+Math.max(0,Math.sin(tt*2.4))*.04;break;
        case'photo':rot+=Math.sin(tt*1.1)*3;break;
        case'reel':rot+=Math.sin(tt*1.3+1)*3;break;
        case'quiz':sc=1+Math.sin(tt*2)*.03;break;
        default:dy=Math.sin(tt*1.4+e.i)*2.5;rot+=Math.sin(tt*1.1+e.i)*2.5;
      }
    }else{sc=.72+.28*eBack(dp);rot+=(1-dp)*-10}
    let ex=e.x,ey=e.y;
    if(DTW&&e.ox!=null){const u=seg(performance.now(),DTW.t0,DTW.t0+DTW.dur),k=1-Math.pow(1-u,3.2);ex=lerp(e.ox,e.x,k);ey=lerp(e.oy,e.y,k)}
    const s=e.size/100*sc, cxp=ex+e.size/2, cyp=ey+e.size/2;
    e.g.setAttribute('transform',`translate(${(cxp+dx).toFixed(2)} ${(cyp+dy).toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s.toFixed(4)}) translate(-50 -50)`);
    if(dp<=0)continue;
    ctx.save();ctx.translate(cxp+dx,cyp+dy);ctx.rotate(rot*Math.PI/180);ctx.scale(s,s);ctx.translate(-50,-50);
    const draw=(q,col,w,k)=>{if(!q||k<=0)return;ctx.strokeStyle=col;ctx.lineWidth=w;
      if(k<1){ctx.setLineDash([q.L,q.L+1]);ctx.lineDashOffset=q.L*(1-k)}else ctx.setLineDash([]);ctx.stroke(q.path)};
    draw(e.p,e.d.c,e.sw,dp);draw(e.pa,e.d.ac,e.sw*.92,da);
    ctx.restore();
  }
  ctx.setLineDash([]);
}
const tipEl=$('#tip');let tipFor=null,tipClosedBy=null;
const HOVER=matchMedia('(hover:hover) and (pointer:fine)').matches;
// any press outside the open pop-up closes it, and that same press is used up (no splat, no other pop-up)
document.addEventListener('pointerdown',e=>{
  if(!tipFor||tipEl.contains(e.target))return;
  const onSame=e.target.closest&&e.target.closest('.dd')&&e.target.closest('.dd').dataset.id===tipFor;
  hideTip();tipClosedBy=e.timeStamp;
  if(!onSame&&!e.target.closest('.hit'))e.stopPropagation();
},true);
function showTip(d,g,ev){
  if(ev&&tipClosedBy===ev.timeStamp)return; // this press just closed a pop-up
  tipFor=d.id;
  const cats=d.cats.map(i=>CAT[LANG][i]).join(' · ');
  tipEl.innerHTML=`<b>${d[LANG]}</b><span>${cats}</span><a href="${regHref()}" class="hit" id="tipReg">${T[LANG].regShort}</a><small>${T[LANG][HOVER?'clickClose':'tapClose']}</small>`;
  const r=g.getBoundingClientRect();
  tipEl.classList.add('on');
  const tw=tipEl.offsetWidth,th=tipEl.offsetHeight;
  let x=r.left+r.width/2-tw/2,y=r.bottom+8;if(y+th>H-10)y=r.top-th-8;
  tipEl.style.left=clamp(x,10,W-tw-10)+'px';tipEl.style.top=clamp(y,10,H-th-10)+'px';
  $('#tipReg').onclick=e=>{e.preventDefault();openSheet()};
}
function hideTip(){tipFor=null;tipEl.classList.remove('on')}

/* =====================================================================
   SOUND  (synthesised, opt-in)
   ===================================================================== */
let AC=null,soundOn=false,brushNoise=null,penNoise=null;
function noiseBuf(){const b=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function soundInit(){
  AC=new (window.AudioContext||window.webkitAudioContext)();const nb=noiseBuf();
  const loop=(type,f,q)=>{const s=AC.createBufferSource();s.buffer=nb;s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=AC.createGain();g.gain.value=0;s.connect(fl).connect(g).connect(AC.destination);s.start();return{g,fl}};
  brushNoise=loop('bandpass',900,.8);penNoise=loop('highpass',3200,.7);
  AC._nb=nb;
}
function sfxSplat(big){
  if(!soundOn||!AC)return;const t=AC.currentTime;
  const s=AC.createBufferSource();s.buffer=AC._nb;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(big?2400:3200,t);f.frequency.exponentialRampToValueAtTime(260,t+.18);
  const g=AC.createGain();g.gain.setValueAtTime(big?.55:.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.28);s.connect(f).connect(g).connect(AC.destination);s.start(t,Math.random());s.stop(t+.3);
  const o=AC.createOscillator();o.frequency.setValueAtTime(big?120:170,t);o.frequency.exponentialRampToValueAtTime(48,t+.15);const og=AC.createGain();og.gain.setValueAtTime(big?.5:.2,t);og.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(og).connect(AC.destination);o.start(t);o.stop(t+.22);
}
function sfxChime(){
  if(!soundOn||!AC)return;const t=AC.currentTime;
  [784,988,1175,1568].forEach((f,i)=>{const o=AC.createOscillator();o.type='sine';o.frequency.value=f;const g=AC.createGain();const st=t+i*.07;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.12,st+.01);g.gain.exponentialRampToValueAtTime(.001,st+1.2);o.connect(g).connect(AC.destination);o.start(st);o.stop(st+1.25)});
}
function sfxUpdate(brushAmt,penAmt){
  if(!AC)return;const t=AC.currentTime;
  brushNoise.g.gain.setTargetAtTime(soundOn?brushAmt*.22:0,t,.03);brushNoise.fl.frequency.setTargetAtTime(600+brushAmt*900,t,.05);
  penNoise.g.gain.setTargetAtTime(soundOn?penAmt*.07:0,t,.02);
}
$('#snd').onclick=()=>{
  if(!AC)soundInit();AC.resume();soundOn=!soundOn;$('#snd').setAttribute('aria-pressed',soundOn);
  $('#sndOn').setAttribute('opacity',soundOn?1:0);$('#sndOff').setAttribute('opacity',soundOn?0:1);askTilt();
};

/* =====================================================================
   HITS: shake + haptics + sound
   ===================================================================== */
let shake=[];
function onHeroHit(s){shake.push({t0:s.t0,amp:(PHONE?5:7)*(s.tap?.35:1)});sfxSplat(!s.tap);if(!CAPTURE&&navigator.vibrate&&navigator.userActivation&&navigator.userActivation.hasBeenActive)try{navigator.vibrate(14)}catch(e){}}
// paint balloons: thrown from the viewer's side, they arc toward the wall, shrinking with distance,
// cast a shadow that sharpens as they near the wall, then burst into the splat
let balloons=[],shreds=[];
function addBalloon(s,dur,from){
  const r=rng((s.seed*1e9)|0);
  // start below the screen, offset outward so balloons fan in from the thrower
  const sx=from?from[0]:s.x+(s.x-W*.5)*.55+(r()-.5)*W*.12, sy=from?from[1]:H+s.R*.5;
  const lift=Math.min(H*.22,Math.abs(sy-s.y)*.35+40);
  balloons.push({s,T0:s.t0-dur,T1:s.t0,sx,sy,cx:lerp(sx,s.x,.55)+(r()-.5)*W*.08,cy:Math.min(sy,s.y)-lift,
    r1:s.R*.24,r0:s.R*(s.hero?.62:.5)+(PHONE?12:16),spin:r()*6.28,spinV:(r()-.5)*7,ph:r()*20,col:s.col,seed:r()});
}
function bezPt(b,u){const v=1-u;return[v*v*b.sx+2*v*u*b.cx+u*u*b.s.x,v*v*b.sy+2*v*u*b.cy+u*u*b.s.y]}
function burst(b){return; // eslint-disable-line no-unreachable
 // latex shreds + a pop ring, drawn on the fx layer
  const r=rng((b.seed*7e8)|0),n=b.s.hero?4:3;
  for(let i=0;i<n;i++){const a=(i+r()*.9)/n*6.283,sp=b.s.R*(3.6+r()*2.6);
    shreds.push({x:b.s.x+Math.cos(a)*b.r1,y:b.s.y+Math.sin(a)*b.r1,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-b.s.R*.6,
      rot:a,vr:(r()-.5)*22,len:b.r1*(.45+r()*.4),w:Math.max(3,b.r1*.16),t0:b.T1,col:b.col.map(v=>Math.min(1,v*1.12+.05))})}
}
function drawBalloons(ctx,t){
  for(const b of balloons){
    if(t<b.T0||t>=b.T1){if(t>=b.T1&&!b.burst){b.burst=true;burst(b)}continue}
    const u=(t-b.T0)/(b.T1-b.T0);
    const e=1-Math.pow(1-u,1.45);               // fast off the hand, slowing as it recedes
    const [x,y]=bezPt(b,e),[x2,y2]=bezPt(b,Math.min(1,e+.02));
    const z=Math.pow(e,.9), sq=smooth(.86,1,u); // depth 0..1, squash against the wall in the last frames
    const r=lerp(b.r0,b.r1,z)*(1+.18*sq);
    const vx=x2-x,vy=y2-y,ang=Math.atan2(vy,vx),spd=Math.min(1,Math.hypot(vx,vy)/(b.r0*.25));
    const st=(1+.16*spd*(1-sq))*(1-.1*sq), sp=1/Math.sqrt(st)*(1+.12*sq);
    const ph=b.ph+t*21, sh=(1-z);
    // shadow on the wall: far and soft when near the viewer, tight and dark at impact
    const so=b.s.R*.55*sh, sr=r*(1+1.4*sh), sa=.05+.2*z;
    let g=ctx.createRadialGradient(x+so*.55,y+so*.9,0,x+so*.55,y+so*.9,sr);
    g.addColorStop(0,`rgba(40,25,10,${sa.toFixed(3)})`);g.addColorStop(1,'rgba(40,25,10,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+so*.55,y+so*.9,sr,0,6.283);ctx.fill();
    ctx.save();ctx.translate(x,y);
    // body: a jiggling latex ellipse, stretched along its flight
    ctx.rotate(ang);ctx.scale(st,sp);
    ctx.beginPath();
    for(let i=0;i<=48;i++){const a=i/48*6.283;
      const rr=r*(1+.045*Math.sin(2*a+ph)+.025*Math.sin(3*a-ph*1.37)+.012*Math.sin(5*a+ph*.8));
      i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}
    ctx.closePath();
    ctx.scale(1/st,1/sp);ctx.rotate(-ang); // light is fixed on screen: top-left
    g=ctx.createRadialGradient(-r*.32,-r*.38,r*.04,0,0,r*1.12);
    g.addColorStop(0,rgbStr(b.col.map(v=>Math.min(1,v*1.15+.2)),1));g.addColorStop(.5,rgbStr(b.col,1));g.addColorStop(1,rgbStr(b.col.map(v=>v*.55),1));
    ctx.fillStyle=g;ctx.fill();
    // knot at the back, turning slowly as the balloon spins
    const ka=b.spin+b.spinV*(t-b.T0), kx=Math.cos(ka)*r*.97, ky=Math.sin(ka)*r*.97*.8;
    if(ky>-r*.2){ctx.fillStyle=rgbStr(b.col.map(v=>v*.7),1);ctx.beginPath();ctx.ellipse(kx,ky,r*.12,r*.08,ka,0,6.283);ctx.fill()}
    // gloss: a soft window highlight and a rim light
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(-r*.38,-r*.44,r*.2,r*.1,-.66,0,6.283);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(-r*.12,-r*.6,r*.07,r*.04,-.4,0,6.283);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=Math.max(1,r*.05);ctx.beginPath();ctx.arc(0,0,r*.86,.35,1.35);ctx.stroke();
    ctx.restore();
  }
  // burst bits
  for(let i=shreds.length-1;i>=0;i--){const q=shreds[i],a=t-q.t0;
    if(a<0)continue;
    const k=a/.26;if(k>=1){shreds.splice(i,1);continue}
    const x=q.x+q.vx*a*(1-.4*k),y=q.y+q.vy*a*(1-.4*k)+700*a*a;
    ctx.save();ctx.translate(x,y);ctx.rotate(q.rot+q.vr*a);ctx.globalAlpha=1-k*k;
    ctx.strokeStyle=rgbStr(q.col,1);ctx.lineWidth=q.w*(1-.4*k);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(0,q.len,q.len,-1.9,-1.25);ctx.stroke();ctx.restore();
  }
  ctx.globalAlpha=1;
}
/* =====================================================================
   FX canvas
   ===================================================================== */
const fx=$('#fx'),fctx=fx.getContext('2d');
function sizeFx(){fx.width=Math.round(W*DPR);fx.height=Math.round(H*DPR)}

/* =====================================================================
   FRAME
   ===================================================================== */
let clock=0,lastSim=0,brushPrev=null;
const SIMDT=1/60;
function contactAt(p,b,o,ridge){ // is the bristle at lateral offset o (-.5 left .. .5 right) on the wall here
  const Lp=Math.abs(p.yb-p.ya),dir=p.yb>p.ya?1:-1,v=(b.y-p.ya)*dir;
  const lo=(p.sa*o+Math.abs(p.sa)*.5)*bw, hi=Lp-(p.sb*o+Math.abs(p.sb)*.5)*bw;
  if(!ridge)return seg(v,lo-4,lo+10)*(1-seg(v,hi-bw*.3,hi-bw*.08));
  const inner=o<0?p.i>0:p.i<p.n-1;
  return seg(v,lo+bw*.12,lo+bw*.35)*(1-seg(v,hi-bw*.4,hi-bw*.18))*(inner?.35:1);
}
function simStep(st){ // fixed-step brush physics on the paint layer, same live and in capture
  const b=brushAt(st);
  if(b&&b.press>.02&&brushPrev&&brushPrev.press>.02){
    const p=passes[b.pass];updateCarry(b,st);
    smudge(brushPrev,b,b.press*(p?contactAt(p,b,0):1),p?p.seed:0,st,b.press*(p?contactAt(p,b,-.5,1):1),b.press*(p?contactAt(p,b,.5,1):1));
  }
  if(b&&b.press>.3)bState.load=Math.min(1,bState.load+SIMDT*1.8);
  brushPrev=b;
}
function simulateTo(t){
  let steps=0;
  while(lastSim+SIMDT<=t&&steps<8){const st=lastSim+SIMDT;simStep(st);lastSim=st;steps++}
  if(lastSim+SIMDT<=t)lastSim=t; // drop backlog if the device is slow
}
const ui={kick:$('#kicker'),meta:$('#meta'),cta:$('#cta'),badge:$('#badge'),lang:$('#lang'),snd:$('#snd'),skip:$('#skip'),reg:$('#reg')};
let chimed=false;
function frame(t){
  clock=t;
  let src=null;
  if(FL){
    simulateTo(t);
    if(t>=TL.brushStart&&!baked)paintMaskTo(Math.min(t,TL.brushEnd+.05));
    updateClr();
    src=paintFrame(t);
  }
  // light follows tilt / pointer, with a slow drift so the gloss reads as wet
  light.x=lerp(light.x,light.tx+Math.sin(t*.35)*.05,.06);light.y=lerp(light.y,light.ty+Math.cos(t*.28)*.04,.06);
  let sx=0,sy=0,sa=0;for(const s of shake){const a=t-s.t0;if(a>0&&a<.28){const k=(1-a/.28);sx+=Math.sin(a*95)*s.amp*k;sy+=Math.cos(a*83)*s.amp*k;sa+=s.amp*k}}
  // zoom in just enough that the shifted wall still covers every edge (no page background peeking through)
  const zk=1+2*(sa+1.5)/Math.min(W,H);
  cv.style.transform=sa>0?`translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px) scale(${zk.toFixed(4)})`:'';
  if(FL)glRender(t,src);
  // fx layer: flying drops, brush, pencil
  fctx.setTransform(1,0,0,1,0,0);fctx.clearRect(0,0,fx.width,fx.height);fctx.setTransform(DPR,0,0,DPR,sx*DPR,sy*DPR);
  drawBalloons(fctx,t);
  const b=introSkipped||brushHidden?null:brushAt(t);if(b){b.lean=passes[b.pass]?passes[b.pass].lean:0;drawBrush(fctx,b,t)}
  fctx.setTransform(DPR,0,0,DPR,0,0);
  logoRender(t);
  if(LG.ready)drawPencil(fctx,t);
  renderDoodles(t,fctx);
  // ui
  const up=(el,a)=>{const x=eOut3(seg(t,a,a+.55));el.style.opacity=x;el.style.transform=`translateY(${((1-x)*16).toFixed(2)}px)`};
  up(ui.kick,TL.kicker);up(ui.meta,TL.meta);up(ui.cta,TL.cta);
  const tp=eOut3(seg(t,TL.ui,TL.ui+.5));[ui.badge,ui.lang].forEach(e=>{e.style.opacity=tp;e.style.transform=`translateY(${((1-tp)*-12).toFixed(2)}px)`});
  ui.snd.style.opacity=CAPTURE?0:Math.max(seg(t,.3,.8)*(1-seg(t,TL.ui-.3,TL.ui))*.9,tp);
  ui.skip.style.opacity=CAPTURE?0:1-seg(t,TL.dock-.2,TL.dock+.2);ui.skip.style.pointerEvents=t<TL.dock?'auto':'none';
  if(t>TL.cta+1.2){const ph=(t-TL.cta)%4.5;const w=ph<.55?Math.sin(ph/.55*Math.PI*3)*(1-ph/.55)*2.6:0;ui.reg.style.rotate=w.toFixed(2)+'deg'}
  if(!chimed&&t>TL.dock){chimed=true;sfxChime()}
  if(AC){const ps=penState(t);sfxUpdate(b?b.press*Math.min(1,Math.abs(bState.vy)/900):0,ps&&ps.writing?1:0)}
}

/* =====================================================================
   LOOP / INTERACTION
   ===================================================================== */
let start=0,running=true,lastNow=0,slowFrames=0,frames=0,wakeUntil=0;
function loop(now){
  if(!running)return;
  let t=(now-start)/1000;
  if(t>TL.logoDone+2&&t>wakeUntil&&!DTW&&now-lastNow<30){requestAnimationFrame(loop);return} // idle at ~30fps
  const dt=now-lastNow;lastNow=now;
  if(t>.25&&t<8){frames++;if(dt>34)slowFrames++;if(frames%24===0&&slowFrames>frames*.35&&QUAL>.55){QUAL=QUAL>.8?.75:.55;/* keep sim, lighten display */const sc=Math.min(DPR,PHONE?1.5:1.25)*QUAL;cv.width=Math.round(W*sc);cv.height=Math.round(H*sc);frames=slowFrames=0}}
  frame(t);requestAnimationFrame(loop);
}
function skipTo(target){
  // jump to a later moment: paint finished, brush done
  start=performance.now()-target*1000;
  if(FL)finishPaint(target);
  shake=[];balloons=balloons.filter(b=>b.s.tap&&b.T1>target);shreds=[];
}
$('#skip').onclick=()=>{skipTo(Math.max(clock,TL.logoDone+.2));try{localStorage.setItem('sg-seen','1')}catch(e){}};
// tap the wall after the intro: a fresh splat
cv.addEventListener('pointerdown',e=>{
  hideTip();askTilt();
  if(!FL||!baked)return;
  const r=rng((Math.random()*1e9)|0),cols=Object.values(PAL);
  const now=(performance.now()-start)/1000, fly=.24;
  const s=makeSplat(r,e.clientX,e.clientY,Math.min(W,H)*(.07+r()*.05),hex(cols[(r()*cols.length)|0]),now+fly,false);
  s.useClr=false;s.tap=true;items.push(s);
  addBalloon(s,fly,[e.clientX+(e.clientX-W*.5)*.5+(r()-.5)*60,H+s.R*.8]);wakeUntil=Math.max(wakeUntil,now+fly+1.2);
  for(let k=0;k<7;k++){const d=makeDrop(r,s,false);d.useClr=false;items.push(d)}
  for(let k=0;k<10;k++){const d=makeDrop(r,s,true);d.useClr=false;items.push(d)}
  items.sort((a,b)=>a.t0-b.t0);
});
// smear wet paint with a finger after the intro
let dragPrev=null;
cv.addEventListener('pointermove',e=>{
  if(!FL||!baked||clock<TL.logoDone){dragPrev=null;return}
  if(e.buttons!==1&&e.pointerType!=='touch'){dragPrev=null;
    // desktop: light follows mouse
    light.tx=-.42+(e.clientX/W-.5)*.9;light.ty=.55-(e.clientY/H-.5)*.7;return}
  const p={x:e.clientX,y:e.clientY};
  if(dragPrev&&Math.abs(p.x-dragPrev.x)+Math.abs(p.y-dragPrev.y)>1)fingerSmudge(dragPrev,p);
  wakeUntil=Math.max(wakeUntil,clock+.4);
  dragPrev=p;
});
cv.addEventListener('pointerup',()=>dragPrev=null);
let tiltAsked=false;
function askTilt(){
  if(tiltAsked)return;tiltAsked=true;
  const on=()=>addEventListener('deviceorientation',ev=>{if(ev.gamma==null)return;light.tx=-.42+clamp(ev.gamma/35,-1,1)*.55;light.ty=.55-clamp((ev.beta-45)/35,-1,1)*.45});
  if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(s=>{if(s==='granted')on()}).catch(()=>{})}else on();
}
// Register goes to the Artist Pass form, in the language picked here
const REGISTER_URL='register.html';
function regHref(){return REGISTER_URL+'?lang='+LANG}
function openSheet(){hideTip();
  if(REGISTER_URL){document.body.style.transition='opacity .22s';document.body.style.opacity='0';setTimeout(()=>{location.href=regHref()},200);return}
  $('#sheet').classList.add('open')}
$('#reg').onclick=e=>{e.preventDefault();openSheet()};
$('#sheetClose').onclick=()=>$('#sheet').classList.remove('open');
addEventListener('pageshow',e=>{if(e.persisted)document.body.style.opacity='1'}); // back button from the form
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false}else if(!running){running=true;start=performance.now()-clock*1000;requestAnimationFrame(loop)}});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{
  const oldW=W,oldH=H;W=innerWidth;H=innerHeight;PHONE=W<760;
  if(Math.abs(oldW-W)<2&&Math.abs(oldH-H)<120){relayout(true);return} // mobile URL bar
  sizeFx();if(FL){glSize();buildSplats();brushPrev=null;lastSim=0}
  relayout(false);scheduleWriting();sizeMask();
  if(FL)finishPaint(clock);
},150)});

/* =====================================================================
   BOOT
   ===================================================================== */
async function boot(){
  try{const l=QS.get('lang')||localStorage.getItem('sg-lang');if(l==='ml'||l==='en')LANG=l}catch(e){}
  if(LANG!=='en'){document.documentElement.lang=LANG;document.querySelectorAll('[data-i18n]').forEach(e=>e.innerHTML=T[LANG][e.dataset.i18n]);document.querySelectorAll('#lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===LANG))}
  buildDoodles();pillIndicator();
  setBrushTimes();
  const ok=glInit();
  if(ok){glSize();glWarm()}else{cv.style.background='radial-gradient(circle at 20% 15%,#E2246E 0 20%,transparent 21%),radial-gradient(circle at 85% 18%,#4581CB 0 22%,transparent 23%),radial-gradient(circle at 15% 85%,#308E40 0 22%,transparent 23%),radial-gradient(circle at 85% 88%,#F14F3A 0 22%,transparent 23%),radial-gradient(circle at 50% 40%,#F57A22 0 30%,transparent 31%),#F4EFE6'}
  sizeFx();buildSplats();
  await Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(r=>setTimeout(r,1500))]);
  relayout(false);sizeMask();
  await logoInit();await penInit();
  let seen=false;try{seen=localStorage.getItem('sg-seen')==='1'}catch(e){}
  if(QS.has('first'))seen=false;
  if(CAPTURE){window.__dbg={penState,TL,R:()=>logoR,WS:()=>WS,relayout,applyLang};window.__frame=t=>frame(t);window.__ready=true;window.__TL=TL;return}
  if(REDUCED){skipTo(TL.logoDone+.3)}
  else if(seen){ // returning visitor: paint already there, quicker write-on
    SPEED=1.6;TL.penIn=.25;brushHidden=true;scheduleWriting();skipTo(.01);
  } else start=performance.now();
  try{localStorage.setItem('sg-seen','1')}catch(e){}
  requestAnimationFrame(loop);
}
boot();
})();
