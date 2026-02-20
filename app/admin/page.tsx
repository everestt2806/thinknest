import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  MessageCircle,
  TrendingUp,
  Eye,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { AdminPostActions } from "@/components/admin/admin-post-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản trị",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  const { count: publishedCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true });

  // Recent posts
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, title, slug, status, vote_score, view_count, created_at, profiles(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: todayPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  const { count: todayUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Bảng quản trị</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{todayUsers || 0} hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài viết</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {publishedCount || 0} đã xuất bản · +{todayPosts || 0} hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bình luận</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tình trạng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Hoạt động</div>
            <p className="text-xs text-muted-foreground">Hệ thống ổn định</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="mb-6">
          <TabsTrigger value="posts">Bài viết gần đây</TabsTrigger>
          <TabsTrigger value="users">Người dùng mới</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Bài viết</th>
                      <th className="px-4 py-3 text-left font-medium">Tác giả</th>
                      <th className="px-4 py-3 text-center font-medium">Trạng thái</th>
                      <th className="px-4 py-3 text-center font-medium">
                        <Eye className="mx-auto h-4 w-4" />
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        <ChevronUp className="mx-auto h-4 w-4" />
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentPosts?.map((post) => (
                      <tr key={post.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/post/${post.slug}`}
                            className="font-medium hover:text-primary line-clamp-1 max-w-[300px]"
                          >
                            {post.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {(() => {
                            const p = post.profiles as unknown as { display_name?: string; username: string };
                            return p?.display_name || p?.username;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : post.status === "draft"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {post.status === "published"
                              ? "Đã đăng"
                              : post.status === "draft"
                                ? "Nháp"
                                : "Lưu trữ"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {post.view_count}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {post.vote_score}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AdminPostActions postId={post.id} currentStatus={post.status!} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Người dùng</th>
                      <th className="px-4 py-3 text-left font-medium">Username</th>
                      <th className="px-4 py-3 text-center font-medium">Role</th>
                      <th className="px-4 py-3 text-center font-medium">Karma</th>
                      <th className="px-4 py-3 text-left font-medium">Tham gia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentUsers?.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/user/${user.username}`}
                            className="font-medium hover:text-primary"
                          >
                            {user.display_name || user.username}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          @{user.username}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {user.karma}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
