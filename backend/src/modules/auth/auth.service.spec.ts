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
});

