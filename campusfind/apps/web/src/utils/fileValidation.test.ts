import { describe, it, expect } from 'vitest';
import { isValidImageSize, isValidImageType, validateImageFile } from './fileValidation';

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

  it('should return valid true when file meets type and size constraints', () => {
    const validFile = { name: 'photo.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' };
    expect(validateImageFile(validFile)).toEqual({ valid: true });
  });

  it('should return error message when file type is invalid', () => {
    const invalidDoc = { name: 'document.pdf', size: 1024, type: 'application/pdf' };
    const res = validateImageFile(invalidDoc);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Format file "document.pdf" tidak didukung');
  });

  it('should return error message when file size exceeds 5MB', () => {
    const bigImg = { name: 'big.png', size: 6 * 1024 * 1024, type: 'image/png' };
    const res = validateImageFile(bigImg);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('melebihi batas maksimal 5 MB');
  });
});