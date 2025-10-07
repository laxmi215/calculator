/* ======================================
   MODERN CALCULATOR APPLICATION
   ====================================== 
   
   This calculator supports:
   - Addition and subtraction operations
   - Display of up to 8 digits (positive) or 7 digits + minus sign (negative)
   - Expression display showing full calculations (e.g., "1+2+3+4")
   - Overflow and error handling
   - Keyboard and mouse input
   - Visual feedback for user interactions
*/

/**
 * Calculator class - handles all calculator functionality
 */
class Calculator {
    /**
     * Constructor - initializes calculator state and sets up event listeners
     */
    constructor() {
        // Get reference to the display screen element
        this.screen = document.getElementById('screen');
        
        // Calculator state variables
        this.currentValue = 0;          // The number currently being displayed/entered
        this.previousValue = null;      // The first number in a calculation
        this.operator = null;           // Current operator (+, -)
        this.waitingForNewValue = false; // Flag indicating if we're waiting for new number input
        this.expression = '0';          // String to track the full expression being built
        
        // Display limits as per requirements
        this.maxDigits = 8;             // Maximum digits for positive numbers
        this.maxNegativeDigits = 7;     // Maximum digits for negative numbers (excluding minus sign)
        
        // Initialize all button event listeners
        this.initializeButtons();
    }
    
