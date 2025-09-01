import fs from 'fs'
import { cloudinary, getPublicIdFromUrl } from './cloudinaryUpload.js'

// Create 2-pendant composite with pet engravings
export async function createTwoPendantComposite(engravedImageUrl) {
  try {
    console.log('🎯 Creating 2-pendant composite with engraved pet image...');
    console.log('🖼️ Engraved image URL:', engravedImageUrl);
    
    // Upload the 2-pendant background (e3.jpg)
    let locketBackgroundUrl;
    let foundPath = null;
    
    try {
      // Try to read e3.jpg for 2-pendant background
      const possiblePaths = [
        './public/image/e3.jpg',
        'public/image/e3.jpg',
        process.cwd() + '/public/image/e3.jpg'
      ];
      
      let locketBuffer;
      for (const path of possiblePaths) {
        try {
          console.log('🔍 Trying path:', path);
          locketBuffer = fs.readFileSync(path);
          foundPath = path;
          console.log('✅ Found 2-pendant background at:', foundPath);
          break;
        } catch (pathError) {
          console.log('❌ Path not found:', path);
          continue;
        }
      }
      
      if (!foundPath) {
        throw new Error('Could not find e3.jpg 2-pendant background file');
      }
      
      const base64Locket = `data:image/jpeg;base64,${locketBuffer.toString('base64')}`;
      
      // Upload 2-pendant background to Cloudinary
      const locketUpload = await cloudinary.uploader.upload(base64Locket, {
        folder: 'pupring-ai/2-pendant-templates',
        resource_type: 'image',
        public_id: `two_pendant_background_${Date.now()}`,
        format: 'png',
        quality: 'auto:best',
        timeout: 60000
      });
      
      locketBackgroundUrl = locketUpload.secure_url;
      console.log('✅ 2-pendant background uploaded:', locketUpload.public_id);
      
    } catch (uploadError) {
      console.error('❌ Error uploading 2-pendant background:', uploadError);
      throw new Error(`Failed to upload 2-pendant background: ${uploadError.message}`);
    }
    
    // Get the public IDs
    const engravedPublicId = getPublicIdFromUrl(engravedImageUrl);
    const locketPublicId = getPublicIdFromUrl(locketBackgroundUrl);
    
    // Upload the engraved image for clean processing
    let cleanEngravedUrl;
    try {
      const engravedUpload = await cloudinary.uploader.upload(engravedImageUrl, {
        folder: 'pupring-ai/for-2-pendant',
        resource_type: 'image',
        public_id: `engraved_2p_${Date.now()}`,
        format: 'png',
        quality: 'auto:best',
        timeout: 60000
      });
      
      cleanEngravedUrl = engravedUpload.secure_url;
      const cleanEngravedId = engravedUpload.public_id;
      
      console.log('✅ Clean engraved image uploaded:', cleanEngravedId);
      
      // Create composite with TWO pet engravings at adjusted positions
      // Based on 720x720 image:
      // Left pendant center: (290, 480) - moved up by 30px for higher positioning
      // Right pendant center: (445, 480) - moved right by 15px and up by 30px for higher positioning
      // Estimated pendant radius: ~85-90px
      
      const compositeUrl = cloudinary.url(locketPublicId, {
        transformation: [
          // Base layer - 2-pendant background (720x720)
          { width: 720, height: 720, crop: 'fill' },
          
          // LEFT PENDANT - Center: (290, 480)
          {
            overlay: cleanEngravedId.replace(/\//g, ':'),
            width: 110,  // Reduced size to fit within pendant
            height: 110,
            crop: 'fill',
            gravity: 'faces:center',  // Focus on face if detected
            radius: 'max'  // Full circular for pendant
          },
          { 
            flags: 'layer_apply',
            gravity: 'north_west',
            x: 235,  // Center 290 - (110/2) = 235
            y: 425,  // Center 480 - (110/2) = 425 (moved up by 10px)
            effect: 'multiply'
          },
          
          // RIGHT PENDANT - Center: (445, 480)
          {
            overlay: cleanEngravedId.replace(/\//g, ':'),
            width: 110,  // Same reduced size as left pendant
            height: 110,
            crop: 'fill',
            gravity: 'faces:center',  // Focus on face if detected
            radius: 'max'  // Full circular for pendant
          },
          { 
            flags: 'layer_apply',
            gravity: 'north_west',
            x: 390,  // Center 445 - (110/2) = 390
            y: 425,  // Center 480 - (110/2) = 425 (moved up by 10px)
            effect: 'multiply'
          }
        ]
      });
      
      console.log('🎯 Generated 2-pendant composite URL:', compositeUrl);
      
      // Upload the final composite
      const finalUpload = await cloudinary.uploader.upload(compositeUrl, {
        folder: 'pupring-ai/final-2-pendants',
        resource_type: 'image',
        public_id: `two_pendant_composite_${Date.now()}`,
        format: 'jpg',
        quality: 'auto:best',
        timeout: 60000
      });
      
      console.log('✅ Final 2-pendant composite created:', finalUpload.public_id);
      
      return {
        success: true,
        compositeUrl: finalUpload.secure_url,
        locketBackgroundUrl: locketBackgroundUrl,
        engravedImageUrl: engravedImageUrl,
        publicId: finalUpload.public_id,
        pendantPositions: {
          left: { x: 290, y: 480, radius: 75 },
          right: { x: 445, y: 480, radius: 75 }
        }
      };
      
    } catch (uploadError) {
      console.error('❌ Error creating 2-pendant composite:', uploadError);
      throw new Error(`Failed to create 2-pendant composite: ${uploadError.message}`);
    }
    
  } catch (error) {
    console.error('❌ 2-pendant composite creation error:', error);
    return {
      success: false,
      error: error.message,
      compositeUrl: null
    };
  }
}