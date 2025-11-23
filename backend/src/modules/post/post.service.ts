import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<Post>,
  ) {}

  async create(dto: CreatePostDto) {
    const created = new this.postModel({
      ...dto,
      isPublic: dto.isPublic ?? true,
    });
    return created.save();
  }

  async findAll() {
    return this.postModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    const updated = await this.postModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.postModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    return deleted;
  }

  async toggleLike(id: string, userId: string) {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      // 좋아요 취소
      const updated = await this.postModel
        .findByIdAndUpdate(
          id,
          {
            $pull: { likedBy: userId },
            $inc: { likeCount: -1 },
          },
          { new: true },
        )
        .exec();
      return updated;
    } else {
      // 좋아요 추가
      const updated = await this.postModel
        .findByIdAndUpdate(
          id,
          {
            $addToSet: { likedBy: userId },
            $inc: { likeCount: 1 },
          },
          { new: true },
        )
        .exec();
      return updated;
    }
  }

  async incrementViewCount(id: string) {
    const updated = await this.postModel
      .findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    return updated;
  }
}

