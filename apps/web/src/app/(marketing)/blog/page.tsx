import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BlogCard } from "@/features/blog/components/blog-card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Portfolio Tracker",
  description: "Financial insights, product updates, and investment strategies.",
};

async function getBlogPosts() {
  const postsDirectory = path.join(process.cwd(), "content/posts");

  // Ensure directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);

  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
      coverImage: data.coverImage,
      ...data,
    };
  });

  // Sort posts by date
  return posts.sort((a, b) => {
    if (new Date(a.date) > new Date(b.date)) {
      return -1;
    }
    return 1;
  });
}

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
          Latest <span className="text-emerald-400">Updates</span>
        </h1>
        <p className="text-lg text-zinc-400">News, tips, and insights from the Portfolio team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post as any} />
        ))}
        {posts.length === 0 && (
          <div className="col-span-full text-center py-20 text-zinc-500">
            No posts found. check back later!
          </div>
        )}
      </div>
    </div>
  );
}
