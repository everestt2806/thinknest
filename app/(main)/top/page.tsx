import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top bài viết",
};

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function TopPostsPage({ searchParams }: PageProps) {
  const { period = "week" } = await searchParams;
  const supabase = await createClient();

  const getPeriodDate = (p: string) => {
    const now = new Date();
    switch (p) {
      case "day":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "all":
        return null;
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const sinceDate = getPeriodDate(period);

  let query = supabase
    .from("posts")
    .select("*, profiles(*), categories(*)")
    .eq("status", "published")
    .order("vote_score", { ascending: false })
    .limit(20);

  if (sinceDate) {
    query = query.gte("published_at", sinceDate);
  }

  const { data: posts } = await query;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">Top bài viết</h1>
          <p className="text-sm text-muted-foreground">
            Những bài viết được cộng đồng đánh giá cao nhất
          </p>
        </div>
      </div>

      <Tabs value={period} className="mb-6">
        <TabsList>
          <TabsTrigger value="day" asChild>
            <a href="/top?period=day">Hôm nay</a>
          </TabsTrigger>
          <TabsTrigger value="week" asChild>
            <a href="/top?period=week">Tuần này</a>
          </TabsTrigger>
          <TabsTrigger value="month" asChild>
            <a href="/top?period=month">Tháng này</a>
          </TabsTrigger>
          <TabsTrigger value="all" asChild>
            <a href="/top?period=all">Mọi thời đại</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary mt-4">
                {index + 1}
              </div>
              <div className="flex-1">
                <PostCard post={post as PostWithAuthor} />
              </div>
            </div>
          ))
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            Chưa có bài viết nào trong khoảng thời gian này
          </p>
        )}
      </div>
    </div>
  );
}
