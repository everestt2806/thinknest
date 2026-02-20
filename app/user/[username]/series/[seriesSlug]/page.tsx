export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string; seriesSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, seriesSlug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();
  if (!profile) return { title: "Không tìm thấy" };

  const { data: series } = await supabase
    .from("series")
    .select("title, description")
    .eq("author_id", profile.id)
    .eq("slug", seriesSlug)
    .single();

  if (!series) return { title: "Không tìm thấy" };
  return { title: series.title, description: series.description || undefined };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { username, seriesSlug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("author_id", profile.id)
    .eq("slug", seriesSlug)
    .single();

  if (!series) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, reading_time, published_at, vote_score, series_order")
    .eq("series_id", series.id)
    .eq("status", "published")
    .order("series_order", { ascending: true })
    .order("published_at", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Link
          href={`/user/${username}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang cá nhân
        </Link>

        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">
            <BookOpen className="mr-1.5 h-3 w-3" />
            Series
          </Badge>
          <h1 className="text-3xl font-bold mb-3">{series.title}</h1>
          {series.description && (
            <p className="text-muted-foreground">{series.description}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Link
              href={`/user/${username}`}
              className="flex items-center gap-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {profile.display_name || profile.username}
              </span>
            </Link>
            <span className="text-sm text-muted-foreground">
              · {posts?.length || 0} bài viết
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {posts?.map((post, index) => (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{post.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {post.reading_time} phút đọc · {post.vote_score} điểm
                </p>
              </div>
            </Link>
          ))}
          {(!posts || posts.length === 0) && (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có bài viết trong series này
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
