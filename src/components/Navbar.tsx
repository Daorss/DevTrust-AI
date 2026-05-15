import { motion } from "motion/react";
import Icon from "./Icon";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
    >
      <div className="flex justify-between items-center h-16 px-gutter max-w-[1280px] mx-auto w-full">
        <div className="flex items-center gap-base">
          <Icon name="security" className="text-primary" />
          <span className="text-headline-md font-sans font-bold tracking-tight text-on-surface">
            DevTrust AI
          </span>
        </div>
      </div>
    </motion.nav>
  );
}
