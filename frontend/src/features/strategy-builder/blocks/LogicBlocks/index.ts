import type { BlockTemplate } from '../../types/blocks';
import { BlockType, BlockCategory, DataType } from '../../types/blocks';

export const ComparisonBlockTemplate: BlockTemplate = {
  type: BlockType.COMPARISON,
  category: BlockCategory.LOGIC,
  name: 'Comparison',
  description: 'Compares two values using various operators',
  icon: '≡',
  inputs: [
    {
      name: 'Left Value',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Left side value for comparison'
    },
    {
      name: 'Right Value',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Right side value for comparison'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.BOOLEAN,
      description: 'Comparison result (true/false)'
    }
  ],
  properties: [
    {
      name: 'operator',
      type: 'select',
      required: true,
      options: [
        { label: 'Greater than (>)', value: '>' },
        { label: 'Less than (<)', value: '<' },
        { label: 'Greater or equal (>=)', value: '>=' },
        { label: 'Less or equal (<=)', value: '<=' },
        { label: 'Equal (==)', value: '==' },
        { label: 'Not equal (!=)', value: '!=' },
        { label: 'Crosses above', value: 'crosses_above' },
        { label: 'Crosses below', value: 'crosses_below' }
      ],
      description: 'Comparison operator'
    }
  ],
  defaultSize: { width: 160, height: 130 },
  implementation: `
    class ComparisonOperator {
      private operator: string;
      private previousLeft?: number;
      private previousRight?: number;
      
      constructor(operator: string) {
        this.operator = operator;
      }
      
      compare(left: number, right: number): boolean {
        let result = false;
        
        switch (this.operator) {
          case '>':
            result = left > right;
            break;
          case '<':
            result = left < right;
            break;
          case '>=':
            result = left >= right;
            break;
          case '<=':
            result = left <= right;
            break;
          case '==':
            result = Math.abs(left - right) < 0.0001; // Handle floating point precision
            break;
          case '!=':
            result = Math.abs(left - right) >= 0.0001;
            break;
          case 'crosses_above':
            result = this.previousLeft !== undefined && 
                    this.previousRight !== undefined &&
                    this.previousLeft <= this.previousRight && 
                    left > right;
            break;
          case 'crosses_below':
            result = this.previousLeft !== undefined && 
                    this.previousRight !== undefined &&
                    this.previousLeft >= this.previousRight && 
                    left < right;
            break;
          default:
            result = false;
        }
        
        this.previousLeft = left;
        this.previousRight = right;
        
        return result;
      }
      
      reset(): void {
        this.previousLeft = undefined;
        this.previousRight = undefined;
      }
    }
  `
};

export const LogicalAndBlockTemplate: BlockTemplate = {
  type: BlockType.LOGICAL_AND,
  category: BlockCategory.LOGIC,
  name: 'Logical AND',
  description: 'Returns true only if both inputs are true',
  icon: '∧',
  inputs: [
    {
      name: 'Input A',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'First boolean input'
    },
    {
      name: 'Input B',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Second boolean input'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.BOOLEAN,
      description: 'Logical AND result'
    }
  ],
  properties: [],
  defaultSize: { width: 140, height: 100 },
  implementation: `
    class LogicalAndOperator {
      evaluate(inputA: boolean, inputB: boolean): boolean {
        return inputA && inputB;
      }
      
      reset(): void {
        // No state to reset
      }
    }
  `
};

export const LogicalOrBlockTemplate: BlockTemplate = {
  type: BlockType.LOGICAL_OR,
  category: BlockCategory.LOGIC,
  name: 'Logical OR',
  description: 'Returns true if at least one input is true',
  icon: '∨',
  inputs: [
    {
      name: 'Input A',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'First boolean input'
    },
    {
      name: 'Input B',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Second boolean input'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.BOOLEAN,
      description: 'Logical OR result'
    }
  ],
  properties: [],
  defaultSize: { width: 140, height: 100 },
  implementation: `
    class LogicalOrOperator {
      evaluate(inputA: boolean, inputB: boolean): boolean {
        return inputA || inputB;
      }
      
      reset(): void {
        // No state to reset
      }
    }
  `
};

export const LogicalNotBlockTemplate: BlockTemplate = {
  type: BlockType.LOGICAL_NOT,
  category: BlockCategory.LOGIC,
  name: 'Logical NOT',
  description: 'Inverts the boolean input (true becomes false, false becomes true)',
  icon: '¬',
  inputs: [
    {
      name: 'Input',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Boolean input to invert'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.BOOLEAN,
      description: 'Inverted boolean result'
    }
  ],
  properties: [],
  defaultSize: { width: 120, height: 80 },
  implementation: `
    class LogicalNotOperator {
      evaluate(input: boolean): boolean {
        return !input;
      }
      
      reset(): void {
        // No state to reset
      }
    }
  `
};

