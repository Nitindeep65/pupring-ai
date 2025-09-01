import { NextResponse } from 'next/server';
import { processPetImage } from '@/lib/imageProcessingPipelineOptimized';
import { createMultiplePendantComposites } from '@/lib/threePendantComposite';
import { createLocketComposite } from '@/lib/locketComposite';

// CORS headers for Shopify integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Domain, X-Shopify-Shop-Domain',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session');
  
  if (!sessionId) {
    return NextResponse.redirect(new URL('/?error=no-session', request.url));
  }
  
  // Redirect to the main app with session context for Shopify
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('shopify', 'true');
  redirectUrl.searchParams.set('session', sessionId);
  
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get Shopify context
    const shopifyDomain = request.headers.get('X-Shopify-Shop-Domain');
    const returnUrl = formData.get('return_url');
    const productId = formData.get('product_id');
    const variantId = formData.get('variant_id');
    const pendantType = formData.get('pendant_type') || 'single';
    const customerEmail = formData.get('customer_email');
    const orderId = formData.get('order_id');
    
    // Get pet information
    const petName = formData.get('pet_name') || 'My Pet';
    const image = formData.get('image');
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided', success: false },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`🛍️ Processing Shopify request for ${pendantType} pendant`);
    console.log(`📧 Customer: ${customerEmail}, Product: ${productId}`);
    
    // Create unique session ID for this Shopify request
    const sessionId = `shopify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Process the pet image through your existing pipeline
    const processingResult = await processPetImage(image);
    
    if (!processingResult.success) {
      return NextResponse.json({
        success: false,
        error: processingResult.error || 'Failed to process image',
        sessionId
      }, { status: 500, headers: corsHeaders });
    }

    // Generate pendant composites based on type
    let pendantPreviews = {};
    
    try {
      if (pendantType === 'single') {
        // Single pendant preview
        const singleComposite = await createLocketComposite(
          processingResult.engravingStyles?.styles?.standard || processingResult.finalUrl,
          petName
        );
        
        if (singleComposite.success) {
          pendantPreviews.single = singleComposite.compositeUrl;
        }
      } else {
        // Multiple pendant previews (double/triple/quad)
        const engravingUrl = processingResult.engravingStyles?.styles?.standard || processingResult.finalUrl;
        const multipleComposites = await createMultiplePendantComposites([
          { engravingUrl, petName }
        ], pendantType);
        
        if (multipleComposites.success) {
          pendantPreviews[pendantType] = multipleComposites.compositeUrl;
        }
      }
    } catch (error) {
      console.error('Error creating pendant previews:', error);
      // Continue without previews if this fails
    }

    // Prepare the complete result for Shopify return
    const shopifyResult = {
      success: true,
      sessionId,
      
      // Shopify context
      shopify: {
        domain: shopifyDomain,
        returnUrl,
        productId,
        variantId,
        pendantType,
        customerEmail,
        orderId
      },
      
      // Pet information
      pet: {
        name: petName,
        originalImage: processingResult.originalUrl || processingResult.preview
      },
      
      // Processing results
      engravings: {
        styles: processingResult.engravingStyles?.styles || {},
        primary: processingResult.engravingStyles?.styles?.standard || processingResult.finalUrl,
        method: processingResult.engravingStyles?.method || 'standard'
      },
      
      // Pendant previews
      pendantPreviews,
      
      // Metadata
      metadata: {
        processedAt: new Date().toISOString(),
        processingSteps: processingResult.steps || [],
        dimensions: processingResult.metadata?.dimensions
      }
    };

    console.log('✅ Shopify processing completed successfully');
    
    return NextResponse.json(shopifyResult, { headers: corsHeaders });
    
  } catch (error) {
    console.error('❌ Shopify processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal processing error',
      message: error.message
    }, { status: 500, headers: corsHeaders });
  }
}