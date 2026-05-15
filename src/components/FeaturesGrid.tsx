import { motion } from "motion/react";
import Icon from "./Icon";

interface Feature {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  fill?: boolean;
  aiCore?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: "analytics",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Trust Score",
    description:
      "A unified 0-100 index derived from multiple signals to provide an instant legitimacy assessment.",
  },
  {
    icon: "terminal",
    iconColor: "text-secondary",
    iconBg: "bg-secondary-container/10",
    title: "Commit Verification",
    description:
      "Advanced analysis of commit signatures, GPG keys, and author consistency across the history.",
  },
  {
    icon: "groups",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Contribution Patterns",
    description:
      "Detect bot-driven activity or artificial inflate cycles that mask inactive or dead projects.",
  },
  {
    icon: "auto_awesome",
    iconColor: "text-primary",
    iconBg: "bg-primary/20",
    fill: true,
    aiCore: true,
    title: "AI Explanation",
    description:
      "Human-readable insights that explain exactly why a repository received its specific trust rating.",
  },
  {
    icon: "workspace_premium",
    iconColor: "text-secondary",
    iconBg: "bg-secondary-container/10",
    title: "Repository Quality",
    description:
      "Analysis of documentation completeness, issue response times, and overall project health.",
  },
  {
    icon: "warning",
    iconColor: "text-error",
    iconBg: "bg-error/10",
    title: "Risk Signals",
    description:
      "Early detection of malicious takeovers, typosquatting, and vulnerable dependency patterns.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const cardGrid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`glass-card p-lg rounded-xl flex flex-col gap-md hover:shadow-[0_0_30px_rgba(174,198,255,0.1)] transition-all relative overflow-hidden ${
        feature.aiCore ? "border-primary/20 bg-primary/5" : ""
      }`}
    >
      {feature.aiCore && (
        <div className="absolute top-0 right-0 bg-primary text-on-primary font-mono text-label-sm px-md py-xs rounded-bl-lg">
          AI CORE
        </div>
      )}
      <div className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center`}>
        <Icon name={feature.icon} className={feature.iconColor} fill={feature.fill} />
      </div>
      <h3 className="font-sans text-headline-md font-semibold text-on-surface">
        {feature.title}
      </h3>
      <p className="font-sans text-body-md text-on-surface-variant">{feature.description}</p>
    </motion.div>
  );
}

export default function FeaturesGrid() {
  return (
    <section className="py-xxl max-w-[1280px] mx-auto px-gutter">
      <motion.div
        className="text-center mb-xl"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <h2
          className="font-sans text-headline-lg font-semibold text-on-surface"
          style={{ letterSpacing: "-0.02em" }}
        >
          Comprehensive Trust Intelligence
        </h2>
        <p className="font-sans text-on-surface-variant mx-auto mt-base">
          Our multi-layered analysis engine scans over 40 distinct metrics to verify the
          legitimacy of any open-source project.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-lg"
        variants={cardGrid}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </motion.div>
    </section>
  );
}
