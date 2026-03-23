import s3Client from "../core/s3Client";
import { GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { minioClient } from "../core/minio";
import config from "../config/appsetting"

export class MediaService {

  async generatePresignedUploadUrl(objectKey: string, contentType: string)
  {
    const putObjectCommand = new PutObjectCommand({
      Bucket: config.minio.bucketName,
      Key: objectKey,
      ContentType: contentType
    })
    const url = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 })
    return url
  }

  async initiateMultipartUpload(objectKey: string, contentType: string) 
  {
    const uploadId = await minioClient.initiateNewMultipartUpload(
      config.minio.bucketName!,
      objectKey,
      { "Content-Type": contentType }
    )

    return uploadId
  }

  async getIncompleteUploadLists()
  {
    const incompleteStream = minioClient.listIncompleteUploads(config.minio.bucketName!, '', true)
    const incomplete: any[] = []
    for await (const u of incompleteStream) {
      // if (Date.now() - u.initiated.getTime() > 24*60*60*1000) {
        await minioClient.abortMultipartUpload(config.minio.bucketName!, u.key, u.uploadId);
      // }
      incomplete.push(u)
    }
    return incomplete
  }

  async generatePresignedPartUrl(objectKey: string, uploadId: string, partNumber: string) 
  {
    const url = await minioClient.presignedUrl(
      "PUT",
      config.minio.bucketName!,
      objectKey,
      60 * 60, // 1 hour
      { uploadId, partNumber }
    )
    return url
  }

  async completeMultipartUpload(objectKey: string, uploadId: string, sortedParts : { part: number, etag?: string | undefined }[])
  {
    const result = await minioClient.completeMultipartUpload(
        config.minio.bucketName!,
        objectKey,
        uploadId,
        sortedParts
      );
    return result
  }

  async downloadFromS3(key: string, outputDir: string) 
  {
    const command = new GetObjectCommand({
      Bucket: config.minio.bucketName,
      Key: key
    })
    const response = await s3Client.send(command);
    const filePath = path.join(outputDir, path.basename(key));
    await pipeline(
      response.Body as NodeJS.ReadableStream,
      createWriteStream(filePath)
    );

    return filePath;
  }

  async uploadToMinio(
    bucket: string,
    path: string,
    fileName: string,
    file: Buffer,
    contentType: string
  ) {
    try {      
      const objectName = `${path}/${fileName}`;
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: config.minio.bucketName,
          Key: objectName,
          Body: file,
          ContentType: contentType,
        },
      });

      await upload.done();
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to upload file to Minio: ${error}`);
    }

    return `${path}/${fileName}`;
  }

  async generatePresignedUrl(
    bucket: string,
    objectKey: string
  ): Promise<string> {
    
    const getObjectCommand = new GetObjectCommand({
      Bucket: config.minio.bucketName,
      Key: objectKey,
    });

    // Max expiration is 604800 seconds (7 days)
    const url = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 604800,
    });
    return url;
  }

  async updateToMinio( bucket: string, fileName: string, file: Buffer, contentType: string ) 
  {
    try {
      await s3Client.send( new DeleteObjectCommand({ Bucket: config.minio.bucketName, Key: fileName }) )
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: config.minio.bucketName,
          Key: fileName,
          Body: file,
          ContentType: contentType
        }
      })
      await upload.done()
    }catch (e) { 
      throw new Error(`Failed to upload file to Minio: ${e}`)
    }
    return `${fileName}`
  }

  async deleteMinio(bucket: string, fileName: string) 
  {
    try {
      await s3Client.send( new DeleteObjectCommand({ Bucket: config.minio.bucketName, Key: fileName }) )
    }catch (error) { 
      throw new Error(`Failed to delete file to Minio: ${error}`)
    }
    return `${fileName}`
  }

}
