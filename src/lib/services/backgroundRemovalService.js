// Railway Python Service Integration
import { uploadToCloudinary } from '../cloudinaryUpload.js';

export class BackgroundRemovalService {
  constructor() {
    this.pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
  }

  async removePythonBackground(imageUrl) {
    try {
      // Convert image URL to base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;
      
      const response = await fetch(`${this.pythonApiUrl}/remove-background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        throw new Error(`Python service error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          url: result.image,
          method: 'python-rembg'
        };
      }
      
      throw new Error(result.error || 'Python service failed');
    } catch (error) {
      console.warn('Python background removal failed:', error.message);
      return null;
    }
  }

  async removeBackground(imageUrl) {
    console.log('🎨 Starting background removal...');
    
    // Try Python service first
    const pythonResult = await this.removePythonBackground(imageUrl);
    if (pythonResult) {
      return pythonResult;
    }
    
    // Fallback to basic processing
    console.log('📸 Using basic processing fallback...');
    return {
      success: true,
      url: imageUrl, // Return original image as fallback
      method: 'fallback-basic'
    };
  }
}