import { eq, desc } from "drizzle-orm";
import { CreateContentInput, UpdateContentInput } from "./content.schema";
import { db } from "../../../db/db.config";
import { contents } from "../../../db/schema";
import { Content } from "./type/content";

export class ContentRepository {
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
      .where(eq(contents.status, "published"))
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

  async create(ownerId: string, data: CreateContentInput): Promise<Content> {
    const [newContent] = await db
      .insert(contents)
      .values({
        title: data.title,
        photo: data.photo ?? [],
        video: data.video ?? [],
        status: data.status ?? "draft",
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
