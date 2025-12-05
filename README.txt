
# 🚀 TRIBE SOCIAL - FINAL DEPLOYMENT GUIDE

This guide explains EXACTLY how to deploy your app and connect the pieces.

---

## 🛑 STEP 1: DATABASE SETUP (MongoDB Atlas)

Before deploying any code, you need a database.

1.  Go to **https://www.mongodb.com/cloud/atlas** and sign up (it's free).
2.  Create a **new Cluster** (select the Free Tier / M0 Sandbox).
3.  **Create a Database User:**
    *   Go to "Database Access" -> "Add New Database User".
    *   Username: `tribe-admin` (or whatever you want).
    *   Password: **Create a strong password and COPY IT**. You need this later.
    *   Privileges: "Read and write to any database".
4.  **Network Access (Whitelist IP):**
    *   Go to "Network Access" -> "Add IP Address".
    *   Select **"Allow Access from Anywhere"** (`0.0.0.0/0`). This is required for Render/Vercel to connect.
5.  **Get Connection String:**
    *   Go to "Database" -> "Connect" -> "Drivers".
    *   Copy the string. It looks like: `mongodb+srv://tribe-admin:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
    *   **Replace `<password>`** with the actual password you created in step 3.

---

## ☁️ STEP 2: DEPLOY BACKEND (Render.com)

We will host the Node.js server here.

1.  **Push your code to GitHub.** Ensure your `backend` folder is in the repo.
2.  Go to **https://dashboard.render.com/** and sign up.
3.  Click **"New +"** -> **"Web Service"**.
4.  Connect your GitHub repository.
5.  **Configure the Service:**
    *   **Name:** `tribe-backend` (or similar)
    *   **Region:** Choose one close to you (e.g., Oregon, Frankfurt).
    *   **Branch:** `main`
    *   **Root Directory:** `backend` (⚠️ IMPORTANT: Type `backend` here)
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Plan:** Free
6.  **Environment Variables (Advanced Section):**
    *   Click "Add Environment Variable". Add these 4:
        *   `MONGO_URI`: (Paste the connection string from Step 1)
        *   `JWT_SECRET`: (Type a long random string, e.g., `mysecretkey12345`)
        *   `API_KEY`: (Your Google Gemini API Key for Chuk AI)
        *   `PORT`: `5001`
7.  Click **"Create Web Service"**.
8.  **Wait for deployment.** Once it says "Live", look for the URL at the top left (e.g., `https://tribe-social-backend.onrender.com`).
9.  **COPY THIS URL.**

---

## 🔗 STEP 3: CONNECT FRONTEND TO BACKEND

This is the most critical step.

1.  In your local project (VS Code), open the file:
    👉 **`src/config.ts`**

2.  Find the `API_BASE_URL` constant.

3.  **REPLACE** the string value with **YOUR** Backend URL from Step 2 (Result #9).
    *   Example: `export const API_BASE_URL = 'https://tribe-social-backend.onrender.com';`
    *   *Note: Do NOT put a slash `/` at the end.*

4.  **Save the file.**
5.  **Commit and Push** these changes to GitHub.

---

## 🌐 STEP 4: DEPLOY FRONTEND (Vercel)

We will host the React app here using your `trbe-social` domain.

1.  Go to **https://vercel.com/** and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Configure Project:**
    *   **Framework Preset:** Vite (it should auto-detect this).
    *   **Root Directory:** `./` (Leave as default, do not change).
5.  Click **"Deploy"**.
6.  **Set Custom Domain (trbe-social.vercel.app):**
    *   Once deployed, go to the Project Dashboard -> **Settings** -> **Domains**.
    *   Add `trbe-social.vercel.app` (if it's not already there).
    *   Note: If you own the actual domain `trbe-social.com`, you can add that here too and follow the DNS instructions. For free hosting, Vercel gives you a `.vercel.app` subdomain automatically.

---

## ✅ DONE!

1.  Open your frontend URL (e.g., `https://trbe-social.vercel.app`).
2.  Sign up a new user.
3.  Create a post.
4.  If it works, your Frontend is talking to your Backend on Render, which is talking to MongoDB!

**Troubleshooting:**
*   **"Network Error" or Nothing loads:** Double-check `src/config.ts`. Did you put the correct Render URL? Did you push the change to GitHub *before* Vercel deployed?
*   **AI not working:** Check the `API_KEY` in Render Environment Variables.
*   **Login fails:** Check MongoDB connection in Render logs.
