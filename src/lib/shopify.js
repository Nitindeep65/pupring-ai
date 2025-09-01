import Client from 'shopify-buy';

// Initialize Shopify client
// You'll need to get these values from your Shopify store:
// 1. Go to Shopify Admin > Apps > Manage private apps
// 2. Create a private app with Storefront API access
// 3. Get your Storefront Access Token and Shop Domain
const client = Client.buildClient({
  domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'your-shop.myshopify.com',
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || 'your-storefront-access-token',
  apiVersion: '2024-01' // Use the latest API version
});

// Product variant IDs for different pendant types
// You'll need to replace these with your actual Shopify product variant IDs
export const PENDANT_VARIANTS = {
  single: process.env.NEXT_PUBLIC_SHOPIFY_SINGLE_PENDANT_VARIANT_ID || 'gid://shopify/ProductVariant/YOUR_SINGLE_VARIANT_ID',
  double: process.env.NEXT_PUBLIC_SHOPIFY_DOUBLE_PENDANT_VARIANT_ID || 'gid://shopify/ProductVariant/YOUR_DOUBLE_VARIANT_ID',
  triple: process.env.NEXT_PUBLIC_SHOPIFY_TRIPLE_PENDANT_VARIANT_ID || 'gid://shopify/ProductVariant/YOUR_TRIPLE_VARIANT_ID'
};

/**
 * Creates a Shopify checkout with custom engraving attributes
 * @param {Object} params - Checkout parameters
 * @param {string} params.variantId - Shopify product variant ID
 * @param {string} params.engravingImageUrl - URL of the engraved image
 * @param {string} params.originalImageUrl - URL of the original pet photo
 * @param {string} params.petName - Name of the pet
 * @param {string} params.pendantType - Type of pendant (single, double, triple)
 * @param {string} params.clientId - Client ID from your system
 * @param {Object} params.additionalAttributes - Any additional custom attributes
 * @returns {Promise<Object>} Checkout object with webUrl
 */
export async function createCheckoutWithEngraving({
  variantId,
  engravingImageUrl,
  originalImageUrl,
  petName,
  pendantType,
  clientId,
  additionalAttributes = {}
}) {
  try {
    // Prepare custom attributes for the line item
    const customAttributes = [
      { key: 'Engraving Image', value: engravingImageUrl },
      { key: 'Original Photo', value: originalImageUrl },
      { key: 'Pet Name', value: petName || 'Not Provided' },
      { key: 'Pendant Type', value: pendantType },
      { key: 'Client ID', value: clientId },
      { key: 'Order Date', value: new Date().toISOString() }
    ];

    // Add any additional attributes
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      customAttributes.push({ key, value: String(value) });
    });

    // Create the checkout
    const checkout = await client.checkout.create({
      lineItems: [{
        variantId,
        quantity: 1,
        customAttributes
      }]
    });

    return {
      success: true,
      checkoutUrl: checkout.webUrl,
      checkoutId: checkout.id,
      checkout
    };
  } catch (error) {
    console.error('Error creating Shopify checkout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates a checkout for multiple pet pendants (double/triple)
 * @param {Object} params - Checkout parameters
 * @param {string} params.pendantType - Type of pendant (double or triple)
 * @param {Array} params.pets - Array of pet data with engraving info
 * @param {string} params.compositedImageUrl - URL of the composited pendant preview
 * @param {string} params.clientId - Client ID
 * @returns {Promise<Object>} Checkout object with webUrl
 */
export async function createMultiPetCheckout({
  pendantType,
  pets,
  compositedImageUrl,
  clientId
}) {
  try {
    const variantId = PENDANT_VARIANTS[pendantType];
    
    if (!variantId) {
      throw new Error(`No variant ID configured for pendant type: ${pendantType}`);
    }

    // Prepare custom attributes for multiple pets
    const customAttributes = [
      { key: 'Pendant Type', value: pendantType },
      { key: 'Number of Pets', value: String(pets.length) },
      { key: 'Composited Preview', value: compositedImageUrl },
      { key: 'Client ID', value: clientId },
      { key: 'Order Date', value: new Date().toISOString() }
    ];

    // Add each pet's information
    pets.forEach((pet, index) => {
      const petNum = index + 1;
      customAttributes.push(
        { key: `Pet ${petNum} Name`, value: pet.name || `Pet ${petNum}` },
        { key: `Pet ${petNum} Engraving`, value: pet.engravingUrl },
        { key: `Pet ${petNum} Original`, value: pet.originalUrl }
      );
    });

    // Create the checkout
    const checkout = await client.checkout.create({
      lineItems: [{
        variantId,
        quantity: 1,
        customAttributes
      }]
    });

    return {
      success: true,
      checkoutUrl: checkout.webUrl,
      checkoutId: checkout.id,
      checkout
    };
  } catch (error) {
    console.error('Error creating multi-pet checkout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Adds a custom pendant to an existing checkout
 * @param {string} checkoutId - Existing checkout ID
 * @param {Object} lineItem - Line item to add
 * @returns {Promise<Object>} Updated checkout
 */
export async function addToCheckout(checkoutId, lineItem) {
  try {
    const checkout = await client.checkout.addLineItems(checkoutId, [lineItem]);
    return {
      success: true,
      checkout,
      checkoutUrl: checkout.webUrl
    };
  } catch (error) {
    console.error('Error adding to checkout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetches product information from Shopify
 * @param {string} productId - Shopify product ID
 * @returns {Promise<Object>} Product information
 */
export async function fetchProduct(productId) {
  try {
    const product = await client.product.fetch(productId);
    return {
      success: true,
      product
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default client;