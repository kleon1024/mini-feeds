"use client";

import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type HeroSectionProps = {
  translations: {
    subtitle: string;
    title: string;
    description: string;
    startLearning: string;
    projectOverview: string;
    [key: string]: string;
  };
  categoryTranslations: {
    architecture: string;
    coreFeatures: string;
    recommendation: string;
    searchAds: string;
    commerceMarketing: string;
    llmApplications: string;
    advancedTopics: string;
    appendix: string;
    [key: string]: string;
  };
};

export default function HeroSection({ translations, categoryTranslations }: HeroSectionProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          {/* 左侧内容 */}
          <div className="flex flex-col justify-center space-y-6 order-2 md:order-1">
            {/* Badge 和标题 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="px-3 py-1 text-sm bg-black text-white border-black">
                {translations.subtitle}
              </Badge>
              <h1 className="text-4xl font-bold sm:text-5xl xl:text-6xl text-black">
                {translations.title}
              </h1>
              <p className="max-w-[600px] text-black md:text-xl">{translations.description}</p>
            </motion.div>

            {/* CTA 按钮 */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/docs/1-architecture/overview">
                <Button
                  size="lg"
                  className="gap-2 group transition-transform transform hover:scale-105"
                >
                  {translations.startLearning}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/docs/1-architecture/overview">
                <Button variant="outline" size="lg" className="transition-transform hover:scale-105">
                  {translations.projectOverview}
                </Button>
              </Link>
            </div>
          </div>

          {/* 右侧插画或动态图 */}
          <div 
            className="relative flex items-center justify-center h-[250px] md:h-[350px] lg:h-[400px] bg-slate-950 rounded-lg overflow-hidden order-1 md:order-2 p-4 [--hypercube-size:100px] md:[--hypercube-size:150px]"
          >
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-gradient-to-tr from-indigo-600/60 to-purple-600/60 rounded-full blur-3xl animate-pulse" />

            <div style={{ perspective: '300px' }}>
              {/* Hypercube-like rotation */}
              <motion.div
                className="relative w-[var(--hypercube-size)] h-[var(--hypercube-size)]"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: [0, 360], rotateX: [0, -360] }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {/* Cube Faces */}
                <div className="absolute w-full h-full border border-cyan-400/20 bg-cyan-900/10" style={{ transform: `rotateY(0deg) translateZ(calc(var(--hypercube-size) / 2))` }} />
                <div className="absolute w-full h-full border border-cyan-400/20 bg-cyan-900/10" style={{ transform: `rotateY(90deg) translateZ(calc(var(--hypercube-size) / 2))` }} />
                <div className="absolute w-full h-full border border-cyan-400/20 bg-cyan-900/10" style={{ transform: `rotateY(180deg) translateZ(calc(var(--hypercube-size) / 2))` }} />
                <div className="absolute w-full h-full border border-cyan-400/20 bg-cyan-900/10" style={{ transform: `rotateY(270deg) translateZ(calc(var(--hypercube-size) / 2))` }} />
                <div className="absolute w-full h-full border border-cyan-400/20 bg-cyan-900/10" style={{ transform: `rotateX(90deg) translateZ(calc(var(--hypercube-size) / 2))` }} />
                <div className="absolute w-full h-full border border-cyan-400/20 bg-cyan-900/10" style={{ transform: `rotateX(-90deg) translateZ(calc(var(--hypercube-size) / 2))` }} />

                {/* Inner Mobius Strip */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotateX(60deg)' }}>
                  <svg viewBox="0 0 100 100" className="w-1/2 h-1/2 overflow-visible drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                    <defs>
                      <linearGradient id="mobius-gradient" gradientTransform="rotate(90)">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M20,50 C20,25 45,25 50,50 C55,75 80,75 80,50 C80,25 55,25 50,50 C45,75 20,75 20,50Z"
                      fill="none"
                      stroke="url(#mobius-gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "230 230", strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: [0, -460] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
