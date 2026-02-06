import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const SUPABASE_URL = "https://icnfjixjohbxjxqbnnac.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbmZqaXhqb2hieGp4cWJubmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTYyNjMsImV4cCI6MjA4NTg5MjI2M30.aiU4qAgb1wicSC17EneEs4qAlLtFZbYeyMnhi4NHI7Y";

export interface DownloadEntry {
  id: string;
  movieId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  resolution: string | null;
  fileSize: string | null;
  status: 'downloading' | 'paused' | 'complete' | 'error';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
  eta: number;
  timestamp: number;
  url: string;
  error?: string;
}

interface DownloadContextType {
  downloads: DownloadEntry[];
  startDownload: (info: {
    movieId: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    resolution: string | null;
    fileSize: string | null;
    url: string;
  }) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  clearDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

const STORAGE_KEY = 'cineverse-downloads';

function getStoredDownloads(): DownloadEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: DownloadEntry[] = JSON.parse(stored);
    // Reset any "downloading" entries to "paused" since the fetch was lost on reload
    return parsed.map(d => d.status === 'downloading' ? { ...d, status: 'paused' as const, speed: 0, eta: 0 } : d);
  } catch {
    return [];
  }
}

function saveToStorage(downloads: DownloadEntry[]) {
  // Don't persist chunks, just metadata
  localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadEntry[]>(getStoredDownloads);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const chunksRef = useRef<Map<string, Uint8Array[]>>(new Map());
  const speedSamplesRef = useRef<Map<string, { time: number; bytes: number }[]>>(new Map());

  // Persist to localStorage whenever downloads change
  useEffect(() => {
    saveToStorage(downloads);
  }, [downloads]);

  const updateDownload = useCallback((id: string, updates: Partial<DownloadEntry>) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const calculateSpeed = useCallback((id: string, currentBytes: number) => {
    const now = Date.now();
    let samples = speedSamplesRef.current.get(id) || [];
    samples.push({ time: now, bytes: currentBytes });
    // Keep only last 5 seconds of samples
    const cutoff = now - 5000;
    samples = samples.filter(s => s.time > cutoff);
    speedSamplesRef.current.set(id, samples);

    if (samples.length < 2) return 0;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const timeDiff = (last.time - first.time) / 1000;
    if (timeDiff === 0) return 0;
    return (last.bytes - first.bytes) / timeDiff;
  }, []);

  const performDownload = useCallback(async (id: string, url: string, startByte: number = 0) => {
    const controller = new AbortController();
    controllersRef.current.set(id, controller);

    try {
      // Build proxy URL through Supabase edge function to avoid CORS
      const proxyUrl = `${SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(url)}`;
      
      const headers: HeadersInit = {
        'apikey': SUPABASE_KEY,
      };
      if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`;
      }

      console.log('[Download] Fetching via proxy:', proxyUrl);
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers,
      });

      console.log('[Download] Response status:', response.status, response.statusText);

      if (!response.ok && response.status !== 206) {
        const errorBody = await response.text().catch(() => '');
        console.error('[Download] Error body:', errorBody);
        throw new Error(`HTTP ${response.status}: ${response.statusText} ${errorBody}`);
      }

      const contentLength = response.headers.get('Content-Length');
      const contentRange = response.headers.get('Content-Range');
      
      let totalBytes = 0;
      if (contentRange) {
        // Format: bytes 0-999/5000
        const match = contentRange.match(/\/(\d+)/);
        if (match) totalBytes = parseInt(match[1], 10);
      } else if (contentLength) {
        totalBytes = startByte + parseInt(contentLength, 10);
      }

      if (totalBytes > 0) {
        updateDownload(id, { totalBytes });
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      let receivedLength = startByte;
      const existingChunks = chunksRef.current.get(id) || [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        existingChunks.push(value);
        chunksRef.current.set(id, existingChunks);
        receivedLength += value.length;

        const speed = calculateSpeed(id, receivedLength);
        const eta = speed > 0 && totalBytes > 0 ? (totalBytes - receivedLength) / speed : 0;
        const progress = totalBytes > 0 ? (receivedLength / totalBytes) * 100 : 0;

        updateDownload(id, {
          downloadedBytes: receivedLength,
          totalBytes: totalBytes || receivedLength,
          speed,
          eta,
          progress: Math.min(progress, 100),
          status: 'downloading',
        });
      }

      // Download complete - create blob and trigger save
      const blob = new Blob(existingChunks as BlobPart[]);
      const blobUrl = URL.createObjectURL(blob);
      
      // Get filename from download entry
      const dl = downloads.find(d => d.id === id);
      const filename = dl
        ? `${dl.title.replace(/\s+/g, '.')}.${dl.year || 'XXXX'}.${dl.resolution || 'HD'}.Web-Dl(cineverse).mkv`
        : 'download.mkv';

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      updateDownload(id, {
        status: 'complete',
        progress: 100,
        speed: 0,
        eta: 0,
        downloadedBytes: receivedLength,
        totalBytes: totalBytes || receivedLength,
      });

      // Cleanup
      chunksRef.current.delete(id);
      speedSamplesRef.current.delete(id);
      controllersRef.current.delete(id);

    } catch (err: any) {
      controllersRef.current.delete(id);
      
      if (err.name === 'AbortError') {
        // User paused - don't update status, it's already set
        return;
      }

      console.error('Download error:', err);
      updateDownload(id, {
        status: 'error',
        speed: 0,
        eta: 0,
        error: err.message || 'Download failed',
      });
    }
  }, [calculateSpeed, updateDownload, downloads]);

  const startDownload = useCallback((info: {
    movieId: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    resolution: string | null;
    fileSize: string | null;
    url: string;
  }) => {
    // Check if already downloading this movie
    const existing = downloads.find(d => d.movieId === info.movieId && d.status !== 'error');
    if (existing) {
      if (existing.status === 'paused') {
        resumeDownload(existing.id);
      }
      return;
    }

    const id = `${info.movieId}-${Date.now()}`;
    const newEntry: DownloadEntry = {
      id,
      movieId: info.movieId,
      title: info.title,
      posterUrl: info.posterUrl,
      year: info.year,
      resolution: info.resolution,
      fileSize: info.fileSize,
      status: 'downloading',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      eta: 0,
      timestamp: Date.now(),
      url: info.url,
    };

    setDownloads(prev => [newEntry, ...prev]);
    
    // Start the actual download
    setTimeout(() => performDownload(id, info.url), 100);
  }, [downloads, performDownload]);

  const pauseDownload = useCallback((id: string) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(id);
    }
    updateDownload(id, { status: 'paused', speed: 0, eta: 0 });
  }, [updateDownload]);

  const resumeDownload = useCallback((id: string) => {
    const dl = downloads.find(d => d.id === id);
    if (!dl) return;

    speedSamplesRef.current.delete(id);
    updateDownload(id, { status: 'downloading' });

    // If we have chunks, resume from where we left off
    const existingChunks = chunksRef.current.get(id);
    const startByte = existingChunks 
      ? existingChunks.reduce((sum, chunk) => sum + chunk.length, 0)
      : 0;

    performDownload(id, dl.url, startByte);
  }, [downloads, performDownload, updateDownload]);

  const removeDownload = useCallback((id: string) => {
    // Abort if active
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(id);
    }
    chunksRef.current.delete(id);
    speedSamplesRef.current.delete(id);
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearDownloads = useCallback(() => {
    // Abort all active downloads
    controllersRef.current.forEach(controller => controller.abort());
    controllersRef.current.clear();
    chunksRef.current.clear();
    speedSamplesRef.current.clear();
    setDownloads([]);
  }, []);

  return (
    <DownloadContext.Provider value={{
      downloads,
      startDownload,
      pauseDownload,
      resumeDownload,
      removeDownload,
      clearDownloads,
    }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloadManager() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error('useDownloadManager must be used within DownloadProvider');
  return ctx;
}
