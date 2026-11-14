"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const core=require("../js/experiment-journal-core.js");
const root=path.resolve(__dirname,"..");
const sample=(id="s1",measured="2.55",reference="2.50",unit="s")=>
 ({id,date:"2026-11-14T12:00:00.000Z",x:"0.1",measured,reference,unit,note:"Mayatnik"});
test("all 15 labs include journal files",()=>{
 for(let i=1;i<=15;i++){const html=fs.readFileSync(path.join(root,"lab"+i+".html"),"utf8");
  assert.match(html,/href="css\/experiment-journal\.css"/);
  assert.match(html,/src="js\/experiment-journal-core\.js"/);
  assert.match(html,/src="js\/experiment-journal\.js"/);
  assert.equal((html.match(/<\/body>/gi)||[]).length,1)}
});
test("numbers: Uzbek decimal comma and invalid values",()=>{
 assert.equal(core.numeric("2,50"),2.5);assert.equal(core.numeric("",true),null);
 for(const x of ["","NaN","Infinity","2+3","0x12","1e9999","1e13"])assert.throws(()=>core.numeric(x),RangeError);
 assert.equal(core.record(sample()).measured,2.55)
});
test("error calculations and zero reference",()=>{
 const d=core.calcError(2.55,2.5);
 assert.ok(Math.abs(d.absolute-0.05)<1e-10);assert.ok(Math.abs(d.relative-2)<1e-10);
 assert.equal(core.calcError(1,0).relative,null)
});
test("mean error ignores undefined relative errors",()=>{
 const s=core.summary([core.record(sample()),core.record(sample("s2","5","0"))]);
 assert.equal(s.count,2);assert.ok(Math.abs(s.meanAbsolute-2.525)<1e-10);
 assert.ok(Math.abs(s.meanRelative-2)<1e-10);assert.equal(s.relativeCount,1)
});
test("JSON backup validates lab, duplicate rows and common unit",()=>{
 const rows=[core.record(sample())],backup=core.snapshot(4,rows);
 assert.deepEqual(core.restore(JSON.stringify(backup),4),rows);
 assert.throws(()=>core.restore(backup,5),RangeError);
 assert.throws(()=>core.restore({...backup,records:[rows[0],rows[0]]},4),RangeError);
 assert.throws(()=>core.normalizeRecords([sample("a",1,2,"s"),sample("b",1,2,"m")]),RangeError);
 assert.throws(()=>core.normalizeRecords(Array.from({length:101},(_,i)=>sample("s"+i))),RangeError)
});
test("CSV export includes BOM and safe formula cells",()=>{
 const r=[core.record({...sample(),unit:"=CMD",note:"=HYPERLINK(1)"})],csv=core.toCsv(1,r);
 assert.ok(csv.startsWith("\ufeff"));assert.match(csv,/'=CMD/);assert.match(csv,/'=HYPERLINK/)
});
test("HTML report escapes user-provided code",()=>{
 const html=core.reportHtml(7,'<img src=x onerror=alert(1)>',[core.record({...sample(),note:"<script>bad</script>"})]);
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.doesNotMatch(html,/<img src=x onerror/)
});
test("journal has no external requests",()=>{
 const js=fs.readFileSync(path.join(root,"js/experiment-journal.js"),"utf8");
 assert.match(js,/localStorage/);assert.match(js,/location\.pathname/);assert.doesNotMatch(js,/\bfetch\s*\(/)
});
