import Link from "next/link";
import { Clock, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PostWithAuthor } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface FeaturedPostsProps {
  posts: PostWithAuthor[];
}

function FeaturedCard({ post, large = false }: { post: PostWithAuthor; large?: boolean }) {
  const timeAgo = formatDistanceToNow(
    new Date(post.published_at || post.created_at),
    { addSuffix: true, locale: vi }
  );

  return (
    <Link
      href={`/post/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
    >
      {post.cover_image ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center">
          <span className={`font-black text-primary/15 ${large ? "text-8xl" : "text-5xl"}`}>T</span>
        </div>
      )}

      <div className={`flex flex-1 flex-col justify-between ${large ? "p-5 sm:p-6" : "p-4"}`}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {post.categories && (
              <Badge variant="secondary" className="text-xs">
                {post.categories.icon} {post.categories.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <h3
            className={`mb-2 font-bold leading-snug transition-colors group-hover:text-primary line-clamp-2 ${
              large ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p className={`text-muted-foreground line-clamp-2 ${large ? "text-sm sm:text-base mb-4" : "text-sm mb-3"}`}>
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-5 w-5">
            <AvatarImage
              src={post.profiles.avatar_url || undefined}
              alt={post.profiles.display_name || post.profiles.username}
            />
            <AvatarFallback className="text-[10px]">
              {(post.profiles.display_name || post.profiles.username)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {post.profiles.display_name || post.profiles.username}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {post.reading_time} phút
          </span>
        </div>
      </div>
    </Link>
  );
}

export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  if (posts.length === 0) return null;

  const [main, ...rest] = posts;

  return (
    <section className="landing-section">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Nổi bật tuần này</h2>
          <p className="text-sm text-muted-foreground">Được cộng đồng yêu thích nhất</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FeaturedCard post={main} large />
        </div>
        {rest.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {rest.map((post) => (
              <FeaturedCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
