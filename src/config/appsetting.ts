// src/config/appsetting.ts
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// 🔹 Create __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Load environment file
dotenv.config({
  path: path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || "development"}`),
});

const config = {
  database: {
    mysql: {
      databaseUrl: process.env.DATABASE_URL,
    }
  },
  jwt: {
    secret: process.env.SECRET_KEY,
    expiresIn: process.env.EXPIRE_IN,
    cookieSecret: process.env.COOKIE_SECRET,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT,
    endPointWithoutPort: process.env.MINIO_ENDPOINT_WITHOUT_PORT,
    port: Number(process.env.MINIO_PORT), // convert string → number
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: process.env.MINIO_REGION,
    useSSL: process.env.MINIO_USE_SSL === "true",
    bucketName: process.env.MINIO_BUCKET_NAME,
  },
  // ...other configs
};

export default config;