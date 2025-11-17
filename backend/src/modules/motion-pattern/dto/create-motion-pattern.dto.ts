import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MotionDataDto, NoteDto } from '../../../common/dto/motion.dto';

export class CreateMotionPatternDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotionDataDto)
  samples: MotionDataDto[];

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NoteDto)
  baseNote?: NoteDto;
}

