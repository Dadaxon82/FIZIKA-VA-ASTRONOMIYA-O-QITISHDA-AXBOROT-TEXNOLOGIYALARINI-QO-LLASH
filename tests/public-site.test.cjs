"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const load=p=>fs.readFileSync(path.join(root,p),"utf8");
test("15 ma'ruza va 15 laboratoriya",()=>{
 for(let i=1;i<=15;i++){
  assert.ok(fs.existsSync(path.join(root,"lecture"+i+".html")));
  assert.ok(fs.existsSync(path.join(root,"lab"+i+".html")));
 }
});
test("15 ta to'rt soatli topshiriq va alohida yo'riqnoma",()=>{
 const html=load("mustaqil.html");
 assert.equal((html.match(/class="task-card"/g)||[]).length,15);
 assert.equal((html.match(/Fan dasturidagi mustaqil topshiriq · 4 soat/g)||[]).length,15);
 assert.equal((html.match(/class="download-guide"/g)||[]).length,15);
 for(let i=1;i<=15;i++){
  const n=String(i).padStart(2,"0");
  assert.ok(html.includes('href="yoriqnomalar/MT-'+n+'.md"'));
  const text=load("yoriqnomalar/MT-"+n+".md");
  assert.match(text,/Bajarish namunasi/);assert.match(text,/HEMIS/);
 }
});
test("Baholash faqat HEMISda",()=>{
 const index=load("index.html"),guide=load("mustaqil.html");
 assert.match(index,/id="hemis"/);
 assert.match(index,/O‘quv topshiriqlarini bajarish hamda bilimlarni raqamli baholash — HEMIS platformasi orqali amalga oshiriladi/);
 assert.match(guide,/HEMIS platformasida/);
 assert.doesNotMatch(index,/id="total-score"|class="score-row"|id="baholash"/);
 assert.doesNotMatch(load("app.js"),/calculateScore/);
});
test("Navigatsiya va qidiruv",()=>{
 const index=load("index.html"),guide=load("mustaqil.html");
 assert.match(index,/href="mustaqil\.html"/);
 assert.match(index,/href="lecture1\.html"/);
 assert.match(index,/href="lab15\.html"/);
 assert.match(guide,/astronomiya astronomik/);
 assert.match(guide,/id="search"/);
 assert.match(load("js/mustaqil-public.js"),/addEventListener\('input'/);
});
test("Asosiy domen o'zgarmagan",()=>assert.equal(load("CNAME").trim(),"ilimziyo.uz"));
