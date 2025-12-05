# Tribe - Full-Stack Real-Time Social Media App

Welcome to the Tribe application! This is a complete MERN-stack (MongoDB, Express, React, Node.js) application with an integrated real-time layer using Socket.IO for live chats, notifications, and feed updates.

---

## Architecture Overview

-   **Frontend:** A dynamic, single-page application built with **React** and **TailwindCSS**. It's located in the project's root directory.
-   **Backend:** A robust API built with **Node.js** and **Express**, located in the `/backend` directory. It handles all business logic, database interactions, and real-time communication.
-   **Database:** A NoSQL database powered by **MongoDB Atlas**.
-   **Real-Time Layer:** **Socket.IO** enables instantaneous, bi-directional communication for all live features.

---

## Local Development Setup

Follow these steps to run the entire application on your local machine.

### 1. Backend Setup

First, navigate into the backend directory and set it up.

```bash
# Navigate to the backend directory
cd backend

# Install all required dependencies
npm install
```

Next, configure your environment variables.

1.  Create a new file named `.env` inside the `/backend` directory.
2.  Copy the contents of `.env.example` (if it exists) or the following block into your new `.env` file:

```env
# Server Configuration
PORT=5001

# MongoDB Database Connection String (get this from MongoDB Atlas)
MONGO_URI=your_mongodb_connection_string_goes_here

# JSON Web Token (JWT) Secret for Authentication
JWT_SECRET=replace_this_with_a_very_long_and_secure_random_string

# Google Gemini API Key (for the Ember AI feature)
API_KEY=your_google_gemini_api_key_goes_here
```

3.  **Get your `MONGO_URI`** from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) by creating a free account and a free-tier cluster. **Remember to whitelist all IP addresses (0.0.0.0/0) for local development.**
4.  Run the backend server:

```bash
# From the /backend directory
npm run server
```

Your backend API and WebSocket server will now be running at `http://localhost:5001`.

### 2. Frontend Setup

The frontend is designed to run without a local build step.

1.  Make sure your backend is running.
2.  Open the `index.html` file in your browser, preferably using a local server extension like VS Code's **"Live Server"**.

The frontend will automatically connect to your local backend.

---

## Deployment Guide (Production)

This application requires a two-part deployment: the backend on a server platform and the frontend on a static hosting platform.

### Step 1: Deploy the Backend to Render

Render is an excellent choice for hosting Node.js servers.

1.  Push your entire project to a GitHub repository.
2.  Create a new **"Web Service"** on Render and connect it to your GitHub repo.
3.  Configure the service with the following settings:
    -   **Root Directory:** `backend` (This tells Render to only use the backend folder).
    -   **Build Command:** `npm install`
    -   **Start Command:** `npm start`
4.  Go to the **"Environment"** tab for your new service and add the same environment variables from your local `.env` file (`MONGO_URI`, `JWT_SECRET`, `API_KEY`).
5.  Deploy. Render will give you a public URL (e.g., `https://tribe-backend-xyz.onrender.com`). **Copy this URL.**

### Step 2: Deploy the Frontend to Vercel

Vercel is the best platform for hosting your React frontend.

1.  In your project's code, open the `api/config.ts` file.
2.  **Replace the placeholder URL** with the public URL you copied from your Render backend service.

    ```typescript
    // api/config.ts
    export const API_URL = 'https://tribe-backend-xyz.onrender.com'; // <-- PASTE YOUR RENDER URL HERE
    ```

3.  Commit and push this change to GitHub.
4.  Create a new project on Vercel and connect it to the same GitHub repository.
5.  Vercel will automatically detect the React frontend and configure the build settings. There is no need to set a root directory.
6.  Deploy.

Your application is now live! The Vercel frontend will make API calls to your Render backend.
