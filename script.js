document.addEventListener('DOMContentLoaded', () => {
    // العناصر الأساسية في الواجهة
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const swapBtn = document.getElementById('swapBtn');
    const translateBtn = document.getElementById('translateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const charCount = document.getElementById('charCount');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const toastContainer = document.getElementById('toastContainer');

    // قاموس محاكاة ذكي للترجمة الفورية المتقدمة
    const mockDictionary = {
        'ar-en': {
            'مرحباً': 'Hello',
            'السلام عليكم': 'Peace be upon you',
            'كيف حالك؟': 'How are you?',
            'صباح الخير': 'Good morning',
            'مساء الخير': 'Good evening',
            'شكراً لك': 'Thank you',
            'ما هو اسمك؟': 'What is your name?',
            'أنا أتعلم برمجة الواجهات': 'I am learning frontend development',
            'تطوير الويب هو شغفي': 'Web development is my passion'
        },
        'en-ar': {
            'hello': 'مرحباً',
            'hi': 'أهلاً',
            'how are you?': 'كيف حالك؟',
            'good morning': 'صباح الخير',
            'good evening': 'مساء الخير',
            'thank you': 'شكراً لك',
            'web development': 'تطوير الويب',
            'frontend developer': 'مطور واجهات أمامية',
            'artificial intelligence': 'الذكاء الاصطناعي'
        }
    };

    // تحديث اتجاه النصوص (RTL / LTR) وخصائص الإدخال
    function updateTextDirection() {
        sourceText.dir = sourceLang.value === 'ar' ? 'rtl' : 'ltr';
        targetText.dir = targetLang.value === 'ar' ? 'rtl' : 'ltr';
    }

    // عداد الأحرف
    sourceText.addEventListener('input', () => {
        const length = sourceText.value.length;
        charCount.textContent = length;
    });

    // تبديل اللغات
    swapBtn.addEventListener('click', () => {
        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;

        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = tempText;

        charCount.textContent = sourceText.value.length;
        updateTextDirection();
        toggleCopyButton();
        showToast('تم تبديل اللغات بنجاح', 'info');
    });

    // تغيير اللغات عبر القوائم
    sourceLang.addEventListener('change', updateTextDirection);
    targetLang.addEventListener('change', updateTextDirection);

    // زر مسح النص
    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetText.value = '';
        charCount.textContent = '0';
        toggleCopyButton();
        sourceText.focus();
    });

    // تفعيل أو تعطيل زر النسخ بناءً على وجود نص مترجم
    function toggleCopyButton() {
        if (targetText.value.trim() !== '') {
            copyBtn.removeAttribute('disabled');
        } else {
            copyBtn.setAttribute('disabled', 'true');
        }
    }

    // زر الترجمة مع محاكاة ذكية لبيئة منتج SaaS
    translateBtn.addEventListener('click', () => {
        const textToTranslate = sourceText.value.trim();

        if (!textToTranslate) {
            showToast('الرجاء إدخال نص للترجمة أولاً', 'error');
            sourceText.focus();
            return;
        }

        // إظهار حالة التحميل
        loadingOverlay.classList.remove('hidden');

        setTimeout(() => {
            const sLang = sourceLang.value;
            const tLang = targetLang.value;
            const key = `${sLang}-${tLang}`;

            let translatedResult = '';

            // فحص القاموس التجريبي أو توليد محاكاة احترافية
            if (mockDictionary[key] && mockDictionary[key][textToTranslate.toLowerCase()]) {
                translatedResult = mockDictionary[key][textToTranslate.toLowerCase()];
            } else {
                // محاكاة ترجمة متقدمة للنصوص العامة
                if (sLang === tLang) {
                    translatedResult = textToTranslate;
                } else {
                    translatedResult = `[ترجمة ${sLang.toUpperCase()} إلى ${tLang.toUpperCase()}] : ${textToTranslate}`;
                }
            }

            targetText.value = translatedResult;
            loadingOverlay.classList.add('hidden');
            toggleCopyButton();
            showToast('تمت الترجمة بنجاح ✨', 'success');
        }, 600); // محاكاة زمن استجابة API حقيقي وسريع
    });

    // نسخ الترجمة إلى الحافظة
    copyBtn.addEventListener('click', () => {
        if (!targetText.value) return;

        navigator.clipboard.writeText(targetText.value).then(() => {
            showToast('تم نسخ النص إلى الحافظة 📋', 'success');
        }).catch(() => {
            showToast('تعذر نسخ النص', 'error');
        });
    });

    // نظام التنبيهات (Toast Notifications)
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast`;
        toast.textContent = message;

        if (type === 'error') {
            toast.style.background = 'var(--danger)';
        } else if (type === 'info') {
            toast.style.background = 'var(--primary)';
        }

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // التهيئة الأولية
    updateTextDirection();
});
