import { describe, expect, it } from 'vitest';
import { safeExternalHref, safeImageSrc } from './urls';

describe('safeExternalHref', () => {
  it('allows https URL', () => {
    expect(safeExternalHref('https://example.com/path')).toBe('https://example.com/path');
  });

  it('prefixes bare host with https', () => {
    expect(safeExternalHref('example.com/foo')).toBe('https://example.com/foo');
  });

  it('rejects javascript:', () => {
    expect(safeExternalHref('javascript:alert(1)')).toBeNull();
  });

  it('rejects empty', () => {
    expect(safeExternalHref('')).toBeNull();
    expect(safeExternalHref('   ')).toBeNull();
  });

  it('rejects overlong URL', () => {
    const long = `https://example.com/${'a'.repeat(3000)}`;
    expect(safeExternalHref(long)).toBeNull();
  });
});

describe('safeImageSrc', () => {
  it('allows https image', () => {
    expect(safeImageSrc('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('rejects non-http(s)', () => {
    expect(safeImageSrc('data:text/plain,hi')).toBeNull();
  });

  it('allows small raster data URL (PNG)', () => {
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    expect(safeImageSrc(png)).toBe(png);
  });

  it('rejects data URL for non-raster or wrong structure', () => {
    expect(safeImageSrc('data:image/svg+xml;base64,PHN2Zy8+')).toBeNull();
    expect(safeImageSrc('data:image/png;base64,!!!')).toBeNull();
    expect(safeImageSrc('data:image/png,notbase64')).toBeNull();
  });
});
