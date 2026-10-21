// ===== اللغات =====
const LANGUAGES = {
  ar:"العربية", en:"الإنجليزية", fr:"الفرنسية", es:"الإسبانية", de:"الألمانية",
  it:"الإيطالية", pt:"البرتغالية", ru:"الروسية", zh:"الصينية (مبسطة)",
  "zh-TW":"الصينية (تقليدية)", ja:"اليابانية", ko:"الكورية", tr:"التركية",
  hi:"الهندية", ur:"الأردية", fa:"الفارسية", nl:"الهولندية", sv:"السويدية",
  pl:"البولندية", uk:"الأوكرانية", ro:"الرومانية", el:"اليونانية", he:"العبرية",
  th:"التايلاندية", vi:"الفيتنامية", id:"الإندونيسية", ms:"الماليزية",
  bn:"البنغالية", ta:"التاميلية", te:"التيلوغوية", ml:"المالايالامية",
  kn:"الكانادية", gu:"الغوجاراتية", mr:"الماراثية", pa:"البنجابية",
  ne:"النيبالية", si:"السنهالية", my:"البورمية", km:"الخميرية", lo:"اللاوية",
  sw:"السواحيلية", am:"الأمهرية", so:"الصومالية", ha:"الهوسا", yo:"اليوروبا",
  ig:"الإيبو", zu:"الزولو", af:"الأفريكانية", no:"النرويجية", da:"الدنماركية",
  fi:"الفنلندية", is:"الأيسلندية", cs:"التشيكية", sk:"السلوفاكية", hu:"المجرية",
  bg:"البلغارية", sr:"الصربية", hr:"الكرواتية", sl:"السلوفينية",
  bs:"البوسنية", mk:"المقدونية", sq:"الألبانية", lt:"الليتوانية",
  lv:"اللاتفية", et:"الإستونية", be:"البيلاروسية", ka:"الجورجية",
  hy:"الأرمنية", az:"الأذربيجانية", kk:"الكازاخية", uz:"الأوزبكية",
  ky:"القرغيزية", tg:"الطاجيكية", mn:"المنغولية", ps:"الباشتوية", ku:"الكردية",
  ca:"الكاتالونية", gl:"الغاليسية", eu:"الباسكية", mt:"المالطية",
  ga:"الأيرلندية", cy:"الويلزية", la:"اللاتينية", eo:"الإسبرانتو",
  tl:"الفلبينية", jv:"الجاوية", su:"السوندية", ceb:"السيبوانية",
  mi:"الماورية", haw:"الهاوائية", sm:"الساموية", fj:"الفيدجية",
  yi:"اليديشية", lb:"اللوكسمبورغية", mg:"الملغاشية", ny:"الشيشيوا"
};

const fromLang = document.getElementById("fromLang");
const toLang = document.getElementById("toLang");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const fileInput = document.getElementById("fileInput");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const progressPct = document.getElementById("progressPct");
const stopBtn = document.getElementById("stopBtn");

let abortFlag = false;

// ملء القوائم
const sorted = Object.entries(LANGUAGES).sort((a,b) => a[1].localeCompare(b[1],"ar"));
for (const [code, name] of sorted) {
  fromLang.innerHTML += `<option value="${code}">${name}</option>`;
  toLang.innerHTML += `<option value="${code}">${name}</option>`;
}
fromLang.value = "ar";
toLang.value = "en";

// تبديل
document.getElementById("swapBtn").onclick = () => {
  [fromLang.value, toLang.value] = [toLang.value, fromLang.value];
  [inputText.value, outputText.value] = [outputText.value, inputText.value];
};

// ===== ترجمة مقطع واحد =====
async function translateChunk(text, from, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.responseData.translatedText || "";
}

