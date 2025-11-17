import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  MotionDataEntity,
  MotionDataSchema,
  NoteEntity,
  NoteSchema,
} from '../../../common/schemas/motion.schema';

export type MotionPatternDocument = HydratedDocument<MotionPattern>;

@Schema({ timestamps: true })
export class MotionPattern {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [MotionDataSchema], default: [] })
  samples: MotionDataEntity[];

  @Prop()
  audioUrl?: string;

  @Prop({ type: NoteSchema })
  baseNote?: NoteEntity;

  @Prop()
  userId?: string;
}

export const MotionPatternSchema =
  SchemaFactory.createForClass(MotionPattern);

