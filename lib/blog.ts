import "server-only";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, BlogPostMeta } from "./blog-types";
export type { BlogPost, BlogPostMeta } from "./blog-types";
export { BLOG_CATEGORIES, formatBlogDate } from "./blog-types";
export type { BlogCategoryFilter } from "./blog-types";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function readPostFile(filename: string): BlogPost | null {
  if (!filename.endsWith(".mdx")) return null;

  const filePath = path.join(BLOG_DIR, filename);
  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);

  const slug =
    typeof data.slug === "string" && data.slug.length > 0
      ? data.slug
      : filename.replace(/\.mdx$/, "");

  const category = String(data.category ?? "").trim();

  return {
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    date: String(data.date ?? "").trim(),
    category,
    author: String(data.author ?? "Jorge Feliu").trim(),
    slug,
    coverImage: String(data.coverImage ?? "").trim(),
    featured: Boolean(data.featured),
    content: content.trim(),
  };
}

function sortPosts(a: BlogPostMeta, b: BlogPostMeta): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .map((filename) => readPostFile(filename))
    .filter((post): post is BlogPost => post !== null && post.title.length > 0)
    .map(({ content: _content, ...meta }) => meta)
    .sort(sortPosts);
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const match = fs
    .readdirSync(BLOG_DIR)
    .map((filename) => readPostFile(filename))
    .find((post) => post?.slug === slug);

  return match ?? null;
}

export function getAllPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

function sortByDateDesc(a: BlogPostMeta, b: BlogPostMeta): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function getFeaturedPosts(limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((post) => post.featured)
    .sort(sortByDateDesc)
    .slice(0, limit);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPostMeta[] {
  const all = getAllPosts();
  const current = all.find((post) => post.slug === currentSlug);
  if (!current) return [];

  const others = all.filter((post) => post.slug !== currentSlug);
  const sameCategory = others
    .filter((post) => post.category === current.category)
    .sort(sortByDateDesc);
  const otherCategories = others
    .filter((post) => post.category !== current.category)
    .sort(sortByDateDesc);

  return [...sameCategory, ...otherCategories].slice(0, limit);
}
