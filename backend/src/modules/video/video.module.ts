import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video.service';
import { VideoController, AudioController, MediaController } from './video.controller';

@Module({
  imports: [ConfigModule],
  controllers: [VideoController, AudioController, MediaController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}