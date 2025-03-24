let appData = {
    balance: parseFloat(localStorage.getItem("balance")) || 0,
    transactions: JSON.parse(localStorage.getItem("transactions")) || [],
    goals: JSON.parse(localStorage.getItem("goals")) || [],
    language: localStorage.getItem("language") || "ar"
};

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
    langEn: document.getElementById("langEn")
};

function initApp() {
    setLanguage(appData.language);
    updateUI();
}

function setLanguage(lang) {
    appData.language = lang;
    localStorage.setItem("language", lang);
    
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    
    document.querySelectorAll(".lang-ar").forEach(el => {
        el.classList.toggle("hidden", lang !== "ar");
    });
    
    document.querySelectorAll(".lang-en").forEach(el => {
        el.classList.toggle("hidden", lang !== "en");
    });
    
    updateUI();
}

function addTransaction(type) {
    const amount = parseFloat(elements.amount.value);
    const note = elements.note.value.trim() || (appData.language === "ar" ? "·« ÌÊÃœ Ê’›" : "No description");
    const category = elements.category.value;
    const date = new Date().toLocaleString(appData.language === "ar" ? "ar-EG" : "en-US", {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isNaN(amount) || amount <= 0) {
        showToast(appData.language === "ar" ? "«·„»·€ €Ì— ’ÕÌÕ!" : "Invalid amount!", "error");
        return;
    }

    if (type === "expense" && amount > appData.balance) {
        showToast(appData.language === "ar" ? "«·—’Ìœ €Ì— ﬂ«›Ì!" : "Insufficient balance!", "error");
        return;
    }

    appData.balance += type === "income" ? amount : -amount;
    appData.transactions.unshift({ 
        type, 
        amount, 
        note, 
        category, 
        date
    });
    
    elements.amount.value = "";
    elements.note.value = "";
    
    saveData();
    showToast(
        type === "income" 
            ? (appData.language === "ar" ? " „ ≈÷«›… «·œŒ· »‰Ã«Õ" : "Income added successfully")
            : (appData.language === "ar" ? " „ ≈÷«›… «·„’—Ê› »‰Ã«Õ" : "Expense added successfully")
    );
}

function addGoal() {
    const amount = parseFloat(elements.goalAmount.value);
    const name = elements.goalName.value.trim() || (appData.language === "ar" ? "Âœ› ÃœÌœ" : "New goal");

    if (isNaN(amount) || amount <= 0) {
        showToast(appData.language === "ar" ? "„»·€ «·Âœ› €Ì— ’ÕÌÕ!" : "Invalid goal amount!", "error");
        return;
    }

    appData.goals.unshift({ 
        name, 
        amount, 
        saved: 0,
        id: Date.now().toString()
    });
    
    elements.goalAmount.value = "";
    elements.goalName.value = "";
    
    saveData();
    showToast(appData.language === "ar" ? " „ ≈÷«›… «·Âœ› »‰Ã«Õ" : "Goal added successfully");
}

function updateUI() {
    elements.balance.textContent = `${appData.balance.toFixed(2)} ${appData.language === "ar" ? "Ã‰ÌÂ" : "EGP"}`;
    
    const totalIncome = appData.transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = appData.transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    
    elements.totalIncome.textContent = totalIncome.toFixed(2);
    elements.totalExpense.textContent = totalExpense.toFixed(2);
    
    const filter = elements.filter.value;
    const filteredTransactions = filter === "all" 
        ? appData.transactions 
        : appData.transactions.filter(t => t.type === filter);
    
    elements.transactions.innerHTML = "";
    filteredTransactions.forEach((t, i) => {
        const div = document.createElement("div");
        div.className = `transaction-item ${t.type}`;
        div.innerHTML = `
            <div>
                <strong>${t.note}</strong>
                <div style="font-size: 0.8em; color: #666;">
                    <span>${t.category}</span> ï 
                    <span>${t.date}</span>
                </div>
            </div>
            <div style="font-weight: bold;">
                ${t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
            </div>
            <button onclick="deleteTransaction(${i})" style="color: #999; border: none; background: none; cursor: pointer;">◊</button>
        `;
        elements.transactions.appendChild(div);
    });
    
    elements.goalsList.innerHTML = "";
    appData.goals.forEach((g, i) => {
        const progress = Math.min(Math.floor((g.saved / g.amount) * 100), 100);
        const goalEl = document.createElement("div");
        goalEl.className = "card";
        goalEl.style.padding = "10px";
        goalEl.style.marginBottom = "10px";
        
        goalEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <h3 style="margin: 0;">${g.name}</h3>
                <span>${g.saved.toFixed(2)} / ${g.amount.toFixed(2)} ${appData.language === "ar" ? "Ã‰ÌÂ" : "EGP"}</span>
            </div>
            <div style="background: #eee; height: 5px; border-radius: 2.5px; margin-bottom: 5px;">
                <div style="background: #3498db; height: 100%; border-radius: 2.5px; width: ${progress}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8em; color: #666;">${progress}% ${appData.language === "ar" ? "„ﬂ „·" : "completed"}</span>
                <div style="display: flex; gap: 5px;">
                    <button onclick="addToGoal('${g.id}')" style="background: #3498db; color: white; border: none; border-radius: 3px; padding: 3px 8px; font-size: 0.8em; cursor: pointer;">
                        ${appData.language === "ar" ? "≈÷«›…" : "Add"}
                    </button>
                    <button onclick="deleteGoal('${g.id}')" style="background: #e74c3c; color: white; border: none; border-radius: 3px; padding: 3px 8px; font-size: 0.8em; cursor: pointer;">
                        ${appData.language === "ar" ? "Õ–›" : "Delete"}
                    </button>
                </div>
            </div>
        `;
        elements.goalsList.appendChild(goalEl);
    });
}

function addToGoal(goalId) {
    const goalIndex = appData.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    const goal = appData.goals[goalIndex];
    const remaining = goal.amount - goal.saved;
    
    const amount = parseFloat(prompt(
        appData.language === "ar" 
            ? `√œŒ· «·„»·€ ·≈÷«› Â ··Âœ› "${goal.name}" («·„ »ﬁÌ: ${remaining.toFixed(2)})`
            : `Enter amount to add to goal "${goal.name}" (Remaining: ${remaining.toFixed(2)})`
    ));
    
    if (isNaN(amount) || amount <= 0) {
        showToast(appData.language === "ar" ? "«·„»·€ €Ì— ’ÕÌÕ!" : "Invalid amount!", "error");
        return;
    }
    
    if (amount > appData.balance) {
        showToast(appData.language === "ar" ? "«·—’Ìœ €Ì— ﬂ«›Ì!" : "Insufficient balance!", "error");
        return;
    }
    
    if (amount > remaining) {
        showToast(appData.language === "ar" ? "«·„»·€ Ì Ã«Ê“ ﬁÌ„… «·Âœ›!" : "Amount exceeds goal target!", "warning");
        return;
    }
    
    appData.goals[goalIndex].saved += amount;
    appData.balance -= amount;
    
    appData.transactions.unshift({
        type: "expense",
        amount: amount,
        note: appData.language === "ar" ? ` Ê›Ì— ··Âœ›: ${goal.name}` : `Saving for goal: ${goal.name}`,
        category: appData.language === "ar" ? " Ê›Ì—" : "Savings",
        date: new Date().toLocaleString(appData.language === "ar" ? "ar-EG" : "en-US", {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    });
    
    saveData();
    showToast(
        appData.language === "ar" 
            ? ` „ ≈÷«›… ${amount.toFixed(2)} ··Âœ› "${goal.name}"`
            : `Added ${amount.toFixed(2)} to goal "${goal.name}"`
    );
}

function deleteTransaction(index) {
    const transaction = appData.transactions[index];
    appData.balance += transaction.type === "income" ? -transaction.amount : transaction.amount;
    appData.transactions.splice(index, 1);
    saveData();
    showToast(appData.language === "ar" ? " „ Õ–› «·„⁄«„·…" : "Transaction deleted");
}

function deleteGoal(goalId) {
    const goalIndex = appData.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    appData.goals.splice(goalIndex, 1);
    saveData();
    showToast(appData.language === "ar" ? " „ Õ–› «·Âœ›" : "Goal deleted");
}

function exportData() {
    const data = {
        balance: appData.balance,
        transactions: appData.transactions,
        goals: appData.goals,
        language: appData.language
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = appData.language === "ar" ? "»Ì«‰« _«·„’«—Ì›.json" : "expenses_data.json";
    a.click();
    showToast(appData.language === "ar" ? " „  ’œÌ— «·»Ì«‰« " : "Data exported");
}

function importData() {
    elements.importFile.click();
}

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (typeof data.balance !== "number" || !Array.isArray(data.transactions)) {
                throw new Error("Invalid data format");
            }
            
            appData = {
                balance: data.balance,
                transactions: data.transactions || [],
                goals: data.goals || [],
                language: data.language || "ar"
            };
            
            saveData();
            showToast(appData.language === "ar" ? " „ «” Ì—«œ «·»Ì«‰« " : "Data imported");
        } catch (error) {
            showToast(appData.language === "ar" ? "„·› »Ì«‰«  €Ì— ’«·Õ" : "Invalid data file", "error");
            console.error("Import error:", error);
        }
    };
    reader.readAsText(file);
    elements.importFile.value = "";
}

function resetData() {
    elements.confirmBox.style.display = "none";
    appData = {
        balance: 0,
        transactions: [],
        goals: [],
        language: appData.language
    };
    
    saveData();
    showToast(appData.language === "ar" ? " „ ≈⁄«œ… «·÷»ÿ" : "Reset completed");
}

function saveData() {
    localStorage.setItem("balance", appData.balance);
    localStorage.setItem("transactions", JSON.stringify(appData.transactions));
    localStorage.setItem("goals", JSON.stringify(appData.goals));
    localStorage.setItem("language", appData.language);
    updateUI();
}

function showToast(message, type = "info") {
    const toast = elements.toast;
    toast.style.backgroundColor = type === "error" ? "#e74c3c" : 
                               type === "success" ? "#2ecc71" : 
                               type === "warning" ? "#f39c12" : "#3498db";
    
    elements.toastMessage.textContent = message;
    toast.style.display = "flex";
    
    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

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
}

window.deleteTransaction = deleteTransaction;
window.deleteGoal = deleteGoal;
window.addToGoal = addToGoal;

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    initApp();
});