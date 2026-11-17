import { BACKEND_URL } from '../services/api';

/**
 * Mengubah path gambar relatif (/uploads/...), format uploads/..., nama file,
 * atau URL absolut menjadi full URL gambar yang valid tanpa duplikasi path.
 *
 * Skenario:
 * - null, undefined, '' -> ''
 * - https://... atau http://... -> tetap apa adanya
 * - /uploads/foto.jpg -> ${BACKEND_URL}/uploads/foto.jpg
 * - uploads/foto.jpg -> ${BACKEND_URL}/uploads/foto.jpg
 * - foto.jpg -> ${BACKEND_URL}/uploads/foto.jpg
 */
export function getImageUrl(pathOrFileName?: string | null): string {
  if (!pathOrFileName) return '';

  if (pathOrFileName.startsWith('http://') || pathOrFileName.startsWith('https://')) {
    return pathOrFileName;
  }

  const normalized = pathOrFileName.startsWith('/') ? pathOrFileName : `/${pathOrFileName}`;
  const cleanPath = normalized.startsWith('/uploads/') ? normalized : `/uploads${normalized}`;

  return `${BACKEND_URL}${cleanPath}`;
}
