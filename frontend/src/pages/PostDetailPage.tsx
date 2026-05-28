import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '../services/community.service';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ChevronLeft, Heart, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const [commentText, setCommentText] = useState('');
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: postRes } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => communityService.getPost(postId!),
  });

  const { data: commentsRes } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => communityService.comments(postId!),
  });

  const toggleLike = useMutation({
    mutationFn: () => communityService.toggleLike(postId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', postId] }),
  });

  const createComment = useMutation({
    mutationFn: () => communityService.createComment(postId!, commentText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      setCommentText('');
      toast.success('Comment added');
    },
  });

  const post = postRes?.data?.data;
  const comments = commentsRes?.data?.data ?? [];

  if (!post) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/community" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Back to Community
      </Link>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
              {post.author.firstName[0]}{post.author.lastName[0]}
            </div>
            <div>
              <p className="font-medium text-gray-900">{post.author.firstName} {post.author.lastName}</p>
              <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
          <Badge variant="blue">{post.category}</Badge>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
        <p className="mt-3 text-gray-600 whitespace-pre-wrap">{post.body}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => toggleLike.mutate()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500">
            <Heart size={16} /> {post._count.likes} likes
          </button>
          <span className="text-sm text-gray-400">{post._count.comments} comments</span>
        </div>
      </Card>

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Comments</h2>
        {comments.map((c: { id: string; body: string; author: { firstName: string; lastName: string }; createdAt: string; replies: Array<{ id: string; body: string; author: { firstName: string; lastName: string }; createdAt: string }> }) => (
          <Card key={c.id} padding="sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                {c.author.firstName[0]}
              </div>
              <span className="text-sm font-medium text-gray-900">{c.author.firstName} {c.author.lastName}</span>
              <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="text-sm text-gray-600 ml-8">{c.body}</p>
            {c.replies?.map((r) => (
              <div key={r.id} className="ml-8 mt-2 pl-3 border-l-2 border-gray-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">{r.author.firstName}</span>
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                </div>
                <p className="text-xs text-gray-600">{r.body}</p>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Comment input */}
      <Card padding="sm">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createComment.mutate(); } }}
            />
            <Button
              size="sm"
              onClick={() => createComment.mutate()}
              loading={createComment.isPending}
              disabled={!commentText.trim()}
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
