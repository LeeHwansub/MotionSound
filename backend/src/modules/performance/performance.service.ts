import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Performance } from './schemas/performance.schema';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Performance.name)
    private readonly performanceModel: Model<Performance>,
  ) {}

  async create(dto: CreatePerformanceDto) {
    const created = new this.performanceModel(dto);
    return created.save();
  }

  async findAll() {
    return this.performanceModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const performance = await this.performanceModel.findById(id).exec();
    if (!performance) {
      throw new NotFoundException('연주 데이터를 찾을 수 없습니다.');
    }
    return performance;
  }

  async update(id: string, dto: UpdatePerformanceDto) {
    const updated = await this.performanceModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('연주 데이터를 찾을 수 없습니다.');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.performanceModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('연주 데이터를 찾을 수 없습니다.');
    }
    return deleted;
  }
}

