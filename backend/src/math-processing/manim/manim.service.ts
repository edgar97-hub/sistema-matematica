import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { FileStorageService } from 'src/file-storage/file-storage/file-storage.service';
import { join, parse, relative } from 'path';

// Interfaz para el payload que se envía al microservicio
interface FullVoiceoverPayload {
  orderId: string;
  solutionJson: object;
}

// Interfaz para la respuesta esperada del microservicio
interface ManimMicroserviceResponse {
  status: 'success' | 'error';
  video_path?: string; // Ruta absoluta AL INTERIOR del contenedor Manim
  message?: string;
  stderr?: string;
}

@Injectable()
export class ManimService {
  private readonly manimServiceUrl: string;
  private readonly openaiApiKey: string;
  private readonly azureSpeechKey: string;
  private readonly azureSpeechRegion: string;

  private readonly logger = new Logger(ManimService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
  ) {
    this.manimServiceUrl =
      this.configService.get<string>('MANIM_MICROSERVICE_URL') ||
      'http://localhost:3002';

    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.azureSpeechKey =
      this.configService.get<string>('AZURE_SPEECH_KEY') || '';
    this.azureSpeechRegion =
      this.configService.get<string>('AZURE_SPEECH_REGION') || '';
  }

  // // Añadir un nuevo método para renderizar segmentos
  // async renderSegment(payload: {
  //   segmentId: string;
  //   description: string;
  //   formula: string;
  //   duration: number;
  // }): Promise<{ localPath?: string; error?: string }> {
  //   try {
  //     const renderResponse = await firstValueFrom(
  //       this.httpService.post(
  //         `${this.manimServiceUrl}/render-segment`,
  //         payload,
  //       ),
  //     );

  //     const renderResult = renderResponse.data;
  //     if (renderResult.status !== 'success' || !renderResult.video_path) {
  //       throw new Error(
  //         renderResult.message ||
  //           'El microservicio Manim devolvió un error durante el renderizado.',
  //       );
  //     }

  //     const pathInContainer = renderResult.video_path; // ej: /app/manim_processing/test_render_001/videos/scene/480p15/segment.mp4
  //     const relativePath = relative('/app/manim_processing', pathInContainer); // Obtiene la ruta relativa: test_render_001/.../segment.mp4

  //     const pathParts = pathInContainer.split('/');
  //     const filename = pathParts.pop();
  //     // const segmentId = pathParts.pop();

  //     const downloadUrl = `${this.manimServiceUrl}/videos/${relativePath}`;
  //     console.log(
  //       `Descargando video de animación desde: ${downloadUrl}`,
  //       'ManimService',
  //     );

  //     const videoResponse = await firstValueFrom(
  //       this.httpService.get(downloadUrl, { responseType: 'arraybuffer' }),
  //     );

  //     const videoBuffer = Buffer.from(videoResponse.data);

  //     // 3. Guardar el buffer descargado en el sistema de archivos de NestJS
  //     const saveResult = await this.fileStorageService.uploadBuffer(
  //       videoBuffer,
  //       `temp/${payload.segmentId}`, // Guardar en una carpeta temporal en el servidor NestJS
  //       filename,
  //     );

  //     console.log(
  //       `Video de animación guardado localmente en: ${saveResult.filePath}`,
  //       'ManimService',
  //     );
  //     return { localPath: saveResult.filePath }; // Devolver la ruta LOCAL en el servidor NestJS
  //   } catch (error) {
  //     return { error: error.message };
  //   }
  // }

  /**
   * Solicita la renderización de un video completo con audio sincronizado
   * al microservicio de Manim.
   * @param payload Objeto con orderId y el solutionJson completo.
   * @returns Un objeto con la ruta local al video final descargado o un error.
   */
  async renderFullVoiceoverVideo(
    payload: FullVoiceoverPayload,
  ): Promise<{ localPath?: string; error?: string }> {
    const loggerContext = 'ManimService_RenderFull';
    this.logger.log(
      `Solicitando video completo para orden ${payload.orderId}`,
      loggerContext,
    );

    // El endpoint en el microservicio Flask/Python
    const renderEndpoint = `${this.manimServiceUrl}/render-full-video`;

    try {
      // 1. LLAMAR AL MICROSERVICIO PARA QUE GENERE EL VIDEO FINAL
      const response = await firstValueFrom(
        this.httpService.post<ManimMicroserviceResponse>(
          renderEndpoint,
          {
            ...payload,
            openaiApiKey: this.openaiApiKey,
            azureSpeechKey: this.azureSpeechKey,
            azureSpeechRegion: this.azureSpeechRegion,
          },
          {
            timeout: 600000, // Timeout de 10 minutos, ya que el renderizado puede ser largo
          },
        ),
      );

      const renderResult = response.data;

      if (renderResult.status !== 'success' || !renderResult.video_path) {
        const errorMessage =
          renderResult.message || `El microservicio Manim devolvió un error.`;
        this.logger.error(errorMessage, renderResult.stderr, loggerContext);
        throw new Error(errorMessage);
      }

      const pathInContainer = renderResult.video_path; // Ejemplo: "/app/manim_processing/17/videos/full_scene/480p15/order_17_final_with_audio.mp4"
      this.logger.log(
        `Microservicio generó el video en (ruta del contenedor): ${pathInContainer}`,
        loggerContext,
      );

      // Extraer la parte de la ruta que va después de /app/manim_processing/
      // Esta es la 'filepath' que el endpoint /videos de Flask espera.
      const processingDirPrefix = '/app/manim_processing/';
      if (!pathInContainer.startsWith(processingDirPrefix)) {
        // Esto es una validación de seguridad si la ruta es inesperada
        throw new Error('Ruta de video inesperada del microservicio Manim.');
      }
      const relativePathForDownload = pathInContainer.substring(
        processingDirPrefix.length,
      );
      // Ejemplo de relativePathForDownload: "17/videos/full_scene/480p15/order_17_final_with_audio.mp4"

      // Construir la URL de descarga completa
      const downloadUrl = `${this.manimServiceUrl}/videos/${relativePathForDownload}`;
      this.logger.log(
        `Descargando video final desde: ${downloadUrl}`,
        loggerContext,
      );

      const videoResponse = await firstValueFrom(
        this.httpService.get(downloadUrl, { responseType: 'arraybuffer' }),
      );

      const videoBuffer = Buffer.from(videoResponse.data);

      // 3. GUARDAR EL VIDEO FINAL EN LA UBICACIÓN DE NESTJS
      const finalFileName = `order_${payload.orderId}_final.mp4`;
      const saveResult = await this.fileStorageService.uploadBuffer(
        videoBuffer,
        'final_videos', // Guardar en la carpeta de videos finales
        finalFileName,
      );

      this.logger.log(
        `Video final guardado localmente en: ${saveResult.filePath}`,
        loggerContext,
      );

      // Devolver la ruta LOCAL en el servidor NestJS y la URL pública
      return { localPath: saveResult.filePath };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      this.logger.error(
        `Error en la comunicación con el microservicio Manim: ${errorMessage}`,
        error.stack,
        loggerContext,
      );
      return { error: `Fallo en el microservicio Manim: ${errorMessage}` };
    }
  }
}
