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
 const main=read("styles.css");
 const independent=read("css/mustaqil-public.css");
 for(const token of ["#060b16","#22d3ee","#22304a","#93c5fd"]) {
   assert.ok(main.includes(token),"main missing "+token);
   assert.ok(independent.includes(token),"independent missing "+token);
 }
 assert.match(independent,/\.task-card:hover/);
 assert.match(independent,/color-scheme:dark/);
});
test("HEMIS-only grading preserved, lessons unchanged",()=>{
 const home=read("index.html"),tasks=read("mustaqil.html");
 assert.match(home,/Rasmiy topshirish va baholash — HEMISda/);
 assert.match(tasks,/HEMIS platformasida/);
 for(let i=1;i<=15;i++) assert.ok(fs.existsSync(path.join(root,"lecture"+i+".html"))&&fs.existsSync(path.join(root,"lab"+i+".html")));
});
