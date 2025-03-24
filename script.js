// بيانات التطبيق
let appData = {
    balance: parseFloat(localStorage.getItem("balance")) || 0,
    transactions: JSON.parse(localStorage.getItem("transactions")) || [],
    goals: JSON.parse(localStorage.getItem("goals")) || [],
    language: localStorage.getItem("language") || "ar"
};

// عناصر DOM
const elements = {
    balance: document.getElementById("balance"),
    amount: document.getElementById("amount"),
    note: document.getElementById("note"),
    category: document.getElementById("category"),
    addIncome: document.getElementById("addIncome"),
    addExpense: document.getElementById("addExpense"),
    transactions: document.getElementById("transactions"),
    filter: document.getElementById("filter"),
    totalIncome: document.getElementById("totalIncome"),
    totalExpense: document.getElementById("totalExpense"),
    goalAmount: document.getElementById("goalAmount"),
    goalName: document.getElementById("goalName"),
    addGoal: document.getElementById("addGoal"),
    goalsList: document.getElementById("goalsList"),
    exportData: document.getElementById("exportData"),
    importData: document.getElementById("importData"),
    importFile: document.getElementById("importFile"),
    resetBtn: document.getElementById("resetBtn"),
    confirmBox: document.getElementById("confirmBox"),
    cancelBtn: document.getElementById("cancelBtn"),
    confirmReset: document.getElementById("confirmReset"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage"),
    langAr: document.getElementById("langAr"),
    langEn: document.getElementById("langEn"),
    micAmountCheckbox: document.getElementById("micAmountCheckbox"),
    micNoteCheckbox: document.getElementById("micNoteCheckbox"),
    micGoalNameCheckbox: document.getElementById("micGoalNameCheckbox"),
    micGoalAmountCheckbox: document.getElementById("micGoalAmountCheckbox")
};

// تهيئة التعرف على الكلام
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let activeMic = null;

// دالة لضبط حجم الخط بناءً على حجم الشاشة
function adjustFontSize() {
    const width = window.innerWidth;
    const html = document.documentElement;
    
    if (width < 400) {
        html.style.fontSize = '14px';
    } else if (width < 600) {
        html.style.fontSize = '15px';
    } else {
        html.style.fontSize = '16px';
    }
}

// تهيئة التطبيق
function initApp() {
    adjustFontSize();
    setLanguage(appData.language);
    setupVoiceRecognition();
    setupEventListeners();
    updateUI();
    
    // إضافة مستمع لتغيير حجم الشاشة
    window.addEventListener('resize', adjustFontSize);
}

// إعداد التعرف الصوتي
function setupVoiceRecognition() {
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = appData.language === "ar" ? "ar-SA" : "en-US";
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            if (activeMic) {
                activeMic.classList.add("mic-active");
            }
        };
        
        recognition.onend = function() {
            if (activeMic) {
                activeMic.classList.remove("mic-active");
                // إيقاف تشغيل السويتش بعد الانتهاء
                if (activeMic === elements.micAmountCheckbox.nextElementSibling) {
                    elements.micAmountCheckbox.checked = false;
                } else if (activeMic === elements.micNoteCheckbox.nextElementSibling) {
                    elements.micNoteCheckbox.checked = false;
                } else if (activeMic === elements.micGoalNameCheckbox.nextElementSibling) {
                    elements.micGoalNameCheckbox.checked = false;
                } else if (activeMic === elements.micGoalAmountCheckbox.nextElementSibling) {
                    elements.micGoalAmountCheckbox.checked = false;
                }
            }
            activeMic = null;
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            
            if (activeMic === elements.micAmountCheckbox.nextElementSibling) {
                // معالجة المبالغ المالية
                const amount = parseFloat(transcript.replace(/[^0-9.]/g, ''));
                if (!isNaN(amount)) {
                    elements.amount.value = amount;
                }
            } else if (activeMic === elements.micNoteCheckbox.nextElementSibling) {
                // معالجة الوصف
                elements.note.value = transcript;
            } else if (activeMic === elements.micGoalNameCheckbox.nextElementSibling) {
                // معالجة اسم الهدف
                elements.goalName.value = transcript;
            } else if (activeMic === elements.micGoalAmountCheckbox.nextElementSibling) {
                // معالجة مبلغ الهدف
                const amount = parseFloat(transcript.replace(/[^0-9.]/g, ''));
                if (!isNaN(amount)) {
                    elements.goalAmount.value = amount;
                }
            }
        };
        
        recognition.onerror = function(event) {
            showToast(appData.language === "ar" ? 
                "حدث خطأ في التعرف على الصوت" : 
                "Voice recognition error", "error");
        };
    } else {
        showToast(appData.language === "ar" ? 
            "المتصفح لا يدعم التعرف على الصوت" : 
            "Browser doesn't support speech recognition", "error");
    }
}

