'use client';
import { useState, useEffect } from 'react';
import { downloadImage } from '../utils/downloadUtils';

const STYLE_CONFIGS = {
  'clean-simple-engraving': ['standard', 'bold'],
  'simple-feature-engraving': ['standard', 'bold'],
  'basic-engraving': ['standard', 'bold'],
  'clean-line-art': ['standard', 'bold'],
  'sketch-engraving': ['standard', 'bold'],
  'perfect-engraving': ['standard', 'bold'],
  'python-advanced': ['standard', 'bold'],
  'python-simple': ['standard', 'bold'],
  'python-opencv': ['standard', 'bold'],
  'python-engraving-filter': ['standard', 'bold'],
  'cloudinary': ['standard', 'bold'],
  'default': ['standard', 'bold']
};

const METHOD_LABELS = {
  'clean-simple-engraving': 'Clean Simple Engraving',
  'simple-feature-engraving': 'Simple Feature Engraving',
  'basic-engraving': 'Basic Engraving',
  'clean-line-art': 'Clean Line Art Engraving',
  'sketch-engraving': 'Textured Sketch-Style Engraving',
  'perfect-engraving': 'Professional Line Art Engraving',
  'python-opencv': 'Python OpenCV processing',
  'nodejs-opencv': 'Node.js OpenCV processing',
  'python-simple': 'Python processing',
  'python-engraving-filter': 'Python Engraving Filter',
  'cloudinary': 'Cloudinary processing',
  'default': 'Standard processing'
};

