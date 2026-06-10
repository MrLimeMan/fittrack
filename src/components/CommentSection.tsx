'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Trash2 } from 'lucide-react';

interface CommentProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  workout_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: CommentProfile | null;
}

interface CommentSectionProps {
  workoutId: string;
  currentUser: { id: string };
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
];

function getInitial(name: string | null): string {
  return (name || '?').charAt(0).toUpperCase();
}

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function CommentSection({ workoutId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, workout_id, user_id, content, created_at, profiles:user_id (id, display_name, avatar_url)')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: true });

    if (data) {
      const mapped = (data as Record<string, unknown>[]).map((row) => {
        const profiles = row.profiles as { id: string; display_name: string | null; avatar_url: string | null }[] | null;
        const profile: CommentProfile | null = profiles?.[0] ?? null;
        return {
          id: row.id as string,
          workout_id: row.workout_id as string,
          user_id: row.user_id as string,
          content: row.content as string,
          created_at: row.created_at as string,
          profile,
        };
      });
      setComments(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchComments();
  }, [workoutId]);

  async function addComment() {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      workout_id: workoutId,
      user_id: currentUser.id,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment('');
      await fetchComments();
    } else {
      console.error('Error adding comment:', error);
    }
    setSubmitting(false);
  }

  async function deleteComment(commentId: string) {
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 mt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comment list */}
      {loading ? (
        <p className="text-xs text-muted-foreground py-2">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-2 mb-3">
          {comments.map((comment) => {
            const profile = comment.profile;
            const isOwn = comment.user_id === currentUser.id;

            return (
              <div key={comment.id} className="flex items-start gap-2 group">
                {/* Avatar */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || 'User'}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full ${
                      profile?.id ? getAvatarColor(profile.id) : 'bg-gray-400'
                    } flex items-center justify-center flex-shrink-0 mt-0.5`}
                  >
                    <span className="text-[9px] font-bold text-white select-none">
                      {getInitial(profile?.display_name ?? null)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {profile?.display_name || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {timeAgo(comment.created_at)}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="ml-auto p-0.5 rounded text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          className="flex-1 text-sm text-foreground bg-muted/50 border border-border rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
          disabled={submitting}
        />
        <button
          onClick={addComment}
          disabled={!newComment.trim() || submitting}
          className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
