import Link from "next/link";
import { Grid3X3 } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface CategoryShowcaseProps {
  postCounts: Record<string, number>;
}

export function CategoryShowcase({ postCounts }: CategoryShowcaseProps) {
  return (
    <section className="landing-section">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Grid3X3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Chủ đề</h2>
            <p className="text-sm text-muted-foreground">Khám phá theo lĩnh vực bạn quan tâm</p>
          </div>
        </div>
        <Link
          href="/tags"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hidden sm:block"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const count = postCounts[category.slug] || 0;
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg transition-transform group-hover:scale-110">
                {category.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate transition-colors group-hover:text-primary">
                  {category.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} bài viết
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
