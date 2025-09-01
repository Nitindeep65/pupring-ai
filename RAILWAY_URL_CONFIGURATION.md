# 🔗 Railway URL Configuration for Frontend Environment

## 📍 Finding Your Railway Service URL

### Step 1: Get URL from Railway Dashboard

1. **Go to [Railway Dashboard](https://railway.app/dashboard)**
2. **Click on your project** (the one with Python services)
3. **Click on the "web" service** (your deployed Python app)
4. **Go to "Settings" tab**
5. **Under "Domains" section**, you'll see your URL

### Step 2: Railway URL Format

Your Railway URL will look like one of these formats:

```bash
# Format 1 (most common):
https://web-production-[random-hash].up.railway.app

# Format 2 (custom name):
https://[your-project-name]-production-[hash].up.railway.app

# Format 3 (simple):
https://[random-name]-production.up.railway.app
```

### Step 3: Examples of Railway URLs

```bash
# Example 1:
https://web-production-d2270.up.railway.app

# Example 2:  
https://pupring-python-production-a1b2c.up.railway.app

# Example 3:
https://acceptable-nature-production.up.railway.app
```

---

## 🔧 Environment Variable Configuration

### For Frontend (.env file)

Once you have your Railway URL, update your `.env` file:

```bash
# ===============================================
# RAILWAY PYTHON SERVICE INTEGRATION
# ===============================================

# Replace "YOUR_RAILWAY_URL" with your actual Railway URL from dashboard

# Main Python service URL
PYTHON_SERVICE_URL=https://YOUR_RAILWAY_URL.up.railway.app
PYTHON_API_URL=https://YOUR_RAILWAY_URL.up.railway.app

# Client-side Python service URL (for frontend API calls)
NEXT_PUBLIC_PYTHON_API_URL=https://YOUR_RAILWAY_URL.up.railway.app

# Advanced/Additional service URL
ADVANCED_SERVICE_URL=https://YOUR_RAILWAY_URL.up.railway.app
```

### Example Configuration (Replace with Your URL)

```bash
# If your Railway URL is: https://web-production-d2270.up.railway.app

PYTHON_SERVICE_URL=https://web-production-d2270.up.railway.app
PYTHON_API_URL=https://web-production-d2270.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://web-production-d2270.up.railway.app
ADVANCED_SERVICE_URL=https://web-production-d2270.up.railway.app
```

### Complete .env File Template

```bash
# ===============================================
# PUPRING AI FRONTEND - COMPLETE CONFIGURATION
# ===============================================

# MongoDB Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pupring?retryWrites=true&w=majority

# Admin Authentication (Required)
JWT_SECRET=your-super-secure-random-jwt-secret-change-this-in-production

# Cloudinary Image Processing & Storage (Required)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Pet Face Detection - Roboflow (Required)
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Background Removal Service (Optional)
REMOVE_BG_API_KEY=your_remove_bg_api_key

# ===============================================
# RAILWAY PYTHON SERVICES (REPLACE WITH YOUR URL)
# ===============================================

PYTHON_SERVICE_URL=https://YOUR_RAILWAY_URL.up.railway.app
PYTHON_API_URL=https://YOUR_RAILWAY_URL.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://YOUR_RAILWAY_URL.up.railway.app
ADVANCED_SERVICE_URL=https://YOUR_RAILWAY_URL.up.railway.app

# ===============================================
# SHOPIFY INTEGRATION (Configure when ready)
# ===============================================

NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SHOPIFY_SINGLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/123456789
NEXT_PUBLIC_SHOPIFY_DOUBLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/987654321
NEXT_PUBLIC_SHOPIFY_TRIPLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/456789123
NEXT_PUBLIC_SHOPIFY_QUAD_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/147258369

# ===============================================
# PRODUCTION SETTINGS
# ===============================================

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
VERCEL=1
VERCEL_ENV=production
```

---

## 🧪 Testing Your Railway URL

### Test Health Endpoint

```bash
# Replace with your actual Railway URL:
curl https://YOUR_RAILWAY_URL.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "PupRing AI Python Services",
  "version": "1.0.0-minimal",
  "timestamp": "2025-09-01T12:00:00.000Z"
}
```

### Test Service Endpoints

```bash
# List available services
curl https://YOUR_RAILWAY_URL.up.railway.app/services

# Test background processing
curl -X POST https://YOUR_RAILWAY_URL.up.railway.app/remove-background \
  -F "image=@test_image.jpg"

# Test engraving processing  
curl -X POST https://YOUR_RAILWAY_URL.up.railway.app/professional-engraving \
  -F "image=@test_image.jpg"
```

---

## 🎯 Next Steps for Frontend Deployment

### 1. Update Frontend Environment

```bash
cd pupring-frontend

# Copy your .env template
cp .env.example .env

# Edit .env with your values:
# - Add your Railway URL to all PYTHON_* variables
# - Add your MongoDB, Cloudinary, Roboflow keys
# - Save the file
```

### 2. Test Frontend Locally

```bash
# Install dependencies
npm install

# Test build
npm run build

# Test locally with Railway integration
npm run dev

# Visit: http://localhost:3000
# Try uploading an image to test Railway integration
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod

# Add environment variables in Vercel dashboard
# Deploy again: vercel --prod
```

---

## 🔗 Important URLs to Configure

### Railway Python Service URLs (All should be the same)
```bash
PYTHON_SERVICE_URL=https://YOUR_RAILWAY_URL.up.railway.app
PYTHON_API_URL=https://YOUR_RAILWAY_URL.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://YOUR_RAILWAY_URL.up.railway.app
ADVANCED_SERVICE_URL=https://YOUR_RAILWAY_URL.up.railway.app
```

### API Endpoints Available on Railway
```bash
# Health checks
GET  https://YOUR_RAILWAY_URL.up.railway.app/health
GET  https://YOUR_RAILWAY_URL.up.railway.app/services

# Processing endpoints
POST https://YOUR_RAILWAY_URL.up.railway.app/remove-background
POST https://YOUR_RAILWAY_URL.up.railway.app/professional-engraving
POST https://YOUR_RAILWAY_URL.up.railway.app/vectorize
```

---

## ✅ Quick Checklist

- [ ] **Railway Python service** is deployed and working
- [ ] **Railway URL** obtained from dashboard
- [ ] **Health endpoint tested** and responding
- [ ] **Ready to update frontend** environment variables
- [ ] **Ready to deploy frontend** to Vercel

---

## 🎉 Ready for Frontend Deployment!

**Please provide your Railway URL so I can help you:**
1. **Update the frontend environment** configuration
2. **Deploy to Vercel** with the correct Railway integration
3. **Test the complete system** end-to-end

**What's your Railway service URL from the dashboard?** 🚀