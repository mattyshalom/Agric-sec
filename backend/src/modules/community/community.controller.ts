import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, paginatedResponse } from '../../utils/pagination';

export const listPosts = asyncHandler(async (req, res) => {
  const q = req.query as Record<string, string>;
  const { skip, take, page, limit } = getPagination(q);
  const where = {
    isPublished: true,
    ...(q.category && { category: q.category as never }),
    ...(q.search && { title: { contains: q.search, mode: 'insensitive' as const } }),
  };

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await prisma.post.create({
    data: { ...req.body, authorId: req.user!.id },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
  res.status(201).json({ success: true, data: post });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.postId },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });
  if (!post) throw new AppError('Post not found', 404);
  res.json({ success: true, data: post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== req.user!.id && req.user!.role === 'FARMER') throw new AppError('Forbidden', 403);
  const updated = await prisma.post.update({ where: { id: req.params.postId }, data: req.body });
  res.json({ success: true, data: updated });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== req.user!.id && req.user!.role === 'FARMER') throw new AppError('Forbidden', 403);
  await prisma.post.delete({ where: { id: req.params.postId } });
  res.json({ success: true });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId: req.params.postId, userId: req.user!.id } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    res.json({ success: true, liked: false });
  } else {
    await prisma.like.create({ data: { postId: req.params.postId, userId: req.user!.id } });
    res.json({ success: true, liked: true });
  }
});

export const listComments = asyncHandler(async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.postId, parentId: null },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      replies: {
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) throw new AppError('Post not found', 404);

  const comment = await prisma.comment.create({
    data: {
      body: req.body.body,
      postId: req.params.postId,
      authorId: req.user!.id,
      parentId: req.body.parentId,
    },
  });

  // Notify post author
  if (post.authorId !== req.user!.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        title: 'New comment on your post',
        message: `Someone commented on "${post.title}".`,
        type: 'community',
        refId: comment.id,
        refType: 'Comment',
      },
    });
  }

  res.status(201).json({ success: true, data: comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.authorId !== req.user!.id && req.user!.role === 'FARMER') throw new AppError('Forbidden', 403);
  await prisma.comment.delete({ where: { id: req.params.commentId } });
  res.json({ success: true });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.user!.id,
      ...(unreadOnly === 'true' && { isRead: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.notifId, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ success: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});
