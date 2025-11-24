import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PhoneOtpDocument = HydratedDocument<PhoneOtp>;

@Schema({ timestamps: true })
export class PhoneOtp {
  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  userId?: string;
}

export const PhoneOtpSchema = SchemaFactory.createForClass(PhoneOtp);

PhoneOtpSchema.index({ phoneNumber: 1, verified: 1 });
PhoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

