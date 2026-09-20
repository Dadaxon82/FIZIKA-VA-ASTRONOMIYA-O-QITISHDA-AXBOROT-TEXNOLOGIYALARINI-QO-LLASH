/**
 * UI-CONTROLLER.JS - Universal UI Controller, Navigation Drawer, Tabs, Code Copying, Toasts & Quiz Engines
 */

// ==========================================
// QUIZ 1 ENGINE (Mavzu 1: AI Paradigmasi)
// ==========================================
const quiz1Questions = [
  {
    id: 1,
    question: "Matematik mayatnikning erkin tebranishlarida vaqt o'tishi bilan to'liq mexanik energiya sun'iy o'sib ketsa, bunga qanday sabab bo'lgan?",
    options: [
      { text: "A) Burchak radianda emas, gradusda hisoblangan", correct: false, note: "Gradus xatoligi davrni buzadi, lekin energiyaning eksponensial portlashiga sabab bo'lmaydi." },
      { text: "B) Forward Euler (Klassik Eyler) usuli qo'llangan bo'lib, u simplektik emas", correct: true, note: "Aynan Klassik Eyler faza fazosi maydonini kengaytiradi va har qadamda energiyani sun'iy oshiradi. Eyler-Kromer yoki RK4 ishlatish shart!" },
      { text: "C) Canvas ekrani har kadrda tozalanmagan", correct: false, note: "Canvas tozalanishi faqat vizual grafikaga ta'sir qiladi, fizik hisoblarga emas." }
    ]
  },
  {
    id: 2,
    question: "JavaScript dasturlash tilida Math.sin(30) yozilsa, nega kutilgan 0.5 qiymat chiqmaydi?",
    options: [
      { text: "A) Math.sin faqat butun sonlar bilan ishlaydi", correct: false, note: "Math.sin haqiqiy sonlar bilan ishlaydi." },
      { text: "B) Argument gradusda berilgan, JS esa burchakni faqat radianda kutadi (30 * Math.PI / 180)", correct: true, note: "JavaScript trigonometrik funksiyalari (sin, cos, tan) doimo radianda hisoblaydi." },
      { text: "C) Math kutubxonasi yuklanmagan", correct: false, note: "Math obyekti JS da global o'rnatilgan." }
    ]
  },
  {
    id: 3,
    question: "Bir jinsli magnit maydonida (E = 0) harakatlanayotgan zaryadlangan zarrachaning kinetik energiyasi haqida qaysi fikr to'g'ri?",
    options: [
      { text: "A) Kinetik energiya doimiy saqlanadi (Lorents kuchi zarracha tezligiga doimo perpendikulyar va ish bajarmaydi)", correct: true, note: "To'g'ri! F = q(v x B) => F . v = 0 => dE_k/dt = 0. Magnit maydoni faqat tezlik yo'nalishini o'zgartiradi." },
      { text: "B) Zarracha tezlashgani uchun kinetik energiya oshadi", correct: false, note: "Magnit maydonida tezlik moduli o'zgarmaydi." },
      { text: "C) Kinetik energiya kamayib, potensial energiyaga aylanadi", correct: false, note: "Statsionar magnit maydonida potensial energiya o'zgarmaydi." }
    ]
  }
];

let userAnswers1 = {};

window.selectQuizOption = function(qId, optIdx) {
  userAnswers1[qId] = optIdx;
  const container = document.getElementById(`quiz-options-${qId}`);
  if (!container) return;
  const items = container.querySelectorAll('.quiz-option-card');
  items.forEach((item, idx) => {
    const isSelected = (idx === optIdx);
    item.classList.toggle('selected', isSelected);
    const radio = item.querySelector('input[type="radio"]');
    if (radio) radio.checked = isSelected;
    const dot = item.querySelector('.quiz-dot');
    if (dot) dot.textContent = isSelected ? '🔘' : '⚪';
  });
};

