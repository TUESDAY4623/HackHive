# 🔐 OAuth + Deployment Guide for HackHive

## Part 1: GitHub OAuth Setup (5 minutes)

### Step 1 – Create GitHub OAuth App
1. Go to: https://github.com/settings/applications/new
2. Fill in:
   - **Application name**: `HackHive`
   - **Homepage URL**: `https://your-backend.railway.app` *(or `http://localhost:5000` for local)*
   - **Authorization callback URL**: `https://your-backend.railway.app/api/auth/github/callback`
     *(local: `http://localhost:5000/api/auth/github/callback`)*
3. Click **Register application**
4. On the next page, copy:
   - **Client ID** → paste as `GITHUB_CLIENT_ID` in `backend/.env`
   - Click **Generate a new client secret** → copy it → paste as `GITHUB_CLIENT_SECRET`

---

## Part 2: Google OAuth Setup (10 minutes)

### Step 1 – Create Google Cloud Project
1. Go to: https://console.cloud.google.com
2. Click **"Select a project"** → **"New Project"**
3. Name it `HackHive` → Click **Create**

### Step 2 – Enable OAuth
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** → Click **Create**
3. Fill in:
   - App name: `HackHive`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue** (skip scopes, skip test users)
5. Click **Back to Dashboard**

### Step 3 – Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `HackHive Web`
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://your-backend.railway.app/api/auth/google/callback`
6. Click **Create**
7. Copy:
   - **Client ID** → paste as `GOOGLE_CLIENT_ID`
   - **Client Secret** → paste as `GOOGLE_CLIENT_SECRET`

---

## Part 3: Deploy Backend to Railway (10 minutes)

### Step 1 – Push to GitHub
```bash
cd hackhive-fullstack
git init
git add .
git commit -m "initial: HackHive full-stack"
git remote add origin https://github.com/YOUR_USERNAME/hackhive.git
git push -u origin main
```

### Step 2 – Deploy on Railway
1. Go to: https://railway.app → Sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `hackhive` repo
4. Railway will detect Node.js automatically
5. Set **Root Directory** to `backend`
6. Click **Deploy**

### Step 3 – Add Environment Variables on Railway
Go to your service → **Variables** tab → Add each:

```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://utkarshsingh4623_db_user:6lUMIAbVj0ZppFLi@cluster0.d6ik626.mongodb.net/hackhive?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=hackhive_9a3f2c1b8d7e4f6a0c5b2e8d1a7f3c9b4e6a2d8f1c7b3e5a9d2f8c4b6a0e3d7
SESSION_SECRET=hackhive_session_f4a2b8c1d9e7f3a6b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://hackhive.vercel.app
```

4. Railway will give you a URL like: `https://hackhive-backend.railway.app`
5. Copy this URL for the next step.

### Step 4 – Update OAuth Callback URLs
- GitHub: update callback to `https://hackhive-backend.railway.app/api/auth/github/callback`
- Google: add `https://hackhive-backend.railway.app/api/auth/google/callback`
- Update Railway `FRONTEND_URL` to your Vercel URL

---

## Part 4: Deploy Frontend to Vercel (5 minutes)

### Step 1 – Deploy
1. Go to: https://vercel.com → Sign in with GitHub
2. Click **New Project** → Import `hackhive` repo
3. Set **Root Directory** to `frontend`
4. Framework: **Next.js** (auto-detected)

### Step 2 – Environment Variables on Vercel
Add these in **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://hackhive-backend.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://hackhive-backend.railway.app
```

5. Click **Deploy** → Get your URL (e.g. `https://hackhive.vercel.app`)

---

## Part 5: Update Your .env Files

### backend/.env (final production values)
```env
MONGO_URI=mongodb+srv://utkarshsingh4623_db_user:6lUMIAbVj0ZppFLi@cluster0.d6ik626.mongodb.net/hackhive?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=hackhive_9a3f2c1b8d7e4f6a0c5b2e8d1a7f3c9b4e6a2d8f1c7b3e5a9d2f8c4b6a0e3d7
SESSION_SECRET=hackhive_session_f4a2b8c1d9e7f3a6b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1
GITHUB_CLIENT_ID=← paste here
GITHUB_CLIENT_SECRET=← paste here
GOOGLE_CLIENT_ID=← paste here
GOOGLE_CLIENT_SECRET=← paste here
FRONTEND_URL=https://hackhive.vercel.app
BACKEND_URL=https://hackhive-backend.railway.app
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=https://hackhive-backend.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://hackhive-backend.railway.app
```

---

## ✅ Final Checklist

- [ ] GitHub OAuth App created & credentials in .env
- [ ] Google Cloud OAuth credentials in .env
- [ ] Backend deployed to Railway with all env vars
- [ ] Frontend deployed to Vercel with API URL
- [ ] MongoDB Atlas Network Access has `0.0.0.0/0`
- [ ] Seed database: `node seed.js` (run once)
- [ ] Test login with Google and GitHub on production URL
