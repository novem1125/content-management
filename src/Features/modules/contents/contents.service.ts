import { CreateContentInput, UpdateContentInput } from "./content.schema";
import { ContentRepository } from "./contents.repository";
import { Content } from "./type/content";

export class ContentService {
  constructor(private contentRepo: ContentRepository) {}

  // 1. Get all published contents (Public Feed)
  async getPublishedContents() {
    return await this.contentRepo.findPublished();
  }

  // 2. Get single content item by ID
  async getContentById(id: number) {
    const content = await this.contentRepo.findById(id);
    if (!content) {
      throw new Error("NOT_FOUND");
    }
    return content;
  }

  // 3. Create content
  async createContent(ownerId: string, input: CreateContentInput):Promise<Content> {
    return await this.contentRepo.create(ownerId, input);
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

    return await this.contentRepo.update(id, input);
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