window.checkDiagnosticQuiz = function() {
  const feedbackEl = document.getElementById('diag-feedback');
  if (!feedbackEl) return;

  let correctCount = 0;
  let totalCount = quiz1Questions.length;
  let allAnswered = true;

  quiz1Questions.forEach(q => {
    if (userAnswers1[q.id] === undefined) allAnswered = false;
  });

  if (!allAnswered) {
    feedbackEl.innerHTML = `<div style="background:#1E293B; border:1px solid #F59E0B; color:#FBBF24; padding:12px 16px; border-radius:10px; margin-top:14px; display:flex; align-items:center; gap:10px;">
      <span style="font-size:1.2rem;">⚠️</span><span>Iltimos, barcha 3 ta savolga javob belgilang!</span>
    </div>`;
    return;
  }

  let htmlResult = `<div style="background:rgba(15, 23, 42, 0.95); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:20px; margin-top:16px;">
    <h4 style="font-size:1.15rem; margin-bottom:12px; color:#38BDF8;">📊 1-Modul Diagnostika Natijalari:</h4>`;

  quiz1Questions.forEach(q => {
    const userOptIdx = userAnswers1[q.id];
    const opt = q.options[userOptIdx];
    const isCorrect = opt.correct;
    if (isCorrect) correctCount++;

    htmlResult += `<div style="margin-bottom:10px; padding:10px 14px; border-radius:8px; background:${isCorrect ? 'rgba(52, 211, 153, 0.08)' : 'rgba(244, 63, 94, 0.08)'}; border:1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'};">
      <div style="font-weight:600; font-size:0.92rem; color:${isCorrect ? '#34D399' : '#F43F5E'};">
        ${isCorrect ? '✅' : '❌'} ${q.id}-Savol: ${isCorrect ? 'To\'g\'ri!' : 'Xato!'}
      </div>
      <div style="font-size:0.85rem; color:#94A3B8; margin-top:4px;">${opt.note}</div>
    </div>`;
  });

  let cluster = 'A Klaster (Boshlang\'ich / Remedial)';
  let clusterColor = '#38BDF8';
  let clusterDesc = 'Fizik modellarni bosqichma-bosqich Scaffolding va vizual yo\'riqnomalar orqali o\'zlashtirish tavsiya etiladi.';

  if (correctCount === 2) {
    cluster = 'B Klaster (O\'rta / Standart)';
    clusterColor = '#34D399';
    clusterDesc = '2D Canvas dvigatellarini mustaqil loyihalash va simplektik Eyler-Kromer algoritmlarini qo\'llash tavsiya etiladi.';
  } else if (correctCount === 3) {
    cluster = 'C Klaster (Ilg\'or / Research)';
    clusterColor = '#C084FC';
    clusterDesc = '3D WebGL (Three.js), 4-tartibli Runge-Kutta (RK4) va Boris particle pusher integratsiyasi bo\'yicha murakkab loyihalarga yo\'naltiriladi.';
  }

  htmlResult += `<div style="margin-top:14px; padding:16px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid ${clusterColor}; text-align:center;">
    <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:${clusterColor}; font-weight:700;">Tavsiya Etilgan O\'quv Trayektoriyasi:</div>
    <div style="font-size:1.3rem; font-weight:800; color:#F8FAFC; margin:6px 0;">${cluster}</div>
    <div style="font-size:0.9rem; color:#CBD5E1;">${clusterDesc}</div>
    <div style="margin-top:8px; font-family:var(--font-mono); font-size:0.95rem; color:${clusterColor};">Umumiy Natija: ${correctCount} / ${totalCount} ball (${((correctCount/totalCount)*100).toFixed(0)}%)</div>
  </div></div>`;

  feedbackEl.innerHTML = htmlResult;
};


