import axios from 'axios'
import { uploadToCloudinary } from './cloudinaryUpload.js'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001'
const ADVANCED_SERVICE_URL = process.env.ADVANCED_SERVICE_URL || 'http://localhost:5002'

async function checkPythonService() {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 2000 })
    return response.data.status === 'healthy'
  } catch (error) {
    console.log('⚠️ Python service not available:', error.message)
    return false
  }
}

async function imageUrlToBase64(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const base64 = Buffer.from(response.data, 'binary').toString('base64')
    const mimeType = response.headers['content-type'] || 'image/jpeg'
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error converting image URL to base64:', error)
    throw error
  }
}

export async function createPythonVectorizedEngravings(imageUrl) {
  console.log('🐍 Creating Python vectorized engravings...')
  
  try {
    // Use vectorization service on port 5001
    const serviceUrl = PYTHON_SERVICE_URL;
    const endpoint = '/vectorize';
    
    // Check if service is available
    const isAvailable = await checkPythonService();
    
    if (!isAvailable) {
      console.log('⚠️ Python vectorization service not available')
      return { success: false, error: 'Python service not available' }
    }
    
    console.log(`📡 Using service at ${serviceUrl}`)
    
    // Convert image URL to base64
    const imageBase64 = await imageUrlToBase64(imageUrl)
    
    // Call Python service
    const response = await axios.post(
      `${serviceUrl}${endpoint}`,
      {
        image: imageBase64,
        style: endpoint === '/vectorize-pet' ? undefined : 'all'
      },
      {
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      }
    )
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Vectorization failed')
    }
    
    const styles = {}
    const uploadPromises = []
    
    // Handle response based on service type
    const images = response.data.styles || response.data.images || {}
    
    // Upload each style to Cloudinary
    for (const [styleName, imageData] of Object.entries(images)) {
      uploadPromises.push(
        uploadStyleToCloudinary(styleName, imageData).then(url => {
          if (url) styles[styleName] = url
        })
      )
    }
    
    // Upload isolated face if available
    if (response.data.isolated_face) {
      uploadPromises.push(
        uploadStyleToCloudinary('isolated', response.data.isolated_face).then(url => {
          if (url) styles.isolated = url
        })
      )
    }
    
    // Upload SVG if available
    if (response.data.svg) {
      uploadPromises.push(
        uploadSvgToCloudinary(response.data.svg).then(url => {
          if (url) styles.svg = url
        })
      )
    }
    
    await Promise.all(uploadPromises)
    
    console.log('✅ Python vectorization complete, styles created:', Object.keys(styles))
    
    return {
      success: true,
      styles,
      method: endpoint === '/vectorize-pet' ? 'python-advanced' : 'python-simple',
      recommendation: 'professional'
    }
    
  } catch (error) {
    console.error('❌ Python vectorization error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function processPetWithPython(imageUrl) {
  console.log('🐕 Processing pet image with Python OpenCV...')
  
  try {
    const isServiceAvailable = await checkPythonService()
    if (!isServiceAvailable) {
      return { success: false, error: 'Python service not available' }
    }
    
    const imageBase64 = await imageUrlToBase64(imageUrl)
    
    // Call specialized pet processing endpoint
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/process-pet`,
      { image: imageBase64 },
      {
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      }
    )
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Pet processing failed')
    }
    
    const styles = {}
    const uploadPromises = []
    
    // Upload each style
    for (const [styleName, imageData] of Object.entries(response.data.styles)) {
      uploadPromises.push(
        uploadStyleToCloudinary(`pet_${styleName}`, imageData).then(url => {
          if (url) styles[styleName] = url
        })
      )
    }
    
    // Upload SVG
    if (response.data.svg) {
      uploadPromises.push(
        uploadSvgToCloudinary(response.data.svg, 'pet').then(url => {
          if (url) styles.svg = url
        })
      )
    }
    
    await Promise.all(uploadPromises)
    
    return {
      success: true,
      styles,
      faceDetected: response.data.face_detected,
      faceCoordinates: response.data.face_coordinates,
      method: 'python-opencv-pet'
    }
    
  } catch (error) {
    console.error('❌ Python pet processing error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

async function uploadStyleToCloudinary(styleName, base64Image) {
  try {
    // Remove data URL prefix
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    const result = await uploadToCloudinary(buffer, {
      folder: 'python-vectorized',
      public_id: `${styleName}_${Date.now()}`
    })
    
    return result.success ? result.url : null
  } catch (error) {
    console.error(`Error uploading ${styleName} style:`, error)
    return null
  }
}

async function uploadSvgToCloudinary(svgString, prefix = 'vector') {
  try {
    const buffer = Buffer.from(svgString, 'utf-8')
    
    const result = await uploadToCloudinary(buffer, {
      format: 'svg',
      folder: 'python-svg',
      public_id: `${prefix}_${Date.now()}`
    })
    
    return result.success ? result.url : null
  } catch (error) {
    console.error('Error uploading SVG:', error)
    return null
  }
}

export async function createAdvancedEngravingWithPython(imageUrl, options = {}) {
  console.log('🎨 Creating advanced engraving with Python...')
  
  const {
    style = 'canny',
    includeSvg = true,
    processAsPet = false
  } = options
  
  try {
    if (processAsPet) {
      return await processPetWithPython(imageUrl)
    }
    
    const isServiceAvailable = await checkPythonService()
    if (!isServiceAvailable) {
      return { success: false, error: 'Python service not available' }
    }
    
    const imageBase64 = await imageUrlToBase64(imageUrl)
    
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/vectorize`,
      {
        image: imageBase64,
        style: style
      },
      {
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      }
    )
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Vectorization failed')
    }
    
    const result = {
      success: true,
      style: style,
      method: 'python-opencv'
    }
    
    // Upload the resulting image
    if (response.data.images && response.data.images[style]) {
      const uploadResult = await uploadStyleToCloudinary(style, response.data.images[style])
      if (uploadResult) {
        result.imageUrl = uploadResult
      }
    }
    
    // Upload SVG if requested
    if (includeSvg && response.data.svg) {
      const svgUrl = await uploadSvgToCloudinary(response.data.svg, style)
      if (svgUrl) {
        result.svgUrl = svgUrl
      }
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Advanced engraving error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}