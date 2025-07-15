// src/math-processing/services/simpletex.service.ts
import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto'; // Para MD5
import * as FormDataNode from 'form-data'; // Usa un alias para evitar conflicto con el FormData global del DOM si estuviera presente
import { CustomLoggerService } from '../../common/services/logger.service';
import { Readable } from 'stream';

// Interfaz basada en la documentación de SimpleTex
export interface SimpleTexLatexResponse {
  latex: string;
  conf?: number;
  // Podría haber más campos como 'position', 'text', 'html', etc.
  // dependiendo de los formatos que solicites o si usas otra API de SimpleTex
}

export interface SimpleTexApiResult {
  // Para el caso de latex_ocr y latex_ocr_turbo (single file)
  latex?: string;
  conf?: number;
  // Para otros endpoints o respuestas de error internas de SimpleTex
  // (La documentación a veces no es exhaustiva en todos los campos de 'res')
  [key: string]: any;
}

export interface SimpleTexFullResponse {
  status: boolean; // Si la llamada a la API fue exitosa en sí misma
  res: SimpleTexApiResult | null; // El resultado de la llamada
  request_id: string;
  err_msg?: string; // Mensaje de error de la API de SimpleTex
  // Podría haber un campo 'code' o 'error_code' también
}

@Injectable()
export class SimpleTexService {
  private readonly apiUrl: string; // Ej: https://server.simpletex.net/api/latex_ocr
  private readonly appId: string;
  private readonly appSecret: string; // ¡NO EXPONER ESTO EN EL FRONTEND!

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    // private readonly logger: CustomLoggerService,
  ) {
    // OBTÉN ESTAS URLs DE TUS VARIABLES DE ENTORNO
    this.apiUrl =
      this.configService.get<string>('SIMPLETEX_API_URL') ||
      'https://server.simpletex.net/api/latex_ocr';
    this.appId = this.configService.get<string>('SIMPLETEX_APP_ID') || '';
    this.appSecret =
      this.configService.get<string>('SIMPLETEX_APP_SECRET') || '';

    console.log(
      'this.appId || !this.appSecret || !this.apiUrl',
      this.appId,
      this.appSecret,
      this.apiUrl,
    );
    if (!this.appId || !this.appSecret || !this.apiUrl) {
      const errorMsg =
        'SimpleTex API URL, App ID o App Secret no están configurados.';
      console.error(errorMsg, '', 'SimpleTexService');
      throw new InternalServerErrorException(errorMsg);
    }
  }

  private generateRandomString(length: number): string {
    const chars =
      'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateSignature(
    dataParams: Record<string, any>, // Parámetros del cuerpo que NO son archivos
    headerParams: Record<string, string>, // app-id, random-str, timestamp
    appSecret: string,
  ): string {
    const allParams: Record<string, any> = { ...dataParams, ...headerParams };
    const sortedKeys = Object.keys(allParams).sort();

    let preSignString = sortedKeys
      .map((key) => `${key}=${allParams[key]}`)
      .join('&');

    preSignString += `&secret=${appSecret}`;
    console.debug(
      `SimpleTex Pre-Sign String: ${preSignString}`,
      'SimpleTexService',
    );

    const md5Hash = crypto
      .createHash('md5')
      .update(preSignString, 'utf-8')
      .digest('hex');
    console.debug(
      `SimpleTex Generated MD5 Sign: ${md5Hash}`,
      'SimpleTexService',
    );
    return md5Hash;
  }

  /**
   * Envía una imagen (como buffer) a la API de SimpleTex para OCR matemático.
   * @param imageBuffer Buffer de la imagen.
   * @param originalFilename Nombre del archivo original (para multipart).
   * @returns Promise<SimpleTexFullResponse> La respuesta parseada de la API.
   */
  async extractMathFromImageBuffer(
    imageBuffer: Buffer,
    originalFilename: string = 'image.png',
  ): Promise<SimpleTexFullResponse> {
    if (!this.appId || !this.appSecret) {
      throw new InternalServerErrorException(
        'SimpleTex OCR no está configurado (credenciales).',
      );
    }

    console.log(
      `Enviando imagen (${originalFilename}) a SimpleTex OCR...`,
      'SimpleTexService',
    );

    // Parámetros del cuerpo que NO son archivos (para la firma)
    // Para latex_ocr, la documentación solo menciona 'file' como parámetro del body.
    // Si hubiera otros, como 'mode', irían aquí.
    const dataParams: Record<string, any> = {
      // "rec_mode": "formula", // Ejemplo si fuera necesario y documentado para este endpoint
    };

    // Headers para la firma y autenticación
    const commonHeaderParams = {
      timestamp: Math.floor(Date.now() / 1000).toString(),
      'random-str': this.generateRandomString(16),
      'app-id': this.appId,
    };

    const sign = this.generateSignature(
      dataParams,
      commonHeaderParams,
      this.appSecret,
    );

    const headers = {
      ...commonHeaderParams,
      sign: sign,
      // Content-Type será establecido por FormData/axios
    };

    // Crear FormData para enviar el archivo
    const formData = new FormDataNode();
    // El campo 'file' debe ser un Buffer o un Stream para que axios lo maneje como archivo
    formData.append('file', imageBuffer, { filename: originalFilename });

    // Añadir otros dataParams al formData
    Object.keys(dataParams).forEach((key) => {
      formData.append(key, dataParams[key].toString());
    });

    try {
      console.debug(
        `SimpleTex Request Headers: ${JSON.stringify(headers)}`,
        'SimpleTexService',
      );
      const response = await firstValueFrom(
        this.httpService.post<SimpleTexFullResponse>(this.apiUrl, formData, {
          headers: {
            ...headers,
            ...formData.getHeaders(),
          },
        }),
      );

      console.log(
        `Respuesta de SimpleTex recibida. Request ID: ${response.data?.request_id}, Status: ${response.data?.status}`,
        'SimpleTexService',
      );

      if (!response.data.status) {
        // Si el campo 'status' de la API de SimpleTex es false
        const errorMessage =
          response.data.err_msg ||
          JSON.stringify(response.data.res) ||
          'Error desconocido de SimpleTex API';
        console.error(
          `Error de SimpleTex API (status false): ${errorMessage}`,
          JSON.stringify(response.data),
          'SimpleTexService',
        );
        throw new HttpException(
          `Error de OCR (SimpleTex): ${errorMessage}`,
          HttpStatus.BAD_REQUEST, // O un código más específico si SimpleTex lo provee
        );
      }
      // Manejar respuestas especiales [EMPTY] o [DOCIMG]
      if (
        response.data.res?.latex === '[EMPTY]' ||
        response.data.res?.latex === '[DOCIMG]'
      ) {
        console.warn(
          `SimpleTex devolvió: ${response.data.res.latex} para la imagen.`,
          'SimpleTexService',
        );
        // Podrías lanzar un error específico o devolver un resultado indicando esto
        throw new HttpException(
          `OCR (SimpleTex) devolvió: ${response.data.res.latex}. La imagen podría estar vacía o no ser una fórmula.`,
          HttpStatus.EXPECTATION_FAILED,
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        `Fallo en la solicitud a SimpleTex API: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
        error.stack,
        'SimpleTexService',
      );
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Fallo en la comunicación con el servicio de OCR (SimpleTex).`,
      );
    }
  }
}
