/**
 * SIM-TTS-NARRATOR.JS - Interactive Audio Narrator & Speech Synthesis Simulator (Muxlisa AI / ElevenLabs)
 */

class TTSNarrator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.isSpeaking = false;
    this.animFrame = null;
    this.wavePhase = 0;

    this.presets = {
      pendulum: "Matematik mayatnik harakatida tebranish burchagi oshgani sari noliner effektlar yuzaga keladi. Kinetik va potensial energiya o'zaro almashinib turadi.",
      lorentz: "Zaryadlangan zarracha bir jinsli magnit maydoniga kirganda, Lorents kuchi ta'sirida Larmor radiusi bo'ylab spiral harakat qiladi.",
      drag: "Havo qarshiligi mavjud bo'lganda otilgan jismning traektoriyasi ideal paraboladan chetga chiqadi va jism chekli tezlikka erishadi.",
      doppler: "Manba tovush tezligidan tezroq harakatlanganda zarba to'lqinlari siqilib, Mach konusi hosil bo'ladi."
    };

    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = (rect.width * dpr) || 500;
    this.canvas.height = 100 * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.renderWave(0);
  }

  initEvents() {
    const speakBtn = document.getElementById('btn-tts-speak');
    const stopBtn = document.getElementById('btn-tts-stop');
    const presetSelect = document.getElementById('select-tts-preset');
    const textInput = document.getElementById('tts-input-text');

    if (presetSelect && textInput) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (this.presets[val]) textInput.value = this.presets[val];
      });
    }

    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        const text = textInput ? textInput.value : '';
        this.speak(text);
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.stop();
      });
    }
  }

  speak(text) {
    if (!text) return;
    this.stop();

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const speed = parseFloat(document.getElementById('slider-tts-rate')?.value || 1.0);
      const pitch = parseFloat(document.getElementById('slider-tts-pitch')?.value || 1.0);
      
      utterance.rate = speed;
      utterance.pitch = pitch;

      // Try to find Uzbek / Turkish or natural voice
      const voices = window.speechSynthesis.getVoices();
      const uzVoice = voices.find(v => v.lang.includes('uz') || v.lang.includes('tr') || v.lang.includes('ru'));
      if (uzVoice) utterance.voice = uzVoice;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.startWaveAnimation();
      };
      utterance.onend = () => {
        this.isSpeaking = false;
        this.stopWaveAnimation();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.stopWaveAnimation();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Visual fallback if SpeechSynthesis API is restricted
      this.isSpeaking = true;
      this.startWaveAnimation();
      setTimeout(() => {
        this.isSpeaking = false;
        this.stopWaveAnimation();
      }, 4000);
    }
    if (window.showToast) window.showToast("Audio narratsiya ijro etilmoqda...");
  }

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.stopWaveAnimation();
  }

  startWaveAnimation() {
    const loop = () => {
      if (!this.isSpeaking) return;
      this.wavePhase += 0.15;
      this.renderWave(1.0);
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  stopWaveAnimation() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.renderWave(0);
  }

  renderWave(amplitude = 0) {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = amplitude > 0 ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const centerY = h / 2;
    for (let x = 0; x < w; x++) {
      const freq = 0.04;
      const wave = amplitude > 0 
        ? Math.sin(x * freq + this.wavePhase) * Math.cos(x * 0.01) * (h * 0.35)
        : 0;
      const y = centerY + wave;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Sound wave frequency bars
    if (amplitude > 0) {
      ctx.fillStyle = 'rgba(129, 140, 248, 0.4)';
      for (let x = 10; x < w - 10; x += 12) {
        const barH = Math.abs(Math.sin(x * 0.05 + this.wavePhase * 1.5)) * (h * 0.4);
        ctx.fillRect(x, centerY - barH / 2, 4, barH);
      }
    }
  }
}
