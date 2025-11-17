import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { Performance } from './schemas/performance.schema';

const mockPerformance = {
  _id: 'performance-id',
  name: 'test performance',
  motionFrames: [],
};

const execMock = <T>(result: T) => ({
  exec: jest.fn().mockResolvedValue(result),
});

describe('PerformanceService', () => {
  let service: PerformanceService;
  let model: any;

  beforeEach(async () => {
    const modelMock = jest.fn().mockImplementation((dto) => ({
      save: jest.fn().mockResolvedValue({ _id: 'new-performance', ...dto }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: getModelToken(Performance.name),
          useValue: Object.assign(modelMock, {
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue(execMock([mockPerformance])),
            }),
            findById: jest.fn().mockReturnValue(execMock(mockPerformance)),
            findByIdAndUpdate: jest
              .fn()
              .mockReturnValue(execMock(mockPerformance)),
            findByIdAndDelete: jest
              .fn()
              .mockReturnValue(execMock(mockPerformance)),
          }),
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    model = module.get(getModelToken(Performance.name));
  });

  it('연주 데이터를 생성해야 한다', async () => {
    const result = await service.create({ name: 'jam' });
    expect(result).toEqual({ _id: 'new-performance', name: 'jam' });
  });

  it('모든 연주 데이터를 조회해야 한다', async () => {
    const result = await service.findAll();
    expect(model.find).toHaveBeenCalled();
    expect(result).toEqual([mockPerformance]);
  });

  it('특정 연주 데이터를 조회해야 한다', async () => {
    const result = await service.findOne('performance-id');
    expect(model.findById).toHaveBeenCalledWith('performance-id');
    expect(result).toEqual(mockPerformance);
  });

  it('연주 데이터가 없으면 예외를 발생시켜야 한다', async () => {
    model.findById.mockReturnValue(execMock(null));
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('연주 데이터를 수정해야 한다', async () => {
    const result = await service.update('performance-id', { name: 'edit' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(mockPerformance);
  });

  it('수정 대상 연주 데이터가 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndUpdate.mockReturnValue(execMock(null));
    await expect(
      service.update('performance-id', { name: 'edit' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('연주 데이터를 삭제해야 한다', async () => {
    const result = await service.remove('performance-id');
    expect(model.findByIdAndDelete).toHaveBeenCalled();
    expect(result).toEqual(mockPerformance);
  });

  it('삭제 대상 연주 데이터가 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndDelete.mockReturnValue(execMock(null));
    await expect(service.remove('performance-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});

