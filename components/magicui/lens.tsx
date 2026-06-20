"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring } from "framer-motion";
import React, { useRef } from "react";

interface LensProps {
  children: React.ReactNode;
  zoomFactor?: number;
  lensSize?: number;
  className?: string;
}

export const Lens = ({
  children,
  zoomFactor = 1.5,
  lensSize = 170,
  className,
}: LensProps) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const springX = useSpring(mouseX, { stiffness: 300, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 25 });

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {isHovering && (
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: `radial-gradient(circle ${lensSize / 2}px at ${springX.get()}px ${springY.get()}px, black 100%, transparent 100%)`,
            maskImage: `radial-gradient(circle ${lensSize / 2}px at ${springX.get()}px ${springY.get()}px, black 100%, transparent 100%)`,
          }}
        >
          <div
            style={{
              transform: `scale(${zoomFactor})`,
              transformOrigin: `${mouseX.get()}px ${mouseY.get()}px`,
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
};
