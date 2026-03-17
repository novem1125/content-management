export type userRegister = {
    username: string;
    emailOrPhone?: string;
    // phone_no?: string;
    password: string;
    role_id?: string | null;
}

export interface userResponse {
    id?: string;
    username: string;
    email?: string | null;
    phone_no?: string | null;
    password?: string;
    role_id?: string | null;
    createdAt: Date | null;
    updatedAt?: Date | null;
    otp?: string | null;
    otp_expiry?: string | null;
    is_verified?: boolean;
}