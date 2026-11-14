"use strict";
/* ILIMZIYO 2.0 universal offline laboratory journal pure functions. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.ILIMZIYO_JOURNAL_CORE=api;})(typeof globalThis!=="undefined"?globalThis:null,function(){
  const SCHEMA="ilimziyo-lab-journal-v1", MAX_ROWS=100, LIMIT=1e12;
  const NUM=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  const clipped=(x,n)=>String(x??"").trim().slice(0,n);
  function numeric(x,optional=false) {
    const s=String(x??"").trim().replace(",",".");
    if(optional&&s==="")return null;
    if(!NUM.test(s))throw new RangeError("Haqiqiy son kiriting.");
    const n=Number(s);
    if(!Number.isFinite(n)||Math.abs(n)>LIMIT)throw new RangeError("Son chegaradan tashqarida.");
    return n;
  }
  function calcError(measured,reference){
    const absolute=Math.abs(measured-reference);
    const r=reference===0?null:100*absolute/Math.abs(reference);
    return {absolute,relative:Number.isFinite(r)?r:null};
  }
  function record(raw){
    if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new TypeError("Noto‘g‘ri qayd.");
    const id=clipped(raw.id,64),date=clipped(raw.date,40),unit=clipped(raw.unit,24);
    if(!/^[a-zA-Z0-9_-]{1,64}$/.test(id))throw new RangeError("Qayd ID noto‘g‘ri.");
    if(!date||!Number.isFinite(Date.parse(date)))throw new RangeError("Sana noto‘g‘ri.");
    if(!unit)throw new RangeError("O‘lchov birligini kiriting.");
    return {id,date,x:numeric(raw.x,true),measured:numeric(raw.measured),reference:numeric(raw.reference),unit,note:clipped(raw.note,180)};
  }
  function normalizeRecords(raw){
    if(!Array.isArray(raw)||raw.length>MAX_ROWS)throw new RangeError("100 ta qayd chegarasi.");
    const rows=raw.map(record),seen=new Set();
    for(const row of rows){
      if(seen.has(row.id))throw new RangeError("Takrorlangan qayd ID.");
      seen.add(row.id);
      if(row.unit!==rows[0].unit)throw new RangeError("Bir jurnalga yagona birlik yozing.");
    }
    return rows;
  }
  function snapshot(lab,rows) {
    if(!Number.isInteger(lab)||lab<1||lab>15)throw new RangeError("Noto‘g‘ri laboratoriya raqami.");
    return {schema:SCHEMA,lab,exportedAt:new Date().toISOString(),records:normalizeRecords(rows)};
  }
  function restore(json,lab){
    const p=typeof json==="string"?JSON.parse(json):json;
    if(!p||p.schema!==SCHEMA||p.lab!==lab)throw new RangeError("Ushbu laboratoriya uchun JSON formati noto‘g‘ri.");
    return normalizeRecords(p.records);
  }
  function summary(rows){
    const all=normalizeRecords(rows),errors=all.map(r=>calcError(r.measured,r.reference));
    const rel=errors.filter(e=>e.relative!==null).map(e=>e.relative);
    const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
    return {count:all.length,meanAbsolute:mean(errors.map(e=>e.absolute)),meanRelative:mean(rel),
      maxAbsolute:errors.length?Math.max(...errors.map(e=>e.absolute)):null,relativeCount:rel.length};
  }
  const decimal=n=>n===null?"—":Number(n).toLocaleString("en-US",{maximumFractionDigits:6,useGrouping:false});
  function csvCell(value,untrusted=false){
    let v=String(value??"");
    if(untrusted&&/^[\s\u0000-\u001f]*[=+\-@]/.test(v))v="'"+v;
    return '"'+v.replace(/"/g,'""')+'"';
  }
  function toCsv(lab,records){
    const rows=normalizeRecords(records);
    const fields=["Laboratoriya","№","Sana","Parametr X","O‘lchangan","Etalon","Absolyut xatolik","Nisbiy xatolik (%)","Birlik","Izoh"];
    const lines=[fields.map(v=>csvCell(v)).join(",")];
    rows.forEach((r,i)=>{
      const e=calcError(r.measured,r.reference);
      const values=[lab,i+1,r.date,r.x===null?"":r.x,r.measured,r.reference,e.absolute,e.relative===null?"":e.relative,r.unit,r.note];
      lines.push(values.map((v,k)=>csvCell(v,k===8||k===9)).join(","));
    });
    return "\ufeff"+lines.join("\r\n")+"\r\n";
  }
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function reportHtml(lab,title,records){
    const rows=normalizeRecords(records),s=summary(rows);
    const tableRows=rows.map((r,i)=>{
      const e=calcError(r.measured,r.reference);
      return "<tr>"+[i+1,r.date,r.x===null?"—":r.x,r.measured,r.reference,decimal(e.absolute),
        e.relative===null?"N/A":decimal(e.relative)+"%",r.unit,r.note].map(v=>"<td>"+escapeHtml(v)+"</td>").join("")+"</tr>";
    }).join("");
    const heads=["№","Sana","X","O‘lchangan","Etalon","|Δ|","Xatolik, %","Birlik","Izoh"];
    return '<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>ILIMZIYO laboratoriya hisoboti</title>'+
      '<style>body{font:15px/1.5 system-ui,sans-serif;margin:32px;color:#17283b}table{border-collapse:collapse;width:100%}'+
      'th,td{border:1px solid #9eb2bf;padding:7px;text-align:left}th{background:#e6eff8}'+
      '@media print{body{margin:12mm}table{font-size:10px}}</style></head><body>'+
      '<h1>ILIMZIYO '+lab+'-laboratoriya hisoboti</h1><p>'+escapeHtml(title)+'</p>'+
      '<p>Qaydlar: '+s.count+' | O‘rtacha absolyut xatolik: '+decimal(s.meanAbsolute)+
      ' | O‘rtacha nisbiy xatolik: '+decimal(s.meanRelative)+'% (etalon nol bo‘lmagan '+s.relativeCount+' qayd)</p>'+
      '<p>Natijalar foydalanuvchi tomonidan kiritilgan, rasmiy tasdiqlangan eksperimental ma’lumot emas.</p>'+
      '<table><thead><tr>'+heads.map(h=>"<th>"+h+"</th>").join("")+'</tr></thead><tbody>'+tableRows+'</tbody></table>'+
      '<p>Faylni brauzerda oching va Chop etish → PDF sifatida saqlashni tanlang.</p></body></html>';
  }
  return {SCHEMA,MAX_ROWS,numeric,calcError,record,normalizeRecords,snapshot,restore,summary,decimal,toCsv,escapeHtml,reportHtml};
});
