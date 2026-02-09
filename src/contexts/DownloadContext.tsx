import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

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

    // Trigger native browser download via hidden anchor
    const link = document.createElement('a');
    link.href = info.url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Record as complete in download history
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
