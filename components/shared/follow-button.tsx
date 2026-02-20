"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

interface FollowButtonProps {
  userId: string;
}

export function FollowButton({ userId }: FollowButtonProps) {
  const { profile } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!profile || profile.id === userId) return;
    const check = async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", profile.id)
        .eq("following_id", userId)
        .single();
      setIsFollowing(!!data);
    };
    check();
  }, [profile, userId, supabase]);

  if (!profile || profile.id === userId) return null;

  const toggleFollow = async () => {
    setLoading(true);
    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", profile.id)
        .eq("following_id", userId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: profile.id,
        following_id: userId,
      });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={toggleFollow}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserCheck className="mr-1.5 h-4 w-4" />
          Đang theo dõi
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Theo dõi
        </>
      )}
    </Button>
  );
}
