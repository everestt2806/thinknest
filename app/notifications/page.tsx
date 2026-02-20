"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronUp,
  MessageCircle,
  UserPlus,
  CheckCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  post_id: string | null;
  actor: { username: string; display_name: string | null; avatar_url: string | null };
  post?: { title: string; slug: string } | null;
}

export default function NotificationsPage() {
  const { profile } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("notifications")
      .select(
        "id, type, is_read, created_at, post_id, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)"
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const withPosts = await Promise.all(
        data.map(async (n) => {
          let post = null;
          if (n.post_id) {
            const { data: p } = await supabase
              .from("posts")
              .select("title, slug")
              .eq("id", n.post_id)
              .single();
            post = p;
          }
          return {
            ...n,
            actor: n.actor as unknown as NotificationItem["actor"],
            post,
          };
        })
      );
      setNotifications(withPosts);
    }
  }, [profile, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "vote":
        return <ChevronUp className="h-4 w-4 text-primary" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getMessage = (n: NotificationItem) => {
    const name = n.actor?.display_name || n.actor?.username || "Ai đó";
    switch (n.type) {
      case "vote":
        return `${name} đã vote bài viết của bạn`;
      case "comment":
        return `${name} đã bình luận bài viết của bạn`;
      case "follow":
        return `${name} đã theo dõi bạn`;
      case "mention":
        return `${name} đã nhắc đến bạn`;
      default:
        return `${name} đã tương tác`;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Thông báo</h1>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>

        <div className="space-y-1">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={
                  n.type === "follow"
                    ? `/user/${n.actor?.username}`
                    : n.post
                      ? `/post/${n.post.slug}`
                      : "#"
                }
                className={cn(
                  "flex items-start gap-3 rounded-lg p-4 transition-colors hover:bg-accent",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={n.actor?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(n.actor?.display_name || n.actor?.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getIcon(n.type)}
                    <p className="text-sm">
                      {getMessage(n)}
                    </p>
                  </div>
                  {n.post && (
                    <p className="mt-0.5 text-sm font-medium truncate">
                      {n.post.title}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            ))
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              Chưa có thông báo nào
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
