import Link from "next/link";
import { Briefcase, Twitter, Github, Linkedin } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-zinc-950 border-t border-white/10 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Briefcase className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="text-xl font-bold text-white">
                Portfolio
              </span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The modern way to track your net worth. Connect all your accounts, 
              analyze performance, and make better financial decisions.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#features" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#integrations" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Portfolio Inc. All rights reserved.
          </p>
          <div className="flex gap-8">
            <p className="text-xs text-zinc-500">
              Made with ❤️ via Agentic Coding
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
