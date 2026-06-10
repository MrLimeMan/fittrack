'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Copy,
  Check,
  LogOut,
  Users,
  Activity,
  Pencil,
  Plus,
  LogIn,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import ThemeToggle from '@/components/ThemeToggle';
import AvatarUpload from '@/components/AvatarUpload';
import type { Group, GroupMember } from '@/lib/types';

const STORAGE_KEY = 'fittrack_active_group';

interface GroupWithInvite extends Group {
  invite_code: string;
  member_count: number;
  role: string;
}

interface MemberWithProfile extends GroupMember {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [groups, setGroups] = useState<GroupWithInvite[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<MemberWithProfile[]>([]);
  const [memberWorkoutCounts, setMemberWorkoutCounts] = useState<Record<string, number>>({});
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [confirmLeaveGroupId, setConfirmLeaveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpdate = (newUrl: string) => {
    setAvatarUrl(newUrl);
  };

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const fetchAllGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all group memberships
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);

      // Get group details with invite codes
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (!groupsData) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Get member counts for each group
      const groupsWithDetails: GroupWithInvite[] = [];

      for (const group of groupsData) {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const membership = memberships.find((m) => m.group_id === group.id);

        groupsWithDetails.push({
          ...group,
          member_count: count || 0,
          role: membership?.role || 'member',
        });
      }

      setGroups(groupsWithDetails);

      // Load active group from localStorage
      const savedGroupId = localStorage.getItem(STORAGE_KEY);
      if (savedGroupId && groupsWithDetails.some((g) => g.id === savedGroupId)) {
        setActiveGroupId(savedGroupId);
      } else if (groupsWithDetails.length > 0) {
        setActiveGroupId(groupsWithDetails[0].id);
        localStorage.setItem(STORAGE_KEY, groupsWithDetails[0].id);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllGroups();
    }
  }, [user, fetchAllGroups]);

  const fetchGroupMembers = useCallback(async (groupId: string) => {
    const { data: memberData } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles!user_id (id, display_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (memberData) {
      setSelectedGroupMembers(memberData as unknown as MemberWithProfile[]);

      // Get workout counts for each member in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const counts: Record<string, number> = {};

      for (const member of memberData) {
        const { count } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', member.user_id)
          .eq('group_id', groupId)
          .gte('created_at', sevenDaysAgo);

        counts[member.user_id] = count || 0;
      }

      setMemberWorkoutCounts(counts);
    }
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      fetchGroupMembers(activeGroupId);
    }
  }, [activeGroupId, fetchGroupMembers]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;

    setSavingName(true);
    try {
      await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      setEditingName(false);
    } catch (err) {
      console.error('Error updating name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const handleCopyCode = (code: string, groupId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedGroupId(groupId);
    setTimeout(() => setCopiedGroupId(null), 2000);
  };

  const handleSetActive = (groupId: string) => {
    setActiveGroupId(groupId);
    localStorage.setItem(STORAGE_KEY, groupId);
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    setLeavingGroupId(groupId);
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      // If we left the active group, clear it
      if (activeGroupId === groupId) {
        localStorage.removeItem(STORAGE_KEY);
        setActiveGroupId(null);
      }

      // Refresh the list
      await fetchAllGroups();
    } catch (err) {
      console.error('Error leaving group:', err);
    } finally {
      setLeavingGroupId(null);
      setConfirmLeaveGroupId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <ThemeToggle />
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Profile Info Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            {user && (
              <AvatarUpload
                user={user}
                profile={avatarUrl ? { ...profile!, avatar_url: avatarUrl } : profile}
                onAvatarUpdate={handleAvatarUpdate}
              />
            )}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !displayName.trim()}
                    className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {profile?.display_name || 'Set your name'}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* My Groups Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">My Groups</h3>
              {!loading && (
                <span className="text-sm text-muted-foreground">
                  ({groups.length})
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                You are not in any groups yet.
              </p>
              <div className="flex gap-3 justify-center">
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
                  <LogIn className="w-4 h-4" />
                  Join Group
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    activeGroupId === group.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">
                          {group.name}
                        </p>
                        {activeGroupId === group.id && (
                          <Star className="w-4 h-4 text-primary fill-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {group.member_count} {group.member_count === 1 ? 'member' : 'members'} · {group.role}
                      </p>

                      {/* Invite Code */}
                      <div className="flex items-center gap-2 mb-3">
                        <code className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground select-all">
                          {group.invite_code || 'N/A'}
                        </code>
                        <button
                          onClick={() => handleCopyCode(group.invite_code || '', group.id)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          title="Copy invite code"
                        >
                          {copiedGroupId === group.id ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {activeGroupId !== group.id && (
                          <button
                            onClick={() => handleSetActive(group.id)}
                            className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            Set Active
                          </button>
                        )}

                        {confirmLeaveGroupId === group.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-destructive">Leave this group?</span>
                            <button
                              onClick={() => handleLeaveGroup(group.id)}
                              disabled={leavingGroupId === group.id}
                              className="px-2 py-1 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                              {leavingGroupId === group.id ? 'Leaving...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmLeaveGroupId(null)}
                              className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs font-medium hover:bg-muted/80 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmLeaveGroupId(group.id)}
                            className="px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-md text-xs font-medium transition-colors"
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members List (for active group) */}
        {activeGroupId && selectedGroupMembers.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Active Group Members</h3>
              <span className="text-sm text-muted-foreground">
                ({selectedGroupMembers.length})
              </span>
            </div>

            <div className="space-y-3">
              {selectedGroupMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.profiles?.display_name || 'Anonymous'}
                        {member.user_id === user?.id && (
                          <span className="text-muted-foreground font-normal">
                            {' '}
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                    <span>
                      {memberWorkoutCounts[member.user_id] || 0} this week
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Link
              href="/group/create"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </Link>
            <Link
              href="/group/join"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors border border-border"
            >
              <LogIn className="w-4 h-4" />
              Join Group
            </Link>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 bg-muted text-foreground border border-border rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
