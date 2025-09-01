// Download utility for images
export const downloadImage = async (imageUrl, filename) => {
  try {
    console.log('🔽 Downloading image:', imageUrl);
    
    // Check if it's a Cloudinary URL and add download transformation
    let downloadUrl = imageUrl;
    if (imageUrl.includes('cloudinary.com')) {
      // Add fl_attachment flag to force download
      const urlParts = imageUrl.split('/upload/');
      if (urlParts.length === 2) {
        downloadUrl = urlParts[0] + '/upload/fl_attachment/' + urlParts[1];
      }
    }
    
    // Try fetch with CORS mode
    const response = await fetch(downloadUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'pet-jewelry-engraving.jpg';
    link.style.display = 'none';
    
    // Add to DOM temporarily and click
    document.body.appendChild(link);
    link.click();
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    console.log('✅ Download completed:', filename);
    return true;
  } catch (error) {
    console.error('❌ Download failed:', error);
    console.log('🔄 Trying direct download fallback...');
    
    // Fallback to direct link method
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || 'pet-jewelry-engraving.jpg';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      console.log('✅ Fallback download initiated');
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback download failed, opening in new tab');
      // Last resort: open in new tab
      window.open(imageUrl, '_blank');
      return false;
    }
  }
};
