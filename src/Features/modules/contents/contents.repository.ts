import { eq, desc } from "drizzle-orm";
import { CreateContentInput, UpdateContentInput } from "./content.schema";
import { db } from "../../../db/db.config";
import { contents } from "../../../db/schema";
import { Content } from "./type/content";
import { IContentRepository } from "./contents.interface";
import { title } from "process";
import { MediaService } from "../../../config/media.config";
const mediaService = new MediaService();
export class ContentRepository implements IContentRepository {
  private mapToContent(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      owner_id: row.ownerId ?? row.owner_id ?? null,
      created_at: row.createdAt ?? row.created_at ?? null,
      updated_at: row.updatedAt ?? row.updated_at ?? null,
      title: row.title,
      photo: row.photo ?? null,
      video: row.video ?? null,
      status: row.status,
    } as Content;
  }
  async findPublished() {
    const rows = await db
      .select()
      .from(contents)
      .where(eq(contents.status, "all"))
      .orderBy(desc(contents.createdAt));
    return rows.map(this.mapToContent);
  }

  async findById(id: number) {
    const [result] = await db
      .select()
      .from(contents)
      .where(eq(contents.id, id))
      .limit(1);
    return this.mapToContent(result);
  }
  async getByUserId(ownerId: string): Promise<Content[]> {
    const content = await db
      .select({
        id: contents.id,
        title: contents.title,
        photo: contents.photo,
        video: contents.video,
        owner_id: contents.ownerId,
        status: contents.status,
        created_at: contents.createdAt,
        updated_at: contents.updatedAt,
      })
      .from(contents)
      .where(eq(contents.ownerId, ownerId));

    return Promise.all(
      content.map(async (item) => ({
        ...item,
        owner_id: item.owner_id ?? ownerId,
        id: String(item.id),
        created_at: item.created_at ?? new Date(),
        updated_at: item.updated_at ?? new Date(),
        photo: item.photo ?? [],
        video: item.video ?? [],
        // photoUrls: await Promise.all(
        //   (item.photo ?? []).map((path) =>
        //     mediaService.generatePresignedUploadUrl(path),
        //   ),
        // ),
        // videoUrls: await Promise.all(
        //   (item.video ?? []).map((path) =>
        //     mediaService.generatePresignedUploadUrl(path),
        //   ),
        // ),
      })),
    );
  }
  async create(ownerId: string, data: CreateContentInput): Promise<Content> {
    const [newContent] = await db
      .insert(contents)
      .values({
        title: data.title,
        photo: data.photo ?? [],
        video: data.video ?? [],
        status: data.status ?? "friends",
        ownerId,
      })
      .returning();

    return this.mapToContent(newContent)!;
  }

  async update(id: number, data: UpdateContentInput) {
    const [updated] = await db
      .update(contents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();
    return this.mapToContent(updated);
  }

  async delete(id: number) {
    const [deleted] = await db
      .delete(contents)
      .where(eq(contents.id, id))
      .returning();
    return this.mapToContent(deleted);
  }
}
