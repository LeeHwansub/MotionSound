import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MotionPattern } from './schemas/motion-pattern.schema';
import { CreateMotionPatternDto } from './dto/create-motion-pattern.dto';
import { UpdateMotionPatternDto } from './dto/update-motion-pattern.dto';

@Injectable()
export class MotionPatternService {
  private readonly logger = new Logger(MotionPatternService.name);

  constructor(
    @InjectModel(MotionPattern.name)
    private readonly motionPatternModel: Model<MotionPattern>,
  ) {}

  async create(dto: CreateMotionPatternDto) {
    try {
      const created = new this.motionPatternModel(dto);
      return await created.save();
    } catch (error) {
      this.logger.error('모션 패턴 생성 실패:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      this.logger.log('모션 패턴 목록 조회 시작');
      const patterns = await this.motionPatternModel.find().sort({ createdAt: -1 }).exec();
      this.logger.log(`모션 패턴 ${patterns.length}개 조회 완료`);
      return patterns;
    } catch (error) {
      this.logger.error('모션 패턴 목록 조회 실패:', error);
      throw error;
    }
  }

  async findByUserId(userId: string) {
    try {
      this.logger.log(`사용자 ${userId}의 모션 패턴 목록 조회 시작`);
      const patterns = await this.motionPatternModel
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .exec();
      this.logger.log(`모션 패턴 ${patterns.length}개 조회 완료`);
      return patterns;
    } catch (error) {
      this.logger.error('모션 패턴 목록 조회 실패:', error);
      throw error;
    }
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

