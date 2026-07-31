import { Hono } from "hono";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";

const router = new Hono();

// Create service and controller instances
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Route: POST /user-register
router.post("/register", async (c) => {
    const body = await c.req.json();
    console.log(body);
    const user = await authController.userRegister(body);
    return c.json(user, 201);
});

router.post("/login", async (c) => {
    const body = await c.req.json();
    const user = await authController.userLogin(c, body);
    return c.json(user);
});
router.post("/google/login", async (c) => {
    const body = await c.req.json(); // get request body
    const user = await authController.googleLogin(c, body);
    return c.json(user);
});
router.put("/two-factor", async (c) => {
    const body = await c.req.json(); // get request body
    return await authController.updateUser2FactorVerified(c, body);
})

router.post("/send-otp", async (c) => {

    return await authController.sendOtp(c);
});
router.post("/verify-otp", async (c) => {
    const body = await c.req.json(); // get request body

    return await authController.verifyOtp(c, body)
});
router.post("/forgot-password/send-otp", async (c) => {
    try {
        const body = await c.req.json(); // get request body

        return await authController.sendOtpForForgotPassword(c, body);
    } catch (error) {
        console.error(error);
    }
});

export default router;