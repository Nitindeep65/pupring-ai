import sharp from 'sharp';
import { uploadToCloudinary } from '../cloudinaryUpload.js';

export class ImageProcessingService {
  constructor() {
    this.defaultSize = 1200;
    this.quality = 90;
  }

  async cropImage(imageUrl, cropData) {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const metadata = await sharp(buffer).metadata();
      
      const cropOptions = {
        left: Math.round(cropData.x * metadata.width / 100),
        top: Math.round(cropData.y * metadata.height / 100),
        width: Math.round(cropData.width * metadata.width / 100),
        height: Math.round(cropData.height * metadata.height / 100)
      };
      
      const croppedBuffer = await sharp(buffer)
        .extract(cropOptions)
        .jpeg({ quality: this.quality })
        .toBuffer();
      
      const uploadResult = await uploadToCloudinary(croppedBuffer, {
        folder: 'pupring-ai/cropped',
        public_id: `cropped_${Date.now()}`
      });
      
      return uploadResult;
    } catch (error) {
      console.error('Cropping error:', error);
      return { success: false, error: error.message };
    }
  }

  async resizeImage(imageUrl, options = {}) {
    const { width = this.defaultSize, height = this.defaultSize, fit = 'inside' } = options;
    
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const resizedBuffer = await sharp(buffer)
        .resize(width, height, { fit, kernel: sharp.kernel.lanczos3 })
        .jpeg({ quality: this.quality })
        .toBuffer();
      
      return resizedBuffer;
    } catch (error) {
      console.error('Resize error:', error);
      throw error;
    }
  }

  async enhanceImage(buffer) {
    try {
      const enhancedBuffer = await sharp(buffer)
        .normalize()
        .sharpen({ sigma: 1.5, m1: 1, m2: 0.5 })
        .modulate({ brightness: 1.1, saturation: 1.2 })
        .jpeg({ quality: this.quality })
        .toBuffer();
      
      return enhancedBuffer;
    } catch (error) {
      console.error('Enhancement error:', error);
      return buffer; // Return original if enhancement fails
    }
  }

  async convertToGrayscale(buffer) {
    return await sharp(buffer)
      .grayscale()
      .toBuffer();
  }

  async applyThreshold(buffer, threshold = 128) {
    return await sharp(buffer)
      .threshold(threshold)
      .toBuffer();
  }
}