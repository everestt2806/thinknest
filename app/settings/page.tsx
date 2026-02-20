"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    website: "",
    avatar_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        website: profile.website || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: formData.display_name,
        bio: formData.bio,
        website: formData.website,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
    } else {
      setProfile(data);
      setMessage("Đã cập nhật thành công!");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Cài đặt tài khoản</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên người dùng</Label>
                <Input value={profile.username} disabled />
                <p className="text-xs text-muted-foreground">
                  Tên người dùng không thể thay đổi
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Tên hiển thị</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Giới thiệu về bạn..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {message && (
            <p
              className={`text-sm ${message.includes("lỗi") ? "text-destructive" : "text-green-600"}`}
            >
              {message}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </form>

        <Separator className="my-8" />

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Xóa tài khoản sẽ xóa tất cả dữ liệu của bạn. Hành động này
              không thể hoàn tác.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Xóa tài khoản
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
