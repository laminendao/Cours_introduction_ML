'use strict';
// ============================================================
//  ANIMATIONS — NFE212 · Modélisation Prédictive
// ============================================================

const C = {
  red:'#C8102E', redPale:'#fdf2f4', orange:'#FF7900',
  dark:'#1a1a2e', green:'#00824e', muted:'#6b6b80',
  gray:'#f5f5f7', gray2:'#e8e8ee', white:'#ffffff'
};

function ease(t){ return t<.5 ? 2*t*t : -1+(4-2*t)*t; }
function sigmoid(z){ return 1/(1+Math.exp(-z)); }
function setActive(aId, bId){
  document.getElementById(aId)?.classList.add('active');
  document.getElementById(bId)?.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', ()=>{
  initSidebar();
  initVarTypeAnim();
  initChartGuide();
  initSigmoidAnim();
  initBoundaryAnim();
  initGradientDescentAnim();
});

// ── 0. SIDEBAR ────────────────────────────────────────────────
function initSidebar(){
  const sidebar  = document.getElementById('sidebar');
  const toggle   = document.getElementById('sidebar-toggle');
  const overlay  = document.getElementById('sidebar-overlay');
  if(!sidebar) return;

  // ── Collapsible sections ─────────────────────
  const items = sidebar.querySelectorAll('.sidebar-item.has-sub');
  items.forEach(item=>{
    const btn = item.querySelector('.sidebar-link');
    btn.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      // Collapse all, then open the clicked one if it was closed
      items.forEach(i=>i.classList.remove('open'));
      if(!isOpen) item.classList.add('open');
      // Navigate to section
      const href = btn.dataset.href;
      if(href){
        const target = document.querySelector(href);
        target?.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  // Open the first section by default
  items[0]?.classList.add('open');

  // ── Mobile hamburger ─────────────────────────
  function openSidebar(){
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
  function closeSidebar(){
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }
  toggle?.addEventListener('click', ()=>{
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  overlay?.addEventListener('click', closeSidebar);

  // Close on sublink click (mobile)
  sidebar.querySelectorAll('.sidebar-sublink').forEach(a=>{
    a.addEventListener('click', ()=>{ if(window.innerWidth<=900) closeSidebar(); });
  });

  // ── Active state via IntersectionObserver ────
  const toc = document.getElementById('toc');

  // Watch sections (h2 level) → activate sidebar item + TOC section link
  const sectionObs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const id = e.target.id;
      // Sidebar
      items.forEach(item=>item.classList.remove('active'));
      const btn = sidebar.querySelector(`.sidebar-link[data-href="#${id}"]`);
      const item = btn?.closest('.sidebar-item');
      if(item){
        item.classList.add('active');
        if(!item.classList.contains('open')){
          items.forEach(i=>i.classList.remove('open'));
          item.classList.add('open');
        }
      }
      // Right TOC
      toc?.querySelectorAll('.toc-section-link').forEach(a=>a.classList.remove('active'));
      toc?.querySelector(`.toc-section-link[href="#${id}"]`)?.classList.add('active');
    });
  }, {rootMargin:'-5% 0px -75% 0px'});

  document.querySelectorAll('section[id]').forEach(s=>sectionObs.observe(s));

  // Watch subsections (h3 level) → activate sidebar sublink + TOC sublink
  const subObs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const id = e.target.id;
      // Sidebar
      sidebar.querySelectorAll('.sidebar-sublink').forEach(a=>a.classList.remove('active'));
      sidebar.querySelector(`.sidebar-sublink[href="#${id}"]`)?.classList.add('active');
      // Right TOC
      toc?.querySelectorAll('.toc-sublink').forEach(a=>a.classList.remove('active'));
      toc?.querySelector(`.toc-sublink[href="#${id}"]`)?.classList.add('active');
    });
  }, {rootMargin:'-5% 0px -75% 0px'});

  document.querySelectorAll('h3[id]').forEach(h=>subObs.observe(h));
}

// ── 1. TYPE DE VARIABLE ──────────────────────────────────────
function initVarTypeAnim(){
  const canvas = document.getElementById('anim-vartype-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let mode='quanti', progress=1, raf=null;

  // Histogram bins (bell-shaped)
  const bins=[.01,.03,.07,.14,.22,.34,.47,.61,.74,.85,.93,.98,1,.98,.93,.85,.74,.61,.47,.34,.22,.14,.07,.03,.01];
  // Qualitative categories
  const cats=[
    {l:'CDI',   v:.45, c:C.green},
    {l:'CDD',   v:.27, c:C.orange},
    {l:'Indép.',v:.16, c:C.red},
    {l:'Autre', v:.12, c:C.dark},
  ];

  function resize(){
    canvas.width  = Math.min(canvas.parentElement.getBoundingClientRect().width, 680);
    canvas.height = 220;
    draw(progress);
  }

  function drawQuanti(p){
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const ml=52,mr=20,mt=36,mb=48, w=W-ml-mr, h=H-mt-mb;

    ctx.fillStyle=C.dark; ctx.font='bold 12px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText('Distribution du salaire mensuel — Variable quantitative continue',W/2,20);

    // Axes
    ctx.strokeStyle=C.dark; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(ml,mt); ctx.lineTo(ml,mt+h); ctx.lineTo(ml+w,mt+h); ctx.stroke();

    // Bars
    const bw=w/bins.length;
    bins.forEach((v,i)=>{
      const bh=v*(h-4)*p;
      ctx.fillStyle=C.red+'bb';
      ctx.fillRect(ml+i*bw+1, mt+h-bh, bw-2, bh);
    });

    // Density curve
    if(p>.5){
      const a=Math.min(1,(p-.5)/.5);
      ctx.save(); ctx.globalAlpha=a;
      ctx.beginPath(); ctx.strokeStyle=C.dark; ctx.lineWidth=2.5;
      for(let i=0;i<=w;i++){
        const t=(i/w-.5)*6, y=Math.exp(-t*t/2);
        const px=ml+i, py=mt+h-y*(h-4);
        i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
      }
      ctx.stroke(); ctx.restore();
    }

    // X labels
    ctx.fillStyle=C.muted; ctx.font='11px "DM Sans",sans-serif'; ctx.textAlign='center';
    ['1 500€','2 500€','3 500€','4 500€','5 500€'].forEach((l,i)=>
      ctx.fillText(l, ml+i*w/4+w/8, mt+h+16)
    );
    ctx.fillText('Salaire mensuel (€)', W/2, mt+h+34);
    ctx.save(); ctx.translate(14,mt+h/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign='center'; ctx.fillStyle=C.muted; ctx.fillText('Effectifs',0,0); ctx.restore();
  }

  function drawBarPie(p){
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);

    ctx.fillStyle=C.dark; ctx.font='bold 12px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText('Répartition par statut professionnel — Variable qualitative nominale',W/2,20);

    // Bar chart (left half)
    const ml=30,mt=36,mb=48,bw=36,gap=14;
    const chartH=H-mt-mb;
    const axW=ml+cats.length*(bw+gap);

    ctx.strokeStyle=C.dark; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(ml,mt); ctx.lineTo(ml,mt+chartH); ctx.lineTo(axW,mt+chartH); ctx.stroke();

    cats.forEach((cat,i)=>{
      const bh=cat.v*chartH*p;
      const bx=ml+i*(bw+gap)+8;
      ctx.fillStyle=cat.c+'cc';
      ctx.fillRect(bx, mt+chartH-bh, bw, bh);
      ctx.fillStyle=C.muted; ctx.font='10px "DM Sans",sans-serif'; ctx.textAlign='center';
      ctx.fillText(cat.l, bx+bw/2, mt+chartH+16);
      if(p>.7){
        ctx.fillStyle=C.dark; ctx.font='bold 10px "DM Sans",sans-serif';
        ctx.fillText(Math.round(cat.v*100)+'%', bx+bw/2, mt+chartH-bh-4);
      }
    });

    // Pie chart (right half)
    const cx=W*3/4, cy=H/2+6, r=Math.min(chartH/2-8, 68)*p;
    let angle=-Math.PI/2;
    cats.forEach(cat=>{
      const sl=cat.v*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,angle,angle+sl); ctx.closePath();
      ctx.fillStyle=cat.c+'dd'; ctx.fill();
      ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
      if(p>.85){
        const ma=angle+sl/2;
        const lx=cx+(r+16)*Math.cos(ma), ly=cy+(r+16)*Math.sin(ma);
        ctx.fillStyle=C.dark; ctx.font='bold 10px "DM Sans",sans-serif'; ctx.textAlign='center';
        ctx.fillText(cat.l+' '+Math.round(cat.v*100)+'%', lx, ly);
      }
      angle+=sl;
    });
  }

  function draw(p){
    if(mode==='quanti') drawQuanti(p); else drawBarPie(p);
  }

  function animate(newMode){
    if(raf) cancelAnimationFrame(raf);
    mode=newMode; progress=0;
    function step(){
      progress=Math.min(1, progress+0.04);
      draw(ease(progress));
      if(progress<1) raf=requestAnimationFrame(step);
    }
    step();
  }

  document.getElementById('btn-vt-quanti')?.addEventListener('click',()=>{
    setActive('btn-vt-quanti','btn-vt-quali'); animate('quanti');
  });
  document.getElementById('btn-vt-quali')?.addEventListener('click',()=>{
    setActive('btn-vt-quali','btn-vt-quanti'); animate('quali');
  });

  window.addEventListener('resize', resize);
  resize();
}

