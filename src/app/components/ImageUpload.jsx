'use client'
import { useState, useRef, useCallback } from 'react'

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const SUPPORTED_FORMATS = 'JPG, PNG, GIF, WebP'

export default function ImageUpload({ onUploadComplete, maxSize = MAX_FILE_SIZE, className = '' }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pendantType, setPendantType] = useState(null)
  const [showPendantOptions, setShowPendantOptions] = useState(false)
  const [multipleImages, setMultipleImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [petNames, setPetNames] = useState([])
  const [currentPetName, setCurrentPetName] = useState('')
  const [clientName, setClientName] = useState('')
  const [showClientForm, setShowClientForm] = useState(false)
  const fileInputRef = useRef(null)

  // Get required number of images for pendant type
  const getRequiredImages = useCallback((type) => {
    switch(type) {
      case 'double': return 2
      case 'triple': return 3
      case 'quarter': return 4
      default: return 1
    }
  }, [])

  // Memoized file validation
  const validateFile = useCallback((file) => {
    if (!file) return 'No file selected'
    
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type. Supported formats: ${SUPPORTED_FORMATS}`
    }
    
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
    }
    
    return null
  }, [maxSize])

  // Optimized file preview generation
  const generatePreview = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => resolve(ev.target.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [])

  // Enhanced error handling for API responses
  const handleApiError = useCallback(async (response) => {
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const errorData = await response.json()
      return errorData.error || 'Upload failed'
    }
    
    const errorText = await response.text()
    if (errorText.includes('<!DOCTYPE')) {
      return 'Server error occurred. Please try again.'
    }
    
    return errorText || 'Upload failed'
  }, [])

  // Helper function to upload single image
  const uploadSingleImageHandler = useCallback(async (previewUrl) => {
    try {
      console.log('uploadSingleImageHandler - clientName at start:', clientName)
      console.log('uploadSingleImageHandler - clientName type:', typeof clientName)
      console.log('uploadSingleImageHandler - clientName length:', clientName?.length)
      
      setUploading(true)
      setUploadProgress(10)

      const base64Response = await fetch(previewUrl)
      const blob = await base64Response.blob()
      const file = new File([blob], "pet-image.jpg", { type: blob.type })
      
      const formData = new FormData()
      formData.append('image', file)
      formData.append('pendantType', pendantType)
      formData.append('clientName', clientName)
      console.log('Sending client name to API:', clientName)
      if (currentPetName) {
        formData.append('petName', currentPetName)
      }
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 20, 90))
      }, 200)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || await handleApiError(response)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      result.preview = previewUrl
      result.pendantType = pendantType
      
      setSuccess(true)
      setTimeout(() => {
        onUploadComplete?.(result)
      }, 800)
      
    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 800)
    }
  }, [pendantType, currentPetName, clientName, handleApiError, onUploadComplete])

  // Helper function to upload multiple images
  const uploadMultipleImagesHandler = useCallback(async (images, names = []) => {
    try {
      setUploading(true)
      setUploadProgress(10)

      const formData = new FormData()
      
      console.log('Uploading with pet names:', names);
      
      for (let i = 0; i < images.length; i++) {
        const base64Response = await fetch(images[i])
        const blob = await base64Response.blob()
        const file = new File([blob], `pet-image-${i + 1}.jpg`, { type: blob.type })
        formData.append(`image${i + 1}`, file)
        if (names[i]) {
          console.log(`Adding petName${i + 1}:`, names[i]);
          formData.append(`petName${i + 1}`, names[i])
        }
      }
      
      formData.append('pendantType', pendantType)
      formData.append('clientName', clientName)
      console.log('Multi-image upload - Sending client name to API:', clientName)
      formData.append('imageCount', images.length.toString())
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 20, 90))
      }, 200)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || await handleApiError(response)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      result.preview = images
      result.pendantType = pendantType
      
      setSuccess(true)
      setTimeout(() => {
        onUploadComplete?.(result)
      }, 800)
      
    } catch (err) {
      setError(err.message)
      setMultipleImages([])
      setCurrentImageIndex(0)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 800)
    }
  }, [pendantType, clientName, handleApiError, onUploadComplete])

  // Main file processing function
  const processFile = useCallback(async (file) => {
    // Prevent multiple simultaneous uploads
    if (uploading) return
    
    setError(null)
    setSuccess(false)
    
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const previewUrl = await generatePreview(file)
    
    // Check if we're collecting images for multi-photo pendant
    if (pendantType && getRequiredImages(pendantType) > 1) {
      // Show preview to get pet name
      setPreview(previewUrl)
      // Don't add to collection yet - wait for name input
    } else if (pendantType === 'single' || pendantType === 'custom') {
      // Single image pendant - show preview
      setPreview(previewUrl)
      // Don't upload immediately - wait for user interaction
      // The upload will be triggered from the UI after preview is shown
    } else {
      // This shouldn't happen as pendant type should be selected first
      setError('Please select a pendant type first')
    }
  }, [uploading, validateFile, generatePreview, pendantType, getRequiredImages, uploadSingleImageHandler])
  
  // Handle pendant type selection (Step 1)
  const handlePendantSelection = useCallback((type) => {
    setPendantType(type)
    setShowPendantOptions(false)
    setShowClientForm(true) // Show client form after pendant selection
    
    // Reset any previous state
    setMultipleImages([])
    setCurrentImageIndex(0)
    setPreview(null)
    setPetNames([])
    setCurrentPetName('')
    
    // For multi-photo pendants, we'll collect multiple images
    if (getRequiredImages(type) > 1) {
      // Just set the type, file upload will handle the rest
    }
  }, [getRequiredImages])

  // Handle saving pet name and moving to next image
  const handleSavePetNameAndContinue = useCallback(() => {
    if (!preview) return
    
    // Add image and name to collections
    const newImages = [...multipleImages, preview]
    const newNames = [...petNames, currentPetName || `Pet ${currentImageIndex + 1}`]
    
    setMultipleImages(newImages)
    setPetNames(newNames)
    
    const requiredImages = getRequiredImages(pendantType)
    
    if (newImages.length < requiredImages) {
      // Need more images
      setCurrentImageIndex(newImages.length)
      setPreview(null)
      setCurrentPetName('')
    } else {
      // All images collected, proceed with upload
      uploadMultipleImagesHandler(newImages, newNames)
    }
  }, [preview, multipleImages, petNames, currentPetName, currentImageIndex, pendantType, getRequiredImages, uploadMultipleImagesHandler])

  // This function is not needed anymore since we handle it differently
  // Handle additional image for multi-photo pendant
  const handleAdditionalImage = useCallback(async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const previewUrl = await generatePreview(file)
    setPreview(previewUrl)
    // Wait for user to add name and click continue
  }, [validateFile, generatePreview])

  // Handle file input change
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Clear the input to allow re-uploading the same file
      e.target.value = ''
      processFile(file)
    }
  }, [processFile])

  // Enhanced drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragActive to false if we're actually leaving the container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Check if we're collecting multiple images
      if (pendantType && currentImageIndex > 0) {
        handleAdditionalImage(file)
      } else {
        processFile(file)
      }
    }
  }, [processFile, pendantType, currentImageIndex, handleAdditionalImage])

  // Click handler for file input
  const handleClick = useCallback(() => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [uploading])

  // Reset function
  const resetUpload = useCallback(() => {
    setPreview(null)
    setError(null)
    setUploading(false)
    setUploadProgress(0)
    setSuccess(false)
    setPendantType(null)
    setShowPendantOptions(false)
    setShowClientForm(false)
    setClientName('')
    setMultipleImages([])
    setCurrentImageIndex(0)
    setPetNames([])
    setCurrentPetName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Step 1: Pendant Type Selection - Show this first! */}
      {!pendantType && !preview ? (
        <div className="space-y-8 animate-fadeIn">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl"></div>
            
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-10 lg:p-12">
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
                  Choose Your Pendant Style
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Select how many photos you want on your memorial pendant
                </p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Single Pendant */}
                <button
                  onClick={() => handlePendantSelection('single')}
                  className="group relative transform transition-all duration-300 hover:scale-105"
                >
                  <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors p-8 shadow-lg hover:shadow-xl">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/0 to-orange-400/0 group-hover:from-amber-400/10 group-hover:to-orange-400/10 transition-opacity"></div>
                    
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        <span className="text-4xl font-bold text-white">1</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Single</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">One photo</p>
                    </div>
                  </div>
                </button>

                {/* Double Pendant */}
                <button
                  onClick={() => handlePendantSelection('double')}
                  className="group relative transform transition-all duration-300 hover:scale-105"
                >
                  <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors p-8 shadow-lg hover:shadow-xl">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/0 to-cyan-400/0 group-hover:from-blue-400/10 group-hover:to-cyan-400/10 transition-opacity"></div>
                    
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        <span className="text-4xl font-bold text-white">2</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Double</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Two photos</p>
                      {/* Popular badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Popular
                      </div>
                    </div>
                  </div>
                </button>

                {/* Triple Pendant */}
                <button
                  onClick={() => handlePendantSelection('triple')}
                  className="group relative transform transition-all duration-300 hover:scale-105"
                >
                  <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors p-8 shadow-lg hover:shadow-xl">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/0 to-green-400/0 group-hover:from-emerald-400/10 group-hover:to-green-400/10 transition-opacity"></div>
                    
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        <span className="text-4xl font-bold text-white">3</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Triple</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Three photos</p>
                    </div>
                  </div>
                </button>

                {/* Quarter Pendant */}
                <button
                  onClick={() => handlePendantSelection('quarter')}
                  className="group relative transform transition-all duration-300 hover:scale-105"
                >
                  <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors p-8 shadow-lg hover:shadow-xl">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/0 to-pink-400/0 group-hover:from-purple-400/10 group-hover:to-pink-400/10 transition-opacity"></div>
                    
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        <span className="text-4xl font-bold text-white">4</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Quarter</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Four photos</p>
                    </div>
                  </div>
                </button>

                {/* Custom/Other Option */}
                <button
                  onClick={() => handlePendantSelection('custom')}
                  className="group relative transform transition-all duration-300 hover:scale-105"
                >
                  <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors p-8 shadow-lg hover:shadow-xl">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/0 to-purple-400/0 group-hover:from-indigo-400/10 group-hover:to-purple-400/10 transition-opacity"></div>
                    
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Custom</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Special design</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Additional info */}
              <div className="mt-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    All pendants are professionally engraved with high-quality materials
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : uploading ? (
        // Loading UI during upload
        <div className="space-y-6 animate-fadeIn">
          <div className="card-elevated rounded-3xl overflow-hidden p-8">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    stroke="rgba(99, 102, 241, 0.2)" 
                    strokeWidth="8" 
                    fill="none"
                  />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    stroke="url(#gradient)" 
                    strokeWidth="8" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - uploadProgress / 100)}`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl animate-pulse">✨</span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Processing Your {pendantType} Pendant
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Creating your memorial jewelry...
              </p>
              <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                {uploadProgress}% complete
              </p>
            </div>
          </div>
        </div>
      ) : showClientForm && pendantType ? (
        <div className="space-y-8 animate-fadeIn">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl"></div>
            
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-10 lg:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
                  Almost There!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  You selected a <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pendantType}</span> pendant. Now let's get your information.
                </p>
              </div>
              
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This name will be associated with your order
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setPendantType(null)
                      setShowClientForm(false)
                      setClientName('')
                    }}
                    className="flex-1 btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (clientName.trim()) {
                        console.log('Client form - Client name before hiding form:', clientName)
                        setShowClientForm(false)
                      } else {
                        setError('Please enter your name to continue')
                      }
                    }}
                    className="flex-1 btn btn-primary"
                    disabled={!clientName.trim()}
                  >
                    Continue
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : pendantType && !preview && !success && !showClientForm ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="card-elevated rounded-3xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Upload Pet Photo {currentImageIndex + 1} of {getRequiredImages(pendantType)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              Upload the next pet photo for your {pendantType} pendant
            </p>
            
            {/* Show previously uploaded images */}
            {multipleImages.length > 0 && (
              <div className="flex justify-center gap-4 mb-8">
                {multipleImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-green-500">
                      <img src={img} alt={`Pet ${idx + 1}`} className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{idx + 1}</span>
                    </div>
                  </div>
                ))}
                {/* Placeholder for next image */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <span className="text-3xl text-gray-400">+</span>
                </div>
              </div>
            )}
            
            {/* Upload area for next image */}
            <div
              className={`
                relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                min-h-[300px]
                ${dragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop pet photo #{currentImageIndex + 1} here
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  or click to browse
                </p>
              </div>
            </div>
            
            {/* Cancel button */}
            <div className="flex justify-center mt-6">
              <button onClick={resetUpload} className="btn btn-secondary">
                Cancel and Start Over
              </button>
            </div>
          </div>
        </div>
      ) : preview ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Preview container - Desktop Enhanced */}
          <div className="card-elevated rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Image Preview */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-700">
                <img 
                  src={preview} 
                  alt="Your pet" 
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                
                {/* Upload overlay - Enhanced for Desktop */}
                {uploading && (
                  <div className="absolute inset-0 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
                    {/* Large Progress Ring */}
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="56" 
                          stroke="rgba(255,255,255,0.2)" 
                          strokeWidth="8" 
                          fill="none"
                        />
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="56" 
                          stroke="url(#gradient)" 
                          strokeWidth="8" 
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - uploadProgress / 100)}`}
                          className="transition-all duration-300"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl animate-pulse">✨</span>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <p className="text-white font-semibold text-xl">
                        Creating your jewelry preview...
                      </p>
                      <p className="text-white/80 text-lg">
                        {uploadProgress}% complete
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Success overlay */}
                {success && !uploading && (
                  <div className="absolute inset-0 backdrop-blur-md bg-green-600/30 flex items-center justify-center animate-fadeIn">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                        <span className="text-white text-5xl">✓</span>
                      </div>
                      <p className="text-white font-semibold text-xl">Upload Complete!</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Upload Details */}
              <div className="flex flex-col justify-center">
                <h3 className="text-heading font-bold text-gray-900 dark:text-white mb-4">
                  {pendantType && getRequiredImages(pendantType) > 1 
                    ? `Pet ${currentImageIndex + 1} of ${getRequiredImages(pendantType)}`
                    : 'Image Ready for Processing'}
                </h3>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-8">
                  {pendantType && getRequiredImages(pendantType) > 1
                    ? 'Add a name for this pet (optional)'
                    : 'Your pet photo has been successfully uploaded. Our AI will now create beautiful engraving designs for your memorial jewelry.'}
                </p>
                
                {/* Pet Name Input for multi-pet pendants */}
                {pendantType && getRequiredImages(pendantType) > 1 && !uploading && !success && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pet Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentPetName}
                      onChange={(e) => setCurrentPetName(e.target.value)}
                      placeholder={`Pet ${currentImageIndex + 1}`}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This name will appear on the pendant
                    </p>
                  </div>
                )}
                
                {/* File Info */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Ready</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Format</span>
                    <span className="font-medium text-gray-900 dark:text-white">High Quality</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Processing</span>
                    <span className="font-medium text-gray-900 dark:text-white">AI Enhanced</span>
                  </div>
                </div>
                
                {/* Action buttons - Desktop Enhanced */}
                {!uploading && !success && (
                  <div className="flex gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        resetUpload()
                      }}
                      className="btn btn-secondary flex-1"
                      disabled={uploading}
                    >
                      {pendantType && getRequiredImages(pendantType) > 1 ? 'Cancel' : 'Remove'}
                    </button>
                    {pendantType && getRequiredImages(pendantType) > 1 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSavePetNameAndContinue()
                        }}
                        className="btn btn-primary flex-1"
                        disabled={uploading}
                      >
                        {multipleImages.length < getRequiredImages(pendantType) - 1 ? 'Continue' : 'Finish & Upload'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClick()
                          }}
                          className="btn btn-secondary flex-1"
                          disabled={uploading}
                        >
                          Change Photo
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            uploadSingleImageHandler(preview)
                          }}
                          className="btn btn-primary flex-1"
                          disabled={uploading}
                        >
                          Process Image
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !pendantType ? (
        <div
          className={`
            relative overflow-hidden rounded-3xl border-3 border-dashed transition-all duration-500 cursor-pointer group
            min-h-[500px] lg:min-h-[600px]
            ${dragActive 
              ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 scale-[1.02] shadow-2xl' 
              : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 hover:border-indigo-400 hover:shadow-xl'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Upload pet photo"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-black/20 dark:to-transparent" />
          
          <div className="relative h-full flex flex-col items-center justify-center p-12">
            {/* Upload Animation - Desktop */}
            <div className="mb-8">
              {dragActive ? (
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping"></div>
                  <div className="relative w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-6xl text-white">📸</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Decorative Elements */}
                  <div className="absolute -top-8 -left-8 text-5xl opacity-60 animate-float">🐕</div>
                  <div className="absolute -top-8 -right-8 text-5xl opacity-60 animate-float animation-delay-400">🐈</div>
                  <div className="absolute -bottom-8 -left-8 text-5xl opacity-60 animate-float animation-delay-800">🐰</div>
                  <div className="absolute -bottom-8 -right-8 text-5xl opacity-60 animate-float animation-delay-200">🦜</div>
                  
                  {/* Central Upload Icon */}
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-16 h-16 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* Upload Text - Desktop Typography */}
            <h3 className="text-display font-bold text-gray-900 dark:text-white mb-4 text-center">
              {dragActive ? 'Drop Your Photo Here' : 'Upload Your Pet\'s Best Photo'}
            </h3>
            
            <p className="text-body-lg text-gray-600 dark:text-gray-400 mb-2 text-center">
              Drag & drop your image here, or click to browse
            </p>
            
            <p className="text-body text-gray-500 dark:text-gray-500 mb-8 text-center">
              {SUPPORTED_FORMATS} • Max {(maxSize / (1024 * 1024)).toFixed(0)}MB • High Resolution Recommended
            </p>
            
            {/* Upload Button - Desktop Enhanced */}
            <button 
              className="btn btn-primary btn-lg group"
              disabled={uploading}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Photo from Computer
            </button>

            {/* Features Grid - Desktop */}
            <div className="mt-12 grid grid-cols-3 gap-8 w-full max-w-2xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">AI Powered</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Smart detection</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Secure Upload</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Privacy first</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Fast Process</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Instant results</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={handleFileChange}
        disabled={uploading}
        className="sr-only"
        aria-label="File input"
      />
      
      {/* Error message - Desktop Enhanced */}
      {error && (
        <div className="mt-6 card border-red-500/20 bg-red-50/90 dark:bg-red-900/20 rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xl">!</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">Upload Error</h4>
              <p className="text-red-700 dark:text-red-300 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}