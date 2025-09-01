import sharp from 'sharp';
import { uploadToCloudinary } from './cloudinaryUpload.js';

/**
 * Clean Simple Engraving - Clean lines with facial features
 * Professional laser engraving style
 */

async function createCleanSimpleStyle(imageBuffer, style = 'standard') {
  console.log(`🎨 Creating ${style} clean simple engraving...`);
  
  const size = 1000; // Good resolution for detail
  
  // Step 1: Prepare image
  let processed = await sharp(imageBuffer)
    .resize(size, size, { 
      fit: 'inside',
      kernel: sharp.kernel.lanczos3
    })
    .grayscale()
    .normalise()
    .toBuffer();
  
  // Step 2: Apply adaptive preprocessing based on style
  if (style === 'detailed') {
    // Less blur for more detail
    processed = await sharp(processed)
      .blur(0.5)
      .modulate({ brightness: 1.2, contrast: 2.0 })
      .sharpen({ sigma: 1.5 })
      .toBuffer();
  } else if (style === 'bold') {
    // More blur for bolder lines
    processed = await sharp(processed)
      .blur(1.2)
      .modulate({ brightness: 1.1, contrast: 2.5 })
      .toBuffer();
  } else {
    // Standard - balanced
    processed = await sharp(processed)
      .blur(0.8)
      .modulate({ brightness: 1.15, contrast: 2.2 })
      .sharpen({ sigma: 1.0 })
      .toBuffer();
  }
  
  // Step 3: Multi-scale edge detection for better feature capture
  // First pass - fine details (eyes, nose)
  const fineEdges = await sharp(processed)
    .convolve({
      width: 3,
      height: 3,
      kernel: [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
      ]
    })
    .threshold(50)
    .toBuffer();
  
  // Second pass - major features (outline, ears)
  const majorEdges = await sharp(processed)
    .blur(1.0)
    .convolve({
      width: 3,
      height: 3,
      kernel: [
        0, -1, 0,
       -1,  4, -1,
        0, -1, 0
      ]
    })
    .threshold(40)
    .toBuffer();
  
  // Combine both edge maps
  let edges = await sharp(fineEdges)
    .composite([{
      input: majorEdges,
      blend: 'multiply'
    }])
    .negate() // Invert so edges are black
    .toBuffer();
  
  // Step 4: Clean up based on style
  if (style === 'bold') {
    // Dilate for thicker lines
    edges = await sharp(edges)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          0, 1, 0,
          1, 1, 1,
          0, 1, 0
        ],
        scale: 5
      })
      .threshold(200)
      .toBuffer();
  } else if (style === 'detailed') {
    // Keep fine details, just clean noise
    edges = await sharp(edges)
      .median(2)
      .toBuffer();
  } else {
    // Standard - moderate cleanup
    edges = await sharp(edges)
      .median(3)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          1, 1, 1,
          1, 1, 1,
          1, 1, 1
        ],
        scale: 9
      })
      .threshold(220)
      .toBuffer();
  }
  
  // Step 5: Convert to transparent background
  const { data, info } = await sharp(edges)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const pixels = new Uint8Array(data);
  const { width, height, channels } = info;
  const output = new Uint8Array(width * height * 4);
  
  // Initialize as transparent
  for (let i = 0; i < output.length; i += 4) {
    output[i] = 255;     // R
    output[i + 1] = 255; // G
    output[i + 2] = 255; // B
    output[i + 3] = 0;   // A (transparent)
  }
  
  // Draw black lines where edges exist
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;
    
    const value = pixels[srcIdx];
    
    // Black pixels are edges
    if (value < 50) {
      output[dstIdx] = 0;       // R (black)
      output[dstIdx + 1] = 0;   // G (black)
      output[dstIdx + 2] = 0;   // B (black)
      output[dstIdx + 3] = 255; // A (opaque)
    }
  }
  
  // Step 6: Post-processing - enhance features
  const enhanced = enhanceFeatures(output, width, height, style);
  
  return sharp(Buffer.from(enhanced), {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png({ compressionLevel: 9 })
  .toBuffer();
}

// Enhance facial features by connecting nearby points
function enhanceFeatures(pixels, width, height, style) {
  const output = new Uint8Array(pixels);
  
  // Connect nearby black pixels to form continuous lines
  const maxGap = style === 'detailed' ? 3 : 2;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // If this is a transparent pixel
      if (output[idx + 3] === 0) {
        // Check for nearby black pixels in multiple directions
        let blackCount = 0;
        let totalBlack = 0;
        
        // Check in a small radius
        for (let dy = -maxGap; dy <= maxGap; dy++) {
          for (let dx = -maxGap; dx <= maxGap; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nIdx = (ny * width + nx) * 4;
              if (output[nIdx + 3] === 255 && output[nIdx] === 0) {
                totalBlack++;
                // Count black pixels in specific patterns
                if ((Math.abs(dx) <= 1 && Math.abs(dy) <= 1)) {
                  blackCount++;
                }
              }
            }
          }
        }
        
        // Fill gaps to connect features
        if (blackCount >= 2 && totalBlack >= 3) {
          output[idx] = 0;
          output[idx + 1] = 0;
          output[idx + 2] = 0;
          output[idx + 3] = 255;
        }
      }
    }
  }
  
  // Second pass - remove isolated pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      if (output[idx + 3] === 255 && output[idx] === 0) {
        let neighbors = 0;
        
        // Check 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (output[nIdx + 3] === 255 && output[nIdx] === 0) {
              neighbors++;
            }
          }
        }
        
        // Remove if too isolated
        if (neighbors < 1) {
          output[idx] = 255;
          output[idx + 1] = 255;
          output[idx + 2] = 255;
          output[idx + 3] = 0;
        }
      }
    }
  }
  
  return output;
}

/**
 * Create multiple clean simple engraving styles
 */
export async function createCleanSimpleEngravingStyles(imageUrl) {
  console.log('🎨 Creating clean simple engraving styles...');
  
  const styles = {};
  const errors = [];
  
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    const styleTypes = ['standard', 'detailed', 'bold'];
    
    for (const style of styleTypes) {
      try {
        const processedBuffer = await createCleanSimpleStyle(imageBuffer, style);
        
        console.log(`📦 ${style} engraving: ${(processedBuffer.length / 1024).toFixed(2)}KB`);
        
        const uploadResult = await uploadToCloudinary(processedBuffer, {
          folder: 'pupring-ai/clean-simple-engravings',
          public_id: `clean_simple_${style}_${Date.now()}`,
          format: 'png',
          skipTransformation: true
        });
        
        if (uploadResult.success) {
          styles[style] = uploadResult.url;
          console.log(`✅ ${style} clean simple engraving created`);
        } else {
          errors.push({ style, error: uploadResult.error });
        }
      } catch (styleError) {
        console.error(`❌ Error creating ${style}:`, styleError);
        errors.push({ style, error: styleError.message });
      }
    }
    
  } catch (error) {
    console.error('Clean simple engraving error:', error);
    errors.push({ error: error.message });
  }
  
  return {
    success: Object.keys(styles).length > 0,
    styles,
    errors,
    method: 'clean-simple-engraving'
  };
}