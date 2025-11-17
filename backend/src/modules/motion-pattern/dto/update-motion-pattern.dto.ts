import { PartialType } from '@nestjs/mapped-types';
import { CreateMotionPatternDto } from './create-motion-pattern.dto';

export class UpdateMotionPatternDto extends PartialType(
  CreateMotionPatternDto,
) {}

