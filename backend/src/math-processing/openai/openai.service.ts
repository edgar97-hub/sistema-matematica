import {
  BadRequestException,
  HttpException,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
// import { FileStorageService } from '../../file-storage/file-storage/file-storage.service';

// Tipos específicos para los parámetros de TTS de OpenAI
// Estos son los valores permitidos por la API de OpenAI para speech.create()
// type OpenAiTtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
// type OpenAiTtsModel = 'tts-1' | 'tts-1-hd';
// type OpenAiTtsResponseFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'; // Añadidos más formatos comunes

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    // private readonly fileStorageService: FileStorageService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateStepByStepSolution(
    extractedMathLatex: string,
    promptBase: string,
    country?: string,
    stage?: string,
    subdivision?: string,
  ): Promise<object> {
    try {
      const userPrompt = `    
 Eres un asistente experto en matemáticas y un generador de guiones para animaciones educativas.
Tu tarea es resolver problemas matemáticos paso a paso, desglosando la solución en los pasos más pequeños y lógicos posibles,
como si cada paso fuera una "diapositiva" o "segmento de animación" en un video.

El problema matemático a resolver es: ${extractedMathLatex}.
Contexto adicional para la resolución (si aplica): País: ${country || 'General'}, Etapa: ${stage || 'General'}, Nivel: ${subdivision || 'General'}.

Tu respuesta DEBE ser un objeto JSON válido con la siguiente estructura. Cada "step" representa una etapa clara y atómica de la solución:

{
  "steps": [
    {
      "stepNumber": 1,
      "description": "Presentamos el problema matemático original que vamos a resolver.",
      "formula": "${extractedMathLatex.replace(/"/g, '\\"')}"
    },
    {
      "stepNumber": 2,
      "description": "Describe de forma concisa la PRIMERA pequeña acción o concepto aplicado. Usa lenguaje simple y directo. Máximo 1-2 oraciones. Para pausas, usa comas. Para énfasis, escribe la palabra con mayúsculas si es muy fuerte, o simplemente el texto normal para un énfasis moderado.",
      "formula": "La expresión LaTeX resultante DESPUÉS de aplicar la descripción de este paso. Si una parte de la fórmula es el foco de la descripción de este paso, enciérrala con \\\\hl{...}"
    },
    {
      "stepNumber": 3,
      "description": "Describe la SIGUIENTE pequeña acción o concepto. Máximo 1-2 oraciones. Para pausas, usa comas. Para énfasis, escribe la palabra con mayúsculas si es muy fuerte, o simplemente el texto normal para un énfasis moderado.",
      "formula": "La expresión LaTeX resultante. Si una parte de la fórmula es el foco de la descripción de este paso, enciérrala con \\\\hl{...}"
      },
      // ... Continúa con tantos pasos atómicos como sean necesarios ...
      {
        "stepNumber": "Final",
        "description": "Concluimos con la respuesta final del problema.",
        "formula": "La expresión LaTeX de la respuesta final, en su forma más simplificada."
      }
    ]
  }


Instrucciones Cruciales para la Generación de Pasos:

Atomicidad: Cada "step" debe realizar una única operación matemática o lógica CLARA (ej. "agrupar términos", "sumar coeficientes", "aplicar propiedad", "simplificar").
NO combines múltiples operaciones en una sola "formula" o "description".
¡MUY IMPORTANTE! Si un término no se opera, combina o transforma de ninguna manera en un paso específico (ej. un término único que simplemente se "mueve" de posición o "se mantiene igual" sin una suma o simplificación real), NO crees un paso dedicado solo a eso. Solo incluye pasos donde haya una transformación o acción matemática explícita. Por ejemplo, si tienes 16a^4 y no hay otro a^4 para sumar, este término simplemente aparecerá en los pasos subsiguientes sin necesidad de un paso que diga "Sumamos los coeficientes de a a la cuarta" o "Obtenemos dieciséis".

Progresión Lógica de "formula": La "formula" de cada paso debe ser el estado completo de la expresión
matemática DESPUÉS de que la "description" de ese mismo paso se haya llevado a cabo. Asegúrate de que la fórmula refleje visualmente la acción descrita en el paso de forma inmediata.
¡ATENCIÓN! Si la descripción es una operación (ej. "sumamos los coeficientes de X"), la fórmula debe mostrar esa operación. El resultado de esa operación debe ir en el siguiente paso.

Ejemplo de secuencia:

Paso A: description: "Sumamos los coeficientes de a al cuadrado." formula: (48 + 2)a^2 + ...

Paso B: description: "Realizamos la suma, obteniendo cincuenta." formula: 50a^2 + ...

LaTeX Válido y Completo: Todas las "formula" deben ser cadenas LaTeX válidas y autocontenidas,
listas para ser renderizadas. Usa "\" para comandos LaTeX (ej. "\frac", "\sqrt").

Descripción en Texto Plano (¡MUY IMPORTANTE!): La "description" DEBE ser una cadena de texto plano. NO incluyas etiquetas SSML como <speak>, <voice>, <sub>, alias, o <say-as interpret-as='characters'> en la descripción. El sistema se encargará de añadir el SSML necesario y seleccionar la voz.
Para la pronunciación de expresiones matemáticas (ej. a 
2
 , x_1, 
sum), escribe directamente la pronunciación deseada en español como texto normal. Para pausas cortas, usa comas (,). Para énfasis, puedes usar palabras clave en MAYÚSCULAS para un énfasis MUY FUERTE (ej. 'Esto es MUY IMPORTANTE'). Para un énfasis moderado, usa palabras como 'claramente', 'definitivamente', o simplemente el texto normal.

Ejemplos de Pronunciación Directa (como texto plano):

Para "a 2": escribe "a al cuadrado"

Para "a 3": escribe "a al cubo"

Para "x_1": escribe "x sub uno"

Para "a 4": escribe "a a la cuarta"

Para "
sum": escribe "sumatoria"

Para la variable simple "a": escribe "a"
Mantén la descripción breve y directa, idealmente no más de 1-2 oraciones.

Resaltado Dinámico: Para cada "step" donde una parte específica de la "formula" es el foco de la "description",
encierra esa parte de la expresión LaTeX con el comando \\hl{...}.
Importante:

Solo usa \\hl{} para la parte que se está operando o explicando en ese paso específico.

Si el paso es el resultado final de una reorganización o simplificación, y no hay una operación específica a resaltar, no uses \\hl{} en la fórmula de ese paso.

Para el paso de "agrupar términos semejantes" o "reordenar" (como en el Paso 1 de tu ejemplo), la fórmula DEBE mostrar la expresión completamente reordenada por potencias de 'a' (de mayor a menor). Además, resalta todos los conjuntos de términos que se están agrupando o que ya han sido agrupados. Por ejemplo, si la descripción es "reordenamos los términos para agruparlos", y la fórmula muestra 16a^4 -62a^3 +48a^2 +2a^2 -18a -6a +5, el resaltado debería ser \hl{16a^4} + \hl{(-62a^3)} + \hl{(48a^2 + 2a^2)} + \hl{(-18a -6a)} + \hl{5}. Asegura que el resaltado corresponda exactamente a la acción de la descripción.

Primer Paso (stepNumber 1): SIEMPRE debe ser el problema original, sin modificaciones y sin \\hl{}. La descripción debe ser texto plano simple. El stepNumber para este primer paso debe ser 1.

Último Paso (stepNumber "Final"): SIEMPRE debe ser la respuesta final, simplificada si es posible y sin \\hl{}. La descripción debe ser texto plano simple.

Validación de JSON: La salida DEBE ser un JSON válido y parseable.

Ejemplo Ilustrativo (para 
frac198+
frac578):

{
  "steps": [
    {
      "stepNumber": 1,
      "description": "El problema a resolver es la suma de dos fracciones.",
      "formula": "\\frac{19}{8} + \\frac{57}{8}"
    },
    {
      "stepNumber": 2,
      "description": "Identificamos que ambas fracciones tienen el mismo denominador.",
      "formula": "\\frac{19}{\\\\hl{8}} + \\frac{57}{\\\\hl{8}}"
    },
    {
      "stepNumber": 3,
      "description": "Por lo tanto, podemos sumar directamente los numeradores y mantener el denominador común.",
      "formula": "\\frac{\\\\hl{19 + 57}}{8}"
    },
    {
      "stepNumber": 4,
      "description": "Realizamos la suma de los numeradores, obteniendo setenta y seis.",
      "formula": "\\frac{\\\\hl{76}}{8}"
    },
    {
      "stepNumber": 5,
      "description": "Ahora, simplificamos la fracción dividiendo el numerador y el denominador por su máximo común divisor, que es cuatro.",
      "formula": "\\frac{\\\\hl{76} \\\\div \\\\hl{4}}{\\\\hl{8} \\\\div \\\\hl{4}}"
    },
    {
      "stepNumber": 6,
      "description": "Realizamos las divisiones para obtener la fracción simplificada.",
      "formula": "\\frac{\\\\hl{19}}{\\\\hl{2}}"
    },
    {
      "stepNumber": "Final",
      "description": "La respuesta final a la operación es diecinueve medios.",
      "formula": "\\frac{19}{2}"
    }
  ]
}

Instrucción Final Crucial:

Genera SOLO UN objeto JSON completo y válido, y detén la generación inmediatamente después de que el JSON esté cerrado.


`;
      const fullPrompt = `${promptBase}\n\n${userPrompt}`;
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // O el modelo que hayas elegido (gpt-4, gpt-3.5-turbo)
        messages: [{ role: 'user', content: fullPrompt }],
        response_format: { type: 'json_object' }, // <--- ¡MUY IMPORTANTE para asegurar salida JSON! (Requiere modelos recientes)
        temperature: 0.2,
        // max_tokens: 1500, // Ajusta según la longitud esperada de la solución
      });

      const jsonResponseString = completion.choices[0].message.content;

      if (!jsonResponseString) {
        throw new Error('OpenAI returned an empty response');
      }

      // Intentar parsear la respuesta JSON
      const solutionObject = JSON.parse(jsonResponseString);
      // Aquí podrías añadir validación de la estructura del solutionObject con class-validator si creas un DTO para ello.
      return solutionObject;
    } catch (error) {
      console.error('Error generating solution with OpenAI:', error);
      throw new Error('Failed to generate step-by-step solution with OpenAI');
    }
  }

  async suggestTagsFromImage(imageBuffer: Buffer): Promise<string[]> {
    try {
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `
                  Analiza la siguiente imagen de un problema matemático.
                  Sugiere de 3 a 5 etiquetas relevantes y concisas (palabras clave o frases cortas) que clasifiquen este problema.
                  Considera los conceptos matemáticos, los temas y los tipos de problemas, incluyendo cualquier figura geométrica.
                  Ejemplos de etiquetas: "Álgebra", "Geometría", "Cálculo", "Ecuaciones", "Trigonometría", "Fracciones", "Derivadas", "Integrales", "Ecuaciones lineales", "Ecuaciones cuadráticas", "Problemas de enunciado", "Triángulos", "Círculos".

                  Tu respuesta DEBE ser un objeto JSON con una clave "tags" que contenga un array de cadenas, como este:
                  { "tags": ["Tag1", "Tag2", "Tag3"] }
                  NO incluyas ningún otro texto ni explicación, solo el objeto JSON.
                `,
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const jsonResponseString = completion.choices[0].message.content;

      if (!jsonResponseString) {
        throw new Error(
          'OpenAI returned an empty response for tag suggestion.',
        );
      }

      const result = JSON.parse(jsonResponseString);
      const tags = result.tags;

      if (
        !Array.isArray(tags) ||
        !tags.every((tag) => typeof tag === 'string')
      ) {
        throw new Error(
          'Invalid JSON format for tags. Expected an array of strings.',
        );
      }

      return tags;
    } catch (error) {
      console.error('Error suggesting tags with OpenAI:', error);
      throw new Error('Failed to suggest tags with OpenAI');
    }
  }

  /**
   * Genera la narración de audio para un texto dado usando la API TTS de OpenAI.
   * @param textToNarrate El texto completo que se convertirá a voz.
   * @param voice El identificador de la voz de OpenAI a usar (ej. 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer').
   * @param model El modelo TTS a usar (ej. 'tts-1', 'tts-1-hd').
   * @param format El formato de salida del audio (ej. 'mp3', 'opus', 'aac', 'flac').
   * @returns Una promesa que resuelve a un objeto con el buffer de audio y la extensión del archivo.
   */

  // async generateAudioNarrationBuffer(
  //   textToNarrate: string,
  //   voice: OpenAiTtsVoice = 'nova', // <--- USA EL TIPO DEFINIDO ARRIBA
  //   model: OpenAiTtsModel = 'tts-1', // <--- USA EL TIPO DEFINIDO ARRIBA
  //   format: OpenAiTtsResponseFormat = 'mp3', // <--- USA EL TIPO DEFINIDO ARRIBA
  // ): Promise<{ audioBuffer: Buffer; fileExtension: string }> {
  //   console.log(
  //     `Generando narración TTS para texto (longitud: ${textToNarrate.length}). Voz: ${voice}, Modelo: ${model}`,
  //   );

  //   if (!textToNarrate || textToNarrate.trim() === '') {
  //     console.warn('Texto para narrar está vacío.');
  //     throw new BadRequestException(
  //       'No se proporcionó texto para la narración.',
  //     );
  //   }

  //   // OpenAI TTS tiene límites de longitud de texto (ej. 4096 caracteres).
  //   // Si tu texto es muy largo, necesitarás dividirlo y concatenar los audios,
  //   // lo cual es más complejo y podría estar fuera del alcance del MVP.
  //   // Por ahora, asumimos que el texto cabe.
  //   const MAX_TTS_LENGTH = 4000; // Límite conservador
  //   if (textToNarrate.length > MAX_TTS_LENGTH) {
  //     console.warn(
  //       `El texto para TTS excede la longitud máxima de ${MAX_TTS_LENGTH} caracteres. Será truncado.`,
  //       '',
  //     );
  //     textToNarrate = textToNarrate.substring(0, MAX_TTS_LENGTH);
  //   }

  //   try {
  //     const speechResponse = await this.openai.audio.speech.create({
  //       model: model,
  //       input: textToNarrate,
  //       voice: voice,
  //       response_format: format,
  //       // speed: 1.0 // Puedes ajustar la velocidad de habla (0.25 a 4.0)
  //     });

  //     // La respuesta de speech.create() es un ReadableStream (Node.js) o un Response (Navegador).
  //     // Necesitamos convertirlo a un Buffer.
  //     const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());

  //     console.log(
  //       `Audio TTS generado exitosamente. Tamaño del buffer: ${audioBuffer.length} bytes.`,
  //     );
  //     return { audioBuffer, fileExtension: format };
  //   } catch (error: any) {
  //     console.error(
  //       `Error al llamar a la API de OpenAI TTS: ${error.message}`,
  //       error.stack,
  //     );
  //     let errorMessage = 'Fallo al generar la narración de audio con IA.';
  //     if (
  //       error.response &&
  //       error.response.data &&
  //       error.response.data.error &&
  //       error.response.data.error.message
  //     ) {
  //       errorMessage = `OpenAI TTS Error: ${error.response.data.error.message}`;
  //     } else if (error.message) {
  //       errorMessage = `OpenAI TTS Error: ${error.message}`;
  //     }
  //     // Determinar el HttpStatus basado en el error de OpenAI si es posible
  //     const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
  //     throw new HttpException(errorMessage, status);
  //   }
  // }
}
