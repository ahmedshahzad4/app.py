// Calculator logic
class Calculator {
    constructor() {
        this.display = document.getElementById('result');
        this.expressionDisplay = document.getElementById('expression');
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.shouldResetInput = false;
        this.expression = '';
        this.lastResult = null;
        this.justEvaluated = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const value = button.dataset.value;
                this.handleInput(value);
                this.updateDisplay();
            });
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            const keyMap = {
                '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
                '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
                '.': '.', '+': '+', '-': '−', '*': '×', '/': '÷',
                'Enter': '=', '=': '=', 'Escape': 'AC', 'Backspace': 'AC'
            };
            const value = keyMap[e.key];
            if (value) {
                e.preventDefault();
                this.handleInput(value);
                this.updateDisplay();
            }
        });
    }

    handleInput(value) {
        if (value === 'AC') {
            this.clear();
            return;
        }

        if (value === '±') {
            this.toggleSign();
            return;
        }

        if (value === '%') {
            this.percentage();
            return;
        }

        if (this.isOperator(value)) {
            this.handleOperator(value);
            return;
        }

        if (value === '=') {
            this.evaluate();
            return;
        }

        if (value === '.') {
            this.handleDecimal();
            return;
        }

        // Number input
        this.handleNumber(value);
    }

    isOperator(value) {
        return ['+', '−', '×', '÷'].includes(value);
    }

    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.shouldResetInput = false;
        this.expression = '';
        this.lastResult = null;
        this.justEvaluated = false;
        document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active'));
    }

    toggleSign() {
        if (this.currentInput !== '0') {
            if (this.currentInput.startsWith('-')) {
                this.currentInput = this.currentInput.slice(1);
            } else {
                this.currentInput = '-' + this.currentInput;
            }
        }
    }

    percentage() {
        const num = parseFloat(this.currentInput);
        if (!isNaN(num)) {
            this.currentInput = String(num / 100);
        }
    }

    handleOperator(operator) {
        const current = parseFloat(this.currentInput);
        
        if (this.operation && !this.shouldResetInput) {
            this.evaluate();
        }

        this.previousInput = this.currentInput;
        this.operation = operator;
        this.shouldResetInput = true;
        this.justEvaluated = false;

        // Update expression
        this.expression = this.currentInput + ' ' + this.getOperatorSymbol(operator) + ' ';
        document.querySelectorAll('.btn-operator').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === operator);
        });
    }

    getOperatorSymbol(operator) {
        const map = { '+': '+', '−': '−', '×': '×', '÷': '÷' };
        return map[operator] || operator;
    }

    handleDecimal() {
        if (this.shouldResetInput) {
            this.currentInput = '0';
            this.shouldResetInput = false;
        }
        if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
        }
    }

    handleNumber(value) {
        if (this.justEvaluated) {
            this.clear();
            this.justEvaluated = false;
        }

        if (this.shouldResetInput) {
            this.currentInput = '0';
            this.shouldResetInput = false;
        }

        if (this.currentInput === '0' && value !== '.') {
            this.currentInput = value;
        } else {
            // Limit input length
            if (this.currentInput.replace('-', '').replace('.', '').length < 15) {
                this.currentInput += value;
            }
        }
    }

    evaluate() {
        const current = parseFloat(this.currentInput);
        const previous = parseFloat(this.previousInput);
        
        if (isNaN(previous) || isNaN(current)) {
            return;
        }

        let result;
        switch (this.operation) {
            case '+':
                result = previous + current;
                break;
            case '−':
                result = previous - current;
                break;
            case '×':
                result = previous * current;
                break;
            case '÷':
                if (current === 0) {
                    this.currentInput = 'Error';
                    this.expression = '';
                    this.operation = null;
                    this.previousInput = '';
                    this.shouldResetInput = true;
                    this.justEvaluated = true;
                    return;
                }
                result = previous / current;
                break;
            default:
                return;
        }

        // Format result
        if (Number.isInteger(result)) {
            this.currentInput = String(result);
        } else {
            // Limit decimal places
            const rounded = Math.round(result * 1e10) / 1e10;
            this.currentInput = String(rounded);
        }

        this.expression = this.previousInput + ' ' + this.getOperatorSymbol(this.operation) + ' ' + 
                         this.currentInput + ' =';
        this.operation = null;
        this.previousInput = '';
        this.shouldResetInput = true;
        this.justEvaluated = true;
        document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active'));

        // Send to server for logging (optional)
        this.sendToServer(this.expression);
    }

    sendToServer(expression) {
        // Optional: Send calculation to server for logging or advanced features
        fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expression: expression.replace('=', '').trim() })
        }).catch(err => console.log('Server logging disabled'));
    }

    updateDisplay() {
        // Format display number
        let displayValue = this.currentInput;
        
        // Handle error
        if (displayValue === 'Error') {
            this.display.textContent = 'Error';
            this.display.className = 'result';
            this.expressionDisplay.textContent = '';
            return;
        }

        // Format large numbers
        if (displayValue.length > 12) {
            const num = parseFloat(displayValue);
            if (!isNaN(num)) {
                displayValue = num.toExponential(6);
            }
        }

        this.display.textContent = displayValue;
        this.expressionDisplay.textContent = this.expression;

        // Adjust font size for long numbers
        const length = displayValue.length;
        this.display.className = 'result';
        if (length > 10) {
            this.display.classList.add('smaller');
        } else if (length > 7) {
            this.display.classList.add('small');
        }
    }
}

// Initialize calculator
const calculator = new Calculator();

// Prevent zoom on double tap
document.addEventListener('touchend', (e) => {
    if (e.target.closest('.btn')) {
        e.preventDefault();
    }
}, { passive: false });