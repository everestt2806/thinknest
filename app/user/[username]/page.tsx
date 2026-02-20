export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, LinkIcon, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/post/post-card";
import { FollowButton } from "@/components/shared/follow-button";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { PostWithAuthor } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, bio")
    .eq("username", username)
    .single();

  if (!profile) return { title: "Không tìm thấy" };
  return {
    title: profile.display_name || profile.username,
    description: profile.bio || `Trang cá nhân của ${profile.display_name || profile.username}`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(*), categories(*)")
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  const { data: series } = await supabase
    .from("series")
    .select("*, posts(count)")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  const joinDate = format(new Date(profile.created_at), "MMMM yyyy", {
    locale: vi,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={profile.avatar_url || undefined}
                  alt={profile.display_name || profile.username}
                />
                <AvatarFallback className="text-3xl">
                  {(profile.display_name || profile.username)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  <FollowButton userId={profile.id} />
                </div>
                {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Tham gia {joinDate}
                  </span>
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <LinkIcon className="h-4 w-4" />
                      {profile.website.replace(/https?:\/\//, "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {profile.karma} karma
                  </span>
                </div>
                <div className="mt-3 flex justify-center gap-6 text-sm sm:justify-start">
                  <span>
                    <strong>{posts?.length || 0}</strong>{" "}
                    <span className="text-muted-foreground">bài viết</span>
                  </span>
                  <span>
                    <strong>{followerCount || 0}</strong>{" "}
                    <span className="text-muted-foreground">người theo dõi</span>
                  </span>
                  <span>
                    <strong>{followingCount || 0}</strong>{" "}
                    <span className="text-muted-foreground">đang theo dõi</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts">
          <TabsList className="mb-6">
            <TabsTrigger value="posts">
              Bài viết ({posts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="series">
              Series ({series?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post as PostWithAuthor} />
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Chưa có bài viết nào
              </p>
            )}
          </TabsContent>

          <TabsContent value="series" className="space-y-4">
            {series && series.length > 0 ? (
              series.map((s) => (
                <Link
                  key={s.id}
                  href={`/user/${username}/series/${s.slug}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <h3 className="font-semibold">{s.title}</h3>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {(s.posts as { count: number }[])?.[0]?.count || 0} bài viết
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Chưa có series nào
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
