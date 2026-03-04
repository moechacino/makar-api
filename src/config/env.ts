const getEnvVar = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const env = {
  DATABASE_HOST: getEnvVar("DATABASE_HOST", "localhost"),
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 3306,
  DATABASE_USER: getEnvVar("DATABASE_USER", "root"),
  DATABASE_PASSWORD: getEnvVar("DATABASE_PASSWORD", ""),
  DATABASE_NAME: getEnvVar("DATABASE_NAME", "makar_db"),

  JWT_SECRET: getEnvVar("JWT_SECRET", "change-this-secret"),

  MAYAR_API_KEY: getEnvVar("MAYAR_API_KEY", ""),
  MAYAR_BASE_URL: getEnvVar("MAYAR_BASE_URL", "https://api.mayar.club/hl/v1"),

  PLATFORM_FEE: Number(process.env.PLATFORM_FEE) || 2000,

  PORT: Number(process.env.PORT) || 3000,
};
