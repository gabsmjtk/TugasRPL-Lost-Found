export const isValidImageSize = (fileSize: number): boolean => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  return fileSize <= MAX_SIZE;
};

export const isValidImageType = (fileType: string): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(fileType);
};