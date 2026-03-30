import { SessionType } from "./auth.repository";
import { userRegister, userResponse } from "./types/user.type";

export interface IAuthRepository {
    userRegister(userData: userRegister): Promise<userResponse>
    findByEmailOrPhone(value: string) : Promise<any>
    updateVerified(userId: string, isVerified: boolean): Promise<userResponse | any> 
    updateOtp(sessionId: string, otp: string, expiry: Date):Promise<any> 
    sendOtpEmail(to: string, otp: string):Promise<any>
    markOtpVerified(sessionId: string):Promise<any>
    getSessionById(sessionId: string):Promise<any>

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
    updateVerified(userId: string, isVerified: boolean): Promise<userResponse | null>
}