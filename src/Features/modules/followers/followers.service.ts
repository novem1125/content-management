import { followerReopsitory } from "./followers.repository";
import { createFollower, Response } from "./types/follower";

export class followerService {
  constructor(private followerRepository: followerReopsitory) {}
  async createFollower(data: createFollower): Promise<Response> {
    try {
      const created = await this.followerRepository.followUser(data);
      if (!created) {
        return {
          status: false,
          message: "Already following this user",
        };
      }
      return {
        status: true,
        message: "User followed successfully",
        data: created,
      };
    } catch (err: any) {
      return {
        status: false,
        message: err.message || "Failed to follow user",
      };
    }
  }
}
