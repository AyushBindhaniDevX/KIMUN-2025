"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ProgressiveBlurProps {
  className?: string;
  children: React.ReactNode;
  direction?: "top" | "bottom" | "left" | "right";
  blurIntensity?: number;
}

export const ProgressiveBlur = ({
  className,
  children,
  direction = "bottom",
  blurIntensity = 8,
}: ProgressiveBlurProps) => {
  const gradientMap = {
    bottom: "to bottom",
    top: "to top",
    left: "to left",
    right: "to right",
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backdropFilter: `blur(${blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          maskImage: `linear-gradient(${gradientMap[direction]}, transparent 50%, black 100%)`,
          WebkitMaskImage: `linear-gradient(${gradientMap[direction]}, transparent 50%, black 100%)`,
        }}
      />
    </div>
  );
};

export const IconCloud = ({
  iconSlugs,
  className,
}: {
  iconSlugs: string[];
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-wrap gap-3 items-center justify-center p-4", className)}>
      {iconSlugs.map((slug, i) => (
        <div
          key={slug}
          className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all cursor-default"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          {slug.toUpperCase()}
        </div>
      ))}
    </div>
  );
};

interface DottedMapProps {
  className?: string;
  dots?: { lat: number; lng: number; label?: string }[];
}

export const DottedMap = ({ className, dots = [] }: DottedMapProps) => {
  // Simple SVG-based world map with dots
  const toSVG = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 800,
    y: ((90 - lat) / 180) * 400,
  });

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-slate-50", className)}>
      <svg viewBox="0 0 800 400" className="w-full opacity-30">
        {/* World outline dots */}
        {Array.from({ length: 80 }).map((_, row) =>
          Array.from({ length: 160 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 5 + 2.5}
              cy={row * 5 + 2.5}
              r={1}
              fill="#94a3b8"
            />
          ))
        )}
      </svg>
      <svg viewBox="0 0 800 400" className="absolute inset-0 w-full">
        {dots.map((dot, i) => {
          const { x, y } = toSVG(dot.lat, dot.lng);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill="#4f46e5" />
              <circle cx={x} cy={y} r={8} fill="#4f46e5" opacity="0.3" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
