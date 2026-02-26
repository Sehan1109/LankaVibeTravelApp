import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// 1. Import Database Config
import connectDB from './config/db.js';

// 2. Import Route Files
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import planRoutes from './routes/planRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// --- CONFIGURATION ---
const app = express();

// Connect to MongoDB
connectDB();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- ROUTES ---
app.use('/api/auth', authRoutes);         // Login, Register, Password Reset
app.use('/api/packages', packageRoutes);  // Tour Packages (Create, Get, Update)
app.use('/api/plans', planRoutes);        // Saved AI Itineraries
app.use('/api/vehicles', vehicleRoutes);   // Vehicle Management
app.use('/api/reviews', reviewRoutes);

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});