import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

const mockUser = {
  _id: 'user-id',
  email: 'test@example.com',
  name: 'test',
  provider: 'google',
  providerId: 'google-id',
  isActive: true,
  save: jest.fn(),
};

const execMock = <T>(result: T) => ({
  exec: jest.fn().mockResolvedValue(result),
});

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    const modelMock = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'new-user', ...dto }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: Object.assign(modelMock, {
            findOne: jest.fn().mockReturnValue(execMock(null)),
            findById: jest.fn().mockReturnValue(execMock(mockUser)),
          }),
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('새 사용자를 생성해야 한다', async () => {
    const profile = {
      id: 'google-id',
      emails: [{ value: 'new@example.com' }],
    };

    const result = await service.validateUser(profile);
    expect(result).toBeDefined();
    expect(result.email).toBe('new@example.com');
  });

  it('기존 사용자를 반환해야 한다', async () => {
    userModel.findOne.mockReturnValue(execMock(mockUser));
    
    const profile = {
      id: 'google-id',
      emails: [{ value: 'test@example.com' }],
    };

    const result = await service.validateUser(profile);
    expect(result).toEqual(mockUser);
  });

  it('이메일이 없으면 에러를 발생시켜야 한다', async () => {
    const profile = {
      id: 'google-id',
      emails: [],
    };

    await expect(service.validateUser(profile)).rejects.toThrow(
      '이메일 정보를 가져올 수 없습니다.',
    );
  });

  it('JWT 토큰을 생성해야 한다', async () => {
    const token = await service.generateJwtToken(mockUser as any);
    expect(jwtService.signAsync).toHaveBeenCalled();
    expect(token).toBe('mock-jwt-token');
  });

  it('이메일로 사용자를 찾아야 한다', async () => {
    userModel.findOne.mockReturnValue(execMock(mockUser));
    
    const result = await service.findUserByEmail('test@example.com');
    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(result).toEqual(mockUser);
  });

  it('ID로 사용자를 찾아야 한다', async () => {
    const result = await service.findUserById('user-id');
    expect(userModel.findById).toHaveBeenCalledWith('user-id');
    expect(result).toEqual(mockUser);
  });

  describe('validateKakaoUser', () => {
    it('새 카카오 사용자를 생성해야 한다', async () => {
      userModel.findOne.mockReturnValue(execMock(null));
      
      const profile = {
        id: 'kakao-id',
        _json: { id: 'kakao-id' },
      };

      const result = await service.validateKakaoUser(profile);
      expect(result).toBeDefined();
      expect(result.email).toBe('kakao_kakao-id@kakao.com');
      expect(result.provider).toBe('kakao');
      expect(result.providerId).toBe('kakao-id');
    });

    it('기존 카카오 사용자를 반환해야 한다', async () => {
      const kakaoUser = {
        ...mockUser,
        provider: 'kakao',
        providerId: 'kakao-id',
      };
      userModel.findOne.mockReturnValue(execMock(kakaoUser));
      
      const profile = {
        id: 'kakao-id',
        _json: { id: 'kakao-id' },
      };

      const result = await service.validateKakaoUser(profile);
      expect(result).toEqual(kakaoUser);
    });

    it('카카오 사용자 ID가 없으면 에러를 발생시켜야 한다', async () => {
      const profile = {
        _json: {},
      };

      await expect(service.validateKakaoUser(profile)).rejects.toThrow(
        '카카오 사용자 ID를 가져올 수 없습니다.',
      );
    });
  });

  describe('validateNaverUser', () => {
    it('새 네이버 사용자를 생성해야 한다', async () => {
      userModel.findOne.mockReturnValue(execMock(null));
      
      const profile = {
        id: 'naver-id',
        _json: {
          id: 'naver-id',
          email: 'test@naver.com',
          name: '테스트사용자',
        },
      };

      const result = await service.validateNaverUser(profile);
      expect(result).toBeDefined();
      expect(result.email).toBe('test@naver.com');
      expect(result.name).toBe('테스트사용자');
      expect(result.provider).toBe('naver');
      expect(result.providerId).toBe('naver-id');
    });

    it('이름이 없으면 이메일 앞부분을 사용해야 한다', async () => {
      userModel.findOne.mockReturnValue(execMock(null));
      
      const profile = {
        id: 'naver-id',
        _json: {
          id: 'naver-id',
          email: 'testuser@naver.com',
        },
      };

      const result = await service.validateNaverUser(profile);
      expect(result.name).toBe('testuser');
    });

    it('이름과 이메일이 없으면 기본값을 사용해야 한다', async () => {
      userModel.findOne.mockReturnValue(execMock(null));
      
      const profile = {
        id: 'naver-id-very-long-string',
        _json: {
          id: 'naver-id-very-long-string',
        },
      };

      const result = await service.validateNaverUser(profile);
      expect(result.name).toBe('네이버사용자_naver-id');
      expect(result.email).toBe('naver_naver-id-very-long-string@naver.com');
    });

    it('기존 네이버 사용자를 반환해야 한다', async () => {
      const naverUser = {
        ...mockUser,
        provider: 'naver',
        providerId: 'naver-id',
        name: '기존사용자',
      };
      userModel.findOne.mockReturnValue(execMock(naverUser));
      
      const profile = {
        id: 'naver-id',
        _json: {
          id: 'naver-id',
          email: 'test@naver.com',
          name: '새이름',
        },
      };

      const result = await service.validateNaverUser(profile);
      expect(result).toEqual(naverUser);
    });

    it('기본 이름 형식이면 실제 이름으로 업데이트해야 한다', async () => {
      const naverUser = {
        ...mockUser,
        provider: 'naver',
        providerId: 'naver-id',
        name: '네이버사용자_naver-i',
        save: jest.fn().mockResolvedValue(true),
      };
      userModel.findOne.mockReturnValue(execMock(naverUser));
      
      const profile = {
        id: 'naver-id',
        _json: {
          id: 'naver-id',
          name: '실제이름',
        },
      };

      const result = await service.validateNaverUser(profile);
      expect(naverUser.save).toHaveBeenCalled();
      expect(result.name).toBe('실제이름');
    });

    it('네이버 사용자 ID가 없으면 에러를 발생시켜야 한다', async () => {
      const profile = {
        _json: {},
      };

      await expect(service.validateNaverUser(profile)).rejects.toThrow(
        '네이버 사용자 ID를 가져올 수 없습니다.',
      );
    });
  });
});

