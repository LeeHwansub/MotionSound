import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: UserDocument) {
    return this.postService.create({
      ...dto,
      author: user.email,
    });
  }

  @Public()
  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: UserDocument) {
    return this.postService.findOne(id, user?.email);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.postService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.postService.remove(id);
  }

  @Post(':id/like')
  like(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.postService.toggleLike(id, user._id.toString());
  }

  @Public()
  @Post(':id/view')
  incrementView(@Param('id') id: string) {
    return this.postService.incrementViewCount(id);
  }
}

