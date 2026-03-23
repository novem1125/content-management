import config from "../config/appsetting";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: config.minio.endPoint,
  // endpoint: "http://103.47.185.78:9000",
  // endpoint: "http://178.128.19.18:9000",
  // endpoint: "http://192.168.0.221:9000",
  // endpoint: "http://103.47.185.68:9000",
  // endpoint: "https://minio.amuze.com.mm:9000",
  // endpoint: "https://intl.minio.amuze.com.mm:9000",
  region: config.minio.region, // Default region for S3
  credentials: {
    accessKeyId: config.minio.accessKey!, // Replace with your MinIO access key
    secretAccessKey: config.minio.secretKey!, // Replace with your MinIO secret key
  },
forcePathStyle: true, // Required for MinIO to use path-style URLs
});

export default s3Client;