"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import slugify from "slugify";

interface SeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function SeriesDialog({ open, onOpenChange, onCreated }: SeriesDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(title, { lower: true, strict: true, locale: "vi" }) + "-" + Date.now().toString(36);

    const { error: dbError } = await supabase.from("series").insert({
      author_id: user.id,
      title: title.trim(),
      slug,
      description: description.trim() || null,
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    setTitle("");
    setDescription("");
    setSaving(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo Series mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tên series</Label>
            <Input
              placeholder="Ví dụ: Học React từ A đến Z"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả (không bắt buộc)</Label>
            <Textarea
              placeholder="Mô tả ngắn về series..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo series
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
