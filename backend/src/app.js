require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ---------------------
// Middleware
// ---------------------
app.use(helmet());

// CORS — allow frontend origin and include credentials (cookies)
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true,       // Required for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(cookieParser());                              // Parse httpOnly cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------
// Routes
// ---------------------
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------
// Error Handling
// ---------------------
app.use(errorHandler);

module.exports = app;
