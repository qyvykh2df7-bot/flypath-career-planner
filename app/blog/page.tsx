import type { Metadata } from "next";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";
import { BlogListingClient } from "./BlogListingClient";

const title = "Blog FlyPath | Formación de pilotos, escuelas, costes y ATPL";
const description =
  "Artículos claros sobre cómo ser piloto, comparar escuelas de vuelo, entender costes, preparar ATPL y tomar mejores decisiones en tu formación.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title,
    description,
    type: "website",
    url: absoluteUrl("/blog"),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPosts = getFeaturedPosts(3);
  return <BlogListingClient posts={posts} featuredPosts={featuredPosts} />;
}
