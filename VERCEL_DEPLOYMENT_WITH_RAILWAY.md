# 🚀 Frontend Deployment to Vercel with Railway Integration

## 🎯 Your Railway Service is Ready!

**Railway URL**: `https://web-production-d2270.up.railway.app`

---

# 📋 Step-by-Step Vercel Deployment

## Step 1: Test Railway Integration Locally

First, let's verify your Railway service is working:

```bash
# Test your Railway service health
curl https://web-production-d2270.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "PupRing AI Python Services",
  "version": "1.0.0-minimal"
}
```

## Step 2: Configure Frontend Environment

```bash
cd pupring-frontend

# Create environment file with your Railway URL
cp .env.example .env
```

**Edit `.env` with your actual values:**

```bash
# ===============================================
# PUPRING AI FRONTEND - PRODUCTION CONFIGURATION
# ===============================================

# MongoDB Database (REQUIRED - Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pupring?retryWrites=true&w=majority

# Admin Authentication (REQUIRED - Generate secure string)
JWT_SECRET=your-super-secure-random-jwt-secret-min-32-characters

# Cloudinary Image Storage (REQUIRED - Get from Cloudinary dashboard)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Pet Detection AI (REQUIRED - Get from Roboflow)
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Background Removal (OPTIONAL)
REMOVE_BG_API_KEY=your_remove_bg_key_if_you_have_one

# ===============================================
# RAILWAY PYTHON SERVICES (CONFIGURED FOR YOUR SERVICE)
# ===============================================

PYTHON_SERVICE_URL=https://web-production-d2270.up.railway.app
PYTHON_API_URL=https://web-production-d2270.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://web-production-d2270.up.railway.app
ADVANCED_SERVICE_URL=https://web-production-d2270.up.railway.app

# ===============================================
# SHOPIFY INTEGRATION (Configure when ready for e-commerce)
# ===============================================

# Shopify Store Configuration
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Product Variant IDs (Get from Shopify Admin when ready)
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

## Step 3: Test Local Frontend with Railway

```bash
# Install dependencies
npm install

# Test build locally
npm run build

# Start development server
npm run dev

# Test Railway integration:
# 1. Go to http://localhost:3000
# 2. Try uploading a pet image
# 3. Verify it communicates with Railway service
```

## Step 4: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# ✅ Set up and deploy? Yes
# ✅ Which scope? (Choose your account)
# ✅ Project name? pupring-frontend
# ✅ Directory? ./
```

### Option B: GitHub Integration

```bash
# Push to GitHub first
git init
git add .
git commit -m "Deploy PupRing frontend with Railway integration"
git remote add origin https://github.com/YOUR_USERNAME/pupring-frontend.git
git branch -M main
git push -u origin main

# Then connect to Vercel:
# 1. Go to vercel.com
# 2. Sign up/login with GitHub
# 3. New Project → Import pupring-frontend
# 4. Deploy
```

## Step 5: Configure Environment Variables in Vercel

### Add Variables in Vercel Dashboard

1. **Go to Vercel Dashboard** → Your project
2. **Settings** → **Environment Variables**
3. **Add each variable** (set to "Production, Preview, Development"):

**Critical Variables to Add:**

```bash
# Database (REQUIRED)
MONGODB_URI=mongodb+srv://...

# Authentication (REQUIRED)
JWT_SECRET=your-secure-jwt-secret

# Cloudinary (REQUIRED)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Roboflow (REQUIRED)
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Railway Integration (CONFIGURED)
PYTHON_SERVICE_URL=https://web-production-d2270.up.railway.app
PYTHON_API_URL=https://web-production-d2270.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://web-production-d2270.up.railway.app

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Trigger Redeploy

After adding environment variables:
```bash
vercel --prod
```

## Step 6: Test Deployed Frontend

### Test Basic Functionality

```bash
# Test health endpoint
curl https://your-app-name.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-09-01T00:00:00.000Z"
}
```

### Test Railway Integration

```bash
# Test Railway proxy endpoint
curl https://your-app-name.vercel.app/api/python/health

# Should proxy to your Railway service and return Railway health data
```

### Test Complete Flow

1. **Visit your Vercel URL**: `https://your-app-name.vercel.app`
2. **Upload a pet image**
3. **Verify processing works** (should communicate with Railway)
4. **Check results display**

---

## ✅ Integration Testing Commands

### Test Railway Service Directly
```bash
curl https://web-production-d2270.up.railway.app/health
curl https://web-production-d2270.up.railway.app/services
```

### Test Frontend Health
```bash
curl https://your-vercel-app.vercel.app/api/health
```

### Test Integration
```bash
# This should proxy from frontend to Railway
curl https://your-vercel-app.vercel.app/api/python/health
```

---

## 🎉 Your URLs After Deployment

- **Railway Python Service**: `https://web-production-d2270.up.railway.app`
- **Vercel Frontend**: `https://your-app-name.vercel.app` (you'll get this after deployment)
- **Admin Dashboard**: `https://your-app-name.vercel.app/admin/login`

---

## 🚨 Quick Troubleshooting

### If Railway Integration Fails

```bash
# Test Railway directly first
curl https://web-production-d2270.up.railway.app/health

# If Railway works but frontend integration doesn't:
# 1. Check environment variables in Vercel
# 2. Verify PYTHON_SERVICE_URL is correct
# 3. Check Vercel function logs
```

### If Frontend Build Fails

```bash
# Test build locally first
npm run build

# Common fixes:
npm ci                    # Clean install
rm -rf .next             # Clear Next.js cache
npm run build            # Try again
```

---

## 🎯 Ready to Deploy!

**Your Railway service is working at**: `https://web-production-d2270.up.railway.app`

**Now run these commands to deploy your frontend:**

```bash
cd pupring-frontend

# 1. Update environment (already configured above)
cp .env.example .env
# Edit .env with your API keys

# 2. Test locally
npm install
npm run build

# 3. Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod

# 4. Add environment variables in Vercel dashboard
# 5. Redeploy: vercel --prod
```

**Follow the steps in this guide and your complete system will be live!** 🚀