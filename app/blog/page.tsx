import type { Metadata } from "next";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";
import { BlogListingClient } from "./BlogListingClient";

const title = "Blog FlyPath | Formación de pilotos, escuelas, costes y ATPL";
const description =
  "Artículos claros sobre cómo ser piloto, comparar escuelas de vuelo, entender costes, preparar ATPL y tomar mejores decisiones en tu formación.";

export const metadata: Metadata = createPublicPageMetadata({
  title,
  description,
  path: "/blog",
  imagePath: "/blog.jpg",
  imageAlt: "Blog FlyPath sobre formación de pilotos",
});

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPosts = getFeaturedPosts(3);
  return <BlogListingClient posts={posts} featuredPosts={featuredPosts} />;
}
