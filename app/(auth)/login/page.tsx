"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const justRegistered = searchParams.get("registered") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        setError(
          "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam) và nhấn link xác nhận."
        );
      } else if (msg.includes("invalid login credentials")) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Vui lòng nhập email trước khi gửi lại xác nhận.");
      return;
    }
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendError) {
      setError(resendError.message);
    } else {
      setError("");
      alert("Đã gửi lại email xác nhận! Kiểm tra hộp thư của bạn.");
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center space-y-2 pb-2">
        <Link href="/" className="mx-auto flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-black text-primary-foreground">T</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold">Đăng nhập vào {APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">
          Chào mừng bạn quay trở lại
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {justRegistered && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            Đăng ký thành công! Kiểm tra email để xác nhận tài khoản, sau đó
            quay lại đây để đăng nhập.
          </div>
        )}

        <div className="grid gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin("google")}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
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

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {error.includes("xác nhận") && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                >
                  Gửi lại email xác nhận
                </Button>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đăng nhập
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
