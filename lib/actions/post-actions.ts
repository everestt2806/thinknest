"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { READING_SPEED_WPM } from "@/lib/constants";

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / READING_SPEED_WPM));
}

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true, locale: "vi" });
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const coverImage = formData.get("coverImage") as string;
  const categoryId = formData.get("categoryId") as string;
  const status = formData.get("status") as string;
  const tagsJson = formData.get("tags") as string;
  const seriesId = formData.get("seriesId") as string;

  const slug = generateSlug(title);
  const readingTime = calculateReadingTime(content);

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      title,
      slug,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, "").substring(0, 200),
      cover_image: coverImage || null,
      category_id: categoryId || null,
      series_id: seriesId || null,
      reading_time: readingTime,
      status: status === "published" ? "published" : "draft",
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (tagsJson) {
    try {
      const tags = JSON.parse(tagsJson) as string[];
      for (const tagName of tags) {
        const tagSlug = slugify(tagName, { lower: true, strict: true });
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("slug", tagSlug)
          .single();

        let tagId: string;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: tagName, slug: tagSlug })
            .select("id")
            .single();
          if (!newTag) continue;
          tagId = newTag.id;
        }

        await supabase.from("post_tags").insert({
          post_id: post.id,
          tag_id: tagId,
        });
      }
    } catch {
      // ignore tag errors
    }
  }

  redirect(`/post/${post.slug}`);
}

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const coverImage = formData.get("coverImage") as string;
  const categoryId = formData.get("categoryId") as string;
  const status = formData.get("status") as string;

  const readingTime = calculateReadingTime(content);

  const { data: post, error } = await supabase
    .from("posts")
    .update({
      title,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, "").substring(0, 200),
      cover_image: coverImage || null,
      category_id: categoryId || null,
      reading_time: readingTime,
      status: status as "draft" | "published" | "archived",
      published_at:
        status === "published" ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/post/${post.slug}`);
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);

  redirect("/");
}

export async function incrementViewCount(postId: string) {
  const supabase = await createClient();
  try {
    await supabase.rpc("increment_view_count", { post_id: postId });
  } catch {
    // ignore RPC errors
  }
}
