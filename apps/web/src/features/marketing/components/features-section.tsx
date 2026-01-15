"use client";

import { 
    LayoutDashboard, 
    LineChart, 
    Wallet, 
    ShieldCheck, 
    Zap,
    Smartphone
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "All-in-One Dashboard",
    description: "Connect brokerage accounts, crypto wallets, and bank accounts in one unified view.",
  },
  {
    icon: LineChart,
    title: "Advanced Analytics",
    description: "Visualize your net worth growth, asset allocation, and performance metrics over time.",
  },
  {
    icon: Wallet,
    title: "Crypto Integration",
    description: "Direct integration with major blockchains to track DeFi positions and NFTs automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Level Security",
    description: "Your data is encrypted with military-grade 256-bit encryption. We never sell your data.",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Asset prices update in real-time so you always know exactly what your portfolio is worth.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Check your portfolio on the go with our fully responsive mobile design.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-black/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Everything you need to <br />
            <span className="text-emerald-400">grow your wealth</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Powerful tools designed for modern investors. Whether you're into stocks, 
            crypto, or real estate, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
                key={index} 
                className="group p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors mb-6">
                <feature.icon className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
