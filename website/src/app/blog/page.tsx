import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export const metadata = {
  title: "Blog - AllyLab",
  description: "Articles and insights on web accessibility.",
};

const posts = [
  {
    slug: "wcag-2-2-guide",
    title: "WCAG 2.2: Everything You Need to Know",
    excerpt:
      "WCAG 2.2 introduces 9 new success criteria focused on cognitive disabilities and mobile accessibility.",
    date: "January 15, 2025",
    readTime: "12 min read",
    tags: ["WCAG", "Guide"],
    featured: true,
  },
  {
    slug: "ai-accessibility-testing",
    title: "How AI is Transforming Accessibility Testing",
    excerpt:
      "Discover how AI-powered tools are changing the game for accessibility remediation.",
    date: "January 10, 2025",
    readTime: "8 min read",
    tags: ["AI", "Accessibility"],
  },
  {
    slug: "cicd-accessibility",
    title: "Integrating Accessibility Testing into CI/CD",
    excerpt:
      "Learn how to catch accessibility issues before they reach production.",
    date: "January 5, 2025",
    readTime: "6 min read",
    tags: ["CI/CD", "DevOps"],
  },
  {
    slug: "color-contrast-guide",
    title: "Color Contrast: A Developer's Complete Guide",
    excerpt:
      "Everything about WCAG color contrast requirements and techniques.",
    date: "December 28, 2024",
    readTime: "10 min read",
    tags: ["Design", "WCAG"],
  },
];

export default function BlogPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            AllyLab <span className="gradient-text">Blog</span>
          </h1>
          <p className="text-xl text-text-secondary">
            Articles, tutorials, and insights on web accessibility.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full">
                <div className="h-40 bg-surface-tertiary rounded-lg flex items-center justify-center text-4xl mb-4">
                  📝
                </div>
                <div className="flex gap-2 text-sm text-text-muted mb-2">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-text-secondary text-sm mb-4">{post.excerpt}</p>
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}