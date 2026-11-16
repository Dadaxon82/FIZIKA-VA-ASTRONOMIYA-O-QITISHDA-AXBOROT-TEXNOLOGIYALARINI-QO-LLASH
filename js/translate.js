/**
 * TRANSLATE.JS — Sayt bo'ylab 3 tilli (UZ/RU/EN) Google Translate integratsiyasi.
 *
 * Nega shunday qilingan:
 * - Sayt statik ko'p sahifali (build jarayonisiz) bo'lgani uchun server
 *   tomonidagi tarjima mumkin emas — Google Website Translator vidjeti
 *   (translate.google.com/translate_a/element.js) ishlatiladi. U "googtrans"
 *   cookie'sini o'qib, DOM matnini mijoz tomonida tarjima qiladi.
 * - Bitta umumiy skript barcha sahifalarga ulanadi (har bir HTML faylga
 *   qo'lda widget markup yozish shart emas): skript o'zi kerakli elementlarni
 *   (yashirin google_translate_element konteyneri, til tugmalari) ishga
 *   tushirish vaqtida yaratadi.
 * - Til tanlovi ikki joyda saqlanadi: localStorage (bizning tugmalarimiz
 *   qaysi til faol ekanini bilishi uchun, Google skripti yuklanishidan oldin
 *   ham) va "googtrans" cookie'si (Google vidjetining o'zi shu cookie'ni
 *   o'qib, yangi sahifa ochilganda ham tanlangan tilni avtomatik tiklaydi).
 * - Sayt uchta turli sarlavha (header) tuzilmasiga ega (index.html'ning
 *   o'z .navbar tizimi, ma'ruza/laboratoriya sahifalarining .nav-container
 *   tizimi va mustaqil.html'ning .topmenu tizimi). Tugmalar shu uchta
 *   tuzilmaning birortasini buzmasligi uchun DOM'ga yangi flex-qator
 *   qo'shish o'rniga, logotipni ichiga oluvchi kichik "header-left-group"
 *   o'ramiga olinadi — natijada header'ning asosiy 3 ta flex-bo'lagi
 *   (logotip, menyu, amallar) soni o'zgarmaydi va joylashuv buzilmaydi.
 */
(function () {
  'use strict';

  var LANGS = ['uz', 'ru', 'en'];
  var LANG_LABELS = { uz: 'UZ', ru: 'RU', en: 'EN' };
  var PAGE_LANG = 'uz';
  var STORAGE_KEY = 'site_lang';

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setGoogTransCookie(value) {
    var hostname = window.location.hostname;
    var expires = 'expires=Fri, 31 Dec 9999 23:59:59 GMT';
    document.cookie = 'googtrans=' + value + '; path=/; ' + expires;
    if (hostname) {
      document.cookie = 'googtrans=' + value + '; path=/; domain=' + hostname + '; ' + expires;
      document.cookie = 'googtrans=' + value + '; path=/; domain=.' + hostname + '; ' + expires;
      var parts = hostname.split('.');
      if (parts.length > 2) {
        document.cookie = 'googtrans=' + value + '; path=/; domain=.' + parts.slice(-2).join('.') + '; ' + expires;
      }
    }
  }

  function clearGoogTransCookie() {
    var hostname = window.location.hostname;
    var expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'googtrans=; path=/; ' + expired;
    if (hostname) {
      document.cookie = 'googtrans=; path=/; domain=' + hostname + '; ' + expired;
      document.cookie = 'googtrans=; path=/; domain=.' + hostname + '; ' + expired;
    }
  }

  function currentLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.indexOf(stored) !== -1) return stored;
    var cookie = getCookie('googtrans');
    if (cookie) {
      var target = cookie.split('/').filter(Boolean)[1];
      if (target && LANGS.indexOf(target) !== -1) return target;
    }
    return PAGE_LANG;
  }

  /* Kod, formula va texnik atamalarni tarjimadan himoya qilish. */
  function applyNotranslate() {
    var selectors = [
      'code', 'pre', 'kbd', 'samp',
      '.katex', '.katex-display',
      '[data-no-translate]'
    ];
    var els = document.querySelectorAll(selectors.join(','));
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('notranslate');
      els[i].setAttribute('translate', 'no');
    }
  }

  function buildSwitcher(active) {
    var wrap = document.createElement('div');
    wrap.className = 'lang-switcher notranslate';
    wrap.id = 'lang-switcher';
    wrap.setAttribute('translate', 'no');
    LANGS.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn' + (lang === active ? ' active' : '');
      btn.textContent = LANG_LABELS[lang];
      btn.setAttribute('data-lang', lang);
      btn.setAttribute('aria-label', 'Tilni almashtirish: ' + LANG_LABELS[lang]);
      btn.addEventListener('click', function () {
        switchLanguage(this.getAttribute('data-lang'));
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function mountSwitcher() {
    if (document.getElementById('lang-switcher')) return;
    var switcher = buildSwitcher(currentLang());
    var brand = document.querySelector('.brand-logo') ||
                document.querySelector('.nav-logo') ||
                document.querySelector('.topmenu-brand') ||
                document.querySelector('.brand');

    if (brand && brand.parentNode) {
      var wrapper = document.createElement('div');
      wrapper.className = 'header-left-group';
      brand.parentNode.insertBefore(wrapper, brand);
      wrapper.appendChild(switcher);
      wrapper.appendChild(brand);
    } else {
      document.body.insertBefore(switcher, document.body.firstChild);
    }
  }

  function switchLanguage(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    localStorage.setItem(STORAGE_KEY, lang);
    if (lang === PAGE_LANG) {
      clearGoogTransCookie();
    } else {
      setGoogTransCookie('/' + PAGE_LANG + '/' + lang);
    }
    location.reload();
  }

  function ensureWidgetContainer() {
    if (document.getElementById('google_translate_element')) return;
    var div = document.createElement('div');
    div.id = 'google_translate_element';
    div.className = 'notranslate';
    div.setAttribute('translate', 'no');
    document.body.appendChild(div);
  }

  function loadGoogleTranslateScript() {
    if (document.getElementById('google-translate-script')) return;
    var script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  }

  window.googleTranslateElementInit = function () {
    /* global google */
    new google.translate.TranslateElement({
      pageLanguage: PAGE_LANG,
      includedLanguages: LANGS.join(','),
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    }, 'google_translate_element');
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyNotranslate();
    mountSwitcher();
    ensureWidgetContainer();
    loadGoogleTranslateScript();
  });
})();
