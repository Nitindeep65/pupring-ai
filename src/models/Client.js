import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true
  },
  clientName: {
    type: String,
    required: true
  },
  petName: {
    type: String,
    required: false
  },
  pendantType: {
    type: String,
    required: true,
    enum: ['single', 'double', 'triple', 'quarter', 'custom'],
    default: 'single'
  },
  // For single pendant - single image
  originalImage: {
    url: String,
    publicId: String
  },
  processedImage: {
    url: String,
    publicId: String
  },
  engravingImage: {
    url: String,
    publicId: String
  },
  locketPreview: {
    url: String,
    publicId: String
  },
  // For multiple pets (double/triple pendants) - array of pet images
  petImages: [{
    petName: String,
    originalImage: {
      url: String,
      publicId: String
    },
    processedImage: {
      url: String,
      publicId: String
    },
    engravingImage: {
      url: String,
      publicId: String
    }
  }],
  // Composite pendant preview (for double/triple pendants)
  compositePendantPreview: {
    url: String,
    publicId: String
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);