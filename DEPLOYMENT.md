# Deployment Guide - Railway

## Prerequisites
- GitHub account
- Railway account (free tier with $5/month credit)

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

## Step 3: Deploy to Railway

### Option A: Using Railway Dashboard (Recommended)

1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub account
4. Select `collatz-coral-reef` repository
5. Railway will auto-detect Node.js and configure:
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `npm start`
6. Click "Deploy"
7. Wait for deployment to complete (2-3 minutes)

### Option B: Using Railway CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and deploy:
```bash
cd "c:\Users\soury\CascadeProjects\New folder"
railway init
railway up
```

## Step 4: Configure Environment Variables

Railway automatically sets the `PORT` environment variable. No additional configuration needed.

## Step 5: Verify Deployment

1. Visit your Railway deployment URL (e.g., `https://your-app.railway.app`)
2. Test the application:
   - Submit a seed number
   - Check if the visualization renders
   - Test hover functionality
   - Verify real-time updates (open in multiple tabs)

## Railway Benefits

- **Full WebSocket support** - Socket.io works out of the box
- **Persistent storage** - Better for real-time collaborative apps
- **Generous free tier** - $5/month credit, more resources than Vercel
- **Simple deployment** - Auto-detects Node.js apps
- **Custom domains** - Easy to set up

## Troubleshooting

### Build Issues
If the build fails, check the Railway logs and ensure:
- Node.js version is >= 16.0.0 (set in package.json)
- All dependencies are properly installed

### WebSocket Connection
Railway supports WebSockets natively. If you see connection errors:
- Check that the deployment URL is correct
- Verify the app is running (green status in Railway dashboard)

### Port Configuration
The server.js already uses `process.env.PORT || 5000`, which Railway automatically sets. No changes needed.
