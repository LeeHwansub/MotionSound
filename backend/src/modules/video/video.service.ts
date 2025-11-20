import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export interface MediaUploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

interface UploadedMediaFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export type MediaFolder = 'videos' | 'audios';

@Injectable()
export class VideoService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const endpointBase = `https://${accountId}.r2.cloudflarestorage.com`;
    this.publicBaseUrl = this.resolvePublicBaseUrl(
      this.configService.get<string>('R2_PUBLIC_URL'),
      endpointBase,
      this.bucketName,
    );

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new Error('R2 환경 변수가 누락되었습니다.');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpointBase,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadMedia(
    file: UploadedMediaFile,
    folder: MediaFolder,
  ): Promise<MediaUploadResult> {
    if (!file) {
      throw new InternalServerErrorException('업로드할 파일이 없습니다.');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new InternalServerErrorException('파일 버퍼가 비어있습니다.');
    }

    const extension = file.originalname.split('.').pop() || this.getDefaultExtension(folder);
    const dateFolder = new Date().toISOString().split('T')[0];
    const key = `${folder}/${dateFolder}/${randomUUID()}.${extension}`;

    console.log(`[${folder}] 업로드 시작:`, {
      key,
      size: file.size,
      contentType: file.mimetype,
      bucket: this.bucketName,
      endpoint: `https://${this.configService.get<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    });

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const url = this.publicBaseUrl
        ? `${this.publicBaseUrl}/${key}`
        : key;

      console.log(`[${folder}] 업로드 성공:`, { url, key });

      return {
        url,
        key,
        size: file.size,
        contentType: file.mimetype,
      };
    } catch (error) {
      console.error(`[${folder}] 업로드 에러:`, error);
      if (error instanceof Error) {
        console.error('에러 상세:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw new InternalServerErrorException(
        `${folder === 'videos' ? '영상' : '오디오'} 업로드에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async uploadVideo(file: UploadedMediaFile): Promise<MediaUploadResult> {
    return this.uploadMedia(file, 'videos');
  }

  async uploadAudio(file: UploadedMediaFile): Promise<MediaUploadResult> {
    return this.uploadMedia(file, 'audios');
  }

  private resolvePublicBaseUrl(
    rawUrl: string | undefined,
    endpointBase: string,
    bucketName: string,
  ): string {
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME 이 설정되지 않았습니다.');
    }

    const trimmedEndpoint = endpointBase.replace(/\/$/, '');

    if (!rawUrl || rawUrl.trim().length === 0) {
      return `${trimmedEndpoint}/${bucketName}`;
    }

    const cleaned = rawUrl.trim().replace(/\/$/, '');

    if (cleaned.includes('{bucket}')) {
      return cleaned.replace('{bucket}', bucketName);
    }

    if (cleaned.endsWith(`/${bucketName}`) || cleaned.includes(`/${bucketName}/`)) {
      return cleaned;
    }

    if (!cleaned.includes('.cloudflarestorage.com')) {
      return cleaned;
    }

    return `${cleaned}/${bucketName}`;
  }

  private getDefaultExtension(folder: MediaFolder): string {
    return folder === 'videos' ? 'webm' : 'mp3';
  }
}

