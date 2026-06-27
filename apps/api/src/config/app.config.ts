import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // JWT access token — short-lived
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',

  // JWT refresh token — long-lived, different secret
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Email / SMTP (optional — OTP is always logged to console in dev)
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'noreply@alegomind.ro',

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeHealthPlusPriceId: process.env.STRIPE_HEALTH_PLUS_PRICE_ID,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.20'),
}));
