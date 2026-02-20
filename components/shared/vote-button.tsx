"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  postId?: string;
  commentId?: string;
  initialScore: number;
  orientation?: "horizontal" | "vertical";
}

export function VoteButton({
  postId,
  commentId,
  initialScore,
  orientation = "vertical",
}: VoteButtonProps) {
  const { profile } = useAuthStore();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    const fetchVote = async () => {
      let query = supabase
        .from("votes")
        .select("value")
        .eq("user_id", profile.id);

      if (postId) query = query.eq("post_id", postId);
      if (commentId) query = query.eq("comment_id", commentId);

      const { data } = await query.single();
      if (data) setUserVote(data.value);
    };
    fetchVote();
  }, [profile, postId, commentId, supabase]);

  const handleVote = async (value: number) => {
    if (!profile) {
      window.location.href = "/login";
      return;
    }

    const newValue = userVote === value ? 0 : value;
    const scoreDiff = newValue - userVote;

    setUserVote(newValue);
    setScore((prev) => prev + scoreDiff);

    if (newValue === 0) {
      let query = supabase
        .from("votes")
        .delete()
        .eq("user_id", profile.id);
      if (postId) query = query.eq("post_id", postId);
      if (commentId) query = query.eq("comment_id", commentId);
      await query;
    } else if (userVote === 0) {
      await supabase.from("votes").insert({
        user_id: profile.id,
        post_id: postId || null,
        comment_id: commentId || null,
        value: newValue,
      });
    } else {
      let query = supabase
        .from("votes")
        .update({ value: newValue })
        .eq("user_id", profile.id);
      if (postId) query = query.eq("post_id", postId);
      if (commentId) query = query.eq("comment_id", commentId);
      await query;
    }
  };

  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        isVertical ? "flex-col" : "flex-row"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          userVote === 1 && "text-primary bg-primary/10"
        )}
        onClick={() => handleVote(1)}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
      <span
        className={cn(
          "text-sm font-semibold min-w-[2ch] text-center",
          userVote === 1 && "text-primary",
          userVote === -1 && "text-destructive"
        )}
      >
        {score}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          userVote === -1 && "text-destructive bg-destructive/10"
        )}
        onClick={() => handleVote(-1)}
      >
        <ChevronDown className="h-5 w-5" />
      </Button>
    </div>
  );
}
