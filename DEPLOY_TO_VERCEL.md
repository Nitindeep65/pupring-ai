# 🚀 Deploy PupRing Frontend to Vercel

## Your Configuration
- **Railway Python Service**: `https://web-production-d2270.up.railway.app` ✅
- **Frontend Build**: Successful ✅
- **Ready for Vercel Deployment**: ✅

---

# 📋 Complete Vercel Deployment Steps

## Step 1: Final Environment Configuration

```bash
cd pupring-frontend

# Create your production .env file
cp .env.example .env
```

**Edit `.env` with your actual API keys:**

```bash
# ===============================================
# PRODUCTION ENVIRONMENT VARIABLES
# ===============================================

# MongoDB Database (REQUIRED - Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/pupring?retryWrites=true&w=majority

# Admin Authentication (REQUIRED - Generate secure 32+ character string)
JWT_SECRET=your-super-secure-random-jwt-secret-change-this-min-32-characters

# Cloudinary Image Storage (REQUIRED - Get from Cloudinary dashboard)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret

# Pet Detection (REQUIRED - Get from Roboflow)
ROBOFLOW_API_KEY=your_actual_roboflow_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Railway Python Services (CONFIGURED)
PYTHON_SERVICE_URL=https://web-production-d2270.up.railway.app
PYTHON_API_URL=https://web-production-d2270.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://web-production-d2270.up.railway.app
ADVANCED_SERVICE_URL=https://web-production-d2270.up.railway.app

# Background Removal (OPTIONAL)
REMOVE_BG_API_KEY=your_remove_bg_key_if_you_have_one

# Shopify Integration (Configure later when ready)
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_token_when_ready
SHOPIFY_WEBHOOK_SECRET=your_secret_when_ready
NEXT_PUBLIC_SHOPIFY_SINGLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/123456789
NEXT_PUBLIC_SHOPIFY_DOUBLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/987654321
NEXT_PUBLIC_SHOPIFY_TRIPLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/456789123
NEXT_PUBLIC_SHOPIFY_QUAD_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/147258369

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Step 2: Test Railway Integration Locally

```bash
# Test your Railway service
curl https://web-production-d2270.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "service": "PupRing AI Python Services"
}

# Test local frontend with Railway
npm run dev
# Visit http://localhost:3000 and try uploading an image
```

## Step 3: Deploy to Vercel

### Install Vercel CLI

```bash
# Install globally
npm install -g vercel

# Login to your Vercel account
vercel login
```

### Deploy Your Frontend

```bash
cd pupring-frontend

# Deploy to production
vercel --prod

# Follow the prompts:
# ✅ Set up and deploy? Y
# ✅ Which scope? (Choose your account)
# ✅ Link to existing project? N (first time)
# ✅ What's your project's name? pupring-frontend
# ✅ In which directory is your code located? ./
```

**Vercel will give you a URL like:** `https://pupring-frontend-xxx.vercel.app`

## Step 4: Add Environment Variables in Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click your project** (pupring-frontend)
3. **Settings** → **Environment Variables**
4. **Add ALL variables from your `.env` file**

### Critical Variables to Add:

**Database & Auth:**
```
MONGODB_URI = mongodb+srv://...
JWT_SECRET = your-secure-jwt-secret
```

**Image Processing:**
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

**AI Services:**
```
ROBOFLOW_API_KEY = your_roboflow_key
ROBOFLOW_MODEL_ENDPOINT = https://detect.roboflow.com/pet-face-detection/2
```

**Railway Integration (CONFIGURED):**
```
PYTHON_SERVICE_URL = https://web-production-d2270.up.railway.app
PYTHON_API_URL = https://web-production-d2270.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL = https://web-production-d2270.up.railway.app
```

**Production Settings:**
```
NODE_ENV = production
NEXT_TELEMETRY_DISABLED = 1
```

**Important:** Set environment to **"Production, Preview, and Development"** for each variable

## Step 5: Redeploy with Environment Variables

```bash
# After adding environment variables, redeploy:
vercel --prod
```

## Step 6: Test Your Deployed Frontend

### Test Basic Functionality

```bash
# Replace with your actual Vercel URL
curl https://your-app-name.vercel.app/api/health

# Expected response:
{
  "status": "healthy", 
  "timestamp": "2025-09-01T00:00:00.000Z"
}
```

### Test Railway Integration

```bash
# Test Railway proxy through frontend
curl https://your-app-name.vercel.app/api/python/health

# Should return Railway service health data
```

### Test Complete Application

1. **Visit**: `https://your-app-name.vercel.app`
2. **Upload a pet image**
3. **Verify processing works** (should communicate with Railway)
4. **Check results display**
5. **Test admin dashboard**: `https://your-app-name.vercel.app/admin/login`

---

## ✅ Deployment Success Checklist

- [ ] **Vercel CLI installed and logged in**
- [ ] **Frontend deployed**: `vercel --prod`
- [ ] **Environment variables added** in Vercel dashboard
- [ ] **Redeployed** after adding variables
- [ ] **Health endpoint working**
- [ ] **Railway integration working**
- [ ] **Image upload and processing working**
- [ ] **Admin dashboard accessible**

---

## 🎉 Your Complete System URLs

After successful deployment:

- **Frontend Application**: `https://your-app-name.vercel.app`
- **Railway Python Service**: `https://web-production-d2270.up.railway.app`
- **Admin Dashboard**: `https://your-app-name.vercel.app/admin/login`
- **Health Checks**: 
  - Frontend: `https://your-app-name.vercel.app/api/health`
  - Railway: `https://web-production-d2270.up.railway.app/health`

---

## 🚨 Troubleshooting

### If Environment Variables Don't Work

1. **Double-check spelling** in Vercel dashboard
2. **Ensure "Production" environment** is selected
3. **Redeploy after adding**: `vercel --prod`

### If Railway Integration Fails

```bash
# Test Railway directly first
curl https://web-production-d2270.up.railway.app/health

# If Railway works but frontend doesn't:
# Check Vercel function logs in dashboard
```

### If Build Still Fails

```bash
# Create minimal .env for build
cat > .env << EOF
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=placeholder
CLOUDINARY_API_KEY=placeholder
CLOUDINARY_API_SECRET=placeholder
EOF

# Try build again
npm run build
```

---

## 🎯 Deployment Commands Summary

```bash
# 1. Setup
cd pupring-frontend
cp .env.example .env
# Edit .env with your API keys

# 2. Test locally
npm install
npm run build
npm run dev

# 3. Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod

# 4. Add environment variables in Vercel dashboard

# 5. Redeploy
vercel --prod

# 6. Test
curl https://your-app.vercel.app/api/health
```

---

## 🎊 You're Ready to Deploy!

**Your Railway service is working at**: `https://web-production-d2270.up.railway.app`

**Follow these steps and your complete PupRing AI system will be live!** 🚀

**After deployment, you'll have a fully functional pet engraving system with:**
- ✅ AI-powered image processing
- ✅ Professional engraving generation  
- ✅ Admin dashboard for order management
- ✅ Ready for Shopify e-commerce integration