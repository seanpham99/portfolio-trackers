"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 md:px-6 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-emerald-400 mb-8 backdrop-blur-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          New: AI-Powered Transaction Classification
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto"
        >
          Master your money with <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            intelligent tracking
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Connect all your accounts, track your net worth in real-time, 
          and get AI-driven insights to grow your wealth. 
          Stop using spreadsheets. Start using Portfolio.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 h-12 text-base">
              Start Tracking for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#demo">
             <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/5">
                View Live Demo
             </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-6 text-sm text-zinc-500"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Bank-level security</span>
          </div>
        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-2 shadow-2xl">
            <div className="rounded-lg bg-black aspect-[16/9] overflow-hidden relative group">
               {/* Use the dashboard screenshot we verified earlier if available, or a gradient placeholder */}
               <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                  <span className="text-zinc-700 font-mono text-sm">[ Dashboard Preview Mockup ]</span>
               </div>
               
               {/* Simulate UI elements */}
               <div className="absolute top-0 w-full h-full opacity-60 bg-[url('https://ui.shadcn.com/placeholder.svg')] bg-cover"></div>
            </div>
          </div>
          
          {/* Decorative glows */}
          <div className="absolute -inset-10 bg-emerald-500/20 blur-[60px] -z-10 rounded-full opacity-50" />
        </motion.div>
      </div>
    </section>
  );
}
