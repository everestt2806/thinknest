export const APP_NAME = "THINKNEST";
export const APP_DESCRIPTION =
  "Nền tảng chia sẻ quan điểm, kiến thức và kết nối cộng đồng tư duy";

export const CATEGORIES = [
  { name: "Quan điểm - Tranh luận", slug: "quan-diem-tranh-luan", icon: "💬", color: "#ef4444" },
  { name: "Khoa học - Công nghệ", slug: "khoa-hoc-cong-nghe", icon: "🔬", color: "#3b82f6" },
  { name: "Tài chính", slug: "tai-chinh", icon: "💰", color: "#22c55e" },
  { name: "Phát triển bản thân", slug: "phat-trien-ban-than", icon: "🚀", color: "#a855f7" },
  { name: "Lịch sử", slug: "lich-su", icon: "📜", color: "#f59e0b" },
  { name: "Sách", slug: "sach", icon: "📚", color: "#06b6d4" },
  { name: "Sáng tác", slug: "sang-tac", icon: "✍️", color: "#ec4899" },
  { name: "Tâm lý học", slug: "tam-ly-hoc", icon: "🧠", color: "#8b5cf6" },
  { name: "Giáo dục", slug: "giao-duc", icon: "🎓", color: "#14b8a6" },
  { name: "Du lịch", slug: "du-lich", icon: "✈️", color: "#f97316" },
  { name: "Âm nhạc", slug: "am-nhac", icon: "🎵", color: "#e11d48" },
  { name: "Phim ảnh", slug: "phim-anh", icon: "🎬", color: "#7c3aed" },
  { name: "Thể thao", slug: "the-thao", icon: "⚽", color: "#16a34a" },
  { name: "Life Style", slug: "life-style", icon: "🌟", color: "#eab308" },
  { name: "Game", slug: "game", icon: "🎮", color: "#6366f1" },
  { name: "Góc nhìn thời sự", slug: "goc-nhin-thoi-su", icon: "📰", color: "#0ea5e9" },
] as const;

export const POST_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const VOTE_VALUES = {
  UP: 1,
  DOWN: -1,
} as const;

export const POSTS_PER_PAGE = 10;

export const READING_SPEED_WPM = 200;
