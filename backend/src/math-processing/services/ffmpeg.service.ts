import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import { join } from 'path';
// import { CustomLoggerService } from '../../common/services/logger.service';

@Injectable()
export class FFmpegService {
  //   constructor(private readonly logger: CustomLoggerService) {}

  async concatenateAndCombine(
    videoPaths: string[],
    audioPaths: string[],
    orderId: string,
  ): Promise<{ finalVideoLocalPath: string; finalVideoPublicUrl: string }> {
    return new Promise(async (resolve, reject) => {
      // 1. Crear directorio temporal para los archivos de lista
      const tempDir = join(process.cwd(), 'temp', orderId);
      await fs.ensureDir(tempDir);

      const videoListPath = join(tempDir, 'videos.txt');
      const audioListPath = join(tempDir, 'audios.txt');

      // FFmpeg necesita rutas relativas o absolutas seguras.
      // Escapar caracteres especiales en las rutas para el contenido del archivo de texto.
      const videoListContent = videoPaths
        .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
        .join('\n');
      const audioListContent = audioPaths
        .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
        .join('\n');

      await fs.writeFile(videoListPath, videoListContent);
      await fs.writeFile(audioListPath, audioListContent);

      // 2. Definir la ruta de salida
      const outputDir = join(process.cwd(), 'uploads', 'final_videos');
      await fs.ensureDir(outputDir);
      const outputFileName = `order_${orderId}_final.mp4`;
      const outputFilePath = join(outputDir, outputFileName);
      const publicUrl = `/final_videos/${outputFileName}`;

      // 3. Ejecutar FFmpeg
      const ffmpegArgs = [
        '-y', // Sobrescribir el archivo de salida si existe
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        videoListPath, // Concatena los videos
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        audioListPath, // Concatena los audios
        '-c:v',
        'copy', // Copia el stream de video sin recodificar
        '-c:a',
        'aac', // Codifica el audio a AAC
        '-shortest', // El video final tendrá la duración del input más corto
        outputFilePath,
      ];

      console.log(`Ejecutando FFmpeg para orden ${orderId}`, 'FFmpegService');
      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      let stderr = '';
      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpegProcess.on('close', async (code) => {
        // Limpiar los archivos de lista después de la ejecución
        await fs.remove(tempDir);

        if (code === 0) {
          console.log(
            `FFmpeg ensambló exitosamente: ${outputFilePath}`,
            'FFmpegService',
          );
          resolve({
            finalVideoLocalPath: outputFilePath,
            finalVideoPublicUrl: publicUrl,
          });
        } else {
          console.error(
            `FFmpeg falló con código ${code}`,
            stderr,
            'FFmpegService',
          );
          reject(
            new Error(
              `FFmpeg falló con código de salida ${code}. Stderr: ${stderr}`,
            ),
          );
        }
      });

      ffmpegProcess.on('error', (err) => {
        console.error(
          'Error al iniciar el proceso FFmpeg',
          err.stack,
          'FFmpegService',
        );
        reject(err);
      });
    });
  }
}
