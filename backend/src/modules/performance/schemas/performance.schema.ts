import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  MotionDataEntity,
  MotionDataSchema,
  NoteEntity,
  NoteSchema,
  SoundEventEntity,
  SoundEventSchema,
} from '../../../common/schemas/motion.schema';

export type PerformanceDocument = HydratedDocument<Performance>;

@Schema({ timestamps: true })
export class Performance {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'MotionPattern' })
  patternId?: Types.ObjectId;

  @Prop({ type: [MotionDataSchema], default: [] })
  motionFrames: MotionDataEntity[];

  @Prop({ type: [SoundEventSchema], default: [] })
  soundEvents: SoundEventEntity[];

  @Prop()
  audioUrl?: string;

  @Prop({ type: NoteSchema })
  baseNote?: NoteEntity;

  @Prop()
  durationMs?: number;

  @Prop()
  userId?: string;
}

export const PerformanceSchema = SchemaFactory.createForClass(Performance);

