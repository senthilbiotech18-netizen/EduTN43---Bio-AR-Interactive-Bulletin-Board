/**
 * Utility helpers for parsing, extracting, and embedding YouTube and web video URLs
 */

// Regex patterns for various YouTube URL structures (desktop, mobile, short links, embeds, shorts)
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?][^\s]*)?/i;
const VIMEO_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i;

/**
 * Checks if a given string or URL is a YouTube link
 */
export function isYouTubeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return YOUTUBE_REGEX.test(url.trim());
}

/**
 * Extracts YouTube 11-character Video ID from a URL
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Generates an iframe-ready YouTube Embed URL
 */
export function getYouTubeEmbedUrl(url?: string | null, autoplay = false): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  });
  if (autoplay) {
    params.set('autoplay', '1');
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Returns high-quality YouTube thumbnail preview URL
 */
export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  // hqdefault or maxresdefault
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Checks if a URL is Vimeo
 */
export function isVimeoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return VIMEO_REGEX.test(url.trim());
}

export function getVimeoEmbedUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(VIMEO_REGEX);
  return match ? `https://player.vimeo.com/video/${match[1]}?title=0&byline=0` : null;
}

/**
 * Check if a URL or data source is ANY kind of video (YouTube, Vimeo, MP4, WebM, Blob, Data URI)
 */
export function isAnyVideoSource(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (isYouTubeUrl(trimmed) || isVimeoUrl(trimmed)) return true;
  if (trimmed.startsWith('data:video/') || trimmed.startsWith('blob:')) return true;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed);
}
