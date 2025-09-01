import sharp from 'sharp';
import { uploadToCloudinary } from './cloudinaryUpload.js';

/**
 * Simple Feature Engraving - Medium lines with basic pet features
 * Focuses on: eyes, nose, ears, face outline, minimal fur texture
 */

async function createSimpleFeatureStyle(imageBuffer, style = 'standard') {
  console.log(`🎨 Creating ${style} simple feature engraving...`);
  
  const size = 1000;
  
  // Step 1: Prepare image
  const prepared = await sharp(imageBuffer)
    .resize(size, size, { 
      fit: 'inside',
      kernel: sharp.kernel.cubic // Softer than lanczos for less detail
    })
    .grayscale()
    .normalise()
    .modulate({ brightness: 1.1, contrast: 1.4 })
    .toBuffer();
  
  // Step 2: Extract main features (not fine details)
  const features = await sharp(prepared)
    .median(3) // Remove noise and fine details
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 0.5 }) // Moderate sharpening
    .toBuffer();
  
  // Step 3: Edge detection with medium strength
  let edgeKernel;
  let blurAmount = 0;
  let contrastBoost = 1.5;
  
  if (style === 'bold') {
    // Slightly thicker lines
    edgeKernel = [
      -1, -2, -1,
      -2, 12, -2,
      -1, -2, -1
    ];
    blurAmount = 0.6;
    contrastBoost = 1.8;
  } else if (style === 'detailed') {
    // Slightly more detail
    edgeKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    blurAmount = 0;
    contrastBoost = 1.4;
  } else {
    // Standard - medium lines
    edgeKernel = [
      -1, -1, -1,
      -1,  8, -1,
      -1, -1, -1
    ];
    blurAmount = 0.3;
    contrastBoost = 1.5;
  }
  
  // Apply edge detection
  let edges = await sharp(features)
    .convolve({
      width: 3,
      height: 3,
      kernel: edgeKernel
    })
    .modulate({ contrast: contrastBoost })
    .toBuffer();
  
  // Apply blur if needed for line thickness
  if (blurAmount > 0) {
    edges = await sharp(edges)
      .blur(blurAmount)
      .toBuffer();
  }
  
  // Step 4: Create binary image with medium threshold
  const binary = await sharp(edges)
    .threshold(style === 'bold' ? 160 : style === 'detailed' ? 190 : 180) // Adjust threshold per style
    .toBuffer();
  
  // Step 5: Process to clean output
  const { data, info } = await sharp(binary)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const pixels = new Uint8Array(data);
  const { width, height, channels } = info;
  const output = new Uint8Array(width * height * 4);
  
  // Convert to black lines on transparent background
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;
    
    const value = pixels[srcIdx];
    
    // Invert: white areas (255) become black lines
    if (value > 200) {
      output[dstIdx] = 0;       // R (black)
      output[dstIdx + 1] = 0;   // G (black)
      output[dstIdx + 2] = 0;   // B (black)
      output[dstIdx + 3] = 255; // A (opaque)
    } else {
      output[dstIdx] = 255;     // R
      output[dstIdx + 1] = 255; // G
      output[dstIdx + 2] = 255; // B
      output[dstIdx + 3] = 0;   // A (transparent)
    }
  }
  
  // Step 6: Clean up - fill small gaps in important features
  const cleanedOutput = fillGaps(output, width, height);
  
  // Convert back to PNG
  return sharp(Buffer.from(cleanedOutput), {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png({ compressionLevel: 9 })
  .toBuffer();
}

// Helper function to connect dots into continuous lines
function fillGaps(pixels, width, height) {
  const output = new Uint8Array(pixels);
  
  // Pass 1: Connect nearby dots (within 3 pixels)
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = (y * width + x) * 4;
      
      // If current pixel is black (a dot/trace point)
      if (output[idx + 3] === 255 && output[idx] === 0) {
        // Look for nearby black pixels and connect them
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const ny = y + dy;
            const nx = x + dx;
            if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
            
            const neighborIdx = (ny * width + nx) * 4;
            
            // If neighbor is also black, connect them
            if (output[neighborIdx + 3] === 255 && output[neighborIdx] === 0) {
              // Draw a line between current pixel and neighbor
              connectPoints(output, width, x, y, nx, ny);
            }
          }
        }
      }
    }
  }
  
  // Pass 2: Fill remaining small gaps
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // If current pixel is transparent
      if (output[idx + 3] === 0) {
        // Count black neighbors
        let blackNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (output[nIdx + 3] === 255 && output[nIdx] === 0) {
              blackNeighbors++;
            }
          }
        }
        
        // If surrounded by enough black pixels, fill it
        if (blackNeighbors >= 2) {
          output[idx] = 0;       // R (black)
          output[idx + 1] = 0;   // G (black)
          output[idx + 2] = 0;   // B (black)
          output[idx + 3] = 255; // A (opaque)
        }
      }
    }
  }
  
  return output;
}

// Helper function to draw a line between two points
function connectPoints(pixels, width, x1, y1, x2, y2) {
  // Simple line drawing using linear interpolation
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  
  const steps = Math.max(dx, dy);
  
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    
    const idx = (y * width + x) * 4;
    
    // Only fill if currently transparent
    if (pixels[idx + 3] === 0) {
      pixels[idx] = 0;       // R (black)
      pixels[idx + 1] = 0;   // G (black)
      pixels[idx + 2] = 0;   // B (black)
      pixels[idx + 3] = 255; // A (opaque)
    }
  }
}

/**
 * Create multiple simple feature engraving styles
 */
export async function createSimpleFeatureEngravingStyles(imageUrl) {
  console.log('🎨 Creating simple feature engraving styles...');
  
  const styles = {};
  const errors = [];
  
  try {
    // Fetch image once
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // Create three styles
    const styleTypes = ['standard', 'detailed', 'bold'];
    
    for (const style of styleTypes) {
      try {
        const processedBuffer = await createSimpleFeatureStyle(imageBuffer, style);
        
        console.log(`📦 ${style} engraving: ${(processedBuffer.length / 1024).toFixed(2)}KB`);
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(processedBuffer, {
          folder: 'pupring-ai/simple-feature-engravings',
          public_id: `simple_feature_${style}_${Date.now()}`,
          format: 'png',
          skipTransformation: true
        });
        
        if (uploadResult.success) {
          styles[style] = uploadResult.url;
          console.log(`✅ ${style} simple feature engraving created`);
        } else {
          errors.push({ style, error: uploadResult.error });
        }
      } catch (styleError) {
        console.error(`❌ Error creating ${style}:`, styleError);
        errors.push({ style, error: styleError.message });
      }
    }
    
  } catch (error) {
    console.error('Simple feature engraving error:', error);
    errors.push({ error: error.message });
  }
  
  return {
    success: Object.keys(styles).length > 0,
    styles,
    errors,
    method: 'simple-feature-engraving'
  };
}