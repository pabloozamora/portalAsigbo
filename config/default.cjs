const dotenv = require('dotenv');

dotenv.config(); // hace accesibles las variables de entorno

module.exports = {
  port: 3000,
  dbConnectionUri: process.env.DEV_DB_CONNECTION_URI,
};
