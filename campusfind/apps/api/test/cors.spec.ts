import { isOriginAllowed, allowedOrigins } from '../src/app';

describe('CORS Security Configuration', () => {
  it('harus mengizinkan request tanpa origin (seperti curl/mobile/server-to-server)', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed('')).toBe(true);
  });

  it('harus mengizinkan origin localhost yang terdaftar', () => {
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
  });

  it('harus mengizinkan origin subdomain vercel.app', () => {
    expect(isOriginAllowed('https://campusfind-web.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://my-preview-branch.vercel.app')).toBe(true);
  });

  it('harus menolak origin pihak ketiga yang tidak terdaftar', () => {
    expect(isOriginAllowed('https://malicious-site.com')).toBe(false);
    expect(isOriginAllowed('http://evil-attacker.org')).toBe(false);
    expect(isOriginAllowed('https://not-vercel.app.attacker.com')).toBe(false);
  });
});
