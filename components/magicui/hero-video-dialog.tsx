"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { Play, X } from "lucide-react";

interface HeroVideoDialogProps {
  animationStyle?: "from-center" | "from-top" | "from-bottom" | "fade";
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  className?: string;
}

export const HeroVideoDialog = ({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
}: HeroVideoDialogProps) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const variants = {
    "from-center": {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.5, opacity: 0 },
    },
    "from-top": {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 },
    },
    "from-bottom": {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className="group relative cursor-pointer overflow-hidden rounded-2xl"
        onClick={() => setIsVideoOpen(true)}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="w-full transition-transform duration-300 group-hover:scale-105 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl backdrop-blur-sm"
          >
            <Play className="h-6 w-6 fill-indigo-600 text-indigo-600 ml-1" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-4xl mx-4"
              {...variants[animationStyle]}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-white/70 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
              <div className="aspect-video overflow-hidden rounded-2xl shadow-2xl">
                <iframe
                  src={videoSrc}
                  className="h-full w-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
