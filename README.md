# 🎨 PupRing AI Frontend

## Pet Memorial Engraving System - Frontend Application

A Next.js frontend application for processing pet photos into professional engravings, integrated with Railway Python services and Shopify e-commerce.

---

## 🚀 Quick Start

### Local Development

```bash
# Clone/navigate to this directory
cd pupring-frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Visit: http://localhost:3000
```

### Production Deployment (Vercel)

```bash
# Build and test locally
npm run build
npm start

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

---

## 📋 Features

### 🐾 Core Functionality
- **Pet Photo Upload** - Drag & drop interface with validation
- **AI Processing** - Background removal and face detection
- **Professional Engraving** - Multiple style options via Railway Python services
- **Pendant Previews** - Composite generation for different pendant types
- **Admin Dashboard** - Client management and order tracking

### 🛍️ E-commerce Integration
- **Shopify Integration** - Complete e-commerce workflow
- **Order Management** - MongoDB-based order tracking
- **Custom Attributes** - Pet data storage with Shopify orders
- **Webhook Handling** - Automatic order processing

### ⚡ Performance Features
- **Vercel Optimized** - Edge functions and CDN
- **Railway Integration** - Dedicated AI processing backend
- **Image Optimization** - WebP/AVIF support with Cloudinary
- **Responsive Design** - Mobile-first Tailwind CSS

---

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **Tailwind CSS** - Utility-first CSS framework
- **Vercel** - Deployment and hosting platform

### Backend Integration
- **Railway Python Services** - AI processing microservices
- **MongoDB Atlas** - Database for orders and client data
- **Cloudinary** - Image storage and CDN
- **Shopify Storefront API** - E-commerce integration

### API Integration
```
Frontend (Vercel) ←→ Railway (Python AI) ←→ External APIs
     ↓                      ↓                    ↓
  MongoDB            Cloudinary              Roboflow
  Shopify                                   RemoveBG
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file with these required variables:

```bash
# Database
MONGODB_URI=mongodb+srv://...

# Authentication  
JWT_SECRET=your-secure-jwt-secret

# Image Processing
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Railway Python Services
PYTHON_SERVICE_URL=https://your-project-production.up.railway.app
PYTHON_API_URL=https://your-project-production.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://your-project-production.up.railway.app

# Shopify (optional)
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

### API Keys Setup

1. **MongoDB Atlas**: [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Cloudinary**: [cloudinary.com](https://cloudinary.com)
3. **Roboflow**: [roboflow.com](https://roboflow.com)
4. **Railway**: Deploy Python services first
5. **Shopify**: Admin → Apps → Private Apps

---

## 🐳 Deployment

### Deploy to Vercel (Recommended)

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Method 2: GitHub Integration
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial frontend deployment"
git remote add origin https://github.com/USERNAME/pupring-frontend.git
git push -u origin main

# Connect to Vercel via GitHub
# 1. Go to vercel.com
# 2. Import from GitHub
# 3. Add environment variables
# 4. Deploy
```

### Environment Variables in Vercel

1. **Vercel Dashboard → Project → Settings → Environment Variables**
2. **Add all variables from `.env.example`**
3. **Set environment to "Production"**
4. **Redeploy after adding variables**

### Domain Configuration

1. **Vercel Dashboard → Domains**
2. **Add custom domain** (optional)
3. **Configure DNS**: CNAME to `cname.vercel-dns.com`
4. **SSL automatically configured**

---

## 🧪 Testing

### Local Testing

```bash
# Run development server
npm run dev

# Test main features:
# ✅ Image upload works
# ✅ Processing integrates with Railway
# ✅ Admin dashboard accessible
# ✅ API endpoints respond

# Test API endpoints
curl http://localhost:3000/api/health
```

### Production Testing

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test Railway integration
# Upload an image through the UI
# Verify processing works end-to-end

# Admin dashboard
https://your-app.vercel.app/admin/login
```

---

## 🔗 API Endpoints

### Core APIs
- `GET /api/health` - Application health check
- `POST /api/upload` - Main image upload and processing
- `POST /api/process-image` - Image processing endpoint
- `GET /api/clients` - Client management (admin)

### Shopify Integration
- `POST /api/shopify/process` - Process images from Shopify
- `POST /api/shopify/webhooks/orders/created` - Order webhook handler
- `GET /shopify-return` - Customer return page from Shopify

### Admin APIs
- `POST /api/auth/login` - Admin authentication
- `GET /api/auth/verify` - Token verification
- `POST /api/clients` - Create client record

---

## 🐍 Railway Python Integration

### Configuration

The frontend integrates with Railway-deployed Python services via:

- **`lib/railway-config.js`** - Integration configuration
- **Environment variables** - Service URLs and settings
- **API rewrites** - Proxy requests to Railway
- **Error handling** - Retry logic and fallbacks

### Railway Service URLs

```bash
# Health check Railway service
https://your-railway-project-production.up.railway.app/health

# Available endpoints on Railway:
/remove-background    # AI background removal
/vectorize           # Image vectorization
/professional-engraving  # Professional pet engraving
```

### Integration Testing

```javascript
// Test Railway integration
import { checkRailwayHealth } from './lib/railway-config.js';

