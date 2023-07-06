const dotenv = require('dotenv');

dotenv.config(); // hace accesibles las variables de entorno

module.exports = {
  port: 3000,
  host: 'http://127.0.0.1:3000',
  dbConnectionUri: process.env.DEV_DB_CONNECTION_URI,
  jwtKey: process.env.JWT_KEY,
  allowInsecureConnections: true,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};
