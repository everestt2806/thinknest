import Link from "next/link";
import { ArrowRight, PenSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/constants";
import type { PostWithAuthor } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface HeroSectionProps {
  featuredPost: PostWithAuthor | null;
}

export function HeroSection({ featuredPost }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/5 via-primary/2 to-transparent border">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)/0.08,transparent_70%)]" />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-12">
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Nền tảng chia sẻ tri thức
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Góc nhìn đa chiều từ cộng đồng{" "}
            <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </h1>

          <p className="mb-8 max-w-md text-base text-muted-foreground sm:text-lg">
            Nơi mỗi quan điểm đều có giá trị. Khám phá, chia sẻ và kết nối với
            cộng đồng tư duy sáng tạo.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#feed">
                Khám phá ngay
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/write">
                <PenSquare className="mr-2 h-4 w-4" />
                Viết bài
              </Link>
            </Button>
          </div>
        </div>

        {featuredPost && (
          <Link
            href={`/post/${featuredPost.slug}`}
            className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
          >
            {featuredPost.cover_image ? (
              <div className="aspect-16/10 overflow-hidden">
                <img
                  src={featuredPost.cover_image}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-16/10 bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-6xl font-black text-primary/20">T</span>
              </div>
            )}
            <div className="p-5">
              <div className="mb-2 flex items-center gap-2">
                {featuredPost.categories && (
                  <Badge variant="secondary" className="text-xs">
                    {featuredPost.categories.icon} {featuredPost.categories.name}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(featuredPost.published_at || featuredPost.created_at),
                    { addSuffix: true, locale: vi }
                  )}
                </span>
              </div>
              <h2 className="mb-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary sm:text-xl line-clamp-2">
                {featuredPost.title}
              </h2>
              {featuredPost.excerpt && (
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {featuredPost.excerpt}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={featuredPost.profiles.avatar_url || undefined}
                    alt={featuredPost.profiles.display_name || featuredPost.profiles.username}
                  />
                  <AvatarFallback className="text-xs">
                    {(featuredPost.profiles.display_name || featuredPost.profiles.username)
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {featuredPost.profiles.display_name || featuredPost.profiles.username}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {featuredPost.reading_time} phút đọc
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
