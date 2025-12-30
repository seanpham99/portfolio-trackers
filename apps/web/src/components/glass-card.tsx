"use client";

import type React from "react";
import { cn } from "@repo/ui/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  hover = true,
  onClick,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={cn(
        "glass-card shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        hover &&
          "cursor-pointer transition-all duration-300 hover:border-border hover:bg-overlay-medium",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
