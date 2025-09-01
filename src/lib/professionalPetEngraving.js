import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { uploadBase64ToCloudinary } from './cloudinaryUpload.js';
import { cropPetFaceProfessionally, enhanceFaceForEngraving } from './professionalPetFaceCropping.js';
import { detectPetFace } from './petDetection.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createProfessionalPetEngraving(imageUrl) {
  console.log('🎨 Starting Professional Pet Engraving Process...');
  
  try {
    // Step 1: Detect pet face
    console.log('Step 1: Detecting pet face...');
    const detectionResult = await detectPetFace(imageUrl);
    
    if (!detectionResult.success || !detectionResult.hasPet) {
      console.log('⚠️ No pet detected in image');
      return {
        success: false,
        error: 'No pet face detected in the image'
      };
    }
    
    // Step 2: Professional face cropping
    console.log('Step 2: Cropping face professionally...');
    const cropResult = await cropPetFaceProfessionally(
      imageUrl,
      detectionResult.coordinates,
      detectionResult.imageDimensions
    );
    
    if (!cropResult.success) {
      console.log('⚠️ Face cropping failed');
      return {
        success: false,
        error: 'Failed to crop pet face'
      };
    }
    
    // Step 3: Enhance face for engraving
    console.log('Step 3: Enhancing face for engraving...');
    const enhanceResult = await enhanceFaceForEngraving(cropResult.processedUrl);
    
    const processUrl = enhanceResult.success ? enhanceResult.processedUrl : cropResult.processedUrl;
    
    // Step 4: Apply professional engraving filter
    console.log('Step 4: Applying professional engraving filter...');
    
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const timestamp = Date.now();
    const inputFile = path.join(tempDir, `face_input_${timestamp}.jpg`);
    const scriptDir = path.join(__dirname, '../../filtre_gravure_simple');
    const outputFile = path.join(scriptDir, `face_input_${timestamp}_pro_engraved.png`);
    
    // Download and save the enhanced face image
    let buffer;
    if (processUrl.startsWith('data:')) {
      const base64Data = processUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const response = await fetch(processUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      buffer = await response.arrayBuffer();
    }
    
    await fs.writeFile(inputFile, Buffer.from(buffer));
    
    // Run the professional engraving Python script
    const scriptPath = path.join(scriptDir, 'professional_pet_engraving.py');
    
    console.log('Running professional engraving filter...');
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${inputFile}"`, {
      cwd: scriptDir
    });
    
    if (stderr && !stderr.includes('SUCCESS')) {
      console.warn('Python script warnings:', stderr);
    }
    
    console.log('Python script output:', stdout);
    
    // Check if output file exists
    const outputExists = await fs.access(outputFile).then(() => true).catch(() => false);
    if (!outputExists) {
      console.error('Output file not found at:', outputFile);
      throw new Error('Professional engraving filter failed to generate output');
    }
    
    // Read the engraved image
    const engravingBuffer = await fs.readFile(outputFile);
    const base64 = engravingBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    // Step 5: Upload to Cloudinary
    console.log('Step 5: Uploading professional engraving to Cloudinary...');
    const uploadResult = await uploadBase64ToCloudinary(dataUrl, 'professional-engraving');
    
    // Clean up temporary files
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});
    
    if (uploadResult.success) {
      console.log('✅ Professional engraving completed:', uploadResult.url);
      return {
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        method: 'professional-pet-engraving',
        details: {
          faceDetected: true,
          faceCropped: true,
          faceEnhanced: enhanceResult.success,
          professionalQuality: true,
          pendantOptimized: true
        }
      };
    } else {
      throw new Error('Failed to upload professional engraving to Cloudinary');
    }
    
  } catch (error) {
    console.error('Professional engraving error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function createMultipleEngravingStyles(imageUrl) {
  console.log('🎨 Creating multiple engraving styles...');
  
  try {
    // Detect and crop face first
    const detectionResult = await detectPetFace(imageUrl);
    if (!detectionResult.success || !detectionResult.hasPet) {
      return {
        success: false,
        error: 'No pet face detected'
      };
    }
    
    const cropResult = await cropPetFaceProfessionally(
      imageUrl,
      detectionResult.coordinates,
      detectionResult.imageDimensions
    );
    
    if (!cropResult.success) {
      return {
        success: false,
        error: 'Failed to crop pet face'
      };
    }
    
    const faceUrl = cropResult.processedUrl;
    const results = {};
    
    // Style 1: Professional engraving
    const professionalResult = await createProfessionalPetEngraving(faceUrl);
    if (professionalResult.success) {
      results.professional = professionalResult.url;
    }
    
    // Style 2: Simple engraving (using existing filter)
    try {
      const { createPythonEngravingStyles } = await import('./pythonEngraving.js');
      const simpleResult = await createPythonEngravingStyles(faceUrl);
      if (simpleResult.success) {
        results.simple = simpleResult.url;
      }
    } catch (error) {
      console.warn('Simple style failed:', error.message);
    }
    
    return {
      success: Object.keys(results).length > 0,
      styles: results,
      faceUrl: faceUrl
    };
    
  } catch (error) {
    console.error('Multiple styles error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}