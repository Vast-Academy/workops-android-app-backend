require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();

// Port configuration
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://10.0.2.2:3000'], // React Native Android emulator
    credentials: true
}));

// Connect to MongoDB
connectDB();

// Initialize Firebase Admin (imported in config)
require('./config/firebase-admin');

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'WorkOps Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ API Base: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('');
});
