"use strict";
(() => {
  const engine = globalThis.ILIMZIYO_DIAG;
  if (!engine) return;
  const STORE = "ilimziyo.v2.diagnostic.v1";
  const SCHEMA = "ilimziyo-diagnostic-v1";
  const byId = id => document.getElementById(id);
  const form = byId("diagnostic-form");
  const fields = byId("questions");
  const output = byId("results");
  const notice = byId("status");
  const exportButton = byId("export-results");
  let latest = null;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function link(href, text) {
    const a = element("a", text);
    a.href = href;
    return a;
  }
  for (const [index,question] of engine.questions.entries()) {
    const fieldset = element("fieldset",undefined,"question");
    fieldset.id = "question-" + question.id;
    fieldset.append(element("legend",(index+1)+". "+question.prompt));
    const meta = element("p",engine.areas[question.area]+" · Blum: "+question.bloom+" · "+question.difficulty,"meta");
    fieldset.append(meta);
    for (const [optionIndex,choice] of question.choices.entries()) {
      const label = element("label",undefined,"choice");
      const input = element("input");
      input.type = "radio";
      input.name = "q-" + question.id;
      input.value = String(optionIndex);
      input.required = true;
      label.append(input,document.createTextNode(" "+choice));
      fieldset.append(label);
    }
    fields.append(fieldset);
  }

  function save(payload) {
    try {
      localStorage.setItem(STORE,JSON.stringify(payload));
      return true;
    } catch (_) { return false; }
  }
  function appendParagraph(parent,text) { parent.append(element("p",text)); }
  function buildReport(report) {
    output.replaceChildren();
    output.hidden = false;
    output.append(element("h2","Diagnostika natijasi"));
    const score = element("p",report.correct+" / "+report.total+" ("+report.percent+"%)","score");
    output.append(score);
    const track = engine.tracks[report.track];
    output.append(element("h3","Tavsiya etilgan yo‘nalish: "+track.name));
    appendParagraph(output,track.description);
    appendParagraph(output,"Eng ko‘p ishlash kerak bo‘lgan yo‘nalish: "+engine.areas[report.weakestArea]+".");
    const h = element("h3","Yo‘nalishlar bo‘yicha natijalar");
    output.append(h);
    const list = element("ul");
    for (const [id,area] of Object.entries(report.byArea)) {
      list.append(element("li",engine.areas[id]+": "+area.correct+" / "+area.total+" ("+area.percent+"%)"));
    }
    output.append(list);
    output.append(element("h3","4 haftalik tavsiya etilgan reja"));
    const plan = element("ol");
    for (const week of track.weeks) {
      const li = element("li");
      li.append(element("strong",week.title),document.createTextNode(" — "+week.task+" "),link(week.href,"Materialni ochish"));
      plan.append(li);
    }
    output.append(plan);
    output.append(element("h3","Savollar bo‘yicha izohlar"));
    const detail = element("div",undefined,"feedback-list");
    for (const item of report.feedback) {
      const card = element("section",undefined,"feedback "+(item.correct?"right":"wrong"));
      card.append(element("h4",item.id.toUpperCase()+" — "+(item.correct?"To‘g‘ri":"Noto‘g‘ri")+" · "+item.bloom));
      appendParagraph(card,item.prompt);
      appendParagraph(card,"Sizning javobingiz: "+item.chosen);
      if (!item.correct) {
        appendParagraph(card,"To‘g‘ri javob: "+item.right);
        appendParagraph(card,"Ko‘p uchraydigan xato: "+item.misconception);
      }
      appendParagraph(card,"Izoh: "+item.explanation);
      card.append(link(item.href,"Mashq va o‘quv materialiga o‘tish"));
      detail.append(card);
    }
    output.append(detail);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    notice.textContent = "";
    const answers = {};
    for (const question of engine.questions) {
      const selected = form.querySelector('input[name="q-'+question.id+'"]:checked');
      if (!selected) {
        notice.textContent = "Iltimos, barcha 10 ta test savoliga javob bering.";
        byId("question-"+question.id).scrollIntoView({behavior:"smooth",block:"center"});
        return;
      }
      answers[question.id]=Number(selected.value);
    }
    try {
      const report=engine.evaluate(answers);
      const payload={schema:SCHEMA,createdAt:new Date().toISOString(),answers};
      latest=payload;
      buildReport(report);
      exportButton.disabled=false;
      if (!save(payload)) notice.textContent="Natija hisoblandi, ammo brauzer xotirasiga saqlanmadi. JSON eksportdan foydalaning.";
      else notice.textContent="Natija faqat ushbu brauzerda saqlandi.";
      output.scrollIntoView({behavior:"smooth",block:"start"});
    } catch (_) {
      notice.textContent="Savollarni tekshirishda xatolik yuz berdi. Qayta urinib ko‘ring.";
    }
  });

  exportButton.addEventListener("click",() => {
    if (!latest) return;
    const blob = new Blob([JSON.stringify(latest,null,2)],{type:"application/json;charset=utf-8"});
    const objectUrl=URL.createObjectURL(blob);
    const a=element("a");
    a.href=objectUrl;
    a.download="ilimziyo-diagnostika.json";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  });

  byId("new-attempt").addEventListener("click",() => {
    form.reset();
    output.hidden=true;
    output.replaceChildren();
    notice.textContent="Yangi urinish uchun barcha savollarga javob bering.";
    form.scrollIntoView({behavior:"smooth",block:"start"});
  });

  try {
    const previous=JSON.parse(localStorage.getItem(STORE)||"null");
    if (previous && previous.schema===SCHEMA &&
        typeof previous.answers==="object" && !Array.isArray(previous.answers)) {
      const result=engine.evaluate(previous.answers);
      latest=previous;
      buildReport(result);
      exportButton.disabled=false;
      notice.textContent="Avvalgi natija yuklandi (ushbu brauzer xotirasidan).";
    }
  } catch (_) {
    // Buzilgan lokal ma'lumot diagnostika sahifasini ishlashdan to‘xtatmasin.
  }
})();
