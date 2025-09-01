import mongoose from 'mongoose';

const PetEngravingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  originalImageUrl: {
    type: String,
    required: true
  },
  engravingImageUrl: {
    type: String,
    required: true
  },
  engravingStyle: {
    type: String,
    enum: ['standard', 'bold', 'detailed', 'artistic', 'sketch'],
    default: 'standard'
  },
  processingMethod: {
    type: String,
    default: 'python-engraving-filter'
  }
});

const ShopifyOrderSchema = new mongoose.Schema({
  // Shopify Order Information
  shopifyOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shopifyOrderNumber: {
    type: String,
    index: true
  },
  shopifyCustomerId: {
    type: String,
    index: true
  },
  
  // Customer Information
  customerEmail: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String
  },
  
  // Product Information
  pendantType: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad'],
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  variantId: {
    type: String,
    required: true
  },
  productTitle: String,
  variantTitle: String,
  quantity: {
    type: Number,
    default: 1
  },
  price: {
    type: String // Store as string to preserve exact Shopify format
  },
  
  // Pet Engraving Data
  pets: [PetEngravingSchema],
  
  // Composite/Preview Images
  pendantPreviewUrl: String, // Final pendant composite image
  
  // Processing Information
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  processingCompletedAt: {
    type: Date,
    required: true
  },
  
  // Order Status
  orderStatus: {
    type: String,
    enum: ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled'],
    default: 'unfulfilled'
  },
  
  // Financial Information
  totalPrice: String,
  subtotalPrice: String,
  totalTax: String,
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Timestamps
  shopifyCreatedAt: Date,
  shopifyUpdatedAt: Date,
  
  // Additional Metadata
  metadata: {
    shopifyDomain: String,
    tags: [String],
    note: String,
    customAttributes: [{
      key: String,
      value: String
    }]
  },
  
  // Internal tracking
  internalNotes: [{
    note: String,
    createdBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quality Control
  qualityCheck: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: String,
    approvedAt: Date,
    notes: String
  }
}, {
  timestamps: true,
  collection: 'shopify_orders'
});

// Indexes for performance
ShopifyOrderSchema.index({ customerEmail: 1, createdAt: -1 });
ShopifyOrderSchema.index({ pendantType: 1, orderStatus: 1 });
ShopifyOrderSchema.index({ 'qualityCheck.approved': 1, orderStatus: 1 });
ShopifyOrderSchema.index({ createdAt: -1 });

// Virtual for order display name
ShopifyOrderSchema.virtual('displayName').get(function() {
  const petNames = this.pets.map(pet => pet.name).join(', ');
  return `${this.pendantType} pendant for ${petNames}`;
});

// Method to add internal note
ShopifyOrderSchema.methods.addNote = function(note, createdBy) {
  this.internalNotes.push({
    note,
    createdBy,
    createdAt: new Date()
  });
  return this.save();
};

// Method to approve quality check
ShopifyOrderSchema.methods.approveQuality = function(approvedBy, notes = '') {
  this.qualityCheck = {
    approved: true,
    approvedBy,
    approvedAt: new Date(),
    notes
  };
  return this.save();
};

// Static method to find orders by customer
ShopifyOrderSchema.statics.findByCustomer = function(customerEmail) {
  return this.find({ customerEmail })
             .sort({ createdAt: -1 })
             .populate('pets');
};

// Static method to find pending orders
ShopifyOrderSchema.statics.findPendingOrders = function() {
  return this.find({ 
    orderStatus: 'paid',
    fulfillmentStatus: 'unfulfilled'
  }).sort({ createdAt: 1 });
};

// Static method to find orders requiring quality check
ShopifyOrderSchema.statics.findForQualityCheck = function() {
  return this.find({
    orderStatus: 'paid',
    'qualityCheck.approved': false
  }).sort({ createdAt: 1 });
};

export default mongoose.models.ShopifyOrder || mongoose.model('ShopifyOrder', ShopifyOrderSchema);