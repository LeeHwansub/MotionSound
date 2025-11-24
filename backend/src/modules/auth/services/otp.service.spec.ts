import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import { PhoneOtp } from '../schemas/phone-otp.schema';

describe('OtpService', () => {
  let service: OtpService;
  let otpModel: any;
  let smsService: SmsService;

  const mockOtp = {
    _id: 'otp-id',
    phoneNumber: '01012345678',
    otp: '123456',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    verified: false,
    userId: 'user-id',
    save: jest.fn().mockResolvedValue(true),
  };

  const execMock = <T>(result: T) => ({
    exec: jest.fn().mockResolvedValue(result),
    sort: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const modelMock = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue(mockOtp),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getModelToken(PhoneOtp.name),
          useValue: Object.assign(modelMock, {
            create: jest.fn().mockResolvedValue(mockOtp),
            findOne: jest.fn().mockReturnValue(execMock(mockOtp)),
          }),
        },
        {
          provide: SmsService,
          useValue: {
            sendOtp: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    otpModel = module.get(getModelToken(PhoneOtp.name));
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('6자리 숫자 OTP를 생성해야 한다', () => {
      const otp = service.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('매번 다른 OTP를 생성해야 한다', () => {
      const otp1 = service.generateOtp();
      const otp2 = service.generateOtp();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('createOtp', () => {
    it('OTP를 생성하고 SMS를 전송해야 한다', async () => {
      const phoneNumber = '01012345678';
      const userId = 'user-id';

      const result = await service.createOtp(phoneNumber, userId);

      expect(otpModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber,
          userId,
          verified: false,
          expiresAt: expect.any(Date),
          otp: expect.stringMatching(/^\d{6}$/),
        }),
      );
      expect(smsService.sendOtp).toHaveBeenCalledWith(
        phoneNumber,
        expect.stringMatching(/^\d{6}$/),
      );
      expect(result).toMatch(/^\d{6}$/);
    });

    it('userId 없이도 OTP를 생성할 수 있어야 한다', async () => {
      const phoneNumber = '01012345678';

      await service.createOtp(phoneNumber);

      expect(otpModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber,
          userId: undefined,
        }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('유효한 OTP를 검증해야 한다', async () => {
      const phoneNumber = '01012345678';
      const otp = '123456';
      const userId = 'user-id';

      mockOtp.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      mockOtp.verified = false;

      const result = await service.verifyOtp(phoneNumber, otp, userId);

      expect(otpModel.findOne).toHaveBeenCalledWith({
        phoneNumber,
        otp,
        verified: false,
        expiresAt: expect.any(Object),
        userId,
      });
      expect(result).toBe(true);
      expect(mockOtp.verified).toBe(true);
      expect(mockOtp.save).toHaveBeenCalled();
    });

    it('만료된 OTP는 검증에 실패해야 한다', async () => {
      const phoneNumber = '01012345678';
      const otp = '123456';

      otpModel.findOne.mockReturnValue(execMock(null));

      const result = await service.verifyOtp(phoneNumber, otp);

      expect(result).toBe(false);
    });

    it('잘못된 OTP는 검증에 실패해야 한다', async () => {
      const phoneNumber = '01012345678';
      const otp = '999999';

      otpModel.findOne.mockReturnValue(execMock(null));

      const result = await service.verifyOtp(phoneNumber, otp);

      expect(result).toBe(false);
    });

    it('이미 검증된 OTP는 재검증에 실패해야 한다', async () => {
      const phoneNumber = '01012345678';
      const otp = '123456';

      mockOtp.verified = true;
      otpModel.findOne.mockReturnValue(execMock(null));

      const result = await service.verifyOtp(phoneNumber, otp);

      expect(result).toBe(false);
    });
  });

  describe('isPhoneNumberVerified', () => {
    it('인증된 전화번호를 확인해야 한다', async () => {
      const phoneNumber = '01012345678';
      mockOtp.verified = true;

      const result = await service.isPhoneNumberVerified(phoneNumber);

      expect(otpModel.findOne).toHaveBeenCalledWith({
        phoneNumber,
        verified: true,
      });
      expect(result).toBe(true);
    });

    it('인증되지 않은 전화번호는 false를 반환해야 한다', async () => {
      const phoneNumber = '01012345678';

      otpModel.findOne.mockReturnValue(execMock(null));

      const result = await service.isPhoneNumberVerified(phoneNumber);

      expect(result).toBe(false);
    });
  });
});

