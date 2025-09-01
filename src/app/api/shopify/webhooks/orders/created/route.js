import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import ShopifyOrder from '@/models/ShopifyOrder';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

// Verify Shopify webhook signature
function verifyWebhook(body, signature) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.warn('⚠️ SHOPIFY_WEBHOOK_SECRET not configured - skipping verification in development');
    return true; // Allow in development
  }
  
  const hmac = crypto.createHmac('sha256', SHOPIFY_WEBHOOK_SECRET);
  hmac.update(body);
  const calculatedSignature = 'sha256=' + hmac.digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}

export async function POST(request) {
  try {
    // Get the webhook signature
    const signature = request.headers.get('X-Shopify-Hmac-Sha256');
    const body = await request.text();
    
    // Verify webhook authenticity
    if (!verifyWebhook(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orderData = JSON.parse(body);
    
    console.log('🛍️ Received Shopify order webhook:', {
      id: orderData.id,
      number: orderData.number,
      email: orderData.email
    });
    
    // Extract pet engraving data from line item custom attributes
    const engravingLineItems = orderData.line_items.filter(item => {
      return item.properties && 
             item.properties.some(prop => 
               prop.name === 'Engraving Image' || 
               prop.name === 'Pet Name' ||
               prop.name === 'Client ID'
             );
    });
    
    if (engravingLineItems.length === 0) {
      console.log('📦 Order does not contain pet engravings, skipping');
      return NextResponse.json({ received: true });
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Process each engraving line item
    for (const lineItem of engravingLineItems) {
      try {
        const properties = lineItem.properties || [];
        
        // Extract engraving data from properties
        const engravingData = {
          shopifyOrderId: String(orderData.id),
          shopifyOrderNumber: String(orderData.number),
          shopifyCustomerId: orderData.customer ? String(orderData.customer.id) : null,
          
          // Customer information
          customerEmail: orderData.email,
          customerName: orderData.customer ? 
            `${orderData.customer.first_name || ''} ${orderData.customer.last_name || ''}`.trim() : 
            orderData.billing_address ? 
            `${orderData.billing_address.first_name || ''} ${orderData.billing_address.last_name || ''}`.trim() :
            'Unknown',
          
          // Shipping address
          shippingAddress: orderData.shipping_address ? {
            firstName: orderData.shipping_address.first_name,
            lastName: orderData.shipping_address.last_name,
            address1: orderData.shipping_address.address1,
            address2: orderData.shipping_address.address2,
            city: orderData.shipping_address.city,
            province: orderData.shipping_address.province,
            country: orderData.shipping_address.country,
            zip: orderData.shipping_address.zip,
            phone: orderData.shipping_address.phone
          } : null,
          
          // Product information
          productId: String(lineItem.product_id),
          variantId: String(lineItem.variant_id),
          productTitle: lineItem.title,
          variantTitle: lineItem.variant_title,
          quantity: lineItem.quantity,
          price: lineItem.price,
          
          // Financial information
          totalPrice: orderData.total_price,
          subtotalPrice: orderData.subtotal_price,
          totalTax: orderData.total_tax,
          currency: orderData.currency,
          
          // Order status
          orderStatus: orderData.financial_status || 'pending',
          fulfillmentStatus: orderData.fulfillment_status || 'unfulfilled',
          
          // Timestamps
          shopifyCreatedAt: new Date(orderData.created_at),
          shopifyUpdatedAt: new Date(orderData.updated_at),
          
          // Metadata
          metadata: {
            shopifyDomain: request.headers.get('X-Shopify-Shop-Domain'),
            tags: orderData.tags ? orderData.tags.split(', ') : [],
            note: orderData.note
          }
        };
        
        // Extract pet data from properties
        const pets = [];
        let sessionId = null;
        let pendantType = 'single';
        let pendantPreviewUrl = null;
        
        // Parse properties
        const propMap = {};
        properties.forEach(prop => {
          propMap[prop.name] = prop.value;
        });
        
        // Extract main data
        sessionId = propMap['Client ID'];
        pendantType = propMap['Pendant Type'] || 'single';
        pendantPreviewUrl = propMap['Composited Preview'];
        
        // Determine if single or multiple pets
        const numberOfPets = parseInt(propMap['Number of Pets']) || 1;
        
        if (numberOfPets === 1) {
          // Single pet
          pets.push({
            name: propMap['Pet Name'] || 'Pet',
            originalImageUrl: propMap['Original Photo'],
            engravingImageUrl: propMap['Engraving Image'],
            engravingStyle: propMap['Style Selected'] || 'standard',
            processingMethod: propMap['Processing Method'] || 'python-engraving-filter'
          });
        } else {
          // Multiple pets
          for (let i = 1; i <= numberOfPets; i++) {
            const petData = {
              name: propMap[`Pet ${i} Name`] || `Pet ${i}`,
              originalImageUrl: propMap[`Pet ${i} Original`],
              engravingImageUrl: propMap[`Pet ${i} Engraving`],
              engravingStyle: 'standard',
              processingMethod: 'python-engraving-filter'
            };
            
            if (petData.engravingImageUrl) {
              pets.push(petData);
            }
          }
        }
        
        // Complete the engraving data
        engravingData.pendantType = pendantType;
        engravingData.pets = pets;
        engravingData.sessionId = sessionId;
        engravingData.pendantPreviewUrl = pendantPreviewUrl;
        engravingData.processingCompletedAt = propMap['Processed Date'] ? 
          new Date(propMap['Processed Date']) : new Date();
        
        // Add custom attributes
        engravingData.metadata.customAttributes = properties.map(prop => ({
          key: prop.name,
          value: prop.value
        }));
        
        console.log('💾 Saving engraving data:', {
          orderId: engravingData.shopifyOrderId,
          pets: pets.length,
          pendantType,
          sessionId
        });
        
        // Check if this order already exists
        const existingOrder = await ShopifyOrder.findOne({
          shopifyOrderId: engravingData.shopifyOrderId
        });
        
        if (existingOrder) {
          console.log('🔄 Order already exists, updating:', existingOrder._id);
          
          // Update existing order
          Object.assign(existingOrder, engravingData);
          await existingOrder.save();
          
          console.log('✅ Updated existing Shopify order in database');
        } else {
          // Create new order
          const shopifyOrder = new ShopifyOrder(engravingData);
          await shopifyOrder.save();
          
          console.log('✅ Saved new Shopify order to database:', shopifyOrder._id);
        }
        
      } catch (itemError) {
        console.error('❌ Error processing line item:', itemError);
        console.error('Line item:', JSON.stringify(lineItem, null, 2));
        // Continue processing other items
      }
    }
    
    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Error details:', error.stack);
    
    // Return 200 to acknowledge receipt (Shopify will retry on 4xx/5xx)
    // But log the error for debugging
    return NextResponse.json({ 
      received: true, 
      error: 'Processing failed - logged for review' 
    });
  }
}