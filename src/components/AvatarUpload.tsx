'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface AvatarUploadProps {
  user: User;
  profile: Profile | null;
  onAvatarUpdate: (newUrl: string) => void;
}

function getInitial(name: string | null, email: string | null): string {
  const source = name || email || '';
  return source.charAt(0).toUpperCase() || '?';
}

function getInitialColor(id: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

async function resizeImage(file: File, maxSize = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height / width) * maxSize);
          width = maxSize;
        } else {
          width = Math.round((width / height) * maxSize);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export default function AvatarUpload({
  user,
  profile,
  onAvatarUpdate,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset the input so the same file can be selected again
      e.target.value = '';

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      setUploading(true);

      try {
        // Resize the image client-side
        const resizedBlob = await resizeImage(file, 200);

        // Upload to Supabase Storage
        const filePath = `${user.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, resizedBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        // Add cache-busting query param so the browser picks up the new image
        const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

        // Update the profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        onAvatarUpdate(cacheBustedUrl);
      } catch (err) {
        console.error('Error uploading avatar:', err);
      } finally {
        setUploading(false);
      }
    },
    [user, onAvatarUpdate]
  );

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const initial = getInitial(profile?.display_name ?? null, user.email ?? null);
  const colorClass = getInitialColor(user.id);

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleClick}
        className="group relative w-24 h-24 rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        disabled={uploading}
        title="Change photo"
      >
        {/* Avatar image or placeholder */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full ${colorClass} flex items-center justify-center`}
          >
            <span className="text-3xl font-bold text-white select-none">
              {initial}
            </span>
          </div>
        )}

        {/* Camera overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </button>
    </div>
  );
}
