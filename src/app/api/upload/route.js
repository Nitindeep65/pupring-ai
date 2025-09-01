import { NextResponse } from 'next/server';
import { processPetImage } from '@/lib/imageProcessingPipelineOptimized.js';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';

function generateClientId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `CLI-${timestamp}-${randomStr}`.toUpperCase();
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pendantType = formData.get('pendantType');
    const imageCount = formData.get('imageCount');
    const clientName = formData.get('clientName');
    
    console.log('Upload API - Client Name received:', clientName);
    console.log('Upload API - Client Name type:', typeof clientName);
    console.log('Upload API - Client Name trimmed:', clientName?.trim());
    
    // Check if this is a multi-image upload
    if (imageCount && parseInt(imageCount) > 1) {
      const images = [];
      const petNames = [];
      const processedImages = [];
      
      // Collect all images and names
      for (let i = 1; i <= parseInt(imageCount); i++) {
        const file = formData.get(`image${i}`);
        const petName = formData.get(`petName${i}`) || '';
        if (!file) {
          return NextResponse.json(
            { error: `Missing image ${i}` },
            { status: 400 }
          );
        }
        images.push(file);
        petNames.push(petName);
      }
      
      // Process each image
      console.log(`🎨 Processing ${images.length} images for ${pendantType} pendant`);
      
      for (let i = 0; i < images.length; i++) {
        const result = await processPetImage(images[i]);
        if (!result.success) {
          return NextResponse.json(
            { error: `Failed to process image ${i + 1}: ${result.error}` },
            { status: 422 }
          );
        }
        processedImages.push(result);
      }
      
      // Generate client ID but don't save to DB yet
      const clientId = generateClientId();
      
      // Return all processed images without saving to database
      return NextResponse.json({
        success: true,
        pendantType: pendantType || 'double',
        imageCount: images.length,
        petNames: petNames,
        clientId: clientId,
        clientName: clientName && clientName.trim() ? clientName.trim() : 'Anonymous',
        images: processedImages.map((result, idx) => ({
          finalUrl: result.finalUrl,
          engravingStyles: result.engravingStyles,
          backgroundRemoved: result.backgroundRemoved,
          petName: petNames[idx] || '',
          index: idx + 1
        })),
        metadata: {
          processedAt: new Date().toISOString(),
          pendantTemplate: pendantType === 'double' ? '/image/e3.jpg' : 
                          pendantType === 'triple' ? '/image/e2.jpg' : null
        }
      });
    }
    
    // Single image upload (existing code)
    const file = formData.get('image');
    const coordinatesStr = formData.get('coordinates');
    const petName = formData.get('petName');
    
    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // Reduced to 5MB for faster uploads
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB for optimal performance.' },
        { status: 413 }
      );
    }

    // Parse custom coordinates if provided
    let customCoordinates = null;
    if (coordinatesStr) {
      try {
        customCoordinates = JSON.parse(coordinatesStr);
        console.log('📍 Using custom coordinates:', customCoordinates);
      } catch (e) {
        console.warn('Invalid coordinates format, using auto-detection');
      }
    }

    // Process the file directly
    console.log('🚀 Starting image processing pipeline...');
    console.log('📿 Pendant type:', pendantType || 'single');
    const result = await processPetImage(file, customCoordinates);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Processing failed',
          requiresNewImage: result.requiresNewImage,
          details: result.details
        },
        { status: 422 }
      );
    }

    // Generate client ID but don't save to DB yet
    const clientId = generateClientId();
    
    return NextResponse.json({
      success: true,
      finalUrl: result.finalUrl,
      steps: result.steps,
      engravingStyles: result.engravingStyles,
      backgroundRemoved: result.backgroundRemoved,
      pendantType: pendantType || 'single',
      clientId: clientId,
      clientName: clientName && clientName.trim() ? clientName.trim() : 'Anonymous',
      petName: petName || 'Pet',
      originalUrl: result.originalUrl,
      originalPublicId: result.originalPublicId,
      processedPublicId: result.processedPublicId,
      metadata: {
        processedAt: new Date().toISOString(),
        fileSize: file.size,
        fileName: file.name
      }
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}