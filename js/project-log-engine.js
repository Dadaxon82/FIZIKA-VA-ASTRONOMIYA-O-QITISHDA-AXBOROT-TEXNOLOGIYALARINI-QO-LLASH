/**
 * PROJECT-LOG-ENGINE.JS - Google Antigravity AI: 15-Lab Semester Project Log Tracker
 */

const semesterLabs = [
  { id: 1, title: "1-Lab: Fizik Jarayonni Tanlash va Erkinlik Darajalarini Ajratish", tool: "MagicSchool AI", weight: 5 },
  { id: 2, title: "2-Lab: Nazariy Differensial Tenglamalar Sistemasini Tuzish", tool: "Gemini 1.5 Pro", weight: 6 },
  { id: 3, title: "3-Lab: PhET va Vascak.cz Simulyatsiyalarini Teskari Muhandislik Tahlili", tool: "PhET / Vascak", weight: 7 },
  { id: 4, title: "4-Lab: Saqlanish Qonunlari va Chegaraviy Shartlarni Belgilash", tool: "WolframAlpha", weight: 6 },
  { id: 5, title: "5-Lab: Sonli Integrallash: Forward Euler va Eyler-Kromer Kodlash", tool: "Claude 3.5 Sonnet", weight: 7 },
  { id: 6, title: "6-Lab: 4-Tartibli Runge-Kutta (RK4) Algoritmini Qurish", tool: "Claude 3.5 Sonnet", weight: 8 },
  { id: 7, title: "7-Lab: HTML5 Canvas Ekranida Koordinatalar Transformatsiyasi (toScreenX/Y)", tool: "Vanilla JS / Canvas", weight: 7 },
  { id: 8, title: "8-Lab: Real Vaqtli Vektorlar (v, a, F) va Faza Fazosi Chizmasi", tool: "Canvas Dvigatel", weight: 7 },
  { id: 9, title: "9-Lab: Interaktiv Boshqaruv: Slayderlar, Tugmalar va Telemetriya HUD", tool: "DOM & CSS Glass", weight: 6 },
  { id: 10, title: "10-Lab: ChatGPT Code Interpreter yordamida Debugging va Xatolar Tahlili", tool: "Code Interpreter", weight: 8 },
  { id: 11, title: "11-Lab: Midjourney v6 yordamida Ilmiy Laboratoriya Teksturalarini Sintezlash", tool: "Midjourney v6", weight: 6 },
  { id: 12, title: "12-Lab: Muxlisa AI / ElevenLabs orqali Fizik Izohlarni Audio-Narratsiya Qilish", tool: "ElevenLabs / TTS", weight: 7 },
  { id: 13, title: "13-Lab: Otter.ai yordamida Laboratoriya Qaydlari va Hisobot Transkripsiyasi", tool: "Otter.ai", weight: 6 },
  { id: 14, title: "14-Lab: Undetectable AI va Turnitin orqali Akademik Originallik Tekshiruvi", tool: "Undetectable AI", weight: 6 },
  { id: 15, title: "15-Lab: Yakuniy Capstone Loyihani GitHub Pages da Nashr Qilish va Himoya", tool: "Google Antigravity AI", weight: 8 }
];

let completedLabs = JSON.parse(localStorage.getItem('antigravity_completed_labs') || '[]');

window.toggleLabStatus = function(labId) {
  const idx = completedLabs.indexOf(labId);
  if (idx === -1) {
    completedLabs.push(labId);
  } else {
    completedLabs.splice(idx, 1);
  }
  localStorage.setItem('antigravity_completed_labs', JSON.stringify(completedLabs));
  renderProjectLog();
};

window.renderProjectLog = function() {
  const listEl = document.getElementById('project-log-list');
  const progressFill = document.getElementById('log-progress-fill');
  const progressText = document.getElementById('log-progress-text');
  const badgeCount = document.getElementById('log-badge-count');
  if (!listEl) return;

  listEl.innerHTML = '';
  let totalScore = 0;
  let earnedScore = 0;

  semesterLabs.forEach(lab => {
    totalScore += lab.weight;
    const isDone = completedLabs.includes(lab.id);
    if (isDone) earnedScore += lab.weight;

    const item = document.createElement('div');
    item.className = `log-lab-item ${isDone ? 'completed' : ''}`;
    item.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:${isDone ? 'rgba(52, 211, 153, 0.06)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${isDone ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; margin-bottom:8px; cursor:pointer; transition:all 0.2s ease;`;
    item.onclick = () => window.toggleLabStatus(lab.id);

    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:1.2rem;">${isDone ? '✅' : '⚪'}</span>
        <div>
          <div style="font-weight:600; font-size:0.92rem; color:${isDone ? '#34D399' : '#F8FAFC'}; text-decoration:${isDone ? 'line-through' : 'none'};">${lab.title}</div>
          <div style="font-size:0.8rem; color:#94A3B8;">Asosiy AI Vosita: <strong style="color:#38BDF8;">${lab.tool}</strong></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="badge ${isDone ? 'badge-emerald' : 'badge-cyan'}" style="font-size:0.75rem;">+${lab.weight} Ball</span>
      </div>
    `;
    listEl.appendChild(item);
  });

  const pct = Math.round((earnedScore / totalScore) * 100);
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${pct}% (${completedLabs.length}/15 Lab Bajarildi - ${earnedScore}/${totalScore} Ball)`;
  if (badgeCount) badgeCount.textContent = `${completedLabs.length} / 15`;
};

window.exportProjectLog = function() {
  let md = "# GOOGLE ANTIGRAVITY AI - TALABA LOYIHA JURNALI (PROJECT LOG)\n\n";
  md += `**Sana:** ${new Date().toLocaleDateString()}\n`;
  md += `**Bajarilgan Bosqichlar:** ${completedLabs.length} / 15\n\n`;
  md += "| № | Laboratoriya Bosqichi | AI Vosita | Holati | Ball |\n";
  md += "|---|---|---|---|---|\n";

  semesterLabs.forEach(lab => {
    const isDone = completedLabs.includes(lab.id);
    md += `| ${lab.id} | ${lab.title} | ${lab.tool} | ${isDone ? 'Bajarildi (100%)' : 'Jarayonda'} | ${isDone ? lab.weight : 0}/${lab.weight} |\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Antigravity_Loyiha_Jurnali_Hisobot.md';
  link.click();
  if (window.showToast) window.showToast("Loyiha jurnali Markdown hisobot sifatida yuklab olindi!");
};

document.addEventListener('DOMContentLoaded', () => {
  renderProjectLog();
});