// بدء التعرف الصوتي
function startVoiceRecognition(checkbox) {
    if (recognition) {
        activeMic = checkbox.nextElementSibling;
        recognition.lang = appData.language === "ar" ? "ar-SA" : "en-US";
        try {
            recognition.start();
        } catch (e) {
            showToast(appData.language === "ar" ? 
                "لا يمكن بدء التعرف على الصوت" : 
                "Can't start recognition", "error");
            checkbox.checked = false;
        }
    } else {
        checkbox.checked = false;
    }
}

// إضافة معاملة جديدة
function addTransaction(type) {
    const amount = parseFloat(elements.amount.value);
    const note = elements.note.value.trim();
    const category = elements.category.value;
    
    if (isNaN(amount)) {
        showToast(appData.language === "ar" ? "الرجاء إدخال مبلغ صحيح" : "Please enter a valid amount", "error");
        return;
    }
    
    if (note === "") {
        showToast(appData.language === "ar" ? "الرجاء إدخال وصف" : "Please enter a description", "error");
        return;
    }
    
    const transaction = {
        id: Date.now(),
        type,
        amount,
        note,
        category,
        date: new Date().toISOString()
    };
    
    appData.transactions.push(transaction);
    
    if (type === "income") {
        appData.balance += amount;
    } else {
        appData.balance -= amount;
    }
    
    saveData();
    updateUI();
    resetForm();
    
    showToast(appData.language === "ar" ? 
        `تمت إضافة ${type === "income" ? "دخل" : "مصروف"} بنجاح` : 
        `${type === "income" ? "Income" : "Expense"} added successfully`, "success");
}

// إضافة هدف جديد
function addGoal() {
    const name = elements.goalName.value.trim();
    const targetAmount = parseFloat(elements.goalAmount.value);
    
    if (name === "") {
        showToast(appData.language === "ar" ? "الرجاء إدخال اسم الهدف" : "Please enter goal name", "error");
        return;
    }
    
    if (isNaN(targetAmount)) {
        showToast(appData.language === "ar" ? "الرجاء إدخال مبلغ صحيح" : "Please enter a valid amount", "error");
        return;
    }
    
    const goal = {
        id: Date.now(),
        name,
        targetAmount,
        savedAmount: 0,
        createdAt: new Date().toISOString()
    };
    
    appData.goals.push(goal);
    saveData();
    updateUI();
    resetGoalForm();
    
    showToast(appData.language === "ar" ? "تمت إضافة الهدف بنجاح" : "Goal added successfully", "success");
}

// تحديث واجهة المستخدم
function updateUI() {
    // تحديث الرصيد
    elements.balance.textContent = `${appData.balance.toFixed(2)} EGP`;
    
    // تحديث إجمالي الدخل والمصروفات
    const totalIncome = appData.transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = appData.transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    
    elements.totalIncome.textContent = totalIncome.toFixed(2);
    elements.totalExpense.textContent = totalExpense.toFixed(2);
    
    // تحديث قائمة المعاملات
    updateTransactionsList();
    
    // تحديث قائمة الأهداف
    updateGoalsList();
}

