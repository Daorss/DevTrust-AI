import { motion } from "motion/react";
import Icon from "./Icon";

interface Step {
  icon: string;
  iconColor: string;
  ringClass: string;
  badgeClass: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: "link",
    iconColor: "text-primary",
    ringClass: "bg-surface-container-high border-outline-variant/40",
    badgeClass: "bg-primary text-on-primary",
    title: "Input URL",
    description: "Paste a GitHub profile URL and an optional job description.",
  },
  {
    icon: "hub",
    iconColor: "text-primary",
    ringClass: "bg-surface-container-high border-outline-variant/40",
    badgeClass: "bg-primary text-on-primary",
    title: "GitHub API & Octokit",
    description: "We call the GitHub API via Octokit to fetch repositories and profile data.",
  },
  {
    icon: "psychology",
    iconColor: "text-secondary",
    ringClass: "bg-surface-container-high border-outline-variant/40",
    badgeClass: "bg-secondary text-on-secondary",
    title: "Analyzing via AI",
    description: "Repositories are packed and analyzed against the job description by Gemini.",
  },
  {
    icon: "auto_awesome",
    iconColor: "text-white",
    ringClass:
      "bg-primary-container border-primary/40 shadow-[0_0_20px_rgba(0,112,243,0.3)]",
    badgeClass: "bg-white text-primary",
    title: "Gemini Summary",
    description: "Gemini generates a plain-language trust verdict and job fit report.",
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

const staggerSteps = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function WorkflowSection() {
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
          Analysis Workflow
        </h2>
      </motion.div>

      <motion.div
        className="relative flex flex-col md:flex-row justify-between items-center gap-xl md:gap-0"
        variants={staggerSteps}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {/* Connector line (desktop only) */}
        <div className="absolute top-8 left-0 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent hidden md:block -z-10" />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            variants={fadeUp}
            className="flex flex-col items-center gap-md text-center max-w-[200px]"
          >
            <div
              className={`w-16 h-16 rounded-full ${step.ringClass} border flex items-center justify-center relative shadow-lg`}
            >
              <Icon name={step.icon} className={step.iconColor} />
              <div
                className={`absolute -top-2 -right-2 ${step.badgeClass} w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold`}
              >
                {i + 1}
              </div>
            </div>
            <div className="space-y-xs">
              <h4 className="font-sans text-body-md font-bold text-on-surface">{step.title}</h4>
              <p className="font-mono text-label-sm text-on-surface-variant">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
