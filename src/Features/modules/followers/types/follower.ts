export type createFollower = {
  id?: string;
  user_id?: string;
  follower_id?: string;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface createFollowerResponse {
  id: string;
  userId: string;
  followerId: string;
  status:boolean;
  user?:any;
  created_at: string;
  updated_at: string;
}
export interface Response {
  status: boolean;
  message: string;
  data?: Object;
}