// ── 2. SIGMOID INTERACTIF ───────────────────────────────────
function initSigmoidAnim(){
  const canvas=document.getElementById('anim-sigmoid-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const slider=document.getElementById('anim-sigmoid-z');
  const zVal=document.getElementById('anim-sigmoid-zval');
  const probEl=document.getElementById('anim-sigmoid-prob');
  const decEl=document.getElementById('anim-sigmoid-dec');

  function resize(){
    canvas.width=Math.min(canvas.parentElement.getBoundingClientRect().width,600);
    canvas.height=200; draw();
  }

  function draw(){
    const z=parseFloat(slider.value), p=sigmoid(z);
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const ml=50,mr=20,mt=20,mb=40, w=W-ml-mr, h=H-mt-mb;

    // Grid lines
    [0,.25,.5,.75,1].forEach(v=>{
      const py=mt+(1-v)*h;
      ctx.strokeStyle=v===.5 ? C.orange+'55' : C.gray2;
      ctx.lineWidth=v===.5?1.5:1; ctx.setLineDash(v===.5?[5,4]:[]);
      ctx.beginPath(); ctx.moveTo(ml,py); ctx.lineTo(ml+w,py); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Sigmoid curve — fill under curve colored by decision
    ctx.beginPath();
    for(let i=0;i<=w;i++){
      const zv=(i/w-.5)*14, sig=sigmoid(zv);
      const px=ml+i, py=mt+(1-sig)*h;
      i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.lineTo(ml+w,mt+h); ctx.lineTo(ml,mt+h); ctx.closePath();
    const grad=ctx.createLinearGradient(ml,0,ml+w,0);
    grad.addColorStop(0,C.green+'33'); grad.addColorStop(.5,C.orange+'22'); grad.addColorStop(1,C.red+'33');
    ctx.fillStyle=grad; ctx.fill();

    // Sigmoid curve line
    ctx.beginPath(); ctx.strokeStyle=C.red; ctx.lineWidth=2.5;
    for(let i=0;i<=w;i++){
      const zv=(i/w-.5)*14, sig=sigmoid(zv);
      const px=ml+i, py=mt+(1-sig)*h;
      i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle=C.dark; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(ml,mt); ctx.lineTo(ml,mt+h); ctx.lineTo(ml+w,mt+h); ctx.stroke();

    // X ticks
    ctx.fillStyle=C.muted; ctx.font='10px "DM Sans",sans-serif'; ctx.textAlign='center';
    [-6,-4,-2,0,2,4,6].forEach(v=>{
      const px=ml+(v+7)/14*w;
      ctx.fillText(v, px, mt+h+15);
    });
    ctx.fillText('z (score linéaire = θᵀx)', ml+w/2, mt+h+30);

    // Y ticks
    ctx.textAlign='right';
    [[0,'0'],[.5,'0.5'],[1,'1']].forEach(([v,l])=>{
      const py=mt+(1-v)*h;
      ctx.fillStyle=v===.5?C.orange:C.muted;
      ctx.fillText(l, ml-6, py+4);
    });
    ctx.save(); ctx.translate(13,mt+h/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign='center'; ctx.fillStyle=C.muted; ctx.font='11px "DM Sans",sans-serif';
    ctx.fillText('σ(z) = probabilité', 0, 0); ctx.restore();

    // Current z — vertical dashed line
    const czX=ml+(z+7)/14*w;
    ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.strokeStyle=C.dark+'88'; ctx.lineWidth=1.5;
    ctx.moveTo(czX,mt); ctx.lineTo(czX,mt+h); ctx.stroke();
    ctx.setLineDash([]);

    // Current probability — horizontal dashed line
    const czY=mt+(1-p)*h;
    ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.strokeStyle=C.dark+'55'; ctx.lineWidth=1;
    ctx.moveTo(ml,czY); ctx.lineTo(czX,czY); ctx.stroke();
    ctx.setLineDash([]);

    // Current point
    ctx.beginPath(); ctx.arc(czX, czY, 7, 0, Math.PI*2);
    ctx.fillStyle=p>=.5?C.red:C.green; ctx.fill();
    ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();

    // Decision zone label
    const decColor=p>=.5?C.red:C.green;
    ctx.fillStyle=decColor; ctx.font='bold 11px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(p>=.5?'Refus (p ≥ 0.5)':'Accord (p < 0.5)', p>=.5 ? ml+w*.75 : ml+w*.25, mt+h/2-4);

    // Update info panel
    if(zVal)  zVal.textContent=parseFloat(z).toFixed(2);
    if(probEl){ probEl.textContent=(p*100).toFixed(1)+'%'; probEl.style.color=decColor; }
    if(decEl){ decEl.textContent=p>=.5?'Refus — ŷ = 1':'Accord — ŷ = 0'; decEl.style.color=decColor; }
  }

  slider?.addEventListener('input', draw);
  window.addEventListener('resize', resize);
  resize();
}

// ── 3. COMPLEXITÉ DE LA FRONTIÈRE ───────────────────────────
function initBoundaryAnim(){
  const canvas=document.getElementById('anim-boundary-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const slider=document.getElementById('anim-boundary-slider');
  const lbl=document.getElementById('anim-boundary-lbl');

  // True boundary: parabola  y_b(x) = 0.45 + 1.2·x·(1−x)  (peak 0.75 at x=0.5)
  // Class 0 (green circles) is ABOVE the boundary
  // Class 1 (red crosses)   is BELOW the boundary
  const pts=[
    // Class 0 — clearly above parabola
    {x:.04,y:.54,c:0},{x:.08,y:.65,c:0},{x:.18,y:.74,c:0},{x:.28,y:.81,c:0},
    {x:.38,y:.85,c:0},{x:.48,y:.88,c:0},{x:.52,y:.88,c:0},{x:.62,y:.85,c:0},
    {x:.72,y:.81,c:0},{x:.82,y:.74,c:0},{x:.92,y:.65,c:0},{x:.96,y:.54,c:0},
    // Class 0 overlap — just above boundary
    {x:.20,y:.68,c:0},{x:.80,y:.68,c:0},{x:.50,y:.79,c:0},
    // Class 1 — clearly below parabola
    {x:.08,y:.27,c:1},{x:.18,y:.37,c:1},{x:.28,y:.45,c:1},{x:.38,y:.50,c:1},
    {x:.48,y:.54,c:1},{x:.52,y:.54,c:1},{x:.62,y:.50,c:1},{x:.72,y:.45,c:1},
    {x:.82,y:.37,c:1},{x:.92,y:.27,c:1},{x:.43,y:.71,c:1},{x:.57,y:.71,c:1},
    // Class 1 overlap — just below boundary
    {x:.30,y:.66,c:1},{x:.70,y:.66,c:1},{x:.50,y:.70,c:1},
  ];

  function resize(){
    canvas.width=Math.min(canvas.parentElement.getBoundingClientRect().width,700);
    canvas.height=260; draw();
  }

  // Boundary y=f(x).  True shape = parabola par(x).
  function boundary(xn, complexity){
    const par=0.45+1.2*xn*(1-xn);           // true parabolic boundary
    switch(complexity){
      case 1: return 0.63;                                                                 // flat — underfitting
      case 2: return 0.48+0.88*xn*(1-xn);                                                // under-curved
      case 3: return par;                                                                  // good fit ✓
      case 4: return par+0.05*Math.sin(5*Math.PI*xn);                                    // slight overfit
      default:return par+0.10*Math.sin(8*Math.PI*xn)+0.05*Math.sin(14*Math.PI*xn);      // severe overfit
    }
  }

  function draw(){
    const complexity=parseInt(slider.value);
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const ml=40,mr=20,mt=44,mb=40, w=W-ml-mr, h=H-mt-mb;

    function px(x){ return ml+x*w; }
    function py(y){ return mt+(1-y)*h; }

    // Background zones — green above (class 0 region), red below (class 1 region)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ml,mt);
    for(let i=0;i<=100;i++){ const xn=i/100; ctx.lineTo(px(xn),py(boundary(xn,complexity))); }
    ctx.lineTo(ml+w,mt); ctx.closePath();
    ctx.fillStyle=C.green+'18'; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ml,mt+h);
    for(let i=0;i<=100;i++){ const xn=i/100; ctx.lineTo(px(xn),py(boundary(xn,complexity))); }
    ctx.lineTo(ml+w,mt+h); ctx.closePath();
    ctx.fillStyle=C.red+'13'; ctx.fill();
    ctx.restore();

    // Border
    ctx.strokeStyle=C.gray2; ctx.lineWidth=1;
    ctx.strokeRect(ml,mt,w,h);

    // Data points
    pts.forEach(pt=>{
      const ppx=px(pt.x), ppy=py(pt.y);
      ctx.beginPath();
      if(pt.c===0){
        ctx.arc(ppx,ppy,5,0,Math.PI*2);
        ctx.fillStyle=C.green+'cc'; ctx.fill();
        ctx.strokeStyle=C.green; ctx.lineWidth=1.5; ctx.stroke();
      } else {
        ctx.strokeStyle=C.red; ctx.lineWidth=2.5;
        ctx.moveTo(ppx-5,ppy-5); ctx.lineTo(ppx+5,ppy+5);
        ctx.moveTo(ppx+5,ppy-5); ctx.lineTo(ppx-5,ppy+5);
        ctx.stroke();
      }
    });

    // Boundary line
    ctx.beginPath();
    for(let i=0;i<=200;i++){
      const xn=i/200;
      i===0?ctx.moveTo(px(xn),py(boundary(xn,complexity))):ctx.lineTo(px(xn),py(boundary(xn,complexity)));
    }
    ctx.strokeStyle=C.dark; ctx.lineWidth=2.8; ctx.stroke();

    // Title
    const lbls=['',
      'Sous-apprentissage — biais fort (frontière trop simple)',
      'Légère sous-spécification',
      'Bon compromis ✓',
      'Sur-apprentissage naissant',
      'Sur-apprentissage sévère — variance forte'];
    const clrs=['',C.orange,C.orange,C.green,C.red,C.red];
    ctx.fillStyle=clrs[complexity]; ctx.font='bold 13px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(lbls[complexity],W/2,26);

    // Train / test error bars
    const trainErr=[.40,.24,.08,.05,.02,.01];
    const testErr= [.42,.30,.11,.09,.22,.45];
    const barY=mt+h+12, barW=70, barH=8, barX=W-barW-15;

    ctx.fillStyle=C.muted; ctx.font='10px "DM Sans",sans-serif'; ctx.textAlign='right';
    ctx.fillText('Erreur train',barX-3,barY+7);
    ctx.fillText('Erreur test', barX-3,barY+20);
    ctx.fillStyle=C.gray2; ctx.fillRect(barX,barY,   barW,barH-1);
    ctx.fillStyle=C.dark;  ctx.fillRect(barX,barY,   trainErr[complexity-1]*barW,barH-1);
    ctx.fillStyle=C.gray2; ctx.fillRect(barX,barY+13,barW,barH-1);
    ctx.fillStyle=C.red;   ctx.fillRect(barX,barY+13,testErr[complexity-1]*barW,barH-1);

    // Axis labels
    ctx.fillStyle=C.muted; ctx.font='11px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText('x₁',ml+w/2,mt+h+14);
    ctx.save(); ctx.translate(12,mt+h/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('x₂',0,0); ctx.restore();

    // Legend
    ctx.beginPath(); ctx.arc(ml+10,mt+10,5,0,Math.PI*2);
    ctx.fillStyle=C.green+'cc'; ctx.fill(); ctx.strokeStyle=C.green; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle=C.dark; ctx.font='11px "DM Sans",sans-serif'; ctx.textAlign='left';
    ctx.fillText('Classe 0',ml+18,mt+14);

    ctx.strokeStyle=C.red; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(ml+7,mt+24); ctx.lineTo(ml+13,mt+30);
    ctx.moveTo(ml+13,mt+24); ctx.lineTo(ml+7,mt+30); ctx.stroke();
    ctx.fillStyle=C.dark; ctx.textAlign='left';
    ctx.fillText('Classe 1',ml+18,mt+28);

    if(lbl) lbl.textContent=complexity;
  }

  slider?.addEventListener('input',draw);
  window.addEventListener('resize',resize);
  resize();
}

// ── 4. DESCENTE DE GRADIENT 2D ──────────────────────────────
function initGradientDescentAnim(){
  const canvasC=document.getElementById('anim-gd-contour');
  const canvasL=document.getElementById('anim-gd-line');
  if(!canvasC||!canvasL) return;
  const ctxC=canvasC.getContext('2d');
  const ctxL=canvasL.getContext('2d');

  let gdMode='regression'; // 'regression' | 'classification'

  // ── REGRESSION DATA ─────────────────────────────────────
  const Xd=[.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6];
  const Yd=[1.5,2.0,2.8,3.1,3.8,4.5,5.0,5.6,6.1,6.9,7.2,8.0];
  const n=Xd.length;
  function mse(t0,t1){ let s=0; Xd.forEach((x,i)=>{const e=t0+t1*x-Yd[i]; s+=e*e;}); return s/n; }
  function grad(t0,t1){
    let g0=0,g1=0;
    Xd.forEach((x,i)=>{ const e=t0+t1*x-Yd[i]; g0+=2*e/n; g1+=2*e*x/n; });
    return {g0,g1};
  }
  const OPT_T0=0.72, OPT_T1=1.19;
  const T0A=-2.5, T0B=3.5, T1A=-0.5, T1B=3.5;

  function computeTraj(lr){
    const t=[]; let t0=-2, t1=3.2;
    t.push({t0,t1,j:mse(t0,t1)});
    for(let i=0;i<400;i++){
      const {g0,g1}=grad(t0,t1);
      t0-=lr*g0; t1-=lr*g1;
      t.push({t0,t1,j:mse(t0,t1)});
      if(Math.abs(g0)<1e-6&&Math.abs(g1)<1e-6) break;
    }
    return t;
  }

  // ── CLASSIFICATION DATA ──────────────────────────────────
  // 30 points, 2 classes. Class 0 centred ~(2,2), class 1 centred ~(4,4).
  const CLF_X=[
    [1.2,1.8],[2.1,1.5],[1.8,2.3],[2.5,2.0],[1.5,2.8],
    [0.8,1.2],[2.8,1.8],[1.3,3.1],[2.2,0.9],[1.7,1.4],
    [3.0,2.5],[0.9,2.5],[2.3,2.8],[1.6,0.7],[3.2,1.2],
    [3.8,4.2],[4.5,3.8],[4.2,4.5],[3.5,4.8],[4.8,4.1],
    [5.1,3.5],[4.0,5.2],[5.3,4.6],[3.7,3.5],[4.9,5.0],
    [3.2,4.5],[5.5,3.8],[4.4,3.2],[5.0,4.8],[3.9,5.5]
  ];
  const CLF_Y=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
               1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  const nc=CLF_X.length;

  function bce(t0,t1,t2){
    let s=0;
    CLF_X.forEach(([x1,x2],i)=>{
      const p=sigmoid(t0+t1*x1+t2*x2);
      const y=CLF_Y[i];
      s-=y*Math.log(p+1e-10)+(1-y)*Math.log(1-p+1e-10);
    });
    return s/nc;
  }
  function gradBce(t0,t1,t2){
    let g0=0,g1=0,g2=0;
    CLF_X.forEach(([x1,x2],i)=>{
      const err=sigmoid(t0+t1*x1+t2*x2)-CLF_Y[i];
      g0+=err/nc; g1+=err*x1/nc; g2+=err*x2/nc;
    });
    return {g0,g1,g2};
  }
  function computeTrajClassif(lr){
    const t=[]; let t0=0,t1=0,t2=0;
    t.push({t0,t1,t2,j:bce(t0,t1,t2)});
    for(let i=0;i<300;i++){
      const {g0,g1,g2}=gradBce(t0,t1,t2);
      t0-=lr*g0; t1-=lr*g1; t2-=lr*g2;
      t.push({t0,t1,t2,j:bce(t0,t1,t2)});
    }
    return t;
  }

  // ── SHARED STATE ─────────────────────────────────────────
  let traj=[], stepIdx=0, running=false, rafId=null;
  let heatmap=null;

  function resize(){
    const rect=canvasC.parentElement.getBoundingClientRect();
    const total=Math.min(rect.width,720);
    canvasC.width=Math.floor(total*.52); canvasC.height=280;
    canvasL.width=Math.floor(total*.44); canvasL.height=280;
    heatmap=null;
    if(traj.length) drawBoth(stepIdx); else drawBoth(-1);
  }

  // ── REGRESSION: MSE HEATMAP (cached) ────────────────────
  function buildHeatmap(W,H,ml,mr,mt,mb){
    const w=W-ml-mr, h=H-mt-mb;
    const NX=80,NY=80;
    let minJ=Infinity, maxJ=0;
    const grid=[];
    for(let j=0;j<NY;j++){
      for(let i=0;i<NX;i++){
        const t0=T0A+i/NX*(T0B-T0A);
        const t1=T1A+(1-j/NY)*(T1B-T1A);
        const v=mse(t0,t1);
        grid.push(v);
        if(v<minJ) minJ=v;
        if(v>maxJ) maxJ=v;
      }
    }
    const offCanvas=document.createElement('canvas');
    offCanvas.width=w; offCanvas.height=h;
    const offCtx=offCanvas.getContext('2d');
    const imgData=offCtx.createImageData(w,h);
    for(let py=0;py<h;py++){
      for(let px=0;px<w;px++){
        const gi=Math.floor(px/w*NX), gj=Math.floor(py/h*NY);
        const v=grid[gj*NX+gi];
        const t=Math.pow((v-minJ)/(maxJ-minJ),.35);
        let r,g,b;
        if(t<.5){ const s=t*2; r=Math.round(s*255); g=Math.round((1-s)*130+s*121); b=Math.round((1-s)*80); }
        else     { const s=(t-.5)*2; r=Math.round((1-s)*255+s*200); g=Math.round((1-s)*121+s*16); b=Math.round(s*46); }
        const idx=(py*w+px)*4;
        imgData.data[idx]=r; imgData.data[idx+1]=g; imgData.data[idx+2]=b; imgData.data[idx+3]=140;
      }
    }
    offCtx.putImageData(imgData,0,0);
    heatmap=offCanvas;
  }

  // ── REGRESSION: DRAW CONTOUR ─────────────────────────────
  function drawContour(step){
    const W=canvasC.width, H=canvasC.height;
    ctxC.clearRect(0,0,W,H);
    const ml=50,mr=20,mt=44,mb=50, w=W-ml-mr, h=H-mt-mb;

    ctxC.fillStyle=C.dark; ctxC.font='bold 11px "DM Sans",sans-serif'; ctxC.textAlign='center';
    ctxC.fillText('Surface de coût J(θ₀, θ₁)', W/2, 20);

    if(!heatmap||heatmap.width!==w) buildHeatmap(W,H,ml,mr,mt,mb);
    ctxC.drawImage(heatmap,ml,mt);

    ctxC.strokeStyle=C.dark; ctxC.lineWidth=1.5;
    ctxC.beginPath();
    ctxC.moveTo(ml,mt); ctxC.lineTo(ml,mt+h); ctxC.lineTo(ml+w,mt+h); ctxC.stroke();

    ctxC.fillStyle=C.muted; ctxC.font='10px "DM Sans",sans-serif'; ctxC.textAlign='center';
    [-2,-1,0,1,2,3].forEach(v=>{
      if(v<T0A||v>T0B) return;
      const ppx=ml+(v-T0A)/(T0B-T0A)*w;
      ctxC.fillText(v, ppx, mt+h+14);
    });
    ctxC.textAlign='right';
    [0,1,2,3].forEach(v=>{
      if(v<T1A||v>T1B) return;
      const ppy=mt+(1-(v-T1A)/(T1B-T1A))*h;
      ctxC.fillText(v, ml-5, ppy+4);
    });

    ctxC.fillStyle=C.muted; ctxC.font='11px "DM Sans",sans-serif'; ctxC.textAlign='center';
    ctxC.fillText('θ₀ (intercept)', ml+w/2, mt+h+30);
    ctxC.save(); ctxC.translate(14,mt+h/2); ctxC.rotate(-Math.PI/2);
    ctxC.fillText('θ₁ (pente)',0,0); ctxC.restore();

    const ocx=ml+(OPT_T0-T0A)/(T0B-T0A)*w;
    const ocy=mt+(1-(OPT_T1-T1A)/(T1B-T1A))*h;
    drawStar(ctxC, ocx, ocy, 8, C.green);
    ctxC.fillStyle=C.green; ctxC.font='bold 10px "DM Sans",sans-serif'; ctxC.textAlign='left';
    ctxC.fillText('Optimum', ocx+10, ocy+4);

    if(step<0||traj.length===0) return;

    const end=Math.min(step+1,traj.length);
    ctxC.beginPath(); ctxC.strokeStyle=C.white; ctxC.lineWidth=2.5;
    traj.slice(0,end).forEach((pt,i)=>{
      const ppx=ml+(pt.t0-T0A)/(T0B-T0A)*w;
      const ppy=mt+(1-(pt.t1-T1A)/(T1B-T1A))*h;
      i===0?ctxC.moveTo(ppx,ppy):ctxC.lineTo(ppx,ppy);
    });
    ctxC.stroke();

    ctxC.beginPath(); ctxC.strokeStyle=C.dark; ctxC.lineWidth=1.5;
    traj.slice(0,end).forEach((pt,i)=>{
      const ppx=ml+(pt.t0-T0A)/(T0B-T0A)*w;
      const ppy=mt+(1-(pt.t1-T1A)/(T1B-T1A))*h;
      i===0?ctxC.moveTo(ppx,ppy):ctxC.lineTo(ppx,ppy);
    });
    ctxC.stroke();

    const cur=traj[Math.min(step,traj.length-1)];
    const cpx=ml+(cur.t0-T0A)/(T0B-T0A)*w;
    const cpy=mt+(1-(cur.t1-T1A)/(T1B-T1A))*h;
    ctxC.beginPath(); ctxC.arc(cpx,cpy,7,0,Math.PI*2);
    ctxC.fillStyle=C.white; ctxC.fill();
    ctxC.strokeStyle=C.dark; ctxC.lineWidth=2; ctxC.stroke();

    ctxC.fillStyle=C.dark; ctxC.font='600 11px "DM Sans",sans-serif'; ctxC.textAlign='left';
    ctxC.fillText(`it. ${Math.min(step,traj.length-1)}`, ml, mt-24);
    ctxC.font='10px "JetBrains Mono",monospace';
    ctxC.fillText(`θ₀=${cur.t0.toFixed(3)}  θ₁=${cur.t1.toFixed(3)}`, ml, mt-10);
    ctxC.fillText(`J = ${cur.j.toFixed(4)}`, ml+w-80, mt-10);
  }

  // ── REGRESSION: DRAW LINE ────────────────────────────────
  function drawLine(step){
    const W=canvasL.width, H=canvasL.height;
    ctxL.clearRect(0,0,W,H);
    const ml=44,mr=15,mt=44,mb=50, w=W-ml-mr, h=H-mt-mb;

    ctxL.fillStyle=C.dark; ctxL.font='bold 11px "DM Sans",sans-serif'; ctxL.textAlign='center';
    ctxL.fillText('Ajustement de la droite ŷ = θ₀ + θ₁·x', W/2, 20);

    ctxL.strokeStyle=C.dark; ctxL.lineWidth=1.5;
    ctxL.beginPath();
    ctxL.moveTo(ml,mt); ctxL.lineTo(ml,mt+h); ctxL.lineTo(ml+w,mt+h); ctxL.stroke();

    const xMin=0,xMax=7,yMin=0,yMax=10;
    function ppx(x){ return ml+(x-xMin)/(xMax-xMin)*w; }
    function ppy(y){ return mt+(1-(y-yMin)/(yMax-yMin))*h; }

    ctxL.strokeStyle=C.gray2; ctxL.lineWidth=1;
    [2,4,6].forEach(v=>{ ctxL.beginPath(); ctxL.moveTo(ppx(v),mt); ctxL.lineTo(ppx(v),mt+h); ctxL.stroke(); });
    [2,4,6,8].forEach(v=>{ ctxL.beginPath(); ctxL.moveTo(ml,ppy(v)); ctxL.lineTo(ml+w,ppy(v)); ctxL.stroke(); });

    ctxL.fillStyle=C.muted; ctxL.font='10px "DM Sans",sans-serif'; ctxL.textAlign='center';
    [0,2,4,6].forEach(v=>ctxL.fillText(v,ppx(v),mt+h+14));
    ctxL.textAlign='right';
    [0,5,10].forEach(v=>ctxL.fillText(v,ml-5,ppy(v)+4));
    ctxL.fillStyle=C.muted; ctxL.font='11px "DM Sans",sans-serif'; ctxL.textAlign='center';
    ctxL.fillText('x',ml+w/2,mt+h+30);
    ctxL.save(); ctxL.translate(12,mt+h/2); ctxL.rotate(-Math.PI/2);
    ctxL.fillText('y',0,0); ctxL.restore();

    if(step>=0&&traj.length>0){
      const cur=traj[Math.min(step,traj.length-1)];
      Xd.forEach((x,i)=>{
        const yPred=cur.t0+cur.t1*x;
        ctxL.beginPath();
        ctxL.moveTo(ppx(x),ppy(Yd[i])); ctxL.lineTo(ppx(x),ppy(yPred));
        ctxL.strokeStyle=C.orange+'88'; ctxL.lineWidth=1.5; ctxL.stroke();
      });
      ctxL.setLineDash([5,4]);
      ctxL.beginPath();
      ctxL.moveTo(ppx(xMin),ppy(OPT_T0+OPT_T1*xMin));
      ctxL.lineTo(ppx(xMax),ppy(OPT_T0+OPT_T1*xMax));
      ctxL.strokeStyle=C.green+'77'; ctxL.lineWidth=1.8; ctxL.stroke();
      ctxL.setLineDash([]);
      ctxL.beginPath();
      ctxL.moveTo(ppx(xMin),ppy(cur.t0+cur.t1*xMin));
      ctxL.lineTo(ppx(xMax),ppy(cur.t0+cur.t1*xMax));
      ctxL.strokeStyle=C.red; ctxL.lineWidth=2.5; ctxL.stroke();
      const barX=ml+w-60, barY=mt+6, barH=8;
      const maxJ0=mse(-2,3.2);
      const jRatio=Math.min(1,cur.j/maxJ0);
      ctxL.fillStyle=C.gray2; ctxL.fillRect(barX,barY,58,barH);
      ctxL.fillStyle=C.red;   ctxL.fillRect(barX,barY,jRatio*58,barH);
      ctxL.fillStyle=C.dark; ctxL.font='bold 10px "DM Sans",sans-serif'; ctxL.textAlign='right';
      ctxL.fillText('MSE',barX-3,barY+7);
      ctxL.fillStyle=C.muted; ctxL.font='10px "JetBrains Mono",monospace'; ctxL.textAlign='right';
      ctxL.fillText(cur.j.toFixed(3), ml+w, mt-8);
    }

    Xd.forEach((x,i)=>{
      ctxL.beginPath(); ctxL.arc(ppx(x),ppy(Yd[i]),4.5,0,Math.PI*2);
      ctxL.fillStyle=C.dark+'cc'; ctxL.fill();
      ctxL.strokeStyle=C.dark; ctxL.lineWidth=1; ctxL.stroke();
    });

    ctxL.beginPath(); ctxL.moveTo(ml,mt-16); ctxL.lineTo(ml+22,mt-16);
    ctxL.strokeStyle=C.red; ctxL.lineWidth=2.5; ctxL.stroke();
    ctxL.fillStyle=C.dark; ctxL.font='11px "DM Sans",sans-serif'; ctxL.textAlign='left';
    ctxL.fillText('Modèle courant', ml+25, mt-12);
    ctxL.setLineDash([5,4]);
    ctxL.beginPath(); ctxL.moveTo(ml+w-80,mt-16); ctxL.lineTo(ml+w-58,mt-16);
    ctxL.strokeStyle=C.green+'aa'; ctxL.lineWidth=1.8; ctxL.stroke();
    ctxL.setLineDash([]);
    ctxL.fillStyle=C.green+'aa'; ctxL.textAlign='left';
    ctxL.fillText('Optimum', ml+w-55, mt-12);
  }

  // ── CLASSIFICATION: SCATTER + HEATMAP ───────────────────
  const CLF_X1A=0, CLF_X1B=6, CLF_X2A=0, CLF_X2B=6;

  function drawClassifScatter(step){
    const W=canvasC.width, H=canvasC.height;
    ctxC.clearRect(0,0,W,H);
    const ml=46,mr=14,mt=44,mb=44, w=W-ml-mr, h=H-mt-mb;

    ctxC.fillStyle=C.dark; ctxC.font='bold 11px "DM Sans",sans-serif'; ctxC.textAlign='center';
    ctxC.fillText('Frontière de décision P(y=1|x₁,x₂)', W/2, 20);

    const cur=(step>=0&&traj.length>0)?traj[Math.min(step,traj.length-1)]:{t0:0,t1:0,t2:0,j:0};

    // Per-pixel probability heatmap (2-pixel step for performance)
    const imgData=ctxC.createImageData(w,h);
    const S=2;
    for(let py=0;py<h;py+=S){
      for(let px=0;px<w;px+=S){
        const x1=CLF_X1A+(px+.5)/w*(CLF_X1B-CLF_X1A);
        const x2=CLF_X2B-(py+.5)/h*(CLF_X2B-CLF_X2A);
        const p=sigmoid(cur.t0+cur.t1*x1+cur.t2*x2);
        // blue (y=0 region) → white (boundary) → red (y=1 region)
        let r,g,b;
        if(p<0.5){ const s=p*2; r=Math.round(50+s*205); g=Math.round(100+s*155); b=255; }
        else { const s=(p-.5)*2; r=255; g=Math.round(255-s*205); b=Math.round(255-s*205); }
        for(let dy=0;dy<S&&py+dy<h;dy++){
          for(let dx=0;dx<S&&px+dx<w;dx++){
            const idx=((py+dy)*w+(px+dx))*4;
            imgData.data[idx]=r; imgData.data[idx+1]=g; imgData.data[idx+2]=b; imgData.data[idx+3]=180;
          }
        }
      }
    }
    ctxC.putImageData(imgData,ml,mt);

    // Axes
    ctxC.strokeStyle=C.dark; ctxC.lineWidth=1.5;
    ctxC.beginPath();
    ctxC.moveTo(ml,mt); ctxC.lineTo(ml,mt+h); ctxC.lineTo(ml+w,mt+h); ctxC.stroke();

    function cpx(x){ return ml+(x-CLF_X1A)/(CLF_X1B-CLF_X1A)*w; }
    function cpy(y){ return mt+(1-(y-CLF_X2A)/(CLF_X2B-CLF_X2A))*h; }

    ctxC.fillStyle=C.muted; ctxC.font='10px "DM Sans",sans-serif'; ctxC.textAlign='center';
    [0,2,4,6].forEach(v=>ctxC.fillText(v, cpx(v), mt+h+13));
    ctxC.textAlign='right';
    [0,2,4,6].forEach(v=>ctxC.fillText(v, ml-4, cpy(v)+4));

    ctxC.fillStyle=C.muted; ctxC.font='11px "DM Sans",sans-serif'; ctxC.textAlign='center';
    ctxC.fillText('x₁', ml+w/2, mt+h+28);
    ctxC.save(); ctxC.translate(12,mt+h/2); ctxC.rotate(-Math.PI/2);
    ctxC.fillText('x₂',0,0); ctxC.restore();

    // Decision boundary: θ₀ + θ₁x₁ + θ₂x₂ = 0  →  x₂ = -(θ₀+θ₁x₁)/θ₂
    if(step>=0&&Math.abs(cur.t2)>0.01){
      ctxC.beginPath(); ctxC.strokeStyle=C.dark; ctxC.lineWidth=2.5;
      let started=false;
      for(let px=0;px<=w;px++){
        const x1=CLF_X1A+px/w*(CLF_X1B-CLF_X1A);
        const x2=-(cur.t0+cur.t1*x1)/cur.t2;
        if(x2<CLF_X2A||x2>CLF_X2B){ started=false; continue; }
        const py=cpy(x2);
        if(!started){ ctxC.moveTo(ml+px,py); started=true; } else ctxC.lineTo(ml+px,py);
      }
      ctxC.stroke();
      // White dashed outline for contrast
      ctxC.setLineDash([6,5]);
      ctxC.beginPath(); ctxC.strokeStyle=C.white; ctxC.lineWidth=1.2;
      started=false;
      for(let px=0;px<=w;px++){
        const x1=CLF_X1A+px/w*(CLF_X1B-CLF_X1A);
        const x2=-(cur.t0+cur.t1*x1)/cur.t2;
        if(x2<CLF_X2A||x2>CLF_X2B){ started=false; continue; }
        const py=cpy(x2);
        if(!started){ ctxC.moveTo(ml+px,py); started=true; } else ctxC.lineTo(ml+px,py);
      }
      ctxC.stroke(); ctxC.setLineDash([]);
    }

    // Data points
    CLF_X.forEach(([x1,x2],i)=>{
      ctxC.beginPath(); ctxC.arc(cpx(x1),cpy(x2),5,0,Math.PI*2);
      ctxC.fillStyle=CLF_Y[i]===1?'#C8102Ecc':'#2255aacc'; ctxC.fill();
      ctxC.strokeStyle=C.white; ctxC.lineWidth=1.5; ctxC.stroke();
    });

    // Stats overlay (top-left)
    if(step>=0){
      ctxC.fillStyle=C.dark; ctxC.font='600 11px "DM Sans",sans-serif'; ctxC.textAlign='left';
      ctxC.fillText('it. '+Math.min(step,traj.length-1), ml, mt-25);
      ctxC.font='10px "JetBrains Mono",monospace';
      ctxC.fillText('BCE = '+cur.j.toFixed(4), ml, mt-11);
    }

    // Legend (top-right)
    const legX=ml+w-90;
    ctxC.beginPath(); ctxC.arc(legX,mt-13,4,0,Math.PI*2);
    ctxC.fillStyle='#C8102Ecc'; ctxC.fill();
    ctxC.strokeStyle=C.white; ctxC.lineWidth=1; ctxC.stroke();
    ctxC.fillStyle=C.dark; ctxC.font='10px "DM Sans",sans-serif'; ctxC.textAlign='left';
    ctxC.fillText('y=1', legX+7, mt-9);
    ctxC.beginPath(); ctxC.arc(legX+42,mt-13,4,0,Math.PI*2);
    ctxC.fillStyle='#2255aacc'; ctxC.fill();
    ctxC.strokeStyle=C.white; ctxC.lineWidth=1; ctxC.stroke();
    ctxC.fillStyle=C.dark; ctxC.textAlign='left';
    ctxC.fillText('y=0', legX+49, mt-9);
  }

  // ── CLASSIFICATION: BCE CURVE ────────────────────────────
  function drawLossCurve(step){
    const W=canvasL.width, H=canvasL.height;
    ctxL.clearRect(0,0,W,H);
    const ml=50,mr=12,mt=44,mb=44, w=W-ml-mr, h=H-mt-mb;

    ctxL.fillStyle=C.dark; ctxL.font='bold 11px "DM Sans",sans-serif'; ctxL.textAlign='center';
    ctxL.fillText('Perte BCE par itération', W/2, 20);

    ctxL.strokeStyle=C.dark; ctxL.lineWidth=1.5;
    ctxL.beginPath();
    ctxL.moveTo(ml,mt); ctxL.lineTo(ml,mt+h); ctxL.lineTo(ml+w,mt+h); ctxL.stroke();

    ctxL.fillStyle=C.muted; ctxL.font='11px "DM Sans",sans-serif'; ctxL.textAlign='center';
    ctxL.fillText('Itération', ml+w/2, mt+h+28);
    ctxL.save(); ctxL.translate(12,mt+h/2); ctxL.rotate(-Math.PI/2);
    ctxL.fillText('BCE',0,0); ctxL.restore();

    if(step<0||traj.length<2){
      ctxL.fillStyle=C.muted; ctxL.font='12px "DM Sans",sans-serif'; ctxL.textAlign='center';
      ctxL.fillText('Lancez l\'animation →', ml+w/2, mt+h/2);
      return;
    }

    let minJ=Infinity, maxJ=0;
    traj.forEach(pt=>{ if(pt.j<minJ)minJ=pt.j; if(pt.j>maxJ)maxJ=pt.j; });
    const jRange=maxJ-minJ||0.001;
    const end=Math.min(step+1,traj.length);

    // Y gridlines + ticks
    ctxL.strokeStyle=C.gray2; ctxL.lineWidth=1;
    for(let k=1;k<=4;k++){
      const yv=mt+h*(1-k/4);
      ctxL.beginPath(); ctxL.moveTo(ml,yv); ctxL.lineTo(ml+w,yv); ctxL.stroke();
      ctxL.fillStyle=C.muted; ctxL.font='9px "DM Sans",sans-serif'; ctxL.textAlign='right';
      ctxL.fillText((minJ+k/4*jRange).toFixed(3), ml-3, yv+4);
    }

    // Full trajectory (faint preview)
    ctxL.beginPath(); ctxL.strokeStyle=C.gray2; ctxL.lineWidth=1.5;
    traj.forEach((pt,i)=>{
      const px=ml+i/(traj.length-1)*w;
      const py=mt+h-(pt.j-minJ)/jRange*h;
      i===0?ctxL.moveTo(px,py):ctxL.lineTo(px,py);
    });
    ctxL.stroke();

    // Colored progress
    ctxL.beginPath(); ctxL.strokeStyle=C.red; ctxL.lineWidth=2.5;
    traj.slice(0,end).forEach((pt,i)=>{
      const px=ml+i/(traj.length-1)*w;
      const py=mt+h-(pt.j-minJ)/jRange*h;
      i===0?ctxL.moveTo(px,py):ctxL.lineTo(px,py);
    });
    ctxL.stroke();

    // Current dot
    const si=Math.min(step,traj.length-1);
    const dotX=ml+si/(traj.length-1)*w;
    const dotY=mt+h-(traj[si].j-minJ)/jRange*h;
    ctxL.beginPath(); ctxL.arc(dotX,dotY,5,0,Math.PI*2);
    ctxL.fillStyle=C.red; ctxL.fill();
    ctxL.strokeStyle=C.white; ctxL.lineWidth=1.5; ctxL.stroke();

    // X ticks
    ctxL.fillStyle=C.muted; ctxL.font='9px "DM Sans",sans-serif'; ctxL.textAlign='center';
    [0,.25,.5,.75,1].forEach(f=>{
      ctxL.fillText(Math.round(f*(traj.length-1)), ml+f*w, mt+h+13);
    });
  }

  // ── DISPATCH ─────────────────────────────────────────────
  function drawBoth(step){
    if(gdMode==='regression'){ drawContour(step); drawLine(step); }
    else { drawClassifScatter(step); drawLossCurve(step); }
  }

  // ── ANIMATION CONTROL ────────────────────────────────────
  function startAnim(){
    if(running) return;
    const lrEl=document.getElementById('anim-gd-lr');
    const lr=lrEl?parseFloat(lrEl.value):0.05;
    if(gdMode==='regression'){
      traj=computeTraj(lr); heatmap=null;
    } else {
      traj=computeTrajClassif(lr);
    }
    stepIdx=0; running=true;
    function step(){
      if(!running) return;
      drawBoth(stepIdx);
      stepIdx++;
      if(stepIdx<traj.length){
        const delay=stepIdx<15?120:stepIdx<60?40:stepIdx<150?15:8;
        rafId=setTimeout(()=>requestAnimationFrame(step), delay);
      } else { running=false; }
    }
    requestAnimationFrame(step);
  }

  function resetAnim(){
    running=false; if(rafId) clearTimeout(rafId);
    stepIdx=0; traj=[]; heatmap=null; drawBoth(-1);
  }

  // ── MODE TOGGLE ──────────────────────────────────────────
  document.getElementById('btn-gd-mode-reg')?.addEventListener('click',()=>{
    if(gdMode==='regression') return;
    gdMode='regression';
    document.getElementById('btn-gd-mode-reg')?.classList.add('active');
    document.getElementById('btn-gd-mode-clf')?.classList.remove('active');
    const cap=document.getElementById('anim-gd-caption');
    if(cap) cap.innerHTML='<strong>Gauche :</strong> carte de chaleur de J(θ₀,θ₁) — la trajectoire converge vers l\'optimum ★.<br><strong>Droite :</strong> la droite de régression s\'ajuste à chaque itération ; les segments orange sont les résidus.';
    resetAnim();
  });

  document.getElementById('btn-gd-mode-clf')?.addEventListener('click',()=>{
    if(gdMode==='classification') return;
    gdMode='classification';
    document.getElementById('btn-gd-mode-clf')?.classList.add('active');
    document.getElementById('btn-gd-mode-reg')?.classList.remove('active');
    const cap=document.getElementById('anim-gd-caption');
    if(cap) cap.innerHTML='<strong>Gauche :</strong> carte de probabilité P(y=1|x) et frontière de décision mise à jour à chaque itération (bleu = classe 0, rouge = classe 1).<br><strong>Droite :</strong> courbe de la perte BCE (entropie croisée binaire) par itération — régression logistique.';
    resetAnim();
  });

  document.getElementById('btn-gd-start')?.addEventListener('click', startAnim);
  document.getElementById('btn-gd-reset')?.addEventListener('click', resetAnim);
  document.getElementById('anim-gd-lr')?.addEventListener('input', function(){
    const el=document.getElementById('anim-gd-lr-val');
    if(el) el.textContent=this.value;
  });

  window.addEventListener('resize', ()=>{ heatmap=null; resize(); });
  resize();
}

// ── 5. GUIDE — GRAPHIQUES PAR TYPE DE VARIABLE ──────────────
function initChartGuide(){
  const container = document.getElementById('chart-guide-cards');
  const context   = document.getElementById('chart-guide-context');
  if(!container) return;

  const tabs = {
    'univ-q':{
      label:'Variable quantitative seule',
      desc:'Explorer la distribution d\'une variable numérique continue ou discrète.',
      charts:[
        {name:'Histogramme',       use:'Répartition en classes ; forme de la distribution',         draw:miniHistogram,  color:C.red},
        {name:'Boîte à moustaches',use:'Médiane, Q1/Q3, valeurs extrêmes et outliers',              draw:miniBoxplot,    color:C.orange},
        {name:'Courbe de densité', use:'Distribution lissée (estimateur à noyau KDE)',              draw:miniDensity,    color:C.dark},
      ]
    },
    'univ-ql':{
      label:'Variable qualitative seule',
      desc:'Visualiser la répartition des modalités d\'une variable catégorielle.',
      charts:[
        {name:'Diagramme en barres',use:'Effectifs ou proportions par modalité',                   draw:miniBarChart,   color:C.red},
        {name:'Camembert',           use:'Proportions relatives — peu de modalités uniquement',     draw:miniPieChart,   color:C.orange},
        {name:'Lollipop',            use:'Alternative lisible aux barres (nombreuses modalités)',   draw:miniLollipop,   color:C.dark},
      ]
    },
    'qq':{
      label:'Quantitative × Quantitative',
      desc:'Étudier la relation ou la corrélation entre deux variables numériques.',
      charts:[
        {name:'Nuage de points',      use:'Corrélation, forme de la relation (linéaire ?)',         draw:miniScatter,     color:C.dark},
        {name:'Droite de régression', use:'Tendance linéaire ajustée (+ intervalle de confiance)', draw:miniRegLine,    color:C.red},
        {name:'Matrice de corrélation',use:'Toutes les corrélations d\'un tableau multivariée',    draw:miniCorrMatrix, color:C.orange},
      ]
    },
    'qlq':{
      label:'Qualitative × Quantitative',
      desc:'Comparer la distribution d\'une variable numérique selon les groupes d\'une variable catégorielle.',
      charts:[
        {name:'Boîtes par groupe',   use:'Comparaison de distributions : médiane et dispersion',  draw:miniGroupedBox, color:C.red},
        {name:'Barres de moyennes',  use:'Moyenne ± écart-type ou intervalle de confiance',        draw:miniMeanBars,   color:C.orange},
        {name:'Diagramme en violon', use:'Distribution complète par groupe — plus informatif',     draw:miniViolin,     color:C.dark},
      ]
    },
    'qlql':{
      label:'Qualitative × Qualitative',
      desc:'Analyser la relation entre deux variables catégorielles (test du χ², V de Cramér).',
      charts:[
        {name:'Barres groupées',       use:'Fréquences côte à côte par combinaison de modalités',  draw:miniGroupedBars,  color:C.dark},
        {name:'Barres empilées',       use:'Composition de chaque groupe (proportions)',            draw:miniStackedBars,  color:C.red},
        {name:'Tableau de contingence',use:'Fréquences croisées avec code couleur d\'intensité',   draw:miniContingency,  color:C.orange},
      ]
    },
  };

  const keys=Object.keys(tabs);

  function render(key){
    const tab=tabs[key];
    if(context){
      context.innerHTML=`<strong>${tab.label}</strong> — ${tab.desc}`;
    }
    container.innerHTML='';
    tab.charts.forEach(chart=>{
      const card=document.createElement('div');
      card.className='chart-card';
      card.style.borderTopColor=chart.color;

      const cvs=document.createElement('canvas');
      cvs.width=130; cvs.height=80;
      const ctx=cvs.getContext('2d');
      chart.draw(ctx, 130, 80, chart.color);

      const name=document.createElement('div');
      name.className='chart-card-name'; name.textContent=chart.name;
      const use=document.createElement('div');
      use.className='chart-card-use'; use.textContent=chart.use;

      card.append(cvs, name, use);
      container.appendChild(card);
    });
  }

  document.querySelectorAll('[data-cg-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('[data-cg-tab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.cgTab);
    });
  });
  render(keys[0]);
}

/* ── Mini chart draw functions (130×80 canvas) ── */
function bg(ctx,W,H){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); }
function axis(ctx,ml,mt,W,H,mb,mr){
  ctx.strokeStyle=C.dark; ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(ml,mt); ctx.lineTo(ml,H-mb); ctx.lineTo(W-mr,H-mb);
  ctx.stroke();
}

function miniHistogram(ctx,W,H,color){
  bg(ctx,W,H);
  const bars=[.12,.24,.42,.65,.85,1,.92,.76,.54,.33,.18,.08];
  const ml=6,mr=4,mt=6,mb=12, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  const bw=w/bars.length;
  bars.forEach((v,i)=>{
    const bh=v*(h-2);
    ctx.fillStyle=color+'bb';
    ctx.fillRect(ml+i*bw+1, mt+h-bh, bw-1.5, bh);
  });
  // Normal curve overlay
  ctx.beginPath(); ctx.strokeStyle=C.dark; ctx.lineWidth=1.5;
  for(let i=0;i<=w;i++){
    const t=(i/w-.5)*5.5, y=Math.exp(-t*t/2);
    const px=ml+i, py=mt+h-y*(h-2);
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.stroke();
}

function miniBoxplot(ctx,W,H,color){
  bg(ctx,W,H);
  const cy=H/2+2, x1=10,x2=W-10, q1=W*.28,q3=W*.70, med=W*.48;
  ctx.strokeStyle=C.muted; ctx.lineWidth=1;
  // Whiskers
  ctx.beginPath(); ctx.moveTo(x1,cy); ctx.lineTo(q1,cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(q3,cy); ctx.lineTo(x2,cy); ctx.stroke();
  // End caps
  [[x1],[x2]].forEach(([x])=>{
    ctx.beginPath(); ctx.moveTo(x,cy-5); ctx.lineTo(x,cy+5); ctx.stroke();
  });
  // Box
  ctx.fillStyle=color+'28'; ctx.fillRect(q1,cy-10,q3-q1,20);
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.strokeRect(q1,cy-10,q3-q1,20);
  // Median
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2.5;
  ctx.moveTo(med,cy-10); ctx.lineTo(med,cy+10); ctx.stroke();
  // Outlier
  ctx.beginPath(); ctx.arc(x2+7,cy,3,0,Math.PI*2);
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
  // Labels
  ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
  ctx.fillText('Min',x1,cy-14); ctx.fillText('Q1',q1,cy-14);
  ctx.fillText('Méd.',med,cy-14); ctx.fillText('Q3',q3,cy-14);
}

function miniDensity(ctx,W,H,color){
  bg(ctx,W,H);
  const ml=6,mr=4,mt=6,mb=12, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  // Fill
  ctx.beginPath();
  for(let i=0;i<=w;i++){
    const t=(i/w-.5)*5.5, y=Math.exp(-t*t/2);
    const px=ml+i, py=mt+h-y*(h-2);
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.lineTo(ml+w,mt+h); ctx.lineTo(ml,mt+h); ctx.closePath();
  ctx.fillStyle=color+'28'; ctx.fill();
  // Curve
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2;
  for(let i=0;i<=w;i++){
    const t=(i/w-.5)*5.5, y=Math.exp(-t*t/2);
    const px=ml+i, py=mt+h-y*(h-2);
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.stroke();
  // Mean line
  ctx.setLineDash([3,3]); ctx.beginPath();
  ctx.strokeStyle=C.dark+'88'; ctx.lineWidth=1;
  ctx.moveTo(ml+w/2,mt+4); ctx.lineTo(ml+w/2,mt+h); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle=C.dark; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
  ctx.fillText('μ', ml+w/2, mt+3);
}

function miniBarChart(ctx,W,H,color){
  bg(ctx,W,H);
  const cats=[{v:.65,c:color},{v:.38,c:C.orange},{v:.88,c:C.green},{v:.52,c:C.dark}];
  const labels=['A','B','C','D'];
  const ml=8,mr=4,mt=6,mb=16, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  const bw=w/cats.length;
  cats.forEach(({v,c},i)=>{
    const bh=v*(h-2);
    ctx.fillStyle=c+'cc';
    ctx.fillRect(ml+i*bw+3, mt+h-bh, bw-6, bh);
    ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i], ml+i*bw+bw/2, H-4);
  });
}

function miniPieChart(ctx,W,H,color){
  bg(ctx,W,H);
  const cats=[{v:.42,c:color},{v:.28,c:C.orange},{v:.18,c:C.green},{v:.12,c:C.dark}];
  const labels=['42%','28%','18%','12%'];
  const cx=W/2, cy=H/2, r=Math.min(W,H)/2-8;
  let angle=-Math.PI/2;
  cats.forEach(({v,c},i)=>{
    const sl=v*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+sl); ctx.closePath();
    ctx.fillStyle=c+'dd'; ctx.fill();
    ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.stroke();
    if(v>.15){
      const ma=angle+sl/2;
      ctx.fillStyle='white'; ctx.font='bold 8px "DM Sans",sans-serif'; ctx.textAlign='center';
      ctx.fillText(labels[i], cx+(r*.6)*Math.cos(ma), cy+(r*.6)*Math.sin(ma)+3);
    }
    angle+=sl;
  });
}

function miniLollipop(ctx,W,H,color){
  bg(ctx,W,H);
  const vals=[.88,.65,.52,.38,.22];
  const labels=['A','B','C','D','E'];
  const ml=18,mr=6,mt=6,mb=14, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  const rh=h/vals.length;
  vals.forEach((v,i)=>{
    const y=mt+i*rh+rh/2;
    const xEnd=ml+v*(w-4);
    ctx.strokeStyle=C.muted; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ml,y); ctx.lineTo(xEnd,y); ctx.stroke();
    ctx.beginPath(); ctx.arc(xEnd,y,4,0,Math.PI*2);
    ctx.fillStyle=color+'cc'; ctx.fill();
    ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='right';
    ctx.fillText(labels[i], ml-3, y+3);
  });
}

function miniScatter(ctx,W,H,color){
  bg(ctx,W,H);
  const pts=[[.1,.82],[.18,.70],[.27,.58],[.32,.68],[.42,.50],[.48,.52],[.56,.38],[.62,.40],[.70,.24],[.76,.32],[.84,.18],[.91,.22]];
  const ml=8,mr=4,mt=6,mb=10, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  pts.forEach(([x,y])=>{
    ctx.beginPath(); ctx.arc(ml+x*w, mt+(1-y)*h, 3, 0, Math.PI*2);
    ctx.fillStyle=color+'99'; ctx.fill();
    ctx.strokeStyle=color+'dd'; ctx.lineWidth=.8; ctx.stroke();
  });
}

function miniRegLine(ctx,W,H,color){
  miniScatter(ctx,W,H,C.dark+'88');
  const ml=8,mr=4,mt=6,mb=10, w=W-ml-mr, h=H-mt-mb;
  // Confidence band
  ctx.beginPath();
  for(let i=0;i<=w;i++){
    const t=i/w, y=.82-t*.6, band=.05+t*.02;
    i===0?ctx.moveTo(ml+i,mt+(1-(y+band))*h):ctx.lineTo(ml+i,mt+(1-(y+band))*h);
  }
  for(let i=w;i>=0;i--){
    const t=i/w, y=.82-t*.6, band=.05+t*.02;
    ctx.lineTo(ml+i,mt+(1-(y-band))*h);
  }
  ctx.closePath(); ctx.fillStyle=color+'22'; ctx.fill();
  // Regression line
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2;
  ctx.moveTo(ml+.04*w, mt+(1-.82)*h);
  ctx.lineTo(ml+.96*w, mt+(1-.22)*h);
  ctx.stroke();
}

function miniCorrMatrix(ctx,W,H,color){
  bg(ctx,W,H);
  const n=4, pad=4, labels=['x₁','x₂','x₃','x₄'];
  const size=(Math.min(W,H)-pad*2)/n;
  const corr=[[1,.82,.31,-.24],[.82,1,.15,-.51],[.31,.15,1,.63],[-.24,-.51,.63,1]];
  corr.forEach((row,i)=>row.forEach((v,j)=>{
    const a=Math.abs(v)*.85+.1;
    ctx.fillStyle=v>0?`rgba(200,16,46,${a})`:`rgba(0,130,80,${a})`;
    ctx.fillRect(pad+j*size+1, pad+i*size+1, size-2, size-2);
    if(i===j){
      ctx.fillStyle='white'; ctx.font='bold 7px "DM Sans",sans-serif'; ctx.textAlign='center';
      ctx.fillText(labels[i], pad+j*size+size/2, pad+i*size+size/2+3);
    } else {
      ctx.fillStyle='white'; ctx.font='bold 7px "DM Sans",sans-serif'; ctx.textAlign='center';
      ctx.fillText(v.toFixed(2).replace('0.','.'). replace('-0.','-'), pad+j*size+size/2, pad+i*size+size/2+3);
    }
  }));
}

function miniGroupedBox(ctx,W,H,color){
  bg(ctx,W,H);
  function drawBox(cy,x1,q1,med,q3,x2,col){
    ctx.strokeStyle=C.muted; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x1,cy); ctx.lineTo(q1,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q3,cy); ctx.lineTo(x2,cy); ctx.stroke();
    [[x1],[x2]].forEach(([x])=>{ctx.beginPath();ctx.moveTo(x,cy-4);ctx.lineTo(x,cy+4);ctx.stroke();});
    ctx.fillStyle=col+'28'; ctx.fillRect(q1,cy-8,q3-q1,16);
    ctx.strokeStyle=col; ctx.lineWidth=1.2; ctx.strokeRect(q1,cy-8,q3-q1,16);
    ctx.beginPath(); ctx.strokeStyle=col; ctx.lineWidth=2;
    ctx.moveTo(med,cy-8); ctx.lineTo(med,cy+8); ctx.stroke();
  }
  drawBox(H*.3,  10,22,32,44, 52, color);
  drawBox(H*.65, 8, 18,38,52, 58, C.orange);
  ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
  ctx.fillText('Groupe A', 31, H*.3+20);
  ctx.fillText('Groupe B', 33, H*.65+20);
  // Second pair
  drawBox(H*.3,  68,78,88,104,112, C.green);
  drawBox(H*.65, 65,80,92,108,115, C.dark);
}

function miniMeanBars(ctx,W,H,color){
  bg(ctx,W,H);
  const grps=[{v:.68,e:.09,c:color},{v:.44,e:.13,c:C.orange},{v:.82,e:.07,c:C.green}];
  const ml=8,mr=4,mt=6,mb=16, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  const labels=['A','B','C'];
  const bw=w/grps.length;
  grps.forEach(({v,e,c},i)=>{
    const bh=v*(h-4), bx=ml+i*bw+6;
    ctx.fillStyle=c+'cc'; ctx.fillRect(bx, mt+h-bh, bw-12, bh);
    const ex=bx+(bw-12)/2, ey=mt+h-bh, eh=e*(h-4);
    ctx.strokeStyle=C.dark; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(ex,ey-eh); ctx.lineTo(ex,ey+eh); ctx.stroke();
    [[ey-eh],[ey+eh]].forEach(([y])=>{
      ctx.beginPath(); ctx.moveTo(ex-4,y); ctx.lineTo(ex+4,y); ctx.stroke();
    });
    ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i], bx+(bw-12)/2, H-4);
  });
}

