"use client";

import { cn } from "@/lib/utils";

interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: { imageUrl: string; profileUrl?: string; name?: string }[];
}

export const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-4 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <div key={index} className="relative group">
          <img
            className="h-10 w-10 rounded-full border-2 border-white object-cover ring-2 ring-indigo-100"
            src={url.imageUrl}
            width={40}
            height={40}
            alt={url.name || `Avatar ${index + 1}`}
          />
          {url.name && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {url.name}
            </div>
          )}
        </div>
      ))}
      {numPeople !== undefined && numPeople > 0 && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-center text-xs font-medium text-white">
          +{numPeople}
        </div>
      )}
    </div>
  );
};
