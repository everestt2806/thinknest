"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket = "images",
  folder = "posts",
  placeholder = "Paste URL hoặc upload ảnh...",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB");
      return;
    }

    setUploading(true);
    setError("");

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        setError("Upload thất bại: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
    } catch (err) {
      setError("Upload thất bại, vui lòng thử lại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {value && (
        <div className="relative aspect-[2.5/1] overflow-hidden rounded-lg border">
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
            onError={() => setError("Không thể tải ảnh")}
          />
        </div>
      )}

      {!value && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          disabled={uploading}
        >
          <ImageIcon className="h-8 w-8" />
          <span className="text-sm">Kéo thả hoặc bấm để upload ảnh</span>
        </button>
      )}
    </div>
  );
}
