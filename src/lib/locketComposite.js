import fs from 'fs'
import { cloudinary, getPublicIdFromUrl } from './cloudinaryUpload.js'

// Create locket engraving composite with background
export async function createLocketComposite(engravedImageUrl, locketBackgroundPath = null) {
  try {
    console.log('🎯 Creating locket composite with engraved pet image...');
    console.log('🖼️ Engraved image URL:', engravedImageUrl);
    
    // First, upload the locket background to Cloudinary if it's a local file
    let locketBackgroundUrl;
    let foundPath = null;
    
    try {
      // Use different approaches to get the locket background
      let locketBuffer;
      
      if (locketBackgroundPath) {
        // Try to read from provided path
        console.log('🏺 Trying provided locket background path:', locketBackgroundPath);
        locketBuffer = fs.readFileSync(locketBackgroundPath);
        foundPath = locketBackgroundPath;
      } else {
        // Try multiple possible paths for the gold pendant background (bg1.jpg only)
        const possiblePaths = [
          './public/image/bg1.jpg',
          'public/image/bg1.jpg',
          process.cwd() + '/public/image/bg1.jpg'
        ];
        
        for (const path of possiblePaths) {
          try {
            console.log('🔍 Trying path:', path);
            locketBuffer = fs.readFileSync(path);
            foundPath = path;
            console.log('✅ Found locket background at:', foundPath);
            break;
          } catch (pathError) {
            console.log('❌ Path not found:', path, pathError.message);
            continue;
          }
        }
        
        if (!foundPath) {
          throw new Error('Could not find bg1.jpg pendant background file in any expected location');
        }
      }
      
      // Determine the correct MIME type based on file extension
      const fileExtension = foundPath.toLowerCase().split('.').pop();
      let mimeType = 'image/jpeg'; // default
      
      if (fileExtension === 'avif') {
        mimeType = 'image/avif';
      } else if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        mimeType = 'image/jpeg';
      }
      
      const base64Locket = `data:${mimeType};base64,${locketBuffer.toString('base64')}`;
      
      // Upload locket background to Cloudinary with timeout and retry
      let locketUpload;
      let retries = 3;
      while (retries > 0) {
        try {
          locketUpload = await cloudinary.uploader.upload(base64Locket, {
            folder: 'pupring-ai/locket-templates',
            resource_type: 'image',
            public_id: `locket_background_${Date.now()}`,
            format: 'png',
            quality: 'auto:best',
            overwrite: false,  // Create unique versions for debugging
            timeout: 60000  // 60 second timeout
          });
          break; // Success, exit retry loop
        } catch (retryError) {
          retries--;
          if (retries === 0) throw retryError;
          console.log(`⚠️ Upload failed, retrying... (${3 - retries}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
      
      locketBackgroundUrl = locketUpload.secure_url;
      console.log('✅ Locket background uploaded:', locketUpload.public_id);
      console.log('🔗 Locket background URL:', locketBackgroundUrl);
      
    } catch (uploadError) {
      console.error('❌ Error uploading locket background:', uploadError);
      throw new Error(`Failed to upload locket background image: ${uploadError.message}`);
    }
    
    // Get the public ID of the engraved image
    const engravedPublicId = getPublicIdFromUrl(engravedImageUrl);
    const locketPublicId = getPublicIdFromUrl(locketBackgroundUrl);
    
    console.log('🔧 Engraved public ID:', engravedPublicId);
    console.log('🔧 Locket public ID:', locketPublicId);
    
    // First, upload the engraved image to Cloudinary to get a clean public ID
    let cleanEngravedUrl;
    let compositeUrl;
    try {
      let engravedUpload;
      let uploadRetries = 3;
      while (uploadRetries > 0) {
        try {
          engravedUpload = await cloudinary.uploader.upload(engravedImageUrl, {
            folder: 'pupring-ai/for-locket',
            resource_type: 'image',
            public_id: `engraved_${Date.now()}`,
            format: 'png',
            quality: 'auto:best',
            timeout: 60000  // 60 second timeout
          });
          break;
        } catch (retryError) {
          uploadRetries--;
          if (uploadRetries === 0) throw retryError;
          console.log(`⚠️ Engraved upload failed, retrying... (${3 - uploadRetries}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      cleanEngravedUrl = engravedUpload.secure_url;
      const cleanEngravedId = engravedUpload.public_id;
      
      console.log('✅ Clean engraved image uploaded:', cleanEngravedId);
      console.log('🔗 Clean engraved URL:', cleanEngravedUrl);
      
      // Now create composite with overlay optimized for round gold pendant
      // Balanced size to show pet face clearly without cutting ears
      compositeUrl = cloudinary.url(locketPublicId, {
        transformation: [
          // Base layer - gold pendant background
          { width: 800, height: 800, crop: 'fill' },
          // Overlay the engraved pet image - PROPERLY SIZED
          {
            overlay: cleanEngravedId.replace(/\//g, ':'),
            width: 220,  // Smaller size to fit well inside pendant
            height: 220,  // Keep proportional
            crop: 'fill',  // Fill the space properly
            gravity: 'center',
            radius: 30  // Keep subtle circular rounding
          },
          // Apply overlay with multiply effect
          { 
            flags: 'layer_apply',
            gravity: 'center',
            y: 45,  // Slightly adjusted position
            x: 5,   // Slightly adjusted position
            effect: 'multiply'  // Blend engraving with gold
          }
        ]
      });
      
      console.log('🎯 Generated composite locket URL:', compositeUrl);
      
    } catch (uploadError) {
      console.error('❌ Error uploading clean engraved image:', uploadError);
      throw new Error(`Failed to upload clean engraved image: ${uploadError.message}`);
    }
    
    // Upload the final composite for persistence
    let finalUpload;
    let finalRetries = 3;
    while (finalRetries > 0) {
      try {
        finalUpload = await cloudinary.uploader.upload(compositeUrl, {
          folder: 'pupring-ai/final-lockets',
          resource_type: 'image',
          public_id: `locket_composite_${Date.now()}`,
          format: 'jpg',  // JPG to ensure gold pendant background is preserved
          quality: 'auto:best',
          timeout: 60000  // 60 second timeout
        });
        break;
      } catch (retryError) {
        finalRetries--;
        if (finalRetries === 0) throw retryError;
        console.log(`⚠️ Final composite upload failed, retrying... (${3 - finalRetries}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('✅ Final locket composite created:', finalUpload.public_id);
    
    return {
      success: true,
      compositeUrl: finalUpload.secure_url,
      locketBackgroundUrl: locketBackgroundUrl,
      engravedImageUrl: engravedImageUrl,
      publicId: finalUpload.public_id
    };
    
  } catch (error) {
    console.error('❌ Locket composite creation error:', error);
    return {
      success: false,
      error: error.message,
      compositeUrl: null
    };
  }
}
