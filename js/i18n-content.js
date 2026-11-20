/**
 * I18N-CONTENT.JS — sahifaning ASOSIY MATNINI (ma'ruza, laboratoriya,
 * glossariy …) RU / EN tiliga to'liq o'tkazadigan modul.
 *
 * Qanday ishlaydi
 * ---------------
 *  - i18n-boot.js til "uz" bo'lmaganda sahifa lug'atini
 *    (locales/pages/<til>/<sahifa>.js → window.I18N_PAGE) va shu faylni
 *    <head> ichida SINXRON yuklaydi.
 *  - DOM tayyor bo'lgach, <body> "matn birliklari"ga ajratiladi:
 *      • blok birlik — faqat inline teglardan (strong, em, a, span, code,
 *        sub, sup, br …) iborat element: uning ichki HTML'i bir butun
 *        jumla sifatida tarjima qilinadi (so'z tartibi tillarda farq qiladi);
 *      • matn birligi — aralash konteynerdagi alohida matn tuguni;
 *      • atribut birligi — title / alt / placeholder / aria-label.
 *  - Har bir birlik normallashtirilgan manba matnining FNV-1a xeshi
 *    bo'yicha lug'atdan topiladi. KaTeX allaqachon chizgan formulalar
 *    xesh hisoblashda qaytadan $…$ ko'rinishiga keltiriladi, shuning
 *    uchun natija KaTeX ishlaganmi-yo'qmi — bir xil.
 *  - Almashtirishda mavjud ichki elementlar (JS ularga havola saqlagan
 *    bo'lishi mumkin) qayta ishlatiladi, formulalar qayta chiziladi.
 *  - Keyinchalik JS qo'shgan tugunlar MutationObserver orqali tarjima
 *    qilinadi.
 *
 * Til almashtirilganda sahifa qayta yuklanadi (i18n.js), shuning uchun
 * "orqaga qaytarish" kerak emas — o'zbekcha matn HTML'ning o'zida turadi.
 */
