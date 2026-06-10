'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Copy,
  Check,
  LogOut,
  Users,
  Activity,
  Pencil,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import ThemeToggle from '@/components/ThemeToggle';
import AvatarUpload from '@/components/AvatarUpload';
import type { Group, GroupMember } from '@/lib/types';

interface GroupWithInvite extends Group {
  invite_code: string;
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
  const [copied, setCopied] = useState(false);

  const [group, setGroup] = useState<GroupWithInvite | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [memberWorkoutCounts, setMemberWorkoutCounts] = useState<
    Record<string, number>
  >({});
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  const fetchGroupData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user's group membership
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) {
        setLoading(false);
        return;
      }

      // Get group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', membership.group_id)
        .single();

      if (groupData) {
        setGroup(groupData as GroupWithInvite);
      }

      // Get all members with profile info
      const { data: memberData } = await supabase
        .from('group_members')
        .select(
          `
          *,
          profiles!user_id (id, display_name, avatar_url)
        `
        )
        .eq('group_id', membership.group_id)
        .order('joined_at', { ascending: true });

      if (memberData) {
        setMembers(memberData as unknown as MemberWithProfile[]);

        // Get workout counts for each member in the last 7 days
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        const counts: Record<string, number> = {};

        for (const member of memberData) {
          const { count } = await supabase
            .from('workouts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', member.user_id)
            .eq('group_id', membership.group_id)
            .gte('created_at', sevenDaysAgo);

          counts[member.user_id] = count || 0;
        }

        setMemberWorkoutCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching group data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGroupData();
    }
  }, [user, fetchGroupData]);

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

  const handleCopyCode = () => {
    if (!group?.invite_code) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveGroup = async () => {
    if (!user || !group) return;

    setLeavingGroup(true);
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', user.id);

      setGroup(null);
      setMembers([]);
    } catch (err) {
      console.error('Error leaving group:', err);
    } finally {
      setLeavingGroup(false);
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

        {/* Group Info Card */}
        {group && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Your Group</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Group Name</p>
                <p className="font-medium text-foreground">{group.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Invite Code
                </p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground select-all">
                    {group.invite_code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Copy invite code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this code with friends to invite them
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        {members.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Members</h3>
              <span className="text-sm text-muted-foreground">
                ({members.length})
              </span>
            </div>

            <div className="space-y-3">
              {members.map((member) => (
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

        {/* No Group Message */}
        {!loading && !group && (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              You are not in a group yet.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {group && (
            <button
              onClick={handleLeaveGroup}
              disabled={leavingGroup}
              className="w-full py-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {leavingGroup ? 'Leaving...' : 'Leave Group'}
            </button>
          )}

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