// تحديث قائمة المعاملات
function updateTransactionsList() {
    const filter = elements.filter.value;
    let transactionsToShow = [...appData.transactions];
    
    if (filter !== "all") {
        transactionsToShow = transactionsToShow.filter(t => t.type === filter);
    }
    
    // ترتيب من الأحدث إلى الأقدم
    transactionsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = "";
    
    if (transactionsToShow.length === 0) {
        html = `<div class="transaction-item">
            <p class="lang-ar">لا توجد معاملات</p>
            <p class="lang-en hidden">No transactions</p>
        </div>`;
    } else {
        transactionsToShow.forEach(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString(appData.language === "ar" ? "ar-EG" : "en-US");
            
            html += `
                <div class="transaction-item">
                    <div>
                        <p style="margin: 0; font-weight: bold;">${transaction.note}</p>
                        <small style="color: #777;">${formattedDate} - ${transaction.category}</small>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-weight: bold;" class="${transaction.type}">
                            ${transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                        </p>
                        <button onclick="deleteTransaction(${transaction.id})" class="btn" style="padding: 2px 5px; font-size: 12px;">
                            <span class="lang-ar">حذف</span>
                            <span class="lang-en hidden">Delete</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    elements.transactions.innerHTML = html;
}

// تحديث قائمة الأهداف
function updateGoalsList() {
    let html = "";
    
    if (appData.goals.length === 0) {
        html = `<div style="text-align: center; padding: 10px; color: #777;">
            <p class="lang-ar">لا توجد أهداف</p>
            <p class="lang-en hidden">No goals</p>
        </div>`;
    } else {
        appData.goals.forEach(goal => {
            const progress = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
            const progressColor = progress === 100 ? "bg-success" : "bg-primary";
            
            html += `
                <div style="border: 1px solid #eee; border-radius: 8px; padding: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <h4 style="margin: 0;">${goal.name}</h4>
                        <button onclick="deleteGoal(${goal.id})" class="btn" style="padding: 2px 5px; font-size: 12px;">
                            <span class="lang-ar">حذف</span>
                            <span class="lang-en hidden">Delete</span>
                        </button>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>${goal.savedAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)} EGP</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar" style="height: 10px; background-color: #eee; border-radius: 5px; overflow: hidden;">
                        <div class="${progressColor}" style="height: 100%; width: ${progress}%;"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                        <input type="number" id="add-to-goal-${goal.id}" placeholder="المبلغ" style="padding: 5px;">
                        <button onclick="addToGoal(${goal.id})" class="btn btn-primary" style="padding: 5px;">
                            <span class="lang-ar">إضافة</span>
                            <span class="lang-en hidden">Add</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    elements.goalsList.innerHTML = html;
}

// حذف معاملة
function deleteTransaction(id) {
    const index = appData.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        const transaction = appData.transactions[index];
        
        if (transaction.type === "income") {
            appData.balance -= transaction.amount;
        } else {
            appData.balance += transaction.amount;
        }
        
        appData.transactions.splice(index, 1);
        saveData();
        updateUI();
        
        showToast(appData.language === "ar" ? "تم حذف المعاملة" : "Transaction deleted", "success");
    }
}

// حذف هدف
function deleteGoal(id) {
    const index = appData.goals.findIndex(g => g.id === id);
    if (index !== -1) {
        appData.goals.splice(index, 1);
        saveData();
        updateUI();
        
        showToast(appData.language === "ar" ? "تم حذف الهدف" : "Goal deleted", "success");
    }
}

// إضافة مبلغ إلى الهدف
function addToGoal(id) {
    const goal = appData.goals.find(g => g.id === id);
    if (!goal) return;
    
    const input = document.getElementById(`add-to-goal-${id}`);
    const amount = parseFloat(input.value);
    
    if (isNaN(amount)) {
        showToast(appData.language === "ar" ? "الرجاء إدخال مبلغ صحيح" : "Please enter a valid amount", "error");
        return;
    }
    
    if (amount <= 0) {
        showToast(appData.language === "ar" ? "المبلغ يجب أن يكون موجبًا" : "Amount must be positive", "error");
        return;
    }
    
    if (goal.savedAmount + amount > goal.targetAmount) {
        showToast(appData.language === "ar" ? "المبلغ يتجاوز الهدف المطلوب" : "Amount exceeds target goal", "error");
        return;
    }
    
    if (amount > appData.balance) {
        showToast(appData.language === "ar" ? "لا يوجد رصيد كافي" : "Insufficient balance", "error");
        return;
    }
    
    goal.savedAmount += amount;
    appData.balance -= amount;
    
    // إضافة معاملة مصروف
    const transaction = {
        id: Date.now(),
        type: "expense",
        amount,
        note: `إضافة إلى الهدف: ${goal.name}`,
        category: "goals",
        date: new Date().toISOString()
    };
    
    appData.transactions.push(transaction);
    saveData();
    updateUI();
    input.value = "";
    
    showToast(appData.language === "ar" ? "تمت إضافة المبلغ إلى الهدف" : "Amount added to goal", "success");
}

