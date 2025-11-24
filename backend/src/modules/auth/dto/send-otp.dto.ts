import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^[0-9]{10,11}$/, {
    message: '핸드폰 번호는 10-11자리 숫자여야 합니다.',
  })
  phoneNumber: string;
}

