import { MAX_IMAGE_SRC_FIELD } from './projectLimits';

const MAX_URL_LENGTH = 2048;

function isSecurePage(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

/** HTTPS ページでは http URL を拒否（混合コンテンツ・追跡の軽減） */
function rejectInsecureOnHttps(protocol: string): boolean {
  if (protocol === 'http:' && isSecurePage()) return true;
  return false;
}

/**
 * Restrict external links to http(s) to avoid javascript: and similar schemes.
 */
export function safeExternalHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.startsWith('http://') || t.startsWith('https://') ? t : `https://${t}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (rejectInsecureOnHttps(u.protocol)) return null;
    const href = u.toString();
    if (href.length > MAX_URL_LENGTH) return null;
    return href;
  } catch {
    return null;
  }
}

/**
 * data:image/*;base64 のうち、img で比較的安全なラスタ形式のみ許可（SVG は除外）。
 */
function safeDataImageSrc(t: string): string | null {
  const compact = t.trim().replace(/\s+/g, '');
  if (compact.length > MAX_IMAGE_SRC_FIELD || compact.length < 32) return null;
  const comma = compact.indexOf(',');
  if (comma === -1 || comma > 40) return null;
  const head = compact.slice(0, comma).toLowerCase();
  if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64$/.test(head)) return null;
  const b64 = compact.slice(comma + 1);
  if (!/^[A-Za-z0-9+/]+=*$/.test(b64) || b64.length < 8) return null;
  return compact;
}

/**
 * img[src] 用。https（http は非 HTTPS ページのみ）または安全な data:image/*;base64。
 */
export function safeImageSrc(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith('data:image/')) {
    return safeDataImageSrc(t);
  }
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (rejectInsecureOnHttps(u.protocol)) return null;
    const href = u.toString();
    if (href.length > MAX_URL_LENGTH) return null;
    return href;
  } catch {
    return null;
  }
}
