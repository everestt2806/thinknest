"use client";

import { useState } from "react";
import Link from "next/link";
import { Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/shared/vote-button";
import { CommentForm } from "./comment-form";
import type { CommentWithAuthor } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface CommentItemProps {
  comment: CommentWithAuthor;
  postId: string;
  onReplyAdded: () => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  onReplyAdded,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div className={isReply ? "ml-10 mt-3" : ""}>
      <div className="flex gap-3">
        <Link href={`/user/${comment.profiles.username}`}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={comment.profiles.avatar_url || undefined}
              alt={
                comment.profiles.display_name || comment.profiles.username
              }
            />
            <AvatarFallback className="text-xs">
              {(
                comment.profiles.display_name || comment.profiles.username
              )
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="rounded-lg bg-accent/50 px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <Link
                href={`/user/${comment.profiles.username}`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {comment.profiles.display_name || comment.profiles.username}
              </Link>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <p
              className="text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: comment.content.replace(
                  /@(\w+)/g,
                  '<a href="/user/$1" class="font-medium text-primary hover:underline">@$1</a>'
                ),
              }}
            />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <VoteButton
              commentId={comment.id}
              initialScore={comment.vote_score}
              orientation="horizontal"
            />
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="mr-1 h-3 w-3" />
                Phản hồi
              </Button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={() => {
                  setShowReplyForm(false);
                  onReplyAdded();
                }}
                onCancel={() => setShowReplyForm(false)}
                autoFocus
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReplyAdded={onReplyAdded}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
