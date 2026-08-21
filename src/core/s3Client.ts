import config from "../config/appsetting";
import { S3Client } from "@aws-sdk/client-s3";

function getS3Endpoint(): string {
  const rawEndpoint = config.minio.endPoint || "localhost";
  if (rawEndpoint.startsWith("http://") || rawEndpoint.startsWith("https://")) {
    return rawEndpoint;
  }
  const protocol = config.minio.useSSL ? "https" : "http";
  const port = config.minio.port;
  const portSuffix = port && !rawEndpoint.includes(":") ? `:${port}` : "";
  return `${protocol}://${rawEndpoint}${portSuffix}`;
}

const s3Client = new S3Client({
  endpoint: getS3Endpoint(),
  region: config.minio.region || "us-east-1",
  credentials: {
    accessKeyId: config.minio.accessKey || "",
    secretAccessKey: config.minio.secretKey || "",
  },
  forcePathStyle: true, // Required for MinIO to use path-style URLs
});

export default s3Client;