export const ConditionalBlockTemplate: BlockTemplate = {
  type: BlockType.CONDITIONAL,
  category: BlockCategory.LOGIC,
  name: 'Conditional (If-Then-Else)',
  description: 'Routes data based on a condition',
  icon: '❓',
  inputs: [
    {
      name: 'Condition',
      dataType: DataType.BOOLEAN,
      required: true,
      description: 'Condition to evaluate'
    },
    {
      name: 'True Value',
      dataType: DataType.ANY,
      required: true,
      description: 'Value to output when condition is true'
    },
    {
      name: 'False Value',
      dataType: DataType.ANY,
      required: true,
      description: 'Value to output when condition is false'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.ANY,
      description: 'Selected value based on condition'
    }
  ],
  properties: [],
  defaultSize: { width: 160, height: 140 },
  implementation: `
    class ConditionalOperator {
      evaluate(condition: boolean, trueValue: any, falseValue: any): any {
        return condition ? trueValue : falseValue;
      }
      
      reset(): void {
        // No state to reset
      }
    }
  `
};

export const ArithmeticBlockTemplate: BlockTemplate = {
  type: BlockType.ARITHMETIC,
  category: BlockCategory.MATH,
  name: 'Arithmetic Operation',
  description: 'Performs basic arithmetic operations on two numbers',
  icon: '➕',
  inputs: [
    {
      name: 'Left Value',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Left operand'
    },
    {
      name: 'Right Value',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Right operand'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.NUMBER,
      description: 'Arithmetic operation result'
    }
  ],
  properties: [
    {
      name: 'operation',
      type: 'select',
      required: true,
      options: [
        { label: 'Addition (+)', value: 'add' },
        { label: 'Subtraction (-)', value: 'subtract' },
        { label: 'Multiplication (×)', value: 'multiply' },
        { label: 'Division (÷)', value: 'divide' },
        { label: 'Power (^)', value: 'power' },
        { label: 'Modulo (%)', value: 'modulo' }
      ],
      description: 'Arithmetic operation to perform'
    }
  ],
  defaultSize: { width: 160, height: 120 },
  implementation: `
    class ArithmeticOperator {
      private operation: string;
      
      constructor(operation: string) {
        this.operation = operation;
      }
      
      calculate(left: number, right: number): number {
        switch (this.operation) {
          case 'add':
            return left + right;
          case 'subtract':
            return left - right;
          case 'multiply':
            return left * right;
          case 'divide':
            return right !== 0 ? left / right : 0; // Avoid division by zero
          case 'power':
            return Math.pow(left, right);
          case 'modulo':
            return right !== 0 ? left % right : 0;
          default:
            return 0;
        }
      }
      
      reset(): void {
        // No state to reset
      }
    }
  `
};

export const MathFunctionBlockTemplate: BlockTemplate = {
  type: BlockType.MATH_FUNCTION,
  category: BlockCategory.MATH,
  name: 'Math Function',
  description: 'Applies mathematical functions to input values',
  icon: 'ƒ',
  inputs: [
    {
      name: 'Input',
      dataType: DataType.NUMBER,
      required: true,
      description: 'Input value for mathematical function'
    }
  ],
  outputs: [
    {
      name: 'Result',
      dataType: DataType.NUMBER,
      description: 'Function result'
    }
  ],
  properties: [
    {
      name: 'function',
      type: 'select',
      required: true,
      options: [
        { label: 'Absolute (|x|)', value: 'abs' },
        { label: 'Square Root (√x)', value: 'sqrt' },
        { label: 'Natural Log (ln)', value: 'log' },
        { label: 'Log Base 10', value: 'log10' },
        { label: 'Sine (sin)', value: 'sin' },
        { label: 'Cosine (cos)', value: 'cos' },
        { label: 'Tangent (tan)', value: 'tan' },
        { label: 'Round', value: 'round' },
        { label: 'Floor', value: 'floor' },
        { label: 'Ceiling', value: 'ceil' }
      ],
      description: 'Mathematical function to apply'
    }
  ],
  defaultSize: { width: 140, height: 100 },
  implementation: `
    class MathFunctionOperator {
      private functionName: string;
      
      constructor(functionName: string) {
        this.functionName = functionName;
      }
      
      calculate(input: number): number {
        switch (this.functionName) {
          case 'abs':
            return Math.abs(input);
          case 'sqrt':
            return Math.sqrt(Math.abs(input)); // Avoid imaginary numbers
          case 'log':
            return input > 0 ? Math.log(input) : 0;
          case 'log10':
            return input > 0 ? Math.log10(input) : 0;
          case 'sin':
            return Math.sin(input);
          case 'cos':
            return Math.cos(input);
          case 'tan':
            return Math.tan(input);
          case 'round':
            return Math.round(input);
          case 'floor':
            return Math.floor(input);
          case 'ceil':
            return Math.ceil(input);
          default:
            return input;
        }
      }
      
      reset(): void {
        // No state to reset
      }
    }
  `
};

// Export all logic block templates
export const LogicBlocks: BlockTemplate[] = [
  ComparisonBlockTemplate,
  LogicalAndBlockTemplate,
  LogicalOrBlockTemplate,
  LogicalNotBlockTemplate,
  ConditionalBlockTemplate,
  ArithmeticBlockTemplate,
  MathFunctionBlockTemplate
];