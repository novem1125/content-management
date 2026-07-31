import { z } from "zod";

// 1. Schema for creating content
export const createContentSchema = z.object({
  title: z
    .string()
    .nonempty("Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title cannot exceed 255 characters"),
  
  // Array of valid image URLs
  photo: z
    .array(z.string().url("Each item must be a valid image URL"))
    .min(1, "At least one photo URL is required"),

  status: z
    .enum(["draft", "published", "archived"])
    .default("draft"),
});

// 2. Schema for updating content (makes all fields optional)
export const updateContentSchema = createContentSchema.partial();

// 3. Schema for path parameter ID validation
export const paramIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "ID must be a valid positive number",
    }),
});

// ------------------
// Export Types
// ------------------
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ParamIdInput = z.infer<typeof paramIdSchema>;