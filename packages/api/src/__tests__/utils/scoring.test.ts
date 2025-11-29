import { describe, it, expect } from 'vitest';
import { calculateScore, getScoreGrade, getScoreColor } from '../../utils/scoring';

describe('utils/scoring', () => {
  describe('calculateScore', () => {
    it('returns 100 for zero issues', () => {
      const result = calculateScore({
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      });
      expect(result).toBe(100);
    });

    it('returns lower score for critical issues', () => {
      const result = calculateScore({
        critical: 1,
        serious: 0,
        moderate: 0,
        minor: 0,
      });
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThan(0);
    });

    it('weights critical issues more heavily than serious', () => {
      const criticalScore = calculateScore({
        critical: 1,
        serious: 0,
        moderate: 0,
        minor: 0,
      });

      const seriousScore = calculateScore({
        critical: 0,
        serious: 1,
        moderate: 0,
        minor: 0,
      });

      expect(criticalScore).toBeLessThan(seriousScore);
    });

    it('weights serious issues more heavily than moderate', () => {
      const seriousScore = calculateScore({
        critical: 0,
        serious: 1,
        moderate: 0,
        minor: 0,
      });

      const moderateScore = calculateScore({
        critical: 0,
        serious: 0,
        moderate: 1,
        minor: 0,
      });

      expect(seriousScore).toBeLessThan(moderateScore);
    });

    it('weights moderate issues more heavily than minor', () => {
      const moderateScore = calculateScore({
        critical: 0,
        serious: 0,
        moderate: 1,
        minor: 0,
      });

      const minorScore = calculateScore({
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 1,
      });

      expect(moderateScore).toBeLessThan(minorScore);
    });

    it('returns rounded integer', () => {
      const result = calculateScore({
        critical: 1,
        serious: 2,
        moderate: 3,
        minor: 4,
      });
      expect(Number.isInteger(result)).toBe(true);
    });

    it('never returns below 0', () => {
      const result = calculateScore({
        critical: 100,
        serious: 100,
        moderate: 100,
        minor: 100,
      });
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('never returns above 100', () => {
      const result = calculateScore({
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      });
      expect(result).toBeLessThanOrEqual(100);
    });

    it('decreases score as issues accumulate', () => {
      const score1 = calculateScore({ critical: 1, serious: 0, moderate: 0, minor: 0 });
      const score2 = calculateScore({ critical: 2, serious: 0, moderate: 0, minor: 0 });
      const score3 = calculateScore({ critical: 3, serious: 0, moderate: 0, minor: 0 });

      expect(score1).toBeGreaterThan(score2);
      expect(score2).toBeGreaterThan(score3);
    });

    it('handles mixed severity counts', () => {
      const result = calculateScore({
        critical: 2,
        serious: 5,
        moderate: 10,
        minor: 20,
      });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('uses logarithmic scaling for realistic distribution', () => {
      const score10 = calculateScore({ critical: 0, serious: 10, moderate: 0, minor: 0 });
      const score20 = calculateScore({ critical: 0, serious: 20, moderate: 0, minor: 0 });
      
      const difference = score10 - score20;
      expect(difference).toBeLessThan(score10 / 2);
    });
  });

  describe('getScoreGrade', () => {
    it('returns A for score >= 90', () => {
      expect(getScoreGrade(90)).toBe('A');
      expect(getScoreGrade(95)).toBe('A');
      expect(getScoreGrade(100)).toBe('A');
    });

    it('returns B for score 80-89', () => {
      expect(getScoreGrade(80)).toBe('B');
      expect(getScoreGrade(85)).toBe('B');
      expect(getScoreGrade(89)).toBe('B');
    });

    it('returns C for score 70-79', () => {
      expect(getScoreGrade(70)).toBe('C');
      expect(getScoreGrade(75)).toBe('C');
      expect(getScoreGrade(79)).toBe('C');
    });

    it('returns D for score 60-69', () => {
      expect(getScoreGrade(60)).toBe('D');
      expect(getScoreGrade(65)).toBe('D');
      expect(getScoreGrade(69)).toBe('D');
    });

    it('returns F for score < 60', () => {
      expect(getScoreGrade(59)).toBe('F');
      expect(getScoreGrade(30)).toBe('F');
      expect(getScoreGrade(0)).toBe('F');
    });

    it('handles edge cases at boundaries', () => {
      expect(getScoreGrade(89.9)).toBe('B');
      expect(getScoreGrade(79.9)).toBe('C');
      expect(getScoreGrade(69.9)).toBe('D');
      expect(getScoreGrade(59.9)).toBe('F');
    });
  });

  describe('getScoreColor', () => {
    it('returns green for score >= 70', () => {
      expect(getScoreColor(70)).toBe('#10b981');
      expect(getScoreColor(85)).toBe('#10b981');
      expect(getScoreColor(100)).toBe('#10b981');
    });

    it('returns yellow for score 40-69', () => {
      expect(getScoreColor(40)).toBe('#f59e0b');
      expect(getScoreColor(55)).toBe('#f59e0b');
      expect(getScoreColor(69)).toBe('#f59e0b');
    });

    it('returns red for score < 40', () => {
      expect(getScoreColor(39)).toBe('#ef4444');
      expect(getScoreColor(20)).toBe('#ef4444');
      expect(getScoreColor(0)).toBe('#ef4444');
    });

    it('handles boundary values correctly', () => {
      expect(getScoreColor(70)).toBe('#10b981');
      expect(getScoreColor(69.9)).toBe('#f59e0b');
      expect(getScoreColor(40)).toBe('#f59e0b');
      expect(getScoreColor(39.9)).toBe('#ef4444');
    });
  });
});