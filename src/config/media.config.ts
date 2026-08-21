import s3Client from "../core/s3Client";
import {
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { minioClient } from "../core/minio";
import config from "./appsetting";

export class MediaService {
  private defaultBucket = config.minio.bucketName || "";

  /**
   * Helper to ensure the target MinIO bucket exists before upload.
   */
  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      if (!bucketName) return;
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, config.minio.region || "us-east-1");
        console.log(`[MinIO] Bucket '${bucketName}' auto-created successfully.`);
      }
    } catch (err: any) {
      console.warn(`[MinIO] Bucket check warning for '${bucketName}':`, err.message || err);
    }
  }

  /**
   * 1. Direct File Upload to MinIO
   * Uploads a Buffer or Stream to MinIO bucket under the specified folder path.
   */
  async uploadToMinio(
    bucket: string = this.defaultBucket,
    folderPath: string,
    fileName: string,
    file: Buffer,
    contentType: string = "application/octet-stream"
  ): Promise<string> {
    try {
      if (!file) {
        throw new Error("File content buffer is required for upload");
      }
      const targetBucket = bucket || this.defaultBucket;
      await this.ensureBucketExists(targetBucket);

      const objectKey = folderPath ? `${folderPath}/${fileName}` : fileName;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: targetBucket,
          Key: objectKey,
          Body: file,
          ContentType: contentType,
        },
      });

      await upload.done();
      return objectKey;
    } catch (error: any) {
      console.error("[MediaService] Failed to upload file to MinIO:", error);
      throw new Error(`Failed to upload file to MinIO: ${error.message || error}`);
    }
  }

  /**
   * 2. Generate Presigned Upload (PUT) URL
   * Allows clients to upload a photo/video directly to MinIO storage.
   */
  async generatePresignedUploadUrl(
    objectKey: string,
    contentType: string = "application/octet-stream",
    expiresInSeconds: number = 3600
  ): Promise<string> {
    try {
      const putObjectCommand = new PutObjectCommand({
        Bucket: this.defaultBucket,
        Key: objectKey,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Client, putObjectCommand, {
        expiresIn: expiresInSeconds,
      });

      return url;
    } catch (error: any) {
      console.error("[MediaService] Failed to generate presigned upload URL:", error);
      throw new Error(`Failed to generate presigned upload URL: ${error.message || error}`);
    }
  }

  /**
   * 3. Generate Presigned Download/Access (GET) URL
   * Resolves a stored object key into a secure, temporary presigned access URL.
   */
  async generatePresignedUrl(
    bucket: string = this.defaultBucket,
    objectKey: string,
    expiresInSeconds: number = 604800 // Default 7 days
  ): Promise<string> {
    try {
      const targetBucket = bucket || this.defaultBucket;
      const getObjectCommand = new GetObjectCommand({
        Bucket: targetBucket,
        Key: objectKey,
      });

      const url = await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: expiresInSeconds,
      });

      return url;
    } catch (error: any) {
      console.error(`[MediaService] Failed to generate presigned URL for key '${objectKey}':`, error);
      throw new Error(`Failed to generate presigned URL: ${error.message || error}`);
    }
  }

  /**
   * 4. Delete File from MinIO
   * Deletes a photo or video object from MinIO storage.
   */
  async deleteMinio(
    bucket: string = this.defaultBucket,
    fileName: string
  ): Promise<string> {
    try {
      const targetBucket = bucket || this.defaultBucket;
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: targetBucket,
          Key: fileName,
        })
      );
      return fileName;
    } catch (error: any) {
      console.error(`[MediaService] Failed to delete file '${fileName}' from MinIO:`, error);
      throw new Error(`Failed to delete file from MinIO: ${error.message || error}`);
    }
  }

  /**
   * 5. Update / Replace File in MinIO
   */
  async updateToMinio(
    bucket: string = this.defaultBucket,
    fileName: string,
    file: Buffer,
    contentType: string = "application/octet-stream"
  ): Promise<string> {
    try {
      const targetBucket = bucket || this.defaultBucket;
      await this.deleteMinio(targetBucket, fileName).catch(() => {});

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: targetBucket,
          Key: fileName,
          Body: file,
          ContentType: contentType,
        },
      });

      await upload.done();
      return fileName;
    } catch (error: any) {
      console.error(`[MediaService] Failed to update file '${fileName}' in MinIO:`, error);
      throw new Error(`Failed to update file in MinIO: ${error.message || error}`);
    }
  }

  /**
   * 6. Download File Stream from MinIO to Local File System
   */
  async downloadFromS3(key: string, outputDir: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.defaultBucket,
        Key: key,
      });
      const response = await s3Client.send(command);
      const filePath = path.join(outputDir, path.basename(key));
      await pipeline(
        response.Body as NodeJS.ReadableStream,
        createWriteStream(filePath)
      );

      return filePath;
    } catch (error: any) {
      console.error(`[MediaService] Failed to download key '${key}':`, error);
      throw new Error(`Failed to download file from S3/MinIO: ${error.message || error}`);
    }
  }

  /**
   * 7. Multipart Upload Utilities
   */
  async initiateMultipartUpload(objectKey: string, contentType: string): Promise<string> {
    return await minioClient.initiateNewMultipartUpload(
      this.defaultBucket,
      objectKey,
      { "Content-Type": contentType }
    );
  }

  async generatePresignedPartUrl(
    objectKey: string,
    uploadId: string,
    partNumber: string | number
  ): Promise<string> {
    return await minioClient.presignedUrl(
      "PUT",
      this.defaultBucket,
      objectKey,
      3600,
      { uploadId, partNumber: String(partNumber) }
    );
  }

  async completeMultipartUpload(
    objectKey: string,
    uploadId: string,
    sortedParts: { part: number; etag?: string }[]
  ) {
    return await minioClient.completeMultipartUpload(
      this.defaultBucket,
      objectKey,
      uploadId,
      sortedParts
    );
  }
}
