
export interface FileSizeConfig {
  maxStoryContentSize: number;
  maxTitleSize: number;
  maxImageSize?: number;
}

export const FILE_SIZE_LIMITS: FileSizeConfig = {
  maxStoryContentSize: 10000, // 10KB for story content
  maxTitleSize: 200, // 200 characters for titles
  maxImageSize: 5 * 1024 * 1024, // 5MB for images if needed
};

export function validateContentSize(content: string, maxSize: number, fieldName: string): void {
  const sizeInBytes = Buffer.byteLength(content, 'utf8');
  if (sizeInBytes > maxSize) {
    throw new Error(`${fieldName} exceeds maximum size of ${maxSize} bytes. Current size: ${sizeInBytes} bytes`);
  }
}

export function truncateContent(content: string, maxSize: number): string {
  if (content.length <= maxSize) return content;
  
  // Find the last complete sentence before the limit
  const truncated = content.substring(0, maxSize);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxSize * 0.8) {
    return truncated.substring(0, lastSentence + 1);
  }
  
  return truncated + '...';
}

export function getContentSizeInfo(content: string) {
  return {
    characters: content.length,
    bytes: Buffer.byteLength(content, 'utf8'),
    estimatedReadingTime: Math.ceil(content.split(' ').length / 200), // 200 WPM average
  };
}
