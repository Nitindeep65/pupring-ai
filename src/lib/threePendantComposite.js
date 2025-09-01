import fs from 'fs'
import { cloudinary, getPublicIdFromUrl } from './cloudinaryUpload.js'

// Create multiple pendant composites with pet engravings
export async function createMultiplePendantComposites(pets, pendantType = 'triple') {
  try {
    console.log(`🎯 Creating ${pendantType} pendant composite with ${pets.length} pet(s)...`);
    
    // Get background file based on pendant type
    const backgroundFiles = {
      double: 'e2.jpg', // You'll need to add this
      triple: 'e2.jpg',
      quad: 'e4.jpg'    // You'll need to add this
    };
    
    const backgroundFile = backgroundFiles[pendantType] || 'e2.jpg';
    
    // Upload pendant background
    let locketBackgroundUrl;
    let foundPath = null;
    
    try {
      const possiblePaths = [
        `./public/image/${backgroundFile}`,
        `public/image/${backgroundFile}`,
        process.cwd() + `/public/image/${backgroundFile}`
      ];
      
      let locketBuffer;
      for (const path of possiblePaths) {
        try {
          console.log('🔍 Trying path:', path);
          locketBuffer = fs.readFileSync(path);
          foundPath = path;
          console.log(`✅ Found ${pendantType} pendant background at:`, foundPath);
          break;
        } catch (pathError) {
          console.log('❌ Path not found:', path);
          continue;
        }
      }
      
      if (!foundPath) {
        throw new Error(`Could not find ${backgroundFile} background file`);
      }
      
      const base64Locket = `data:image/jpeg;base64,${locketBuffer.toString('base64')}`;
      
      // Upload background to Cloudinary
      const locketUpload = await cloudinary.uploader.upload(base64Locket, {
        folder: `pupring-ai/${pendantType}-pendant-templates`,
        resource_type: 'image',
        public_id: `${pendantType}_pendant_background_${Date.now()}`,
        format: 'png',
        quality: 'auto:best',
        timeout: 60000
      });
      
      locketBackgroundUrl = locketUpload.secure_url;
      console.log(`✅ ${pendantType} pendant background uploaded:`, locketUpload.public_id);
      
    } catch (uploadError) {
      console.error(`❌ Error uploading ${pendantType} pendant background:`, uploadError);
      throw new Error(`Failed to upload ${pendantType} pendant background: ${uploadError.message}`);
    }
    
    const locketPublicId = getPublicIdFromUrl(locketBackgroundUrl);
    
    // Upload clean versions of all pet engravings
    const cleanPetImages = await Promise.all(pets.map(async (pet, index) => {
      const engravedUpload = await cloudinary.uploader.upload(pet.engravingUrl, {
        folder: `pupring-ai/for-${pendantType}-pendant`,
        resource_type: 'image',
        public_id: `engraved_${pendantType}_${index}_${Date.now()}`,
        format: 'png',
        quality: 'auto:best',
        timeout: 60000
      });
      
      return {
        ...pet,
        cleanPublicId: engravedUpload.public_id,
        cleanUrl: engravedUpload.secure_url
      };
    }));
    
    console.log(`✅ Uploaded ${cleanPetImages.length} clean engraved images`);
    
    // Create composite based on pendant type
    const compositeUrl = await createCompositeByType(locketPublicId, cleanPetImages, pendantType);
    
    console.log(`🎯 Generated ${pendantType} pendant composite URL:`, compositeUrl);
    
    // Upload the final composite
    const finalUpload = await cloudinary.uploader.upload(compositeUrl, {
      folder: `pupring-ai/final-${pendantType}-pendants`,
      resource_type: 'image',
      public_id: `${pendantType}_pendant_composite_${Date.now()}`,
      format: 'jpg',
      quality: 'auto:best',
      timeout: 60000
    });
    
    console.log(`✅ Final ${pendantType} pendant composite created:`, finalUpload.public_id);
    
    return {
      success: true,
      compositeUrl: finalUpload.secure_url,
      locketBackgroundUrl: locketBackgroundUrl,
      pendantType,
      pets: pets.map(pet => pet.name).join(', '),
      publicId: finalUpload.public_id
    };
    
  } catch (error) {
    console.error(`❌ ${pendantType} pendant composite creation error:`, error);
    return {
      success: false,
      error: error.message,
      compositeUrl: null
    };
  }
}

