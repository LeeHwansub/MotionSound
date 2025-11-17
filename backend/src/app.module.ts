import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MotionPatternModule } from './modules/motion-pattern/motion-pattern.module';
import { PerformanceModule } from './modules/performance/performance.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

