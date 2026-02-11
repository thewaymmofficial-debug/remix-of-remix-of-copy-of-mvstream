import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

function isWebView(): boolean {
  const ua = navigator.userAgent;
  return /Telegram|TelegramBot|wv|FBAN|Instagram|Line|MiniApp|WebView/i.test(ua);
}

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
  speed: number; // bytes per second
  eta: number; // seconds remaining
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
  cancelDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  clearDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

const STORAGE_KEY = 'cineverse-downloads';

function getStoredDownloads(): DownloadEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as DownloadEntry[];
    // Reset any in-progress downloads to paused on reload
    return parsed.map(d =>
      d.status === 'downloading' ? { ...d, status: 'paused' as const, speed: 0, eta: 0 } : d
    );
  } catch {
    return [];
  }
}

function saveToStorage(downloads: DownloadEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
}

function generateFilename(title: string, year: number | null, resolution: string | null) {
  const y = year || 'XXXX';
  const r = resolution || 'HD';
  return `${title.replace(/\s+/g, '.')}.${y}.${r}.Web-Dl(cineverse).mkv`;
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadEntry[]>(getStoredDownloads);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const blobParts = useRef<Map<string, Uint8Array[]>>(new Map());
  const doFetchRef = useRef<((id: string, url: string, filename: string, resumeFrom?: number) => void) | null>(null);

  useEffect(() => {
    saveToStorage(downloads);
  }, [downloads]);

  const updateEntry = useCallback((id: string, patch: Partial<DownloadEntry>) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const doFetchDownload = useCallback((id: string, url: string, filename: string, resumeFromBytes = 0) => {
    const controller = new AbortController();
    abortControllers.current.set(id, controller);

    if (!blobParts.current.has(id)) {
      blobParts.current.set(id, []);
    }

    const headers: Record<string, string> = {};
    if (resumeFromBytes > 0) {
      headers['Range'] = `bytes=${resumeFromBytes}-`;
    }

    updateEntry(id, { status: 'downloading', speed: 0, error: undefined });

    // Try direct fetch first (works on published app), fall back to proxy (for preview iframe)
    const attemptFetch = async (): Promise<Response> => {
      try {
        console.log('[Download] Trying direct fetch:', url);
        const directResponse = await fetch(url, { signal: controller.signal, headers, mode: 'cors' });
        console.log('[Download] Direct fetch succeeded:', directResponse.status);
        return directResponse;
      } catch (directErr) {
        console.log('[Download] Direct fetch failed, trying proxy:', (directErr as Error).message);
        const proxyUrl = `https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/download-proxy?url=${encodeURIComponent(url)}`;
        return fetch(proxyUrl, { signal: controller.signal, headers });
      }
    };

    attemptFetch()
      .then(response => {
        console.log('[Download] Response:', response.status, response.statusText, 'ok:', response.ok);
        if (!response.ok && response.status !== 206) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse total size
        let totalBytes = 0;
        const contentRange = response.headers.get('Content-Range');
        if (contentRange) {
          // Format: bytes 0-999/5000
          const match = contentRange.match(/\/(\d+)/);
          if (match) totalBytes = parseInt(match[1], 10);
        } else {
          const contentLength = response.headers.get('Content-Length');
          if (contentLength) totalBytes = parseInt(contentLength, 10) + resumeFromBytes;
        }

        if (totalBytes > 0) {
          updateEntry(id, { totalBytes });
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream not supported');

        let downloadedBytes = resumeFromBytes;
        let lastTime = Date.now();
        let lastBytes = resumeFromBytes;
        const chunks = blobParts.current.get(id)!;

        const pump = (): Promise<void> => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              // Download complete — trigger save
              if (isWebView()) {
                console.log('[Download] WebView detected, triggering system download');
                window.location.href = url;
              } else {
                const blob = new Blob(chunks as unknown as BlobPart[], { type: 'application/octet-stream' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              }

              updateEntry(id, {
                status: 'complete',
                progress: 100,
                downloadedBytes: totalBytes || downloadedBytes,
                speed: 0,
                eta: 0,
              });
              abortControllers.current.delete(id);
              blobParts.current.delete(id);
              return;
            }

            chunks.push(value);
            downloadedBytes += value.length;

            // Calculate speed every 500ms
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            let speed = 0;
            let eta = 0;

            if (elapsed >= 0.5) {
              speed = (downloadedBytes - lastBytes) / elapsed;
              lastTime = now;
              lastBytes = downloadedBytes;
              const remaining = totalBytes > 0 ? totalBytes - downloadedBytes : 0;
              eta = speed > 0 ? remaining / speed : 0;
            }

            const progress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;

            updateEntry(id, {
              downloadedBytes,
              progress,
              ...(speed > 0 ? { speed, eta } : {}),
            });

            return pump();
          });
        };

        return pump();
      })
      .catch(err => {
        console.error('[Download] Error:', err.name, err.message);
        if (err.name === 'AbortError') {
          // Paused or cancelled — don't set error
          return;
        }
        updateEntry(id, {
          status: 'error',
          error: err.message || 'Download failed',
          speed: 0,
          eta: 0,
        });
        abortControllers.current.delete(id);
        blobParts.current.delete(id);
      });
  }, [updateEntry]);

  // Keep ref in sync
  doFetchRef.current = doFetchDownload;

  const startDownload = useCallback((info: {
    movieId: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    resolution: string | null;
    fileSize: string | null;
    url: string;
  }) => {
    console.log('[Download] startDownload called:', info.movieId, info.url);

    // WebView: skip in-memory streaming entirely, hand off to system download manager
    if (isWebView()) {
      console.log('[Download] WebView detected — triggering direct system download');
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
        progress: 100,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        eta: 0,
        timestamp: Date.now(),
        url: info.url,
      };
      setDownloads(prev => [newEntry, ...prev]);

      // Try multiple methods to trigger the system download manager
      try {
        const a = document.createElement('a');
        a.href = info.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('download', '');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        // Fallback: window.open or location.href
        try {
          window.open(info.url, '_blank');
        } catch {
          window.location.href = info.url;
        }
      }
      return;
    }

    // Regular browser: stream with progress tracking
    // Remove any existing failed/paused entry for this movie
    setDownloads(prev => {
      const existing = prev.find(d => d.movieId === info.movieId && (d.status === 'downloading' || d.status === 'paused'));
      if (existing) {
        const controller = abortControllers.current.get(existing.id);
        if (controller) {
          controller.abort();
          abortControllers.current.delete(existing.id);
        }
        blobParts.current.delete(existing.id);
        return prev.filter(d => d.id !== existing.id);
      }
      return prev;
    });

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

    const filename = generateFilename(info.title, info.year, info.resolution);
    console.log('[Download] Calling doFetchDownload directly:', id, info.url);
    doFetchRef.current?.(id, info.url, filename);
  }, []);

  const pauseDownload = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    updateEntry(id, { status: 'paused', speed: 0, eta: 0 });
  }, [updateEntry]);

  const resumeDownload = useCallback((id: string) => {
    setDownloads(prev => {
      const dl = prev.find(d => d.id === id);
      if (!dl) return prev;
      const filename = generateFilename(dl.title, dl.year, dl.resolution);
      // Use ref to call fetch directly
      doFetchRef.current?.(id, dl.url, filename, dl.downloadedBytes);
      return prev;
    });
  }, []);

  const cancelDownload = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    blobParts.current.delete(id);
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const removeDownload = useCallback((id: string) => {
    cancelDownload(id);
  }, [cancelDownload]);

  const clearDownloads = useCallback(() => {
    // Abort all active
    abortControllers.current.forEach(c => c.abort());
    abortControllers.current.clear();
    blobParts.current.clear();
    setDownloads([]);
  }, []);

  return (
    <DownloadContext.Provider value={{
      downloads,
      startDownload,
      pauseDownload,
      resumeDownload,
      cancelDownload,
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