// Helper function to create composites based on pendant type
async function createCompositeByType(locketPublicId, cleanPetImages, pendantType) {
  const transformations = [
    // Base layer
    { width: 800, height: 800, crop: 'fill' }
  ];
  
  // Pendant positions for different types
  const pendantConfigs = {
    double: [
      { x: 300, y: 400, size: 120 },
      { x: 500, y: 400, size: 120 }
    ],
    triple: [
      { x: 236, y: 470, size: 140 },
      { x: 367, y: 501, size: 130 },
      { x: 503, y: 453, size: 135 }
    ],
    quad: [
      { x: 200, y: 350, size: 100 },
      { x: 350, y: 350, size: 100 },
      { x: 200, y: 500, size: 100 },
      { x: 350, y: 500, size: 100 }
    ]
  };
  
  const positions = pendantConfigs[pendantType] || pendantConfigs.triple;
  
  // Add each pet to the composite
  cleanPetImages.forEach((pet, index) => {
    if (index < positions.length) {
      const pos = positions[index];
      
      // Add overlay
      transformations.push({
        overlay: pet.cleanPublicId.replace(/\//g, ':'),
        width: pos.size,
        height: pos.size,
        crop: 'fill',
        gravity: 'center',
        radius: 'max'
      });
      
      // Apply position
      transformations.push({
        flags: 'layer_apply',
        gravity: 'north_west',
        x: pos.x - (pos.size / 2),
        y: pos.y - (pos.size / 2),
        effect: 'multiply'
      });
    }
  });
  
  return cloudinary.url(locketPublicId, { transformation: transformations });
}

// Backward compatibility - keep original function
export async function createThreePendantComposite(engravedImageUrl) {
  try {
    console.log('🎯 Creating 3-pendant composite with engraved pet image...');
    console.log('🖼️ Engraved image URL:', engravedImageUrl);
    
    // Upload the 3-pendant background (e2.jpg)
    let locketBackgroundUrl;
    let foundPath = null;
    
    try {
      // Try to read e2.jpg for 3-pendant background
      const possiblePaths = [
        './public/image/e2.jpg',
        'public/image/e2.jpg',
        process.cwd() + '/public/image/e2.jpg'
      ];
      
      let locketBuffer;
      for (const path of possiblePaths) {
        try {
          console.log('🔍 Trying path:', path);
          locketBuffer = fs.readFileSync(path);
          foundPath = path;
          console.log('✅ Found 3-pendant background at:', foundPath);
          break;
        } catch (pathError) {
          console.log('❌ Path not found:', path);
          continue;
        }
      }
      
      if (!foundPath) {
        throw new Error('Could not find e2.jpg 3-pendant background file');
      }
      
      const base64Locket = `data:image/jpeg;base64,${locketBuffer.toString('base64')}`;
      
      // Upload 3-pendant background to Cloudinary
      const locketUpload = await cloudinary.uploader.upload(base64Locket, {
        folder: 'pupring-ai/3-pendant-templates',
        resource_type: 'image',
        public_id: `three_pendant_background_${Date.now()}`,
        format: 'png',
        quality: 'auto:best',
        timeout: 60000
      });
      
      locketBackgroundUrl = locketUpload.secure_url;
      console.log('✅ 3-pendant background uploaded:', locketUpload.public_id);
      
    } catch (uploadError) {
      console.error('❌ Error uploading 3-pendant background:', uploadError);
      throw new Error(`Failed to upload 3-pendant background: ${uploadError.message}`);
    }
    
    // Get the public IDs
    const engravedPublicId = getPublicIdFromUrl(engravedImageUrl);
    const locketPublicId = getPublicIdFromUrl(locketBackgroundUrl);
    
    // Upload the engraved image for clean processing
    let cleanEngravedUrl;
    try {
      const engravedUpload = await cloudinary.uploader.upload(engravedImageUrl, {
        folder: 'pupring-ai/for-3-pendant',
        resource_type: 'image',
        public_id: `engraved_3p_${Date.now()}`,
        format: 'png',
        quality: 'auto:best',
        timeout: 60000
      });
      
      cleanEngravedUrl = engravedUpload.secure_url;
      const cleanEngravedId = engravedUpload.public_id;
      
      console.log('✅ Clean engraved image uploaded:', cleanEngravedId);
      
      // Create composite with THREE pet engravings at EXACT positions
      // Pendant positions from user:
      // Pendant 1 (left): Center (236, 470), Radius ~87px
      // Pendant 2 (middle): Center (367, 501), Radius ~82px
      // Pendant 3 (right): Center (503, 453), Radius ~84px
      
      const compositeUrl = cloudinary.url(locketPublicId, {
        transformation: [
          // Base layer - 3-pendant background
          { width: 800, height: 800, crop: 'fill' },
          
          // LEFT PENDANT - Center: (236, 470), Radius: 87px
          {
            overlay: cleanEngravedId.replace(/\//g, ':'),
            width: 140,  // Diameter ~87*2 = 174, using 140 to fit inside
            height: 140,
            crop: 'fill',
            gravity: 'center',
            radius: 'max'  // Full circular for pendant
          },
          { 
            flags: 'layer_apply',
            gravity: 'north_west',
            x: 166,  // Center 236 - (140/2) = 166
            y: 400,  // Center 470 - (140/2) = 400
            effect: 'multiply'
          },
          
          // MIDDLE PENDANT - Center: (367, 501), Radius: 82px
          {
            overlay: cleanEngravedId.replace(/\//g, ':'),
            width: 130,  // Diameter ~82*2 = 164, using 130 to fit inside
            height: 130,
            crop: 'fill',
            gravity: 'center',
            radius: 'max'  // Full circular for pendant
          },
          { 
            flags: 'layer_apply',
            gravity: 'north_west',
            x: 302,  // Center 367 - (130/2) = 302
            y: 436,  // Center 501 - (130/2) = 436
            effect: 'multiply'
          },
          
          // RIGHT PENDANT - Center: (503, 453), Radius: 84px
          {
            overlay: cleanEngravedId.replace(/\//g, ':'),
            width: 135,  // Diameter ~84*2 = 168, using 135 to fit inside
            height: 135,
            crop: 'fill',
            gravity: 'center',
            radius: 'max'  // Full circular for pendant
          },
          { 
            flags: 'layer_apply',
            gravity: 'north_west',
            x: 435,  // Center 503 - (135/2) = 435.5 → 435
            y: 385,  // Center 453 - (135/2) = 385.5 → 385
            effect: 'multiply'
          }
        ]
      });
      
      console.log('🎯 Generated 3-pendant composite URL:', compositeUrl);
      
      // Upload the final composite
      const finalUpload = await cloudinary.uploader.upload(compositeUrl, {
        folder: 'pupring-ai/final-3-pendants',
        resource_type: 'image',
        public_id: `three_pendant_composite_${Date.now()}`,
        format: 'jpg',
        quality: 'auto:best',
        timeout: 60000
      });
      
      console.log('✅ Final 3-pendant composite created:', finalUpload.public_id);
      
      return {
        success: true,
        compositeUrl: finalUpload.secure_url,
        locketBackgroundUrl: locketBackgroundUrl,
        engravedImageUrl: engravedImageUrl,
        publicId: finalUpload.public_id,
        pendantPositions: {
          left: { x: 236, y: 470 },
          middle: { x: 367, y: 501 },
          right: { x: 503, y: 453 }
        }
      };
      
    } catch (uploadError) {
      console.error('❌ Error creating 3-pendant composite:', uploadError);
      throw new Error(`Failed to create 3-pendant composite: ${uploadError.message}`);
    }
    
  } catch (error) {
    console.error('❌ 3-pendant composite creation error:', error);
    return {
      success: false,
      error: error.message,
      compositeUrl: null
    };
  }
}