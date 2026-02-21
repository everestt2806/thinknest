import Link from "next/link";
import { Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopWriter {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  karma: number;
}

interface TopWritersProps {
  writers: TopWriter[];
}

export function TopWriters({ writers }: TopWritersProps) {
  if (writers.length === 0) return null;

  return (
    <section className="landing-section">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Award className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Tác giả nổi bật</h2>
          <p className="text-sm text-muted-foreground">Những cây bút được yêu thích nhất</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {writers.map((writer, index) => (
          <Link
            key={writer.username}
            href={`/user/${writer.username}`}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
          >
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-background">
                <AvatarImage
                  src={writer.avatar_url || undefined}
                  alt={writer.display_name || writer.username}
                />
                <AvatarFallback className="text-sm font-bold">
                  {(writer.display_name || writer.username)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {index < 3 && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate transition-colors group-hover:text-primary">
                {writer.display_name || writer.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{writer.username}
              </p>
              <p className="mt-1 text-xs font-medium text-primary/80">
                {writer.karma} karma
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
