'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createCheckoutWithEngraving, PENDANT_VARIANTS } from '@/lib/shopify';

export default function ShopifyReturnPage() {
  const searchParams = useSearchParams();
  const [processingData, setProcessingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('standard');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session');
    const shopifyReturn = searchParams.get('shopify');
    
    if (!sessionId || !shopifyReturn) {
      setError('Invalid session or missing Shopify context');
      setLoading(false);
      return;
    }

    // In a real implementation, you'd fetch this from your backend
    // For now, we'll check if there's data in localStorage from the processing
    const storedData = localStorage.getItem(`shopify-session-${sessionId}`);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setProcessingData(data);
        setSelectedStyle(data.engravings?.primary ? 'standard' : Object.keys(data.engravings?.styles || {})[0]);
      } catch (e) {
        setError('Failed to load processing data');
      }
    } else {
      setError('No processing data found for this session');
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleReturnToShopify = async () => {
    if (!processingData) return;
    
    setCheckingOut(true);
    
    try {
      const selectedEngravingUrl = processingData.engravings.styles[selectedStyle] || 
                                   processingData.engravings.primary;
      
      const variantId = PENDANT_VARIANTS[processingData.shopify.pendantType] || 
                       processingData.shopify.variantId;
      
      // Create Shopify checkout with the selected engraving
      const checkoutResult = await createCheckoutWithEngraving({
        variantId,
        engravingImageUrl: selectedEngravingUrl,
        originalImageUrl: processingData.pet.originalImage,
        petName: processingData.pet.name,
        pendantType: processingData.shopify.pendantType,
        clientId: processingData.sessionId,
        additionalAttributes: {
          'Processing Method': processingData.engravings.method,
          'Style Selected': selectedStyle,
          'Processed Date': processingData.metadata.processedAt,
          'Customer Email': processingData.shopify.customerEmail || 'Not provided'
        }
      });

      if (checkoutResult.success) {
        // Clear the stored data
        localStorage.removeItem(`shopify-session-${processingData.sessionId}`);
        
        // Redirect to Shopify checkout
        window.location.href = checkoutResult.checkoutUrl;
      } else {
        throw new Error(checkoutResult.error);
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(`Failed to create checkout: ${error.message}`);
      setCheckingOut(false);
    }
  };

  const handleBackToShopify = () => {
    if (processingData?.shopify?.returnUrl) {
      window.location.href = processingData.shopify.returnUrl;
    } else {
      window.history.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your engraving results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleBackToShopify}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!processingData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Your {processingData.pet.name} Engraving is Ready!
            </h1>
            <button
              onClick={handleBackToShopify}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to Shop
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Original Photo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Photo</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={processingData.pet.originalImage}
                alt={`${processingData.pet.name} original photo`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Engraving Result */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engraving Preview</h3>
            
            {/* Style Selector */}
            {Object.keys(processingData.engravings.styles || {}).length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Style:
                </label>
                <div className="flex gap-2">
                  {Object.keys(processingData.engravings.styles || {}).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                        selectedStyle === style
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Engraving Preview */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <Image
                src={processingData.engravings.styles[selectedStyle] || processingData.engravings.primary}
                alt={`${processingData.pet.name} engraving - ${selectedStyle} style`}
                fill
                className="object-contain"
              />
            </div>

            {/* Pendant Preview */}
            {processingData.pendantPreviews && processingData.pendantPreviews[processingData.shopify.pendantType] && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  How it looks on your {processingData.shopify.pendantType} pendant:
                </h4>
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={processingData.pendantPreviews[processingData.shopify.pendantType]}
                    alt={`${processingData.pet.name} on ${processingData.shopify.pendantType} pendant`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Pet Name:</span> {processingData.pet.name}</p>
              <p><span className="font-medium">Pendant Type:</span> {processingData.shopify.pendantType}</p>
              <p><span className="font-medium">Style:</span> {selectedStyle}</p>
            </div>
            <div>
              <p><span className="font-medium">Processing Method:</span> {processingData.engravings.method}</p>
              <p><span className="font-medium">Processed:</span> {new Date(processingData.metadata.processedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={handleBackToShopify}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Shop
          </button>
          <button
            onClick={handleReturnToShopify}
            disabled={checkingOut}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              checkingOut
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {checkingOut ? 'Adding to Cart...' : 'Add to Cart & Checkout'}
          </button>
        </div>

        {/* Processing Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Your engraving will be professionally applied to your {processingData.shopify.pendantType} pendant.</p>
          <p className="mt-1">Processing typically takes 3-5 business days after order confirmation.</p>
        </div>
      </div>
    </div>
  );
}