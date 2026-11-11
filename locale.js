(function () {
  'use strict';
  const supported = ['en', 'ko', 'ja'];
  const query = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('atlas-language'); } catch (_) {}
  const language = supported.includes(query) ? query : supported.includes(saved) ? saved : 'en';
  const dictionary = window.ATLAS_TRANSLATIONS || {};
  const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  const pattern = keys.length ? new RegExp(keys.map(escaped).join('|'), 'g') : null;
  const index = language === 'ja' ? 1 : 0;
  function translate(value) {
    if (typeof value !== 'string' || language === 'ko' || !pattern) return value;
    value = value.replace(/(\d+)주(?=[+(\s]|$)/g, language === 'ja' ? '$1週間' : '$1 weeks');
    let result = value.replace(pattern, (source, offset, full) => {
      let replacement = dictionary[source][index] || dictionary[source][0] || source;
      if (language === 'en') {
        if (/[A-Za-z0-9]$/.test(full.slice(0, offset)) && /^[A-Za-z0-9]/.test(replacement)) replacement = ' ' + replacement;
        if (/[A-Za-z0-9]$/.test(replacement) && /^[A-Za-z0-9]/.test(full.slice(offset + source.length))) replacement += ' ';
      }
      return replacement;
    });
    if (language === 'en') result = result.replace(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)*) \(\1\)/g, '$1');
    return result;
  }
  window.atlasLanguage = language;
  window.atlasTranslate = translate;
  document.documentElement.lang = language;
  try { localStorage.setItem('atlas-language', language); } catch (_) {}

  // Canvas charts and their tooltips also use the selected language.
  if (window.CanvasRenderingContext2D) {
    for (const method of ['fillText', 'strokeText', 'measureText']) {
      const original = CanvasRenderingContext2D.prototype[method];
      if (original) CanvasRenderingContext2D.prototype[method] = function(text, ...args) { return original.call(this, translate(text), ...args); };
    }
  }
  if (window.Chart) {
    function localize(value, seen = new WeakSet()) {
      if (typeof value === 'string') return translate(value);
      if (typeof value === 'function') return function(...args) { return localize(value.apply(this, args)); };
      if (!value || typeof value !== 'object' || seen.has(value)) return value;
      seen.add(value);
      if (Array.isArray(value)) return value.map(item => localize(item, seen));
      if (Object.getPrototypeOf(value) === Object.prototype) for (const key of Object.keys(value)) value[key] = localize(value[key], seen);
      return value;
    }
    window.Chart = new Proxy(window.Chart, { construct(target, args) { args[1] = localize(args[1]); return Reflect.construct(target, args); } });
  }
  const alertOriginal = window.alert;
  window.alert = text => alertOriginal.call(window, translate(String(text)));

  let observer;
  function translateDOM(root) {
    if (language === 'ko') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    const nodes = [root];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.nodeType === 1 ? node : node.parentElement;
      if (!parent || parent.closest('script,style,textarea,[data-atlas-ignore]')) continue;
      if (node.nodeType === 3) {
        const translated = translate(node.nodeValue);
        if (translated !== node.nodeValue) node.nodeValue = translated;
      } else if (node.nodeType === 1) {
        for (const attribute of ['placeholder', 'title', 'aria-label', 'alt']) {
          if (node.hasAttribute(attribute)) {
            const old = node.getAttribute(attribute), next = translate(old);
            if (old !== next) node.setAttribute(attribute, next);
          }
        }
      }
    }
  }
  function apply() {
    observer?.disconnect();
    if (typeof document === 'undefined' || !document.body) return;
    translateDOM(document.body);
    observer?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder','title','aria-label','alt'] });
  }
  let started = false;
  function start() {
    if (started || !document.body) return;
    started = true;
    const controls = document.createElement('div');
    controls.dataset.atlasIgnore = '';
    controls.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;background:#0f172a;border-bottom:1px solid #334155;color:#cbd5e1;font:13px system-ui;position:relative;z-index:50';
    const label = document.createElement('label'); label.htmlFor = 'atlas-language';
    label.textContent = language === 'ja' ? '言語' : language === 'ko' ? '언어' : 'Language';
    const select = document.createElement('select'); select.id = 'atlas-language';
    select.style.cssText = 'background:#1e293b;color:white;padding:7px 12px;border:1px solid #64748b;border-radius:6px';
    for (const [value, name] of [['en','English'],['ko','한국어'],['ja','日本語']]) {
      const option = new Option(name, value, false, language === value); select.append(option);
    }
    select.addEventListener('change', () => {
      try { localStorage.setItem('atlas-language', select.value); } catch (_) {}
      const url = new URL(location.href); url.searchParams.set('lang', select.value);
      const current = document.querySelector('.nav-tab-btn.bg-cyan-500')?.getAttribute('data-tab');
      if (current) url.searchParams.set('view', current);
      location.assign(url.href);
    });
    const note = document.createElement('span');
    note.style.cssText = 'font-size:11px;color:#94a3b8';
    note.textContent = language === 'en' ? 'Automatic translation · Korean original' : language === 'ja' ? '自動翻訳 · 原文は韓国語' : '한국어 원문';
    controls.append(label, select, note); document.body.prepend(controls);
    observer = new MutationObserver(apply);
    apply();
    queueMicrotask(() => {
      const view = new URLSearchParams(location.search).get('view');
      if (view) document.querySelector('.nav-tab-btn[data-tab="'+CSS.escape(view)+'"]')?.click();
      apply(); document.documentElement.classList.remove('atlas-i18n-pending');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
