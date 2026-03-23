import { Client } from "minio"
import config from "../config/appsetting"

export const minioClient = new Client({
    endPoint: config.minio.endPointWithoutPort!,
    port: Number(process.env.MINIO_PORT),
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey
})