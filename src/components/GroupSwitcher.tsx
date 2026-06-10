'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, Users, Check, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

const STORAGE_KEY = 'fittrack_active_group';

interface GroupWithCount {
  id: string;
  name: string;
  member_count: number;
}

interface GroupSwitcherProps {
  onSelect: (groupId: string | null) => void;
}

export default function GroupSwitcher({ onSelect }: GroupSwitcherProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchGroups() {
      try {
        // Get all group memberships
        const { data: memberships, error } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user!.id);

        if (error || !memberships || memberships.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        const groupIds = memberships.map((m) => m.group_id);

        // Fetch group details
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);

        if (!groupData) {
          setGroups([]);
          setLoading(false);
          return;
        }

        // Get member counts for each group
        const groupsWithCount: GroupWithCount[] = [];

        for (const group of groupData) {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          groupsWithCount.push({
            id: group.id,
            name: group.name,
            member_count: count || 0,
          });
        }

        setGroups(groupsWithCount);

        // Check localStorage for active group
        const savedGroupId = localStorage.getItem(STORAGE_KEY);

        if (savedGroupId && groupsWithCount.some((g) => g.id === savedGroupId)) {
          setActiveGroupId(savedGroupId);
        } else if (groupsWithCount.length > 0) {
          // Default to first group
          setActiveGroupId(groupsWithCount[0].id);
          localStorage.setItem(STORAGE_KEY, groupsWithCount[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setLoading(false);
      }
    }

    fetchGroups();
  }, [user]);

  // Notify parent when active group changes
  useEffect(() => {
    if (activeGroupId !== null || groups.length === 0) {
      onSelect(activeGroupId);
    }
  }, [activeGroupId, groups.length, onSelect]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((groupId: string | null) => {
    setActiveGroupId(groupId);
    localStorage.setItem(STORAGE_KEY, groupId || '');
    setIsOpen(false);
  }, []);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  if (loading) {
    return (
      <div className="h-10 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          You&apos;re not in any groups yet
        </p>
        <Link
          href="/group/create"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Create or Join a Group
        </Link>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative w-full sm:w-auto">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium truncate">
            {activeGroup?.name || 'Select Group'}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({activeGroup?.member_count || 0})
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {/* All Groups option */}
          <button
            onClick={() => handleSelect(null)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">All Groups</span>
            </div>
            {activeGroupId === null && (
              <Check className="w-4 h-4 text-primary shrink-0" />
            )}
          </button>

          <div className="border-t border-border" />

          {/* Individual groups */}
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleSelect(group.id)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-foreground block truncate">
                    {group.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
              {activeGroupId === group.id && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-border" />

          {/* Create Group link */}
          <Link
            href="/group/create"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Group</span>
          </Link>
        </div>
      )}
    </div>
  );
}