function miniViolin(ctx,W,H,color){
  bg(ctx,W,H);
  function drawV(cx,col,shift){
    const hw=11, top=H*.08, bot=H*.92;
    ctx.beginPath();
    for(let i=0;i<=40;i++){
      const t=i/40, y=top+t*(bot-top);
      const yn=((t+shift)-.5)*5.5;
      const xoff=hw*Math.exp(-yn*yn/2)*(1+.3*Math.sin(t*Math.PI*3));
      i===0?ctx.moveTo(cx+xoff,y):ctx.lineTo(cx+xoff,y);
    }
    for(let i=40;i>=0;i--){
      const t=i/40, y=top+t*(bot-top);
      const yn=((t+shift)-.5)*5.5;
      const xoff=hw*Math.exp(-yn*yn/2)*(1+.3*Math.sin(t*Math.PI*3));
      ctx.lineTo(cx-xoff,y);
    }
    ctx.closePath();
    ctx.fillStyle=col+'40'; ctx.fill();
    ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,top+(bot-top)/2,3,0,Math.PI*2);
    ctx.fillStyle=col; ctx.fill();
  }
  drawV(W*.28, color,    0);
  drawV(W*.55, C.orange, .08);
  drawV(W*.82, C.green, -.05);
  ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
  ['A','B','C'].forEach((l,i)=>ctx.fillText(l, W*(.28+i*.27), H*.96));
}

