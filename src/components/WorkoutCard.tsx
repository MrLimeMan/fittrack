'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Clock } from 'lucide-react';

interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: string | number;
  weight?: string;
  duration?: number;
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
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReactionData {
  id: string;
  user_id: string;
  workout_id: string;
  emoji: string;
}

interface WorkoutCardProps {
  workout: WorkoutWithProfile;
  currentUser: { id: string };
  reactions: ReactionData[];
  onReactionChange?: () => void;
}

const WORKOUT_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strength: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Strength' },
  cardio: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Cardio' },
  flexibility: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Flexibility' },
  other: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-400', label: 'Other' },
};

const REACTION_EMOJIS = ['🔥', '💪', '👏'];

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

  async function toggleReaction(emoji: string) {
    if (toggling) return;
    setToggling(emoji);

    if (userReactions[emoji]) {
      // Remove reaction
      await supabase
        .from('reactions')
        .delete()
        .eq('workout_id', workout.id)
        .eq('user_id', currentUser.id)
        .eq('emoji', emoji);
    } else {
      // Add reaction
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
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-primary" />
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

      {/* Reaction buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
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
    </div>
  );
}
