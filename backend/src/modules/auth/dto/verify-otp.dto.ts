import { IsString, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[0-9]{10,11}$/, {
    message: '핸드폰 번호는 10-11자리 숫자여야 합니다.',
  })
  phoneNumber: string;

  @IsString()
  @Length(6, 6, {
    message: '인증번호는 6자리 숫자여야 합니다.',
  })
  otp: string;
}

