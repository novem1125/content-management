import { createFollower, createFollowerResponse } from "./types/follower";

export interface IFollowerRepository {
  followUser(data: createFollower): Promise<createFollowerResponse | null>;
}
