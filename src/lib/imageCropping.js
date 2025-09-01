import { cloudinary, getPublicIdFromUrl } from './cloudinaryUpload.js'

// Crop pet face using Cloudinary transformations
export async function cropPetFace(imageUrl, coordinates, originalImageDimensions) {
  try {
    console.log('✂️ Cropping pet face...');
    
    if (!coordinates || !coordinates.x || !coordinates.y || !coordinates.width || !coordinates.height) {
      console.log('⚠️ No valid coordinates for cropping, skipping...');
      return {
        success: false,
        error: 'No valid coordinates provided',
        processedUrl: imageUrl
      };
    }
    
    // Extract public ID from the Cloudinary URL
    const publicId = getPublicIdFromUrl(imageUrl);
    
    // Get image dimensions from the detection result or Cloudinary
    let imageWidth, imageHeight;
    
    if (originalImageDimensions) {
      imageWidth = originalImageDimensions.width;
      imageHeight = originalImageDimensions.height;
    } else {
      // Get image info from Cloudinary if not provided
      try {
        const imageInfo = await cloudinary.api.resource(publicId);
        imageWidth = imageInfo.width;
        imageHeight = imageInfo.height;
      } catch (error) {
        console.log('⚠️ Could not get image dimensions, using coordinates as-is');
        imageWidth = coordinates.x * 2; // Estimate
        imageHeight = coordinates.y * 2; // Estimate
      }
    }
    
    console.log(`📏 Working with image dimensions: ${imageWidth}x${imageHeight}`);
    
    // Use Roboflow coordinates with MODERATE padding to show more of the pet
    const centerX = Math.round(coordinates.x);
    const centerY = Math.round(coordinates.y);
    const detectionWidth = Math.round(coordinates.width);
    const detectionHeight = Math.round(coordinates.height);
    
    // Add SMART padding to ensure full face capture including ears and chin
    // Calculate dynamic padding based on detection size
    const basePaddingFactor = 1.4; // 40% base padding for complete face
    const sizeFactor = Math.min(detectionWidth, detectionHeight) / Math.min(imageWidth, imageHeight);
    
    // Increase padding for smaller detections to ensure nothing is cut off
    const paddingFactor = sizeFactor < 0.25 ? 1.6 : basePaddingFactor;
    const paddedWidth = Math.round(detectionWidth * paddingFactor);
    const paddedHeight = Math.round(detectionHeight * paddingFactor);
    
    // Smart vertical adjustment - shift up slightly to exclude body but keep chin
    const neckReduction = Math.round(detectionHeight * 0.08); // Minimal shift to keep full face
    
    // Convert center-based coordinates to top-left coordinates for Cloudinary
    const cropX = Math.max(0, centerX - Math.round(paddedWidth / 2));
    const cropY = Math.max(0, centerY - Math.round(paddedHeight / 2) - neckReduction); // Shifted UP to focus on face only
    
    // Ensure crop doesn't exceed image boundaries
    const finalX = Math.min(cropX, imageWidth - paddedWidth);
    const finalY = Math.min(cropY, imageHeight - paddedHeight);
    const finalWidth = Math.min(paddedWidth, imageWidth - finalX);
    const finalHeight = Math.min(paddedHeight, imageHeight - finalY);
    
    console.log(`📐 Roboflow detection: center(${centerX}, ${centerY}), size(${detectionWidth}x${detectionHeight})`);
    console.log(`📐 Dynamic padding: ${((paddingFactor - 1) * 100).toFixed(0)}% (size factor: ${sizeFactor.toFixed(2)})`);
    console.log(`📐 Padded size: ${paddedWidth}x${paddedHeight}`);
    console.log(`📐 Vertical adjustment: ${neckReduction}px upward (minimal to preserve chin)`);
    console.log(`📐 Final crop: topLeft(${finalX}, ${finalY}), size(${finalWidth}x${finalHeight})`);
    console.log(`📐 Image bounds: ${imageWidth}x${imageHeight}`);
    
    // Create crop with moderate padding to show more of the pet
    const croppedUrl = cloudinary.url(publicId, {
      transformation: [
        // Crop with 20% padding around Roboflow detection
        {
          crop: 'crop',
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight
        }
        // Preserves more of the pet's features
      ],
      quality: 'auto:best',
      format: 'png'
    });
    
    console.log('📷 Generated cropped URL:', croppedUrl);
    
    // Upload the cropped version back to Cloudinary for persistence
    const uploadResponse = await cloudinary.uploader.upload(croppedUrl, {
      folder: 'pupring-ai/cropped',
      resource_type: 'image',
      public_id: `cropped_face_${Date.now()}`,
      quality: 'auto:best',
      format: 'png'
    });

    console.log('✅ Pet face cropped - focused on face with reduced neck area:', uploadResponse.public_id);
    return {
      success: true,
      processedUrl: uploadResponse.secure_url,
      originalUrl: imageUrl,
      publicId: uploadResponse.public_id,
      cropCoordinates: { 
        x: finalX, 
        y: finalY, 
        width: finalWidth, 
        height: finalHeight,
        roboflowDetection: coordinates,
        padding: `${((paddingFactor - 1) * 100).toFixed(0)}% dynamic padding, ${neckReduction}px upward shift`,
        imageDimensions: { width: imageWidth, height: imageHeight }
      }
    };
    
  } catch (error) {
    console.error('❌ Face cropping error:', error);
    return {
      success: false,
      error: error.message,
      processedUrl: imageUrl // fallback to original
    };
  }
}
