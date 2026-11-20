if (!window.__t) window.__t = function (s, p) { return p ? s.replace(/\{(\d+)\}/g, function (m, i) { return p[i]; }) : s; };
/**
 * DEBUGGING-LAB.JS - 4 Interactive Sandboxes for Physical Modeling Errors
 */

const debugSandboxes = {
  angle: {
    run: (code) => {
      try {
        let angle = 45;
        let fn = new Function('angle', code + '; return typeof result !== "undefined" ? result : null;');
        let res = fn(angle);
        if (Math.abs(res - Math.sin(Math.PI / 4)) < 0.001) {
          return { success: true, msg: __t("✅ TO‘G‘RI: Burchak radianga o‘girildi! sin(45°) ≈ ") + res.toFixed(4) + __t(" (Nazariy: 0.7071)") };
        } else if (Math.abs(res - Math.sin(45)) < 0.001) {
          return { success: false, msg: __t("❌ XATO: Math.sin(45) gradusda qolib ketdi! Natija: ") + res.toFixed(4) + __t(" (Kutilayotgan: 0.7071)") };
        }
        return { success: false, msg: __t("⚠️ Qaytarilgan qiymat mos kelmadi: ") + res };
      } catch (err) {
        return { success: false, msg: __t("Sintaksis xatosi: ") + err.message };
      }
    }
  },
  euler: {
    run: (code) => {
      try {
        let x = 1.0, v = 0.0, dt = 0.1, omega = 2.0;
        let fn = new Function('x', 'v', 'dt', 'omega', code + '; return {x, v};');
        let state = {x: 1.0, v: 0.0};
        for(let i=0; i<60; i++) {
          state = fn(state.x, state.v, dt, omega);
        }
        let E0 = 0.5 * (omega*omega * 1.0*1.0 + 0.0);
        let E = 0.5 * (omega*omega * state.x*state.x + state.v*state.v);
        let drift = (E - E0) / E0;
        if (drift < 0.25) {
          return { success: true, msg: __t("✅ TO‘G‘RI: Simplektik Eyler-Kromer (v yangilanib, so‘ng x hisoblandi). E = ") + E.toFixed(3) + __t(" J (Saqlanish barqaror!)") };
        } else {
          return { success: false, msg: __t("❌ BEQARORLIK: Klassik Eyler energiyani portlatdi! E = ") + E.toFixed(2) + ' J (+' + (drift*100).toFixed(0) + __t("% xatolik)") };
        }
      } catch (err) {
        return { success: false, msg: __t("Xatolik: ") + err.message };
      }
    }
  },
  boundary: {
    run: (code) => {
      try {
        let x = 405, v = 15, W = 400, r = 10, e = 0.8;
        let fn = new Function('x', 'v', 'W', 'r', 'e', code + '; return {x, v};');
        let res = fn(x, v, W, r, e);
        if (res.x <= W - r && res.v < 0) {
          return { success: true, msg: __t("✅ TO‘G‘RI: Jism devor ichiga kirmay qaytarildi (x = ") + res.x + __t(" px, v = ") + res.v + __t(" px/s)") };
        } else if (res.x > W - r) {
          return { success: false, msg: __t("❌ TUNNEL EFFEKTI: Jism devor ichida yoki tashqarisida qolib ketdi (x = ") + res.x + ' > ' + (W-r) + ')' };
        }
        return { success: false, msg: __t("⚠️ Qaytarilgan qiymat: x=") + res.x + ', v=' + res.v };
      } catch (err) {
        return { success: false, msg: __t("Xatolik: ") + err.message };
      }
    }
  },
  singularity: {
    run: (code) => {
      try {
        let r = 0.0001, G = 1.0, M = 10.0, m = 1.0;
        let fn = new Function('r', 'G', 'M', 'm', code + '; return typeof F !== "undefined" ? F : null;');
        let F = fn(r, G, M, m);
        if (F !== null && isFinite(F) && F < 1000) {
          return { success: true, msg: __t("✅ TO‘G‘RI: Yumshatuvchi parametr (epsilon) qo‘shildi! Kuch chekli qiymatda ushlab turildi: F = ") + F.toFixed(2) + ' N' };
        } else if (F > 1e6 || !isFinite(F)) {
          return { success: false, msg: __t("❌ SINGULYARLIK: r -> 0 da kuch cheksizlikka intildi: F = ") + F + __t(" N (Dvigatel qotib qoladi!)") };
        }
        return { success: false, msg: __t("⚠️ Kuch qiymati: ") + F };
      } catch (err) {
        return { success: false, msg: __t("Xatolik: ") + err.message };
      }
    }
  }
};

function runDebugSandbox(id) {
  const codeArea = document.getElementById(`debug-code-${id}`);
  const outEl = document.getElementById(`debug-out-${id}`);
  if (!codeArea || !outEl) return;

  const code = codeArea.value;
  const runner = debugSandboxes[id];
  if (runner) {
    const res = runner.run(code);
    outEl.textContent = res.msg;
    outEl.className = res.success ? 'hud-pill text-emerald' : 'hud-pill text-rose';
    if (window.showToast) {
      window.showToast(res.success ? __t("Sinov muvaffaqiyatli o‘tdi!") : __t("Xatolik aniqlandi!"));
    }
  }
}
