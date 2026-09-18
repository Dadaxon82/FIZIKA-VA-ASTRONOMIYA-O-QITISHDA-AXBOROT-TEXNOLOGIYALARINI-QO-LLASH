(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const text = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Mobile navigation
  const menuButton = $('.menu-toggle');
  const nav = $('.nav-links');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '✕' : '☰';
  });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  }));

  // Canvas helper: preserve CSS size while rendering sharply on HiDPI screens.
  function canvasContext(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  // Simulator tabs
  const tabs = $$('.sim-tab');
  const panels = $$('.sim-content');
  function switchSimulator(name) {
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.sim === name));
    panels.forEach(panel => { panel.hidden = panel.id !== `sim-${name}`; });
  }
  tabs.forEach(tab => tab.addEventListener('click', () => switchSimulator(tab.dataset.sim)));
  switchSimulator('pendulum');

  // Accurate damped pendulum: semi-implicit Euler with fixed time step.
  const pendulum = { running:true, theta:Math.PI/3, omega:0, L:1.5, g:9.81, gamma:.15, t:0, path:[] };
  const pCanvas = $('#canvas-pendulum'), phaseCanvas = $('#canvas-phase');
  const p = { L:$('#pend-L'), theta:$('#pend-theta'), gamma:$('#pend-gamma'), g:$('#pend-g'), play:$('#pend-play'), reset:$('#pend-reset') };
  function updatePendulumLabels() {
    text('#pend-L-value', `${pendulum.L.toFixed(2)} m`);
    text('#pend-theta-value', `${(pendulum.theta * 180 / Math.PI).toFixed(1)}°`);
    text('#pend-gamma-value', `${pendulum.gamma.toFixed(2)} s⁻¹`);
    text('#pend-g-value', `${pendulum.g.toFixed(2)} m/s²`);
  }
  function resetPendulum() { pendulum.L=Number(p.L.value); pendulum.theta=Number(p.theta.value)*Math.PI/180; pendulum.gamma=Number(p.gamma.value); pendulum.g=Number(p.g.value); pendulum.omega=0; pendulum.t=0; pendulum.path=[]; updatePendulumLabels(); }
  function togglePendulum() { pendulum.running=!pendulum.running; p.play.textContent=pendulum.running ? 'To‘xtatish' : 'Boshlash'; }
  [p.L,p.theta,p.gamma,p.g].forEach(el => el?.addEventListener('input', resetPendulum));
  p.play?.addEventListener('click', togglePendulum); p.reset?.addEventListener('click', resetPendulum);

  function drawPendulum() {
    if (!pCanvas || !phaseCanvas) return;
    const a=canvasContext(pCanvas), ctx=a.ctx, w=a.width, h=a.height; ctx.clearRect(0,0,w,h);
    const pivotX=w/2, pivotY=28, length=Math.min(w*.38,h*.78)*(pendulum.L/3);
    const bobX=pivotX+Math.sin(pendulum.theta)*length, bobY=pivotY+Math.cos(pendulum.theta)*length;
    ctx.strokeStyle='#60a5fa'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(pivotX,pivotY); ctx.lineTo(bobX,bobY); ctx.stroke();
    ctx.fillStyle='#e0f2fe'; ctx.beginPath(); ctx.arc(pivotX,pivotY,5,0,Math.PI*2); ctx.fill();
    const g=ctx.createRadialGradient(bobX-3,bobY-4,1,bobX,bobY,17); g.addColorStop(0,'#fff'); g.addColorStop(.4,'#22d3ee'); g.addColorStop(1,'#2563eb'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bobX,bobY,14,0,Math.PI*2); ctx.fill();
    const ph=canvasContext(phaseCanvas), pc=ph.ctx, pw=ph.width, phh=ph.height; pc.clearRect(0,0,pw,phh); pc.strokeStyle='#24344f'; pc.lineWidth=1;
    for(let i=1;i<6;i++){pc.beginPath();pc.moveTo(i*pw/6,0);pc.lineTo(i*pw/6,phh);pc.moveTo(0,i*phh/6);pc.lineTo(pw,i*phh/6);pc.stroke();}
    pendulum.path.push([pendulum.theta,pendulum.omega]); if(pendulum.path.length>500) pendulum.path.shift(); pc.beginPath(); pendulum.path.forEach(([x,y],i)=>{const px=pw/2+x*pw/2.8, py=phh/2-y*phh/5; i?pc.lineTo(px,py):pc.moveTo(px,py);}); pc.strokeStyle='#a78bfa'; pc.lineWidth=2; pc.stroke();
    text('#pend-stat',`t ${pendulum.t.toFixed(2)} s · ω ${pendulum.omega.toFixed(2)} rad/s`);
  }

  // Lorentz helix: exact parametric solution for uniform B along z.
  const lorentz={running:true,B:1.5,q:1,vp:2,vz:.8,t:0};
  const lCanvas=$('#canvas-lorentz');
  const l={B:$('#lorentz-B'),q:$('#lorentz-q'),vp:$('#lorentz-vp'),vz:$('#lorentz-vz'),play:$('#lorentz-play'),reset:$('#lorentz-reset')};
  function updateLorentz(){ lorentz.B=Number(l.B.value);lorentz.q=Number(l.q.value);lorentz.vp=Number(l.vp.value);lorentz.vz=Number(l.vz.value); text('#lorentz-B-value',`${lorentz.B.toFixed(1)} T`);text('#lorentz-q-value',`${lorentz.q>0?'+':''}${lorentz.q.toFixed(1)} e`);text('#lorentz-vp-value',`${lorentz.vp.toFixed(1)} m/s`);text('#lorentz-vz-value',`${lorentz.vz.toFixed(1)} m/s`); const wc=Math.abs(lorentz.q)*lorentz.B; text('#lorentz-stat',`ωc ${wc.toFixed(2)} rad/s · R ${ (lorentz.vp/Math.max(wc,.01)).toFixed(2)} m`); }
  function resetLorentz(){lorentz.t=0;updateLorentz();} function toggleLorentz(){lorentz.running=!lorentz.running;l.play.textContent=lorentz.running?'To‘xtatish':'Boshlash';}
  [l.B,l.q,l.vp,l.vz].forEach(el=>el?.addEventListener('input',updateLorentz)); l.play?.addEventListener('click',toggleLorentz);l.reset?.addEventListener('click',resetLorentz);
  function drawLorentz(){if(!lCanvas)return;const a=canvasContext(lCanvas),ctx=a.ctx,w=a.width,h=a.height;ctx.clearRect(0,0,w,h);if(lorentz.running)lorentz.t+=.025;const wc=Math.abs(lorentz.q)*lorentz.B, r=Math.min(w,h)*.22, turns=lorentz.t*wc*1.8;ctx.strokeStyle='#22d3ee';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<260;i++){const u=i/259, ang=turns+u*6*Math.PI, x=w*.18+u*w*.64, y=h/2+Math.sin(ang)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.fillStyle='#f0fdfa';ctx.beginPath();ctx.arc(w*.82,h/2+Math.sin(turns+6*Math.PI)*r,8,0,Math.PI*2);ctx.fill();}

  // Doppler wavefronts: source position and fronts use v_source / v_wave ratio.
  const doppler={running:true,mach:.6,period:12,t:0};const dCanvas=$('#canvas-doppler');const d={mach:$('#doppler-mach'),period:$('#doppler-period'),play:$('#doppler-play'),reset:$('#doppler-reset')};
  function updateDoppler(){doppler.mach=Number(d.mach.value);doppler.period=Number(d.period.value);text('#doppler-mach-value',`${doppler.mach.toFixed(2)} M`);text('#doppler-period-value',`${doppler.period} kadr`);text('#doppler-stat',doppler.mach<1?'Subsonik':doppler.mach<1.2?'Tovushga yaqin':'Supersonik');} function toggleDoppler(){doppler.running=!doppler.running;d.play.textContent=doppler.running?'To‘xtatish':'Boshlash';} function resetDoppler(){doppler.t=0;updateDoppler();}[d.mach,d.period].forEach(el=>el?.addEventListener('input',updateDoppler));d.play?.addEventListener('click',toggleDoppler);d.reset?.addEventListener('click',resetDoppler);
  function drawDoppler(){if(!dCanvas)return;const a=canvasContext(dCanvas),ctx=a.ctx,w=a.width,h=a.height;ctx.clearRect(0,0,w,h);if(doppler.running)doppler.t+=.016;const sx=w*.22+((doppler.t*35*doppler.mach)%(w*.58)),sy=h/2;for(let i=0;i<18;i++){const age=(doppler.t*55-i*doppler.period*2)% (w*.75);if(age<0)continue;const center=sx-age*doppler.mach;ctx.beginPath();ctx.arc(center,sy,age,0,Math.PI*2);ctx.strokeStyle=`rgba(251,113,133,${1-age/(w*.8)})`;ctx.stroke();}ctx.fillStyle='#fb7185';ctx.beginPath();ctx.arc(sx,sy,9,0,Math.PI*2);ctx.fill();}

  const young={lambda:532,d:.25,D:1.2};const yCanvas=$('#canvas-young');const y={lambda:$('#young-lambda'),d:$('#young-d'),D:$('#young-D')};function updateYoung(){young.lambda=Number(y.lambda.value);young.d=Number(y.d.value);young.D=Number(y.D.value);text('#young-lambda-value',`${young.lambda} nm`);text('#young-d-value',`${young.d.toFixed(2)} mm`);text('#young-D-value',`${young.D.toFixed(2)} m`);text('#young-stat',`Δx ${(young.lambda*young.D/young.d).toFixed(2)} mm`);} [y.lambda,y.d,y.D].forEach(el=>el?.addEventListener('input',updateYoung));function drawYoung(){if(!yCanvas)return;const a=canvasContext(yCanvas),ctx=a.ctx,w=a.width,h=a.height;ctx.clearRect(0,0,w,h);const spacing=young.lambda*young.D/young.d;for(let x=0;x<w;x++){const intensity=.08+.92*Math.cos(Math.PI*x/(spacing*1.8))**2;ctx.fillStyle=`rgba(52,211,153,${intensity})`;ctx.fillRect(x,0,1,h);}ctx.fillStyle='#e2e8f0';ctx.font='12px JetBrains Mono';ctx.fillText('I(x) = I₀ cos²(πx/Δx)',16,24);}

  // AI prompt and score tools.
  $('#generate-prompt')?.addEventListener('click',()=>{const topic=$('#topic').value.trim()||'Garmonik tebranishlar';const level=$('#level').value;$('#prompt-output').textContent=`Siz fizika o‘qituvchisiz.\nMavzu: ${topic}\nDaraja: ${level}\n\n10 ta diagnostik savol tuzing. Har bir savolda to‘g‘ri javob, qisqa izoh va tipik xatoni ko‘rsating. Yakunda natijaga qarab 3 ta individual o‘quv yo‘lini tavsiya qiling.`;});
  async function copyScenario(){const value='Hook → Core Concept → Misconception → Simulation Task\n\nFizik hodisani sodda tushuntiring, formulani LaTeXda yozing va HTML Canvas simulyatsiyasi uchun aniq topshiriq bering.';try{await navigator.clipboard.writeText(value);text('#copy-status','Nusxa olindi ✓');setTimeout(()=>text('#copy-status','Nusxa olish'),1500);}catch{alert('Nusxa olish uchun brauzer ruxsati berilmadi.');}} $('#copy-scenario')?.addEventListener('click',copyScenario);
  const weights=[.3,.25,.2,.15,.1];function calculateScore(){let total=0;weights.forEach((weight,i)=>{const input=$(`#score-${i+1}`);const value=Number(input.value);total+=value*weight;text(`#score-${i+1}-value`,`${value} ball`);});text('#total-score',`Umumiy: ${total.toFixed(1)} / 100`);} $$('.score').forEach(el=>el.addEventListener('input',calculateScore));

  function frame(){if(pendulum.running){const alpha=-(pendulum.g/pendulum.L)*Math.sin(pendulum.theta)-pendulum.gamma*pendulum.omega;pendulum.omega+=alpha*pendulum.dt;pendulum.theta+=pendulum.omega*pendulum.dt;pendulum.t+=pendulum.dt;}drawPendulum();drawLorentz();drawDoppler();drawYoung();requestAnimationFrame(frame);}
  window.addEventListener('resize',()=>{drawPendulum();drawLorentz();drawDoppler();drawYoung();});
  resetPendulum();updateLorentz();updateDoppler();updateYoung();calculateScore();frame();
})();
