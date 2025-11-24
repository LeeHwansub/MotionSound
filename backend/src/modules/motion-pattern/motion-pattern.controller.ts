import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Logger,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MotionPatternService } from './motion-pattern.service';
import { CreateMotionPatternDto } from './dto/create-motion-pattern.dto';
import { UpdateMotionPatternDto } from './dto/update-motion-pattern.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@Controller('patterns')
export class MotionPatternController {
  private readonly logger = new Logger(MotionPatternController.name);

  constructor(private readonly motionPatternService: MotionPatternService) {}

  @Post()
  create(
    @Body() dto: CreateMotionPatternDto,
    @CurrentUser() user: UserDocument,
  ) {
    this.logger.log('POST /patterns 요청 수신');
    return this.motionPatternService.create({
      ...dto,
      userId: user._id.toString(),
    } as CreateMotionPatternDto & { userId: string });
  }

  @Get()
  findAll(@CurrentUser() user: UserDocument) {
    this.logger.log('GET /patterns 요청 수신', { userId: user._id.toString() });
    // 인증된 사용자만 자신의 패턴을 조회할 수 있음
    return this.motionPatternService.findByUserId(user._id.toString());
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    const pattern = await this.motionPatternService.findOne(id);
    // 본인이 생성한 패턴만 조회 가능
    if (pattern.userId && pattern.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('본인이 생성한 패턴만 조회할 수 있습니다.');
    }
    return pattern;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMotionPatternDto) {
    return this.motionPatternService.update(id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    try {
      const pattern = await this.motionPatternService.findOne(id).catch(() => null);
      
      if (!pattern) {
        throw new NotFoundException('모션 패턴을 찾을 수 없습니다.');
      }
      
      const userId = user._id.toString();
      
      if (pattern.userId && pattern.userId.toString() !== userId) {
        throw new ForbiddenException('본인이 생성한 패턴만 삭제할 수 있습니다.');
      }
      
      return this.motionPatternService.remove(id);
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`패턴 삭제 실패 (id: ${id}):`, error);
      throw error;
    }
  }
}

