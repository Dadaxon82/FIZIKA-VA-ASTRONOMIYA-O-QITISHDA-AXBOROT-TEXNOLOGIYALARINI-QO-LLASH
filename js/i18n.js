/**
 * I18N.JS — ILIMZIYO elektron darsligi uchun bog'liqliklarsiz ko'p tillilik
 * (UZ / RU / EN) dvigateli.
 *
 * Arxitektura (qisqacha):
 *  - Lug'atlar:  locales/uz.json, locales/ru.json, locales/en.json
 *                (ichma-ich JSON, kalitlar nuqta bilan: "nav.home").
 *  - Belgilash:  HTML'da  data-i18n="kalit"            → element matni;
 *                         data-i18n-attr="placeholder:kalit; aria-label:kalit2"
 *                                                       → atributlar.
 *                Matnli tugunning faqat O'ZI almashtiriladi: ichki <svg>,
 *                <output>, <small>, <br> kabi bolalar elementlari, shuningdek
 *                matn boshidagi/oxiridagi emoji va belgilar (🧪, ↗, →)
 *                buzilmasdan qoladi.
 *  - Sahifa meta: <meta name="i18n-page" content="lecture1"> orqali
 *                "meta.lecture1.title" / "meta.lecture1.description" kalitlari
 *                <title>, <meta name="description">, Open Graph va Twitter
 *                teglariga qo'llanadi; <html lang>, og:locale va canonical
 *                ham til bilan birga yangilanadi.
 *  - Saqlash:    tanlangan til localStorage("site_lang") da saqlanadi;
 *                ?lang=ru|en URL parametri uni ustun turib almashtiradi.
 *  - O'zbekcha:  standart til. HTML manbasi o'zbekcha bo'lgani uchun "uz"
 *                tanlanganda asl matnlar aynan tiklanadi (tarmoq so'rovisiz).
 *  - JS API:     window.I18N.t('kalit', {param: 1}), I18N.setLanguage('ru'),
 *                I18N.onChange(fn), I18N.ready (Promise), 'i18n:change' hodisasi.
 *  - HTML-tarjima: ichida <strong>, <a> kabi teglar bo'lgan butun abzaslar
 *                uchun data-i18n-html="kalit" — lug'atdagi qiymat (HTML)
 *                elementning ichki qismini to'liq almashtiradi.
 *  - Qisman tarjima: sahifadagi asosiy ma'ruza matni hali tarjima
 *                qilinmagan bo'lsa (<html data-i18n-coverage="partial">),
 *                RU/EN tanlanganda bu haqda yopiladigan bildirishnoma
 *                ko'rsatiladi. Uchinchi tomon (Google) tarjimasi ishlatilmaydi.
 */
