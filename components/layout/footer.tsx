  import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-black text-primary-foreground">T</span>
              </div>
              <span className="text-lg font-bold">{APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nền tảng chia sẻ quan điểm, kiến thức và kết nối cộng đồng tư duy.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Khám phá</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link></li>
              <li><Link href="/top" className="hover:text-foreground transition-colors">Top bài viết</Link></li>
              <li><Link href="/search" className="hover:text-foreground transition-colors">Tìm kiếm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Cộng đồng</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/write" className="hover:text-foreground transition-colors">Viết bài</Link></li>
              <li><Link href="/category/quan-diem-tranh-luan" className="hover:text-foreground transition-colors">Quan điểm</Link></li>
              <li><Link href="/category/khoa-hoc-cong-nghe" className="hover:text-foreground transition-colors">Khoa học</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Liên kết</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Về chúng tôi</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Điều khoản</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Chính sách</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
