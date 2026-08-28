import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export const authPlugin = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        message: "Unauthorized",
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verify(
      token,
      c.env.JWT_SECRET,
      "HS256"
    );

    c.set("user", payload);

    await next();
  } catch {
    return c.json(
      {
        success: false,
        message: "Invalid or expired token",
      },
      401
    );
  }
};