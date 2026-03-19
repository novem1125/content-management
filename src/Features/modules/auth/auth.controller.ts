import { Context } from "hono";
import { http_status } from "../../../shared/constants/http";
import { AuthService } from "./auth.service";
import { userRegister } from "./types/user.type";

export class AuthController {
    constructor(private authService: AuthService) { }

    async userRegister(body: userRegister) {
        try {
            const user = await this.authService.userRegister(body);

            if (!user) {
                return {
                    statusCode: http_status.BadRequest,
                    success: false,
                    message: "User registration failed",
                };
            }

            return {
                statusCode: http_status.Created,
                success: true,
                message: "User registered successfully",
                data: user,
            };
        } catch (error: any) {
            // check for duplicate email error
            if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
                return {
                    statusCode: http_status.Conflict, // 409
                    success: false,
                    message: "Email already exists",
                };
            }

            console.error(error);
            return {
                statusCode: http_status.InternalServerError, // 500
                success: false,
                message: error.message || "Internal Server Error",
            };
        }
    }
    async userLogin(c: Context<any, any, {}>, body: { emailOrPhone: string, password: string }) {
        try {
            const response = await this.authService.login(                // ✅ Context
                body.emailOrPhone,  // ✅ email or phone
                body.password       // ✅ password
            );
            if (!response) {
                return { statusCode: false, message: "Data Not Found" }
            }
            return response

        } catch (error: any) {
            console.error(error);
            return {
                statusCode: http_status.InternalServerError,
                success: false,
                message: error.message || "Internal Server Error",
            };
        }
    }
}