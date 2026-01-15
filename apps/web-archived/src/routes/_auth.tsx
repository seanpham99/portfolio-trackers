import { motion, useReducedMotion } from "framer-motion";
import { Outlet } from "react-router";

export default function AuthLayout() {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion variants
  const logoVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } };

  const contentVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  const fadeVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 } };

  return (
    <div className="dark relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Premium Background Mesh/Gradient */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-emerald-900/20 blur-[120px] opacity-60" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-900/15 blur-[120px] opacity-50" />
        {/* Subtle grid pattern instead of noise.svg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-50" />
      </div>

      <main className="relative z-10 w-full max-w-md px-6" role="main">
        {/* Animated Logo */}
        <motion.header
          {...logoVariants}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.5, ease: "easeOut" }
          }
          className="mb-8 flex flex-col items-center justify-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-border shadow-2xl shadow-emerald-900/20 backdrop-blur-sm">
            <span
              className="text-3xl font-bold text-emerald-400"
              aria-hidden="true"
            >
              F
            </span>
          </div>
          <motion.h1
            {...fadeVariants}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { delay: 0.2, duration: 0.5 }
            }
            className="mt-4 font-serif text-3xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70"
          >
            Portfolios Tracker
          </motion.h1>
          <motion.p
            {...fadeVariants}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { delay: 0.3, duration: 0.5 }
            }
            className="mt-2 text-center text-sm text-muted-foreground"
          >
            Consolidated wealth. Calm mind.
          </motion.p>
        </motion.header>

        {/* Auth page content */}
        <motion.div
          {...contentVariants}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { delay: 0.1, duration: 0.4 }
          }
        >
          <Outlet />
        </motion.div>

        {/* Footer */}
        <motion.footer
          {...fadeVariants}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { delay: 0.4, duration: 0.5 }
          }
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          © {new Date().getFullYear()} Portfolios Tracker. All rights reserved.
        </motion.footer>
      </main>
    </div>
  );
}
