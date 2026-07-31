import { Context } from "hono";
import { CreateContentInput, UpdateContentInput, ParamIdInput } from "./content.schema";
import { ContentService } from "./contents.service";

export class ContentController {
  constructor(private contentService: ContentService) {}

  // 1. GET /api/contents/public
  getPublished = async (c: Context) => {
    try {
      const items = await this.contentService.getPublishedContents();
      return c.json({ success: true, data: items }, 200);
    } catch (err: any) {
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  };

  // 2. GET /api/contents/:id
  getById = async (c: Context) => {
    try {
      const { id } = c.req.valid("param" as never) as ParamIdInput;
      const item = await this.contentService.getContentById(id);
      return c.json({ success: true, data: item }, 200);
    } catch (err: any) {
      if (err.message === "NOT_FOUND") {
        return c.json({ success: false, message: "Content not found" }, 404);
      }
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  };

  // 3. POST /api/contents
  create = async (c: Context) => {
    try {
      const user = c.get("user"); // Set by auth middleware
      const body = c.req.valid("json" as never) as CreateContentInput;

      const newContent = await this.contentService.createContent(user.id, body);
      return c.json({ success: true, data: newContent }, 201);
    } catch (err: any) {
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  };

  // 4. PATCH /api/contents/:id
  update = async (c: Context) => {
    try {
      const { id } = c.req.valid("param" as never) as ParamIdInput;
      const body = c.req.valid("json" as never) as UpdateContentInput;
      const user = c.get("user");

      const updated = await this.contentService.updateContent(id, user, body);
      return c.json({ success: true, data: updated }, 200);
    } catch (err: any) {
      if (err.message === "NOT_FOUND") {
        return c.json({ success: false, message: "Content not found" }, 404);
      }
      if (err.message === "UNAUTHORIZED") {
        return c.json({ success: false, message: "Forbidden: You do not have permission to update this content" }, 403);
      }
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  };

  // 5. DELETE /api/contents/:id
  delete = async (c: Context) => {
    try {
      const { id } = c.req.valid("param" as never) as ParamIdInput;
      const user = c.get("user");

      await this.contentService.deleteContent(id, user);
      return c.json({ success: true, message: "Content deleted successfully" }, 200);
    } catch (err: any) {
      if (err.message === "NOT_FOUND") {
        return c.json({ success: false, message: "Content not found" }, 404);
      }
      if (err.message === "UNAUTHORIZED") {
        return c.json({ success: false, message: "Forbidden: You do not have permission to delete this content" }, 403);
      }
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  };
}