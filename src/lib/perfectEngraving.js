import sharp from 'sharp';
import { uploadToCloudinary } from './cloudinaryUpload.js';

/**
 * Perfect Engraving Module - Creates consistent high-quality engravings
 * Matches the exact style requested: clean black lines with transparent background
 */

export async function createPerfectEngraving(imageUrl) {
  console.log('🎨 Creating perfect engraving with transparent background...');
  
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // High resolution for maximum detail
    const size = 1500;
    
    // Step 1: Prepare image with maximum sharpness
    const prepared = await sharp(imageBuffer)
      .resize(size, size, { 
        fit: 'inside',
        kernel: sharp.kernel.lanczos3
      })
      .grayscale()
      .sharpen({ sigma: 1.0, m1: 2.5, m2: 1.5 })
      .normalize()
      .modulate({ brightness: 1.1, contrast: 1.3 })
      .toBuffer();
    
    // Step 2: Extract edges and details
    const edges = await sharp(prepared)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ]
      })
      .normalize()
      .toBuffer();
    
    // Step 3: Create high contrast version
    const highContrast = await sharp(prepared)
      .linear(3.5, -(128 * 2))
      .toBuffer();
    
    // Step 4: Combine edges with contrast
    const combined = await sharp(highContrast)
      .composite([{
        input: await sharp(edges).threshold(40).toBuffer(),
        blend: 'darken'
      }])
      .toBuffer();
    
    // Step 5: Apply adaptive threshold with transparency
    const { data, info } = await sharp(combined)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const pixels = new Uint8Array(data);
    const { width, height } = info;
    const channels = 4; // RGBA for transparency
    const output = new Uint8Array(width * height * channels);
    
    // Initialize all pixels as transparent
    for (let i = 0; i < output.length; i += 4) {
      output[i] = 0;     // R
      output[i + 1] = 0; // G
      output[i + 2] = 0; // B
      output[i + 3] = 0; // A (transparent)
    }
    
    // Process each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * (info.channels || 1);
        const dstIdx = (y * width + x) * 4;
        const pixelValue = pixels[srcIdx];
        
        // Calculate local average for adaptive threshold
        let sum = 0;
        let count = 0;
        const windowSize = 11;
        const halfWindow = Math.floor(windowSize / 2);
        
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const ny = Math.min(Math.max(y + dy, 0), height - 1);
            const nx = Math.min(Math.max(x + dx, 0), width - 1);
            const localIdx = (ny * width + nx) * (info.channels || 1);
            sum += pixels[localIdx];
            count++;
          }
        }
        
        const localAvg = sum / count;
        const threshold = localAvg * 0.85; // Adaptive threshold
        
        // Determine if pixel should be drawn
        let shouldDraw = false;
        
        if (pixelValue < threshold * 0.3) {
          // Very dark - always draw
          shouldDraw = true;
        } else if (pixelValue < threshold * 0.5) {
          // Dark - draw for texture
          shouldDraw = ((x + y) % 2 === 0);
        } else if (pixelValue < threshold * 0.7) {
          // Medium - sparse pattern
          shouldDraw = ((x % 3) + (y % 3) === 0);
        } else if (pixelValue < threshold) {
          // Light - very sparse
          shouldDraw = ((x % 4) === 0 && (y % 4) === 0);
        }
        
        // Set pixel if it should be drawn
        if (shouldDraw) {
          output[dstIdx] = 0;       // R (black)
          output[dstIdx + 1] = 0;   // G (black)
          output[dstIdx + 2] = 0;   // B (black)
          output[dstIdx + 3] = 255; // A (opaque)
        }
      }
    }
    
    // Clean up isolated pixels
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        if (output[idx + 3] === 255) { // If pixel is opaque
          let neighbors = 0;
          
          // Count opaque neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (output[nIdx + 3] === 255) neighbors++;
            }
          }
          
          // Remove if isolated
          if (neighbors < 2) {
            output[idx + 3] = 0; // Make transparent
          }
        }
      }
    }
    
    // Convert to PNG with transparency
    const finalBuffer = await sharp(Buffer.from(output), {
      raw: {
        width,
        height,
        channels: 4
      }
    })
    .png({ 
      compressionLevel: 9,
      quality: 100
    })
    .toBuffer();
    
    console.log(`📦 Perfect engraving size: ${(finalBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(finalBuffer, {
      folder: 'pupring-ai/perfect-engravings',
      public_id: `perfect_${Date.now()}`,
      format: 'png',
      skipTransformation: true
    });
    
    if (uploadResult.success) {
      console.log('✅ Perfect engraving created with transparent background');
      return {
        success: true,
        url: uploadResult.url,
        method: 'perfect-engraving'
      };
    } else {
      throw new Error(uploadResult.error);
    }
    
  } catch (error) {
    console.error('❌ Perfect engraving error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create multiple perfect engraving styles
 */
export async function createPerfectEngravingStyles(imageUrl) {
  console.log('🎨 Creating perfect engraving styles...');
  
  const styles = {};
  const errors = [];
  
  try {
    // Create the main perfect engraving
    const result = await createPerfectEngraving(imageUrl);
    
    if (result.success) {
      // Use same result for all styles (they all use the perfect algorithm)
      styles.standard = result.url;
      styles.detailed = result.url;
      styles.bold = result.url;
      
      console.log('✅ Perfect engraving styles created');
    } else {
      errors.push({ error: result.error });
    }
    
  } catch (error) {
    console.error('Perfect engraving styles error:', error);
    errors.push({ error: error.message });
  }
  
  return {
    success: Object.keys(styles).length > 0,
    styles,
    errors,
    method: 'perfect-engraving'
  };
}