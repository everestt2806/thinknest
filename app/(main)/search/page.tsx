import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import type { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q, tag } = await searchParams;
  return {
    title: q ? `Tìm kiếm: ${q}` : tag ? `Tag: ${tag}` : "Tìm kiếm",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, tag } = await searchParams;
  const supabase = await createClient();

  let posts: PostWithAuthor[] = [];

  if (q) {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(*), categories(*)")
      .eq("status", "published")
      .textSearch("fts", q.split(" ").join(" & "))
      .order("vote_score", { ascending: false })
      .limit(30);
    posts = (data || []) as PostWithAuthor[];
  } else if (tag) {
    const { data: tagData } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag)
      .single();

    if (tagData) {
      const { data: postTagData } = await supabase
        .from("post_tags")
        .select("post_id")
        .eq("tag_id", tagData.id);

      if (postTagData && postTagData.length > 0) {
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(*), categories(*)")
          .eq("status", "published")
          .in(
            "id",
            postTagData.map((pt) => pt.post_id)
          )
          .order("published_at", { ascending: false })
          .limit(30);
        posts = (data || []) as PostWithAuthor[];
      }
    }
  }

  const { data: popularTags } = await supabase
    .from("tags")
    .select("*")
    .limit(20);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Tìm kiếm</h1>
        <form className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Tìm kiếm bài viết, chủ đề..."
            defaultValue={q || ""}
            className="pl-10"
          />
        </form>
      </div>

      {popularTags && popularTags.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Tags phổ biến
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((t) => (
              <Link key={t.id} href={`/search?tag=${t.slug}`}>
                <Badge
                  variant={tag === t.slug ? "default" : "secondary"}
                  className="cursor-pointer"
                >
                  #{t.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(q || tag) && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {posts.length > 0
              ? `Tìm thấy ${posts.length} kết quả${q ? ` cho "${q}"` : ""}${tag ? ` với tag #${tag}` : ""}`
              : `Không tìm thấy kết quả${q ? ` cho "${q}"` : ""}${tag ? ` với tag #${tag}` : ""}`}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
