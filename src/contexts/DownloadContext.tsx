import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
const SUPABASE_URL = "https://icnfjixjohbxjxqbnnac.supabase.co";

export interface DownloadEntry {
  id: string;
  movieId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  resolution: string | null;
  fileSize: string | null;
  status: 'complete';
  timestamp: number;
  url: string;
}

interface DownloadMovieInfo {
  movieId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  resolution: string | null;
  fileSize: string | null;
  url: string;
}

interface DownloadContextType {
  downloads: DownloadEntry[];
  startDownload: (info: DownloadMovieInfo) => void;
  removeDownload: (id: string) => void;
  clearDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

const STORAGE_KEY = 'cineverse-downloads';

function getStoredDownloads(): DownloadEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveToStorage(downloads: DownloadEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
}

function formatFilename(title: string, year: number | null, resolution: string | null) {
  const y = year || 'XXXX';
  const r = resolution || 'HD';
  return `${title.replace(/\s+/g, '.')}.${y}.${r}.Web-Dl(cineverse).mkv`;
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadEntry[]>(getStoredDownloads);

  useEffect(() => {
    saveToStorage(downloads);
  }, [downloads]);

  const startDownload = useCallback((info: DownloadMovieInfo) => {
    const filename = formatFilename(info.title, info.year, info.resolution);

    // Build the HTTPS edge-function redirect URL.
    // This solves two problems:
    //  1. Mixed-content blocking (HTTP file from HTTPS page)
    //  2. WORKER_LIMIT — the function returns a 302 redirect
    //     instead of streaming, so it uses near-zero resources.
    const proxyUrl = `${SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(info.url)}&filename=${encodeURIComponent(filename)}`;

    // Open in a new tab — the edge function redirects to the file,
    // the browser downloads it natively, and the user stays on this page.
    window.open(proxyUrl, '_blank', 'noopener,noreferrer');

    // Record in download history
    const id = `${info.movieId}-${Date.now()}`;
    const newEntry: DownloadEntry = {
      id,
      movieId: info.movieId,
      title: info.title,
      posterUrl: info.posterUrl,
      year: info.year,
      resolution: info.resolution,
      fileSize: info.fileSize,
      status: 'complete',
      timestamp: Date.now(),
      url: info.url,
    };

    setDownloads(prev => [newEntry, ...prev]);
    toast.success(`Download started — ${filename}`, {
      description: 'File will be saved to your Downloads folder.',
      duration: 4000,
    });
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearDownloads = useCallback(() => {
    setDownloads([]);
  }, []);

  return (
    <DownloadContext.Provider value={{ downloads, startDownload, removeDownload, clearDownloads }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloadManager() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error('useDownloadManager must be used within DownloadProvider');
  return ctx;
}
