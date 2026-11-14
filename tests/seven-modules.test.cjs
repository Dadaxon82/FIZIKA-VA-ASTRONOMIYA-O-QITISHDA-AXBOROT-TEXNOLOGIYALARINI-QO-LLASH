"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("7 functional modules appear as exact sections",()=>{
 const html=read("modullar.html");
 for(const name of ["textbook","tutor","lab","datalab","analytics","practice","portfolio"]){
  assert.ok(html.includes('id="'+name+'"'),name);
  assert.ok(html.includes('href="#'+name+'"'),name+" nav");
 }
 assert.ok(html.includes('id="hemis"'));
});
test("all 45 learning materials remain and site navigation points to hub",()=>{
 for(let i=1;i<=15;i++){assert.ok(fs.existsSync(path.join(root,"lecture"+i+".html")));assert.ok(fs.existsSync(path.join(root,"lab"+i+".html")))}
 assert.ok(fs.existsSync(path.join(root,"mustaqil.html")));
 assert.match(read("index.html"),/href="modullar\.html"/);
});
test("no false grading, fake certificates or remote student tracking",()=>{
 const h=read("modullar.html"),js=read("js/modullar.js");
 assert.match(h,/Baholash va topshiriqlarni topshirish — HEMISda/);
 assert.match(h,/generativ AI suhbat emas/);
 assert.match(h,/Sertifikat bu saytda yaratilmaydi/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\blocalStorage\b|https?:\/\//);
});
test("science lab and portfolio offer interactive offline actions",()=>{
 const h=read("modullar.html"),js=read("js/modullar.js");
 for(const id of ["csv-file","csv-sample","csv-export","chart","template","search-results"])assert.ok(h.includes('id="'+id+'"'),id);
 assert.match(js,/parseCSV/);assert.match(js,/getContext\("2d"\)/);
 assert.match(js,/URL\.createObjectURL/);assert.match(js,/addEventListener\("input"/);
});
