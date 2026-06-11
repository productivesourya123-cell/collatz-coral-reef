# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier works)

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `collatz-coral-reef`
3. Description: Real-time collaborative Collatz Conjecture visualization
4. Make it Public
5. Click "Create repository"
6. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/collatz-coral-reef.git`)

## Step 2: Push Code to GitHub

Run these commands in your project directory:

```bash
cd "c:\Users\soury\CascadeProjects\New folder"
git remote add origin https://github.com/YOUR_USERNAME/collatz-coral-reef.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**QUICK START - Run these exact commands after creating your GitHub repo:**

```bash
cd "c:\Users\soury\CascadeProjects\New folder"
git remote add origin https://github.com/YOUR_USERNAME/collatz-coral-reef.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd "c:\Users\soury\CascadeProjects\New folder"
vercel
```

4. Follow the prompts:
   - Set up and deploy? `Y`
   - Link to existing project? `N` (for new project)
   - Project name: `collatz-coral-reef`
   - Directory: `./`
   - Override settings? `N`

5. Deploy to production:
```bash
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import" from your Git repository
3. Select `collatz-coral-reef` from GitHub
4. Configure:
   - Framework Preset: "Other"
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. Click "Deploy"

## Step 4: Environment Variables (if needed)

If you need to add environment variables in Vercel:
1. Go to your project settings in Vercel
2. Navigate to Settings → Environment Variables
3. Add any required variables

## Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the application:
   - Submit a seed number
   - Check if the visualization renders
   - Test hover functionality
   - Verify real-time updates (open in multiple tabs)

## Troubleshooting

### Port Issues
Vercel automatically handles port configuration. The app will use the port provided by Vercel's environment variable.

### Socket.io on Vercel
The current configuration uses Socket.io which may require additional configuration for Vercel's serverless environment. If you encounter issues, consider:
- Using a dedicated hosting service like Render, Railway, or Heroku for the backend
- Or switching to a WebSocket-compatible platform

### Alternative Deployment Options

**Render:**
1. Create account at https://render.com
2. Connect GitHub repository
3. Create Web Service for backend
4. Create Static Site for frontend

**Railway:**
1. Create account at https://railway.app
2. Connect GitHub repository
3. Railway will auto-detect and deploy both backend and frontend

**Heroku:**
1. Create account at https://heroku.com
2. Install Heroku CLI
3. Run: `heroku create`
4. Run: `git push heroku main`
