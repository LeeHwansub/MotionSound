import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class MotionLandmarkEntity {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop()
  z?: number;

  @Prop()
  visibility?: number;
}

export const MotionLandmarkSchema =
  SchemaFactory.createForClass(MotionLandmarkEntity);

@Schema({ _id: false })
export class MotionDataEntity {
  @Prop({ required: true })
  timestamp: number;

  @Prop({ type: [MotionLandmarkSchema], default: [] })
  poseLandmarks: MotionLandmarkEntity[];

  @Prop({ type: [MotionLandmarkSchema], default: [] })
  leftHandLandmarks: MotionLandmarkEntity[];

  @Prop({ type: [MotionLandmarkSchema], default: [] })
  rightHandLandmarks: MotionLandmarkEntity[];

  @Prop({ type: [MotionLandmarkSchema], default: [] })
  faceLandmarks: MotionLandmarkEntity[];
}

export type MotionDataDocument = HydratedDocument<MotionDataEntity>;
export const MotionDataSchema = SchemaFactory.createForClass(MotionDataEntity);

@Schema({ _id: false })
export class NoteEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  octave: number;

  @Prop({ required: true })
  frequency: number;
}

export const NoteSchema = SchemaFactory.createForClass(NoteEntity);

@Schema({ _id: false })
export class SoundEventEntity {
  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  frequency: number;

  @Prop({ required: true })
  volume: number;

  @Prop({ type: NoteSchema })
  note?: NoteEntity;
}

export const SoundEventSchema = SchemaFactory.createForClass(SoundEventEntity);

