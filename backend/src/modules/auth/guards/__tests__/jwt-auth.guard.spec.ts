import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('Public 데코레이터가 있으면 인증을 건너뛰어야 한다', () => {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    reflector.getAllAndOverride = jest.fn().mockReturnValue(true);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('Public 데코레이터가 없으면 부모 클래스의 canActivate를 호출해야 한다', () => {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const superCanActivate = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
    superCanActivate.mockReturnValue(true);

    guard.canActivate(context);
    expect(superCanActivate).toHaveBeenCalled();
  });
});

