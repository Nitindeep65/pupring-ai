import { NextResponse } from 'next/server';
import { processPetImage } from '@/lib/imageProcessingPipelineOptimized';

// Enable CORS for Shopify domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be restricted to your Shopify domain in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Domain',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get data from Shopify
    const image = formData.get('image');
    const pendantType = formData.get('pendantType') || 'single';
    const petName = formData.get('petName') || 'Pet';
    const shopifyOrderId = formData.get('orderId');
    const shopifyCustomerId = formData.get('customerId');
    const callbackUrl = formData.get('callbackUrl'); // Optional webhook URL to notify Shopify when done
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Process the image
    console.log('Processing image from Shopify for:', petName);
    
    // Create a unique client ID for this request
    const clientId = `shopify-${shopifyCustomerId || 'guest'}-${Date.now()}`;
    
    // Process the image using your existing pipeline
    const result = await processPetImage(image);

    // If successful, prepare response for Shopify
    if (result.success) {
      const responseData = {
        success: true,
        clientId,
        petName,
        pendantType,
        // Original image
        originalImage: result.originalUrl || result.preview,
        // Engraved versions
        engravingStyles: result.engravingStyles?.styles || {},
        // Locket previews
        locketPreviews: result.engravingStyles?.locketComposites || {},
        // Best engraving for display
        primaryEngraving: result.engravingStyles?.styles?.standard || 
                         result.finalUrl,
        // Processing method used
        processingMethod: result.engravingStyles?.method || 'standard',
        // Metadata
        metadata: {
          processedAt: new Date().toISOString(),
          shopifyOrderId,
          shopifyCustomerId,
          dimensions: result.metadata?.dimensions
        }
      };

      // If callback URL provided, notify Shopify asynchronously
      if (callbackUrl) {
        // Send webhook notification in background
        fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            orderId: shopifyOrderId,
            engravingData: responseData
          })
        }).catch(err => console.error('Failed to send callback:', err));
      }

      return NextResponse.json(responseData, { headers: corsHeaders });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Processing failed',
          clientId 
        },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Shopify engraving API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error.message
      },
      { status: 500, headers: corsHeaders }
    );
  }
}