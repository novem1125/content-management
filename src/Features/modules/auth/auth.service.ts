import dotenv from "dotenv";
dotenv.config({ path: ".env" }); // optional path if .env is in root
import { HttpError } from "../../../shared/constants/http";
import { generateJWT, JwtPayload } from "../../../utils/jwt";
import { AuthRepository, SessionType } from "./auth.repository";
import { userRegister, userResponse } from "./types/user.type";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid'
import type { Context } from 'hono'

export class AuthService {
    constructor(private authRepository: AuthRepository) { }


    async userRegister(body: userRegister): Promise<userResponse> {
        // 1️⃣ Ensure either email or phone is provided
        if (!body.emailOrPhone) {
            throw new HttpError(400, "INVALID_INPUT", "Email or phone number is required");
        }

        // 2️⃣ Check if a user already exists with that email or phone
        const existing = await this.authRepository.findByEmailOrPhone(body.emailOrPhone);
        if (existing) {
            throw new HttpError(409, "ALREADY_EXISTS", "User with this email or phone already exists");
        }

        // 3️⃣ Hash password
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // 4️⃣ Prepare user data for insertion with all required fields
        const userData: userRegister = {
            username: body.username!,
            password: hashedPassword,
            role_id: body.role_id ?? null, // default role if needed
            emailOrPhone: undefined,
            // phone_no: undefined,
        };

        // 5️⃣ Set either email or phone_no
        if (body.emailOrPhone.includes("@")) {
            userData.emailOrPhone = body.emailOrPhone;
        } else {
            userData.emailOrPhone = body.emailOrPhone;
        }

        // 6️⃣ Insert user
        const newUser = await this.authRepository.userRegister(userData);

        return newUser;
    }

    async login(
        emailOrPhone: string,
        password: string,
        firebaseKey?: string,
        userAgent?: string,
        userIp?: string
    ) {
        // 1️⃣ Find user
        const user = await this.authRepository.findByEmailOrPhone(emailOrPhone)

        if (!user) {
            throw new HttpError(401, 'INVALID_USER', 'Invalid email or phone number')
        }

        if (!user.is_active) {
            throw new HttpError(401, 'INVALID_USER', 'This User Not Active')

        }

        // 2️⃣ Update Firebase key if provided
        if (firebaseKey) {
            await this.authRepository.updateFirebaseKey(user.id, firebaseKey)
        }

        // 3️⃣ Verify password
        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if (!isPasswordMatch) {
            throw new HttpError(401, 'INVALID_PASSWORD', 'Invalid Password')

        }

        // 4️⃣ Handle session
        const sessionToken = uuidv4();
        const existingSession: SessionType | null = await this.authRepository.getSession(user.id)
        let newSession: any

        if (!existingSession) {
            newSession = await this.authRepository.createSession(sessionToken, user.id, userAgent, userIp)
        } else {
            newSession = await this.authRepository.updateSession(sessionToken, user.id, userAgent, userIp)
        }

        // 5️⃣ Generate JWT
        const payload: JwtPayload = {
            uuid: user.id,                     // you can also use user.uuid if available
            username: user.username,
            email: user.email ?? null,
            phone_no: user.phone_no ?? null,
            role_id: user.role_id ?? null,
            session: newSession.refreshToken,  // session token from DB
        };

        // Secret key from env
        const secretKey = process.env.SECRET_KEY!;
        const token = generateJWT(payload, secretKey);


        // 6️⃣ Return structured JSON
        return ({
            statusCode: 200,
            success: true,
            message: 'Login successful',
            data: {
                id: user.id,
                // uuid: user.uuid,
                name: user.username,
                email: user.email,
                // phone_no: user.phone_no,
                session: newSession.refreshToken,
                role_id: user.role_id,
                // role: user.roleId,
                // permissions: user.role?.permissions.map((p: { name: string }) => p.name)
            },
            token: token
        })
    }
}