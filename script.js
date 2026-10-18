document.addEventListener('DOMContentLoaded', () => {
    // إعداد مكتبة PDF.js
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const swapBtn = document.getElementById('swapBtn');
    const translateBtn = document.getElementById('translateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const speakBtn = document.getElementById('speakBtn');
    const micBtn = document.getElementById('micBtn');
    const fileInput = document.getElementById('fileInput');
    const charCount = document.getElementById('charCount');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // تحديث الاتجاه RTL/LTR
    function updateDirections() {
        sourceText.dir = sourceLang.value === 'ar' ? 'rtl' : 'ltr';
        targetText.dir = targetLang.value === 'ar' ? 'rtl' : 'ltr';
    }

    // عداد الأحرف (25,000 حرف)
    sourceText.addEventListener('input', () => {
        charCount.textContent = sourceText.value.length.toLocaleString();
    });

    // استيراد الملفات (TXT و PDF)
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                sourceText.value = event.target.result.slice(0, 25000);
                charCount.textContent = sourceText.value.length.toLocaleString();
                showToast('تم استيراد النص بنجاح 📄', 'info');
            };
            reader.readAsText(file);
        } else if (file.type === 'application/pdf') {
            try {
                loadingOverlay.classList.remove('hidden');
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                    if (fullText.length >= 25000) break;
                }

                sourceText.value = fullText.slice(0, 25000);
                charCount.textContent = sourceText.value.length.toLocaleString();
                showToast('تم استخراج النص من ملف PDF بنجاح 📑', 'info');
            } catch (err) {
                showToast('حدث خطأ أثناء قراءة ملف PDF', 'error');
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        }
    });

    // الترجمة الصوتية (الإملاء الصوتي من الميكروفون)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        micBtn.addEventListener('click', () => {
            recognition.lang = sourceLang.value === 'ar' ? 'ar-SA' : 'en-US';
            recognition.start();
            micBtn.classList.add('recording');
            showToast('جاري الاستماع الآن...', 'info');
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            sourceText.value += ' ' + transcript;
            charCount.textContent = sourceText.value.length.toLocaleString();
            micBtn.classList.remove('recording');
        };

        recognition.onerror = () => {
            micBtn.classList.remove('recording');
            showToast('لم نتمكن من سماع الصوت، حاول مجدداً', 'error');
        };

        recognition.onend = () => {
            micBtn.classList.remove('recording');
        };
    } else {
        micBtn.style.display = 'none';
    }

    // القراءة الصوتية للنص المترجم (Text-To-Speech)
    speakBtn.addEventListener('click', () => {
        if (!targetText.value) return;
        const utterance = new SpeechSynthesisUtterance(targetText.value);
        utterance.lang = targetLang.value;
        window.speechSynthesis.speak(utterance);
    });

    // زر تبديل اللغات
    swapBtn.addEventListener('click', () => {
        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;

        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = tempText;

        charCount.textContent = sourceText.value.length.toLocaleString();
        updateDirections();
        toggleButtons();
    });

    // تنفيذ الترجمة المجانية باستخدام MyMemory Translate API السريعة
    translateBtn.addEventListener('click', async () => {
        const text = sourceText.value.trim();
        if (!text) {
            showToast('الرجاء أدخل نصاً للترجمة', 'error');
            return;
        }

        loadingOverlay.classList.remove('hidden');

        try {
            const sLang = sourceLang.value;
            const tLang = targetLang.value;
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 2000))}&langpair=${sLang}|${tLang}`);
            const data = await response.json();

            if (data.responseData) {
                targetText.value = data.responseData.translatedText;
                showToast('تمت الترجمة السريعة بنجاح ✨', 'success');
            } else {
                targetText.value = text;
            }
        } catch (err) {
            showToast('حدث خطأ في الاتصال بالسيرفر', 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
            toggleButtons();
        }
    });

    // أدوات النسخ والمسح
    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetText.value = '';
        charCount.textContent = '0';
        toggleButtons();
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(targetText.value);
        showToast('تم النسخ إلى الحافظة 📋', 'success');
    });

    function toggleButtons() {
        if (targetText.value.trim() !== '') {
            copyBtn.removeAttribute('disabled');
            speakBtn.removeAttribute('disabled');
        } else {
            copyBtn.setAttribute('disabled', 'true');
            speakBtn.setAttribute('disabled', 'true');
        }
    }

    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        if (type === 'error') toast.style.background = 'var(--danger)';
        if (type === 'success') toast.style.background = 'var(--primary)';
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    sourceLang.addEventListener('change', updateDirections);
    targetLang.addEventListener('change', updateDirections);
    updateDirections();
});
