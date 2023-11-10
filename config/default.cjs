const dotenv = require('dotenv');

dotenv.config(); // hace accesibles las variables de entorno

module.exports = {
  port: 3000,
  host: 'http://localhost:5173',
  dbConnectionUri: process.env.DEV_DB_CONNECTION_URI,
  jwtKey: process.env.JWT_KEY,
  allowInsecureConnections: true,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  awsBucketAccess: process.env.AWS_BUCKET_ACCESS,
  awsBucketSecret: process.env.AWS_BUCKET_SECRET,
  bucketName: process.env.BUCKET_NAME,
  awsSesAccess: process.env.AWS_SES_ACCESS,
  awsSesSecret: process.env.AWS_SES_SECRET,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  sendErrorObj: true,
  emailSendingRate: 14,
};
