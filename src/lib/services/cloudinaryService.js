import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryService {
  constructor() {
    this.isConfigured = this.validateConfig();
    if (this.isConfigured) {
      this.configureCloudinary();
    }
  }

  validateConfig() {
    const requiredVars = [
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY', 
      'CLOUDINARY_API_SECRET'
    ];
    
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing Cloudinary configuration:', missing);
      return false;
    }
    
    return true;
  }

  configureCloudinary() {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  async upload(buffer, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    const {
      folder = 'pupring-ai',
      public_id = `image_${Date.now()}`,
      format = 'auto',
      transformation = null,
      skipTransformation = false
    } = options;

    try {
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          folder,
          public_id,
          format,
          resource_type: 'image',
          quality: 'auto:best'
        };

        if (transformation && !skipTransformation) {
          uploadOptions.transformation = transformation;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject({ success: false, error: error.message });
            } else {
              resolve({
                success: true,
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height
              });
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteImage(publicId) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  getTransformationUrl(publicId, transformations) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation: transformations
    });
  }
}