function miniGroupedBars(ctx,W,H,color){
  bg(ctx,W,H);
  const groups=[[.62,.40],[.72,.32],[.48,.78]];
  const ml=8,mr=4,mt=6,mb=16, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  const gw=(w-8)/groups.length, bw=gw/2-3, labels=['G1','G2','G3'];
  groups.forEach(([v1,v2],i)=>{
    const gx=ml+4+i*gw;
    ctx.fillStyle=color+'cc'; ctx.fillRect(gx, mt+h-v1*(h-4), bw, v1*(h-4));
    ctx.fillStyle=C.orange+'cc'; ctx.fillRect(gx+bw+2, mt+h-v2*(h-4), bw, v2*(h-4));
    ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i], gx+bw, H-4);
  });
  // Legend dots
  ctx.fillStyle=color+'cc'; ctx.fillRect(W-38,mt+2,8,6);
  ctx.fillStyle=C.orange+'cc'; ctx.fillRect(W-38,mt+10,8,6);
  ctx.fillStyle=C.muted; ctx.font='7px "DM Sans",sans-serif'; ctx.textAlign='left';
  ctx.fillText('M.1',W-28,mt+8); ctx.fillText('M.2',W-28,mt+16);
}

function miniStackedBars(ctx,W,H,color){
  bg(ctx,W,H);
  const stacks=[[.50,.30,.20],[.38,.36,.26],[.62,.24,.14]];
  const cols=[color+'cc', C.orange+'cc', C.green+'cc'];
  const ml=8,mr=4,mt=6,mb=16, w=W-ml-mr, h=H-mt-mb;
  axis(ctx,ml,mt,W,H,mb,mr);
  const bw=(w-8)/stacks.length, labels=['G1','G2','G3'];
  stacks.forEach((stack,i)=>{
    const bx=ml+4+i*bw+3; let curY=mt+h;
    stack.forEach((v,j)=>{
      const bh=v*(h-4);
      ctx.fillStyle=cols[j]; ctx.fillRect(bx, curY-bh, bw-6, bh);
      ctx.strokeStyle='white'; ctx.lineWidth=.8;
      ctx.strokeRect(bx, curY-bh, bw-6, bh);
      curY-=bh;
    });
    ctx.fillStyle=C.muted; ctx.font='8px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i], bx+(bw-6)/2, H-4);
  });
}