(function () {
  'use strict';

  var CONFIG = {
    languages: ['uz', 'ru', 'en'],
    defaultLang: 'uz',
    storageKey: 'site_lang',
    version: '2026.11.20-1',
    siteUrl: 'https://ilimziyo.uz/',
    labels: {
      uz: { short: 'UZ', name: 'O‘zbekcha' },
      ru: { short: 'RU', name: 'Русский' },
      en: { short: 'EN', name: 'English' }
    },
    intlLocale: { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' },
    ogLocale: { uz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' }
  };

  var root = document.documentElement;
  var scriptEl = document.currentScript;
  var localesBase = (function () {
    try {
      return new URL('../locales/', scriptEl && scriptEl.src ? scriptEl.src : window.location.href).href;
    } catch (e) {
      return 'locales/';
    }
  })();

  var state = {
    lang: CONFIG.defaultLang,
    dict: {},
    dictionaries: {},
    listeners: [],
    missing: [],
    originals: new WeakMap(),
    attrOriginals: new WeakMap(),
    meta: null,
    applied: false,
    debug: /[?&]i18n-debug=1\b/.test(window.location.search)
  };

  var readyResolve;
  var ready = new Promise(function (resolve) { readyResolve = resolve; });

  /* ------------------------------------------------------------------ */
  /*  Yordamchi funksiyalar                                              */
  /* ------------------------------------------------------------------ */

  function isSupported(lang) {
    return CONFIG.languages.indexOf(lang) !== -1;
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* maxfiy rejim */ }
  }

  function detectInitialLang() {
    if (window.__I18N_BOOT_LANG__ && isSupported(window.__I18N_BOOT_LANG__)) {
      return window.__I18N_BOOT_LANG__;
    }
    try {
      var fromUrl = new URLSearchParams(window.location.search).get('lang');
      if (fromUrl && isSupported(fromUrl)) {
        storageSet(CONFIG.storageKey, fromUrl);
        return fromUrl;
      }
    } catch (e) { /* eski brauzer */ }
    var stored = storageGet(CONFIG.storageKey);
    return stored && isSupported(stored) ? stored : CONFIG.defaultLang;
  }

  function lookup(dict, key) {
    if (!dict || !key) return undefined;
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    var parts = key.split('.');
    var node = dict;
    for (var i = 0; i < parts.length; i++) {
      if (node === null || typeof node !== 'object' || !(parts[i] in node)) return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  function pluralize(value, count, lang) {
    if (value === null || typeof value !== 'object') return value;
    var category = 'other';
    try {
      category = new Intl.PluralRules(CONFIG.intlLocale[lang] || lang).select(count);
    } catch (e) { /* Intl yo'q */ }
    return value[category] !== undefined ? value[category] : value.other;
  }

  function interpolate(text, params) {
    if (typeof text !== 'string' || !params) return text;
    return text.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
    });
  }

  /**
   * Matn boshidagi/oxiridagi "bezak" belgilar: bo'shliqlar, emoji, piktogramma,
   * strelka va matematik belgilar (🧪, ⭐, ↗, →, ×, ±, •). Lug'atda faqat
   * mazmunli o'zak saqlanadi; bezaklar asl matndan olinib, tarjimaga qayta
   * qo'shiladi. tools/i18n-mark.py dagi qoida bilan aynan bir xil.
   */
  var DECOR_RE;
  try {
    DECOR_RE = new RegExp('[\\s\\p{So}\\p{Sk}\\p{Sm}\\p{Cf}\\p{Mn}•·]', 'u');
  } catch (e) {
    DECOR_RE = /[\s•·→←↑↓↗↘✓✔✕×±]/;
  }

  function splitDecor(text) {
    var chars = Array.from(text);
    var start = 0;
    var end = chars.length;
    while (start < end && DECOR_RE.test(chars[start])) start++;
    while (end > start && DECOR_RE.test(chars[end - 1])) end--;
    return {
      prefix: chars.slice(0, start).join(''),
      core: chars.slice(start, end).join(''),
      suffix: chars.slice(end).join('')
    };
  }

  function normalizeSpaces(text) {
    return text.replace(/\s+/g, ' ');
  }

  function firstTextNode(el) {
    for (var node = el.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 3 && node.nodeValue.trim() !== '') return node;
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  Lug'atni yuklash (xotira + sessionStorage keshi)                   */
  /* ------------------------------------------------------------------ */

  function loadDictionary(lang) {
    if (state.dictionaries[lang]) return Promise.resolve(state.dictionaries[lang]);
    var cacheKey = 'i18n:' + CONFIG.version + ':' + lang;
    try {
      var cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        state.dictionaries[lang] = JSON.parse(cached);
        return Promise.resolve(state.dictionaries[lang]);
      }
    } catch (e) { /* kesh mavjud emas */ }

    var url = localesBase + lang + '.json?v=' + encodeURIComponent(CONFIG.version);
    return fetch(url, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status + ' — ' + url);
        return response.json();
      })
      .then(function (json) {
        state.dictionaries[lang] = json;
        try { window.sessionStorage.setItem(cacheKey, JSON.stringify(json)); } catch (e) { /* to'la */ }
        return json;
      })
      .catch(function (error) {
        if (window.console) console.warn('[i18n] Lug‘at yuklanmadi:', error);
        state.dictionaries[lang] = {};
        return state.dictionaries[lang];
      });
  }

  /* ------------------------------------------------------------------ */
  /*  Tarjima funksiyasi (JS uchun ommaviy API)                          */
  /* ------------------------------------------------------------------ */

  /**
   * t('kalit', {n: 3}, 'zaxira matn')
   * - Joriy tilda topilmasa → o'zbekcha lug'at → zaxira matn → kalitning o'zi.
   * - Qiymat obyekt bo'lsa ({one, few, many, other}) params.count bo'yicha
   *   Intl.PluralRules orqali to'g'ri ko'plik shakli tanlanadi.
   */
  function t(key, params, fallback) {
    var value = lookup(state.dict, key);
    var lang = state.lang;
    if (value === undefined) {
      value = lookup(state.dictionaries[CONFIG.defaultLang], key);
      lang = CONFIG.defaultLang;
    }
    if (value === undefined) {
      if (state.debug && state.missing.indexOf(key) === -1) state.missing.push(key);
      value = fallback !== undefined ? fallback : key;
    }
    if (params && params.count !== undefined) value = pluralize(value, Number(params.count), lang);
    if (typeof value === 'object') value = value.other !== undefined ? value.other : key;
    return interpolate(value, params);
  }

  function has(key) {
    return lookup(state.dict, key) !== undefined;
  }

  /* ------------------------------------------------------------------ */
  /*  DOM tarjimasi                                                      */
  /* ------------------------------------------------------------------ */

  function translateTextElement(el) {
    var key = el.getAttribute('data-i18n');
    if (!key) return;
    var record = state.originals.get(el);
    var node = record && record.node && record.node.parentNode === el ? record.node : firstTextNode(el);
    if (!node) return;
    if (!record || record.node !== node) {
      record = { node: node, text: record ? record.text : node.nodeValue };
      state.originals.set(el, record);
    }

    if (state.lang === CONFIG.defaultLang) {
      if (node.nodeValue !== record.text) node.nodeValue = record.text;
      return;
    }

    var value = lookup(state.dict, key);
    if (typeof value !== 'string') {
      if (state.missing.indexOf(key) === -1) state.missing.push(key);
      if (state.debug) el.setAttribute('data-i18n-missing', '');
      node.nodeValue = record.text;
      return;
    }

    var original = record.text;
    var lead = (original.match(/^\s*/) || [''])[0];
    var trail = (original.match(/\s*$/) || [''])[0];
    var parts = splitDecor(normalizeSpaces(original.trim()));
    var translated = lead + parts.prefix + value + parts.suffix + trail;
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }

  function parseAttrSpec(spec) {
    return spec.split(';').map(function (pair) {
      var index = pair.indexOf(':');
      if (index === -1) return null;
      return { attr: pair.slice(0, index).trim(), key: pair.slice(index + 1).trim() };
    }).filter(function (item) { return item && item.attr && item.key; });
  }

  function translateAttributes(el) {
    var spec = el.getAttribute('data-i18n-attr');
    if (!spec) return;
    var originals = state.attrOriginals.get(el);
    if (!originals) {
      originals = {};
      state.attrOriginals.set(el, originals);
    }
    parseAttrSpec(spec).forEach(function (item) {
      if (!(item.attr in originals)) {
        originals[item.attr] = { source: el.getAttribute(item.attr) || '', applied: el.getAttribute(item.attr) || '' };
      }
      var record = originals[item.attr];
      var current = item.attr === 'value' && 'value' in el ? el.value : el.getAttribute(item.attr);
      /* Foydalanuvchi o'zi o'zgartirgan forma qiymatini ustidan yozmaymiz. */
      if (item.attr === 'value' && current !== record.applied) return;

      var next = record.source;
      if (state.lang !== CONFIG.defaultLang) {
        var value = lookup(state.dict, item.key);
        if (typeof value === 'string') {
          var parts = splitDecor(normalizeSpaces(record.source.trim()));
          next = parts.prefix + value + parts.suffix;
        } else if (state.missing.indexOf(item.key) === -1) {
          state.missing.push(item.key);
        }
      }
      if (item.attr === 'value' && 'value' in el) el.value = next;
      el.setAttribute(item.attr, next);
      record.applied = next;
    });
  }

  function translateHtmlElement(el) {
    var key = el.getAttribute('data-i18n-html');
    if (!key) return;
    if (!state.originals.has(el)) state.originals.set(el, { html: el.innerHTML });
    var record = state.originals.get(el);
    var value = state.lang === CONFIG.defaultLang ? undefined : lookup(state.dict, key);
    var next = typeof value === 'string' ? value : record.html;
    if (typeof value !== 'string' && state.lang !== CONFIG.defaultLang && state.missing.indexOf(key) === -1) {
      state.missing.push(key);
    }
    if (el.innerHTML !== next) el.innerHTML = next;
  }

  function translateElement(scope) {
    var base = scope || document;
    if (base.nodeType === 1) {
      if (base.hasAttribute('data-i18n')) translateTextElement(base);
      if (base.hasAttribute('data-i18n-attr')) translateAttributes(base);
      if (base.hasAttribute('data-i18n-html')) translateHtmlElement(base);
    }
    var htmlEls = base.querySelectorAll('[data-i18n-html]');
    for (var h = 0; h < htmlEls.length; h++) translateHtmlElement(htmlEls[h]);
    var textEls = base.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) translateTextElement(textEls[i]);
    var attrEls = base.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < attrEls.length; j++) translateAttributes(attrEls[j]);
  }

  /* ------------------------------------------------------------------ */
  /*  <head>: title, description, Open Graph, canonical, hreflang        */
  /* ------------------------------------------------------------------ */

  function pageId() {
    var meta = document.querySelector('meta[name="i18n-page"]');
    if (meta && meta.content) return meta.content;
    var file = window.location.pathname.split('/').pop() || 'index';
    return file.replace(/\.html?$/i, '') || 'index';
  }

  function metaEl(selector) {
    return document.head ? document.head.querySelector(selector) : null;
  }

  function captureMeta() {
    if (state.meta) return state.meta;
    var canonical = metaEl('link[rel="canonical"]');
    var desc = metaEl('meta[name="description"]');
    state.meta = {
      title: document.title,
      description: desc ? desc.getAttribute('content') : '',
      canonical: canonical ? canonical.getAttribute('href') : ''
    };
    return state.meta;
  }

  function setMetaContent(selector, value) {
    var el = metaEl(selector);
    if (el && value) el.setAttribute('content', value);
  }

  function urlWithLang(base, lang) {
    try {
      var url = new URL(base, window.location.href);
      if (lang === CONFIG.defaultLang) url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      return url.href;
    } catch (e) {
      return base;
    }
  }

  function ensureAlternates(baseCanonical) {
    if (!document.head || !baseCanonical) return;
    CONFIG.languages.concat(['x-default']).forEach(function (code) {
      var selector = 'link[rel="alternate"][hreflang="' + code + '"]';
      if (metaEl(selector)) return;
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = code;
      link.href = urlWithLang(baseCanonical, code === 'x-default' ? CONFIG.defaultLang : code);
      document.head.appendChild(link);
    });
  }

  function applyMeta() {
    var original = captureMeta();
    var id = pageId();
    var isDefault = state.lang === CONFIG.defaultLang;
    var title = isDefault ? original.title : (lookup(state.dict, 'meta.' + id + '.title') || original.title);
    var description = isDefault ? original.description : (lookup(state.dict, 'meta.' + id + '.description') || original.description);

    root.setAttribute('lang', state.lang);
    root.setAttribute('data-lang', state.lang);
    root.setAttribute('dir', 'ltr');

    if (document.title !== title) document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[name="twitter:description"]', description);
    setMetaContent('meta[property="og:locale"]', CONFIG.ogLocale[state.lang]);

    var canonical = metaEl('link[rel="canonical"]');
    if (canonical && original.canonical) {
      canonical.setAttribute('href', urlWithLang(original.canonical, state.lang));
    }
    ensureAlternates(original.canonical);
  }

  /* ------------------------------------------------------------------ */
  /*  Til almashtirgich (UI)                                             */
  /* ------------------------------------------------------------------ */

  var GLOBE_SVG = '<svg class="i18n-switcher__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path>' +
    '<path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"></path></svg>';

  function buildSwitcher(variant) {
    var wrap = document.createElement('div');
    wrap.className = 'i18n-switcher i18n-switcher--' + variant;
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('data-i18n-attr', 'aria-label:switcher.groupLabel');
    wrap.setAttribute('aria-label', 'Sayt tili');

    if (variant === 'menu') {
      var heading = document.createElement('span');
      heading.className = 'i18n-switcher__heading';
      heading.innerHTML = GLOBE_SVG;
      var label = document.createElement('span');
      label.setAttribute('data-i18n', 'switcher.heading');
      label.textContent = 'Sayt tili';
      heading.appendChild(label);
      wrap.appendChild(heading);
    } else {
      wrap.insertAdjacentHTML('beforeend', GLOBE_SVG);
    }

    var list = document.createElement('div');
    list.className = 'i18n-switcher__options';
    CONFIG.languages.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'i18n-switcher__btn';
      btn.setAttribute('data-lang', lang);
      btn.setAttribute('lang', lang);
      btn.setAttribute('aria-pressed', 'false');
      btn.title = CONFIG.labels[lang].name;
      btn.setAttribute('aria-label', CONFIG.labels[lang].name);
      btn.textContent = variant === 'menu' ? CONFIG.labels[lang].name : CONFIG.labels[lang].short;
      btn.addEventListener('click', function () { setLanguage(lang); });
      btn.addEventListener('keydown', onSwitcherKeydown);
      list.appendChild(btn);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function onSwitcherKeydown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    var buttons = Array.prototype.slice.call(event.currentTarget.parentNode.querySelectorAll('.i18n-switcher__btn'));
    var index = buttons.indexOf(event.currentTarget);
    var next = event.key === 'ArrowRight' ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
    event.preventDefault();
  }

  function insertBefore(parent, el, ref) {
    if (ref && ref.parentNode === parent) parent.insertBefore(el, ref);
    else parent.appendChild(el);
  }

  function mountSwitchers() {
    if (document.querySelector('.i18n-switcher')) return;
    var compact = buildSwitcher('compact');

    var navActions = document.querySelector('.nav-actions');
    var homeNavbar = document.querySelector('.site-header .navbar');
    var topmenu = document.querySelector('.topmenu-inner');

    if (navActions) {
      navActions.insertBefore(compact, navActions.firstChild);
    } else if (homeNavbar) {
      insertBefore(homeNavbar, compact, homeNavbar.querySelector('.menu-toggle'));
    } else if (topmenu) {
      insertBefore(topmenu, compact, topmenu.querySelector('.topmenu-toggle'));
    } else if (document.querySelector('body > header')) {
      // Simulyatsiyalar: o'z sarlavha paneli bor — tugmalarni yopib qo'ymaslik
      // uchun almashtirgich panel oxiriga oddiy oqimda joylashadi.
      compact.classList.add('i18n-switcher--floating', 'i18n-switcher--in-header');
      document.querySelector('body > header').appendChild(compact);
    } else {
      compact.classList.add('i18n-switcher--floating');
      document.body.appendChild(compact);
    }

    var drawer = document.getElementById('mobile-drawer');
    var homeLinks = document.querySelector('.site-header .navbar .nav-links');
    var topLinks = document.getElementById('topmenu-links');
    var menuHost = null;
    if (drawer) {
      menuHost = drawer;
      var menu = buildSwitcher('menu');
      var header = drawer.querySelector('.drawer-header');
      if (header && header.nextSibling) drawer.insertBefore(menu, header.nextSibling);
      else drawer.insertBefore(menu, drawer.firstChild);
    }
    [homeLinks, topLinks].forEach(function (host) {
      if (!host || host === menuHost) return;
      host.insertBefore(buildSwitcher('menu'), host.firstChild);
    });

    root.classList.add('i18n-has-switcher');
    updateSwitchers();
  }

  function updateSwitchers() {
    var buttons = document.querySelectorAll('.i18n-switcher__btn');
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].getAttribute('data-lang') === state.lang;
      buttons[i].classList.toggle('is-active', active);
      buttons[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Qisman tarjima qilingan sahifalar uchun bildirishnoma              */
  /* ------------------------------------------------------------------ */

  var NOTICE_KEY = 'i18n_coverage_notice_dismissed';

  function isPartialPage() {
    return root.getAttribute('data-i18n-coverage') === 'partial';
  }

  function hideCoverageNotice() {
    var bar = document.getElementById('i18n-coverage-notice');
    if (bar) bar.hidden = true;
  }

  function updateCoverageNotice() {
    if (state.lang === CONFIG.defaultLang || !isPartialPage() ||
        storageGet(NOTICE_KEY) === CONFIG.version + ':' + state.lang) {
      hideCoverageNotice();
      return;
    }
    var bar = document.getElementById('i18n-coverage-notice');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'i18n-coverage-notice';
      bar.className = 'i18n-notice';
      bar.setAttribute('role', 'status');

      var text = document.createElement('span');
      text.className = 'i18n-notice__text';
      text.setAttribute('data-i18n', 'coverageNotice.text');
      text.textContent = 'Menyu, sarlavhalar va ilmiy atamalar tarjima qilingan; ma’ruzaning asosiy matni hozircha o‘zbek tilida.';

      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'i18n-notice__btn';
      close.setAttribute('data-i18n', 'coverageNotice.dismiss');
      close.textContent = 'Tushunarli';
      close.addEventListener('click', function () {
        storageSet(NOTICE_KEY, CONFIG.version + ':' + state.lang);
        hideCoverageNotice();
      });

      bar.appendChild(text);
      bar.appendChild(close);
      document.body.appendChild(bar);
    }
    translateElement(bar);
    bar.hidden = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Tilni qo'llash va almashtirish                                     */
  /* ------------------------------------------------------------------ */

  function emitChange() {
    var detail = { lang: state.lang, locale: CONFIG.intlLocale[state.lang] };
    state.listeners.slice().forEach(function (fn) {
      try { fn(state.lang, detail); } catch (e) { if (window.console) console.error(e); }
    });
    try {
      document.dispatchEvent(new CustomEvent('i18n:change', { detail: detail }));
    } catch (e) { /* eski brauzer */ }
  }

  function applyLanguage(lang) {
    var needsDefault = lang !== CONFIG.defaultLang;
    var loads = [loadDictionary(lang)];
    if (needsDefault) loads.push(loadDictionary(CONFIG.defaultLang));
    return Promise.all(loads).then(function (results) {
      state.lang = lang;
      state.dict = results[0] || {};
      state.missing = [];
      translateElement(document);
      applyMeta();
      updateSwitchers();
      root.classList.remove('i18n-pending');
      state.applied = true;
      updateCoverageNotice();
      if (state.debug && state.missing.length && window.console) {
        console.info('[i18n] "' + lang + '" tilida topilmagan kalitlar:', state.missing);
      }
      emitChange();
      return lang;
    });
  }

  function syncUrl(lang) {
    if (!window.history || !window.history.replaceState) return;
    try {
      var url = new URL(window.location.href);
      var had = url.searchParams.has('lang');
      if (lang === CONFIG.defaultLang) url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      if (had || lang !== CONFIG.defaultLang) window.history.replaceState(window.history.state, '', url.href);
    } catch (e) { /* file:// */ }
  }

  function setLanguage(lang) {
    if (!isSupported(lang)) return Promise.resolve(state.lang);
    var previous = state.lang;
    storageSet(CONFIG.storageKey, lang);
    syncUrl(lang);
    if (lang === previous && state.applied) return Promise.resolve(lang);

    return applyLanguage(lang);
  }

  function onChange(fn) {
    if (typeof fn === 'function') state.listeners.push(fn);
    return function () {
      state.listeners = state.listeners.filter(function (item) { return item !== fn; });
    };
  }

  function formatNumber(value, options) {
    try {
      return new Intl.NumberFormat(CONFIG.intlLocale[state.lang], options).format(value);
    } catch (e) {
      return String(value);
    }
  }

  /* Keyinroq JS orqali qo'shilgan data-i18n elementlarini avtomatik tarjima qilish. */
  function observeDynamicContent() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      if (!state.applied || state.lang === CONFIG.defaultLang) return;
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute('data-i18n') || node.hasAttribute('data-i18n-attr') || node.hasAttribute('data-i18n-html') ||
              (node.querySelector && node.querySelector('[data-i18n],[data-i18n-attr],[data-i18n-html]'))) {
            translateElement(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ */
  /*  Ishga tushirish                                                    */
  /* ------------------------------------------------------------------ */

  /* Avvalgi Google Translate vidjetidan qolgan "googtrans" cookie'larini o'chirish. */
  function cleanupLegacy() {
    if (!/(?:^|;\s*)googtrans=/.test(document.cookie)) return;
    var host = window.location.hostname;
    var domains = [''];
    if (host) {
      domains.push(host, '.' + host);
      var parts = host.split('.');
      if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    }
    domains.forEach(function (domain) {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (domain ? '; domain=' + domain : '');
    });
  }

  function init() {
    var lang = detectInitialLang();
    state.lang = CONFIG.defaultLang;
    captureMeta();
    cleanupLegacy();
    mountSwitchers();
    observeDynamicContent();
    applyLanguage(lang).then(function () {
      readyResolve(api);
    }, function () {
      root.classList.remove('i18n-pending');
      readyResolve(api);
    });
  }

  var api = {
    get lang() { return state.lang; },
    languages: CONFIG.languages.slice(),
    labels: CONFIG.labels,
    defaultLang: CONFIG.defaultLang,
    ready: ready,
    t: t,
    has: has,
    setLanguage: setLanguage,
    onChange: onChange,
    translateElement: translateElement,
    formatNumber: formatNumber,
    locale: function () { return CONFIG.intlLocale[state.lang]; },
    missingKeys: function () { return state.missing.slice(); },
    _splitDecor: splitDecor
  };

  window.I18N = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
