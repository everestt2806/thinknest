import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { POSTS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "Không tìm thấy" };
  return {
    title: category.name,
    description: category.description || `Bài viết về ${category.name}`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page));
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: posts, count } = await supabase
    .from("posts")
    .select("*, profiles(*), categories(*)", { count: "exact" })
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1);

  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{category.icon}</span>
          <h1 className="text-2xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{count || 0} bài viết</p>
      </div>

      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post as PostWithAuthor} />
          ))
        ) : (
          <div className="rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">
              Chưa có bài viết nào trong chủ đề này
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={`/category/${slug}?page=${currentPage - 1}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span><ChevronLeft className="h-4 w-4" /></span>
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
                <Link href={`/category/${slug}?page=${currentPage + 1}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span><ChevronRight className="h-4 w-4" /></span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
