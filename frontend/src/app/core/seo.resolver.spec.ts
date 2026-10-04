import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { ActivatedRouteSnapshot, UrlSegment } from '@angular/router';
import { canonicalUrlFor } from './seo.resolver';

/** Builds a snapshot chain root → … → leaf with the given URL segments per level. */
function snapshot(...levels: string[][]): ActivatedRouteSnapshot {
  const chain = levels.map(
    (paths) => ({ url: paths.map((p) => new UrlSegment(p, {})) }) as ActivatedRouteSnapshot,
  );
  const leaf = chain[chain.length - 1];
  Object.defineProperty(leaf, 'pathFromRoot', { value: chain });
  return leaf;
}

describe('canonicalUrlFor (LSA-B6)', () => {
  it('returns the site root for the map', () => {
    expect(canonicalUrlFor(snapshot([], []))).toBe('https://coloursofsafety.com/');
  });

  it('separates host and path with a slash', () => {
    expect(canonicalUrlFor(snapshot([], ['login']))).toBe('https://coloursofsafety.com/login');
  });

  it('joins multi-segment paths using the segment path, not UrlSegment#toString', () => {
    const id = '0b6c1e9e-3a2f-4f7e-9d7a-1c2b3d4e5f60';
    expect(canonicalUrlFor(snapshot([], ['place', id]))).toBe(
      `https://coloursofsafety.com/place/${id}`,
    );
  });

  it('drops matrix parameters', () => {
    const leaf = snapshot([], ['faq']);
    leaf.url[0] = new UrlSegment('faq', { ref: 'x' });
    expect(canonicalUrlFor(leaf)).toBe('https://coloursofsafety.com/faq');
  });
});
