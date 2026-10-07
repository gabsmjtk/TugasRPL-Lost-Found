import { describe, it, expect } from 'vitest';
import { isValidImageSize, isValidImageType } from './fileValidation';

describe('File Validation Tests', () => {
  it('should return true for file size under 5MB', () => {
    expect(isValidImageSize(3 * 1024 * 1024)).toBe(true);
  });

  it('should return false for file size over 5MB', () => {
    expect(isValidImageSize(6 * 1024 * 1024)).toBe(false);
  });

  it('should return true for valid image types', () => {
    expect(isValidImageType('image/jpeg')).toBe(true);
    expect(isValidImageType('image/png')).toBe(true);
  });

  it('should return false for invalid file types', () => {
    expect(isValidImageType('application/pdf')).toBe(false);
  });
});