import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  MotionDataDto,
  NoteDto,
  SoundEventDto,
} from '../../../common/dto/motion.dto';

export class CreatePerformanceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsMongoId()
  patternId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotionDataDto)
  motionFrames?: MotionDataDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SoundEventDto)
  soundEvents?: SoundEventDto[];

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NoteDto)
  baseNote?: NoteDto;

  @IsOptional()
  @IsNumber()
  durationMs?: number;
}

