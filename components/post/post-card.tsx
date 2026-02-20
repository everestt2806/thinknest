import Link from "next/link";
import { Clock, MessageCircle, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VoteButton } from "@/components/shared/vote-button";
import { BookmarkButton } from "@/components/shared/bookmark-button";
import type { PostWithAuthor } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface PostCardProps {
  post: PostWithAuthor;
  commentCount?: number;
}

export function PostCard({ post, commentCount = 0 }: PostCardProps) {
  const timeAgo = formatDistanceToNow(
    new Date(post.published_at || post.created_at),
    { addSuffix: true, locale: vi }
  );

  return (
    <Card className="group overflow-hidden border bg-card transition-shadow hover:shadow-md">
      <div className="flex">
        <div className="flex flex-col items-center py-4 pl-3 pr-1">
          <VoteButton postId={post.id} initialScore={post.vote_score} />
        </div>

        <div className="flex-1 p-4 pl-2">
          <div className="mb-2 flex items-center gap-2">
            <Link
              href={`/user/${post.profiles.username}`}
              className="flex items-center gap-2"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={post.profiles.avatar_url || undefined}
                  alt={post.profiles.display_name || post.profiles.username}
                />
                <AvatarFallback className="text-xs">
                  {(post.profiles.display_name || post.profiles.username)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hover:text-primary transition-colors">
                {post.profiles.display_name || post.profiles.username}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {post.categories && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <Link href={`/category/${post.categories.slug}`}>
                  <Badge variant="secondary" className="text-xs">
                    {post.categories.icon} {post.categories.name}
                  </Badge>
                </Link>
              </>
            )}
          </div>

          <Link href={`/post/${post.slug}`} className="block">
            <h2 className="mb-2 text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </Link>

          {post.cover_image && (
            <Link href={`/post/${post.slug}`} className="block mb-3">
              <div className="relative aspect-[2.5/1] overflow-hidden rounded-lg">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              </div>
            </Link>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time} phút đọc
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.view_count}
              </span>
              <Link
                href={`/post/${post.slug}#comments`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {commentCount}
              </Link>
            </div>
            <BookmarkButton postId={post.id} />
          </div>
        </div>
      </div>
    </Card>
  );
}
