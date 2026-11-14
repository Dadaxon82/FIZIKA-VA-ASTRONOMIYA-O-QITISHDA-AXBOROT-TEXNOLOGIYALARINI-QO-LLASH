"use strict";
(() => {
const $=id=>document.getElementById(id);
const sources=[
["Nazariy ma’ruzalar","Ma’ruza 1–15: AI, modellashtirish, mexanika, termodinamika, elektromagnit, yadro","index.html#maruzalar","fizika kuch nyuton elektromagnit mexanika induksiya yadro termodinamika ai"],
["Matematik modellashtirish","Mayatnik, sonli usullar va xatoliklar","lecture4.html","mayatnik tebranish rk4 eyler hisoblash xatolik"],
["Elektr zanjirlari","Elektrodinamika va magnit maydon","lecture14.html","elektr magnit faradey induksiya tok zanjir"],
["Aстрономия","Orbital harakat va astronomik ma’lumotlar","astro1.html","astronomiya astronomik orbita sayyora gravitatsiya"],
["Ma’lumotlar vizuallashtirish","Astronomik grafiklar va jism trayektoriyasi","lecture10.html","ma’lumot grafik vizual astronomiya"],
["HTML5 Canvas","Fizik animatsiya va JavaScript","lecture7.html","canvas javascript dasturlash animatsiya fps"],
["Erkin jism diagrammasi","Kuchlar va vektorlar","lecture6.html","kuch vektor erkin jism nyuton"],
["Virtual laboratoriyalar","15 ta interaktiv laboratoriya","index.html#laboratoriyalar","laboratoriya simulyatsiya tajriba"],
["Mustaqil ta’lim","15 ta topshiriq va yo‘riqnoma","mustaqil.html","topshiriq mustaqil portfolio prompt"] ];
const el=(name,text)=>{const e=document.createElement(name);if(text!==undefined)e.textContent=text;return e;};
const search=$("topic"),results=$("search-results");
function lookup(){
 results.replaceChildren();
 const q=search.value.trim().toLocaleLowerCase("uz-UZ").replace(/ʻ|’/g,"'");
 if(q.length<2){results.append(el("p","Mavzu nomini kiriting — mos darslik sahifalari paydo bo‘ladi."));return}
 const words=q.split(/\s+/).filter(Boolean),matches=sources.filter(a=>words.some(w=>(a[0]+" "+a[1]+" "+a[3]).toLocaleLowerCase("uz-UZ").includes(w)));
 if(!matches.length){results.append(el("p","Ushbu atama bo‘yicha tasdiqlangan manba topilmadi. Ma’ruzalar katalogidan qidiring."));return}
 for(const [title,desc,href] of matches.slice(0,7)){const a=el("a",title);a.href=href;a.append(el("small",desc));results.append(a)}
}
search.addEventListener("input",lookup);lookup();
const samples=[["Uzunlik, m","Davr, s",[[.25,1.003],[.5,1.419],[1,2.006],[1.5,2.457],[2,2.837]]]];
let dataset=null;
function parseCSV(input){
 if(typeof input!=="string"||input.length>260000)throw new RangeError("CSV fayl 256 KB dan oshmasin");
 const lines=input.replace(/^\ufeff/,"").trim().split(/\r?\n/).filter(Boolean);
 if(lines.length<2||lines.length>501)throw new RangeError("CSVda sarlavha va 1–500 ta sonli qator bo‘lishi shart");
 const sep=lines[0].includes(";")?";":",";
 const split=s=>s.split(sep).map(x=>x.trim().replace(/^"|"$/g,""));
 const heads=split(lines[0]);if(heads.length!==2||heads.some(x=>!x))throw new RangeError("Faqat ikki ustunli CSV kerak");
 const values=lines.slice(1).map((line,i)=>{
 const cells=split(line);
 if(cells.length!==2)throw new RangeError((i+2)+"-qatordagi CSV ustunlari noto‘g‘ri");
 const v=cells.map(s=>Number(s.replace(",",".")));
 if(v.some(n=>!Number.isFinite(n)||Math.abs(n)>1e12))throw new RangeError((i+2)+"-qatorda yaroqsiz son");
 return v;});
 return {heads,values};
}
function fmt(n){return Number(n).toLocaleString("en-US",{maximumFractionDigits:5,useGrouping:false});}
function plot(){
 const canvas=$("chart"),ctx=canvas.getContext("2d");if(!ctx)return;
 const w=Math.max(300,canvas.getBoundingClientRect().width||900),h=Math.max(180,canvas.getBoundingClientRect().height||310),d=Math.min(2,window.devicePixelRatio||1);
 canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle="#09172a";ctx.fillRect(0,0,w,h);
 ctx.font="12px system-ui";ctx.fillStyle="#cbd5e1";if(!dataset){ctx.fillText("Ma’lumotni tanlang yoki namuna tugmasini bosing.",18,h/2);return}
 const arr=dataset.values,xx=arr.map(p=>p[0]),yy=arr.map(p=>p[1]);
 let minX=Math.min(...xx),maxX=Math.max(...xx),minY=Math.min(...yy),maxY=Math.max(...yy);
 const padX=(maxX-minX)||1,padY=(maxY-minY)||1;minX-=padX*.05;maxX+=padX*.05;minY-=padY*.12;maxY+=padY*.12;
 const L=65,R=w-20,T=26,B=h-48,px=x=>L+(x-minX)/(maxX-minX)*(R-L),py=y=>B-(y-minY)/(maxY-minY)*(B-T);
 ctx.strokeStyle="#55738b";ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();
 for(let j=0;j<=4;j++){const y=minY+(maxY-minY)*j/4,yp=py(y);ctx.fillStyle="#b6c7df";ctx.fillText(fmt(y),3,yp+3);ctx.strokeStyle="#264059";ctx.beginPath();ctx.moveTo(L,yp);ctx.lineTo(R,yp);ctx.stroke();}
 ctx.fillStyle="#b6c7df";ctx.fillText(dataset.heads[0],L,B+30);ctx.fillText(dataset.heads[1],L,T-10);
 ctx.strokeStyle="#38bdf8";ctx.fillStyle="#38bdf8";ctx.lineWidth=2;ctx.beginPath();
 arr.slice().sort((a,b)=>a[0]-b[0]).forEach((p,i)=>{if(i===0)ctx.moveTo(px(p[0]),py(p[1]));else ctx.lineTo(px(p[0]),py(p[1]));});ctx.stroke();
 for(const p of arr){ctx.beginPath();ctx.arc(px(p[0]),py(p[1]),3,0,Math.PI*2);ctx.fill();}
}
function render(){
 $("rows").replaceChildren();$("stats").replaceChildren();
 if(!dataset){$("csv-export").disabled=true;plot();return}
 $("csv-export").disabled=false;$("xh").textContent=dataset.heads[0];$("yh").textContent=dataset.heads[1];
 for(const [x,y] of dataset.values.slice(0,80)){const tr=el("tr");tr.append(el("td",fmt(x)),el("td",fmt(y)));$("rows").append(tr)}
 const vals=dataset.values.map(p=>p[1]),mean=vals.reduce((a,b)=>a+b,0)/vals.length;
 for(const s of ["Nuqtalar: "+vals.length,"Y o‘rtacha: "+fmt(mean),"Y minimum: "+fmt(Math.min(...vals)),"Y maksimum: "+fmt(Math.max(...vals))])$("stats").append(el("span",s));
 plot();
}
function download(text,name,mime){const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=el("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$("csv-sample").addEventListener("click",()=>{const s=samples[0];dataset={heads:s.slice(0,2),values:s[2]};$("csv-status").textContent="Nazariy mayatnik davri — namunaviy ma’lumot";render()});
$("csv-file").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>256*1024)throw new RangeError("CSV 256 KB dan oshmasin");dataset=parseCSV(await file.text());$("csv-status").textContent=file.name+" — "+dataset.values.length+" ta qator yuklandi";render()}catch(err){$("csv-status").textContent="Xatolik: "+err.message}finally{e.target.value=""}});
$("csv-export").addEventListener("click",()=>{if(!dataset)return;const data=[dataset.heads,...dataset.values].map(row=>row.join(",")).join("\r\n");download("\ufeff"+data+"\r\n","ilimziyo-ilmiy-malumot.csv","text/csv;charset=utf-8")});
$("template").addEventListener("click",()=>download("# ILIMZIYO — o‘quv portfolio namunasi\n\n## Mavzu va maqsad\n\n## Nazariy asos, formulalar va SI birliklari\n\n## Algoritm yoki simulyatsiya\n\n## Hisoblashlar va tajriba natijalari\n\n## Xatolar tahlili\n\n## Xulosa\n\n## Manbalar\n\n> Rasmiy ishni HEMISda topshiring. Bu namuna sertifikat emas.\n","ilimziyo-portfolio-namuna.md","text/markdown;charset=utf-8"));
window.addEventListener("resize",plot,{passive:true});render();
})();