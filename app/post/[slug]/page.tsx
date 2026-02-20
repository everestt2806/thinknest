export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Eye, Calendar, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { VoteButton } from "@/components/shared/vote-button";
import { BookmarkButton } from "@/components/shared/bookmark-button";
import { ShareButton } from "@/components/shared/share-button";
import { CommentSection } from "@/components/comment/comment-section";
import { FollowButton } from "@/components/shared/follow-button";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image")
    .eq("slug", slug)
    .single();

  if (!post) return { title: "Không tìm thấy bài viết" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles (*),
      categories (*)
    `
    )
    .eq("slug", slug)
    .single();

  if (!post) notFound();

  // Fetch tags
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("tags (*)")
    .eq("post_id", post.id);

  // Fetch comment count
  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  // Fetch related posts (same category)
  const { data: relatedPosts } = await supabase
    .from("posts")
    .select("id, title, slug, reading_time, published_at, profiles(username, display_name, avatar_url)")
    .eq("status", "published")
    .eq("category_id", post.category_id || "")
    .neq("id", post.id)
    .order("vote_score", { ascending: false })
    .limit(4);

  // Follower count
  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", post.author_id);

  // Post count for author
  const { count: authorPostCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", post.author_id)
    .eq("status", "published");

  // Increment view
  await supabase
    .from("posts")
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq("id", post.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = postTags?.map((pt: any) => pt.tags).filter(Boolean) || [];

  const publishDate = post.published_at
    ? format(new Date(post.published_at), "dd/MM/yyyy", { locale: vi })
    : null;

  const timeAgo = post.published_at
    ? formatDistanceToNow(new Date(post.published_at), {
        addSuffix: true,
        locale: vi,
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <article className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Trang chủ
        </Link>

        {post.cover_image && (
          <div className="mb-8 aspect-[2.5/1] overflow-hidden rounded-xl">
            <img
              src={post.cover_image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {post.categories && (
          <Link href={`/category/${post.categories.slug}`}>
            <Badge variant="secondary" className="mb-4">
              {post.categories.icon} {post.categories.name}
            </Badge>
          </Link>
        )}

        <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">
          {post.title}
        </h1>

        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link
            href={`/user/${post.profiles.username}`}
            className="flex items-center gap-2"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.profiles.avatar_url || undefined}
                alt={post.profiles.display_name || post.profiles.username}
              />
              <AvatarFallback>
                {(post.profiles.display_name || post.profiles.username)
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {post.profiles.display_name || post.profiles.username}
              </p>
              <p className="text-xs">@{post.profiles.username}</p>
            </div>
          </Link>
          {publishDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {publishDate} ({timeAgo})
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.reading_time} phút đọc
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.view_count + 1} lượt xem
          </span>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <VoteButton
            postId={post.id}
            initialScore={post.vote_score}
            orientation="horizontal"
          />
          <BookmarkButton postId={post.id} />
          <ShareButton url={`/post/${post.slug}`} title={post.title} />
        </div>

        <Separator className="mb-8" />

        <div
          className="post-content mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {tags.map((tag: { id: string; name: string; slug: string }) => (
              <Link key={tag.id} href={`/search?tag=${tag.slug}`}>
                <Badge variant="outline">#{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        <Separator className="mb-8" />

        {/* Author Card */}
        <Card className="mb-8">
          <CardContent className="flex items-start gap-4 p-6">
            <Link href={`/user/${post.profiles.username}`}>
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={post.profiles.avatar_url || undefined}
                  alt={post.profiles.display_name || post.profiles.username}
                />
                <AvatarFallback className="text-xl">
                  {(post.profiles.display_name || post.profiles.username)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/user/${post.profiles.username}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {post.profiles.display_name || post.profiles.username}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    @{post.profiles.username}
                  </p>
                </div>
                <FollowButton userId={post.author_id} />
              </div>
              {post.profiles.bio && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {post.profiles.bio}
                </p>
              )}
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>{authorPostCount || 0} bài viết</span>
                <span>{followerCount || 0} người theo dõi</span>
                <span>{post.profiles.karma} karma</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div id="comments">
          <CommentSection postId={post.id} commentCount={commentCount || 0} />
        </div>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold">Bài viết liên quan</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/post/${rp.slug}`}
                  className="rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <h4 className="font-medium line-clamp-2">{rp.title}</h4>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{(() => { const p = rp.profiles as unknown as { display_name?: string; username: string }; return p?.display_name || p?.username; })()}</span>
                    <span>·</span>
                    <span>{rp.reading_time} phút đọc</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
