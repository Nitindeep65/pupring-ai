import { cloudinary, getPublicIdFromUrl } from './cloudinaryUpload.js'

export async function cropPetFaceProfessionally(imageUrl, coordinates, originalImageDimensions) {
  try {
    console.log('🎯 Professional pet face cropping...');
    
    if (!coordinates || !coordinates.x || !coordinates.y || !coordinates.width || !coordinates.height) {
      console.log('⚠️ No valid coordinates for cropping');
      return {
        success: false,
        error: 'No valid coordinates provided',
        processedUrl: imageUrl
      };
    }
    
    const publicId = getPublicIdFromUrl(imageUrl);
    
    let imageWidth, imageHeight;
    
    if (originalImageDimensions) {
      imageWidth = originalImageDimensions.width;
      imageHeight = originalImageDimensions.height;
    } else {
      try {
        const imageInfo = await cloudinary.api.resource(publicId);
        imageWidth = imageInfo.width;
        imageHeight = imageInfo.height;
      } catch (error) {
        console.log('⚠️ Could not get image dimensions');
        imageWidth = coordinates.x * 2;
        imageHeight = coordinates.y * 2;
      }
    }
    
    console.log(`📏 Image dimensions: ${imageWidth}x${imageHeight}`);
    
    const centerX = Math.round(coordinates.x);
    const centerY = Math.round(coordinates.y);
    const detectionWidth = Math.round(coordinates.width);
    const detectionHeight = Math.round(coordinates.height);
    
    // Calculate aspect ratio for optimal face framing
    const aspectRatio = detectionWidth / detectionHeight;
    
    // Intelligent padding based on face size
    // Larger padding for smaller faces to ensure complete capture
    const basePaddingFactor = 1.35; // 35% base padding
    const sizeFactor = Math.min(detectionWidth, detectionHeight) / Math.min(imageWidth, imageHeight);
    const adaptivePadding = sizeFactor < 0.3 ? 1.5 : basePaddingFactor;
    
    // Apply padding to capture full face including ears
    const paddedWidth = Math.round(detectionWidth * adaptivePadding);
    const paddedHeight = Math.round(detectionHeight * adaptivePadding);
    
    // Smart vertical adjustment to focus on face only
    // Move crop area up to exclude body/neck
    const verticalShift = Math.round(detectionHeight * 0.20); // Shift up 20% to focus on face
    
    // Horizontal adjustment to center the face better
    const horizontalAdjust = 0; // Keep centered horizontally
    
    // Calculate crop coordinates
    let cropX = Math.max(0, centerX - Math.round(paddedWidth / 2) + horizontalAdjust);
    let cropY = Math.max(0, centerY - Math.round(paddedHeight / 2) - verticalShift);
    
    // Ensure we don't crop outside image boundaries
    cropX = Math.min(cropX, imageWidth - paddedWidth);
    cropY = Math.min(cropY, imageHeight - paddedHeight);
    cropX = Math.max(0, cropX);
    cropY = Math.max(0, cropY);
    
    const finalWidth = Math.min(paddedWidth, imageWidth - cropX);
    const finalHeight = Math.min(paddedHeight, imageHeight - cropY);
    
    // Ensure minimum size for quality
    const minSize = 400;
    const scaledWidth = Math.max(finalWidth, minSize);
    const scaledHeight = Math.max(finalHeight, minSize);
    
    console.log(`📐 Detection: center(${centerX}, ${centerY}), size(${detectionWidth}x${detectionHeight})`);
    console.log(`📐 Adaptive padding: ${(adaptivePadding * 100 - 100).toFixed(0)}%`);
    console.log(`📐 Vertical shift: ${verticalShift}px upward`);
    console.log(`📐 Final crop: position(${cropX}, ${cropY}), size(${finalWidth}x${finalHeight})`);
    
    // Create high-quality face crop with Cloudinary
    const croppedUrl = cloudinary.url(publicId, {
      transformation: [
        {
          crop: 'crop',
          x: cropX,
          y: cropY,
          width: finalWidth,
          height: finalHeight
        },
        {
          width: scaledWidth,
          height: scaledHeight,
          crop: 'fill',
          gravity: 'center'
        },
        {
          radius: 'max',
          background: 'transparent'
        },
        {
          quality: 'auto:best',
          dpr: 2.0
        }
      ],
      format: 'png'
    });
    
    console.log('📷 Generated professional crop URL');
    
    // Upload the professionally cropped version
    const uploadResponse = await cloudinary.uploader.upload(croppedUrl, {
      folder: 'pupring-ai/professional-faces',
      resource_type: 'image',
      public_id: `pro_face_${Date.now()}`,
      quality: 'auto:best',
      format: 'png',
      tags: ['professional', 'face-only', 'pendant-ready']
    });

    console.log('✅ Professional face crop completed:', uploadResponse.public_id);
    
    return {
      success: true,
      processedUrl: uploadResponse.secure_url,
      originalUrl: imageUrl,
      publicId: uploadResponse.public_id,
      cropDetails: {
        position: { x: cropX, y: cropY },
        size: { width: finalWidth, height: finalHeight },
        padding: `${(adaptivePadding * 100 - 100).toFixed(0)}%`,
        verticalShift: `${verticalShift}px upward`,
        quality: 'professional',
        faceOnly: true
      }
    };
    
  } catch (error) {
    console.error('❌ Professional face cropping error:', error);
    return {
      success: false,
      error: error.message,
      processedUrl: imageUrl
    };
  }
}

export async function enhanceFaceForEngraving(imageUrl) {
  try {
    console.log('✨ Enhancing face for engraving...');
    
    const publicId = getPublicIdFromUrl(imageUrl);
    
    // Apply professional enhancements for clear engraving
    const enhancedUrl = cloudinary.url(publicId, {
      transformation: [
        {
          effect: 'improve:100'
        },
        {
          effect: 'sharpen:200'
        },
        {
          effect: 'contrast:30'
        },
        {
          effect: 'brightness:10'
        },
        {
          effect: 'auto_color'
        },
        {
          quality: 'auto:best',
          dpr: 2.0
        }
      ],
      format: 'png'
    });
    
    const uploadResponse = await cloudinary.uploader.upload(enhancedUrl, {
      folder: 'pupring-ai/enhanced-faces',
      resource_type: 'image',
      public_id: `enhanced_face_${Date.now()}`,
      quality: 'auto:best',
      format: 'png',
      tags: ['enhanced', 'engraving-ready']
    });
    
    console.log('✅ Face enhancement completed');
    
    return {
      success: true,
      processedUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    };
    
  } catch (error) {
    console.error('❌ Face enhancement error:', error);
    return {
      success: false,
      error: error.message,
      processedUrl: imageUrl
    };
  }
}