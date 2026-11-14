"use strict";
(() => {
  const data=globalThis.ILIMZIYO_INDEPENDENT;
  const core=globalThis.ILIMZIYO_INDEPENDENT_CORE;
  if(!data||!core)return;
  const STORAGE="ilimziyo.v2.independent.v1";
  const $=id=>document.getElementById(id);
  const list=$("mt-list"),status=$("mt-status"),search=$("mt-search"),filter=$("mt-filter");
  let state={};
  try{state=core.normalize(JSON.parse(localStorage.getItem(STORAGE)||"{}"));}
  catch(_){status.textContent="Saqlangan ma’lumotlarni o‘qib bo‘lmadi. JSON zaxiradan foydalaning.";}
  const make=(tag,text,cl)=>{
    const el=document.createElement(tag);
    if(text!==undefined)el.textContent=text;
    if(cl)el.className=cl;
    return el;
  };
  function save(){
    try{localStorage.setItem(STORAGE,JSON.stringify(core.normalize(state)));return true;}
    catch(_){status.textContent="Xotiraga saqlash amalga oshmadi. JSON eksport qiling.";return false;}
  }
  function download(data,name,mime){
    const url=URL.createObjectURL(new Blob([data],{type:mime}));
    const a=make("a");a.download=name;a.href=url;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function progress(){
    const p=core.status(state);
    $("mt-count").textContent=p.completed+" / 15";
    $("mt-progress").value=p.completed;
    $("mt-progress").textContent=p.completed+" / 15";
  }
  function getRecord(id){
    return state[id]||{note:"",url:"",checked:[],completed:false};
  }
  function updateRecord(id,key,value){
    const old=getRecord(id);
    state[id]={...old,[key]:value};
    save();progress();
  }
  function addList(parent,items,ordered){
    const listEl=make(ordered?"ol":"ul");
    for(const item of items)listEl.append(make("li",item));
    parent.append(listEl);
  }
  function render(){
    list.replaceChildren();
    const query=search.value.trim().toLocaleLowerCase();
    const mode=filter.value;
    let rendered=0;
    for(const task of data.tasks){
      const r=getRecord(task.id);
      if(mode==="done"&&!r.completed||mode==="todo"&&r.completed)continue;
      if(query&&!(task.title+" "+task.official+" "+task.sample).toLocaleLowerCase().includes(query))continue;
      rendered++;
      const card=make("details",undefined,"mt-card");
      card.dataset.taskId=String(task.id);
      const head=make("summary");
      const heading=make("span",task.id+". "+task.title,"mt-heading");
      const meta=make("span","4 soat · "+(r.completed?"Bajarildi deb belgilangan":"Yakunlanmagan"),"mt-meta");
      head.append(heading,meta);card.append(head);
      const body=make("div",undefined,"mt-body");
      body.append(make("p",task.official));
      body.append(make("h3","Maqsad va bajarish ketma-ketligi"));
      addList(body,task.steps,true);
      body.append(make("h3","Namuna yo‘riqnoma"));
      body.append(make("p",task.sample,"mt-sample"));
      body.append(make("h3","Topshiriladigan mahsulot"));
      addList(body,task.deliverables,false);
      body.append(make("h3","Fan materiallari"));
      const links=make("div",undefined,"mt-links");
      for(const href of task.refs) {
        const a=make("a",href.startsWith("lecture")?"Ma’ruza "+href.replace(/\D/g,""):
          href.startsWith("lab")?"Laboratoriya "+href.replace(/\D/g,""):"Astronomiya");
        a.href=href;links.append(a);
      }
      body.append(links);
      body.append(make("p","Kutiladigan ta’lim natijalari: "+task.tn.join(", ")+" (metodik moslashtirish).","mt-tip"));
      body.append(make("h3","Talabaning ish jurnali"));
      const editor=make("div",undefined,"mt-editor");
      const noteLabel=make("label","Bajargan ish, tahlil, qisqa xulosa va foydalangan manbalar");
      const note=make("textarea");note.maxLength=core.MAX_NOTE;note.rows=6;note.value=r.note;
      note.placeholder="O‘zingiz bajargan ishni yozing. Bu maydon ishning rasmiy topshirilishi o‘rnini bosmaydi.";
      noteLabel.append(note);editor.append(noteLabel);
      const urlLabel=make("label","Ish dalili havolasi (ixtiyoriy, https://...)");
      const url=make("input");url.type="url";url.placeholder="https://github.com/...";url.value=r.url;
      url.maxLength=512;urlLabel.append(url);editor.append(urlLabel);
      editor.append(make("h3","O‘zini tekshirish ro‘yxati"));
      const checks=[];
      for(const [i,criterion] of task.check.entries()) {
        const label=make("label",undefined,"mt-check");
        const input=make("input");input.type="checkbox";input.checked=r.checked.includes(i);
        checks.push(input);label.append(input,document.createTextNode(criterion));editor.append(label);
      }
      const doneLabel=make("label",undefined,"mt-complete");
      const done=make("input");done.type="checkbox";done.checked=r.completed;
      doneLabel.append(done,document.createTextNode("Bajarildi (o‘zim belgilayman, rasmiy baho emas)"));
      editor.append(doneLabel);
      const buttons=make("div",undefined,"mt-editor-actions");
      const saveButton=make("button","Qaydlarni saqlash");
      saveButton.type="button";
      const exportButton=make("button","Topshiriq yo‘riqnomasi va qaydlarni Markdown (.md) sifatida eksport qilish");
      exportButton.type="button";
      buttons.append(saveButton,exportButton);editor.append(buttons);
      editor.append(make("p","Tayyor mahsulot (PDF, DOCX, PPTX, kod va boshqalar) rasmiy ko‘rsatilgan tizimga alohida topshiriladi.","mt-tip"));
      const sync=()=>{
        const checked=checks.flatMap((x,i)=>x.checked?[i]:[]);
        const rawUrl=url.value.trim();
        if(rawUrl&&!/^https?:\/\/[^\s<>]+$/i.test(rawUrl)){
          status.textContent="Dalil havolasi http:// yoki https:// bilan boshlanishi kerak.";return false;
        }
        state[task.id]={note:note.value.slice(0,core.MAX_NOTE),url:rawUrl,
          checked,completed:done.checked};
        const ok=save();
        progress();meta.textContent="4 soat · "+(done.checked?"Bajarildi deb belgilangan":"Yakunlanmagan");
        return ok;
      };
      saveButton.addEventListener("click",()=>{if(sync())status.textContent=task.id+"-topshiriq bo‘yicha qaydlar saqlandi.";});
      exportButton.addEventListener("click",()=>{
        if(!sync())return;
        download(core.markdown(task,state[task.id]),"ILIMZIYO-MT-"+task.id+".md","text/markdown;charset=utf-8");
        status.textContent="MT-"+task.id+" faylga eksport qilindi. O‘qituvchiga avtomatik yuborilmadi.";
      });
      done.addEventListener("change",()=>{if(sync())status.textContent="Bajarilish holati saqlandi.";});
      for(const cb of checks) cb.addEventListener("change",()=>{sync();});
      note.addEventListener("change",()=>{sync();});
      url.addEventListener("change",()=>{sync();});
      body.append(editor);card.append(body);list.append(card);
    }
    if(!rendered) list.append(make("p","Ushbu filtr bo‘yicha topshiriq topilmadi."));
    progress();
  }
  $("mt-backup").addEventListener("click",()=>{
    download(core.exportJson(state),"ILIMZIYO-mustaqil-progress.json","application/json;charset=utf-8");
    status.textContent="JSON zaxira fayli saqlandi.";
  });
  $("mt-import").addEventListener("change",async e=>{
    const input=e.target,file=input.files?.[0];if(!file)return;
    try{
      if(file.size>150000)throw new RangeError("Fayl 150 KB dan oshmasin.");
      const recovered=core.importJson(await file.text());
      if(!confirm("Joriy qaydlarni fayldagi ma’lumotlar bilan almashtirasizmi?"))return;
      state=recovered;save();render();status.textContent="Qaydlar JSON fayldan tiklandi.";
    }catch(err){status.textContent="Import xatosi: "+(err.message||"Fayl noto‘g‘ri.");}
    finally{input.value="";}
  });
  $("mt-reset").addEventListener("click",()=>{
    if(!confirm("Barcha 15 ta topshiriq bo‘yicha mahalliy qaydlarni o‘chirasizmi?"))return;
    state={};save();render();status.textContent="Mahalliy qaydlar tozalandi.";
  });
  search.addEventListener("input",render);
  filter.addEventListener("change",render);
  render();
})();