const health = await checkRailwayHealth();
console.log('Railway service health:', health);
```

---

## 🛍️ Shopify Integration

### Setup Requirements

1. **Shopify Store** - Active Shopify store
2. **Private App** - Created in Shopify Admin
3. **Storefront API** - Enabled with proper permissions
4. **Products** - Pet pendant products with metafields
5. **Webhooks** - Order creation webhook configured

### Integration Flow

```
Shopify Product Page → Upload Widget → Next.js Processing → Railway AI → Results Display → Return to Shopify → Checkout
```

### Shopify Widget

Install in your Shopify theme:
```liquid
<!-- In product template -->
{% render 'product-pet-uploader' %}
```

Widget automatically:
- ✅ Captures pet photos
- ✅ Redirects to Next.js for processing
- ✅ Returns with engraved results
- ✅ Adds to cart with custom attributes

---

## 📊 Monitoring

### Vercel Analytics

1. **Enable in Vercel Dashboard**
2. **Monitor function performance**
3. **Track user interactions**
4. **Review error logs**

### Health Monitoring

```bash
# Automated health checks
curl https://your-app.vercel.app/api/health
curl https://your-railway-service.up.railway.app/health
```

### Error Tracking

```javascript
// Built-in error logging
console.error('API Error:', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
  endpoint: request.url
});
```

---

## 🔧 Development

### Project Structure

```
pupring-frontend/
├── src/
│   ├── app/
│   │   ├── layout.js              # App layout
│   │   ├── page.js                # Home page  
│   │   ├── api/                   # API routes
│   │   │   ├── upload/            # Main upload endpoint
│   │   │   ├── process-image/     # Image processing
│   │   │   ├── health/            # Health check
│   │   │   ├── auth/              # Authentication
│   │   │   ├── clients/           # Client management
│   │   │   └── shopify/           # Shopify integration
│   │   ├── admin/                 # Admin dashboard
│   │   ├── shopify-return/        # Shopify return page
│   │   └── components/            # UI components
│   │       ├── ImageUpload.jsx    # Upload interface
│   │       ├── ProcessingDashboard.jsx # Results display
│   │       └── LoadingStates.jsx  # Loading animations
│   ├── lib/                       # Utility libraries
│   │   ├── railway-config.js      # Railway integration
│   │   ├── mongodb.js             # Database connection
│   │   ├── cloudinaryUpload.js    # Image uploading
│   │   └── shopify.js             # Shopify API
│   └── models/                    # MongoDB schemas
│       ├── Client.js              # Client model
│       └── ShopifyOrder.js        # Order model
├── public/                        # Static assets
├── .env.example                   # Environment template
├── package.json                   # Dependencies
├── next.config.mjs               # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
└── vercel.json                   # Vercel deployment settings
```

### Adding New Features

1. **Create components** in `src/app/components/`
2. **Add API routes** in `src/app/api/`
3. **Update models** in `src/models/` if needed
4. **Test locally** with `npm run dev`
5. **Deploy** with `vercel --prod`

### Database Schema

```javascript
// Client Model
{
  clientId: String,
  petName: String,
  originalImageUrl: String,
  processedImageUrl: String,
  processingSteps: Array,
  createdAt: Date
}

// Shopify Order Model
{
  shopifyOrderId: String,
  customerEmail: String,
  pendantType: String,
  pets: [{
    name: String,
    originalImageUrl: String,
    engravingImageUrl: String
  }],
  orderStatus: String
}
```

---

## 🚨 Troubleshooting

### Common Issues

**Environment Variables Not Working:**
- Verify all variables are set in Vercel dashboard
- Ensure "Production" environment selected
- Redeploy after adding variables

**Railway Integration Failing:**
```bash
# Test Railway service directly
curl https://your-railway-service.up.railway.app/health

# Check environment variables
echo $PYTHON_SERVICE_URL
```

**Build Failures:**
```bash
# Test build locally
npm run build

# Check for dependency issues
npm ci
rm -rf .next && npm run build
```

**API Timeouts:**
- Check Vercel function logs
- Verify Railway service is responding
- Increase timeout in `vercel.json`

### Performance Issues

**Slow Image Processing:**
- Verify Railway service has adequate resources
- Check Cloudinary optimization settings
- Monitor Vercel function execution time

**Large Bundle Size:**
```bash
# Analyze bundle
ANALYZE=true npm run build

# Optimize imports
import { specific } from 'library'
// Instead of: import * as all from 'library'
```

---

## 📞 Support

### Documentation
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

### Monitoring URLs
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Railway Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)
- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)

### Debug Commands
```bash
# Check environment
npm run dev

# Test API endpoints
curl http://localhost:3000/api/health

# Build and analyze
npm run build
npm run analyze
```

---

## 🎉 You're Ready!

Your PupRing AI frontend is now:
- ✅ **Optimized for Vercel** deployment
- ✅ **Integrated with Railway** Python services  
- ✅ **Ready for Shopify** e-commerce
- ✅ **Production-ready** with monitoring
- ✅ **Scalable** and maintainable

### Next Steps:

1. **Deploy Python services** to Railway
2. **Deploy this frontend** to Vercel
3. **Update environment variables** with Railway URLs
4. **Test complete integration**
5. **Configure Shopify** when ready

**Happy deploying!** 🚀🐾