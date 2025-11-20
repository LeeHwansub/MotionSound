import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VideoService, MediaUploadResult } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadVideo(@UploadedFile() file: unknown): Promise<MediaUploadResult> {
    if (!file) {
      throw new Error('파일이 업로드되지 않았습니다.');
    }
    console.log('영상 업로드 요청:', {
      originalname: (file as any).originalname,
      mimetype: (file as any).mimetype,
      size: (file as any).size,
    });
    return this.videoService.uploadVideo(file as any);
  }
}

@Controller('audios')
export class AudioController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadAudio(@UploadedFile() file: unknown): Promise<MediaUploadResult> {
    if (!file) {
      throw new Error('파일이 업로드되지 않았습니다.');
    }
    console.log('오디오 업로드 요청:', {
      originalname: (file as any).originalname,
      mimetype: (file as any).mimetype,
      size: (file as any).size,
    });
    return this.videoService.uploadAudio(file as any);
  }
}

