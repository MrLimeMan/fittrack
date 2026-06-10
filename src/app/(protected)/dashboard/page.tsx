'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import WeightTracker from '@/components/WeightTracker';
import GroupSwitcher from '@/components/GroupSwitcher';
import type { Workout, Group, GroupMember, Profile } from '@/lib/types';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  workout_count: number;
  total_minutes: number;
  is_current_user: boolean;
}

interface RecentActivity {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  name: string;
  workout_type: string;
  duration_minutes: number | null;
  performed_at: string;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getTodayStart(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function calculateStreak(workouts: { performed_at: string }[]): number {
  if (workouts.length === 0) return 0;

  const dateSet = new Set<string>();
  workouts.forEach((w) => {
    const d = new Date(w.performed_at);
    dateSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

    if (dateSet.has(key)) {
      streak++;
    } else {
      // Allow today to be missing (workout might not be logged yet)
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getWorkoutTypeIcon(type: string): string {
  switch (type) {
    case 'strength':
      return '🏋️';
    case 'cardio':
      return '🏃';
    case 'flexibility':
      return '🧘';
    default:
      return '💪';
  }
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [totalMinutesThisWeek, setTotalMinutesThisWeek] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fittrack_active_group') || null;
    }
    return null;
  });

  const handleGroupChange = useCallback((groupId: string | null) => {
    setActiveGroupId(groupId);
    localStorage.setItem('fittrack_active_group', groupId || '');
  }, []);

  const fetchDashboardData = useCallback(async (groupId?: string | null) => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Find user's group membership
      let targetGroupId = groupId !== undefined ? groupId : activeGroupId;

      if (!targetGroupId) {
        const { data: membership, error: memberError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (memberError || !membership) {
          // No group — show empty state
          setGroup(null);

          // Still fetch user's own workouts
          const weekStart = getWeekStart();
          const { data: myWorkouts } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', user.id)
            .gte('performed_at', weekStart)
            .order('performed_at', { ascending: false });

          if (myWorkouts) {
            setWorkoutsThisWeek(myWorkouts.length);
            setTotalMinutesThisWeek(
              myWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
            );
          }

          // Still calculate streak from all user workouts
          const { data: allMyWorkouts } = await supabase
            .from('workouts')
            .select('performed_at')
            .eq('user_id', user.id)
            .order('performed_at', { ascending: false })
            .limit(365);

          if (allMyWorkouts) {
            setStreak(calculateStreak(allMyWorkouts));
          }

          setLoading(false);
          return;
        }

        targetGroupId = membership.group_id;
      }

      // 2. Fetch group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', targetGroupId)
        .single();

      setGroup(groupData);

      // 3. Fetch all group members with their profiles
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', targetGroupId);

      if (!members) {
        setLoading(false);
        return;
      }

      const memberUserIds = members.map((m) => m.user_id);

      // 4. Fetch profiles for all members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', memberUserIds);

      const profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
      profiles?.forEach((p) => {
        profileMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
      });

      // 5. Fetch this week's workouts for ALL group members
      const weekStart = getWeekStart();
      const { data: weekWorkouts } = await supabase
        .from('workouts')
        .select('user_id, duration_minutes, performed_at')
        .in('user_id', memberUserIds)
        .gte('performed_at', weekStart)
        .order('performed_at', { ascending: false });

      // Build leaderboard
      const memberStats = new Map<string, { count: number; minutes: number }>();
      members.forEach((m) => {
        memberStats.set(m.user_id, { count: 0, minutes: 0 });
      });

      weekWorkouts?.forEach((w) => {
        const stats = memberStats.get(w.user_id);
        if (stats) {
          stats.count++;
          stats.minutes += w.duration_minutes || 0;
        }
      });

      const leaderboardEntries: LeaderboardEntry[] = Array.from(memberStats.entries())
        .map(([userId, stats]) => ({
          user_id: userId,
          display_name: profileMap.get(userId)?.display_name || 'Unknown',
          avatar_url: profileMap.get(userId)?.avatar_url || null,
          workout_count: stats.count,
          total_minutes: stats.minutes,
          is_current_user: userId === user.id,
        }))
        .sort((a, b) => b.workout_count - a.workout_count);

      setLeaderboard(leaderboardEntries);

      // Current user stats
      const myStats = memberStats.get(user.id);
      if (myStats) {
        setWorkoutsThisWeek(myStats.count);
        setTotalMinutesThisWeek(myStats.minutes);
      }

      // 6. Calculate streak for current user
      const { data: allMyWorkouts } = await supabase
        .from('workouts')
        .select('performed_at')
        .eq('user_id', user.id)
        .order('performed_at', { ascending: false })
        .limit(365);

      if (allMyWorkouts) {
        setStreak(calculateStreak(allMyWorkouts));
      }

      // 7. Fetch recent group activity (last 5 workouts)
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('id, user_id, name, workout_type, duration_minutes, performed_at')
        .in('user_id', memberUserIds)
        .order('performed_at', { ascending: false })
        .limit(5);

      if (recentWorkouts) {
        const recent: RecentActivity[] = recentWorkouts.map((w) => ({
          id: w.id,
          user_id: w.user_id,
          display_name: profileMap.get(w.user_id)?.display_name || 'Unknown',
          avatar_url: profileMap.get(w.user_id)?.avatar_url || null,
          name: w.name,
          workout_type: w.workout_type,
          duration_minutes: w.duration_minutes,
          performed_at: w.performed_at,
        }));
        setRecentActivity(recent);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, profile, activeGroupId]);

  // Refetch when active group changes
  useEffect(() => {
    if (!authLoading && user && profile && activeGroupId !== undefined) {
      fetchDashboardData(activeGroupId);
    }
  }, [authLoading, user, profile, activeGroupId]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No group joined — show onboarding prompt
  if (!loading && !group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏋️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome, {profile?.display_name || 'Athlete'}!
          </h1>
          <p className="text-muted-foreground">
            Get started by joining a group or creating your own.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/group/create"
            className="block bg-card border border-border rounded-xl p-6 text-center hover-lift transition-colors hover:border-primary"
          >
            <div className="text-3xl mb-3">➕</div>
            <h3 className="font-semibold text-foreground mb-1">Create a Group</h3>
            <p className="text-sm text-muted-foreground">
              Start your own workout group and invite friends
            </p>
          </Link>

          <Link
            href="/group/join"
            className="block bg-card border border-border rounded-xl p-6 text-center hover-lift transition-colors hover:border-primary"
          >
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-semibold text-foreground mb-1">Join a Group</h3>
            <p className="text-sm text-muted-foreground">
              Enter an invite code to join an existing group
            </p>
          </Link>
        </div>

        {/* Show personal stats even without a group */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Progress</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{workoutsThisWeek}</div>
              <div className="text-xs text-muted-foreground mt-1">Workouts This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{totalMinutesThisWeek}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Minutes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{streak}</div>
              <div className="text-xs text-muted-foreground mt-1">Day Streak 🔥</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-foreground mb-3">{error}</p>
          <button
            onClick={() => fetchDashboardData(activeGroupId)}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const maxLeaderboardCount = leaderboard.length > 0
    ? Math.max(...leaderboard.map((e) => e.workout_count))
    : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Group Switcher */}
      <div>
        <GroupSwitcher onSelect={handleGroupChange} />
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-24 mb-3" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-muted rounded w-40 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded mb-3" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ===== Section 1: Your Stats ===== */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Workouts this week */}
            <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-[3rem]" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Workouts This Week
              </p>
              <p className="text-3xl font-bold text-primary">{workoutsThisWeek}</p>
              {maxLeaderboardCount > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (workoutsThisWeek / Math.max(maxLeaderboardCount, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total minutes */}
            <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-info/10 rounded-bl-[3rem]" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Minutes
              </p>
              <p className="text-3xl font-bold text-info">{totalMinutesThisWeek}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {workoutsThisWeek > 0
                  ? `~${Math.round(totalMinutesThisWeek / workoutsThisWeek)} min avg`
                  : 'Log a workout'}
              </p>
            </div>

            {/* Streak */}
            <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-warning/10 rounded-bl-[3rem]" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Current Streak
              </p>
              <p className="text-3xl font-bold text-warning">
                {streak}
                <span className="text-lg ml-1">🔥</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {streak > 0 ? 'consecutive active days' : 'Start today!'}
              </p>
            </div>
          </div>

          {/* ===== Weight Tracker ===== */}
          <WeightTracker />

          {/* ===== Section 2: Group Leaderboard ===== */}
          {leaderboard.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                🏆 Weekly Leaderboard
              </h2>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      entry.is_current_user
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        index === 0
                          ? 'bg-warning/20 text-warning'
                          : index === 1
                          ? 'bg-muted text-muted-foreground'
                          : index === 2
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar / Initials */}
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.display_name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                        {entry.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          entry.is_current_user ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {entry.display_name}
                        {entry.is_current_user && (
                          <span className="text-xs ml-1 opacity-60">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total_minutes} min
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-24 sm:w-32 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              entry.is_current_user ? 'bg-primary' : 'bg-muted-foreground/40'
                            }`}
                            style={{
                              width: `${maxLeaderboardCount > 0
                                ? (entry.workout_count / maxLeaderboardCount) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground w-5 text-right">
                          {entry.workout_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== Section 3: Recent Activity ===== */}
          {recentActivity.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                📋 Recent Activity
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    {/* Workout type icon */}
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {getWorkoutTypeIcon(activity.workout_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.display_name}
                        {activity.duration_minutes != null && (
                          <> · {activity.duration_minutes} min</>
                        )}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {formatTimeAgo(activity.performed_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for leaderboard (group exists but no workouts) */}
          {leaderboard.length === 0 && !loading && group && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold text-foreground mb-1">
                No workouts yet this week
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to log a workout in {group.name}!
              </p>
              <Link href="/workouts/new" className="btn-primary inline-block">
                Log a Workout
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