// تعيين اللغة
function setLanguage(lang) {
    appData.language = lang;
    localStorage.setItem("language", lang);
    
    // تحديث اتجاه الصفحة
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    
    // تبديل العناصر المرئية حسب اللغة
    document.querySelectorAll(".lang-ar").forEach(el => {
        el.style.display = lang === "ar" ? "block" : "none";
    });
    
    document.querySelectorAll(".lang-en").forEach(el => {
        el.style.display = lang === "en" ? "block" : "none";
    });
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // تحديث لغة التعرف الصوتي
    if (recognition) {
        recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    }
}

// تصدير البيانات
function exportData() {
    const dataStr = JSON.stringify(appData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `expenses-data-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast(appData.language === "ar" ? "تم تصدير البيانات" : "Data exported", "success");
}

// استيراد البيانات
function importData() {
    elements.importFile.click();
}

// معالجة ملف الاستيراد
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // التحقق من صحة البيانات
            if (data && typeof data.balance === "number" && Array.isArray(data.transactions) && Array.isArray(data.goals)) {
                appData = data;
                saveData();
                updateUI();
                
                showToast(appData.language === "ar" ? "تم استيراد البيانات بنجاح" : "Data imported successfully", "success");
            } else {
                showToast(appData.language === "ar" ? "ملف غير صالح" : "Invalid file", "error");
            }
        } catch (err) {
            showToast(appData.language === "ar" ? "خطأ في قراءة الملف" : "Error reading file", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = ""; // إعادة تعيين قيمة الإدخال للسماح باستيراد نفس الملف مرة أخرى
}

// إعادة تعيين البيانات
function resetData() {
    appData = {
        balance: 0,
        transactions: [],
        goals: [],
        language: appData.language
    };
    
    saveData();
    updateUI();
    elements.confirmBox.style.display = "none";
    
    showToast(appData.language === "ar" ? "تم إعادة تعيين البيانات" : "Data reset", "success");
}

// عرض رسالة toast
function showToast(message, type) {
    elements.toastMessage.textContent = message;
    elements.toast.style.backgroundColor = type === "error" ? "#e74c3c" : "#2ecc71";
    elements.toast.style.display = "block";
    
    setTimeout(() => {
        elements.toast.style.display = "none";
    }, 3000);
}

// حفظ البيانات في localStorage
function saveData() {
    localStorage.setItem("balance", appData.balance.toString());
    localStorage.setItem("transactions", JSON.stringify(appData.transactions));
    localStorage.setItem("goals", JSON.stringify(appData.goals));
}

// إعادة تعيين نموذج المعاملة
function resetForm() {
    elements.amount.value = "";
    elements.note.value = "";
    elements.category.value = "عام";
}

// إعادة تعيين نموذج الهدف
function resetGoalForm() {
    elements.goalName.value = "";
    elements.goalAmount.value = "";
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    elements.addIncome.addEventListener("click", () => addTransaction("income"));
    elements.addExpense.addEventListener("click", () => addTransaction("expense"));
    elements.addGoal.addEventListener("click", addGoal);
    elements.filter.addEventListener("change", updateUI);
    elements.exportData.addEventListener("click", exportData);
    elements.importData.addEventListener("click", importData);
    elements.importFile.addEventListener("change", handleFileImport);
    elements.resetBtn.addEventListener("click", () => {
        elements.confirmBox.style.display = "flex";
    });
    elements.cancelBtn.addEventListener("click", () => {
        elements.confirmBox.style.display = "none";
    });
    elements.confirmReset.addEventListener("click", resetData);
    elements.langAr.addEventListener("click", () => setLanguage("ar"));
    elements.langEn.addEventListener("click", () => setLanguage("en"));
    
    // أحداث الميكروفون
    elements.micAmountCheckbox.addEventListener("change", function() {
        if (this.checked) {
            startVoiceRecognition(this);
        }
    });
    elements.micNoteCheckbox.addEventListener("change", function() {
        if (this.checked) {
            startVoiceRecognition(this);
        }
    });
    elements.micGoalNameCheckbox.addEventListener("change", function() {
        if (this.checked) {
            startVoiceRecognition(this);
        }
    });
    elements.micGoalAmountCheckbox.addEventListener("change", function() {
        if (this.checked) {
            startVoiceRecognition(this);
        }
    });
}

// جعل الدوال متاحة عالمياً
window.deleteTransaction = deleteTransaction;
window.deleteGoal = deleteGoal;
window.addToGoal = addToGoal;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", initApp);
