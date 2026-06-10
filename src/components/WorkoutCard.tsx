'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock } from 'lucide-react';

interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: string | number;
  weight?: string;
  duration?: number;
}

interface ProfileBrief {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface WorkoutWithProfile {
  id: string;
  user_id: string;
  group_id: string;
  workout_type: string;
  log_mode: string;
  note: string | null;
  duration_minutes: number | null;
  exercises: WorkoutExercise[];
  performed_at: string;
  created_at: string;
  profiles: ProfileBrief | null;
}

interface ReactionWithProfile {
  id: string;
  user_id: string;
  workout_id: string;
  emoji: string;
  profiles: ProfileBrief | null;
}

interface WorkoutCardProps {
  workout: WorkoutWithProfile;
  currentUser: { id: string };
  reactions: ReactionWithProfile[];
  onReactionChange?: () => void;
}

const WORKOUT_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strength: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Strength' },
  cardio: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Cardio' },
  flexibility: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Flexibility' },
  other: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-400', label: 'Other' },
};

const REACTION_EMOJIS = ['🔥', '💪', '👏'];

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

/** Small avatar circle: shows photo or colored initial fallback */
function MiniAvatar({ profile, size = 'w-5 h-5' }: { profile: ProfileBrief | null; size?: string }) {
  const initial = getInitial(profile?.display_name ?? null);
  const colorClass = profile?.id ? getAvatarColor(profile.id) : 'bg-gray-400';

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.display_name || 'User'}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${size} rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
      <span className={`${size === 'w-5 h-5' ? 'text-[8px]' : 'text-xs'} font-bold text-white select-none`}>
        {initial}
      </span>
    </div>
  );
}

export default function WorkoutCard({ workout, currentUser, reactions, onReactionChange }: WorkoutCardProps) {
  const [toggling, setToggling] = useState<string | null>(null);
  const profile = workout.profiles;
  const typeStyle = WORKOUT_TYPE_STYLES[workout.workout_type] || WORKOUT_TYPE_STYLES.other;
  const isDetailed = workout.log_mode === 'detailed';

  const reactionCounts = REACTION_EMOJIS.reduce((acc, emoji) => {
    acc[emoji] = reactions.filter((r) => r.workout_id === workout.id && r.emoji === emoji).length;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = REACTION_EMOJIS.reduce((acc, emoji) => {
    acc[emoji] = reactions.some(
      (r) => r.workout_id === workout.id && r.user_id === currentUser.id && r.emoji === emoji
    );
    return acc;
  }, {} as Record<string, boolean>);

  // Group reactions by emoji, with their profiles
  const reactionsByEmoji = REACTION_EMOJIS.reduce((acc, emoji) => {
    acc[emoji] = reactions.filter((r) => r.workout_id === workout.id && r.emoji === emoji);
    return acc;
  }, {} as Record<string, ReactionWithProfile[]>);

  async function toggleReaction(emoji: string) {
    if (toggling) return;
    setToggling(emoji);

    if (userReactions[emoji]) {
      await supabase
        .from('reactions')
        .delete()
        .eq('workout_id', workout.id)
        .eq('user_id', currentUser.id)
        .eq('emoji', emoji);
    } else {
      await supabase.from('reactions').insert({
        workout_id: workout.id,
        user_id: currentUser.id,
        emoji,
      });
    }

    setToggling(null);
    onReactionChange?.();
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      {/* Header: avatar, name, time, type badge */}
      <div className="flex items-start gap-3 mb-3">
        {/* Author avatar: 40px rounded-full */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${profile?.id ? getAvatarColor(profile.id) : 'bg-gray-400'} flex items-center justify-center`}>
              <span className="text-lg font-bold text-white select-none">
                {getInitial(profile?.display_name ?? null)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {profile?.display_name || 'Anonymous'}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}
            >
              {typeStyle.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(workout.performed_at)}</span>
            {workout.duration_minutes != null && (
              <>
                <span className="mx-1">·</span>
                <span>{workout.duration_minutes} min</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workout name or note */}
      {workout.note && (
        <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{workout.note}</p>
      )}

      {/* Exercise list for detailed mode */}
      {isDetailed && workout.exercises && workout.exercises.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {workout.exercises.map((ex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-foreground/70 bg-muted/50 rounded-lg px-3 py-1.5"
            >
              <span className="font-medium text-foreground/90">{ex.name}</span>
              <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                {ex.sets != null && ex.reps != null && (
                  <span>
                    {ex.sets} × {ex.reps}
                    {ex.weight ? ` × ${ex.weight}` : ''}
                  </span>
                )}
                {ex.duration != null && <span>{ex.duration}s</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reaction buttons with user avatars */}
      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          {REACTION_EMOJIS.map((emoji) => {
            const count = reactionCounts[emoji];
            const isActive = userReactions[emoji];
            const isLoading = toggling === emoji;

            return (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                disabled={isLoading}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all
                  ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
                  }
                  ${isLoading ? 'opacity-50' : ''}
                `}
              >
                <span className="text-base leading-none">{emoji}</span>
                {count > 0 && (
                  <span className="text-xs font-medium">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Show small avatar circles of users who reacted, grouped by emoji */}
        {REACTION_EMOJIS.map((emoji) => {
          const emojiReactions = reactionsByEmoji[emoji];
          if (!emojiReactions || emojiReactions.length === 0) return null;

          return (
            <div key={emoji} className="flex items-center gap-0.5 ml-1">
              <span className="text-xs text-muted-foreground mr-1">{emoji}</span>
              <div className="flex -space-x-1.5">
                {emojiReactions.slice(0, 8).map((reaction) => (
                  <div key={reaction.id} title={reaction.profiles?.display_name || 'User'}>
                    <MiniAvatar profile={reaction.profiles} size="w-5 h-5" />
                  </div>
                ))}
              </div>
              {emojiReactions.length > 8 && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  +{emojiReactions.length - 8}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
