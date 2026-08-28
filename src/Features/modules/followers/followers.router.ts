import { Hono } from "hono";
import { AuthUser, authMiddleware } from "../../../common/auth.middleware";
import { followerController as FollowerController } from "./followers.controller";
import { followerReopsitory as FollowerRepository } from "./followers.repository";
import { followerService as FollowerService } from "./followers.service";

type Env = {
  Variables: {
    user: AuthUser;
  };
};
const followerRepo = new FollowerRepository();
const followerService = new FollowerService(followerRepo);
const followerController = new FollowerController(followerService);

export const followersRoutes = new Hono<Env>();

followersRoutes.use("*", authMiddleware);

followersRoutes.post("/create-follower", followerController.createFollow);
