import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { VideoService } from '../video/video.service';
import { OtpService } from './services/otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly videoService: VideoService,
    private readonly otpService: OtpService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateJwtToken(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Public()
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth() {
  }

  @Public()
  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;
      if (!user) {
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }
      const token = await this.authService.generateJwtToken(user);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Kakao callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}?error=auth_failed`);
    }
  }

  @Public()
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  async naverAuth() {
  }

  @Public()
  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;
      if (!user) {
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }
      const token = await this.authService.generateJwtToken(user);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Naver callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}?error=auth_failed`);
    }
  }

  @Post('me/profile-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
      },
    }),
  )
  async uploadProfileImage(
    @CurrentUser() user: UserDocument,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new Error('파일이 업로드되지 않았습니다.');
    }

    const result = await this.videoService.uploadProfileImage(file);
    
    const updatedUser = await this.authService.updateUser(
      user._id.toString(),
      { profileImage: result.url },
    );

    if (!updatedUser) {
      throw new Error('프로필 사진을 업데이트할 수 없습니다.');
    }

    const userObj = updatedUser.toObject();
    return {
      _id: userObj._id.toString(),
      email: userObj.email,
      name: userObj.name,
      provider: userObj.provider,
      providerId: userObj.providerId,
      isActive: userObj.isActive,
      profileImage: userObj.profileImage,
      phoneNumber: userObj.phoneNumber,
      gender: userObj.gender,
      birthDate: userObj.birthDate,
      createdAt: (userObj as any).createdAt,
      updatedAt: (userObj as any).updatedAt,
    };
  }

  @Get('me')
  async getProfile(@CurrentUser() user: UserDocument) {
    const userObj = user.toObject();
    return {
      _id: userObj._id.toString(),
      email: userObj.email,
      name: userObj.name,
      provider: userObj.provider,
      providerId: userObj.providerId,
      isActive: userObj.isActive,
      profileImage: userObj.profileImage,
      phoneNumber: userObj.phoneNumber,
      gender: userObj.gender,
      birthDate: userObj.birthDate,
      createdAt: (userObj as any).createdAt,
      updatedAt: (userObj as any).updatedAt,
    };
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.birthDate) {
      updateData.birthDate = new Date(updateUserDto.birthDate);
    }

    if (updateUserDto.phoneNumber && updateUserDto.phoneNumber !== user.phoneNumber) {
      const isVerified = await this.otpService.isPhoneNumberVerified(
        updateUserDto.phoneNumber,
        user._id.toString(),
      );
      if (!isVerified) {
        throw new Error('인증되지 않은 전화번호로는 변경할 수 없습니다. 먼저 SMS 인증을 완료해주세요.');
      }

      const existingUser = await this.authService.findUserByPhoneNumber(updateUserDto.phoneNumber);
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        throw new Error('이미 다른 사용자에게 등록된 전화번호입니다.');
      }
    } else if (updateUserDto.phoneNumber === undefined || updateUserDto.phoneNumber === '') {
      updateData.phoneNumber = user.phoneNumber;
    }

    const updatedUser = await this.authService.updateUser(
      user._id.toString(),
      updateData,
    );

    if (!updatedUser) {
      throw new Error('사용자 정보를 업데이트할 수 없습니다.');
    }

    const userObj = updatedUser.toObject();
    return {
      _id: userObj._id.toString(),
      email: userObj.email,
      name: userObj.name,
      provider: userObj.provider,
      providerId: userObj.providerId,
      isActive: userObj.isActive,
      profileImage: userObj.profileImage,
      phoneNumber: userObj.phoneNumber,
      gender: userObj.gender,
      birthDate: userObj.birthDate,
      createdAt: (userObj as any).createdAt,
      updatedAt: (userObj as any).updatedAt,
    };
  }

  @Post('phone/send-otp')
  async sendOtp(
    @Body() sendOtpDto: SendOtpDto,
    @CurrentUser() user: UserDocument,
  ) {
    try {
      await this.otpService.createOtp(
        sendOtpDto.phoneNumber,
        user?._id.toString(),
      );
      return { message: '인증번호가 전송되었습니다.' };
    } catch (error) {
      console.error('[AuthController] OTP 전송 실패:', error);
      throw error;
    }
  }

  @Post('phone/verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @CurrentUser() user: UserDocument,
  ) {

    const userId = user._id.toString();

    const isValid = await this.otpService.verifyOtp(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.otp,
      userId,
    );

    if (!isValid) {
      throw new Error('인증번호가 올바르지 않거나 만료되었습니다.');
    }

    const existingUser = await this.authService.findUserByPhoneNumber(verifyOtpDto.phoneNumber);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error('이미 다른 사용자에게 등록된 전화번호입니다.');
    }

    const updatedUser = await this.authService.updateUser(
      userId,
      { phoneNumber: verifyOtpDto.phoneNumber },
    );

    if (!updatedUser) {
      throw new Error('핸드폰 번호 업데이트에 실패했습니다.');
    }

    const userObj = updatedUser.toObject();
    return {
      message: '핸드폰 번호가 인증되었습니다.',
      user: {
        _id: userObj._id.toString(),
        email: userObj.email,
        name: userObj.name,
        phoneNumber: userObj.phoneNumber,
      },
    };
  }
}

