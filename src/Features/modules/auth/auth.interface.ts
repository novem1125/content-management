import { SessionType } from "./auth.repository";
import { userRegister, userResponse } from "./types/user.type";

export interface IAuthRepository {
    userRegister(userData: userRegister): Promise<userResponse>
    findByEmailOrPhone(value: string) : Promise<any>
    createSession(
        sessionToken: string,
        userId: string, // UUID
        userAgent?: string,
        userIp?: string
    ): Promise<SessionType>
    getSession(userId: string): Promise<SessionType | null>
    updateSession(
        sessionToken: string,
        userId: string,
        userAgent?: string,
        userIp?: string
    ): Promise<SessionType | null>
    updateFirebaseKey(userId: string, firebaseKey: string): Promise<any>
}