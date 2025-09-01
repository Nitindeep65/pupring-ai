'use client';

import { useState, useEffect } from 'react';

export default function ShopifyEngravingWidget() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('standard');
  const [error, setError] = useState(null);

  // Listen for messages from parent Shopify page
  useEffect(() => {
    const handleMessage = (event) => {
      // You can restrict origin in production
      // if (event.origin !== 'https://your-shop.myshopify.com') return;
      
      if (event.data.type === 'SET_PENDANT_TYPE') {
        // Handle pendant type change from Shopify
        console.log('Pendant type:', event.data.pendantType);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send result back to Shopify
  const sendToShopify = (data) => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'ENGRAVING_RESULT',
        ...data
      }, '*'); // Use specific origin in production
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('pendantType', 'single');
      formData.append('petName', 'Pet');

      const response = await fetch('/api/shopify-engraving', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        // Send result to parent Shopify page
        sendToShopify({
          success: true,
          engravingUrl: data.primaryEngraving,
          allStyles: data.engravingStyles,
          locketPreviews: data.locketPreviews,
          originalImage: data.originalImage
        });
      } else {
        setError(data.error || 'Processing failed');
        sendToShopify({
          success: false,
          error: data.error
        });
      }
    } catch (err) {
      setError('Failed to process image');
      sendToShopify({
        success: false,
        error: 'Processing error'
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = result?.engravingStyles || {};
  const locketPreviews = result?.locketPreviews || {};
  const currentEngraving = styles[selectedStyle] || styles.standard || result?.primaryEngraving;
  const currentLocket = locketPreviews[selectedStyle] || locketPreviews.standard;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Customize Your Pet Engraving</h2>
        
        {/* Upload Section */}
        {!result && (
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer"
              >
                {preview ? (
                  <div>
                    <img
                      src={preview}
                      alt="Pet preview"
                      className="max-w-xs mx-auto mb-4 rounded-lg"
                    />
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-lg mb-2">Upload your pet&apos;s photo</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </label>
            </div>

            {preview && !loading && (
              <button
                onClick={processImage}
                className="w-full mt-4 bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Generate Engraving
              </button>
            )}

            {loading && (
              <div className="text-center mt-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Processing your image...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div>
            {/* Style Selector */}
            {Object.keys(styles).length > 1 && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  {Object.keys(styles).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                        selectedStyle === style
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:text-black'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Original */}
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-4 aspect-square flex items-center justify-center">
                  <img
                    src={result.originalImage}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="mt-2 font-medium">Original Photo</p>
              </div>

              {/* Engraving */}
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-4 aspect-square flex items-center justify-center">
                  {currentEngraving && (
                    <img
                      src={currentEngraving}
                      alt="Engraving"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
                <p className="mt-2 font-medium">Engraving Preview</p>
              </div>

              {/* Locket */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4 aspect-square flex items-center justify-center">
                  {currentLocket ? (
                    <img
                      src={currentLocket}
                      alt="Locket"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg">
                        {currentEngraving && (
                          <img
                            src={currentEngraving}
                            alt="Locket preview"
                            className="w-24 h-24 object-contain opacity-80"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-2 font-medium">On Pendant</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setResult(null);
                  setPreview(null);
                  setImage(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upload New Photo
              </button>
              <button
                onClick={() => {
                  sendToShopify({
                    confirmed: true,
                    engravingUrl: currentEngraving,
                    locketUrl: currentLocket,
                    style: selectedStyle
                  });
                }}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Use This Design
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}