function miniContingency(ctx,W,H,color){
  bg(ctx,W,H);
  const rows=3, cols=3;
  const pad=18, cw=(W-pad)/cols, ch=(H-pad)/rows;
  const rowLbl=['A','B','C'], colLbl=['X','Y','Z'];
  const vals=[[82,24,51],[31,91,44],[65,43,73]];
  vals.forEach((row,i)=>row.forEach((v,j)=>{
    const a=v/100;
    ctx.fillStyle=a>.65?`rgba(200,16,46,${a*.85+.1})`:a>.45?`rgba(255,121,0,${a*.7+.1})`:`rgba(0,130,80,${a*.5+.15})`;
    ctx.fillRect(pad+j*cw+1, pad+i*ch+1, cw-2, ch-2);
    ctx.fillStyle='white'; ctx.font='bold 9px "DM Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText(v, pad+j*cw+cw/2, pad+i*ch+ch/2+3);
  }));
  // Headers
  ctx.fillStyle=C.dark; ctx.font='bold 8px "DM Sans",sans-serif'; ctx.textAlign='center';
  colLbl.forEach((l,j)=>ctx.fillText(l, pad+j*cw+cw/2, 12));
  ctx.textAlign='right';
  rowLbl.forEach((l,i)=>ctx.fillText(l, pad-3, pad+i*ch+ch/2+3));
}

function drawStar(ctx, cx, cy, r, color){
  const pts=5; const inner=r*.45;
  ctx.beginPath();
  for(let i=0;i<pts*2;i++){
    const a=i*Math.PI/pts - Math.PI/2;
    const rad=i%2===0?r:inner;
    const x=cx+rad*Math.cos(a), y=cy+rad*Math.sin(a);
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle=color; ctx.fill();
  ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.stroke();
}
