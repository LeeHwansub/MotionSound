import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Logger,
} from '@nestjs/common';
import { MotionPatternService } from './motion-pattern.service';
import { CreateMotionPatternDto } from './dto/create-motion-pattern.dto';
import { UpdateMotionPatternDto } from './dto/update-motion-pattern.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('patterns')
export class MotionPatternController {
  private readonly logger = new Logger(MotionPatternController.name);

  constructor(private readonly motionPatternService: MotionPatternService) {}

  @Post()
  create(@Body() dto: CreateMotionPatternDto) {
    this.logger.log('POST /patterns 요청 수신');
    return this.motionPatternService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    this.logger.log('GET /patterns 요청 수신');
    return this.motionPatternService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.motionPatternService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMotionPatternDto) {
    return this.motionPatternService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.motionPatternService.remove(id);
  }
}

