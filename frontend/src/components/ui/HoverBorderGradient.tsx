"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HoverBorderGradientProps {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
  as?: React.ElementType;
  duration?: number;
  clockwise?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  onClick,
  disabled = false,
  ...otherProps
}: HoverBorderGradientProps) {
  return (
    <Tag
      className={cn(
        "relative group p-px rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 transition-all duration-500 hover:from-blue-500/40 hover:to-purple-500/40",
        containerClassName
      )}
      onClick={onClick}
      disabled={disabled}
      {...otherProps}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{
          background: clockwise
            ? [
                "linear-gradient(0deg, #3b82f6, #a855f7)",
                "linear-gradient(90deg, #3b82f6, #a855f7)",
                "linear-gradient(180deg, #3b82f6, #a855f7)",
                "linear-gradient(270deg, #3b82f6, #a855f7)",
                "linear-gradient(360deg, #3b82f6, #a855f7)",
              ]
            : [
                "linear-gradient(360deg, #3b82f6, #a855f7)",
                "linear-gradient(270deg, #3b82f6, #a855f7)",
                "linear-gradient(180deg, #3b82f6, #a855f7)",
                "linear-gradient(90deg, #3b82f6, #a855f7)",
                "linear-gradient(0deg, #3b82f6, #a855f7)",
              ],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
      <div
        className={cn(
          "relative z-10 bg-neutral-900 rounded-full px-8 py-3 text-white font-medium transition-all duration-500 group-hover:bg-neutral-800 group-disabled:opacity-50 group-disabled:cursor-not-allowed",
          className
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

export default HoverBorderGradient;