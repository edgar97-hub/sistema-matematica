import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OpenaiService } from './openai/openai.service';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { SimpleTexService } from './services/simpletex.service';
import { AudioService } from './services/audio.service';
import { FFmpegService } from './services/ffmpeg.service';

@Module({
  imports: [HttpModule, ConfigModule, FileStorageModule],
  providers: [SimpleTexService, OpenaiService, AudioService, FFmpegService],
  exports: [SimpleTexService, OpenaiService, AudioService, FFmpegService],
})
export class MathProcessingModule {}
