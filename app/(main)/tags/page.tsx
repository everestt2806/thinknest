import Link from "next/link";
import { Hash, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khám phá Tags",
  description: "Duyệt bài viết theo chủ đề với hệ thống tag",
};

export default async function TagsPage() {
  const supabase = await createClient();

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  const tagCounts: Record<string, number> = {};
  if (tags) {
    for (const tag of tags) {
      const { count } = await supabase
        .from("post_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", tag.id);
      tagCounts[tag.id] = count || 0;
    }
  }

  const sortedTags = (tags || []).sort(
    (a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0)
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Hash className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Khám phá Tags</h1>
        </div>
        <p className="text-muted-foreground">
          Duyệt bài viết theo chủ đề bạn quan tâm
        </p>
      </div>

      {sortedTags.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTags.map((tag) => (
            <Link key={tag.id} href={`/search?tag=${tag.slug}`}>
              <Card className="p-4 transition-colors hover:bg-accent/50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-sm">
                    #{tag.name}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {tagCounts[tag.id] || 0}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          Chưa có tag nào
        </p>
      )}
    </div>
  );
}
