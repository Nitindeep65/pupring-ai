# 🚀 PupRing Frontend Deployment Guide

## Complete Vercel Deployment with Railway Integration

---

## 📋 Pre-Deployment Checklist

### Requirements
- [ ] **Node.js 18+** installed locally
- [ ] **Railway Python services** deployed (or URL ready)
- [ ] **MongoDB Atlas** database created
- [ ] **Cloudinary** account with API keys
- [ ] **Roboflow** account with API keys
- [ ] **GitHub account** for code repository
- [ ] **Vercel account** (free tier works)

---

# 🎯 Step 1: Environment Configuration

## Create Environment File

Copy the example and fill in your actual values:

```bash
cp .env.example .env
```

## Required Environment Variables

```bash
# ===============================================
# PRODUCTION ENVIRONMENT VARIABLES
# ===============================================

# MongoDB Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pupring?retryWrites=true&w=majority

# Admin Authentication (REQUIRED)  
JWT_SECRET=your-super-secure-random-jwt-secret-change-this-in-production-min-32-chars

# Cloudinary Image Storage (REQUIRED)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name  
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Pet Detection AI (REQUIRED)
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Railway Python Services (REQUIRED - UPDATE AFTER RAILWAY DEPLOYMENT)
PYTHON_SERVICE_URL=https://your-railway-project-production.up.railway.app
PYTHON_API_URL=https://your-railway-project-production.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://your-railway-project-production.up.railway.app
ADVANCED_SERVICE_URL=https://your-railway-project-production.up.railway.app

# Background Removal (OPTIONAL)
REMOVE_BG_API_KEY=your_remove_bg_api_key

# Shopify Integration (OPTIONAL - Configure when ready)
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token  
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SHOPIFY_SINGLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/123456789
NEXT_PUBLIC_SHOPIFY_DOUBLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/987654321
NEXT_PUBLIC_SHOPIFY_TRIPLE_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/456789123
NEXT_PUBLIC_SHOPIFY_QUAD_PENDANT_VARIANT_ID=gid://shopify/ProductVariant/147258369

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
VERCEL=1
VERCEL_ENV=production
```

## Get API Keys

### 1. MongoDB Atlas
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Replace `<username>`, `<password>`, and database name

### 2. Cloudinary
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Dashboard shows your cloud name, API key, and secret
4. Copy all three values

