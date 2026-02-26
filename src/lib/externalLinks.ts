/**
 * Centralized external link handling for WebToApp APK compatibility.
 * Uses multi-strategy fallback to escape Android WebView.
 */

const PLAYER_PACKAGES: Record<string, string> = {
  mxplayer: 'com.mxtech.videoplayer.ad',
  vlc: 'org.videolan.vlc',
  playit: 'com.playit.videoplayer',
};

export function isAndroidWebView(): boolean {
  const ua = navigator.userAgent || '';
  return /wv|WebView/i.test(ua) || (ua.includes('Android') && ua.includes('Version/'));
}

export function buildBrowserIntentUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const proto = parsed.protocol.replace(':', '');
    return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${proto};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(url)};end`;
  } catch {
    return url;
  }
}

export function buildVideoIntentUrl(videoUrl: string, _title?: string): string {
  return `intent:${videoUrl}#Intent;action=android.intent.action.VIEW;type=video/*;S.browser_fallback_url=${encodeURIComponent(videoUrl)};end`;
}

export function buildPlayerIntentUrl(
  videoUrl: string,
  player: keyof typeof PLAYER_PACKAGES,
  _title?: string,
): string {
  const pkg = PLAYER_PACKAGES[player];
  if (!pkg) return buildVideoIntentUrl(videoUrl, _title);
  return `intent:${videoUrl}#Intent;package=${pkg};type=video/*;S.browser_fallback_url=${encodeURIComponent(videoUrl)};end`;
}

interface OpenExternalOptions {
  useIntent?: boolean;
  strategyDelay?: number;
  onFail?: () => void;
}

export function openExternalUrl(url: string, options?: OpenExternalOptions): void {
  const delay = options?.strategyDelay ?? 400;

  // Strategy 1: Anchor with target="_system" — preserves user gesture
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_system';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    document.body.removeChild(a);
  } catch { /* continue */ }

  // Strategy 2: Android Intent URL (after delay)
  setTimeout(() => {
    if (document.visibilityState !== 'visible') return;

    if (options?.useIntent !== false) {
      try {
        window.location.href = buildBrowserIntentUrl(url);
      } catch { /* continue */ }
    }

    // Strategy 3: window.open (after another delay)
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      try {
        const win = window.open(url, '_blank');
        if (win) return;
      } catch { /* continue */ }

      // Strategy 4: Direct location change (last resort)
      setTimeout(() => {
        if (document.visibilityState !== 'visible') return;
        try {
          window.location.href = url;
        } catch { /* continue */ }

        // Final fail callback
        setTimeout(() => {
          if (document.visibilityState !== 'visible') return;
          options?.onFail?.();
        }, delay);
      }, delay);
    }, delay);
  }, delay);
}

interface OpenVideoOptions {
  player?: 'generic' | 'mxplayer' | 'vlc' | 'playit';
  title?: string;
}

export function openVideoExternal(videoUrl: string, options?: OpenVideoOptions): void {
  const player = options?.player ?? 'generic';

  // Try intent first
  try {
    const intentUrl = player === 'generic'
      ? buildVideoIntentUrl(videoUrl, options?.title)
      : buildPlayerIntentUrl(videoUrl, player, options?.title);
    window.location.href = intentUrl;
  } catch { /* continue */ }

  // Fallback after short delay
  setTimeout(() => {
    if (document.visibilityState !== 'visible') return;
    openExternalUrl(videoUrl);
  }, 500);
}
