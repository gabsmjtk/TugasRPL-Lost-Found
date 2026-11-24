export const isValidImageSize = (fileSize: number): boolean => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  return fileSize <= MAX_SIZE;
};

export const isValidImageType = (fileType: string): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(fileType);
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: { size: number; type: string; name?: string }): FileValidationResult => {
  if (!isValidImageType(file.type)) {
    return {
      valid: false,
      error: `Format file "${file.name || 'yang dipilih'}" tidak didukung. Harap gunakan format JPG, PNG, atau WebP.`,
    };
  }
  if (!isValidImageSize(file.size)) {
    return {
      valid: false,
      error: `Ukuran file "${file.name || 'yang dipilih'}" melebihi batas maksimal 5 MB.`,
    };
  }
  return { valid: true };
};