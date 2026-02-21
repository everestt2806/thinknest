"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  postId: string;
}

export function BookmarkButton({ postId }: BookmarkButtonProps) {
  const { profile } = useAuthStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    const check = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", profile.id)
        .eq("post_id", postId)
        .single();
      setIsBookmarked(!!data);
    };
    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, postId]);

  const toggleBookmark = async () => {
    if (!profile) {
      window.location.href = "/login";
      return;
    }

    if (isBookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", profile.id)
        .eq("post_id", postId);
      setIsBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({
        user_id: profile.id,
        post_id: postId,
      });
      setIsBookmarked(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={toggleBookmark}
    >
      <Bookmark
        className={cn(
          "h-5 w-5",
          isBookmarked && "fill-primary text-primary"
        )}
      />
    </Button>
  );
}
