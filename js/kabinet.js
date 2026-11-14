"use strict";

// 1-bosqich: pullik server yoki shaxsiy login talab qilmaydigan progress jurnali.
(() => {
  const STORAGE_KEY = "ilimziyo.v2.progress.v1";
  const BACKUP_SCHEMA = "ilimziyo-progress-v1";
  const lectureIds = Array.from({ length: 15 }, (_, i) => `lecture${i + 1}`);
  const labIds = Array.from({ length: 15 }, (_, i) => `lab${i + 1}`);
  const allowedIds = new Set([...lectureIds, ...labIds]);
  const byId = (id) => document.getElementById(id);
  const status = byId("message");
  let completed = {};

  function normalizeCompleted(source) {
    const result = {};
    if (!source || typeof source !== "object" || Array.isArray(source)) return result;
    for (const id of allowedIds) {
      if (source[id] === true) result[id] = true;
    }
    return result;
  }

  try {
    completed = normalizeCompleted(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch (_) {
    status.textContent = "Avvalgi natijalarni o‘qib bo‘lmadi. Brauzer sozlamalarini tekshiring.";
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      return true;
    } catch (_) {
      status.textContent = "Brauzer xotirasiga saqlab bo‘lmadi. JSON eksportidan foydalaning.";
      return false;
    }
  }

  function updateProgress() {
    const lectureCount = lectureIds.filter((id) => completed[id]).length;
    const labCount = labIds.filter((id) => completed[id]).length;
    const total = lectureCount + labCount;
    byId("lecture-count").textContent = `${lectureCount} / 15`;
    byId("lab-count").textContent = `${labCount} / 15`;
    byId("total-count").textContent = `${Math.round(total / 30 * 100)}%`;
    byId("progress").value = total;
    byId("progress").textContent = `${total} / 30`;
  }

  function renderItems(ids, containerId, typeLabel) {
    for (const id of ids) {
      const number = Number(id.match(/\d+$/)[0]);
      const article = document.createElement("article");
      article.className = "item";

      const link = document.createElement("a");
      link.href = `${id}.html`;
      link.textContent = `${number}-${typeLabel}`;

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.lessonId = id;
      checkbox.checked = Boolean(completed[id]);
      checkbox.setAttribute("aria-label", `${number}-${typeLabel} bajarildi`);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) completed[id] = true;
        else delete completed[id];
        save();
        updateProgress();
      });
      label.append(checkbox, document.createTextNode(" Bajarildi"));
      article.append(link, label);
      byId(containerId).append(article);
    }
  }

  function syncCheckboxes() {
    for (const input of document.querySelectorAll(".item input[type='checkbox']")) {
      input.checked = Boolean(completed[input.dataset.lessonId]);
    }
  }

  renderItems(lectureIds, "lectures", "ma’ruza");
  renderItems(labIds, "labs", "laboratoriya");
  updateProgress();

  byId("export").addEventListener("click", () => {
    const data = JSON.stringify({ schema: BACKUP_SCHEMA, completed }, null, 2);
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ilimziyo-progress.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Natijalar JSON fayl sifatida yuklab olindi.";
  });

  byId("import").addEventListener("change", async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error("large");
      const data = JSON.parse(await file.text());
      if (data.schema !== BACKUP_SCHEMA || !data.completed ||
          typeof data.completed !== "object" || Array.isArray(data.completed)) {
        throw new Error("format");
      }
      completed = normalizeCompleted(data.completed);
      save();
      syncCheckboxes();
      updateProgress();
      status.textContent = "Natijalar muvaffaqiyatli tiklandi.";
    } catch (error) {
      status.textContent = error.message === "large"
        ? "JSON fayl 100 KB dan katta bo‘lmasligi kerak."
        : "JSON fayl formati noto‘g‘ri yoki uni o‘qib bo‘lmadi.";
    } finally {
      input.value = "";
    }
  });

  byId("reset").addEventListener("click", () => {
    if (!confirm("Barcha bajarildi belgilarini tozalaysizmi?")) return;
    completed = {};
    save();
    syncCheckboxes();
    updateProgress();
    status.textContent = "Belgilar tozalandi.";
  });
})();
