import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import {
  safetyColor,
  safetyIndicator,
  safetyPatternClass,
  safetyLabel,
  POI_CATEGORIES,
  POI_CATEGORY_LABELS,
  safetySymbolColor,
  displayRating,
  ratingLabel,
} from './safety';

describe('Safety Utilities', () => {
  describe('safetyColor', () => {
    it('returns red for rating 1', () => {
      expect(safetyColor(1)).toBe('#d7263d');
    });

    it('returns orange for rating 2', () => {
      expect(safetyColor(2)).toBe('#f46036');
    });

    it('returns yellow for rating 3', () => {
      expect(safetyColor(3)).toBe('#f4c430');
    });

    it('returns light green for rating 4', () => {
      expect(safetyColor(4)).toBe('#7cb518');
    });

    it('returns dark green for rating 5', () => {
      expect(safetyColor(5)).toBe('#2e933c');
    });

    it('returns default for invalid ratings', () => {
      expect(safetyColor(0)).toBe('#2e933c');
      expect(safetyColor(6)).toBe('#2e933c');
    });
  });

  describe('safetyIndicator', () => {
    it('returns X for rating 1', () => {
      expect(safetyIndicator(1)).toBe('✕');
    });

    it('returns triangle for rating 2', () => {
      expect(safetyIndicator(2)).toBe('△');
    });

    it('returns diamond for rating 3', () => {
      expect(safetyIndicator(3)).toBe('◆');
    });

    it('returns check for rating 4', () => {
      expect(safetyIndicator(4)).toBe('✓');
    });

    it('returns star for rating 5', () => {
      expect(safetyIndicator(5)).toBe('★');
    });
  });

  describe('safetyPatternClass', () => {
    it('returns unsafe pattern for rating 1', () => {
      expect(safetyPatternClass(1)).toBe('safety-pattern-unsafe');
    });

    it('returns caution pattern for rating 2', () => {
      expect(safetyPatternClass(2)).toBe('safety-pattern-caution');
    });

    it('returns mixed pattern for rating 3', () => {
      expect(safetyPatternClass(3)).toBe('safety-pattern-mixed');
    });

    it('returns friendly pattern for rating 4', () => {
      expect(safetyPatternClass(4)).toBe('safety-pattern-friendly');
    });

    it('returns welcoming pattern for rating 5', () => {
      expect(safetyPatternClass(5)).toBe('safety-pattern-welcoming');
    });
  });

  describe('safetyLabel', () => {
    it('returns Unsafe for rating 1', () => {
      expect(safetyLabel(1)).toBe('Unsafe');
    });

    it('returns Caution for rating 2', () => {
      expect(safetyLabel(2)).toBe('Caution');
    });

    it('returns Mixed for rating 3', () => {
      expect(safetyLabel(3)).toBe('Mixed');
    });

    it('returns Friendly for rating 4', () => {
      expect(safetyLabel(4)).toBe('Friendly');
    });

    it('returns Very welcoming for rating 5', () => {
      expect(safetyLabel(5)).toBe('Very welcoming');
    });

    it('returns Unknown for invalid ratings', () => {
      expect(safetyLabel(0)).toBe('Unknown');
      expect(safetyLabel(6)).toBe('Unknown');
    });
  });

  describe('POI_CATEGORIES', () => {
    it('contains expected categories', () => {
      expect(POI_CATEGORIES).toContain('bar');
      expect(POI_CATEGORIES).toContain('cafe');
      expect(POI_CATEGORIES).toContain('healthcare');
      expect(POI_CATEGORIES).toContain('other');
    });

    it('has category labels for each', () => {
      POI_CATEGORIES.forEach((cat) => {
        expect(POI_CATEGORY_LABELS[cat]).toBeDefined();
      });
    });
  });

  describe('safetySymbolColor', () => {
    // WCAG 1.4.11: the marker symbol needs 3:1 against its fill.
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    it.each([1, 2, 3, 4, 5])('symbol on rating %i fill has at least 3:1 contrast', (rating) => {
      expect(contrast(safetySymbolColor(rating), safetyColor(rating))).toBeGreaterThanOrEqual(3);
    });
  });

  describe('displayRating (LSA-B12)', () => {
    const base = { safetyRating: 4, ratingCount: 0, communityRating: null };

    it('shows the submitted rating for community entries', () => {
      expect(displayRating({ ...base, source: 'community' })).toBe(4);
    });

    it('hides the seeder placeholder on unconfirmed imports', () => {
      expect(displayRating({ ...base, source: 'wikidata', lastVerifiedAt: null })).toBeNull();
      expect(ratingLabel(null)).toBe('Not yet rated');
    });

    it('shows an import rating once a person confirmed it', () => {
      expect(
        displayRating({ ...base, source: 'openstreetmap', lastVerifiedAt: '2026-10-01' }),
      ).toBe(4);
    });

    it('prefers the rounded community average when ratings exist', () => {
      expect(
        displayRating({ ...base, source: 'wikidata', ratingCount: 3, communityRating: 2.6 }),
      ).toBe(3);
    });
  });
});
