"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FilePen,
  Archive,
  Eye,
  MessageCircle,
  ChevronUp,
  Clock,
  Pencil,
  Trash2,
  Loader2,
  Plus,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { deletePost } from "@/lib/actions/post-actions";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  vote_score: number;
  reading_time: number;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  categories: { name: string; icon: string } | null;
}

export default function MyPostsPage() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ views: 0, votes: 0, comments: 0, followers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      const { data: allPosts } = await supabase
        .from("posts")
        .select("view_count, vote_score")
        .eq("author_id", profile.id);

      const views = allPosts?.reduce((s: number, p: Record<string, number>) => s + (p.view_count || 0), 0) || 0;
      const votes = allPosts?.reduce((s: number, p: Record<string, number>) => s + (p.vote_score || 0), 0) || 0;

      const { count: commentTotal } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .in("post_id", (allPosts || []).map(() => "").length > 0
          ? (await supabase.from("posts").select("id").eq("author_id", profile.id)).data?.map((p: Record<string, string>) => p.id) || []
          : ["__none__"]
        );

      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id);

      setStats({
        views,
        votes,
        comments: commentTotal || 0,
        followers: followerCount || 0,
      });
    };
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchPosts = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from("posts")
      .select("id, title, slug, status, view_count, vote_score, reading_time, created_at, published_at, updated_at, categories(name, icon)")
      .eq("author_id", profile.id)
      .order("updated_at", { ascending: false });

    if (tab !== "all") {
      query = query.eq("status", tab);
    }

    const { data } = await query;
    const postList = (data || []) as unknown as Post[];
    setPosts(postList);

    if (postList.length > 0) {
      const ids = postList.map((p) => p.id);
      const counts: Record<string, number> = {};
      for (const id of ids) {
        const { count } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", id);
        counts[id] = count || 0;
      }
      setCommentCounts(counts);
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, tab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deletePost(deleteId);
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    draft: { label: "Nháp", variant: "secondary" },
    published: { label: "Đã đăng", variant: "default" },
    archived: { label: "Lưu trữ", variant: "outline" },
  };

  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    published: posts.filter((p) => p.status === "published").length,
    archived: posts.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Bài viết của tôi</h1>
        </div>
        <Button size="sm" asChild>
          <Link href="/write">
            <Plus className="mr-2 h-4 w-4" />
            Viết bài mới
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Eye className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Lượt xem</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ChevronUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.votes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Điểm vote</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.comments.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Bình luận</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.followers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Người theo dõi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-1.5">
            <FilePen className="h-3.5 w-3.5" />
            Nháp
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Đã đăng
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            Lưu trữ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant={statusConfig[post.status]?.variant || "secondary"}>
                    {statusConfig[post.status]?.label || post.status}
                  </Badge>
                  {post.categories && (
                    <Badge variant="outline" className="text-xs">
                      {post.categories.icon} {post.categories.name}
                    </Badge>
                  )}
                </div>

                <Link
                  href={post.status === "published" ? `/post/${post.slug}` : `/edit/${post.id}`}
                  className="block"
                >
                  <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {post.title || "Bài viết chưa có tiêu đề"}
                  </h3>
                </Link>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(
                      new Date(post.updated_at || post.created_at),
                      { addSuffix: true, locale: vi }
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" />
                    {post.vote_score}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {commentCounts[post.id] || 0}
                  </span>
                  <span>{post.reading_time} phút đọc</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => router.push(`/edit/${post.id}`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {tab === "all"
              ? "Bạn chưa có bài viết nào"
              : `Không có bài viết ${statusConfig[tab]?.label?.toLowerCase()}`}
          </p>
          <Button asChild className="mt-4">
            <Link href="/write">Viết bài đầu tiên</Link>
          </Button>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài viết?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
