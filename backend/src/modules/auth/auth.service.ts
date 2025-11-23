import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(profile: any): Promise<UserDocument> {
    const { id, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new Error('이메일 정보를 가져올 수 없습니다.');
    }

    if (!id) {
      throw new Error('사용자 ID를 가져올 수 없습니다.');
    }

    let user: UserDocument | null = await this.userModel.findOne({ email }).exec();

    if (!user) {
      const createUserDto: CreateUserDto = {
        email,
        name: email.split('@')[0],
        provider: 'google',
        providerId: id,
      };
      user = await this.createUser(createUserDto);
    }

    return user;
  }

  async validateKakaoUser(profile: any): Promise<UserDocument> {
    try {
      const id = profile.id || profile._json?.id;

      if (!id) {
        throw new Error('카카오 사용자 ID를 가져올 수 없습니다.');
      }

      let user: UserDocument | null = await this.userModel
        .findOne({ provider: 'kakao', providerId: id.toString() })
        .exec();

      if (!user) {
        const createUserDto: CreateUserDto = {
          email: `kakao_${id}@kakao.com`,
          name: `카카오사용자_${id}`,
          provider: 'kakao',
          providerId: id.toString(),
        };
        user = await this.createUser(createUserDto);
      }

      return user;
    } catch (error) {
      console.error('validateKakaoUser error:', error);
      throw error;
    }
  }

  async validateNaverUser(profile: any): Promise<UserDocument> {
    try {
      const id = profile.id || profile._json?.id;
      const _json = profile._json || profile;
      const email = _json?.email;
      const name = _json?.name || _json?.nickname || profile.displayName;

      if (!id) {
        throw new Error('네이버 사용자 ID를 가져올 수 없습니다.');
      }

      let user: UserDocument | null = null;

      if (email) {
        user = await this.userModel.findOne({ email }).exec();
      }

      if (!user) {
        user = await this.userModel
          .findOne({ provider: 'naver', providerId: id.toString() })
          .exec();
      }

      if (!user) {
        let userName = name;
        if (!userName && email) {
          userName = email.split('@')[0];
        }
        if (!userName) {
          userName = `네이버사용자_${id.substring(0, 8)}`;
        }

        const createUserDto: CreateUserDto = {
          email: email || `naver_${id}@naver.com`,
          name: userName,
          provider: 'naver',
          providerId: id.toString(),
        };
        user = await this.createUser(createUserDto);
      } else {
        if (name && (user.name.startsWith('네이버사용자_') || !user.name)) {
          user.name = name;
          await user.save();
        }
        if (user.provider !== 'naver') {
          user.provider = 'naver';
          user.providerId = id.toString();
          if (name) {
            user.name = name;
          }
          await user.save();
        }
      }

      return user;
    } catch (error) {
      console.error('validateNaverUser error:', error);
      console.error('Profile data:', JSON.stringify(profile, null, 2));
      throw error;
    }
  }

  async createUser(dto: CreateUserDto): Promise<UserDocument> {
    const user = new this.userModel(dto);
    return user.save();
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async generateJwtToken(user: UserDocument): Promise<string> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token);
  }
}

