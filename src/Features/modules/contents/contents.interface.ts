import { CreateContentInput } from "./content.schema";
import { Content } from "./type/content";

export interface IContentRepository {
     create(ownerId: string, data: CreateContentInput): Promise<Content>;
     getByUserId(ownerId: string): Promise<Content[]>;
}