"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, Archive, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminPostActionsProps {
  postId: string;
  currentStatus: string;
}

export function AdminPostActions({
  postId,
  currentStatus,
}: AdminPostActionsProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const updateStatus = async (status: string) => {
    setLoading(true);
    await supabase.from("posts").update({ status }).eq("id", postId);
    setLoading(false);
    router.refresh();
  };

  const deletePost = async () => {
    if (!confirm("Xác nhận xóa bài viết này?")) return;
    setLoading(true);
    await supabase.from("posts").delete().eq("id", postId);
    setLoading(false);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== "published" && (
          <DropdownMenuItem onClick={() => updateStatus("published")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Xuất bản
          </DropdownMenuItem>
        )}
        {currentStatus !== "archived" && (
          <DropdownMenuItem onClick={() => updateStatus("archived")}>
            <Archive className="mr-2 h-4 w-4" />
            Lưu trữ
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={deletePost} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
