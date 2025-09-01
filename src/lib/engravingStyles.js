import { cloudinary, getPublicIdFromUrl } from './cloudinaryUpload.js';
import { createPythonEngravingStyles } from './pythonEngraving.js';

// Main engraving function - uses Python filter_gravure_simple
export async function createEngravingStyles(imageUrl) {
  try {
    console.log('🎨 Creating engravings with Python filter_gravure_simple...');
    
    // Use the new Python engraving filter
    const pythonResult = await createPythonEngravingStyles(imageUrl);
    
    if (pythonResult.success) {
      console.log('✅ Python engraving filter successful');
      return {
        success: true,
        styles: {
          standard: pythonResult.url,
          bold: pythonResult.url
        },
        recommendation: 'standard',
        originalUrl: imageUrl,
        method: pythonResult.method || 'python-engraving-filter',
        errors: []
      };
    }
    
    console.log('⚠️ Python engraving filter failed, trying fallback...');
    
    // Final fallback to basic Cloudinary method
    console.log('⚠️ All methods failed, falling back to basic Cloudinary');
    return await createCloudinaryEngravingStyles(imageUrl);
    
  } catch (error) {
    console.error('❌ Engraving creation error:', error);
    
    // Last resort fallback
    return await createCloudinaryEngravingStyles(imageUrl);
  }
}

// Optimize image function
export async function optimizeImage(imageUrl) {
  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    
    const optimizedUrl = cloudinary.url(publicId, {
      quality: 'auto:best',
      fetch_format: 'auto',
      width: 1200,
      height: 1200,
      crop: 'limit'
    });
    
    return {
      success: true,
      optimizedUrl: optimizedUrl,
      originalUrl: imageUrl,
      size: { width: 1200, height: 1200 }
    };
  } catch (error) {
    console.error('❌ Image optimization error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Cloudinary-based fallback method (renamed from createPuppyEngravingStyles)
export async function createCloudinaryEngravingStyles(imageUrl) {
  try {
    console.log('☁️ Creating Cloudinary-based engraving styles (fallback)...');
    
    const publicId = getPublicIdFromUrl(imageUrl);
    const styles = {};
    
    // Standard style - Balanced engraving
    styles.standard = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 800, height: 800, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'contrast:70' },
        { effect: 'sharpen:130' },
        { opacity: 93 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Bold style - Stronger lines and contrast
    styles.bold = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 800, height: 800, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'contrast:90' },
        { effect: 'sharpen:180' },
        { effect: 'unsharp_mask:600' },
        { opacity: 90 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Embossed style - 3D effect
    styles.embossed = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 800, height: 800, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'oil_paint:40' },
        { effect: 'contrast:70' },
        { effect: 'sharpen:100' },
        { opacity: 85 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Edge style - Strong edge detection using sharpen instead of edge
    styles.edge = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 800, height: 800, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'sharpen:300' },
        { effect: 'unsharp_mask:1000' },
        { effect: 'negate' },
        { effect: 'contrast:100' },
        { opacity: 95 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Artistic style - Stylized artistic interpretation
    styles.artistic = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 800, height: 800, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'oil_paint:80' },
        { effect: 'contrast:90' },
        { effect: 'sharpen:80' },
        { opacity: 90 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Sketch style - Hand-drawn effect
    styles.sketch = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 800, height: 800, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'pixelate:5' },
        { effect: 'sharpen:200' },
        { effect: 'contrast:100' },
        { effect: 'unsharp_mask:300' },
        { opacity: 95 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Fur style - Optimized for fur texture
    styles.fur = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 1000, height: 1000, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'sharpen:250' },
        { effect: 'unsharp_mask:600' },
        { effect: 'contrast:120' },
        { effect: 'trim:10' },
        { opacity: 92 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    // Ultra-detailed style - Maximum detail extraction
    styles['ultra-detailed'] = cloudinary.url(publicId, {
      transformation: [
        { background: 'transparent', width: 1200, height: 1200, crop: 'pad' },
        { effect: 'grayscale' },
        { effect: 'sharpen:300' },
        { effect: 'unsharp_mask:800' },
        { effect: 'contrast:150' },
        { effect: 'improve:100' },
        { opacity: 88 }
      ],
      quality: '100',
      fetch_format: 'png',
      flags: 'preserve_transparency'
    });
    
    console.log('✅ Cloudinary engraving styles created');
    
    // Return only standard and bold styles
    return {
      success: true,
      styles: {
        standard: styles.standard || styles.embossed,
        bold: styles.bold || styles['ultra-detailed']
      },
      recommendation: 'standard',
      originalUrl: imageUrl,
      publicId: publicId,
      method: 'cloudinary'
    };
    
  } catch (error) {
    console.error('❌ Cloudinary engraving error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Backward compatibility
export async function createPuppyEngravingStyles(imageUrl) {
  return await createEngravingStyles(imageUrl);
}
