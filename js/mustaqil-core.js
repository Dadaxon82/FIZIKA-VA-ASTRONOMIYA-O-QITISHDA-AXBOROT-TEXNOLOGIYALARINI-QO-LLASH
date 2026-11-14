"use strict";
/* Pure offline portfolio helpers; this is not an LMS submission API. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.ILIMZIYO_INDEPENDENT_CORE=api;})(typeof globalThis!=="undefined"?globalThis:null,function(){
  const SCHEMA="ilimziyo-independent-v1", MAX_NOTE=6000, MAX_URL=512, LIMIT=15;
  function normalize(raw){
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
    const out={};
    for(let i=1;i<=LIMIT;i++){
      const item=raw[String(i)];
      if(!item||typeof item!=="object"||Array.isArray(item))continue;
      const note=String(item.note??"").slice(0,MAX_NOTE);
      const url=String(item.url??"").trim().slice(0,MAX_URL);
      const validUrl=/^https?:\/\/[^\s<>]+$/i.test(url)?url:"";
      const checked=Array.isArray(item.checked)?[0,1,2].filter(k=>item.checked.includes(k)):[];
      out[i]={note,url:validUrl,checked,completed:item.completed===true};
    }
    return out;
  }
  function status(records) {
    const normalized=normalize(records);
    const done=Object.values(normalized).filter(x=>x.completed).length;
    const started=Object.values(normalized).filter(x=>x.note.trim()||x.url||x.checked.length).length;
    return {total:LIMIT,completed:done,started,percentage:Math.round(done/LIMIT*100)};
  }
  function exportJson(records){
    return JSON.stringify({schema:SCHEMA,exportedAt:new Date().toISOString(),records:normalize(records)},null,2);
  }
  function importJson(json){
    if(typeof json!=="string"||json.length>150000)throw new RangeError("Fayl hajmi noto‘g‘ri.");
    const parsed=JSON.parse(json);
    if(!parsed||parsed.schema!==SCHEMA||typeof parsed.records!=="object"||
       Array.isArray(parsed.records)||!parsed.records)throw new RangeError("Mustaqil ta’lim fayli formati noto‘g‘ri.");
    return normalize(parsed.records);
  }
  function markdown(task,record) {
    if(!task||!Number.isInteger(task.id)||task.id<1||task.id>15)throw new TypeError("Topshiriq noto‘g‘ri.");
    const state=normalize({[task.id]:record})[task.id]||{note:"",url:"",checked:[],completed:false};
    const safe=t=>String(t??"").replace(/[\r\n]+/g," ").trim();
    return ["# MT-"+task.id+": "+safe(task.title),"", "**Fan dasturidagi mavzu:** "+safe(task.official),
      "**Ajratilgan vaqt:** 4 soat","","## Yo‘riqnoma",
      ...task.steps.map((s,i)=>(i+1)+". "+safe(s)),"","## Namunaviy yo‘l-yo‘riq",task.sample,
      "","## Topshiriladigan mahsulot",...task.deliverables.map(x=>"- "+safe(x)),
      "","## Talabaning ishlanmasi / xulosasi",state.note||"(To‘ldirilmagan)",
      "","## Ish dalili havolasi",state.url||"(Kiritilmagan)",
      "","## O‘zini tekshirish",...task.check.map((s,i)=>"- ["+(state.checked.includes(i)?"x":" ")+"] "+safe(s)),
      "","**Talaba belgisi:** "+(state.completed?"Bajarildi (o‘zi belgilagan)":"Hali yakunlanmagan"),
      "","*Ushbu fayl avtomatik ravishda o‘qituvchiga yuborilmaydi. Bahoni o‘qituvchi qo‘yadi.*",""].join("\n");
  }
  return {SCHEMA,MAX_NOTE,normalize,status,exportJson,importJson,markdown};
});
