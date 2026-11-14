"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const data=require("../js/mustaqil-data.js"), core=require("../js/mustaqil-core.js");
const root=path.resolve(__dirname,"..");
test("Curriculum: 15 assignments of four hours = 60",()=>{
  assert.equal(data.tasks.length,15);
  assert.equal(data.courseHours,60);
  assert.equal(data.tasks.reduce((s,t)=>s+t.hours,0),60);
  assert.deepEqual(data.tasks.map(t=>t.id),Array.from({length:15},(_,i)=>i+1));
});
test("Each task has official framing, practical steps, sample, evidence and criteria",()=>{
  for(const t of data.tasks){
    assert.ok(t.official.length>50);
    assert.ok(t.steps.length>=4);
    assert.ok(t.sample.length>80);
    assert.ok(t.deliverables.length>=2);
    assert.equal(t.check.length,3);
    assert.ok(t.tn.length>=1);
    for(const href of t.refs) assert.ok(fs.existsSync(path.join(root,href)),href);
  }
});
test("Index and dashboard link to assignment page",()=>{
  const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const dashboard=fs.readFileSync(path.join(root,"kabinet.html"),"utf8");
  assert.match(index,/href="mustaqil\.html"/);
  assert.match(dashboard,/href="mustaqil\.html"/);
  const html=fs.readFileSync(path.join(root,"mustaqil.html"),"utf8");
  assert.match(html,/js\/mustaqil-data\.js/);
  assert.match(html,/js\/mustaqil-ui\.js/);
});
test("Progress counts only self-marked completed, not checklist",()=>{
  assert.equal(core.status({1:{completed:true},2:{checked:[0,1,2]}}).completed,1);
  assert.equal(core.status({1:{completed:true}}).percentage,7);
});
test("Invalid data is normalized, malicious links are discarded",()=>{
  const x=core.normalize({1:{note:"X".repeat(7000),url:"javascript:alert(1)",checked:[0,2,99],completed:true},
    16:{completed:true}});
  assert.equal(x[1].note.length,6000);
  assert.equal(x[1].url,"");
  assert.deepEqual(x[1].checked,[0,2]);
  assert.equal(x[16],undefined);
});
test("JSON backup round-trip and schema validation",()=>{
  const original={3:{note:"Qiyosiy jadval",url:"https://example.org/my-study",checked:[0,1],completed:true}};
  const restored=core.importJson(core.exportJson(original));
  assert.deepEqual(restored,core.normalize(original));
  assert.throws(()=>core.importJson('{"schema":"wrong","records":{}}'),RangeError);
  assert.throws(()=>core.importJson("{not json"),SyntaxError);
});
test("Markdown document includes assignment and is not official submission",()=>{
  const text=core.markdown(data.tasks[0],{note:"O‘z ilmiy xulosam",url:"https://example.org/portfolio",
    checked:[0,2],completed:true});
  assert.match(text,/O‘z ilmiy xulosam/);
  assert.match(text,/https:\/\/example.org\/portfolio/);
  assert.match(text,/o‘qituvchiga yuborilmaydi/);
  assert.match(text,/\[x\]/);
});
test("No network submission and no hidden grade",()=>{
  const js=fs.readFileSync(path.join(root,"js/mustaqil-ui.js"),"utf8");
  assert.match(js,/localStorage/);
  assert.doesNotMatch(js,/\bfetch\s*\(/);
  assert.doesNotMatch(js,/innerHTML\s*=/);
  assert.match(fs.readFileSync(path.join(root,"mustaqil.html"),"utf8"),/20 ball laboratoriya/);
});
