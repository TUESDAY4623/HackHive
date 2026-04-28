<<<<<<< HEAD
<<<<<<< HEAD
# 🐝 HackHive – Full-Stack Hackathon Platform

A premium hackathon social platform built with **Next.js 14**, **Express.js**, **MongoDB**, and **Socket.io**.

## 🗂 Project Structure

```
hackhive-fullstack/
├── frontend/     ← Next.js 14 App (deploy to Vercel)
└── backend/      ← Express API + Socket.io (deploy to Railway/Render)
```

## ⚡ Quick Start (Local Development)

### 1. Set up the Backend

```bash
cd backend
npm install
```

Edit `.env` and fill in your credentials:
- **MongoDB URI** → Get from [MongoDB Atlas](https://cloud.mongodb.com)
- **GitHub OAuth** → Create app at [GitHub Settings](https://github.com/settings/applications/new)
- **Google OAuth** → Create at [Google Console](https://console.cloud.google.com/apis/credentials)

Then start the backend:
```bash
npm run dev
```
Backend runs on: **http://localhost:5000**

### 2. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: **http://localhost:3000**

### 3. Set up the database

```bash
cd backend
node seed.js
```

---

## 🔑 Getting API Keys

### MongoDB Atlas (Free)
1. Go to https://cloud.mongodb.com → Create free cluster
2. Database Access → Create user with password
3. Network Access → Allow `0.0.0.0/0`
4. Connect → Get connection string → paste into `.env` as `MONGO_URI`

### GitHub OAuth
1. Go to https://github.com/settings/applications/new
2. **Homepage URL**: `http://localhost:3000`
3. **Callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Paste Client ID and Secret into `.env`

### Google OAuth
1. Go to https://console.cloud.google.com → Create project
2. APIs & Services → Credentials → Create OAuth 2.0 Client
3. **Authorized redirect URI**: `http://localhost:5000/api/auth/google/callback`
4. Paste Client ID and Secret into `.env`

---

## 🚀 Deployment

### Backend → Railway
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select `hackhive-fullstack/backend`
3. Add all environment variables from `.env`
4. Update `FRONTEND_URL` to your Vercel URL
5. Update `BACKEND_URL` to your Railway URL

### Frontend → Vercel
1. Go to https://vercel.com → New Project → Import from GitHub
2. Select `hackhive-fullstack/frontend`
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend.railway.app`
4. Deploy!

After deploying both:
- Update backend `.env` → `FRONTEND_URL=https://your-app.vercel.app`
- Update GitHub/Google OAuth callback URLs to production URLs

---

## 🧩 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register with email | - |
| POST | `/api/auth/login` | Login with email | - |
| GET | `/api/auth/github` | GitHub OAuth | - |
| GET | `/api/auth/google` | Google OAuth | - |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/users` | List users (team builder) | - |
| PUT | `/api/users/me` | Update profile | ✅ |
| GET | `/api/projects` | Get project feed | - |
| POST | `/api/projects` | Create project | ✅ |
| PUT | `/api/projects/:id/like` | Like/unlike | ✅ |
| POST | `/api/projects/:id/join` | Request to join | ✅ |
| GET | `/api/hackathons` | List hackathons | - |
| POST | `/api/hackathons` | Create hackathon | ✅ |
| PUT | `/api/hackathons/:id/register` | Register/unregister | ✅ |
| GET | `/api/conversations` | Get conversations | ✅ |
| POST | `/api/conversations` | Start conversation | ✅ |
| POST | `/api/conversations/:id/messages` | Send message | ✅ |

## 🔌 Real-Time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `conversation:join` | Client→Server | Join room |
| `message:send` | Client→Server | Send message |
| `message:new` | Server→Client | New message received |
| `typing:start/stop` | Bidirectional | Typing indicator |
| `user:online/offline` | Server→Client | Presence updates |

## 🎨 Tech Stack
- **Frontend**: Next.js 14, TypeScript, CSS Modules, Socket.io Client, Axios
- **Backend**: Express.js, MongoDB + Mongoose, Socket.io, Passport.js (JWT + GitHub + Google)
- **Auth**: JWT + bcrypt (email/password), GitHub OAuth, Google OAuth
- **Real-time**: Socket.io for live chat + online presence

---

## 🧪 Test Account Credentials

After running `node seed.js`, you can log in with:
- **Email**: `test@hackhive.dev`
- **Password**: `HackHive@123` 
=======
// Override visibility and focus properties/events for tab/fullscreen bypass
(function() {
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (['visibilitychange', 'blur', 'focus', 'webkitvisibilitychange', 'mozvisibilitychange', 'msvisibilitychange'].includes(type)) {
      console.log('Blocked detection event: ' + type);
      return; // Skip registering these
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Force always visible/focused
  Object.defineProperty(document, 'hidden', { value: false, writable: false });
  Object.defineProperty(document, 'visibilityState', { get: () => 'visible', writable: false });
  Object.defineProperty(document, 'webkitHidden', { value: false, writable: false });
  Object.defineProperty(document, 'mozHidden', { value: false, writable: false });
  Object.defineProperty(document, 'msHidden', { value: false, writable: false });

  document.hasFocus = () => true;
  window.onfocus = () => true;
  window.onblur = null;
  document.onvisibilitychange = undefined;

  // Block any lingering events
  ['visibilitychange', 'blur', 'focus', 'webkitvisibilitychange', 'mozvisibilitychange', 'msvisibilitychange'].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }, true);
  });

  console.log('Bypass active: Tab switches should be undetectable.');
})();
>>>>>>> 810b3128cd68648798187a8b498f49592096e9af
=======

>>>>>>> 62a557670ceb70f321a6f81b8fee9b2cc59fc5ad
