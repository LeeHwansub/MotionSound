import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserDocument } from '../schemas/user.schema';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
    return user;
  },
);

