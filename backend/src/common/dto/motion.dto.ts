import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MotionLandmarkDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsOptional()
  @IsNumber()
  z?: number;

  @IsOptional()
  @IsNumber()
  visibility?: number;
}

export class MotionDataDto {
  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotionLandmarkDto)
  poseLandmarks?: MotionLandmarkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotionLandmarkDto)
  leftHandLandmarks?: MotionLandmarkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotionLandmarkDto)
  rightHandLandmarks?: MotionLandmarkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotionLandmarkDto)
  faceLandmarks?: MotionLandmarkDto[];
}

export class NoteDto {
  @IsString()
  name: string;

  @IsNumber()
  octave: number;

  @IsNumber()
  frequency: number;
}

export class SoundEventDto {
  @IsNumber()
  timestamp: number;

  @IsNumber()
  frequency: number;

  @IsNumber()
  volume: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NoteDto)
  note?: NoteDto;
}

export class PatternReferenceDto {
  @IsMongoId()
  patternId: string;
}

