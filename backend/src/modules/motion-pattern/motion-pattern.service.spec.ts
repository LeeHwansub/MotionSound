import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { MotionPatternService } from './motion-pattern.service';
import { MotionPattern } from './schemas/motion-pattern.schema';

const mockMotionPattern = {
  _id: 'pattern-id',
  name: 'test pattern',
  samples: [],
};

const execMock = <T>(result: T) => ({
  exec: jest.fn().mockResolvedValue(result),
});

describe('MotionPatternService', () => {
  let service: MotionPatternService;
  let model: any;

  beforeEach(async () => {
    const modelMock = jest.fn().mockImplementation((dto) => ({
      save: jest.fn().mockResolvedValue({ _id: 'new-id', ...dto }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MotionPatternService,
        {
          provide: getModelToken(MotionPattern.name),
          useValue: Object.assign(modelMock, {
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue(execMock([mockMotionPattern])),
            }),
            findById: jest.fn().mockReturnValue(execMock(mockMotionPattern)),
            findByIdAndUpdate: jest
              .fn()
              .mockReturnValue(execMock(mockMotionPattern)),
            findByIdAndDelete: jest
              .fn()
              .mockReturnValue(execMock(mockMotionPattern)),
          }),
        },
      ],
    }).compile();

    service = module.get<MotionPatternService>(MotionPatternService);
    model = module.get(getModelToken(MotionPattern.name));
  });

  it('모션 패턴을 생성해야 한다', async () => {
    const result = await service.create({ name: 'pattern', samples: [] });
    expect(result).toEqual({ _id: 'new-id', name: 'pattern', samples: [] });
  });

  it('모든 모션 패턴을 반환해야 한다', async () => {
    const result = await service.findAll();
    expect(model.find).toHaveBeenCalled();
    expect(result).toEqual([mockMotionPattern]);
  });

  it('특정 모션 패턴을 조회해야 한다', async () => {
    const result = await service.findOne('pattern-id');
    expect(model.findById).toHaveBeenCalledWith('pattern-id');
    expect(result).toEqual(mockMotionPattern);
  });

  it('모션 패턴이 없으면 예외를 발생시켜야 한다', async () => {
    model.findById.mockReturnValue(execMock(null));
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('모션 패턴을 수정해야 한다', async () => {
    const result = await service.update('pattern-id', { name: 'updated' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(mockMotionPattern);
  });

  it('수정 대상이 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndUpdate.mockReturnValue(execMock(null));
    await expect(
      service.update('pattern-id', { name: 'updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('모션 패턴을 삭제해야 한다', async () => {
    const result = await service.remove('pattern-id');
    expect(model.findByIdAndDelete).toHaveBeenCalled();
    expect(result).toEqual(mockMotionPattern);
  });

  it('삭제 대상이 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndDelete.mockReturnValue(execMock(null));
    await expect(service.remove('pattern-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});