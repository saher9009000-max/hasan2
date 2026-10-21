// ===== قائمة اللغات =====
const LANGUAGES = {
  ar: "العربية", en: "الإنجليزية", fr: "الفرنسية", es: "الإسبانية",
  de: "الألمانية", it: "الإيطالية", pt: "البرتغالية", ru: "الروسية",
  zh: "الصينية", ja: "اليابانية", ko: "الكورية", tr: "التركية",
  hi: "الهندية", ur: "الأردية", fa: "الفارسية", nl: "الهولندية",
  sv: "السويدية", pl: "البولندية", uk: "الأوكرانية", ro: "الرومانية",
  el: "اليونانية", he: "العبرية", th: "التايلاندية", vi: "الفيتنامية",
  id: "الإندونيسية", ms: "الماليزية", bn: "البنغالية", ta: "التاميلية",
  sw: "السواحيلية", no: "النرويجية", da: "الدنماركية", fi: "الفنلندية",
  cs: "التشيكية", hu: "المجرية", bg: "البلغارية", sr: "الصربية",
  hr: "الكرواتية", sk: "السلوفاكية", ca: "الكاتالونية", tl: "الفلبينية"
};

const fromLang = document.getElementById("fromLang");
const toLang = document.getElementById("toLang");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

// ملء القوائم
for (const [code, name] of Object.entries(LANGUAGES)) {
  fromLang.innerHTML += `<option value="${code}">${name}</option>`;
  toLang.innerHTML += `<option value="${code}">${name}</option>`;
}
fromLang.value = "ar";
toLang.value = "en";

// ===== تبديل اللغات =====
document.getElementById("swapBtn").onclick = () => {
  [fromLang.value, toLang.value] = [toLang.value, fromLang.value];
  [inputText.value, outputText.value] = [outputText.value, inputText.value];
};

// ===== الترجمة النصية =====
document.getElementById("translateBtn").onclick = async () => {
  const text = inputText.value.trim();
  if (!text) return alert("اكتب نصاً أولاً");

  outputText.value = "⏳ جارٍ الترجمة...";

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang.value}|${toLang.value}`;
    const res = await fetch(url);
    const data = await res.json();
    outputText.value = data.responseData.translatedText || "❌ تعذّرت الترجمة";
  } catch (e) {
    outputText.value = "❌ خطأ في الاتصال بالخدمة";
  }
};

// ===== الإدخال الصوتي (تحويل الكلام إلى نص) =====
document.getElementById("micBtn").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("متصفحك لا يدعم الإدخال الصوتي. جرّب Chrome.");

  const recognition = new SR();
  recognition.lang = fromLang.value;
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    inputText.value = e.results[0][0].transcript;
  };
  recognition.onerror = () => alert("تعذّر التقاط الصوت");
  recognition.start();
};

// ===== النطق الصوتي (تحويل النص إلى كلام) =====
function speak(text, lang) {
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  speechSynthesis.speak(utter);
}

document.getElementById("speakInput").onclick = () =>
  speak(inputText.value, fromLang.value);

document.getElementById("speakOutput").onclick = () =>
  speak(outputText.value, toLang.value);

// ===== نسخ =====
document.getElementById("copyBtn").onclick = () => {
  if (!outputText.value) return;
  navigator.clipboard.writeText(outputText.value);
  alert("✅ تم النسخ");
};

// ===== مسح =====
document.getElementById("clearBtn").onclick = () => {
  inputText.value = "";
  outputText.value = "";
};
