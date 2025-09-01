import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary with explicit error checking
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
};

// Validate configuration
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error('❌ Missing Cloudinary configuration:', {
    cloud_name: cloudinaryConfig.cloud_name ? 'OK' : 'MISSING',
    api_key: cloudinaryConfig.api_key ? 'OK' : 'MISSING',
    api_secret: cloudinaryConfig.api_secret ? 'OK' : 'MISSING'
  });
  throw new Error('Cloudinary configuration is incomplete');
}

cloudinary.config(cloudinaryConfig);

// Debug: Log successful configuration
console.log('✅ Cloudinary Config loaded:', {
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: '***',
  api_secret: '***'
});

// Upload image to Cloudinary using the official SDK
export async function uploadToCloudinary(file, options = {}) {
  try {
    console.log('Uploading to Cloudinary...');
    console.log('File size:', file.size ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'unknown');
    
    // Check if Cloudinary is properly configured
    if (!cloudinary || !cloudinary.uploader) {
      throw new Error('Cloudinary SDK not properly initialized');
    }
    
    // Convert file to base64 for upload
    let fileBuffer;
    let fileType = 'image/jpeg'; // default
    
    // Determine file type based on format option
    if (options.format === 'svg') {
      fileType = 'image/svg+xml';
    } else if (options.format === 'png') {
      fileType = 'image/png';
    }
    
    if (file instanceof Buffer) {
      fileBuffer = file;
    } else if (file.arrayBuffer) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileType = file.type || fileType;
    } else {
      throw new Error('Invalid file format');
    }
    
    // Handle SVG uploads differently
    if (options.format === 'svg' || fileType === 'image/svg+xml') {
      const svgString = fileBuffer.toString('utf-8');
      const base64File = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
      
      const uploadResponse = await cloudinary.uploader.upload(base64File, {
        folder: options.folder || 'pupring-ai',
        resource_type: 'image',
        format: 'svg',
        public_id: options.public_id || `svg_upload_${Date.now()}`,
      });

      console.log('✅ SVG upload successful:', uploadResponse.public_id);
      return {
        success: true,
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        width: uploadResponse.width,
        height: uploadResponse.height,
        processedUrl: uploadResponse.secure_url
      };
    }
    
    // Regular image upload
    const base64File = `data:${fileType};base64,${fileBuffer.toString('base64')}`;
    
    const uploadOptions = {
      folder: options.folder || 'pupring-ai',
      resource_type: 'image',
      public_id: options.public_id || `upload_${Date.now()}`,
      quality: 'auto',
      fetch_format: 'auto',
      timeout: 120000,  // 120 second timeout (doubled)
      chunk_size: 6000000,  // 6MB chunks for large files
      eager: [{ width: 800, height: 800, crop: 'limit', quality: 'auto:eco' }]  // Pre-process smaller version
    };
    
    // Only add transformations for non-SVG files - removed to reduce processing time
    // Transformations now handled via eager parameter for faster upload
    
    const uploadResponse = await cloudinary.uploader.upload(base64File, uploadOptions);

    console.log('✅ Cloudinary upload successful:', uploadResponse.public_id);
    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      width: uploadResponse.width,
      height: uploadResponse.height,
      processedUrl: uploadResponse.secure_url
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
      url: null
    };
  }
}

// Helper function to extract public ID from Cloudinary URL
export function getPublicIdFromUrl(url) {
  try {
    // Clean URL - remove query parameters first
    const cleanUrl = url.split('?')[0];
    
    // Extract from Cloudinary URL pattern
    const regex = /\/v\d+\/(.+?)\.(jpg|jpeg|png|gif|webp)$/i
    const match = cleanUrl.match(regex)
    if (match) {
      return match[1] // This includes folder if present (e.g., "pets/abc123")
    }
    
    // Alternative pattern without version
    const regex2 = /upload\/(.+?)\.(jpg|jpeg|png|gif|webp)$/i
    const match2 = cleanUrl.match(regex2)
    if (match2) {
      return match2[1]
    }
    
    // Fallback: extract filename
    const parts = cleanUrl.split('/')
    const filename = parts[parts.length - 1]
    return filename.split('.')[0].split('?')[0] // Remove any remaining query params
  } catch (error) {
    console.error('Error extracting public ID:', error)
    return 'unknown'
  }
}

// Upload base64 data URL to Cloudinary
export async function uploadBase64ToCloudinary(dataUrl, type = 'processed') {
  try {
    console.log(`📤 Uploading ${type} to Cloudinary from base64...`);
    
    // Check if it's a valid data URL
    if (!dataUrl.startsWith('data:')) {
      throw new Error('Invalid data URL format');
    }
    
    const uploadOptions = {
      folder: 'pupring-ai',
      resource_type: 'image',
      public_id: `${type}_${Date.now()}`,
      quality: 'auto:best',
      fetch_format: 'auto',
      timeout: 60000
    };
    
    const uploadResponse = await cloudinary.uploader.upload(dataUrl, uploadOptions);
    
    console.log(`✅ ${type} upload successful:`, uploadResponse.public_id);
    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      width: uploadResponse.width,
      height: uploadResponse.height
    };
  } catch (error) {
    console.error(`❌ ${type} upload error:`, error);
    return {
      success: false,
      error: error.message,
      url: null
    };
  }
}

// Export cloudinary instance for use in other modules
export { cloudinary }
