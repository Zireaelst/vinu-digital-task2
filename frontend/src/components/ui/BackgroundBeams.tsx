"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundBeamsProps {
  className?: string;
}

export const BackgroundBeams = ({ className }: BackgroundBeamsProps) => {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867", 
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
  ];

  return (
    <div className={cn("absolute inset-0 z-0 overflow-hidden", className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="beamGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {paths.map((path, index) => (
          <motion.path
            key={index}
            d={path}
            stroke="url(#beamGradient)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 3,
              delay: index * 0.5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-radial-from-center opacity-40" />
    </div>
  );
};

export default BackgroundBeams;