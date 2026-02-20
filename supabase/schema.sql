-- THINKNEST Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  karma integer default 0,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      lower(replace(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), ' ', '_')) || '_' || substr(new.id::text, 1, 4)
    ),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null,
  description text,
  icon text,
  color text,
  post_count integer default 0,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on categories for select using (true);

create policy "Only admins can manage categories"
  on categories for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- SERIES
-- ============================================
create table public.series (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(author_id, slug)
);

alter table public.series enable row level security;

create policy "Series are viewable by everyone"
  on series for select using (true);

create policy "Users can create their own series"
  on series for insert with check (auth.uid() = author_id);

create policy "Users can update their own series"
  on series for update using (auth.uid() = author_id);

create policy "Users can delete their own series"
  on series for delete using (auth.uid() = author_id);

-- ============================================
-- POSTS
-- ============================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  cover_image text,
  category_id uuid references public.categories(id) on delete set null,
  series_id uuid references public.series(id) on delete set null,
  series_order integer,
  reading_time integer default 1,
  view_count integer default 0,
  vote_score integer default 0,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone"
  on posts for select using (status = 'published' or auth.uid() = author_id);

create policy "Users can create posts"
  on posts for insert with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on posts for update using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = author_id);

create index idx_posts_author on posts(author_id);
create index idx_posts_category on posts(category_id);
create index idx_posts_status on posts(status);
create index idx_posts_published_at on posts(published_at desc);
create index idx_posts_vote_score on posts(vote_score desc);
create index idx_posts_slug on posts(slug);

-- ============================================
-- TAGS
-- ============================================
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null
);

alter table public.tags enable row level security;

create policy "Tags are viewable by everyone"
  on tags for select using (true);

create policy "Authenticated users can create tags"
  on tags for insert with check (auth.uid() is not null);

-- ============================================
-- POST_TAGS
-- ============================================
create table public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

alter table public.post_tags enable row level security;

create policy "Post tags are viewable by everyone"
  on post_tags for select using (true);

create policy "Post authors can manage tags"
  on post_tags for insert with check (
    exists (select 1 from posts where id = post_id and author_id = auth.uid())
  );

create policy "Post authors can remove tags"
  on post_tags for delete using (
    exists (select 1 from posts where id = post_id and author_id = auth.uid())
  );

-- ============================================
-- COMMENTS
-- ============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  vote_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Authenticated users can comment"
  on comments for insert with check (auth.uid() = author_id);

create policy "Users can update own comments"
  on comments for update using (auth.uid() = author_id);

create policy "Users can delete own comments"
  on comments for delete using (auth.uid() = author_id);

create index idx_comments_post on comments(post_id);
create index idx_comments_parent on comments(parent_id);

-- ============================================
-- VOTES
-- ============================================
create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  value integer not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  constraint unique_post_vote unique (user_id, post_id),
  constraint unique_comment_vote unique (user_id, comment_id),
  constraint vote_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

alter table public.votes enable row level security;

create policy "Votes are viewable by everyone"
  on votes for select using (true);

create policy "Authenticated users can vote"
  on votes for insert with check (auth.uid() = user_id);

create policy "Users can update own votes"
  on votes for update using (auth.uid() = user_id);

create policy "Users can delete own votes"
  on votes for delete using (auth.uid() = user_id);

-- Update post vote_score on vote change
create or replace function public.update_post_vote_score()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.post_id is not null then
      update posts set vote_score = vote_score + new.value where id = new.post_id;
      update profiles set karma = karma + new.value
        where id = (select author_id from posts where id = new.post_id);
    elsif new.comment_id is not null then
      update comments set vote_score = vote_score + new.value where id = new.comment_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if new.post_id is not null then
      update posts set vote_score = vote_score + new.value - old.value where id = new.post_id;
      update profiles set karma = karma + new.value - old.value
        where id = (select author_id from posts where id = new.post_id);
    elsif new.comment_id is not null then
      update comments set vote_score = vote_score + new.value - old.value where id = new.comment_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.post_id is not null then
      update posts set vote_score = vote_score - old.value where id = old.post_id;
      update profiles set karma = karma - old.value
        where id = (select author_id from posts where id = old.post_id);
    elsif old.comment_id is not null then
      update comments set vote_score = vote_score - old.value where id = old.comment_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_vote_change
  after insert or update or delete on votes
  for each row execute procedure public.update_post_vote_score();

-- ============================================
-- BOOKMARKS
-- ============================================
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can see own bookmarks"
  on bookmarks for select using (auth.uid() = user_id);

create policy "Users can create bookmarks"
  on bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can delete bookmarks"
  on bookmarks for delete using (auth.uid() = user_id);

-- ============================================
-- FOLLOWS
-- ============================================
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete using (auth.uid() = follower_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('vote', 'comment', 'follow', 'mention', 'series')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can see own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "System can create notifications"
  on notifications for insert with check (true);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

create index idx_notifications_user on notifications(user_id, is_read, created_at desc);

-- ============================================
-- FULL TEXT SEARCH
-- ============================================
alter table posts add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'C')
  ) stored;

create index idx_posts_fts on posts using gin(fts);

-- ============================================
-- SEED CATEGORIES
-- ============================================
insert into categories (name, slug, icon, color, description) values
  ('Quan điểm - Tranh luận', 'quan-diem-tranh-luan', '💬', '#ef4444', 'Chia sẻ quan điểm và tranh luận về các vấn đề xã hội'),
  ('Khoa học - Công nghệ', 'khoa-hoc-cong-nghe', '🔬', '#3b82f6', 'Tin tức và bài viết về khoa học, công nghệ'),
  ('Tài chính', 'tai-chinh', '💰', '#22c55e', 'Kiến thức tài chính, đầu tư, kinh tế'),
  ('Phát triển bản thân', 'phat-trien-ban-than', '🚀', '#a855f7', 'Kỹ năng sống, phát triển bản thân'),
  ('Lịch sử', 'lich-su', '📜', '#f59e0b', 'Lịch sử Việt Nam và thế giới'),
  ('Sách', 'sach', '📚', '#06b6d4', 'Review sách, văn học'),
  ('Sáng tác', 'sang-tac', '✍️', '#ec4899', 'Truyện ngắn, thơ, sáng tác văn học'),
  ('Tâm lý học', 'tam-ly-hoc', '🧠', '#8b5cf6', 'Tâm lý học ứng dụng'),
  ('Giáo dục', 'giao-duc', '🎓', '#14b8a6', 'Giáo dục, học tập, du học'),
  ('Du lịch', 'du-lich', '✈️', '#f97316', 'Chia sẻ kinh nghiệm du lịch'),
  ('Âm nhạc', 'am-nhac', '🎵', '#e11d48', 'Âm nhạc, nghệ thuật âm thanh'),
  ('Phim ảnh', 'phim-anh', '🎬', '#7c3aed', 'Review phim, điện ảnh'),
  ('Thể thao', 'the-thao', '⚽', '#16a34a', 'Tin tức và bình luận thể thao'),
  ('Life Style', 'life-style', '🌟', '#eab308', 'Phong cách sống, làm đẹp'),
  ('Game', 'game', '🎮', '#6366f1', 'Gaming, esports, review game'),
  ('Góc nhìn thời sự', 'goc-nhin-thoi-su', '📰', '#0ea5e9', 'Phân tích và bình luận thời sự')
on conflict (slug) do nothing;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Dashboard > Storage:
-- 1. Create bucket "avatars" (public)
-- 2. Create bucket "post-images" (public)
-- Or run:
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true);
