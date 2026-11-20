"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("Home sections have identical three-column card structures",()=>{
 const html=read("index.html");
 const parts={};
 for(const id of ["maruzalar","mustaqil","laboratoriyalar"]){
   const start=html.indexOf('<section id="'+id+'"');
   assert.ok(start>=0,id+" not found");
   const close=html.indexOf("</section>",start);
   assert.ok(close>start,id+" section not closed");
   parts[id]=html.slice(start,close);
   assert.match(parts[id],/class="grid grid-3"/,id+" must use common grid");
   assert.equal((parts[id].match(/<a class="card"/g)||[]).length,15,id+" must contain 15 cards");
 }
 for(let i=1;i<=15;i++){
   const id=String(i).padStart(2,"0");
   assert.ok(parts.mustaqil.includes('href="mustaqil.html#mt-'+id+'"'),"missing MT-"+id);
   assert.ok(read("mustaqil.html").includes('id="mt-'+id+'"'),"missing destination "+id);
 }
});
test("Independent detail page follows main theme colors and card styling",()=>{
 // Sayt yagona yorug' (light) akademik mavzuga o'tgan: asosiy tokenlar
 // styles.css (bosh sahifa) va css/main.css (ichki sahifalar)da bir xil.
 const main=read("styles.css").toUpperCase();
 const shared=read("css/main.css").toUpperCase();
 for(const token of ["#F6F7F9","#11182B","#1C4E9E"]) {
   assert.ok(main.includes(token),"styles.css missing "+token);
   assert.ok(shared.includes(token),"css/main.css missing "+token);
 }
 assert.match(read("styles.css"),/color-scheme:\s*light/);
 const page=read("mustaqil.html");
 for(const css of ["css/main.css","css/components.css","css/mustaqil-public.css"])
   assert.ok(page.includes('href="'+css+'"'),"mustaqil.html missing "+css);
 const independent=read("css/mustaqil-public.css");
 assert.match(independent,/\.task-card:hover/);
 assert.match(independent,/color-scheme:\s*light/);
 assert.doesNotMatch(independent,/color-scheme:\s*dark/);
});
test("HEMIS-only grading preserved, lessons unchanged",()=>{
 const home=read("index.html"),tasks=read("mustaqil.html");
 assert.match(home,/Rasmiy topshirish va baholash — HEMISda/);
 assert.match(tasks,/HEMIS platformasida/);
 for(let i=1;i<=15;i++) assert.ok(fs.existsSync(path.join(root,"lecture"+i+".html"))&&fs.existsSync(path.join(root,"lab"+i+".html")));
});
