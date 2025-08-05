import jwt, { type JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';

const { JWT_ACCESS_SECRET } = process.env;

export function generateAccessToken(user: User) {
    return jwt.sign(user, JWT_ACCESS_SECRET as string, {
        expiresIn: '1h'
    });
}

export function generateRefreshToken() {
    const token = crypto.randomBytes(16).toString('base64url');

    return token;
}

export function generateTokens(user: User) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken()
    };
}

export function getUserFromToken(accessToken: string) {
    const user = jwt.verify(
        accessToken,
        JWT_ACCESS_SECRET as string
    ) as JwtPayload;

    return user as User;
}
