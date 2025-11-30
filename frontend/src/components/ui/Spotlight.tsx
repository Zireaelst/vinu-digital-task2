"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export const Spotlight = ({ className, fill }: SpotlightProps) => {
  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute -top-40 left-0 z-0 h-screen w-screen opacity-0",
        className
      )}
      style={{
        background: `conic-gradient(from 90deg at 50% 50%, transparent 50%, ${
          fill || "#262626"
        } 50%)`,
      }}
      initial={{ opacity: 0, transform: "translate(-72%, -62%) scale(0.5)" }}
      animate={{ opacity: 1, transform: "translate(-50%, -40%) scale(1)" }}
      transition={{ duration: 2, ease: "easeOut", delay: 0.75 }}
    />
  );
};

export default Spotlight;