import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { POSTS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PenSquare } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { sort = "hot", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page));
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, profiles(*), categories(*)", { count: "exact" })
    .eq("status", "published")
    .range(offset, offset + POSTS_PER_PAGE - 1);

  switch (sort) {
    case "latest":
      query = query.order("published_at", { ascending: false });
      break;
    case "trending":
      query = query
        .gte(
          "published_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("vote_score", { ascending: false })
        .order("view_count", { ascending: false });
      break;
    default: // "hot" - combination of recency and score
      query = query.order("vote_score", { ascending: false }).order("published_at", { ascending: false });
      break;
  }

  const { data: posts, count } = await query;
  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);

  // Fetch comment counts
  const commentCounts: Record<string, number> = {};
  if (posts) {
    const { data: counts } = await supabase
      .from("comments")
      .select("post_id")
      .in(
        "post_id",
        posts.map((p) => p.id)
      );
    if (counts) {
      counts.forEach((c) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });
    }
  }

  // Top authors
  const { data: topAuthors } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, karma")
    .order("karma", { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khám phá</h1>
          <p className="text-sm text-muted-foreground">
            Góc nhìn đa chiều từ cộng đồng THINKNEST
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

      <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post as PostWithAuthor}
                commentCount={commentCounts[post.id] || 0}
              />
            ))
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                asChild={currentPage > 1}
              >
                {currentPage > 1 ? (
                  <Link
                    href={`/?sort=${sort}&page=${currentPage - 1}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
              >
                {currentPage < totalPages ? (
                  <Link
                    href={`/?sort=${sort}&page=${currentPage + 1}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right sidebar - Top Authors (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 font-semibold">Top tác giả</h3>
              <div className="space-y-3">
                {topAuthors?.map((author, i) => (
                  <Link
                    key={author.username}
                    href={`/user/${author.username}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {author.display_name || author.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {author.karma} karma
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
