"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const D = require("../js/diagnostika-data.js");
const root = path.resolve(__dirname,"..");
const answers=(correct=true)=>Object.fromEntries(D.questions.map(q=>[q.id, correct?q.correct:(q.correct+1)%q.choices.length]));

test("10 ta savol: 4 fizika, 2 SI, 2 matematika, 2 kod",()=>{
  assert.equal(D.questions.length,10);
  assert.equal(new Set(D.questions.map(q=>q.id)).size,10);
  for(const [id,n] of Object.entries({fizika:4,birlik:2,matematika:2,kod:2})){
    assert.equal(D.questions.filter(q=>q.area===id).length,n);
  }
  for(const q of D.questions) {
    assert.equal(q.choices.length,4);
    assert.ok(Number.isInteger(q.correct));
    assert.ok(q.correct>=0 && q.correct<q.choices.length);
    assert.ok(q.explanation.length>20);
    assert.ok(q.misconception.length>15);
    assert.ok(fs.existsSync(path.join(root,q.href)),"Missing linked learning material "+q.href);
  }
});

test("Blum bosqichlari va ijodiy topshiriq ajratilgan",()=>{
  const levels=new Set(D.questions.map(q=>q.bloom));
  for(const level of ["Eslab qolish","Tushunish","Qo‘llash","Tahlil qilish","Baholash"]) assert.ok(levels.has(level));
  const html=fs.readFileSync(path.join(root,"diagnostika.html"),"utf8");
  assert.match(html,/Yaratish/);
  assert.match(html,/avtomatik baholanmaydi/);
  assert.match(html,/id="diagnostic-form"/);
});

test("Barcha javoblar to‘g‘ri: 10/10 va Ilg‘or yo‘nalish",()=>{
  const result=D.evaluate(answers());
  assert.equal(result.correct,10);
  assert.equal(result.percent,100);
  assert.equal(result.track,"ilgor");
  assert.equal(result.feedback.length,10);
  for(const area of Object.values(result.byArea)) assert.equal(area.percent,100);
});

test("Barcha noto‘g‘ri javoblar: 0/10 va Boshlang‘ich yo‘nalish",()=>{
  const result=D.evaluate(answers(false));
  assert.equal(result.correct,0);
  assert.equal(result.percent,0);
  assert.equal(result.track,"boshlangich");
  assert.equal(result.feedback.filter(f=>!f.correct).length,10);
  assert.ok(result.feedback.every(f=>f.explanation && f.misconception && f.href));
});

test("Chegaraviy baholash: 5/10 O‘rta, 8/10 lekin bir yo‘nalish 0 bo‘lsa O‘rta",()=>{
  const five=answers(false);
  D.questions.slice(0,5).forEach(q=>five[q.id]=q.correct);
  assert.equal(D.evaluate(five).track,"orta");
  const eight=answers();
  D.questions.filter(q=>q.area==="kod").forEach(q=>eight[q.id]=(q.correct+1)%4);
  const r=D.evaluate(eight);
  assert.equal(r.correct,8);
  assert.equal(r.track,"orta");
  assert.equal(r.weakestArea,"kod");
});

test("Yetishmayotgan, noto‘g‘ri va tashqi javoblar tekshiriladi",()=>{
  assert.throws(()=>D.evaluate({}),RangeError);
  const invalid=answers();
  invalid.f1=99;
  assert.throws(()=>D.evaluate(invalid),RangeError);
  invalid.f1="1";
  assert.throws(()=>D.evaluate(invalid),RangeError);
  assert.throws(()=>D.evaluate(null),TypeError);
});

test("O‘quv rejalari 3 yo‘nalishda 4 haftalik va mavjud sahifaga havolali",()=>{
  for(const key of ["boshlangich","orta","ilgor"]) {
    assert.equal(D.tracks[key].weeks.length,4);
    for(const week of D.tracks[key].weeks) {
      assert.ok(fs.existsSync(path.join(root,week.href)),week.href);
      assert.ok(week.task.length>20);
    }
  }
  assert.match(fs.readFileSync(path.join(root,"index.html"),"utf8"),/href="diagnostika\.html"/);
  assert.match(fs.readFileSync(path.join(root,"kabinet.html"),"utf8"),/href="diagnostika\.html"/);
});

test("JS ishlashi tashqi kutubxona va AI API ga bog‘liq emas",()=>{
  const ui=fs.readFileSync(path.join(root,"js/diagnostika-ui.js"),"utf8");
  assert.doesNotMatch(ui, /fetch\s*\(/);
  assert.doesNotMatch(ui, /innerHTML\s*=/);
  assert.match(ui,/localStorage/);
});
