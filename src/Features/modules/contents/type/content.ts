export type createContent = {
  title: string;
  photo: string[];
  owner_id: string;
};
export interface Content {
  id: string;
  title: string;
  photo: string[];
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}
