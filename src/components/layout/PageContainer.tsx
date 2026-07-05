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
      // Extra bottom padding on mobile keeps the last row clear of the FAB
      className={`max-w-[1400px] mx-auto px-6 pt-6 pb-24 sm:pb-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
