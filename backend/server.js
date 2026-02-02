import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// 1. Import Database Config
import connectDB from './config/db.js';

// 2. Import Route Files
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import planRoutes from './routes/planRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// 3. Import Middleware (for the standalone upload route)
import upload from './middleware/uploadMiddleware.js';

// --- CONFIGURATION ---
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connect to MongoDB
connectDB();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- STATIC FILE SERVING (Images) ---
// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Make the 'uploads' folder public so frontend can access images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
app.use('/api/auth', authRoutes);         // Login, Register, Password Reset
app.use('/api/packages', packageRoutes);  // Tour Packages (Create, Get, Update)
app.use('/api/bookings', bookingRoutes);  // Customer Bookings
app.use('/api/resources', resourceRoutes);// Hotels, Drivers, Guides
app.use('/api/plans', planRoutes);        // Saved AI Itineraries
app.use('/api/vehicles', vehicleRoutes);   // Vehicle Management
app.use('/api/reviews', reviewRoutes);

// --- HELPER ROUTE: GENERIC UPLOAD ---
// Useful if you need to upload a single image unrelated to a specific package
// (e.g., User Profile Picture or just testing the upload feature)
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the URL of the uploaded file
    res.json({
      url: `http://localhost:5000/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});