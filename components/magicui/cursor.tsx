"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring } from "framer-motion";
import React, { useEffect } from "react";

export const SmoothCursor = ({ className }: { className?: string }) => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 28 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 8);
      cursorY.set(e.clientY - 8);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className={cn(
        "pointer-events-none fixed z-[9999] h-4 w-4 rounded-full bg-indigo-600 mix-blend-difference",
        className,
      )}
      style={{ left: springX, top: springY }}
    />
  );
};

export const Pointer = ({
  children,
  className,
  name,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
}) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {isVisible && (
        <motion.div
          className="pointer-events-none absolute z-50"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9L0 0Z" fill="#4f46e5" stroke="white" strokeWidth="1"/>
            </svg>
            {name && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white shadow-md">
                {name}
              </span>
            )}
          </div>
        </motion.div>
      )}
      {children}
    </div>
  );
};
