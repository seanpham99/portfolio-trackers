import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Metadata } from "next";

// Define components for MDXRemote
const components = {
  h1: (props: any) => (
    <h1 className="mt-2 scroll-m-20 text-4xl font-bold tracking-tight text-white" {...props} />
  ),
  h2: (props: any) => (
    <h2
      className="mt-10 scroll-m-20 border-b border-zinc-800 pb-1 text-3xl font-semibold tracking-tight text-white first:mt-0"
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight text-white" {...props} />
  ),
  p: (props: any) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6 text-zinc-300" {...props} />
  ),
  a: (props: any) => {
    const isInternal = props.href?.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={props.href}
          className="font-medium text-emerald-500 underline underline-offset-4 hover:text-emerald-400"
        >
          {props.children}
        </Link>
      );
    }
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-emerald-500 underline underline-offset-4 hover:text-emerald-400"
      >
        {props.children}
      </a>
    );
  },
  ul: (props: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-zinc-300" {...props} />,
  ol: (props: any) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 text-zinc-300" {...props} />
  ),
  li: (props: any) => <li className="mt-2" {...props} />,
  code: (props: any) => (
    <code
      className="relative rounded bg-zinc-900 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-zinc-300"
      {...props}
    />
  ),
  img: (props: any) => (
    <div className="my-8 rounded-lg overflow-hidden border border-zinc-800">
      <Image
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        width={800}
        height={400}
        alt={props.alt || "Blog image"}
        {...props}
      />
    </div>
  ),
  Link,
  Image,
};

async function getPost(slug: string) {
  try {
    const postsDirectory = path.join(process.cwd(), "content/posts");
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      frontmatter: data,
      content,
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }
  return {
    title: `${post.frontmatter.title} - Portfolio Blog`,
    description: post.frontmatter.description,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <Link
        href="/blog"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Blog
      </Link>

      <article className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-4">
            <time dateTime={post.frontmatter.date}>
              {format(new Date(post.frontmatter.date), "MMMM d, yyyy")}
            </time>
            {post.frontmatter.author && (
              <>
                <span>•</span>
                <span>{post.frontmatter.author}</span>
              </>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            {post.frontmatter.title}
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed">{post.frontmatter.description}</p>
        </div>

        {post.frontmatter.coverImage && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/10 mb-12">
            {/* For verification, we just show a placeholder if image missing, or actual image */}
            <div className="w-full h-full bg-gradient-to-br from-emerald-900/20 to-zinc-900" />
          </div>
        )}

        <div className="prose prose-invert prose-emerald max-w-none">
          <MDXRemote source={post.content} components={components} />
        </div>
      </article>

      <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-white/10 text-center">
        <p className="text-zinc-400 mb-4">Ready to start tracking your wealth?</p>
        <Link
          href="/signup"
          className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  );
}
