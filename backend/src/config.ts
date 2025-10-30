export const config = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || '',
};
if (!config.databaseUrl) {
  console.warn('WARNING: DATABASE_URL is not set');
}