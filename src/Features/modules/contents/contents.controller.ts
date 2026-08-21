import { Context } from "hono";
import {
  CreateContentInput,
  UpdateContentInput,
  ParamIdInput,
} from "./content.schema";
import { ContentService } from "./contents.service";

export class ContentController {
  constructor(private contentService: ContentService) {}

  // 1. GET /api/contents/public
  getPublished = async (c: Context) => {
    try {
      const items = await this.contentService.getPublishedContents();
      return c.json({ success: true, data: items }, 200);
    } catch (err: any) {
      console.error("getPublished Error:", err);
      return c.json({ success: false, message: err.message || "Internal server error" }, 500);
    }
  };

  // 2. GET /api/contents/:id
  getById = async (c: Context) => {
    try {
      const { id } = c.req.valid("param" as never) as ParamIdInput;
      const item = await this.contentService.getContentById(id);
      return c.json({ success: true, data: item }, 200);
    } catch (err: any) {
      console.error("getById Error:", err);
      if (err.message === "NOT_FOUND") {
        return c.json({ success: false, message: "Content not found" }, 404);
      }
      return c.json({ success: false, message: err.message || "Internal server error" }, 500);
    }
  };

  // 3. POST /api/contents/upload (Upload photo or video directly to MinIO)
  upload = async (c: Context) => {
    try {
      const body = (await c.req.parseBody({ all: true }).catch(() => ({}))) as Record<
        string,
        string | File | (string | File)[]
      >;
      const file = body["file"];

      if (!file || typeof file === "string") {
        return c.json(
          { success: false, message: "No file uploaded. Expected form field 'file'" },
          400
        );
      }

      const result = await this.contentService.uploadMedia(file);
      return c.json({ success: true, data: result }, 201);
    } catch (err: any) {
      console.error("Upload Controller Error:", err);
      return c.json(
        { success: false, message: err.message || "Failed to upload file to MinIO" },
        500
      );
    }
  };

  // 4. POST /api/contents
  create = async (c: Context) => {
    try {
      const user = c.get("user"); // Set by auth middleware
      const userId = user?.id || user?.uuid;
      if (!userId) {
        return c.json(
          { success: false, message: "Unauthorized: User ID missing from request context" },
          401
        );
      }

      const body = c.get("validJson") || (await c.req.parseBody({ all: true }).catch(() => ({})));

      const newContent = await this.contentService.createContent(
        userId,
        body
      );
      return c.json({ success: true, data: newContent }, 201);
    } catch (err: any) {
      console.error("Create Content Error:", err);
      return c.json({ success: false, message: err.message || "Internal server error" }, 500);
    }
  };

  // 5. PATCH /api/contents/:id
  update = async (c: Context) => {
    try {
      const { id } = c.req.valid("param" as never) as ParamIdInput;
      const body = c.req.valid("json" as never) as UpdateContentInput;
      const user = c.get("user");

      const updated = await this.contentService.updateContent(id, user, body);
      return c.json({ success: true, data: updated }, 200);
    } catch (err: any) {
      console.error("Update Content Error:", err);
      if (err.message === "NOT_FOUND") {
        return c.json({ success: false, message: "Content not found" }, 404);
      }
      if (err.message === "UNAUTHORIZED") {
        return c.json(
          {
            success: false,
            message:
              "Forbidden: You do not have permission to update this content",
          },
          403
        );
      }
      return c.json({ success: false, message: err.message || "Internal server error" }, 500);
    }
  };

  // 6. DELETE /api/contents/:id
  delete = async (c: Context) => {
    try {
      const { id } = c.req.valid("param" as never) as ParamIdInput;
      const user = c.get("user");

      await this.contentService.deleteContent(id, user);
      return c.json(
        { success: true, message: "Content deleted successfully" },
        200
      );
    } catch (err: any) {
      console.error("Delete Content Error:", err);
      if (err.message === "NOT_FOUND") {
        return c.json({ success: false, message: "Content not found" }, 404);
      }
      if (err.message === "UNAUTHORIZED") {
        return c.json(
          {
            success: false,
            message:
              "Forbidden: You do not have permission to delete this content",
          },
          403
        );
      }
      return c.json({ success: false, message: err.message || "Internal server error" }, 500);
    }
  };
}
