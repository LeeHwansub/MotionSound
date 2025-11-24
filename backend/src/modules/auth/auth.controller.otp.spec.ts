import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { VideoService } from '../video/video.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserDocument } from './schemas/user.schema';

describe('AuthController - OTP', () => {
  let controller: AuthController;
  let authService: AuthService;
  let otpService: OtpService;

  const mockUser = {
    _id: { toString: () => 'user-id' },
    email: 'test@example.com',
    name: 'Test User',
    phoneNumber: '01012345678',
    toObject: jest.fn().mockReturnValue({
      _id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      phoneNumber: '01012345678',
    }),
  } as unknown as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            updateUser: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: OtpService,
          useValue: {
            createOtp: jest.fn().mockResolvedValue('123456'),
            verifyOtp: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: VideoService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    otpService = module.get<OtpService>(OtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('인증번호를 전송해야 한다', async () => {
      const sendOtpDto: SendOtpDto = {
        phoneNumber: '01012345678',
      };

      const result = await controller.sendOtp(sendOtpDto, mockUser);

      expect(otpService.createOtp).toHaveBeenCalledWith(
        sendOtpDto.phoneNumber,
        'user-id',
      );
      expect(result).toEqual({ message: '인증번호가 전송되었습니다.' });
    });

    it('로그인하지 않은 사용자도 인증번호를 요청할 수 있어야 한다', async () => {
      const sendOtpDto: SendOtpDto = {
        phoneNumber: '01012345678',
      };

      const result = await controller.sendOtp(sendOtpDto, undefined);

      expect(otpService.createOtp).toHaveBeenCalledWith(
        sendOtpDto.phoneNumber,
        undefined,
      );
      expect(result).toEqual({ message: '인증번호가 전송되었습니다.' });
    });
  });

  describe('verifyOtp', () => {
    it('유효한 인증번호를 검증하고 사용자 정보를 업데이트해야 한다', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '01012345678',
        otp: '123456',
      };

      const result = await controller.verifyOtp(verifyOtpDto, mockUser);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpDto.phoneNumber,
        verifyOtpDto.otp,
        'user-id',
      );
      expect(authService.updateUser).toHaveBeenCalledWith('user-id', {
        phoneNumber: verifyOtpDto.phoneNumber,
      });
      expect(result).toEqual({
        message: '핸드폰 번호가 인증되었습니다.',
        user: expect.objectContaining({
          _id: 'user-id',
          email: 'test@example.com',
          phoneNumber: '01012345678',
        }),
      });
    });

    it('잘못된 인증번호는 예외를 발생시켜야 한다', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '01012345678',
        otp: '999999',
      };

      (otpService.verifyOtp as jest.Mock).mockResolvedValue(false);

      await expect(
        controller.verifyOtp(verifyOtpDto, mockUser),
      ).rejects.toThrow('인증번호가 올바르지 않거나 만료되었습니다.');
    });

    it('로그인하지 않은 사용자도 인증번호를 검증할 수 있어야 한다', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '01012345678',
        otp: '123456',
      };

      const result = await controller.verifyOtp(verifyOtpDto, undefined);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpDto.phoneNumber,
        verifyOtpDto.otp,
        undefined,
      );
      expect(authService.updateUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: '핸드폰 번호가 인증되었습니다.',
      });
    });

    it('사용자 정보 업데이트 실패 시 예외를 발생시켜야 한다', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '01012345678',
        otp: '123456',
      };

      (authService.updateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.verifyOtp(verifyOtpDto, mockUser),
      ).rejects.toThrow('핸드폰 번호 업데이트에 실패했습니다.');
    });
  });
});

