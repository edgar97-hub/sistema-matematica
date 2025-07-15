import { Injectable } from '@nestjs/common';
// import * as mm from 'music-metadata';

@Injectable()
export class AudioService {
  async getAudioDuration(audioBuffer: Buffer): Promise<number> {
    try {
      // const metadata = await mm.parseBuffer(audioBuffer, 'audio/mpeg');
      // return metadata.format.duration || 0;
      return 1;
    } catch (error) {
      console.error('Error al obtener la duración del audio:', error);
      return 0;
    }
  }
}
