export type createContent = {
  title: string;
  photo?: string[];
  video?: string[];
  owner_id: string;
};
export interface Content {
  id: string;
  title: string;
  photo: string[];
  video: string[];
  photoUrls?: string[];
  videoUrls?: string[];
  owner_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
