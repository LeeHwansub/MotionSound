import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PhoneOtp, PhoneOtpDocument } from '../schemas/phone-otp.schema';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(PhoneOtp.name)
    private readonly otpModel: Model<PhoneOtpDocument>,
    private readonly smsService: SmsService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(phoneNumber: string, userId?: string): Promise<string> {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.otpModel.create({
      phoneNumber,
      otp,
      expiresAt,
      verified: false,
      userId,
    });

    await this.smsService.sendOtp(phoneNumber, otp);

    return otp;
  }

  async verifyOtp(phoneNumber: string, otp: string, userId?: string): Promise<boolean> {
    const query: any = {
      phoneNumber,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() },
    };

    if (userId) {
      query.userId = userId;
    }

    const otpRecord = await this.otpModel.findOne(query).sort({ createdAt: -1 }).exec();

    if (!otpRecord) {
      return false;
    }

    if (userId && otpRecord.userId && otpRecord.userId !== userId) {
      return false;
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return true;
  }

  async isPhoneNumberVerified(phoneNumber: string, userId?: string): Promise<boolean> {
    const query: any = {
      phoneNumber,
      verified: true,
    };

    if (userId) {
      query.userId = userId;
    }

    const verifiedOtp = await this.otpModel.findOne(query).sort({ createdAt: -1 }).exec();

    return !!verifiedOtp;
  }
}

