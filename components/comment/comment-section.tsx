"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import type { CommentWithAuthor } from "@/types/database";

interface CommentSectionProps {
  postId: string;
  commentCount: number;
}

export function CommentSection({ postId, commentCount }: CommentSectionProps) {
  const { profile } = useAuthStore();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [count, setCount] = useState(commentCount);
  const supabase = createClient();

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("post_id", postId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (data) {
      const commentsWithReplies = await Promise.all(
        data.map(async (comment: Record<string, unknown>) => {
          const { data: replies } = await supabase
            .from("comments")
            .select("*, profiles(*)")
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });
          return { ...comment, replies: replies || [] } as CommentWithAuthor;
        })
      );
      setComments(commentsWithReplies);
    }
  }, [postId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentAdded = () => {
    fetchComments();
    setCount((prev) => prev + 1);
  };

  return (
    <div>
      <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
        <MessageCircle className="h-5 w-5" />
        Bình luận ({count})
      </h3>

      {profile ? (
        <CommentForm postId={postId} onSuccess={handleCommentAdded} />
      ) : (
        <p className="mb-6 rounded-lg border p-4 text-center text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </a>{" "}
          để tham gia bình luận
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReplyAdded={handleCommentAdded}
          />
        ))}
        {comments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        )}
      </div>
    </div>
  );
}
