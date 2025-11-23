import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MotionPatternModule } from './modules/motion-pattern/motion-pattern.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { PostModule } from './modules/post/post.module';
import { VideoModule } from './modules/video/video.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          `mongodb://localhost:27017/${
            configService.get<string>('MONGODB_DATABASE') || 'motionsound'
          }`,
      }),
    }),
    MotionPatternModule,
    PerformanceModule,
    PostModule,
    VideoModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

