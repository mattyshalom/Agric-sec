import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { communityService } from '../services/community.service';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Users, Plus, Heart, MessageCircle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const categoryColors: Record<string, string> = {
  ADVISORY: 'blue', QUESTION: 'yellow', MARKET_INSIGHT: 'green',
  WEATHER_UPDATE: 'blue', GENERAL: 'gray',
};

export default function CommunityPage() {
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [notifPanel, setNotifPanel] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'GENERAL' });
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: postsRes } = useQuery({
    queryKey: ['posts', category],
    queryFn: () => communityService.posts(category ? { category } : {}),
  });

  const { data: notifsRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communityService.notifications(),
  });

  const createPost = useMutation({
    mutationFn: () => communityService.createPost(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post published');
      setModalOpen(false);
      setForm({ title: '', body: '', category: 'GENERAL' });
    },
  });

  const toggleLike = useMutation({
    mutationFn: (postId: string) => communityService.toggleLike(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => communityService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const posts = postsRes?.data?.data ?? [];
  const notifications = notifsRes?.data?.data ?? [];
  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotifPanel(!notifPanel)}
            className="relative p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> New Post
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'GENERAL', 'ADVISORY', 'QUESTION', 'MARKET_INSIGHT', 'WEATHER_UPDATE'].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${category === c ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {c || 'All'}
          </button>
        ))}
      </div>

      {/* Notification panel */}
      {notifPanel && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()}>Mark all read</Button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No notifications.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((n: { id: string; title: string; message: string; isRead: boolean; createdAt: string; type: string }) => (
                <li key={n.id} className={`p-3 rounded-lg text-sm ${n.isRead ? 'bg-gray-50' : 'bg-primary-50'}`}>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No posts yet. Be the first to share!</p>
          </div>
        ) : posts.map((post: { id: string; title: string; body: string; category: string; createdAt: string; author: { firstName: string; lastName: string; role: string }; _count: { comments: number; likes: number } }) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold">
                  {post.author.firstName[0]}{post.author.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{post.author.firstName} {post.author.lastName}</p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <Badge variant={(categoryColors[post.category] || 'gray') as never}>{post.category.replace('_', ' ')}</Badge>
            </div>
            <Link to={`/community/posts/${post.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">{post.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.body}</p>
            </Link>
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => toggleLike.mutate(post.id)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <Heart size={15} /> {post._count.likes}
              </button>
              <Link to={`/community/posts/${post.id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600">
                <MessageCircle size={15} /> {post._count.comments}
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Create post modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Post" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['GENERAL','ADVISORY','QUESTION','MARKET_INSIGHT','WEATHER_UPDATE'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={createPost.isPending} onClick={() => createPost.mutate()}>Publish</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
