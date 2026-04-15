const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function normalizeUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function isYouTubeHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'youtu.be' ||
    normalized === 'www.youtu.be' ||
    normalized === 'youtube.com' ||
    normalized === 'www.youtube.com' ||
    normalized === 'm.youtube.com' ||
    normalized === 'music.youtube.com'
  );
}

function extractVideoIdFromPath(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const candidate = pathname.slice(prefix.length).split('/')[0] || '';
  return YOUTUBE_VIDEO_ID_REGEX.test(candidate) ? candidate : null;
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YOUTUBE_VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  const url = normalizeUrl(trimmed);
  if (!url) return null;
  if (!isYouTubeHostname(url.hostname)) return null;

  if (url.hostname.toLowerCase().includes('youtu.be')) {
    const idFromShort = url.pathname.replace(/^\//, '').split('/')[0] || '';
    return YOUTUBE_VIDEO_ID_REGEX.test(idFromShort) ? idFromShort : null;
  }

  const watchId = url.searchParams.get('v');
  if (watchId && YOUTUBE_VIDEO_ID_REGEX.test(watchId)) {
    return watchId;
  }

  return (
    extractVideoIdFromPath(url.pathname, '/embed/') ||
    extractVideoIdFromPath(url.pathname, '/shorts/') ||
    extractVideoIdFromPath(url.pathname, '/live/') ||
    null
  );
}

export function toYouTubeEmbedUrl(input: string): string | null {
  const id = extractYouTubeVideoId(input);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}
