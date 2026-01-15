"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Portfolio is the best investment tracker I've ever used. The AI insights helped me rebalance my portfolio and save thousands in fees.",
    author: "Alex Cheng",
    role: "Software Engineer",
    avatar: "AC", // We can use inititals for now
  },
  {
    quote:
      "Finally, a tool that tracks both my crypto and traditional stocks in one place without being overly complicated. The UI is stunning.",
    author: "Sarah Miller",
    role: "Product Designer",
    avatar: "SM",
  },
  {
    quote:
      "I love the automatic synchronization with my brokerage. It saves me hours of manual entry every month. Highly recommended!",
    author: "James Wilson",
    role: "Financial Analyst",
    avatar: "JW",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-zinc-950">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">
          Loved by <span className="text-emerald-400">investors like you</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col p-8 rounded-2xl bg-zinc-900/50 border border-white/5 shadow-xl hover:bg-zinc-900 hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <blockquote className="flex-1 text-zinc-300 text-lg leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 mt-auto">
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-sm text-zinc-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
