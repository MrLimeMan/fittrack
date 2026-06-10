'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import WeightTracker from '@/components/WeightTracker';
import type { Workout, Group, GroupMember, Profile } from '@/lib/types';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  workout_count: number;
  total_minutes: number;
  is_current_user: boolean;
}

interface GroupData {
  id: string;
  name: string;
  leaderboard: LeaderboardEntry[];
  recentActivity: RecentActivity[];
  workoutsThisWeek: number;
  totalMinutesThisWeek: number;
}

interface RecentActivity {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  note: string;
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
  const [groupDataArray, setGroupDataArray] = useState<GroupData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [hasNoGroups, setHasNoGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch ALL user's group memberships
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError || !memberships || memberships.length === 0) {
        setHasNoGroups(true);

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

      setHasNoGroups(false);
      const groupIds = [...new Set(memberships.map((m) => m.group_id))];

      // 2. Fetch group details for all groups
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      // 3. Fetch ALL group members across all groups
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('user_id, group_id, role')
        .in('group_id', groupIds);

      // Get all unique member user IDs
      const allMemberUserIds = [
        ...new Set(allMembers?.map((m) => m.user_id) || []),
      ];

      if (allMemberUserIds.length === 0) {
        setGroupDataArray([]);
        setRecentActivity([]);
        setLoading(false);
        return;
      }

      // 4. Fetch profiles for all members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', allMemberUserIds);

      const profileMap = new Map<
        string,
        { display_name: string; avatar_url: string | null }
      >();
      profiles?.forEach((p) => {
        profileMap.set(p.id, {
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        });
      });

      // 5. Fetch this week's workouts for ALL members across all groups
      const weekStart = getWeekStart();
      const { data: allWeekWorkouts } = await supabase
        .from('workouts')
        .select(
          'id, user_id, note, workout_type, duration_minutes, performed_at'
        )
        .in('user_id', allMemberUserIds)
        .gte('performed_at', weekStart)
        .order('performed_at', { ascending: false });

      // 6. Fetch recent workouts (last 100) for all members across all groups
      const { data: allRecentWorkouts } = await supabase
        .from('workouts')
        .select(
          'id, user_id, note, workout_type, duration_minutes, performed_at'
        )
        .in('user_id', allMemberUserIds)
        .order('performed_at', { ascending: false })
        .limit(100);

      // 7. Build per-group leaderboards and recent activity
      const groupDataResults: GroupData[] = [];

      for (const groupInfo of groupsData || []) {
        const groupMembers =
          allMembers?.filter((m) => m.group_id === groupInfo.id) || [];
        const memberIds = groupMembers.map((m) => m.user_id);

        // Filter week workouts for this group's members
        const groupWeekWorkouts =
          allWeekWorkouts?.filter((w) => memberIds.includes(w.user_id)) || [];

        // Build member stats
        const memberStats = new Map<
          string,
          { count: number; minutes: number }
        >();
        groupMembers.forEach((m) => {
          memberStats.set(m.user_id, { count: 0, minutes: 0 });
        });

        groupWeekWorkouts.forEach((w) => {
          const stats = memberStats.get(w.user_id);
          if (stats) {
            stats.count++;
            stats.minutes += w.duration_minutes || 0;
          }
        });

        // Build leaderboard entries
        const leaderboard: LeaderboardEntry[] = Array.from(
          memberStats.entries()
        )
          .map(([userId, stats]) => ({
            user_id: userId,
            display_name: profileMap.get(userId)?.display_name || 'Unknown',
            avatar_url: profileMap.get(userId)?.avatar_url || null,
            workout_count: stats.count,
            total_minutes: stats.minutes,
            is_current_user: userId === user.id,
          }))
          .sort((a, b) => b.workout_count - a.workout_count);

        // Group's recent activity (last 5 from this group's members)
        const groupRecentWorkouts =
          allRecentWorkouts
            ?.filter((w) => memberIds.includes(w.user_id))
            .slice(0, 5) || [];
        const groupRecentActivity: RecentActivity[] =
          groupRecentWorkouts.map((w) => ({
            id: w.id,
            user_id: w.user_id,
            display_name: profileMap.get(w.user_id)?.display_name || 'Unknown',
            avatar_url: profileMap.get(w.user_id)?.avatar_url || null,
            note: w.note,
            workout_type: w.workout_type,
            duration_minutes: w.duration_minutes,
            performed_at: w.performed_at,
          }));

        // Group stats
        const groupWorkoutsCount = groupWeekWorkouts.length;
        const groupMinutes = groupWeekWorkouts.reduce(
          (sum, w) => sum + (w.duration_minutes || 0),
          0
        );

        groupDataResults.push({
          id: groupInfo.id,
          name: groupInfo.name,
          leaderboard,
          recentActivity: groupRecentActivity,
          workoutsThisWeek: groupWorkoutsCount,
          totalMinutesThisWeek: groupMinutes,
        });
      }

      setGroupDataArray(groupDataResults);

      // 8. Compute personal stats across ALL groups
      const myWeekWorkouts =
        allWeekWorkouts?.filter((w) => w.user_id === user.id) || [];
      setWorkoutsThisWeek(myWeekWorkouts.length);
      setTotalMinutesThisWeek(
        myWeekWorkouts.reduce(
          (sum, w) => sum + (w.duration_minutes || 0),
          0
        )
      );

      // 9. Calculate streak for current user
      const { data: allMyWorkouts } = await supabase
        .from('workouts')
        .select('performed_at')
        .eq('user_id', user.id)
        .order('performed_at', { ascending: false })
        .limit(365);

      if (allMyWorkouts) {
        setStreak(calculateStreak(allMyWorkouts));
      }

      // 10. Build combined recent activity (last 5 from ALL groups)
      const combinedRecent: RecentActivity[] = (allRecentWorkouts || [])
        .slice(0, 5)
        .map((w) => ({
          id: w.id,
          user_id: w.user_id,
          display_name: profileMap.get(w.user_id)?.display_name || 'Unknown',
          avatar_url: profileMap.get(w.user_id)?.avatar_url || null,
          note: w.note,
          workout_type: w.workout_type,
          duration_minutes: w.duration_minutes,
          performed_at: w.performed_at,
        }));

      setRecentActivity(combinedRecent);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Load dashboard on mount / auth change
  useEffect(() => {
    if (!authLoading && user && profile) {
      fetchDashboardData();
    }
  }, [authLoading, user, profile, fetchDashboardData]);

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

  // No groups joined — show onboarding prompt
  if (!loading && hasNoGroups) {
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
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Progress
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {workoutsThisWeek}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Workouts This Week
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {totalMinutesThisWeek}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total Minutes
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{streak}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Day Streak 🔥
              </div>
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
            onClick={() => fetchDashboardData()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Compute global max for progress bar in personal stats
  const allCounts = groupDataArray.flatMap((g) =>
    g.leaderboard.map((e) => e.workout_count)
  );
  const globalMaxCount = allCounts.length > 0 ? Math.max(...allCounts) : 1;

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
              <p className="text-3xl font-bold text-primary">
                {workoutsThisWeek}
              </p>
              {globalMaxCount > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (workoutsThisWeek / Math.max(globalMaxCount, 1)) *
                            100,
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
              <p className="text-3xl font-bold text-info">
                {totalMinutesThisWeek}
              </p>
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

          {/* ===== Section 2: Per-Group Leaderboards ===== */}
          {groupDataArray.map((groupData) => {
            const groupMaxCount =
              groupData.leaderboard.length > 0
                ? Math.max(...groupData.leaderboard.map((e) => e.workout_count))
                : 1;

            return (
              <div
                key={groupData.id}
                className="bg-card border border-border rounded-xl p-5"
              >
                {/* Group header */}
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  🏆 {groupData.name}
                </h2>

                {/* Group stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {groupData.workoutsThisWeek}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Workouts This Week
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-info">
                      {groupData.totalMinutesThisWeek}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Minutes
                    </p>
                  </div>
                </div>

                {/* Leaderboard */}
                {groupData.leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {groupData.leaderboard.map((entry, index) => (
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
                              entry.is_current_user
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            {entry.display_name}
                            {entry.is_current_user && (
                              <span className="text-xs ml-1 opacity-60">
                                (you)
                              </span>
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
                                  entry.is_current_user
                                    ? 'bg-primary'
                                    : 'bg-muted-foreground/40'
                                }`}
                                style={{
                                  width: `${groupMaxCount > 0 ? (entry.workout_count / groupMaxCount) * 100 : 0}%`,
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
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      No workouts yet this week
                    </p>
                    <Link
                      href="/workouts/new"
                      className="text-sm text-primary hover:underline"
                    >
                      Log a Workout
                    </Link>
                  </div>
                )}

                {/* Group recent activity */}
                {groupData.recentActivity.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {groupData.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0">
                            {getWorkoutTypeIcon(activity.workout_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {activity.note}
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
              </div>
            );
          })}

          {/* ===== Section 3: Combined Recent Activity ===== */}
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
                        {activity.note}
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
        </>
      )}
    </div>
  );
}
