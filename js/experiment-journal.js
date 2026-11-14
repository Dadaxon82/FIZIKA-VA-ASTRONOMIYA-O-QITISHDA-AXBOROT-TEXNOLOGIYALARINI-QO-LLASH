"use strict";
(()=>{
  const core=globalThis.ILIMZIYO_JOURNAL_CORE;
  const m=/^lab(1[0-5]|[1-9])\.html$/i.exec(location.pathname.split("/").pop()||"");
  if(!core||!m)return;
  const lab=Number(m[1]),storageKey="ilimziyo.v2.journal.lab"+lab;
  const host=document.createElement("section");host.id="ilimziyo-journal";
  host.innerHTML=[
    '<details><summary>ILIMZIYO 2.0 · Tajriba jurnali (<span id="ilj-count">0</span> qayd)</summary>',
    '<p class="ilj-hint">O‘lchangan va etalon qiymatlarni o‘zingiz kiriting. Bir jurnal uchun bitta fizik kattalik va bir xil birlikdan foydalaning. Natijalar mavjud simulyatsiyadan avtomatik olinmaydi.</p>',
    '<form id="ilj-form">',
    '<label>Parametr X (ixtiyoriy)<input name="x" type="text" inputmode="decimal" maxlength="24"></label>',
    '<label>O‘lchangan qiymat<input name="measured" type="text" inputmode="decimal" maxlength="24" required></label>',
    '<label>Etalon qiymat<input name="reference" type="text" inputmode="decimal" maxlength="24" required></label>',
    '<label>Birlik<input name="unit" type="text" maxlength="24" required placeholder="s, m, N ..."></label>',
    '<label class="ilj-wide">Izoh<input name="note" type="text" maxlength="180"></label>',
    '<div class="ilj-wide"><button type="submit">Qaydni qo‘shish</button></div></form>',
    '<p id="ilj-message" role="status" aria-live="polite" class="ilj-state"></p>',
    '<p id="ilj-summary" class="ilj-summary"></p>',
    '<div class="ilj-chart"><canvas id="ilj-canvas" width="900" height="270" aria-label="O‘lchangan va etalon qiymatlarni taqqoslash grafigi" role="img"></canvas>',
    '<p class="ilj-legend"><span class="ilj-measure">O‘lchangan</span><span class="ilj-reference">Etalon</span>Gorizontal o‘q: qayd ketma-ketligi</p></div>',
    '<div class="ilj-table-wrap"><table><caption>O‘lchovlar</caption>',
    '<thead><tr><th>№</th><th>X</th><th>O‘lchangan</th><th>Etalon</th><th>|Δ|</th><th>Δ (%)</th><th>Izoh</th><th>Amal</th></tr></thead>',
    '<tbody id="ilj-rows"></tbody></table></div>',
    '<div class="ilj-actions"><button type="button" id="ilj-csv">CSV eksport</button>',
    '<button type="button" id="ilj-html">Hisobot (HTML → PDF)</button>',
    '<button type="button" id="ilj-json">JSON zaxira</button>',
    '<label>JSON tiklash <input id="ilj-import" type="file" accept=".json,application/json"></label>',
    '<button type="button" id="ilj-clear" class="ilj-danger">Tozalash</button></div>',
    '<p class="ilj-hint">Absolyut xatolik = |o‘lchangan − etalon|, nisbiy = |Δ| / |etalon| × 100%. Etalon nol bo‘lsa nisbiy xatolik aniqlanmaydi. Ma’lumotlar faqat ushbu brauzerda saqlanadi.</p></details>'
  ].join("");
  document.body.append(host);
  const jump=document.createElement("a");jump.href="#ilimziyo-journal";
  jump.className="ilj-jump";jump.textContent="Tajriba jurnali";document.body.append(jump);
  const get=id=>host.querySelector("#"+id);
  const details=host.querySelector("details"),form=get("ilj-form"),status=get("ilj-message"),
    tbody=get("ilj-rows"),canvas=get("ilj-canvas");
  jump.addEventListener("click",()=>{details.open=true;setTimeout(draw,0)});
  let rows=[],sequence=0;
  try{const saved=localStorage.getItem(storageKey);if(saved)rows=core.restore(saved,lab)}
  catch(_){status.textContent="Saqlangan ma’lumot buzilgan; JSON zaxirangizni tekshiring."}
  function persist(){
    try{localStorage.setItem(storageKey,JSON.stringify(core.snapshot(lab,rows)));return true}
    catch(_){status.textContent="Saqlashda xatolik! JSON faylni eksport qiling.";return false}
  }
  function draw(){
    if(!details.open)return;
    const w=Math.max(320,canvas.getBoundingClientRect().width||900),h=Math.max(180,canvas.getBoundingClientRect().height||270);
    const dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const c=canvas.getContext("2d");if(!c)return;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.font="12px sans-serif";c.fillStyle="#e0edf8";
    if(!rows.length){c.fillText("Grafik uchun kamida bitta qayd kiriting.",16,h/2);return}
    const v=rows.flatMap(r=>[r.measured,r.reference]);
    let min=Math.min(...v),max=Math.max(...v);
    const pad=Math.max((max-min)*.1,Math.max(Math.abs(min),Math.abs(max),1)*.002);
    min-=pad;max+=pad;
    const L=70,R=w-20,T=20,B=h-35;
    const px=i=>rows.length===1?(L+R)/2:L+i*(R-L)/(rows.length-1);
    const py=n=>B-(n-min)/(max-min)*(B-T);
    c.strokeStyle="#688096";c.beginPath();c.moveTo(L,T);c.lineTo(L,B);c.lineTo(R,B);c.stroke();
    for(let i=0;i<=4;i++){const n=min+(max-min)*i/4,y=py(n);c.fillStyle="#e0edf8";c.fillText(core.decimal(n),3,y+4);
      c.strokeStyle="#33506b";c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke()}
    c.fillText("1",px(0)-3,B+19);if(rows.length>1)c.fillText(String(rows.length),px(rows.length-1)-8,B+19);
    for(const [key,color] of [["measured","#38bdf8"],["reference","#fbbf24"]]){
      c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;c.beginPath();
      rows.forEach((r,i)=>{if(i===0)c.moveTo(px(i),py(r[key]));else c.lineTo(px(i),py(r[key]))});c.stroke();
      rows.forEach((r,i)=>{c.beginPath();c.arc(px(i),py(r[key]),3,0,Math.PI*2);c.fill()});
    }
  }
  function cell(tr,value){const el=document.createElement("td");el.textContent=String(value);tr.append(el);return el}
  function render(){
    get("ilj-count").textContent=String(rows.length);
    const s=core.summary(rows);
    get("ilj-summary").textContent="Qaydlar: "+s.count+" · O‘rtacha absolyut xatolik: "+core.decimal(s.meanAbsolute)+
      " · O‘rtacha nisbiy xatolik: "+core.decimal(s.meanRelative)+"% ("+s.relativeCount+" ta qiymat).";
    tbody.replaceChildren();
    rows.forEach((r,i)=>{
      const e=core.calcError(r.measured,r.reference),tr=document.createElement("tr");
      cell(tr,i+1);cell(tr,r.x===null?"—":r.x);
      cell(tr,core.decimal(r.measured)+" "+r.unit);cell(tr,core.decimal(r.reference)+" "+r.unit);
      cell(tr,core.decimal(e.absolute)+" "+r.unit);cell(tr,e.relative===null?"—":core.decimal(e.relative)+"%");
      cell(tr,r.note||"—");
      const action=cell(tr,""),b=document.createElement("button");b.type="button";b.textContent="O‘chirish";b.dataset.id=r.id;action.append(b);
      tbody.append(tr)
    });
    for(const id of ["ilj-csv","ilj-html","ilj-json","ilj-clear"])get(id).disabled=!rows.length;
    draw()
  }
  function download(value,name,mime){
    const url=URL.createObjectURL(new Blob([value],{type:mime}));
    const a=document.createElement("a");a.href=url;a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  form.addEventListener("submit",e=>{
    e.preventDefault();
    try{
      if(rows.length>=core.MAX_ROWS)throw new RangeError("100 ta qayd limiti. Avval eksport qiling.");
      const f=new FormData(form);
      const r=core.record({id:String(Date.now())+"-"+(++sequence),date:new Date().toISOString(),
        x:f.get("x"),measured:f.get("measured"),reference:f.get("reference"),unit:f.get("unit"),note:f.get("note")});
      if(rows.length&&rows[0].unit!==r.unit)throw new RangeError("Bir jurnalda bitta birlikdan foydalaning.");
      rows.push(r);persist();render();status.textContent="Qayd qo‘shildi. Xatoliklar hisoblandi.";
      for(const key of ["x","measured","reference","note"])form.elements.namedItem(key).value=""
    }catch(err){status.textContent=err.message||"Noto‘g‘ri qiymat."}
  });
  tbody.addEventListener("click",e=>{
    const id=e.target?.dataset?.id;if(!id)return;
    rows=rows.filter(r=>r.id!==id);persist();render();status.textContent="Qayd o‘chirildi."
  });
  get("ilj-clear").addEventListener("click",()=>{
    if(!confirm("Barcha qaydlarni tozalaysizmi? Avval zaxira qiling."))return;
    rows=[];persist();render();status.textContent="Jurnal tozalandi."
  });
  get("ilj-csv").addEventListener("click",()=>download(core.toCsv(lab,rows),"ilimziyo-lab"+lab+".csv","text/csv;charset=utf-8"));
  get("ilj-html").addEventListener("click",()=>download(core.reportHtml(lab,document.title,rows),"ilimziyo-lab"+lab+"-hisobot.html","text/html;charset=utf-8"));
  get("ilj-json").addEventListener("click",()=>download(JSON.stringify(core.snapshot(lab,rows),null,2),"ilimziyo-lab"+lab+".json","application/json;charset=utf-8"));
  get("ilj-import").addEventListener("change",async e=>{
    const input=e.target,file=input.files?.[0];if(!file)return;
    try{
      if(file.size>100000)throw new RangeError("100 KB dan katta fayl qabul qilinmaydi.");
      const imported=core.restore(await file.text(),lab);
      if(!confirm("Joriy jurnalni import qilingan qaydlar bilan almashtirasizmi?"))return;
      rows=imported;persist();render();status.textContent="Qaydlar tiklandi."
    }catch(err){status.textContent="Import xatosi: "+err.message}
    finally{input.value=""}
  });
  details.addEventListener("toggle",draw);
  window.addEventListener("resize",draw,{passive:true});
  render()
})();
