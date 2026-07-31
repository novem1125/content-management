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

// 🌐 Public Endpoints (No Auth Required)
contentRoutes.get("/public", contentController.getPublished);
contentRoutes.get("/:id", zValidator("param", paramIdSchema), contentController.getById);

// 🔒 Protected Endpoints (Requires Valid JWT / Session)
contentRoutes.post(
  "/",
  authMiddleware, // 👈 Auth Guard
  zValidator("json", createContentSchema),
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