export class ImageCleaner {
  async cleanImage(buffer: Buffer, options: any) {
    return {
      success: false,
      error: 'Image cleaner service is not configured in production',
      cleanedBuffer: buffer,
      method: 'none',
      processingTime: 0,
      originalSize: buffer.length,
      cleanedSize: buffer.length,
    };
  }
}

export const imageCleaner = new ImageCleaner();
