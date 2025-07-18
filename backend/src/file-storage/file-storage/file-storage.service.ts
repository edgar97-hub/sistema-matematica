import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fileTypeFromBuffer } from 'file-type';
import * as fs from 'fs'; // Importa el módulo 'fs' de Node.js
import { join, parse } from 'path'; // Importa 'join' y 'parse' de 'path'
import { promisify } from 'util'; // Para convertir fs.readFile en promesa

const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat); // Para verificar si el archivo existe

@Injectable()
export class FileStorageService {
  private readonly uploadsBaseDir: string;

  constructor(private readonly configService: ConfigService) {
    // Define un directorio base para las subidas, relativo a la raíz del proyecto
    // process.cwd() da la raíz del proyecto donde se ejecuta Node.js
    this.uploadsBaseDir = join(process.cwd(), 'uploads'); // Carpeta 'uploads' en la raíz
    console.log(
      `Uploads base directory: ${this.uploadsBaseDir}`,
      'FileStorageService',
    );
  }

  // Tu método de subida existente (adaptado para guardar localmente)
  async uploadFile(
    file: Express.Multer.File,
    pathPrefix: string,
  ): Promise<{
    url: string;
    filePath: string;
    originalName: string;
    size: number;
  }> {
    const originalName = file.originalname;
    const extension = await fileTypeFromBuffer(file.buffer);
    // const extension = parse(originalName).ext; // Obtiene .jpg, .png
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}.${extension?.ext}`;

    const directoryPath = join(this.uploadsBaseDir, pathPrefix);
    const filePath = join(directoryPath, filename); // Ruta absoluta para guardar
    const relativeUrlPath = `${pathPrefix}/${filename}`; // Ruta para la URL (sin 'uploads' al inicio si el prefijo estático lo maneja)

    try {
      // Asegurar que el directorio exista
      await fs.promises.mkdir(directoryPath, { recursive: true });
      await fs.promises.writeFile(filePath, file.buffer);

      console.log(
        `Archivo guardado localmente: ${filePath}`,
        'FileStorageService',
      );
      return {
        url: relativeUrlPath,
        filePath: filePath,
        originalName,
        size: file.size,
      };
    } catch (error) {
      console.error(
        `Error al guardar archivo localmente ${filePath}: ${error.message}`,
        error.stack,
        'FileStorageService',
      );
      throw new InternalServerErrorException('No se pudo guardar el archivo.');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    pathPrefix: string, // ej: 'orders/audio/userId'
    filenameWithExtension: string, // ej: 'order_123_narration.mp3'
  ): Promise<{ url: string; filePath: string; size: number }> {
    const directoryPath = join(this.uploadsBaseDir, pathPrefix);
    const filePath = join(directoryPath, filenameWithExtension); // Ruta absoluta para guardar
    // La URL relativa se construye quitando 'uploads' si el prefijo estático ya lo incluye.
    const relativeUrlPath = `${pathPrefix}/${filenameWithExtension}`;

    try {
      await fs.promises.mkdir(directoryPath, { recursive: true });
      await fs.promises.writeFile(filePath, buffer);

      console.log(
        `Buffer guardado localmente: ${filePath}`,
        'FileStorageService_UploadBuffer',
      );
      return {
        url: relativeUrlPath, // Esta es la que se guarda en OrderEntity
        filePath: filePath, // Ruta absoluta en el servidor (para FFmpeg después)
        size: buffer.length,
      };
    } catch (error) {
      console.error(
        `Error al guardar buffer localmente ${filePath}: ${error.message}`,
        error.stack,
        'FileStorageService_UploadBuffer',
      );
      throw new InternalServerErrorException(
        'No se pudo guardar el archivo de audio generado.',
      );
    }
  }

  async readFileToBuffer(relativePathFromUploads: string): Promise<Buffer> {
    const absolutePath = join(this.uploadsBaseDir, relativePathFromUploads);
    console.log(
      `Intentando leer archivo para buffer: ${absolutePath}`,
      'FileStorageService',
    );

    try {
      await statAsync(absolutePath);
      const buffer = await readFileAsync(absolutePath);
      return buffer;
    } catch (error) {
      console.error(
        `Error al leer archivo local ${absolutePath}: ${error.message}`,
        error.stack,
        'FileStorageService',
      );
      if (error.code === 'ENOENT') {
        throw new NotFoundException(
          `Archivo no encontrado en la ruta: ${relativePathFromUploads}`,
        );
      }
      throw new InternalServerErrorException(
        'No se pudo leer el archivo de imagen para OCR.',
      );
    }
  }

  async deleteFile(relativePathFromUploads: string): Promise<void> {
    if (!relativePathFromUploads) {
      console.warn(
        'Attempted to delete a file with an empty path.',
        'FileStorageService',
      );
      return;
    }
    const absolutePath = join(this.uploadsBaseDir, relativePathFromUploads);
    try {
      await fs.promises.stat(absolutePath); // Check if file exists
      await fs.promises.unlink(absolutePath);
      console.log(`Archivo eliminado: ${absolutePath}`, 'FileStorageService');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, which is fine. We wanted it gone anyway.
        console.warn(
          `Intento de eliminar un archivo que no existe: ${absolutePath}`,
          'FileStorageService',
        );
      } else {
        console.error(
          `Error al eliminar el archivo ${absolutePath}: ${error.message}`,
          'FileStorageService',
        );
        throw new InternalServerErrorException(
          'No se pudo eliminar el archivo anterior.',
        );
      }
    }
  }
}
