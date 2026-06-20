"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface TerminalProps {
  className?: string;
  children?: React.ReactNode;
}

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
}

export const TypingAnimation = ({
  text,
  duration = 60,
  className,
}: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = React.useState<string>("");
  const [i, setI] = React.useState<number>(0);

  React.useEffect(() => {
    const typingEffect = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => clearInterval(typingEffect);
  }, [text, i, duration]);

  return (
    <span className={cn("font-mono", className)}>{displayedText}</span>
  );
};

export const Terminal = ({ className, children }: TerminalProps) => {
  return (
    <div
      className={cn(
        "relative z-0 flex h-full max-h-32 w-full flex-col overflow-hidden rounded-xl bg-[#0d1117] font-mono shadow-lg",
        className,
      )}
    >
      <div className="flex flex-row items-center gap-1.5 bg-[#161b22] px-4 py-2 border-b border-white/5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febb2c]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[10px] text-white/30">oasis — admin shell</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-xs text-green-400">
        {children}
      </div>
    </div>
  );
};
