require('dotenv').config();

module.exports = {
    FILE_EXTENSION: '.als',
    PORT: process.env.PORT || 3001,
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:3001', 
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001",
  };