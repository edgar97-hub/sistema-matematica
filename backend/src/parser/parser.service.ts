import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { create, all, MathNode } from 'mathjs';

interface ConversionRule {
  name: string;
  regex: RegExp;
  replacement: string | ((...args: string[]) => string);
}

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);
  private readonly math;
  private readonly conversionRules: ConversionRule[];
  private convertMatrixContentToString(matrixContent: string): string {
    const rows = matrixContent.trim().split(/\\\\/);
    const matrix = rows.map(
      (row) =>
        `[${row
          .trim()
          .split('&')
          .map((cell) => cell.trim())
          .join(', ')}]`,
    );
    return `[${matrix.join(', ')}]`;
  }
  constructor() {
    this.math = create(all);
    this.math.import(
      {
        limit: () => 0,
        integrate: () => 0,
        sum: () => 0,
        prod: () => 0,
        union: () => 0,
        intersect: () => 0,
      },
      { override: true },
    );

    this.conversionRules = [
      {
        name: 'Matrix (pmatrix)',
        regex: /\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
        replacement: (_match, content: string) =>
          `[${content
            .trim()
            .split(/\\\\/)
            .map(
              (row) =>
                `[${row
                  .trim()
                  .split('&')
                  .map((cell) => cell.trim())
                  .join(', ')}]`,
            )
            .join(', ')}]`,
      },
      {
        name: 'Determinant (vmatrix)',
        regex: /\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g,
        replacement: (_match, content: string) =>
          `det(${this.convertMatrixContentToString(content)})`,

        // replacement: (_match, content: string) =>
        //   `det(${this.conversionRules[0].replacement(_match, content)})`,
      },
      {
        name: 'Determinant (det)',
        regex: /\\det\s*\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
        // replacement: (_match, content: string) =>
        //   `det(${this.conversionRules[0].replacement(_match, content)})`,
        replacement: (_match, content: string) =>
          `det(${this.convertMatrixContentToString(content)})`,
      },
      {
        name: 'Fraction',
        regex: /\\frac\{([\s\S]*?)\}\{([\s\S]*?)\}/g,
        replacement: '($1) / ($2)',
      },
      {
        name: 'N-th Root',
        regex: /\\sqrt\[([\s\S]*?)\]\{([\s\S]*?)\}/g,
        replacement: 'nthRoot($2, $1)',
      },
      {
        name: 'Square Root',
        regex: /\\sqrt\{([\s\S]*?)\}/g,
        replacement: 'sqrt($1)',
      },
      {
        name: 'Summation',
        regex:
          /\\sum_\{([\s\S]*?=[\s\S]*?)\}\^\{([\s\S]*?)\}\s*\(([\s\S]*?)\)/g,
        replacement: 'sum($3, $1, $2)',
      },
      {
        name: 'Product',
        regex:
          /\\prod_\{([\s\S]*?=[\s\S]*?)\}\^\{([\s\S]*?)\}\s*\(([\s\S]*?)\)/g,
        replacement: 'prod($3, $1, $2)',
      },
      {
        name: 'Limit',
        regex: /\\lim_\{([\s\S]*?)\\to([\s\S]*?)\}\s*\(([\s\S]*?)\)/g,
        replacement: 'limit($3, $1, $2)',
      },
      {
        name: 'Definite Integral',
        regex: /\\int_\{([\s\S]*?)\}\^\{([\s\S]*?)\}([\s\S]*?)\\s*d([\s\S]?)/g,
        replacement: 'integrate($3, $4, $1, $2)',
      },
      {
        name: 'Indefinite Integral',
        regex: /\\int([\s\S]*?)\\s*d([\s\S]?)/g,
        replacement: 'integrate($1, $2)',
      },
      {
        name: 'Leibniz Derivative',
        regex: /\\frac\{d\}\{d([\s\S])\}\s*\(([\s\S]*?)\)/g,
        replacement: 'derivative($2, $1)',
      },
      {
        name: 'Logarithm with base',
        regex: /\\log_\{([\s\S]*?)\}\(([\s\S]*?)\)/g,
        replacement: 'log($2, $1)',
      },
      {
        name: 'Natural Log',
        regex: /\\ln\(([\s\S]*?)\)/g,
        replacement: 'log($1)',
      },
      {
        name: 'Trig Functions',
        regex:
          /\\(sin|cos|tan|csc|sec|cot|arcsin|arccos|arctan)\^?\{?([\d\.]*)\}?\s*\(([\s\S]*?)\)/g,
        replacement: (_match, p1, p2, p3) =>
          p2 ? `(${p1}(${p3}))^${p2}` : `${p1}(${p3})`,
      },
      {
        name: 'Greek Letters',
        regex: /\\(alpha|beta|gamma|theta|pi|Delta|Sigma|Omega)/g,
        replacement: '$1',
      },
      {
        name: 'Set Operators',
        regex: /\\(cup|cap)/g,
        replacement: (_match, op) => (op === 'cup' ? 'union' : 'intersect'),
      },
      {
        name: 'Absolute Value',
        regex: /\|([\s\S]*?)\|/g,
        replacement: 'abs($1)',
      },
      {
        name: 'Remove \left and \right',
        regex: /\\left|\\right/g,
        replacement: '',
      },
      {
        name: 'Convert explicit multiplication',
        regex: /\\times/g,
        replacement: '*',
      },
      { name: 'Cleanup Braces', regex: /\{|\}/g, replacement: '' },
    ];
  }

  public generateAstFromLatex(latexString: string): MathNode {
    this.logger.log(`Iniciando conversión para LaTeX: "${latexString}"`);
    try {
      const plainTextExpression = this.convertLatexToPlainText(latexString);
      this.logger.log(
        `Expresión convertida a texto plano: "${plainTextExpression}"`,
      );
      const expressionWithMultiplication =
        this.addImplicitMultiplication(plainTextExpression);
      this.logger.log(
        `Expresión con multiplicación implícita: "${expressionWithMultiplication}"`,
      );
      const ast: MathNode = this.math.parse(expressionWithMultiplication);
      this.logger.log('AST generado con éxito.');
      return ast;
    } catch (error) {
      this.logger.error(
        `Error al parsear la expresión: "${latexString}"`,
        error.stack,
      );
      throw new BadRequestException(
        `La expresión matemática no es válida o no está soportada.`,
      );
    }
  }

  private convertLatexToPlainText(latex: string): string {
    let currentExpression = latex.replace(/f[´']\(x\).*?=/g, '');
    for (let i = 0; i < 10; i++) {
      let expressionBeforePass = currentExpression;
      for (const rule of this.conversionRules) {
        currentExpression = currentExpression.replace(
          rule.regex,
          rule.replacement as any,
        );
      }
      if (currentExpression === expressionBeforePass) break;
    }
    return currentExpression;
  }

  private addImplicitMultiplication(expression: string): string {
    let result = expression.replace(/(\d(?:\.\d+)?)([a-zA-Z\(])/g, '$1*$2');
    result = result.replace(/(\))([a-zA-Z\(])/g, '$1*$2');
    result = result.replace(/([a-zA-Z])(\()/g, '$1*$2');
    return result;
  }
}

//  Plantilla de Alcance de Notación Matemática Requerida

// Instrucción: Proporciona ejemplos de las expresiones más complejas y variadas que esperas que el sistema maneje para cada categoría.

// 1. Aritmética y Álgebra

// Fracciones: (Simples y compuestas)

// Ejemplo: \frac{1}{x+1} - \frac{1}{x-1}

// Ejemplo: \frac{\frac{a}{b} - \frac{c}{d}}{1 + \frac{a}{b}}

// Potencias y Radicales: (Enteros, fraccionarios, anidados)

// Ejemplo: (x^{2/3})^{-3}

// Ejemplo: \sqrt{x^2 + y^2}

// Ejemplo: \sqrt[n]{a^m}

// Logaritmos: (Diferentes bases y argumentos complejos)

// Ejemplo: \log_{b}(x^2)

// Ejemplo: \ln(\frac{x+1}{x-1})

// Productos Notables y Polinomios:

// Ejemplo: (2x - 3y)^3

// Valor Absoluto:

// Ejemplo: |x^2 - 5| = 4

// 2. Trigonometría

// Funciones y Potencias:

// Ejemplo: \sin(2x) + \cos^2(x)

// Funciones Inversas:

// Ejemplo: \arctan(2x)

// Identidades Complejas:

// Ejemplo: \frac{1 - \cos(2\theta)}{\sin(2\theta)}

// 3. Cálculo Diferencial

// Límites: (Incluyendo al infinito)

// Ejemplo: \lim_{h \to 0} \frac{(x+h)^2 - x^2}{h}

// Ejemplo: \lim_{x \to \infty} \frac{3x^2+5}{2x^2-1}

// Derivadas: (Diferentes notaciones y reglas)

// Ejemplo (Leibniz): \frac{d}{dx} (\sin(x^2))

// Ejemplo (Lagrange): f'(x) \text{ donde } f(x) = e^{x^2}

// 4. Cálculo Integral

// Integrales Indefinidas:

// Ejemplo: \int \frac{1}{x^2+1} dx

// Integrales Definidas:

// Ejemplo: \int_{0}^{\pi} \sin(x) dx

// 5. Álgebra Lineal

// Matrices: (Diferentes tamaños)

// Ejemplo 2x2: \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}

// Ejemplo 3x3: \begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix}

// Determinantes:

// Ejemplo: \det \begin{pmatrix} a & b \\ c & d \end{pmatrix} o \begin{vmatrix} a & b \\ c & d \end{vmatrix}

// 6. Notaciones Especiales

// Sumatorias y Productorias:

// Ejemplo: \sum_{k=1}^{10} (k^2 + 1)

// Ejemplo: \prod_{i=1}^{n} \frac{i}{i+1}

// Letras Griegas y Símbolos: (Liste todos los que necesite)

// Ejemplo: \alpha, \beta, \gamma, \theta, \pi, \Delta, \Sigma, \Omega

// Teoría de Conjuntos:

// Ejemplo: A \cup (B \cap C)