// ==========================================
// QUIZ 2 ENGINE (Mavzu 2: Modellashtirish)
// ==========================================
const quiz2Questions = [
  {
    id: 1,
    question: "Kvadratik havo qarshiligida (F_drag = -k*v*v) harakatlanayotgan jism uchun x va y o'qlari bo'yicha differensial tenglamalar qanday yoziladi?",
    options: [
      { text: "A) dv_x/dt = -k*v_x^2,  dv_y/dt = -g - k*v_y^2", correct: false, note: "Xato! Havo qarshiligi vektor bo'lib, o'qlarga v_x/|v| va v_y/|v| nisbatda proyeksiyalanadi." },
      { text: "B) dv_x/dt = -(k/m)*sqrt(v_x^2 + v_y^2)*v_x,  dv_y/dt = -g - (k/m)*sqrt(v_x^2 + v_y^2)*v_y", correct: true, note: "To'g'ri! F_drag = -k*|v|*v vektorini proyeksiyalash orqali to'g'ri bog'langan sistema olinadi." },
      { text: "C) dv_x/dt = 0,  dv_y/dt = -g", correct: false, note: "Bu qarshiliksiz ideal vakuum formulasidir." }
    ]
  },
  {
    id: 2,
    question: "Nega brauzer Canvas ekranida y koordinatani y_screen = H - (y_physics * scale) ko'rinishida o'zgartirish shart?",
    options: [
      { text: "A) Canvasda Y o'qi pastga yo'nalgan, Dekart koordinatalarida esa yuqoriga yo'nalgan", correct: true, note: "To'g'ri! Ekran piksellarida (0,0) chap yuqori burchakda joylashgani uchun Y o'qini teskari o'girish shart." },
      { text: "B) Gravitatsiya kuchini yo'qotish uchun", correct: false, note: "Gravitatsiya ekranga bog'liq emas, fizik qonundir." },
      { text: "C) JavaScript faqat manfiy sonlarni qabul qilgani uchun", correct: false, note: "JavaScript barcha haqiqiy sonlar bilan ishlaydi." }
    ]
  },
  {
    id: 3,
    question: "Jism devordan mutlaq noelastik urilganda (e = 0), to'qnashuvdan keyin uning tezligi qanday bo'ladi?",
    options: [
      { text: "A) v' = -v (to'liq teskari qaytadi)", correct: false, note: "Bu e = 1 (mutlaq elastik) holatidir." },
      { text: "B) v' = 0 (jism devorga yopishib to'xtaydi, kinetik energiya issiqlikka aylanadi)", correct: true, note: "To'g'ri! e = 0 bo'lganda tiklanish sodir bo'lmaydi va barcha kinetik energiya yo'qotiladi." },
      { text: "C) v' = 2*v", correct: false, note: "Energiya saqlanish qonuniga zid." }
    ]
  }
];

let userAnswers2 = {};

window.selectQuiz2Option = function(qId, optIdx) {
  userAnswers2[qId] = optIdx;
  const container = document.getElementById(`quiz2-options-${qId}`);
  if (!container) return;
  const items = container.querySelectorAll('.quiz-option-card');
  items.forEach((item, idx) => {
    const isSelected = (idx === optIdx);
    item.classList.toggle('selected', isSelected);
    const radio = item.querySelector('input[type="radio"]');
    if (radio) radio.checked = isSelected;
    const dot = item.querySelector('.quiz-dot');
    if (dot) dot.textContent = isSelected ? '🔘' : '⚪';
  });
};

