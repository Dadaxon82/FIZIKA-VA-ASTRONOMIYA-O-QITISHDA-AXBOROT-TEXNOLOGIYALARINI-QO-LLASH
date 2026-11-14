'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(ROOT, 'js/kabinet.js'), 'utf8');

function element(tag = 'div') {
  return {
    tag, textContent: '', checked: false, value: '', dataset: {},
    attrs: {}, children: [], events: {},
    append(...nodes) { this.children.push(...nodes); },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, cb) { this.events[name] = cb; },
    click() { this.clicked = true; },
  };
}

function boot(saved = null) {
  const ids = ['message', 'lecture-count', 'lab-count', 'total-count', 'progress',
    'lectures', 'labs', 'import', 'export', 'reset'];
  const dom = Object.fromEntries(ids.map(id => [id, element()]));
  const store = new Map();
  if (saved != null) store.set('ilimziyo.v2.progress.v1', saved);
  const doc = {
    getElementById: id => dom[id],
    createElement: element,
    createTextNode: text => ({ text }),
    querySelectorAll: () => [...dom.lectures.children, ...dom.labs.children]
      .map(article => article.children.find(child => child.tag === 'label').children[0]),
  };
  let download = null;
  const browser = {
    document: doc,
    localStorage: {
      getItem: k => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
    },
    Blob,
    URL: {
      createObjectURL: blob => { download = blob; return 'blob:test'; },
      revokeObjectURL: () => {},
    },
    confirm: () => true,
    setTimeout: () => {},
  };
  vm.runInNewContext(script, browser);
  return { dom, doc, store, getDownload: () => download };
}

function checkbox(app, kind, index) {
  return app.dom[kind].children[index].children[1].children[0];
}

test('15 lectures and 15 labs exist and linked HTML pages are present', () => {
  const app = boot();
  assert.equal(app.dom.lectures.children.length, 15);
  assert.equal(app.dom.labs.children.length, 15);
  for (const kind of ['lectures', 'labs']) {
    for (const article of app.dom[kind].children) {
      assert.ok(fs.existsSync(path.join(ROOT, article.children[0].href)),
        `Missing ${article.children[0].href}`);
    }
  }
  assert.match(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /href="kabinet\.html"/);
  assert.match(fs.readFileSync(path.join(ROOT, 'kabinet.html'), 'utf8'), /id="progress"/);
});

test('progress counters update after toggling completion', () => {
  const app = boot();
  const one = checkbox(app, 'lectures', 0);
  const two = checkbox(app, 'labs', 0);
  one.checked = true; one.events.change();
  two.checked = true; two.events.change();
  assert.equal(app.dom['lecture-count'].textContent, '1 / 15');
  assert.equal(app.dom['lab-count'].textContent, '1 / 15');
  assert.equal(app.dom.progress.value, 2);
  assert.equal(app.dom['total-count'].textContent, '7%');
  const stored = JSON.parse(app.store.get('ilimziyo.v2.progress.v1'));
  assert.deepEqual(stored, { lecture1: true, lab1: true });
  one.checked = false; one.events.change();
  assert.equal(app.dom.progress.value, 1);
});

test('saved progress only loads valid marked items', () => {
  const app = boot(JSON.stringify({ lecture1: true, lab15: true,
    lecture2: 'true', arbitrary: true }));
  assert.equal(app.dom.progress.value, 2);
  assert.equal(checkbox(app, 'lectures', 0).checked, true);
  assert.equal(checkbox(app, 'lectures', 1).checked, false);
  assert.equal(checkbox(app, 'labs', 14).checked, true);
});

test('export, reset and import support an offline backup cycle', async () => {
  const app = boot();
  const box = checkbox(app, 'lectures', 2);
  box.checked = true; box.events.change();
  app.dom.export.events.click();
  const exported = await app.getDownload().text();
  assert.equal(JSON.parse(exported).schema, 'ilimziyo-progress-v1');
  app.dom.reset.events.click();
  assert.equal(app.dom.progress.value, 0);
  await app.dom.import.events.change({ target: {
    files: [{size: exported.length, text: async () => exported}], value: 'backup.json',
  }});
  assert.equal(app.dom.progress.value, 1);
  assert.equal(checkbox(app, 'lectures', 2).checked, true);
});

test('malformed JSON cannot overwrite existing saved progress', async () => {
  const app = boot(JSON.stringify({ lab2: true }));
  await app.dom.import.events.change({ target: {
    files: [{ size: 10, text: async () => '{not json' }], value: 'bad.json'
  }});
  assert.equal(app.dom.progress.value, 1);
  assert.match(app.dom.message.textContent, /formati noto‘g‘ri/);
});
