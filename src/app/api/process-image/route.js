import { NextResponse } from 'next/server';
import { 
  BackgroundRemovalService,
  EngravingService,
  ImageProcessingService,
  CloudinaryService
} from '@/lib/services';

const backgroundService = new BackgroundRemovalService();
const engravingService = new EngravingService();
const imageService = new ImageProcessingService();
const cloudinaryService = new CloudinaryService();

export async function POST(request) {
  try {
    const { imageUrl, processType, options = {} } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (processType) {
      case 'removeBackground':
        result = await backgroundService.removeBackground(imageUrl);
        break;
        
      case 'createEngraving':
        result = await engravingService.createEngraving(imageUrl, options);
        break;
        
      case 'multipleStyles':
        result = await engravingService.createMultipleStyles(imageUrl);
        break;
        
      case 'crop':
        if (!options.cropData) {
          return NextResponse.json(
            { success: false, error: 'Crop data is required' },
            { status: 400 }
          );
        }
        result = await imageService.cropImage(imageUrl, options.cropData);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid process type' },
          { status: 400 }
        );
    }
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Processing failed' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}