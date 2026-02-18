import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function proxyImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg';
  return url.replace(
    'https://icnfjixjohbxjxqbnnac.supabase.co',
    'https://proxies-lake.vercel.app'
  );
}

