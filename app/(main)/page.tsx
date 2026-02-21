import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { POSTS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";
import { PenSquare } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import { PostListInfinite } from "@/components/shared/post-list-infinite";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedPosts } from "@/components/home/featured-posts";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { TopWriters } from "@/components/home/top-writers";

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { sort = "hot" } = await searchParams;

  const supabase = await createClient();

  // --- Hero: top post by vote_score ---
  const { data: heroPost } = await supabase
    .from("posts")
    .select("*, profiles(*), categories(*)")
    .eq("status", "published")
    .not("cover_image", "is", null)
    .order("vote_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  // --- Featured: top 3 posts of the week (excluding hero) ---
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let featuredQuery = supabase
    .from("posts")
    .select("*, profiles(*), categories(*)")
    .eq("status", "published")
    .gte("published_at", weekAgo)
    .order("vote_score", { ascending: false })
    .order("view_count", { ascending: false })
    .limit(4);

  if (heroPost) {
    featuredQuery = featuredQuery.neq("id", heroPost.id);
  }
  const { data: featuredRaw } = await featuredQuery;
  const featuredPosts = ((featuredRaw || []) as PostWithAuthor[]).slice(0, 3);

  // --- Category post counts ---
  const { data: categoryCounts } = await supabase
    .from("categories")
    .select("slug, post_count");
  const categoryPostCounts: Record<string, number> = {};
  if (categoryCounts) {
    categoryCounts.forEach((c: Record<string, unknown>) => {
      categoryPostCounts[c.slug as string] = (c.post_count as number) || 0;
    });
  }

  // --- Top writers ---
  const { data: topWriters } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio, karma")
    .order("karma", { ascending: false })
    .limit(6);

  // --- Feed posts ---
  let query = supabase
    .from("posts")
    .select("*, profiles(*), categories(*)", { count: "exact" })
    .eq("status", "published")
    .range(0, POSTS_PER_PAGE - 1);

  switch (sort) {
    case "latest":
      query = query.order("published_at", { ascending: false });
      break;
    case "trending":
      query = query
        .gte("published_at", weekAgo)
        .order("vote_score", { ascending: false })
        .order("view_count", { ascending: false });
      break;
    default:
      query = query
        .order("vote_score", { ascending: false })
        .order("published_at", { ascending: false });
      break;
  }

  const { data: posts, count } = await query;

  const commentCounts: Record<string, number> = {};
  if (posts) {
    const { data: counts } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", posts.map((p: Record<string, string>) => p.id));
    if (counts) {
      counts.forEach((c: Record<string, string>) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });
    }
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Hero */}
      <HeroSection featuredPost={heroPost as PostWithAuthor | null} />

      {/* Featured Posts */}
      <FeaturedPosts posts={featuredPosts} />

      {/* Categories */}
      <CategoryShowcase postCounts={categoryPostCounts} />

      {/* Top Writers */}
      <TopWriters
        writers={
          (topWriters as {
            username: string;
            display_name: string | null;
            avatar_url: string | null;
            bio: string | null;
            karma: number;
          }[]) || []
        }
      />

      {/* Feed */}
      <section id="feed">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Bài viết</h2>
            <p className="text-sm text-muted-foreground">
              Góc nhìn đa chiều từ cộng đồng
            </p>
          </div>
          <Button size="sm" className="hidden sm:flex" asChild>
            <Link href="/write">
              <PenSquare className="mr-2 h-4 w-4" />
              Viết bài
            </Link>
          </Button>
        </div>

        <Tabs value={sort} className="mb-6">
          <TabsList>
            <TabsTrigger value="hot" asChild>
              <Link href="/?sort=hot">Phổ biến</Link>
            </TabsTrigger>
            <TabsTrigger value="latest" asChild>
              <Link href="/?sort=latest">Mới nhất</Link>
            </TabsTrigger>
            <TabsTrigger value="trending" asChild>
              <Link href="/?sort=trending">Trending</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {posts && posts.length > 0 ? (
          <PostListInfinite
            initialPosts={posts as PostWithAuthor[]}
            initialCommentCounts={commentCounts}
            sort={sort}
            pageSize={POSTS_PER_PAGE}
            totalCount={count || 0}
          />
        ) : (
          <div className="rounded-lg border p-12 text-center">
            <p className="text-lg font-medium">Chưa có bài viết nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hãy là người đầu tiên chia sẻ suy nghĩ!
            </p>
            <Button className="mt-4" asChild>
              <Link href="/write">
                <PenSquare className="mr-2 h-4 w-4" />
                Viết bài ngay
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