export default function ProcessingDashboard({ imageData }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [compositedPendant, setCompositedPendant] = useState(null);
  const [loadingComposite, setLoadingComposite] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);

  useEffect(() => {
    if (imageData) {
      // Handle multi-image pendant response
      if (imageData.success && imageData.images && imageData.images.length > 0) {
        setResults(imageData);
        // For multi-image, use the first image's styles
        const firstImage = imageData.images[0];
        if (!selectedStyle && firstImage.engravingStyles?.styles) {
          const styles = firstImage.engravingStyles.styles;
          const defaultStyle = styles.standard ? 'standard' : Object.keys(styles)[0];
          setSelectedStyle(defaultStyle);
        }
      }
      // Handle single image response
      else if (imageData.success && (imageData.processedUrl || imageData.finalImage || imageData.finalUrl)) {
        setResults(imageData);
        // Set default style based on available styles
        if (!selectedStyle && imageData.engravingStyles?.styles) {
          // Try to set 'standard' as default, otherwise use first available
          const styles = imageData.engravingStyles.styles;
          const defaultStyle = styles.standard ? 'standard' : Object.keys(styles)[0];
          setSelectedStyle(defaultStyle);
        }
      } else if (imageData.error) {
        setError(imageData.error);
      }
    }
  }, [imageData, selectedStyle]);

  // Create composited pendant for multi-image pendants
  useEffect(() => {
    const createCompositedPendant = async () => {
      if (!results || !results.images || results.images.length <= 1) return;
      
      setLoadingComposite(true);
      
      try {
        const formData = new FormData();
        formData.append('pendantType', results.pendantType);
        formData.append('imageCount', results.images.length.toString());
        
        console.log('Processing Dashboard - Pet Names:', results.petNames);
        console.log('Processing Dashboard - Images with names:', results.images.map(img => img.petName));
        
        // Add all engraved images and pet names to formData
        for (let i = 0; i < results.images.length; i++) {
          // Use the selected style or default to 'standard' or 'bold'
          const styles = results.images[i].engravingStyles?.styles;
          const imageUrl = styles?.[selectedStyle] || 
                          styles?.standard ||
                          styles?.bold ||
                          Object.values(styles || {})[0] ||
                          results.images[i].finalUrl;
          
          if (imageUrl) {
            // Convert image URL to blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            formData.append(`image${i + 1}`, blob);
            // Add pet name if available
            const petName = results.images[i].petName || results.petNames?.[i] || '';
            console.log(`Adding pet name ${i + 1}:`, petName);
            formData.append(`petName${i + 1}`, petName);
          }
        }
        
        // Call composite API
        const response = await fetch('/api/composite-pendant', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setCompositedPendant(data.compositedImage);
        }
      } catch (error) {
        console.error('Failed to create composited pendant:', error);
      } finally {
        setLoadingComposite(false);
      }
    };
    
    createCompositedPendant();
  }, [results, selectedStyle, selectedImageIndex]);

  // Function to create Shopify checkout and redirect
  const handleBuyNow = async () => {
    setCreatingCheckout(true);
    
    try {
      const checkoutData = {
        pendantType: results.pendantType || 'single',
        clientId: results.clientId,
        clientName: results.clientName || 'Guest',
      };

      // Handle multi-image pendants
      if (isMultiImage && results.images && results.images.length > 0) {
        checkoutData.pets = results.images.map((img, idx) => {
          const imgEngravingStyles = img.engravingStyles?.styles || {};
          const imgLocketComposites = img.engravingStyles?.locketComposites || {};
          const imgEngravingUrl = imgEngravingStyles[selectedStyle] || 
                                 imgEngravingStyles.standard || 
                                 Object.values(imgEngravingStyles)[0];
          const imgLocketUrl = imgLocketComposites[selectedStyle] || 
                              imgLocketComposites.standard || 
                              Object.values(imgLocketComposites)[0];
          
          return {
            petName: results.petNames?.[idx] || img.petName || `Pet ${idx + 1}`,
            engravingUrl: imgEngravingUrl || img.finalUrl,
            originalUrl: results.preview?.[idx] || img.finalUrl,
            locketUrl: imgLocketUrl
          };
        });
        
        // Add composited pendant image for double/triple
        if (compositedPendant) {
          checkoutData.compositedImageUrl = compositedPendant;
        }
      } else {
        // Handle single image
        const engravingStyles = results.engravingStyles?.styles || {};
        const locketComposites = results.engravingStyles?.locketComposites || {};
        const currentEngravingUrl = engravingStyles[selectedStyle] || 
                                   engravingStyles.standard || 
                                   Object.values(engravingStyles)[0];
        const currentLocketUrl = locketComposites[selectedStyle] || 
                                locketComposites.standard || 
                                Object.values(locketComposites)[0];
        
        checkoutData.petName = results.petName || 'Pet';
        checkoutData.engravingImageUrl = currentEngravingUrl || results.finalUrl;
        checkoutData.originalImageUrl = results.originalUrl || results.preview;
        checkoutData.locketImageUrl = currentLocketUrl;
      }

      const response = await fetch('/api/shopify-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Optionally save to database before redirecting
        await handleSaveToDatabase();
        
        // Redirect to Shopify checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to create checkout. Please check your Shopify configuration.');
    } finally {
      setCreatingCheckout(false);
    }
  };

  // Function to save order to database
  const handleSaveToDatabase = async () => {
    setSaving(true);
    
    console.log('Full results object:', results);
    console.log('engravingStyles:', results.engravingStyles);
    console.log('Client Name from results:', results.clientName);
    
    try {
      const saveData = {
        clientId: results.clientId,
        clientName: results.clientName || 'Anonymous',
        pendantType: results.pendantType,
      };
      
      // Add composite pendant URL for double/triple pendants
      if (compositedPendant && (results.pendantType === 'double' || results.pendantType === 'triple')) {
        console.log('Adding composite pendant to save data:', compositedPendant);
        saveData.compositePendantUrl = compositedPendant;
        saveData.compositePendantPublicId = `composite-${results.clientId}`;
      }

      // Handle multi-image pendants
      if (results.images && results.images.length > 0) {
        saveData.multipleImages = results.images.map((img, idx) => {
          const imgEngravingStyles = img.engravingStyles?.styles || {};
          const imgLocketComposites = img.engravingStyles?.locketComposites || {};
          const imgEngravingUrl = imgEngravingStyles.standard || Object.values(imgEngravingStyles)[0];
          const imgLocketUrl = imgLocketComposites.standard || Object.values(imgLocketComposites)[0];
          
          return {
            petName: results.petNames?.[idx] || `Pet ${idx + 1}`,
            originalUrl: results.preview?.[idx] || img.finalUrl,
            originalPublicId: img.originalPublicId || '',
            processedUrl: img.finalUrl,
            processedPublicId: img.processedPublicId || '',
            engravingUrl: imgEngravingUrl || img.finalUrl,
            engravingPublicId: img.processedPublicId || '',
            locketUrl: imgLocketUrl,
            finalUrl: img.finalUrl
          };
        });
      } else {
        // Handle single image
        // Get the current engraving and locket URLs based on selected style
        const engravingStyles = results.engravingStyles?.styles || {};
        const locketComposites = results.engravingStyles?.locketComposites || {};
        const currentEngravingUrl = engravingStyles[selectedStyle] || engravingStyles.standard || Object.values(engravingStyles)[0];
        const currentLocketUrl = locketComposites[selectedStyle] || locketComposites.standard || Object.values(locketComposites)[0];
        
        console.log('Saving with engraving URL:', currentEngravingUrl);
        console.log('Saving with locket URL:', currentLocketUrl);
        console.log('Available engraving styles:', Object.keys(engravingStyles));
        console.log('Available locket styles:', Object.keys(locketComposites));
        
        saveData.petName = results.petName || 'Pet';
        saveData.originalUrl = results.originalUrl || results.preview;
        saveData.originalPublicId = results.originalPublicId || '';
        saveData.processedUrl = results.finalUrl;
        saveData.processedPublicId = results.processedPublicId || '';
        saveData.engravingUrl = currentEngravingUrl || results.finalUrl;
        saveData.locketUrl = currentLocketUrl || results.finalUrl;
      }

      const response = await fetch('/api/save-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save order');
      }

      setSaved(true);
      setShowSaveConfirm(false);
      
      // Show success message
      setTimeout(() => {
        alert('Order saved successfully! Client ID: ' + results.clientId);
      }, 100);
      
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save order: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!imageData) return null;

  if (error) {
    return (
      <div className="text-center py-32">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-32">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Processing your image...</p>
      </div>
    );
  }

  // Check if this is a multi-image pendant
  const isMultiImage = results.images && results.images.length > 0;
  
  // Get current image data (for multi-image or single)
  const currentImageData = isMultiImage ? results.images[selectedImageIndex] : results;
  
  const engravingStyles = currentImageData?.engravingStyles?.styles || {};
  const locketComposites = currentImageData?.engravingStyles?.locketComposites || {};
  const vectorMethod = currentImageData?.engravingStyles?.method || 'default';
  
  const styleNames = STYLE_CONFIGS[vectorMethod] || STYLE_CONFIGS.default;
  const availableStyles = styleNames.filter(name => engravingStyles[name]);
  
  const currentEngravingUrl = engravingStyles[selectedStyle] || Object.values(engravingStyles)[0];
  const currentLocketUrl = locketComposites[selectedStyle] || Object.values(locketComposites)[0];
  const originalImage = isMultiImage 
    ? (results.preview?.[selectedImageIndex] || currentImageData.finalUrl)
    : (results.preview || results.steps?.[0]?.url || results.finalUrl);

  // Check if SVG is available for download
  const svgUrl = engravingStyles.svg;

  // Format pendant type for display
  const getPendantTypeDisplay = (type) => {
    const typeMap = {
      'single': 'Single Photo Pendant',
      'double': 'Double Photo Pendant',
      'triple': 'Triple Photo Pendant',
      'quarter': 'Four Photo Pendant',
      'custom': 'Custom Design Pendant'
    };
    return typeMap[type] || 'Pendant';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
          Your Pet Memorial Engraving
        </h1>
        {imageData?.pendantType && (
          <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-2">
            {getPendantTypeDisplay(imageData.pendantType)}
          </p>
        )}
       
      </div>

      {/* Image Selector for Multi-Image Pendants */}
      {isMultiImage && results.images.length > 1 && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {results.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedImageIndex === idx
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Pet {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style Selector */}
      {availableStyles.length > 1 && (
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {availableStyles.map((styleName) => (
              <button
                key={styleName}
                onClick={() => setSelectedStyle(styleName)}
                className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  selectedStyle === styleName
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {styleName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Original Photo */}
        <div className="flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden aspect-square mb-4">
            {originalImage && (
              <img
                src={originalImage}
                alt="Original pet photo"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h3 className="text-center text-gray-900 dark:text-white font-medium mb-3">
            Original Photo
          </h3>
          <button
            onClick={() => downloadImage(originalImage, 'original-pet-photo.jpg')}
            className="text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Download
          </button>
        </div>

        {/* Engraving */}
        <div className="flex flex-col">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden aspect-square mb-4 p-8">
            {currentEngravingUrl && (
              <img
                src={currentEngravingUrl}
                alt={`${selectedStyle} engraving`}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <h3 className="text-center text-gray-900 dark:text-white font-medium mb-3 capitalize">
            {selectedStyle || 'Standard'} Engraving
          </h3>
          <button
            onClick={() => {
              if (svgUrl) {
                downloadImage(svgUrl, `pet-engraving-${selectedStyle}.svg`);
              } else {
                downloadImage(currentEngravingUrl, `pet-engraving-${selectedStyle}.png`);
              }
            }}
            className="text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Download {svgUrl ? 'SVG' : 'PNG'}
          </button>
        </div>

        {/* Locket Preview */}
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm overflow-hidden aspect-square mb-4 p-4">
            {currentLocketUrl ? (
              <img
                src={currentLocketUrl}
                alt="Locket preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-48 h-48 mx-auto mb-4">
                    {/* Outer gold ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 shadow-2xl"></div>
                    {/* Inner recess */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-inner"></div>
                    {/* Engraving area */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 flex items-center justify-center overflow-hidden">
                      {currentEngravingUrl && (
                        <img
                          src={currentEngravingUrl}
                          alt="Locket engraving"
                          className="w-full h-full object-contain opacity-80 mix-blend-darken"
                          style={{ filter: 'contrast(1.2) brightness(0.8)' }}
                        />
                      )}
                    </div>
                    {/* Top ring attachment */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"></div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Locket Preview</p>
                </div>
              </div>
            )}
          </div>
          <h3 className="text-center text-gray-900 dark:text-white font-medium mb-3">
            Locket Preview
          </h3>
          <button
            onClick={() => downloadImage(currentLocketUrl || currentEngravingUrl, `locket-preview-${selectedStyle}.jpg`)}
            className="text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      {/* Processing Steps - Minimal */}
      {results.steps && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Processing Steps
          </h3>
          <div className="flex flex-wrap gap-3">
            {results.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  step.status === 'completed' ? 'bg-green-500' : 
                  step.status === 'failed' ? 'bg-red-500' : 
                  'bg-gray-400'
                }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-12 flex-wrap">
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Upload Another Photo
        </button>
        <button
          onClick={() => {
            const filename = `pet-memorial-${selectedStyle}-${Date.now()}.zip`;
            // In a real implementation, this would create a zip with all files
            downloadImage(currentEngravingUrl, `pet-engraving-${selectedStyle}.png`);
          }}
          className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Download All Files
        </button>
        {!saved && (
          <button
            onClick={() => setShowSaveConfirm(true)}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Save Order to Database
          </button>
        )}
        {saved && (
          <button
            disabled
            className="px-8 py-3 bg-green-600 text-white rounded-lg cursor-not-allowed opacity-75"
          >
            ✓ Order Saved
          </button>
        )}
        
        {/* Buy Now Button - Primary CTA */}
        <button
          onClick={handleBuyNow}
          disabled={creatingCheckout}
          className="px-12 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {creatingCheckout ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Checkout...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Buy Now on Shopify
            </span>
          )}
        </button>
      </div>

      {/* Save Confirmation Dialog */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Save Order to Database?
            </h3>
            <div className="mb-6 space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                This will save the following information:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 ml-4 list-disc">
                <li>Client Name: {results.clientName || 'Guest'}</li>
                <li>Client ID: {results.clientId}</li>
                <li>Pendant Type: {results.pendantType}</li>
                <li>Pet Name(s): {results.petName || results.petNames?.join(', ') || 'Pet'}</li>
                <li>Processed Images</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToDatabase}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Image Pendant Composite Preview */}
      {isMultiImage && (results.pendantType === 'double' || results.pendantType === 'triple') && (
        <div className="mt-12">
          <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6 text-center">
            Your {results.pendantType === 'double' ? 'Double' : 'Triple'} Pendant Preview
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl shadow-2xl overflow-hidden p-8">
              {loadingComposite ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Creating your pendant preview...</p>
                </div>
              ) : compositedPendant ? (
                <div className="relative">
                  <img
                    src={compositedPendant}
                    alt={`${results.pendantType} pendant with your pets`}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      This is how your {results.images.length} pets will look on the {results.pendantType} pendant
                    </p>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = compositedPendant;
                        link.download = `${results.pendantType}-pendant-preview.jpg`;
                        link.click();
                      }}
                      className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Pendant Preview
                    </button>
                  </div>
                </div>
              ) : results.metadata?.pendantTemplate ? (
                <div className="relative">
                  <img
                    src={results.metadata.pendantTemplate}
                    alt={`${results.pendantType} pendant template`}
                    className="w-full h-auto opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-gray-900/90 px-6 py-3 rounded-lg text-center">
                      Processing pendant preview...<br/>
                      Your {results.images.length} pet photos will appear here
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}