// ===== تقسيم النص إلى مقاطع ≤ 450 حرف =====
function splitText(text, max = 450) {
  const parts = [];
  let current = "";
  // نقسم على الجمل أولاً
  const sentences = text.split(/(?<=[.!?؟\n])\s+/);
  for (const s of sentences) {
    if ((current + s).length > max) {
      if (current) parts.push(current.trim());
      // إن كانت الجملة نفسها طويلة جداً نقسمها بالمسافات
      if (s.length > max) {
        let chunk = "";
        for (const word of s.split(/\s+/)) {
          if ((chunk + " " + word).length > max) {
            if (chunk) parts.push(chunk.trim());
            chunk = word;
          } else chunk += " " + word;
        }
        if (chunk.trim()) parts.push(chunk.trim());
      } else {
        current = s;
      }
    } else {
      current += s + " ";
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// ===== تحديث شريط التقدم =====
function setProgress(done, total) {
  progressWrap.hidden = false;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = pct + "%";
  progressPct.textContent = pct + "%";
  progressLabel.textContent = `جارٍ الترجمة... (${done}/${total} مقطع)`;
}
function hideProgress() {
  progressWrap.hidden = true;
  progressFill.style.width = "0%";
}

// ===== ترجمة النص كاملاً على دفعات =====
async function translateAll(text, from, to) {
  const chunks = splitText(text);
  let result = "";
  abortFlag = false;
  setProgress(0, chunks.length);

  for (let i = 0; i < chunks.length; i++) {
    if (abortFlag) break;
    let t = "";
    try {
      t = await translateChunk(chunks[i], from, to);
    } catch {
      t = chunks[i]; // إن فشل المقطع نُبقي الأصل
    }
    result += t + "\n";
    setProgress(i + 1, chunks.length);
    await new Promise(r => setTimeout(r, 250));
  }
  return result.trim();
}

// ===== زر ترجم الآن =====
document.getElementById("translateBtn").onclick = async () => {
  const text = inputText.value.trim();
  if (!text) return alert("اكتب نصاً أو استورد ملفاً أولاً");
  outputText.value = "";
  try {
    const result = await translateAll(text, fromLang.value, toLang.value);
    outputText.value = result || "❌ تعذّرت الترجمة";
  } catch {
    outputText.value = "❌ خطأ في الاتصال";
  } finally {
    hideProgress();
  }
};

// ===== زر ترجمة ملف كامل (10 آلاف حرف وأكثر) =====
document.getElementById("translateFileBtn").onclick = async () => {
  const text = inputText.value.trim();
  if (!text) return alert("استورد ملفاً أولاً (زر 📁 استيراد ملف)");
  outputText.value = "";
  stopBtn.hidden = false;
  try {
    const result = await translateAll(text, fromLang.value, toLang.value);
    outputText.value = result || "❌ تعذّرت الترجمة";
  } catch {
    outputText.value = "❌ خطأ في الاتصال";
  } finally {
    hideProgress();
    stopBtn.hidden = true;
  }
};

// إيقاف
stopBtn.onclick = () => { abortFlag = true; };

// ===== زر الترجمة الصوتية =====
document.getElementById("voiceTranslateBtn").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("متصفحك لا يدعم الإدخال الصوتي. جرّب Chrome.");
  const r = new SR();
  r.lang = fromLang.value;
  r.onresult = async (e) => {
    const spoken = e.results[0][0].transcript;
    inputText.value = spoken;
    outputText.value = "⏳ جارٍ ترجمة صوتك...";
    try {
      const tr = await translateChunk(spoken, fromLang.value, toLang.value);
      outputText.value = tr;
      speak(tr, toLang.value);
    } catch { outputText.value = "❌ خطأ"; }
  };
  r.onerror = () => alert("تعذّر التقاط الصوت");
  r.start();
};

// ===== استيراد الملفات =====
document.getElementById("importBtn").onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  inputText.value = "⏳ جارٍ قراءة الملف...";
  try {
    let text = "";
    if (ext === "txt" || ext === "md" || ext === "srt") {
      text = await file.text();
      if (ext === "srt")
        text = text.replace(/^\d+\s*$/gm, "").replace(/\d{2}:\d{2}:\d{2},\d{3} --> .*/g, "").trim();
    } else if (ext === "docx") {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      text = result.value;
    } else if (ext === "pdf") {
      text = await extractPDF(file);
    } else { text = "❌ صيغة غير مدعومة"; }
    inputText.value = text.trim() || "(الملف فارغ)";
  } catch (err) {
    inputText.value = "❌ فشل قراءة الملف: " + err.message;
  }
};

async function extractPDF(file) {
  const buf = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let full = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    full += content.items.map(it => it.str).join(" ") + "\n";
  }
  return full;
}

// ===== إدخال صوتي =====
document.getElementById("micBtn").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("متصفحك لا يدعم الإدخال الصوتي. جرّب Chrome.");
  const r = new SR();
  r.lang = fromLang.value;
  r.onresult = (e) => inputText.value = e.results[0][0].transcript;
  r.onerror = () => alert("تعذّر التقاط الصوت");
  r.start();
};

// ===== نطق =====
function speak(text, lang) {
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  speechSynthesis.speak(u);
}
document.getElementById("speakInput").onclick = () => speak(inputText.value, fromLang.value);
document.getElementById("speakOutput").onclick = () => speak(outputText.value, toLang.value);

// نسخ
document.getElementById("copyBtn").onclick = () => {
  if (!outputText.value) return;
  navigator.clipboard.writeText(outputText.value);
  alert("✅ تم النسخ");
};

// تحميل
document.getElementById("downloadBtn").onclick = () => {
  if (!outputText.value) return;
  const blob = new Blob([outputText.value], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "translation.txt";
  a.click();
};

// مسح
document.getElementById("clearBtn").onclick = () => {
  inputText.value = "";
  outputText.value = "";
  hideProgress();
};
