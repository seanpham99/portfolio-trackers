"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    quote:
      "Portfolio is the best investment tracker I've ever used. The AI insights helped me rebalance my portfolio and save thousands in fees.",
    author: "Alex Cheng",
    role: "Software Engineer at Google",
    avatar: "AC",
    avatarBg: "from-emerald-500 to-cyan-500",
    company: "google",
  },
  {
    quote:
      "Finally, a tool that tracks both my crypto and traditional stocks in one place without being overly complicated. The UI is absolutely stunning.",
    author: "Sarah Miller",
    role: "Product Designer at Meta",
    avatar: "SM",
    avatarBg: "from-purple-500 to-pink-500",
    company: "meta",
  },
  {
    quote:
      "I love the automatic sync with my brokerage. It saves me hours of manual entry every month. The real-time updates are a game-changer.",
    author: "James Wilson",
    role: "Financial Analyst at Goldman Sachs",
    avatar: "JW",
    avatarBg: "from-orange-500 to-amber-500",
    company: "goldman",
  },
  {
    quote:
      "The multi-currency support is perfect for my international portfolio. Finally I can see everything in one dashboard without doing mental math.",
    author: "Priya Sharma",
    role: "Founder & CEO at TechVentures",
    avatar: "PS",
    avatarBg: "from-cyan-500 to-blue-500",
    company: "startup",
  },
  {
    quote:
      "Bank-level security was a must for me. Portfolio delivers on that promise while still being incredibly easy to use. Highly recommended!",
    author: "Michael Brown",
    role: "VP of Engineering at Stripe",
    avatar: "MB",
    avatarBg: "from-indigo-500 to-purple-500",
    company: "stripe",
  },
  {
    quote:
      "I've tried every portfolio tracking app out there. Portfolio is the only one that feels like it was built by people who actually invest.",
    author: "Emily Chen",
    role: "Investment Manager at BlackRock",
    avatar: "EC",
    avatarBg: "from-rose-500 to-pink-500",
    company: "blackrock",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export function TestimonialsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="testimonials" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-zinc-400 mb-6">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>Loved by 50,000+ investors</span>
          </div>

          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Trusted by{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              investors worldwide
            </span>
          </h2>

          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Join thousands of investors who use Portfolio to track and grow their wealth.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative cursor-pointer"
            >
              {/* Card */}
              <div
                className={`
                  relative h-full p-6 md:p-8 rounded-2xl 
                  border border-white/5 bg-zinc-900/50 backdrop-blur-sm
                  transition-all duration-500
                  ${hoveredIndex === index ? "border-white/20 bg-zinc-900/80 scale-[1.02]" : ""}
                `}
              >
                {/* Quote icon */}
                <Quote
                  className={`
                    h-8 w-8 mb-4 transition-colors duration-300
                    ${hoveredIndex === index ? "text-emerald-400" : "text-zinc-700"}
                  `}
                />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>

                {/* Quote text */}
                <blockquote className="text-zinc-300 text-base leading-relaxed mb-6 group-hover:text-white transition-colors duration-300">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author info */}
                <div className="flex items-center gap-4 mt-auto">
                  {/* Avatar with gradient */}
                  <div
                    className={`
                      relative h-12 w-12 rounded-full flex items-center justify-center 
                      font-bold text-white text-sm
                      bg-gradient-to-br ${testimonial.avatarBg}
                      transition-transform duration-300 group-hover:scale-110
                    `}
                  >
                    {testimonial.avatar}

                    {/* Glow effect on hover */}
                    <div
                      className={`
                        absolute inset-0 rounded-full bg-gradient-to-br ${testimonial.avatarBg}
                        blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10
                      `}
                    />
                  </div>

                  <div>
                    <div
                      className="font-semibold text-white"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                {/* Bottom gradient line */}
                <div
                  className={`
                    absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl
                    bg-gradient-to-r ${testimonial.avatarBg}
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  `}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Social Proof Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <p className="text-zinc-500 text-sm mb-8">
            Trusted by professionals from leading companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
            {/* Company logos - using text as placeholder */}
            {["Google", "Meta", "Stripe", "Goldman Sachs", "BlackRock", "Microsoft"].map(
              (company, index) => (
                <motion.div
                  key={company}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="text-zinc-600 font-semibold text-lg hover:text-zinc-400 transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {company}
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
