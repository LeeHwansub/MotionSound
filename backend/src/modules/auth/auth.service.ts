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

