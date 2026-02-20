"use client";

import Link from "next/link";
import {
  Flame,
  TrendingUp,
  Clock,
  Trophy,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { label: "Phổ biến", href: "/", icon: Flame },
  { label: "Mới nhất", href: "/?sort=latest", icon: Clock },
  { label: "Trending", href: "/?sort=trending", icon: TrendingUp },
  { label: "Top bài viết", href: "/top", icon: Trophy },
];

export function MobileSidebar() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-black text-primary-foreground">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight">THINKNEST</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chủ đề
        </h3>
        <nav className="space-y-0.5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="text-base">{category.icon}</span>
              <span className="truncate">{category.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </ScrollArea>
  );
}
