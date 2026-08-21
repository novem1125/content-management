import { Hono } from "hono";

import { createContentSchema, updateContentSchema, paramIdSchema } from "./content.schema";
import { authMiddleware, AuthUser } from "../../../common/auth.middleware";
import { ContentRepository } from "./contents.repository";
import { ContentService } from "./contents.service";
import { ContentController } from "./contents.controller";
import { zValidator } from "@hono/zod-validator";

type Env = {
  Variables: {
    user: AuthUser;
  };
};

const contentRepo = new ContentRepository();
const contentService = new ContentService(contentRepo);
const contentController = new ContentController(contentService);

export const contentRoutes = new Hono<Env>();

// Helper function to process photo or video fields (handling strings, arrays, or uploaded Files)
const processMediaField = async (fieldValue: any): Promise<string[]> => {
  if (fieldValue === undefined || fieldValue === null) {
    return [];
  }
  const items = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
  const processedPaths: string[] = [];

  for (const item of items) {
    if (typeof item === "string") {
      processedPaths.push(item);
    } else if (item && typeof item === "object") {
      // Direct File upload from multipart form data (Postman / HTML forms)
      const uploaded = await contentService.uploadMedia(item);
      processedPaths.push(uploaded.path);
    }
  }

  return processedPaths;
};

// 🌐 Public Endpoints (No Auth Required)
contentRoutes.get("/public", contentController.getPublished);
contentRoutes.get("/:id", zValidator("param", paramIdSchema), contentController.getById);

// 🔒 Protected Endpoints (Requires Valid JWT / Session)
const validateCreateContent = async (c: any, next: any) => {
  let body: any = {};
  try {
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await c.req.json();
    } else {
      body = await c.req.parseBody({ all: true });
    }
  } catch (err) {
    console.error("[validateCreateContent] Body Parse Error:", err);
    body = {};
  }

  try {
    if (body.photo !== undefined) {
      body.photo = await processMediaField(body.photo);
    }
    if (body.video !== undefined) {
      body.video = await processMediaField(body.video);
    }

    const result = createContentSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.error.issues.map((issue) => issue.message).join(", "),
          errors: result.error.issues,
        },
        400
      );
    }

    c.set("validJson", result.data);
    await next();
  } catch (err: any) {
    console.error("[validateCreateContent] Middleware Error:", err);
    return c.json(
      { success: false, message: err.message || "Internal server error during content validation" },
      500
    );
  }
};

contentRoutes.post("/upload", authMiddleware, contentController.upload);

contentRoutes.post(
  "/",
  authMiddleware, // 👈 Auth Guard
  validateCreateContent,
  contentController.create
);

contentRoutes.patch(
  "/:id",
  authMiddleware, // 👈 Auth Guard
  zValidator("param", paramIdSchema),
  zValidator("json", updateContentSchema),
  contentController.update
);

contentRoutes.delete(
  "/:id",
  authMiddleware, // 👈 Auth Guard
  zValidator("param", paramIdSchema),
  contentController.delete
);