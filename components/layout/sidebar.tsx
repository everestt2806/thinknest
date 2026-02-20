"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  TrendingUp,
  Clock,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { label: "Phổ biến", href: "/", icon: Flame },
  { label: "Mới nhất", href: "/?sort=latest", icon: Clock },
  { label: "Trending", href: "/?sort=trending", icon: TrendingUp },
  { label: "Top bài viết", href: "/top", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20">
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <nav className="space-y-1 pr-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/" && !item.href.includes("sort")
                  : pathname + (typeof window !== "undefined" ? window.location.search : "") === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4 mr-4" />

          <div className="pr-4">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chủ đề
            </h3>
            <nav className="space-y-0.5">
              {CATEGORIES.map((category) => {
                const isActive = pathname === `/category/${category.slug}`;
                return (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 pr-4 pb-8">
            <Separator className="mb-4" />
            <div className="px-3 text-xs text-muted-foreground space-y-1">
              <p>THINKNEST &copy; 2026</p>
              <p>Nền tảng chia sẻ quan điểm</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
