import { describe, expect, it } from 'vitest';
import { MAX_LOCAL_IMAGE_FILE_BYTES } from './projectLimits';
import { readImageFileAsDataUrl } from './readLocalImageFile';

describe('readImageFileAsDataUrl', () => {
  it('rejects wrong MIME type', async () => {
    const file = new File(['x'], 'x.bin', { type: 'application/octet-stream' });
    const r = await readImageFileAsDataUrl(file);
    expect(r.ok).toBe(false);
  });

  it('rejects file over byte limit before reading', async () => {
    const buf = new Uint8Array(MAX_LOCAL_IMAGE_FILE_BYTES + 1);
    const file = new File([buf], 'big.png', { type: 'image/png' });
    const r = await readImageFileAsDataUrl(file);
    expect(r).toEqual(expect.objectContaining({ ok: false }));
    if (r.ok === false) {
      expect(r.error).toContain('KB');
    }
  });
});
