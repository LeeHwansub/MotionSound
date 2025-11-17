import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MotionPatternService } from './motion-pattern.service';
import { CreateMotionPatternDto } from './dto/create-motion-pattern.dto';
import { UpdateMotionPatternDto } from './dto/update-motion-pattern.dto';

@Controller('patterns')
export class MotionPatternController {
  constructor(private readonly motionPatternService: MotionPatternService) {}

  @Post()
  create(@Body() dto: CreateMotionPatternDto) {
    return this.motionPatternService.create(dto);
  }

  @Get()
  findAll() {
    return this.motionPatternService.findAll();
  }

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

