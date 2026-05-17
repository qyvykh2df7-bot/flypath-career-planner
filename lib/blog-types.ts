export type BlogPostMeta = {
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  slug: string;
  coverImage: string;
  featured: boolean;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

export const BLOG_CATEGORIES = [
  "Todos",
  "Rutas de formación",
  "Escuelas de vuelo",
  "Costes",
  "Clase 1",
  "Inglés aeronáutico",
  "ATPL",
  "Consejos",
] as const;

export type BlogCategoryFilter = (typeof BLOG_CATEGORIES)[number];

export function formatBlogDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Categories that have at least one post, always including "Todos". */
export function getBlogCategoriesWithPosts(posts: BlogPostMeta[]): BlogCategoryFilter[] {
  const used = new Set(posts.map((post) => post.category));
  return BLOG_CATEGORIES.filter((category) => category === "Todos" || used.has(category));
}
