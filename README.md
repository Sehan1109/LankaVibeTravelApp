# 🇱🇰 LankaVibe Travel App

**LankaVibe** is a comprehensive travel management platform designed to help tourists explore Sri Lanka. It combines traditional booking capabilities with AI-powered itinerary generation, offering a seamless experience from planning to travelling.

## ✨ Key Features

* **🤖 AI Trip Planner:** Generates personalized travel itineraries using Google Gemini AI.
* **🗺️ Interactive Exploration:** Integrated Google Maps for location tracking and visualization.
* **📦 Package Management:** Browse, create, and book curated travel packages.
* **🏨 Resource Hub:** Connect with hotels, professional drivers, and tour guides.
* **🚗 Vehicle Rentals:** specialized module for browsing and renting travel vehicles.
* **🔐 Secure Auth:** Google OAuth and JWT-based authentication.
* **📄 PDF Exports:** Download itineraries and booking details instantly.

---

## 🛠️ Tech Stack

### Frontend (Client)

* **Framework:** React 19 (Vite)
* **Styling:** Tailwind CSS, Framer Motion
* **APIs:** Google Maps API, Google Gemini (GenAI)
* **Utilities:** jsPDF, html2canvas

### Backend (Server)

* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js v5.2.1
* **Database:** MongoDB (via Mongoose)
* **Authentication:** jsonwebtoken, bcryptjs, google-auth-library
* **Services:**
* **Email:** `nodemailer` for notifications.
* **Search:** `serpapi` for external search data.
* **Storage:** `multer` (local) and `@supabase/supabase-js` (cloud).



---

## 🚀 Getting Started

Follow these steps to set up the full project locally.

### 1. Prerequisites

* Node.js (v18 or higher recommended)
* MongoDB (Local or Atlas connection string)
* Git

### 2. Clone the Repository

```bash
git clone https://github.com/Sehan1109/LankaVibeTravelApp.git
cd LankaVibeTravelApp

```

### 3. Backend Setup

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install

```

Create a `.env` file in the `backend/` directory with the following keys:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lankavibe

# Auth & Security
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# External Services
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
SERPAPI_KEY=your_serpapi_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

```

Start the backend server:

```bash
npm run dev
# Server runs on http://localhost:5000

```

### 4. Frontend Setup

Open a new terminal, navigate to the frontend folder, and install dependencies:

```bash
cd frontend
npm install

```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

```

Start the frontend development server:

```bash
npm run dev
# Client runs on http://localhost:5173

```
