import { describe, it, expect } from 'vitest';
import { getImageUrl } from './imageUrl';
import { BACKEND_URL } from '../services/api';

describe('Image URL Utility Tests', () => {
  it('should return empty string for null, undefined, or empty string', () => {
    expect(getImageUrl('')).toBe('');
    expect(getImageUrl(null)).toBe('');
    expect(getImageUrl(undefined)).toBe('');
  });

  it('should return untouched URL if already an absolute external URL', () => {
    const url = 'https://example.com/foto.jpg';
    expect(getImageUrl(url)).toBe(url);
    const httpUrl = 'http://example.com/foto.jpg';
    expect(getImageUrl(httpUrl)).toBe(httpUrl);
  });

  it('should resolve /uploads/foto.jpg correctly without duplication', () => {
    expect(getImageUrl('/uploads/foto.jpg')).toBe(`${BACKEND_URL}/uploads/foto.jpg`);
  });

  it('should resolve uploads/foto.jpg without leading slash and prevent /uploads/uploads/ duplication', () => {
    expect(getImageUrl('uploads/foto.jpg')).toBe(`${BACKEND_URL}/uploads/foto.jpg`);
  });

  it('should resolve plain filename foto.jpg by prepending /uploads/', () => {
    expect(getImageUrl('foto.jpg')).toBe(`${BACKEND_URL}/uploads/foto.jpg`);
  });
});
