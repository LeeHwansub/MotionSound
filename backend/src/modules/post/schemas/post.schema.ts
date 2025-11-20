import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  author: string;

  @Prop()
  performanceId?: string;

  @Prop()
  motionPatternId?: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  videoUrl?: string;

  @Prop()
  videoKey?: string;

  @Prop()
  videoSize?: number;

  @Prop()
  videoDurationMs?: number;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

