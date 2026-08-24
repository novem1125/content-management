import { z } from "zod";

// 1. Schema for creating content
export const createContentSchema = z.object({
  title: z
    .string({
      error: "Title is required",
    })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title cannot exceed 255 characters"),

  // Array of image URLs or file paths (defaults to empty array if omitted)
  photo: z
    .array(z.string({ error: "Each photo must be a string" }))
    .optional()
    .default([]),

  // Array of video URLs or file paths (defaults to empty array if omitted)
  video: z
    .array(z.string({ error: "Each video must be a string" }))
    .optional()
    .default([]),

  status: z.enum(["only_me", "all", "friends"]).default("friends"),
});

// 2. Schema for updating content (all fields optional)
export const updateContentSchema = createContentSchema.partial();

// 3. Schema for path parameter ID validation (e.g., /contents/:id)
export const paramIdSchema = z.object({
  id: z.coerce
    .number({ error: "ID must be a valid number" })
    .int("ID must be an integer")
    .positive("ID must be a positive number"),
});

// ------------------
// Export Types
// ------------------
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ParamIdInput = z.infer<typeof paramIdSchema>; // { id: number }
