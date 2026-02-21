"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { PostCard } from "@/components/post/post-card";
import { createClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/types/database";

interface PostListInfiniteProps {
  initialPosts: PostWithAuthor[];
  initialCommentCounts: Record<string, number>;
  sort: string;
  pageSize: number;
  totalCount: number;
}

export function PostListInfinite({
  initialPosts,
  initialCommentCounts,
  sort,
  pageSize,
  totalCount,
}: PostListInfiniteProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [commentCounts, setCommentCounts] = useState(initialCommentCounts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < totalCount);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const supabase = createClient();
    const offset = posts.length;

    let query = supabase
      .from("posts")
      .select("*, profiles(*), categories(*)")
      .eq("status", "published")
      .range(offset, offset + pageSize - 1);

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
      default:
        query = query
          .order("vote_score", { ascending: false })
          .order("published_at", { ascending: false });
        break;
    }

    const { data: newPosts } = await query;

    if (newPosts && newPosts.length > 0) {
      const { data: counts } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", newPosts.map((p: Record<string, string>) => p.id));

      const newCounts: Record<string, number> = { ...commentCounts };
      if (counts) {
        counts.forEach((c: Record<string, string>) => {
          newCounts[c.post_id] = (newCounts[c.post_id] || 0) + 1;
        });
      }

      setPosts((prev) => [...prev, ...(newPosts as unknown as PostWithAuthor[])]);
      setCommentCounts(newCounts);
      setHasMore(posts.length + newPosts.length < totalCount);
    } else {
      setHasMore(false);
    }

    setLoading(false);
  }, [loading, hasMore, posts.length, pageSize, sort, commentCounts, totalCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    setPosts(initialPosts);
    setCommentCounts(initialCommentCounts);
    setHasMore(initialPosts.length < totalCount);
  }, [initialPosts, initialCommentCounts, totalCount]);

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            commentCount={commentCounts[post.id] || 0}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-8">
          {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Bạn đã xem hết tất cả bài viết
        </p>
      )}
    </>
  );
}
