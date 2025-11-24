import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class SmsService {
  private readonly snsClient: SNSClient;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION') || 'ap-northeast-2';

    this.isEnabled = !!(accessKeyId && secretAccessKey);

    if (this.isEnabled) {
      this.snsClient = new SNSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      console.warn('AWS SNS credentials not found. SMS service will be disabled.');
    }
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[SMS Mock] OTP for ${phoneNumber}: ${otp}`);
      return;
    }

    const message = `[Motion Sound] 인증번호는 ${otp}입니다. 5분간 유효합니다.`;

    let formattedPhoneNumber: string;
    
    if (phoneNumber.startsWith('+82')) {
      formattedPhoneNumber = phoneNumber;
    } else {
      const cleaned = phoneNumber.replace(/[^0-9]/g, '');
      if (cleaned.startsWith('010') || cleaned.startsWith('011') || cleaned.startsWith('016') || 
          cleaned.startsWith('017') || cleaned.startsWith('018') || cleaned.startsWith('019')) {
        formattedPhoneNumber = `+82${cleaned.substring(1)}`;
      } else if (cleaned.startsWith('0')) {
        formattedPhoneNumber = `+82${cleaned.substring(1)}`;
      } else if (cleaned.startsWith('82')) {
        formattedPhoneNumber = `+${cleaned}`;
      } else {
        formattedPhoneNumber = `+82${cleaned}`;
      }
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: formattedPhoneNumber,
        Message: message,
      });

      console.log(`[SMS] 전송 시도: ${formattedPhoneNumber}`);
      await this.snsClient.send(command);
      console.log(`[SMS] 전송 성공: ${phoneNumber}`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.Message || '알 수 없는 오류';
      const errorName = error?.name || error?.Name || '';
      
      const isUnsupportedNumber = 
        errorMessage.includes('not valid to publish to') || 
        errorMessage.includes('Invalid parameter: PhoneNumber') ||
        errorMessage.includes('No origination identity available') ||
        errorName === 'InvalidParameterException';
      
      if (isUnsupportedNumber) {
        console.warn(`[SMS] AWS SNS가 한국 전화번호를 지원하지 않거나 발신자 ID가 설정되지 않았습니다. 개발 모드로 전환합니다.`);
        console.log(`[SMS Mock] OTP for ${phoneNumber}: ${otp}`);
        return;
      }
      
      console.error('[SMS] 전송 실패:', {
        phoneNumber,
        formattedPhoneNumber,
        errorMessage: error?.message || error?.Message,
        errorCode: error?.Code || error?.code,
        errorName: error?.name || error?.Name,
      });
      
      throw new InternalServerErrorException(
        `SMS 전송에 실패했습니다: ${errorMessage}`,
      );
    }
  }
}

