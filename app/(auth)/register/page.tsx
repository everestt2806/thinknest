"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (formData.username.length < 3) {
      setError("Tên người dùng phải có ít nhất 3 ký tự");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới");
      return;
    }

    setLoading(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", formData.username.toLowerCase())
      .single();

    if (existing) {
      setError("Tên người dùng đã tồn tại");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username.toLowerCase(),
          full_name: formData.displayName || formData.username,
        },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already registered")) {
        setError("Email này đã được đăng ký. Hãy thử đăng nhập.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Supabase returns a user with identities=[] if the email already exists
    // but "Confirm email" is enabled
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("Email này đã được đăng ký. Hãy thử đăng nhập.");
      setLoading(false);
      return;
    }

    // Check if email confirmation is required
    // If session is null, it means email confirmation is needed
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold">Đăng ký thành công!</h2>
          <p className="text-sm text-muted-foreground">
            Chúng tôi đã gửi email xác nhận đến{" "}
            <strong className="text-foreground">{formData.email}</strong>.
            <br />
            Vui lòng kiểm tra hộp thư (kể cả thư mục Spam) và nhấn link xác
            nhận để kích hoạt tài khoản.
          </p>
          <div className="pt-2 space-y-2">
            <Button asChild className="w-full">
              <Link href="/login?registered=true">Đi đến trang Đăng nhập</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Không nhận được email?{" "}
              <button
                onClick={async () => {
                  await supabase.auth.resend({
                    type: "signup",
                    email: formData.email,
                  });
                  alert("Đã gửi lại email xác nhận!");
                }}
                className="font-medium text-primary hover:underline"
              >
                Gửi lại
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center space-y-2 pb-2">
        <Link href="/" className="mx-auto flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-black text-primary-foreground">T</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold">Tạo tài khoản {APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">
          Tham gia cộng đồng chia sẻ tri thức
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin("google")}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin("facebook")}
          >
            <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Tiếp tục với Facebook
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            hoặc
          </span>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên người dùng</Label>
            <Input
              id="username"
              placeholder="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input
              id="displayName"
              placeholder="Tên của bạn"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ít nhất 6 ký tự"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo tài khoản
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
