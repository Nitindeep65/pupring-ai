import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { uploadBase64ToCloudinary } from './cloudinaryUpload.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createPythonEngravingStyles(imageUrl) {
  console.log('🎨 Starting Python engraving filter...');
  console.log('Input image URL:', imageUrl);
  
  try {
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const timestamp = Date.now();
    const inputFile = path.join(tempDir, `input_${timestamp}.jpg`);
    // The script saves output in its own directory with _filtered suffix
    const scriptDir = path.join(__dirname, '../../filtre_gravure_simple');
    const outputFile = path.join(scriptDir, `input_${timestamp}_filtered.png`);
    
    // Handle base64 URLs
    let buffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      buffer = await response.arrayBuffer();
    }
    
    await fs.writeFile(inputFile, Buffer.from(buffer));
    
    const scriptPath = path.join(scriptDir, 'engraving_filter.py');
    
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${inputFile}"`, {
      cwd: scriptDir
    });
    
    if (stderr && !stderr.includes('SUCCESS')) {
      console.warn('Python script warnings:', stderr);
    }
    
    console.log('Python script output:', stdout);
    
    const outputExists = await fs.access(outputFile).then(() => true).catch(() => false);
    if (!outputExists) {
      console.error('Output file not found at:', outputFile);
      throw new Error('Engraving filter failed to generate output');
    }
    
    const engravingBuffer = await fs.readFile(outputFile);
    const base64 = engravingBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    // Upload to Cloudinary instead of returning base64
    console.log('📤 Uploading engraving to Cloudinary...');
    const uploadResult = await uploadBase64ToCloudinary(dataUrl, 'engraving');
    
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});
    
    if (uploadResult.success) {
      console.log('✅ Engraving uploaded to Cloudinary:', uploadResult.url);
      return {
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        method: 'python-engraving-filter'
      };
    } else {
      throw new Error('Failed to upload engraving to Cloudinary');
    }
    
  } catch (error) {
    console.error('Python engraving filter error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}