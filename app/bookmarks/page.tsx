export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { Header } from "@/components/layout/header";
import { Bookmark } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đã lưu",
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("post_id, posts(*, profiles(*), categories(*))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const posts = (bookmarks
    ?.map((b) => b.posts)
    .filter(Boolean) as unknown) as PostWithAuthor[];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Bookmark className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Bài viết đã lưu</h1>
            <p className="text-sm text-muted-foreground">
              {posts?.length || 0} bài viết
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              Bạn chưa lưu bài viết nào
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
