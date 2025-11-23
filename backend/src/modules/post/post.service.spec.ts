import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';
import { Post } from './schemas/post.schema';

const mockPost = {
  _id: 'post-id',
  title: 'Test Post',
  content: 'Test Content',
  author: 'test-author',
  isPublic: true,
  viewCount: 0,
  likeCount: 0,
  save: jest.fn(),
};

const execMock = <T>(result: T) => ({
  exec: jest.fn().mockResolvedValue(result),
});

describe('PostService', () => {
  let service: PostService;
  let model: any;

  beforeEach(async () => {
    const modelMock = jest.fn().mockImplementation((dto) => ({
      save: jest.fn().mockResolvedValue({ _id: 'new-post', ...dto }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getModelToken(Post.name),
          useValue: Object.assign(modelMock, {
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue(execMock([mockPost])),
            }),
            findById: jest.fn().mockReturnValue(execMock(mockPost)),
            findByIdAndUpdate: jest
              .fn()
              .mockReturnValue(execMock(mockPost)),
            findByIdAndDelete: jest
              .fn()
              .mockReturnValue(execMock(mockPost)),
          }),
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    model = module.get(getModelToken(Post.name));
  });

  it('게시물을 생성해야 한다', async () => {
    const dto = {
      title: 'New Post',
      content: 'New Content',
      author: 'author',
    };
    const result = await service.create(dto);
    expect(result).toEqual({ _id: 'new-post', ...dto, isPublic: true });
  });

  it('모든 게시물을 조회해야 한다', async () => {
    const result = await service.findAll();
    expect(model.find).toHaveBeenCalled();
    expect(result).toEqual([mockPost]);
  });

  it('특정 게시물을 조회해야 한다', async () => {
    const result = await service.findOne('post-id');
    expect(model.findById).toHaveBeenCalledWith('post-id');
    expect(result).toEqual(mockPost);
  });

  it('게시물이 없으면 예외를 발생시켜야 한다', async () => {
    model.findById.mockReturnValue(execMock(null));
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('게시물을 수정해야 한다', async () => {
    const dto = { title: 'Updated Title' };
    const result = await service.update('post-id', dto);
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('post-id', dto, { new: true });
    expect(result).toEqual(mockPost);
  });

  it('수정 대상 게시물이 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndUpdate.mockReturnValue(execMock(null));
    await expect(
      service.update('post-id', { title: 'Updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('게시물을 삭제해야 한다', async () => {
    const result = await service.remove('post-id');
    expect(model.findByIdAndDelete).toHaveBeenCalledWith('post-id');
    expect(result).toEqual(mockPost);
  });

  it('삭제 대상 게시물이 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndDelete.mockReturnValue(execMock(null));
    await expect(service.remove('post-id')).rejects.toThrow(NotFoundException);
  });

  it('좋아요 수를 증가시켜야 한다', async () => {
    const updatedPost = { ...mockPost, likeCount: 1 };
    model.findByIdAndUpdate.mockReturnValue(execMock(updatedPost));
    
    const result = await service.incrementLikeCount('post-id');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'post-id',
      { $inc: { likeCount: 1 } },
      { new: true },
    );
    expect(result.likeCount).toBe(1);
  });

  it('좋아요 증가 시 게시물이 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndUpdate.mockReturnValue(execMock(null));
    await expect(service.incrementLikeCount('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('조회수를 증가시켜야 한다', async () => {
    const updatedPost = { ...mockPost, viewCount: 1 };
    model.findByIdAndUpdate.mockReturnValue(execMock(updatedPost));
    
    const result = await service.incrementViewCount('post-id');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'post-id',
      { $inc: { viewCount: 1 } },
      { new: true },
    );
    expect(result.viewCount).toBe(1);
  });

  it('조회수 증가 시 게시물이 없으면 예외를 발생시켜야 한다', async () => {
    model.findByIdAndUpdate.mockReturnValue(execMock(null));
    await expect(service.incrementViewCount('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});