window.checkDiagnostic2Quiz = function() {
  const feedbackEl = document.getElementById('diag2-feedback');
  if (!feedbackEl) return;

  let correctCount = 0;
  let totalCount = quiz2Questions.length;
  let allAnswered = true;

  quiz2Questions.forEach(q => {
    if (userAnswers2[q.id] === undefined) allAnswered = false;
  });

  if (!allAnswered) {
    feedbackEl.innerHTML = `<div style="background:#1E293B; border:1px solid #F59E0B; color:#FBBF24; padding:12px 16px; border-radius:10px; margin-top:14px; display:flex; align-items:center; gap:10px;">
      <span style="font-size:1.2rem;">⚠️</span><span>Iltimos, barcha 3 ta savolga javob belgilang!</span>
    </div>`;
    return;
  }

  let htmlResult = `<div style="background:rgba(15, 23, 42, 0.95); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:20px; margin-top:16px;">
    <h4 style="font-size:1.15rem; margin-bottom:12px; color:#38BDF8;">📊 2-Modul Modellashtirish Diagnostikasi Natijasi:</h4>`;

  quiz2Questions.forEach(q => {
    const userOptIdx = userAnswers2[q.id];
    const opt = q.options[userOptIdx];
    const isCorrect = opt.correct;
    if (isCorrect) correctCount++;

    htmlResult += `<div style="margin-bottom:10px; padding:10px 14px; border-radius:8px; background:${isCorrect ? 'rgba(52, 211, 153, 0.08)' : 'rgba(244, 63, 94, 0.08)'}; border:1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'};">
      <div style="font-weight:600; font-size:0.92rem; color:${isCorrect ? '#34D399' : '#F43F5E'};">
        ${isCorrect ? '✅' : '❌'} ${q.id}-Savol: ${isCorrect ? 'To\'g\'ri!' : 'Xato!'}
      </div>
      <div style="font-size:0.85rem; color:#94A3B8; margin-top:4px;">${opt.note}</div>
    </div>`;
  });

  let cluster = 'B Klaster (2D Modellashtirish & Simplektik Eyler-Kromer)';
  let clusterColor = '#34D399';
  let clusterDesc = '2D vektor harakat, gravitatsiya va simplektik Eyler-Kromer integratori bo\'yicha mustaqil laboratoriya ishlari tavsiya etiladi.';

  if (correctCount === 3) {
    cluster = 'C Klaster (No-chiziqli Tizimlar, Aerodinamik Drag & RK4 Integratori)';
    clusterColor = '#C084FC';
    clusterDesc = 'Kvadratik qarshilik kuchi, differensial tenglamalar sistemasi va 4-tartibli Runge-Kutta (RK4) integratsiyasi bo\'yicha ilmiy simulyatsiyalar tavsiya etiladi.';
  } else if (correctCount <= 1) {
    cluster = 'A Klaster (1D Harakat & Skalyar Tenglamalar Asoslari)';
    clusterColor = '#38BDF8';
    clusterDesc = 'Boshlang\'ich differensial hisob va sodda Eyler qadami bo\'yicha Scaffolding yo\'riqnomalar tavsiya etiladi.';
  }

  htmlResult += `<div style="margin-top:14px; padding:16px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid ${clusterColor}; text-align:center;">
    <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:${clusterColor}; font-weight:700;">Tavsiya Etilgan Modellashtirish Trayektoriyasi:</div>
    <div style="font-size:1.25rem; font-weight:800; color:#F8FAFC; margin:6px 0;">${cluster}</div>
    <div style="font-size:0.9rem; color:#CBD5E1;">${clusterDesc}</div>
    <div style="margin-top:8px; font-family:var(--font-mono); font-size:0.95rem; color:${clusterColor};">Natija: ${correctCount} / ${totalCount} ball (${((correctCount/totalCount)*100).toFixed(0)}%)</div>
  </div></div>`;

  feedbackEl.innerHTML = htmlResult;
};


// ==========================================
// COMMON UI (DRAWER, TABS, TOASTS, PROMPTS)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Drawer
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  const toggleDrawer = () => {
    const isOpen = mobileDrawer.classList.toggle('open');
    drawerOverlay.classList.toggle('open', isOpen);
    hamburgerBtn.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', toggleDrawer);
  drawerLinks.forEach(link => link.addEventListener('click', toggleDrawer));

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      const parent = btn.closest('.tabs-container') || document;
      
      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Toasts
  window.showToast = (message) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Copy Prompt
  document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-prompt') || btn.parentElement.innerText;
      navigator.clipboard.writeText(text).then(() => {
        window.showToast("Prompt nusxalandi!");
      });
    });
  });
});
