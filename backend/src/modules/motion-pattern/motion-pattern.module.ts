import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MotionPatternService } from './motion-pattern.service';
import { MotionPatternController } from './motion-pattern.controller';
import {
  MotionPattern,
  MotionPatternSchema,
} from './schemas/motion-pattern.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MotionPattern.name, schema: MotionPatternSchema },
    ]),
  ],
  controllers: [MotionPatternController],
  providers: [MotionPatternService],
  exports: [MotionPatternService],
})
export class MotionPatternModule {}

