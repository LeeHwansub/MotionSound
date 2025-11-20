import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video.service';
import { VideoController, AudioController } from './video.controller';

@Module({
  imports: [ConfigModule],
  controllers: [VideoController, AudioController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}