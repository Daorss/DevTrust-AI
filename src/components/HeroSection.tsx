import { useState } from "react";
import { motion } from "motion/react";
import Icon from "./Icon";

interface HeroSectionProps {
  onAnalyze: (url: string, jobDescription?: string) => void;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function HeroSection({ onAnalyze }: HeroSectionProps) {
  const [url, setUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJd] = useState(true);

  function handleAnalyze() {
    if (url.trim()) onAnalyze(url.trim(), jobDescription.trim() || undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAnalyze();
  }

  return (
    <section className="min-h-[1024px] flex flex-col items-center justify-center relative overflow-hidden hero-gradient px-gutter">
      {/* Ambient blobs */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto space-y-lg"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          className="font-sans text-display-lg text-on-surface leading-[1.1]"
          style={{ letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          Look up GitHub profile{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            legitimacy
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="font-sans text-body-lg text-on-surface-variant max-w-2xl mx-auto"
        >
          Verify trust signals, detect supply chain risks, and analyze
          contribution patterns in seconds with our weighted intelligence
          engine.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="relative max-w-2xl mx-auto mt-xxl group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur opacity-50 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative flex items-center bg-surface-dim/80 backdrop-blur-md rounded-full p-2 border border-outline-variant/40">
            <Icon name="search" className="ml-lg text-outline flex-shrink-0" />
            <input
              className="bg-transparent border-none focus:ring-0 w-full px-md py-4 font-mono text-code-md text-on-surface placeholder:text-outline/50 outline-none"
              placeholder="https://github.com/username"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleAnalyze}
              className="flex-shrink-0 bg-primary text-on-primary px-xxl py-4 rounded-full font-sans font-bold shadow-[0_0_20px_rgba(174,198,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              Analyze
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="max-w-2xl mx-auto text-left">
          <button className="flex items-center gap-xs font-mono text-label-sm text-outline hover:text-primary transition-colors">
            Job Description
          </button>

          {showJd && (
            <div className="mt-sm relative">
              <div className="absolute -inset-px bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-sm" />
              <textarea
                className="relative w-full bg-surface-dim/80 backdrop-blur-md border border-outline-variant/40 rounded-2xl p-lg font-mono text-code-md text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/50 transition-colors resize-none"
                rows={5}
                placeholder="Paste a job description here and we'll analyse how well the developer's code matches it..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex flex-wrap justify-center gap-lg pt-lg text-outline font-mono text-label-sm"
        >
          {(
            [
              "Legitimacy Check",
              "Real-time Analysis",
              "LLM Powered Explanations",
            ] as const
          ).map((label) => (
            <span key={label} className="flex items-center gap-xs">
              <Icon name="check_circle" fill size="14px" />
              {label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
