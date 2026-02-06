import { useState, useCallback, useEffect } from 'react';

export interface DownloadEntry {
  id: string;
  movieId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  resolution: string | null;
  fileSize: string | null;
  status: 'downloading' | 'paused' | 'complete';
  progress: number;
  timestamp: number;
  url: string;
}

const STORAGE_KEY = 'cineverse-downloads';

function getStoredDownloads(): DownloadEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDownloads(downloads: DownloadEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadEntry[]>(getStoredDownloads);

  useEffect(() => {
    saveDownloads(downloads);
  }, [downloads]);

  const addDownload = useCallback((entry: Omit<DownloadEntry, 'id' | 'timestamp' | 'status' | 'progress'>) => {
    const newEntry: DownloadEntry = {
      ...entry,
      id: `${entry.movieId}-${Date.now()}`,
      timestamp: Date.now(),
      status: 'complete',
      progress: 100,
    };

    setDownloads(prev => {
      // Don't add duplicates for the same movie
      const exists = prev.some(d => d.movieId === entry.movieId);
      if (exists) return prev;
      return [newEntry, ...prev];
    });
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearDownloads = useCallback(() => {
    setDownloads([]);
  }, []);

  return { downloads, addDownload, removeDownload, clearDownloads };
}
