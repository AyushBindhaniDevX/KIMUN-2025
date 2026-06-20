"use client";

import { cn } from "@/lib/utils";
import { motion, useSpring } from "framer-motion";
import React, { useCallback, useRef, useState } from "react";

interface DockProps {
  className?: string;
  children: React.ReactNode;
  magnification?: number;
  distance?: number;
}

interface DockIconProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
  isActive?: boolean;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

export const Dock = ({
  className,
  children,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
}: DockProps) => {
  const mouseX = useSpring(Infinity);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseX.set(e.pageX);
    },
    [mouseX],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
  }, [mouseX]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "mx-auto flex h-16 w-max items-end gap-4 rounded-2xl border border-white/20 bg-white/80 px-4 pb-3 backdrop-blur-xl shadow-2xl",
        className,
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            mouseX,
            magnification,
            distance,
          });
        }
        return child;
      })}
    </motion.div>
  );
};

export const DockIcon = ({
  className,
  children,
  onClick,
  label,
  isActive,
  ...props
}: DockIconProps & { mouseX?: any; magnification?: number; distance?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { mouseX, magnification = DEFAULT_MAGNIFICATION, distance = DEFAULT_DISTANCE } = props as any;

  const distanceCalc = useSpring(40, { mass: 0.1, stiffness: 150, damping: 12 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (ref.current && mouseX) {
        const bounds = ref.current.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const distanceFromCenter = mouseX.get() - centerX;
        const dist = Math.max(magnification - Math.abs(distanceFromCenter), 40);
        distanceCalc.set(dist);
      }
    },
    [mouseX, magnification, distanceCalc],
  );

  const size = useSpring(40, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        ref={ref}
        style={{ width: 40, height: 40 }}
        whileHover={{ scale: 1.3, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={onClick}
        className={cn(
          "flex aspect-square cursor-pointer items-center justify-center rounded-full",
          isActive
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600",
          className,
        )}
      >
        {children}
      </motion.div>
      {label && (
        <span className="text-[9px] font-medium text-slate-500">{label}</span>
      )}
    </div>
  );
};
