// Optimized Image Processing Pipeline with Parallel Processing
import { uploadToCloudinary } from './cloudinaryUpload.js'
import { detectPetFace } from './petDetection.js'
import { cropPetFace } from './imageCropping.js'
import { createEngravingStyles, optimizeImage } from './engravingStyles.js'
import { createLocketComposite } from './locketComposite.js'

// Cache for processed images to avoid reprocessing
const processCache = new Map();

// Optimized pipeline with parallel processing
export async function processPetImageOptimized(file, customCoordinates = null) {
  console.log('⚡ Starting OPTIMIZED pet image processing pipeline...');
  
  const startTime = Date.now();
  
  // Generate cache key from file
  const cacheKey = file.name + file.size + file.lastModified;
  
  // Check cache first
  if (processCache.has(cacheKey)) {
    console.log('✅ Returning cached result');
    return processCache.get(cacheKey);
  }
  
  const result = {
    originalImage: null,
    uploadResult: null,
    petDetection: null,
    optimization: null,
    finalUrl: null,
    success: false,
    steps: [],
    errors: [],
    processingTime: 0
  };

  try {
    // Step 1: Upload to Cloudinary
    console.log('📤 Step 1: Uploading to Cloudinary...');
    const uploadResult = await uploadToCloudinary(file);
    result.uploadResult = uploadResult;
    result.originalImage = uploadResult.url;
    
    if (!uploadResult.success) {
      result.errors.push('Failed to upload image to Cloudinary');
      return result;
    }
    
    result.steps.push({
      name: 'Upload',
      status: 'completed',
      url: uploadResult.url,
      details: `Uploaded as ${uploadResult.publicId}`
    });

    let currentUrl = uploadResult.url;

    // Parallel Processing: Pet Detection + Initial Background Analysis
    console.log('⚡ Running parallel: Pet Detection + Background Analysis...');
    
    const [petDetection, backgroundAnalysis] = await Promise.all([
      // Pet Detection
      customCoordinates 
        ? Promise.resolve({
            success: true,
            hasPet: true,
            confidence: 1.0,
            custom: true,
            predictions: [{
              class: 'pet',
              class_id: 0,
              confidence: 1.0,
              x: customCoordinates.x,
              y: customCoordinates.y,
              width: customCoordinates.width,
              height: customCoordinates.height
            }],
            coordinates: customCoordinates,
            processedUrl: uploadResult.url,
            message: 'Using manually specified coordinates'
          })
        : detectPetFace(uploadResult.url),
      
      // Pre-analyze image for background removal (non-blocking)
      analyzeImageForBackgroundRemoval(uploadResult.url)
    ]);
    
    result.petDetection = petDetection;
    
    // Check for low confidence or no pet detected
    if (!petDetection.hasPet) {
      const message = petDetection.lowConfidence 
        ? petDetection.message 
        : 'No pet face detected. Please upload an image with a clear view of your pet\'s face.';
      
      result.steps.push({
        name: 'Pet Detection',
        status: 'failed',
        confidence: petDetection.confidence,
        hasPet: false,
        details: message
      });
      
      result.finalUrl = uploadResult.url;
      result.success = false;
      result.message = message;
      result.requiresNewImage = true;
      return result;
    }
    
    result.steps.push({
      name: 'Pet Detection',
      status: 'completed',
      confidence: petDetection.confidence,
      hasPet: petDetection.hasPet,
      details: `Pet face detected with ${(petDetection.confidence * 100).toFixed(1)}% confidence`
    });

    // Step 3: Face Cropping (if coordinates available)
    if (petDetection.coordinates && petDetection.hasPet) {
      console.log('✂️ Step 3: Cropping pet face...');
      console.log('Pet detection coordinates:', petDetection.coordinates);
      
      const imageDimensions = {
        width: uploadResult.width,
        height: uploadResult.height
      };
      console.log('Image dimensions for cropping:', imageDimensions);
      
      const faceCrop = await cropPetFace(currentUrl, petDetection.coordinates, imageDimensions);
      result.faceCrop = faceCrop;
      
      if (faceCrop.success) {
        currentUrl = faceCrop.processedUrl;
        console.log(`✅ Face cropping successful, new URL:`, currentUrl);
      } else {
        console.log(`❌ Face cropping failed:`, faceCrop.error);
      }
      
      result.steps.push({
        name: 'Face Cropping',
        status: faceCrop.success ? 'completed' : 'skipped',
        url: faceCrop.processedUrl || currentUrl,
        details: faceCrop.success 
          ? `Face cropped successfully`
          : `Skipped: ${faceCrop.error || 'No valid coordinates'}`
      });
    } else {
      console.log('⚠️ Skipping face cropping - no coordinates or no pet detected');
      console.log('Has coordinates:', !!petDetection.coordinates);
      console.log('Has pet:', petDetection.hasPet);
    }

    // Step 4: Create Engraving Styles (Background removal handled by Python service)
    console.log('🎨 Step 4: Creating engraving styles...');
    console.log('Current URL for engraving:', currentUrl);
    const engravingStyles = await createEngravingStyles(currentUrl);
    console.log('Engraving result method:', engravingStyles.method);
    result.engravingStyles = engravingStyles;
    
    // Parallel Processing: Create all locket composites simultaneously
    if (engravingStyles.success) {
      console.log('⚡ Creating locket composites in parallel...');
      
      const compositePromises = Object.entries(engravingStyles.styles).map(
        async ([styleName, styleUrl]) => {
          const composite = await createLocketComposite(styleUrl);
          return { styleName, url: composite.success ? composite.compositeUrl : styleUrl };
        }
      );
      
      const composites = await Promise.all(compositePromises);
      const locketComposites = {};
      
      composites.forEach(({ styleName, url }) => {
        locketComposites[styleName] = url;
      });
      
      result.engravingStyles.locketComposites = locketComposites;
    }
    
    const backgroundRemovedUrl = currentUrl;
    
    result.steps.push({
      name: 'Locket Engraving',
      status: engravingStyles.success ? 'completed' : 'failed',
      url: engravingStyles.styles?.standard || currentUrl,
      details: engravingStyles.success 
        ? 'Created multiple engraving styles with locket composites'
        : `Failed: ${engravingStyles.error || 'Unknown error'}`
    });

    // Step 6: Final Optimization
    console.log('⚡ Step 6: Final optimization...');
    const optimization = await optimizeImage(backgroundRemovedUrl);
    result.optimization = optimization;
    
    if (optimization.success) {
      currentUrl = optimization.optimizedUrl;
    }
    
    result.steps.push({
      name: 'Final Optimization',
      status: optimization.success ? 'completed' : 'failed',
      url: optimization.optimizedUrl || currentUrl,
      details: optimization.success 
        ? `Optimized to ${optimization.size?.width}x${optimization.size?.height}`
        : `Failed: ${optimization.error || 'Unknown error'} (using previous image)`
    });

    // Final result
    result.finalUrl = currentUrl;
    result.originalUrl = uploadResult.url;
    result.originalPublicId = uploadResult.public_id || '';
    result.processedPublicId = uploadResult.public_id || '';
    result.backgroundRemoved = backgroundRemovedUrl;
    result.success = true;
    result.processingTime = Date.now() - startTime;
    
    console.log(`✅ Pipeline completed in ${result.processingTime}ms!`);
    
    // Cache the result
    processCache.set(cacheKey, result);
    
    // Clear old cache entries (keep only last 10)
    if (processCache.size > 10) {
      const firstKey = processCache.keys().next().value;
      processCache.delete(firstKey);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Processing pipeline error:', error);
    result.errors.push(error.message);
    result.steps.push({
      name: 'Pipeline',
      status: 'failed',
      details: `Critical error: ${error.message}`
    });
    result.processingTime = Date.now() - startTime;
    return result;
  }
}

// Helper function to analyze image for background removal
async function analyzeImageForBackgroundRemoval(imageUrl) {
  // Pre-analyze image characteristics for faster background removal
  return {
    hasTransparency: false,
    dominantColors: [],
    edgeComplexity: 'medium'
  };
}

// Export alias for backward compatibility
export { processPetImageOptimized as processPetImage }

// Export individual functions for backward compatibility
export { uploadToCloudinary } from './cloudinaryUpload.js'
export { detectPetFace } from './petDetection.js'
export { cropPetFace } from './imageCropping.js'
export { createEngravingStyles, optimizeImage } from './engravingStyles.js'
export { createLocketComposite } from './locketComposite.js'