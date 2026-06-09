import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function wrap(min: number, max: number, v: number) {
  const range = max - min
  return ((v - min) % range) + min
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

