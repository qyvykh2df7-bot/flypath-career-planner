import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogMarkdown } from "@/components/blog/BlogMarkdown";
import { BlogPostCta } from "@/components/blog/BlogPostCta";
import { BlogRelatedPosts } from "@/components/blog/BlogRelatedPosts";
import { getBlogCtaForPost } from "@/lib/blog-cta";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";
import { BlogPostShell } from "./BlogPostShell";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const pageTitle = `${post.title} | Blog FlyPath`;
  const canonical = `/blog/${post.slug}`;
  const ogImage = post.coverImage ? absoluteUrl(post.coverImage) : undefined;

  return {
    title: pageTitle,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: absoluteUrl(canonical),
      publishedTime: post.date,
      ...(ogImage ? { images: [{ url: ogImage, alt: post.title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { content, ...meta } = post;
  const relatedPosts = getRelatedPosts(slug, 3);
  const cta = getBlogCtaForPost(meta);

  return (
    <BlogPostShell
      post={meta}
      footer={
        <>
          <BlogRelatedPosts posts={relatedPosts} />
          <BlogPostCta cta={cta} />
        </>
      }
    >
      <BlogMarkdown content={content} />
    </BlogPostShell>
  );
}
