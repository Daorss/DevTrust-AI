import { motion } from "motion/react";
import Icon from "./Icon";
import gdgLogo from "../assets/GoogleDeveloperGroups.svg";

const LINKS: { label: string; href: string }[] = [
  { label: "Documentation", href: "https://github.com/daorss/DevTrust-AI" },
  {
    label: "Google Developer Groups",
    href: "https://developers.google.com/community/gdg",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function Footer() {
  return (
    <motion.footer
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="bg-surface-container-lowest border-t border-outline-variant/10 w-full py-xl"
    >
      <div className="max-w-7xl mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 gap-lg items-center">
        <div className="space-y-md">
          <div className="flex items-center gap-base">
            <Icon name="security" className="text-primary" />
            <span className="font-sans font-semibold text-on-surface">
              DevTrust AI
            </span>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant">
            © 2026 DevTrust AI. Secure Intelligence for the modern stack.
          </p>
          <a
            href="https://developers.google.com/community/gdg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-sm mt-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <span className="font-mono text-label-sm text-on-surface-variant">
              Built at
            </span>
            <span className="inline-flex items-center bg-white rounded px-2 py-0.5">
              <img
                src={gdgLogo}
                alt="Google Developer Groups"
                className="h-4"
              />
            </span>
          </a>
        </div>

        <nav className="flex flex-wrap md:justify-end gap-xl">
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-label-sm text-on-surface-variant hover:text-on-surface hover:underline decoration-primary transition-all"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </motion.footer>
  );
}
