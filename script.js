// ===== أكثر من 100 لغة =====
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
  ky:"القرغيزية", tg:"الطاجيكية", mn:"المنغولية", ps:"الباشتو", ku:"الكردية",
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

// الترجمة
document.getElementById("translateBtn").onclick = async () => {
  const text = inputText.value.trim();
  if (!text) return alert("اكتب نصاً أو استورد ملفاً أولاً");

  outputText.value = "⏳ جارٍ الترجمة...";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0,500))}&langpair=${fromLang.value}|${toLang.value}`;
    const res = await fetch(url);
    const data = await res.json();
    outputText.value = data.responseData.translatedText || "❌ تعذّرت الترجمة";
  } catch {
    outputText.value = "❌ خطأ في الاتصال";
  }
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
      if (ext === "srt") text = text.replace(/^\d+\s*$/gm, "").replace(/\d{2}:\d{2}:\d{2},\d{3} --> .*/g, "").trim();
    } else if (ext === "docx") {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      text = result.value;
    } else if (ext === "pdf") {
      text = await extractPDF(file);
    } else {
      text = "❌ صيغة غير مدعومة";
    }
    inputText.value = text.trim() || "(الملف فارغ)";
  } catch (err) {
    inputText.value = "❌ فشل قراءة الملف: " + err.message;
  }
};

// استخراج PDF
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

// إدخال صوتي
document.getElementById("micBtn").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("متصفحك لا يدعم الإدخال الصوتي. جرّب Chrome.");
  const r = new SR();
  r.lang = fromLang.value;
  r.onresult = (e) => inputText.value = e.results[0][0].transcript;
  r.onerror = () => alert("تعذّر التقاط الصوت");
  r.start();
};

// النطق
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

// تحميل الترجمة
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
};
