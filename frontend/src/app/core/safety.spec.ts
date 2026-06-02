import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import {
  safetyColor,
  safetyIndicator,
  safetyPatternClass,
  safetyLabel,
  POI_CATEGORIES,
  POI_CATEGORY_LABELS,
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
});
