import { Injectable } from '@nestjs/common';

@Injectable()
export class SimilarityService {
  public normalizeLatex(latex: string): string {
    if (!latex) {
      return '';
    }

    // 1. Limpieza inicial: elimina espacios en blanco y el signo '=' al final.
    let normalized = latex.trim().replace(/=$/, '');

    // 2. Normalización de barras invertidas: unifica \\ a \ para evitar problemas de escapado.
    while (normalized.includes('\\\\')) {
      normalized = normalized.replace(/\\\\/g, '\\');
    }

    // 3. Eliminación de comandos de formato visual que no aportan valor semántico.
    normalized = normalized.replace(/\\left|\\right|\\mathrm/g, '');

    // 4. Conversión de comandos LaTeX a una representación textual simple y consistente.
    //    Esta regex de fracción es más robusta y maneja casos con y sin llaves.
    normalized = normalized.replace(
      /\\frac(?:\{([^}]+)\}|(\S))\s*(?:\{([^}]+)\}|(\S))/g,
      '($1$2)/($3$4)',
    );
    normalized = normalized.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
    normalized = normalized.replace(/\\times/g, '*');
    normalized = normalized.replace(/\^\{([^}]+)\}/g, '^($1)'); // Estandariza potencias: x^{ab} -> x^(ab)

    // 5. Eliminación final de caracteres de control de LaTeX.
    normalized = normalized.replace(/[{}]/g, '');

    // 6. Eliminación de todos los espacios restantes.
    normalized = normalized.replace(/\s+/g, '');

    return normalized;
  }

 public generateNgrams(text: string, n: number = 3): Set<string> {
  // Verificación para evitar errores con entradas nulas o muy cortas.
  if (!text || text.length < n) {
    return new Set(text ? [text] : []);
  }
  const ngrams = new Set<string>();
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.add(text.substring(i, i + n));
  }
  return ngrams;
}
  public jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersectionSize = new Set([...setA].filter((x) => setB.has(x))).size;
    const unionSize = new Set([...setA, ...setB]).size;

    if (unionSize === 0) {
      return 1; // Dos conjuntos vacíos son idénticos
    }

    return intersectionSize / unionSize;
  }
}
