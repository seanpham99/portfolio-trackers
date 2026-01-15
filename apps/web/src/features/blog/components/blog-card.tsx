import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  coverImage?: string;
}

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <div className="group flex flex-col rounded-xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-emerald-500/30 hover:bg-zinc-900">
      <div className="mb-4">
        {post.coverImage && (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-800 mb-4">
            {/* Placeholder or actual image */}
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <time dateTime={post.date}>{format(new Date(post.date), "MMMM d, yyyy")}</time>
          {post.author && (
            <>
              <span>•</span>
              <span>{post.author}</span>
            </>
          )}
        </div>
        <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
          {post.title}
        </h3>
      </div>
      <p className="mb-6 flex-1 text-zinc-400 leading-relaxed text-sm">{post.description}</p>
      <Link
        href={`/blog/${post.slug}`}
        className="inline-flex items-center text-sm font-medium text-emerald-500 transition-colors group-hover:text-emerald-400"
      >
        Read Article
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
