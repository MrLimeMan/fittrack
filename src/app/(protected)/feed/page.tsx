'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Users, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import WorkoutCard from '@/components/WorkoutCard';

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

interface GroupMembership {
  group_id: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutWithProfile[]>([]);
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasGroup, setHasGroup] = useState<boolean | null>(null);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // First check if user belongs to any group
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError || !memberships || memberships.length === 0) {
        setHasGroup(false);
        setWorkouts([]);
        setReactions([]);
        return;
      }

      setHasGroup(true);
      const groupIds = memberships.map((m: GroupMembership) => m.group_id);

      // Fetch workouts for user's groups, joined with profile info
      // RLS also filters, but we add explicit group filter for clarity
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select(
          `
          *,
          profiles!user_id (id, display_name, avatar_url)
        `
        )
        .in('group_id', groupIds)
        .order('performed_at', { ascending: false })
        .limit(50);

      if (workoutError) {
        console.error('Error fetching workouts:', workoutError);
        return;
      }

      const workoutList = (workoutData || []) as unknown as WorkoutWithProfile[];
      setWorkouts(workoutList);

      // Fetch reactions for these workouts
      if (workoutList.length > 0) {
        const workoutIds = workoutList.map((w) => w.id);
        const { data: reactionData } = await supabase
          .from('reactions')
          .select('*')
          .in('workout_id', workoutIds);

        setReactions((reactionData || []) as ReactionData[]);
      } else {
        setReactions([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user, fetchFeed]);

  function handleRefresh() {
    fetchFeed(true);
  }

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // No group joined
  if (hasGroup === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No group yet
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Create a group or join an existing one to see your friends&apos; workouts in the feed.
        </p>
        <div className="flex gap-3">
          <Link
            href="/group/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </Link>
          <Link
            href="/group/join"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors border border-border"
          >
            Join Group
          </Link>
        </div>
      </div>
    );
  }

  // Empty feed
  if (workouts.length === 0 && !loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Feed</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-2">No workouts yet</p>
          <p className="text-sm text-muted-foreground/70">
            Be the first to log a workout and it will appear here!
          </p>
        </div>
      </div>
    );
  }

  // Feed with workouts
  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Feed</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {refreshing && (
        <div className="text-center text-xs text-muted-foreground mb-3">
          Refreshing...
        </div>
      )}

      <div className="space-y-4">
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            currentUser={{ id: user!.id }}
            reactions={reactions.filter((r) => r.workout_id === workout.id)}
            onReactionChange={handleRefresh}
          />
        ))}
      </div>
    </div>
  );
}
