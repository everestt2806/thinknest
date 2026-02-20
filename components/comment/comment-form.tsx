"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus,
}: CommentFormProps) {
  const { profile } = useAuthStore();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: profile.id,
      parent_id: parentId || null,
      content: content.trim(),
    });

    if (!error) {
      setContent("");
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={profile.avatar_url || undefined}
          alt={profile.display_name || profile.username}
        />
        <AvatarFallback className="text-xs">
          {(profile.display_name || profile.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          placeholder={parentId ? "Viết phản hồi..." : "Viết bình luận..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={parentId ? 2 : 3}
          autoFocus={autoFocus}
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gửi
          </Button>
        </div>
      </div>
    </form>
  );
}
