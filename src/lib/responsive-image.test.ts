import { describe, expect, it } from 'vitest';
import {
  buildResponsiveImage,
  buildSrcSetFromCanonical,
  RESPONSIVE_SIZES,
} from '@/lib/responsive-image';

describe('buildResponsiveImage', () => {
  it('builds srcSet from a canonical -w1280 URL', () => {
    const url = 'https://cdn.example.com/user/photo-w1280.webp';
    const result = buildResponsiveImage(url, { sizesPreset: 'card' });

    expect(result.src).toBe(url);
    expect(result.srcSet).toBe(
      [
        'https://cdn.example.com/user/photo-w480.webp 480w',
        'https://cdn.example.com/user/photo-w768.webp 768w',
        'https://cdn.example.com/user/photo-w1280.webp 1280w',
      ].join(', '),
    );
    expect(result.sizes).toBe(RESPONSIVE_SIZES.card);
  });

  it('normalizes non-canonical variant width to -w1280 src', () => {
    const result = buildResponsiveImage('https://cdn.example.com/a/photo-w480.webp');
    expect(result.src).toBe('https://cdn.example.com/a/photo-w1280.webp');
    expect(result.srcSet).toContain('photo-w768.webp 768w');
  });

  it('preserves query and hash on variants', () => {
    const result = buildResponsiveImage(
      'https://cdn.example.com/user/photo-w1280.webp?v=abc#top',
    );
    expect(result.src).toBe('https://cdn.example.com/user/photo-w1280.webp?v=abc#top');
    expect(result.srcSet).toContain('photo-w480.webp?v=abc#top 480w');
  });

  it('returns only src for legacy URLs without -wNNNN', () => {
    const url = 'https://cdn.example.com/user/legacy-photo.jpg';
    const result = buildResponsiveImage(url, { sizesPreset: 'detail' });
    expect(result).toEqual({ src: url, sizes: RESPONSIVE_SIZES.detail });
  });

  it('supports relative category-style paths with -w suffix', () => {
    const result = buildResponsiveImage('/uploads/cat-w1280.webp');
    expect(result.srcSet).toContain('/uploads/cat-w480.webp 480w');
  });

  it('returns empty src for blank input', () => {
    expect(buildResponsiveImage('')).toEqual({ src: '' });
    expect(buildResponsiveImage(null)).toEqual({ src: '' });
  });
});

describe('buildSrcSetFromCanonical', () => {
  it('returns undefined for legacy URLs', () => {
    expect(buildSrcSetFromCanonical('https://cdn.example.com/a.jpg')).toBeUndefined();
  });

  it('returns srcSet for canonical URLs', () => {
    expect(buildSrcSetFromCanonical('https://cdn.example.com/a-w1280.webp')).toContain(
      '1280w',
    );
  });
});
