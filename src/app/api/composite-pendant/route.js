import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pendantType = formData.get('pendantType');
    const imageCount = parseInt(formData.get('imageCount') || '1');
    
    // Get all pet images and names
    const petImages = [];
    const petNames = [];
    for (let i = 1; i <= imageCount; i++) {
      const imageData = formData.get(`image${i}`);
      const petName = formData.get(`petName${i}`) || '';
      if (imageData) {
        petImages.push(imageData);
        petNames.push(petName);
      }
    }
    
    console.log('Received pet names:', petNames);

    if (petImages.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // Determine pendant template based on type
    let templatePath;
    let positions = [];
    
    switch(pendantType) {
      case 'double':
        templatePath = path.join(process.cwd(), 'public', 'image', 'e3.jpg');
        // Define positions for two images on the double pendant - adjusted for better positioning
        // Left pendant center: (290, 480) - moved up by 30px for higher positioning
        // Right pendant center: (445, 480) - moved right by 15px and up by 30px
        // Using appropriate size for pendant radius ~85-90px
        positions = [
          { x: 290 - 65, y: 480 - 65, width: 130, height: 130 },  // Left pendant centered at (290, 480)
          { x: 445 - 65, y: 480 - 65, width: 130, height: 130 }   // Right pendant centered at (445, 480)
        ];
        break;
      case 'triple':
        templatePath = path.join(process.cwd(), 'public', 'image', 'e2.jpg');
        // Define positions for three images on the triple pendant - EXACT coordinates provided
        // Centers: Left (236, 470), Middle (367, 501), Right (503, 453)
        // Radius: ~87px, ~82px, ~84px respectively
        // Using smaller sizes (60-65% of radius) for better fit
        positions = [
          { x: 236 - 55, y: 470 - 55, width: 110, height: 110 },  // Left pendant (reduced from 150)
          { x: 367 - 50, y: 501 - 50, width: 100, height: 100 },  // Middle pendant (reduced from 140)
          { x: 503 - 52, y: 453 - 52, width: 104, height: 104 }   // Right pendant (reduced from 144)
        ];
        break;
      case 'quarter':
        // For 4 pendants on a necklace
        templatePath = path.join(process.cwd(), 'public', 'image', 'e3.jpg');
        positions = [
          { x: 50, y: 100, width: 140, height: 140 },
          { x: 200, y: 100, width: 140, height: 140 },
          { x: 350, y: 100, width: 140, height: 140 },
          { x: 500, y: 100, width: 140, height: 140 }
        ];
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid pendant type for compositing' },
          { status: 400 }
        );
    }

    // Load the pendant template
    const templateBuffer = await fs.readFile(templatePath);
    let composite = sharp(templateBuffer);

    // Get template metadata to ensure we have dimensions
    const metadata = await composite.metadata();
    
    // Process and composite each pet image
    const compositeOperations = [];
    
    for (let i = 0; i < Math.min(petImages.length, positions.length); i++) {
      const imageBuffer = Buffer.from(await petImages[i].arrayBuffer());
      const position = positions[i];
      
      // Process pet image - resize to fit the pendant circle with proper padding
      // The engraving should already be black on transparent/white background
      const processedPet = await sharp(imageBuffer)
        .resize(position.width - 40, position.height - 40, {
          fit: 'contain',
          position: 'center',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .toBuffer();

      // Get the actual dimensions after resize
      const metadata = await sharp(processedPet).metadata();
      
      // Create a transparent circular container (no white background)
      const transparentContainer = await sharp({
        create: {
          width: position.width,
          height: position.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent
        }
      })
      .png()
      .toBuffer();

      // Calculate centering position
      const paddingX = Math.round((position.width - metadata.width) / 2);
      const paddingY = Math.round((position.height - metadata.height) / 2);
      
      // Composite the pet image onto the transparent container
      const centeredPet = await sharp(transparentContainer)
        .composite([
          {
            input: processedPet,
            left: paddingX,
            top: paddingY,
            blend: 'over'
          }
        ])
        .toBuffer();

      // Create a circular mask to clip the image to a circle
      const circleMask = Buffer.from(
        `<svg width="${position.width}" height="${position.height}">
          <circle cx="${position.width/2}" cy="${position.height/2}" r="${position.width/2}" fill="white"/>
        </svg>`
      );

      // Apply circular mask to create circular pendant shape
      const circularPet = await sharp(centeredPet)
        .composite([
          {
            input: circleMask,
            blend: 'dest-in'
          }
        ])
        .png() // Ensure we maintain transparency
        .toBuffer();

      // Add to composite operations with multiply blend mode to show through gold
      compositeOperations.push({
        input: circularPet,
        left: position.x,
        top: position.y,
        blend: 'multiply' // This will make the black engravings show on the gold surface
      });
      
      // Add pet name under the image if provided
      if (petNames[i] && petNames[i].trim()) {
        // Escape special characters in pet name for SVG
        const escapedName = petNames[i].replace(/[<>&'"]/g, (char) => {
          const escapes = {'<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'};
          return escapes[char];
        });
        
        // Create simple curved text - positioned inside pendant below pet face
        const nameText = Buffer.from(
          `<svg width="${position.width}" height="20" xmlns="http://www.w3.org/2000/svg">
            <text x="${position.width/2}" y="15" 
                  text-anchor="middle" 
                  font-family="Georgia, Times, serif" 
                  font-size="9" 
                  font-weight="500"
                  letter-spacing="0.2"
                  fill="#2c2c2c"
                  opacity="0.75">
              ${escapedName}
            </text>
          </svg>`
        );
        
        compositeOperations.push({
          input: nameText,
          left: position.x,
          top: position.y + position.height - 25, // Position inside pendant at bottom
          blend: 'multiply'
        });
      }
    }

    // Composite all pet images onto the pendant template
    const result = await composite
      .composite(compositeOperations)
      .png() // Use PNG to maintain transparency and quality
      .toBuffer();

    // Convert to base64 for response
    const base64Image = `data:image/png;base64,${result.toString('base64')}`;

    return NextResponse.json({
      success: true,
      compositedImage: base64Image,
      pendantType: pendantType,
      imageCount: petImages.length
    });

  } catch (error) {
    console.error('Composite pendant error:', error);
    return NextResponse.json(
      { error: 'Failed to composite images', details: error.message },
      { status: 500 }
    );
  }
}