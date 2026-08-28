import { Context } from "hono";
import { followerService } from "./followers.service";
import { createFollower } from "./types/follower";

export class followerController {
  constructor(private followerService: followerService) {}
  createFollow = async (c: Context) => {
    try {
      const body = (await c.req.json()) as createFollower;
      const user = c.get("user"); // Set by auth middleware
      if (!user) {
        return c.json(
          { success: false, message: "Unauthorized: Missing user session" },
          401,
        );
      }
      const userId = user.id || user.uuid;
      body.follower_id = userId;

      const createdfollower = await this.followerService.createFollower(body);
      const statusCode = createdfollower.status ? 200 : 400;
      return c.json(createdfollower, statusCode);
    } catch (err: any) {
      console.error("createFollow Error:", err);
      return c.json(
        { success: false, message: err.message || "Internal server error" },
        500,
      );
    }
  };
}
