const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./src/db/init');
const apiRoutes = require('./src/routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'BISAG-N (MeitY) VAPT Security Intelligence Backend API',
    version: '2.0.0 (Modular Layered Architecture)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// Start Server & Initialize Database
app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(`  BISAG-N (MeitY) VAPT Security Intelligence API`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`===================================================`);
  await initializeDatabase();
});