### 3. Roboflow
1. Go to [roboflow.com](https://roboflow.com)
2. Create account
3. Go to Account Settings → API
4. Copy your API key

### 4. JWT Secret
Generate a secure random string (32+ characters):
```bash
# Generate secure JWT secret
openssl rand -base64 32
# Or use: https://generate-secret.vercel.app/32
```

---

# 🎯 Step 2: Local Testing

## Install and Test Locally

```bash
# Install dependencies
npm install

# Test build locally
npm run build

# Start production server locally
npm start

# Test in browser: http://localhost:3000
```

## Verify Core Features

- [ ] **Main page loads** without errors
- [ ] **Image upload interface** works
- [ ] **Admin login** accessible at `/admin/login`
- [ ] **API health check** works: `curl http://localhost:3000/api/health`

## Test with Railway Integration (If Already Deployed)

If you have Railway Python services deployed:

```bash
# Test Railway health check
curl https://your-railway-project-production.up.railway.app/health

# Upload an image through the UI
# Verify processing works end-to-end
```

---

# 🎯 Step 3: Deploy to Vercel

## Method 1: Vercel CLI (Recommended)

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login and Deploy
```bash
# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow prompts:
# ✅ Set up and deploy? Yes
# ✅ Which scope? (Choose your account)
# ✅ Link to existing project? No (first time)
# ✅ What's your project's name? pupring-frontend
# ✅ In which directory is your code located? ./ (current)

# Deploy to production
vercel --prod
```

## Method 2: GitHub Integration

### Push to GitHub
```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial PupRing frontend deployment"

# Create GitHub repository (go to github.com)
# Then add remote and push:
git remote add origin https://github.com/YOUR_USERNAME/pupring-frontend.git
git branch -M main
git push -u origin main
```

### Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. **Import** your `pupring-frontend` repository
5. Click **"Deploy"**

---

# 🎯 Step 4: Configure Environment Variables in Vercel

## Add Environment Variables

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Settings → Environment Variables**
4. **Add each variable** from your `.env` file:

### Required Variables (Add All These):

```bash
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-jwt-secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Roboflow
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pet-face-detection/2

# Railway Python Services
PYTHON_SERVICE_URL=https://your-railway-project-production.up.railway.app
PYTHON_API_URL=https://your-railway-project-production.up.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://your-railway-project-production.up.railway.app

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
VERCEL=1
VERCEL_ENV=production
```

**Important:** 
- Set **Environment** to "Production, Preview, and Development" for all variables
- Click **"Save"** after each variable
- Some variables need "Production" only (like secrets)

## Trigger Redeploy

After adding environment variables:

```bash
# CLI method:
vercel --prod

# OR GitHub method:
git commit --allow-empty -m "Trigger redeploy with environment variables"  
git push origin main
```

---

# 🎯 Step 5: Test Deployed Application

## Basic Testing

### Health Check
```bash
curl https://your-app-name.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Frontend Testing
1. **Visit**: `https://your-app-name.vercel.app`
2. **Test upload interface** works
3. **Admin dashboard**: `https://your-app-name.vercel.app/admin/login`

## Integration Testing

### Test Railway Integration (If Available)
1. **Upload a pet image**
2. **Verify processing works**
3. **Check results display**

### Test Database Connection
- **Upload an image** and check it saves to MongoDB
- **Access admin dashboard** and verify data shows

---

# 🎯 Step 6: Update Railway URLs (When Ready)

## After Railway Python Services Are Deployed

1. **Get Railway URL** from Railway dashboard
2. **Update Vercel environment variables**:
   ```
   PYTHON_SERVICE_URL=https://your-actual-railway-project.up.railway.app
   PYTHON_API_URL=https://your-actual-railway-project.up.railway.app  
   NEXT_PUBLIC_PYTHON_API_URL=https://your-actual-railway-project.up.railway.app
   ```
3. **Redeploy Vercel app**:
   ```bash
   vercel --prod
   ```

## Test Complete Integration

```bash
# Test Railway health from frontend
curl https://your-frontend.vercel.app/api/python/health

# Upload pet image through UI
# Should process via Railway and return results
```

---

# 🎯 Step 7: Custom Domain (Optional)

## Add Custom Domain

1. **Vercel Dashboard → Domains**
2. **Add Domain**: e.g., `pupring-ai.com`
3. **Configure DNS**:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: cname.vercel-dns.com
   ```
4. **SSL Certificate**: Automatically configured by Vercel

---

# 🎯 Step 8: Monitoring & Performance

## Enable Vercel Analytics

1. **Vercel Dashboard → Analytics**
2. **Enable Analytics** for your project
3. **Monitor**:
   - Page load times
   - Function execution times
   - Error rates

## Performance Monitoring

```bash
# Monitor function logs
vercel logs --follow

# Check function performance
# Vercel Dashboard → Functions → View function details
```

## Health Monitoring Setup

### Uptime Monitoring
1. **UptimeRobot.com** (free)
2. **Add HTTP monitor**:
   - URL: `https://your-app.vercel.app/api/health`
   - Interval: 5 minutes
   - Alert on failures

---

# 🎯 Step 9: Shopify Integration (When Ready)

## Shopify Widget Configuration

Update the widget URL in `shopify-templates/product-pet-uploader.liquid`:

```javascript
// Replace with your actual Vercel URL
const NEXT_JS_API_URL = 'https://your-app-name.vercel.app';
```

## Webhook URL

Configure in Shopify Admin:
```
https://your-app-name.vercel.app/api/shopify/webhooks/orders/created
```

---

# ✅ Deployment Checklist

## Pre-Deployment
- [ ] All environment variables configured locally
- [ ] Local build successful (`npm run build`)
- [ ] Local server runs (`npm start`)
- [ ] All API keys obtained and tested

## Vercel Deployment  
- [ ] Vercel account created
- [ ] Project deployed via CLI or GitHub
- [ ] All environment variables added to Vercel
- [ ] Production deployment successful
- [ ] Custom domain configured (optional)

## Testing
- [ ] Health check endpoint responds
- [ ] Main application loads
- [ ] Image upload interface works
- [ ] Admin dashboard accessible
- [ ] Database connection working

## Integration Ready
- [ ] Railway Python services URL updated
- [ ] Complete image processing tested
- [ ] Error handling tested
- [ ] Performance monitoring enabled
- [ ] Shopify integration configured (when ready)

---

# 🎉 Deployment Complete!

## Your Live URLs

- **Main Application**: `https://your-app-name.vercel.app`
- **Admin Dashboard**: `https://your-app-name.vercel.app/admin/login`  
- **Health Check**: `https://your-app-name.vercel.app/api/health`
- **Custom Domain**: `https://your-domain.com` (if configured)

## Integration Status

- ✅ **Frontend Deployed** on Vercel
- ✅ **Database Connected** to MongoDB Atlas
- ✅ **Image Storage** via Cloudinary
- ✅ **Pet Detection** via Roboflow
- 🔄 **Python Services** - Update URLs when Railway is deployed
- 🔄 **Shopify Integration** - Configure when ready

## Next Steps

1. **Deploy Python services** to Railway
2. **Update Railway URLs** in Vercel environment variables
3. **Test complete integration** between frontend and backend
4. **Configure Shopify** when ready for e-commerce
5. **Monitor and scale** as needed

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

**Your PupRing AI frontend is now live and ready for customers!** 🚀🐾

---

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf .next
npm ci  
npm run build
```

**Environment Variables Not Working:**
- Verify all variables in Vercel dashboard
- Check spelling and format
- Ensure "Production" environment selected
- Redeploy after changes

**API Errors:**
```bash
# Check Vercel function logs
vercel logs --follow

# Test API endpoints individually
curl https://your-app.vercel.app/api/health
```

**Railway Integration Issues:**
- Verify Railway service is deployed and healthy
- Check Railway URL format is correct
- Test Railway service directly before integration

Need help? Check the logs and error messages for specific guidance!