(function () {
  'use strict';

  var INLINE = {
    A: 1, ABBR: 1, B: 1, BDI: 1, BR: 1, CITE: 1, CODE: 1, DFN: 1, EM: 1, I: 1, KBD: 1,
    MARK: 1, Q: 1, S: 1, SAMP: 1, SMALL: 1, SPAN: 1, STRONG: 1, SUB: 1, SUP: 1,
    TIME: 1, U: 1, VAR: 1, WBR: 1
  };
  var VOID = { BR: 1, WBR: 1 };
  var SKIP = {
    SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, CANVAS: 1, IFRAME: 1, SVG: 1,
    svg: 1, MATH: 1, math: 1, TEXTAREA: 1, VIDEO: 1, AUDIO: 1, OBJECT: 1
  };
  var ATTRS = ['title', 'alt', 'placeholder', 'aria-label'];
  var LETTERS = /[A-Za-zÀ-ɏЀ-ӿ]{2,}/;

  function isMath(el) {
    var c = el.classList;
    if (c && (c.contains('katex') || c.contains('katex-display'))) return true;
    // KaTeX auto-render formulani atributsiz <span> ichiga joylaydi.
    if (el.tagName === 'SPAN' && el.attributes.length === 0 && el.childNodes.length === 1) {
      var only = el.firstChild;
      return only.nodeType === 1 && !!only.classList && (only.classList.contains('katex') || only.classList.contains('katex-display'));
    }
    return false;
  }

  function skipped(el) {
    if (SKIP[el.tagName]) return true;
    if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-html') || el.hasAttribute('data-i18n-skip')) return true;
    if (el.getAttribute('translate') === 'no') return true;
    if (el.id === 'i18n-coverage-notice') return true;
    var c = el.classList;
    return !!c && (c.contains('i18n-switcher') || c.contains('i18n-notice'));
  }

  /* Element faqat "xavfsiz" inline avlodlardan iboratmi? */
  function inlineSafe(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== 1) continue;
      if (isMath(n)) continue;
      if (!INLINE[n.tagName] || skipped(n) || n.id) return false;
      for (var i = 0; i < n.attributes.length; i++) {
        var name = n.attributes[i].name;
        if (name.slice(0, 2) === 'on' || name.slice(0, 9) === 'data-i18n') return false;
      }
      if (!inlineSafe(n)) return false;
    }
    return true;
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
  }
  function escAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function mathSource(el) {
    var ann = el.querySelector('annotation');
    var tex = ann ? ann.textContent : el.textContent;
    var display = el.classList.contains('katex-display') || !!el.querySelector('.katex-display');
    return display ? '$$' + tex + '$$' : '$' + tex + '$';
  }

  function serialize(el) {
    var out = '';
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) out += esc(n.nodeValue);
      else if (n.nodeType === 1) {
        if (isMath(n)) { out += esc(mathSource(n)); continue; }
        var tag = n.tagName.toLowerCase();
        out += '<' + tag;
        for (var i = 0; i < n.attributes.length; i++) {
          out += ' ' + n.attributes[i].name + '="' + escAttr(n.attributes[i].value) + '"';
        }
        out += '>';
        if (!VOID[n.tagName]) out += serialize(n) + '</' + tag + '>';
      }
    }
    return out;
  }

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function hash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  function textWithoutMath(el) {
    var out = '';
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeType === 1 && !isMath(n)) out += textWithoutMath(n);
    }
    return out;
  }

  /**
   * Birliklarni yig'adi: [{type:'html'|'text'|'attr', node, attr?, src, key}]
   * Bu funksiya manba matnlarini chiqarib olish vositasida ham aynan shu
   * holda ishlatiladi — kalitlar ikkala tomonda bir xil chiqadi.
   */
  function collect(root, out) {
    out = out || [];
    function attrs(el) {
      for (var i = 0; i < ATTRS.length; i++) {
        var v = el.getAttribute(ATTRS[i]);
        if (v && LETTERS.test(v) && !(el.getAttribute('data-i18n-attr') || '').match(new RegExp('(^|;)\\s*' + ATTRS[i] + '\\s*:'))) {
          var src = norm(v);
          out.push({ type: 'attr', node: el, attr: ATTRS[i], src: src, key: hash('@' + src) });
        }
      }
    }
    function walk(el) {
      if (el.nodeType !== 1 || skipped(el) || isMath(el)) return;
      attrs(el);
      if (el.tagName === 'PRE') {
        if (LETTERS.test(el.textContent) && inlineSafe(el)) {
          var raw = serialize(el).replace(/^\n+|\s+$/g, '');
          out.push({ type: 'html', node: el, src: raw, key: hash('pre:' + raw), pre: true });
        }
        return;
      }
      if (el !== document.body && el.firstChild && inlineSafe(el)) {
        if (LETTERS.test(textWithoutMath(el))) {
          var src = norm(serialize(el));
          out.push({ type: 'html', node: el, src: src, key: hash(src) });
          var d = el.querySelectorAll('*');
          for (var j = 0; j < d.length; j++) if (!isMath(d[j]) && !d[j].closest('.katex,.katex-display')) attrs(d[j]);
        }
        return;
      }
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 1) walk(n);
        else if (n.nodeType === 3 && LETTERS.test(n.nodeValue)) {
          var t = norm(esc(n.nodeValue));
          out.push({ type: 'text', node: n, src: t, key: hash(t) });
        }
      }
    }
    walk(root);
    return out;
  }

  /* ---------------------------------------------------------------- */
  /*  Qo'llash                                                         */
  /* ---------------------------------------------------------------- */

  var translatedNodes = typeof WeakSet === 'function' ? new WeakSet() : null;

  function signature(el) {
    var s = el.tagName;
    for (var i = 0; i < el.attributes.length; i++) s += ' ' + el.attributes[i].name + '=' + el.attributes[i].value;
    return s;
  }

  function renderMath(el) {
    if (typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false
      });
    } catch (e) { /* formulasiz qoladi */ }
  }

  function applyHtml(el, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var frag = tpl.content;
    // Asl ichki elementlarni (JS havolalari saqlanib qolishi uchun) qayta ishlatish.
    var originals = [];
    var all = el.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      if (!isMath(all[i]) && !all[i].closest('.katex,.katex-display') && !(all[i].firstChild && all[i].firstChild.nodeType === 1 && isMath(all[i]))) originals.push(all[i]);
    }
    var used = [];
    var fresh = frag.querySelectorAll('*');
    for (var k = 0; k < fresh.length; k++) {
      var f = fresh[k], sig = signature(f);
      for (var m = 0; m < originals.length; m++) {
        if (used[m] || signature(originals[m]) !== sig) continue;
        used[m] = true;
        var o = originals[m];
        while (o.firstChild) o.removeChild(o.firstChild);
        while (f.firstChild) o.appendChild(f.firstChild);
        f.parentNode.replaceChild(o, f);
        break;
      }
    }
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
    if (html.indexOf('$') !== -1) renderMath(el);
  }

  function decode(s) {
    return s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  }

  function apply(units, dict) {
    var done = 0;
    for (var i = 0; i < units.length; i++) {
      var u = units[i], tr = dict[u.key];
      if (typeof tr !== 'string') continue;
      if (u.type === 'attr') u.node.setAttribute(u.attr, tr);
      else if (u.type === 'text') {
        var v = u.node.nodeValue;
        var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
        u.node.nodeValue = lead + decode(tr) + trail;
        if (translatedNodes) translatedNodes.add(u.node);
      } else {
        applyHtml(u.node, tr);
        if (translatedNodes) translatedNodes.add(u.node);
      }
      done++;
    }
    return done;
  }

  /* Diagramma rasmlari: assets/x.svg → assets/i18n/<til>/x.svg */
  function swapImages(root) {
    var map = window.I18N_PAGE && window.I18N_PAGE.i;
    if (!map) return;
    var imgs = root.tagName === 'IMG' ? [root] : root.querySelectorAll('img[src]');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute('src');
      if (map[src]) imgs[i].setAttribute('src', map[src]);
    }
  }

  function translate(root) {
    var page = window.I18N_PAGE;
    if (!page || !page.h) return 0;
    root = root || document.body;
    swapImages(root);
    return apply(collect(root), page.h);
  }

  function observe() {
    if (!window.MutationObserver) return;
    var pending = [], scheduled = false;
    function flush() {
      scheduled = false;
      var list = pending; pending = [];
      for (var i = 0; i < list.length; i++) {
        var n = list[i];
        if (!n.isConnected || (translatedNodes && translatedNodes.has(n))) continue;
        if (n.nodeType === 3) {
          var p = n.parentNode;
          if (p && p.nodeType === 1 && !p.closest('[data-i18n],[data-i18n-html],[translate="no"],.katex,script,style')) translate(p);
        } else if (n.nodeType === 1) {
          if (!n.closest || !n.closest('[data-i18n-skip],[translate="no"],.katex,.katex-display')) translate(n);
        }
      }
    }
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData') pending.push(m.target);
        for (var j = 0; j < m.addedNodes.length; j++) pending.push(m.addedNodes[j]);
      }
      if (!scheduled && pending.length) { scheduled = true; (window.queueMicrotask || setTimeout)(flush); }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function start() {
    translate(document.body);
    observe();
  }

  window.I18NContent = { collect: collect, hash: hash, norm: norm, translate: translate, apply: apply };

  if (window.I18N_PAGE && window.__I18N_BOOT_LANG__ && window.__I18N_BOOT_LANG__ !== 'uz') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})();
