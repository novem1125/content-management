import { CreateContentInput, UpdateContentInput } from "./content.schema";
import { ContentRepository } from "./contents.repository";
import { Content } from "./type/content";
import { publishContentCreatedEvent } from "../../../core/kafka";
import { MediaService } from "../../../config/media.config";
import config from "../../../config/appsetting";
import crypto from "crypto";

/**
 * Sanitizes an incoming URL or path string to ensure only the clean MinIO object key/path is stored in the DB.
 * E.g., "http://minio:9000/mybucket/photos/sample.jpg?X-Amz-Signature=..." -> "photos/sample.jpg"
 */
function sanitizeMinioPath(pathOrUrl: string): string {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  try {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      const parsed = new URL(pathOrUrl);
      let pathname = parsed.pathname;
      if (pathname.startsWith("/")) pathname = pathname.slice(1);

      const bucketName = config.minio.bucketName;
      if (bucketName && pathname.startsWith(`${bucketName}/`)) {
        pathname = pathname.slice(bucketName.length + 1);
      }
      return pathname;
    }
  } catch {
    // Ignore URL parse failures and process as standard string path
  }

  const queryIndex = pathOrUrl.indexOf("?");
  let cleanPath = queryIndex !== -1 ? pathOrUrl.substring(0, queryIndex) : pathOrUrl;

  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.slice(1);
  }

  const bucketName = config.minio.bucketName;
  if (bucketName && cleanPath.startsWith(`${bucketName}/`)) {
    cleanPath = cleanPath.slice(bucketName.length + 1);
  }

  return cleanPath;
}

export class ContentService {
  private mediaService = new MediaService();

  constructor(private contentRepo: ContentRepository) {}

  /**
   * Uploads photo or video directly to MinIO and returns the clean path and presigned URL.
   * Handles Web API File, Blob, Buffer, and Postman multipart files.
   */
  async uploadMedia(file: any) {
    let buffer: Buffer;
    let fileName = "file";
    let contentType = "application/octet-stream";

    if (file && typeof file.arrayBuffer === "function") {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = file.name || "file";
      contentType = file.type || "application/octet-stream";
    } else if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file && file.buffer) {
      buffer = Buffer.from(file.buffer);
      fileName = file.originalname || file.name || "file";
      contentType = file.mimetype || file.type || "application/octet-stream";
    } else {
      throw new Error("Invalid file object received for upload");
    }

    const isVideo = contentType.startsWith("video/");
    const folder = isVideo ? "videos" : "photos";
    const sanitizeFilename = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, "_") : "file";
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFilename}`;
    const bucket = config.minio.bucketName || "";

    const key = await this.mediaService.uploadToMinio(bucket, folder, uniqueFileName, buffer, contentType);
    
    let presignedUrl = "";
    try {
      presignedUrl = await this.mediaService.generatePresignedUrl(bucket, key);
    } catch {
      presignedUrl = key;
    }

    return {
      path: key,
      type: isVideo ? "video" : "photo",
      presignedUrl,
    };
  }

  /**
   * Dynamically resolves stored MinIO object keys to presigned access URLs when returning to client.
   */
  private async enrichWithPresignedUrls(content: Content): Promise<Content> {
    if (!content) return content;

    const bucket = config.minio.bucketName || "";

    const photoUrls = await Promise.all(
      (content.photo || []).map(async (key) => {
        try {
          return await this.mediaService.generatePresignedUrl(bucket, key);
        } catch {
          return key;
        }
      })
    );

    const videoUrls = await Promise.all(
      (content.video || []).map(async (key) => {
        try {
          return await this.mediaService.generatePresignedUrl(bucket, key);
        } catch {
          return key;
        }
      })
    );

    return {
      ...content,
      photoUrls,
      videoUrls,
    };
  }

  // 1. Get all published contents (Public Feed)
  async getPublishedContents() {
    const contents = await this.contentRepo.findPublished();
    return await Promise.all(
      contents.map((item) => this.enrichWithPresignedUrls(item!))
    );
  }

  // 2. Get single content item by ID
  async getContentById(id: number) {
    const content = await this.contentRepo.findById(id);
    if (!content) {
      throw new Error("NOT_FOUND");
    }
    return await this.enrichWithPresignedUrls(content);
  }

  // 3. Create content
  async createContent(ownerId: string, input: CreateContentInput): Promise<Content> {
    const sanitizedInput: CreateContentInput = {
      ...input,
      photo: (input.photo || []).map(sanitizeMinioPath).filter(Boolean),
      video: (input.video || []).map(sanitizeMinioPath).filter(Boolean),
    };

    const newContent = await this.contentRepo.create(ownerId, sanitizedInput);

    // Publish event to Kafka with raw MinIO object paths
    await publishContentCreatedEvent({
      id: Number(newContent.id),
      title: newContent.title,
      photo: newContent.photo,
      video: newContent.video,
      ownerId: newContent.owner_id,
      status: newContent.status,
      createdAt: newContent.created_at,
      updatedAt: newContent.updated_at,
    });

    return await this.enrichWithPresignedUrls(newContent);
  }

  // 4. Update content (Checks ownership / role permissions)
  async updateContent(
    id: number,
    user: { id: string; role: string },
    input: UpdateContentInput
  ) {
    const existing = await this.contentRepo.findById(id);
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    const isAdminOrEditor = ["Admin", "Editor"].includes(user.role);
    const isOwner = existing.owner_id === user.id;

    if (!isAdminOrEditor && !isOwner) {
      throw new Error("UNAUTHORIZED");
    }

    const sanitizedInput: UpdateContentInput = {
      ...input,
      ...(input.photo ? { photo: input.photo.map(sanitizeMinioPath).filter(Boolean) } : {}),
      ...(input.video ? { video: input.video.map(sanitizeMinioPath).filter(Boolean) } : {}),
    };

    const updated = await this.contentRepo.update(id, sanitizedInput);
    return updated ? await this.enrichWithPresignedUrls(updated) : null;
  }

  // 5. Delete content (Checks ownership / role permissions)
  async deleteContent(id: number, user: { id: string; role: string }) {
    const existing = await this.contentRepo.findById(id);
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    const isAdmin = user.role === "Admin";
    const isOwner = existing.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new Error("UNAUTHORIZED");
    }

    return await this.contentRepo.delete(id);
  }
}