export const config = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  adminSecret: process.env.ADMIN_SECRET ?? '',
  samApiKey: process.env.SAM_API_KEY ?? '',
  grantsApiKey: process.env.GRANTS_API_KEY ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'noreply@fundingradars.com',
};
