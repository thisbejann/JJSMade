import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={`max-w-[1400px] mx-auto px-6 py-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
