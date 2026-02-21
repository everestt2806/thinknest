"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostEditor } from "@/components/post/post-editor";
import { ImageUpload } from "@/components/shared/image-upload";
import { SeriesDialog } from "@/components/series/series-dialog";
import { createClient } from "@/lib/supabase/client";
import { updatePost } from "@/lib/actions/post-actions";
import type { Category } from "@/types/database";

interface Series {
  id: string;
  title: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { id: postId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesId, setSeriesId] = useState("");
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("draft");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSeries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("series")
        .select("id, title")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setSeriesList(data);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (cats) setCategories(cats);

      await fetchSeries();

      const { data: post } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (!post) {
        router.push("/");
        return;
      }

      setTitle(post.title);
      setContent(post.content);
      setExcerpt(post.excerpt || "");
      setCoverImage(post.cover_image || "");
      setCategoryId(post.category_id || "");
      setSeriesId(post.series_id || "");
      setCurrentStatus(post.status);

      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tags(name)")
        .eq("post_id", postId);

      if (postTags) {
        const tagNames = postTags
          .map((pt: Record<string, unknown>) => {
            const tag = pt.tags as unknown as { name: string } | null;
            return tag?.name;
          })
          .filter(Boolean) as string[];
        setTags(tagNames);
      }

      setLoading(false);
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!title.trim() || !content.trim()) return;

    if (status === "draft") setSaving(true);
    else setPublishing(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", excerpt);
    formData.set("coverImage", coverImage);
    formData.set("categoryId", categoryId);
    formData.set("status", status);
    formData.set("tags", JSON.stringify(tags));
    if (seriesId && seriesId !== "none") formData.set("seriesId", seriesId);

    const result = await updatePost(postId, formData);
    if (result?.error) {
      alert(result.error);
      setSaving(false);
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh sửa bài viết</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit("draft")}
            disabled={saving || !title.trim()}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Lưu nháp
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit("published")}
            disabled={publishing || !title.trim() || !content.trim()}
          >
            {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            {currentStatus === "published" ? "Cập nhật" : "Đăng bài"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Input
            placeholder="Tiêu đề bài viết..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 bg-transparent text-3xl font-bold placeholder:text-muted-foreground/50 focus-visible:ring-0 px-0"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Chủ đề</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ảnh bìa</Label>
            <ImageUpload
              value={coverImage}
              onChange={setCoverImage}
              folder="covers"
              placeholder="Paste URL hoặc upload ảnh bìa..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Series (không bắt buộc)</Label>
          <div className="flex items-center gap-2">
            <Select value={seriesId} onValueChange={setSeriesId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Chọn series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không thuộc series</SelectItem>
                {seriesList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSeriesDialog(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Tạo mới
            </Button>
          </div>
        </div>

        <SeriesDialog
          open={showSeriesDialog}
          onOpenChange={setShowSeriesDialog}
          onCreated={fetchSeries}
        />

        <div className="space-y-2">
          <Label>Tags (tối đa 5)</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Thêm tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addTag}
              disabled={tags.length >= 5}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Mô tả ngắn</Label>
          <Textarea
            placeholder="Viết mô tả ngắn cho bài viết (không bắt buộc)..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label className="mb-2 block">Nội dung bài viết</Label>
          {content !== undefined && (
            <PostEditor content={content} onChange={setContent} />
          )}
        </div>
      </div>
    </div>
  );
}
