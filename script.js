// --- PWA 註冊 ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker 註冊成功', reg))
            .catch(err => console.log('Service Worker 註冊失敗', err));
    });
}

// --- 計算機邏輯 ---
class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        // CE 功能: 僅清除當前輸入
        this.currentOperand = '';
    }

    appendNumber(number) {
        // 限制輸入長度最多 8 位
        if (this.currentOperand.length >= 8) return;
        
        // 防止多個小數點
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        // 如果剛按完等於，重新輸入數字會清空
        if (this.justComputed) {
            this.currentOperand = '';
            this.justComputed = false;
        }

        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    alert('不能除以 0');
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // 解決浮點數精度問題 (例如 0.1+0.2)
        computation = Math.round(computation * 100000000) / 100000000;

        // 加入歷史紀錄
        addHistory(this.previousOperand, this.operation, this.currentOperand, computation);

        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
        this.justComputed = true; // 標記剛計算完
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandTextElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }
}

// --- DOM 連結與事件 ---
const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');
const equalButton = document.querySelector('[data-action="compute"]');
const deleteButton = document.querySelector('[data-action="delete"]'); // CE
const allClearButton = document.querySelector('[data-action="clear"]'); // C

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.innerText);
        calculator.updateDisplay();
    });
});

equalButton.addEventListener('click', () => {
    calculator.compute();
    calculator.updateDisplay();
});

allClearButton.addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
});

deleteButton.addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
});

// --- 歷史紀錄與列印功能 ---
const historyList = document.getElementById('history-list');
const totalCountSpan = document.getElementById('total-count');
const printBtn = document.getElementById('print-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const shopNameInput = document.getElementById('shop-name-input');
let historyData = [];

function addHistory(prev, op, curr, result) {
    const record = {
        expression: `${prev} ${op} ${curr} =`,
        result: result
    };
    historyData.push(record);
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    historyData.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="history-expression">${item.expression}</span>
            <span class="history-result">${item.result}</span>
        `;
        historyList.prepend(li); // 新的在上面
    });
    totalCountSpan.innerText = historyData.length;
}

clearHistoryBtn.addEventListener('click', () => {
    if(confirm('確定要清除所有計算紀錄嗎？')) {
        historyData = [];
        renderHistory();
    }
});

// 列印邏輯
printBtn.addEventListener('click', () => {
    if (historyData.length === 0) {
        alert('目前沒有計算紀錄可列印');
        return;
    }

    // 1. 設定頁首資訊
    document.getElementById('print-shop-name').innerText = shopNameInput.value || '店家名稱';
    const now = new Date();
    document.getElementById('print-date').innerText = now.toLocaleString('zh-TW');

    // 2. 複製歷史紀錄到列印區
    const printContent = document.getElementById('print-content');
    printContent.innerHTML = ''; // 清空舊的
    
    // 建立列印用的列表
    const ul = document.createElement('ul');
    // 這裡我們希望列印時舊的在上面，還是新的在上面？通常明細是依序的，我們用原始順序(反轉render的prepend)
    // 這裡直接複製目前顯示的 DOM (新的在上面)
    historyData.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="history-expression">${item.expression}</span>
            <span class="history-result">${item.result}</span>
        `;
        ul.appendChild(li); 
    });
    printContent.appendChild(ul);

    // 加入總筆數
    const footer = document.createElement('div');
    footer.className = 'print-footer';
    footer.innerText = `總筆數：${historyData.length} 筆`;
    printContent.appendChild(footer);

    // 3. 觸發列印
    window.print();
});
