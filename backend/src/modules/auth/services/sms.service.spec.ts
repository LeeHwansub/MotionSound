import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('@aws-sdk/client-sns');

describe('SmsService', () => {
  let service: SmsService;
  let configService: ConfigService;
  let snsClientMock: jest.Mocked<SNSClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                AWS_ACCESS_KEY_ID: 'test-access-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                AWS_REGION: 'ap-northeast-2',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('생성자', () => {
    it('AWS 자격 증명이 있으면 SNS 클라이언트를 초기화해야 한다', () => {
      expect(service).toBeDefined();
    });

    it('AWS 자격 증명이 없으면 개발 모드로 동작해야 한다', async () => {
      const moduleWithoutCreds: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      const serviceWithoutCreds = moduleWithoutCreds.get<SmsService>(SmsService);
      expect(serviceWithoutCreds).toBeDefined();
    });
  });

  describe('sendOtp', () => {
    it('AWS 자격 증명이 없으면 콘솔에 로그를 출력해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const moduleWithoutCreds: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      const serviceWithoutCreds = moduleWithoutCreds.get<SmsService>(SmsService);
      await serviceWithoutCreds.sendOtp('01012345678', '123456');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SMS Mock]'),
      );
      consoleSpy.mockRestore();
    });

    it('한국 전화번호 형식을 올바르게 변환해야 한다', async () => {
      const sendMock = jest.fn().mockResolvedValue({});
      (SNSClient as jest.MockedClass<typeof SNSClient>).mockImplementation(() => ({
        send: sendMock,
      } as any));

      const moduleWithCreds: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                  AWS_ACCESS_KEY_ID: 'test-access-key',
                  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                  AWS_REGION: 'ap-northeast-2',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const serviceWithCreds = moduleWithCreds.get<SmsService>(SmsService);
      await serviceWithCreds.sendOtp('01012345678', '123456');

      expect(sendMock).toHaveBeenCalled();
      const callArgs = sendMock.mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(PublishCommand);
    });

    it('+82로 시작하는 전화번호는 그대로 사용해야 한다', async () => {
      const sendMock = jest.fn().mockResolvedValue({});
      (SNSClient as jest.MockedClass<typeof SNSClient>).mockImplementation(() => ({
        send: sendMock,
      } as any));

      const moduleWithCreds: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                  AWS_ACCESS_KEY_ID: 'test-access-key',
                  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                  AWS_REGION: 'ap-northeast-2',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const serviceWithCreds = moduleWithCreds.get<SmsService>(SmsService);
      await serviceWithCreds.sendOtp('+821012345678', '123456');

      expect(sendMock).toHaveBeenCalled();
    });

    it('SMS 전송 실패 시 예외를 발생시켜야 한다', async () => {
      const sendMock = jest.fn().mockRejectedValue(new Error('SMS 전송 실패'));
      (SNSClient as jest.MockedClass<typeof SNSClient>).mockImplementation(() => ({
        send: sendMock,
      } as any));

      const moduleWithCreds: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                  AWS_ACCESS_KEY_ID: 'test-access-key',
                  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                  AWS_REGION: 'ap-northeast-2',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const serviceWithCreds = moduleWithCreds.get<SmsService>(SmsService);

      await expect(
        serviceWithCreds.sendOtp('01012345678', '123456'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});

