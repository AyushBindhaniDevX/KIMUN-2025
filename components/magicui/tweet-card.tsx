"use client";

import { cn } from "@/lib/utils";
import { ExternalLink, Heart, MessageCircle, Repeat2 } from "lucide-react";

interface TweetCardProps {
  className?: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  content: string;
  date?: string;
  likes?: number;
  replies?: number;
  retweets?: number;
  verified?: boolean;
}

export const TweetCard = ({
  className,
  name,
  handle,
  avatarUrl,
  content,
  date,
  likes = 0,
  replies = 0,
  retweets = 0,
  verified = false,
}: TweetCardProps) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            {name[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-sm text-slate-800 truncate">{name}</span>
            {verified && (
              <svg className="h-4 w-4 text-[#1d9bf0] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C1.86 9.33 1 10.57 1 12s.86 2.67 2.19 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.33-2.19c1.4.45 2.9.2 3.91-.81s1.27-2.52.81-3.91C21.37 14.67 22.25 13.43 22.25 12z" />
                <path fill="white" d="M10.54 16.1l-4.2-4.2 1.41-1.41 2.79 2.79 5.59-5.59 1.41 1.41-7 7z" />
              </svg>
            )}
            <span className="text-slate-400 text-xs">@{handle}</span>
          </div>
          <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{content}</p>
          <div className="mt-3 flex items-center gap-5 text-slate-400">
            <button className="flex items-center gap-1 text-xs hover:text-indigo-500 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{replies}</span>
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-green-500 transition-colors">
              <Repeat2 className="h-3.5 w-3.5" />
              <span>{retweets}</span>
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-rose-500 transition-colors">
              <Heart className="h-3.5 w-3.5" />
              <span>{likes}</span>
            </button>
            {date && <span className="ml-auto text-[10px] text-slate-300">{date}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