    /**
     * Sets up event listeners for all calculator buttons and visual feedback
     */
    initializeButtons() {
        // Set up number buttons (0-9)
        // Loop through digits 0-9 and attach click event listeners
        for (let i = 0; i <= 9; i++) {
            const btn = document.getElementById(`num${i}`);
            btn.addEventListener('click', () => this.inputNumber(i));
        }
        
        // Set up operator buttons (+ and -)
        document.getElementById('plus').addEventListener('click', () => this.inputOperator('+'));
        document.getElementById('minus').addEventListener('click', () => this.inputOperator('-'));
        
        // Set up function buttons (Calculate and Reset)
        document.getElementById('calculate').addEventListener('click', () => this.calculate());
        document.getElementById('reset').addEventListener('click', () => this.reset());
        
        // Add visual feedback for button presses
        // This creates the press animation effect when buttons are clicked
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mousedown', () => btn.classList.add('btn-pressed'));
            btn.addEventListener('mouseup', () => btn.classList.remove('btn-pressed'));
            btn.addEventListener('mouseleave', () => btn.classList.remove('btn-pressed'));
        });
    }
    
    /**
     * Handles number input (digits 0-9)
     * Implements the digit entry logic as specified in requirements
     * @param {number} digit - The digit that was pressed (0-9)
     */
    inputNumber(digit) {
        // If we're waiting for a new value (after operator or calculate), start fresh
        if (this.waitingForNewValue) {
            this.currentValue = digit;          // Set current value to the digit
            this.waitingForNewValue = false;    // No longer waiting for new value
            
            // If this is the start of a completely new calculation (after equals), reset expression
            if (this.operator === null && this.previousValue === null) {
                this.expression = digit.toString();
            } else {
                // Otherwise, just add the new digit to continue the expression
                this.expression += digit;
            }
        } else {
            // Special case: if current value is 0, replace it instead of appending
            if (this.currentValue === 0) {
                this.currentValue = digit;      // Replace the 0 with the new digit
                this.expression = this.expression.slice(0, -1) + digit; // Replace last character in expression
            } else {
                // Continue building the current number
                // Multiply current value by 10 and add new digit (e.g., 3 -> 36 when 6 is pressed)
                const newValue = this.currentValue * 10 + digit;
                
                // Check if the new value would exceed display limits before accepting it
                if (this.wouldOverflow(newValue)) {
                    this.displayOverflow();         // Show overflow message
                    return;                         // Don't update the value
                }
                
                this.currentValue = newValue;       // Update current value
                // Add the digit to the expression
                this.expression += digit;
            }
        }
        
        // Update the display and clear any operator highlighting
        this.updateDisplay();
        this.clearOperatorSelection();
    }
    
    /**
     * Handles operator input (+ or -)
     * Must be followed by either a number or Reset as per requirements
     * @param {string} op - The operator that was pressed ('+' or '-')
     */
    inputOperator(op) {
        // Don't allow operator input during error states
        if (this.screen.textContent === 'ERROR' || this.screen.textContent === 'OVERFLOW') {
            return;
        }
        
        // If we already have an operator and aren't waiting for a new value,
        // perform the previous calculation first (chain calculations)
        if (this.operator && !this.waitingForNewValue) {
            this.calculate();
        }
        
        // Store the current value as the first operand
        this.previousValue = this.currentValue;
        this.operator = op;                     // Store the operator
        this.waitingForNewValue = true;         // Wait for the second operand
        
        // Add the operator to the expression
        this.expression += op;
        this.updateDisplay();
        
        // Highlight the selected operator button for visual feedback
        this.highlightOperator(op);
    }
    
    /**
     * Performs the calculation when Calculate button is pressed
     * Calculates result of previousValue [operator] currentValue
     */
    calculate() {
        // Don't calculate if we don't have all necessary components
        if (this.operator === null || this.previousValue === null || this.waitingForNewValue) {
            return;                             // Not ready to calculate
        }
        
        let result;                             // Variable to store calculation result
        
        try {
            // Perform the calculation based on the operator
            switch (this.operator) {
                case '+':
                    result = this.previousValue + this.currentValue;
                    break;
                case '-':
                    result = this.previousValue - this.currentValue;
                    break;
                default:
                    return;                     // Unknown operator, do nothing
            }
            
            // Check if the result would cause overflow before displaying
            if (this.wouldOverflow(result)) {
                this.displayOverflow();
                return;
            }
            
            // Update calculator state with the result
            this.currentValue = result;         // Result becomes the new current value
            this.previousValue = null;          // Clear previous value
            this.operator = null;              // Clear operator
            this.waitingForNewValue = true;    // Ready for next operation
            
            // Show the result and reset expression for next calculation
            this.expression = result.toString();
            
            // Update display and clear visual indicators
            this.updateDisplay();
            this.clearOperatorSelection();
            
        } catch (error) {
            // Handle any unexpected calculation errors
            this.displayError();
        }
    }
    
    /**
     * Resets the calculator to initial state
     * Sets current value and display to 0 as per requirements
     */
    reset() {
        // Reset all state variables to initial values
        this.currentValue = 0;              // Set display to 0
        this.previousValue = null;          // Clear previous value
        this.operator = null;              // Clear operator
        this.waitingForNewValue = false;   // Not waiting for new value
        this.expression = '0';              // Reset expression to initial state
        
        // Update display and clear all visual indicators
        this.updateDisplay();
        this.clearOperatorSelection();
        this.clearErrorStates();
    }
    
    /**
     * Checks if a value would exceed the display limits
     * @param {number} value - The value to check
     * @returns {boolean} - True if value would overflow, false otherwise
     */
    wouldOverflow(value) {
        // Convert value to string to check length
        const valueStr = value.toString();
        
        if (value < 0) {
            // For negative numbers: "-" + 7 digits maximum
            // Length includes the minus sign, so max is 8 total characters
            return valueStr.length > this.maxNegativeDigits + 1;
        } else {
            // For positive numbers: 8 digits maximum
            return valueStr.length > this.maxDigits;
        }
    }
    
    /**
     * Updates the calculator display with the current expression
     * Shows the full expression being built (e.g., "1+2+3+4")
     */
    updateDisplay() {
        // Check if expression is too long for display
        if (this.expression.length > 20) { // Reasonable limit for display width
            this.screen.textContent = this.expression.substring(this.expression.length - 20);
        } else {
            this.screen.textContent = this.expression;
        }
        
        this.clearErrorStates();
    }
    
    /**
     * Displays "OVERFLOW" message when numbers exceed display limits
     * Automatically resets calculator state as per requirements
     */
    displayOverflow() {
        this.screen.textContent = 'OVERFLOW';      // Show overflow message
        this.screen.classList.remove('error');     // Clear any previous error state
        this.screen.classList.add('overflow');     // Apply overflow styling
        
        // Reset calculator state after overflow
        this.currentValue = 0;
        this.previousValue = null;
        this.operator = null;
        this.waitingForNewValue = true;
        this.expression = '0';
    }
    
    /**
     * Displays "ERROR" message when calculation errors occur
     * Automatically resets calculator state
     */
    displayError() {
        this.screen.textContent = 'ERROR';         // Show error message
        this.screen.classList.remove('overflow'); // Clear any previous overflow state
        this.screen.classList.add('error');       // Apply error styling
        
        // Reset calculator state after error
        this.currentValue = 0;
        this.previousValue = null;
        this.operator = null;
        this.waitingForNewValue = true;
        this.expression = '0';
    }
    
    /**
     * Removes error and overflow CSS classes from the display
     */
    clearErrorStates() {
        this.screen.classList.remove('error', 'overflow');
    }
    
    /**
     * Highlights the currently selected operator button for visual feedback
     * @param {string} operator - The operator to highlight ('+' or '-')
     */
    highlightOperator(operator) {
        // Clear any previous operator selection
        this.clearOperatorSelection();
        
        // Highlight the current operator button
        const operatorBtn = operator === '+' ? 
            document.getElementById('plus') : 
            document.getElementById('minus');
        
        operatorBtn.classList.add('selected');    // Add selected styling
    }
    
    /**
     * Removes highlighting from all operator buttons
     */
    clearOperatorSelection() {
        document.getElementById('plus').classList.remove('selected');
        document.getElementById('minus').classList.remove('selected');
    }
}

/* ======================================
   APPLICATION INITIALIZATION
   ====================================== */

/**
 * Initialize the calculator when the DOM is fully loaded
 * This ensures all HTML elements are available before creating the Calculator instance
 */
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();                       // Create and start the calculator
});