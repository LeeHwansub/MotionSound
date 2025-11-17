import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MotionPattern } from './schemas/motion-pattern.schema';
import { CreateMotionPatternDto } from './dto/create-motion-pattern.dto';
import { UpdateMotionPatternDto } from './dto/update-motion-pattern.dto';

@Injectable()
export class MotionPatternService {
  constructor(
    @InjectModel(MotionPattern.name)
    private readonly motionPatternModel: Model<MotionPattern>,
  ) {}

  async create(dto: CreateMotionPatternDto) {
    const created = new this.motionPatternModel(dto);
    return created.save();
  }

  async findAll() {
    return this.motionPatternModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const pattern = await this.motionPatternModel.findById(id).exec();
    if (!pattern) {
      throw new NotFoundException('모션 패턴을 찾을 수 없습니다.');
    }
    return pattern;
  }

  async update(id: string, dto: UpdateMotionPatternDto) {
    const updated = await this.motionPatternModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('모션 패턴을 찾을 수 없습니다.');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.motionPatternModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('모션 패턴을 찾을 수 없습니다.');
    }
    return deleted;
  }
}

