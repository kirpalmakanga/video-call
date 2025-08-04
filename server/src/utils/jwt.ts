import jwt, { type JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';

const { JWT_ACCESS_SECRET } = process.env;

export function generateAccessToken(userId: string) {
    return jwt.sign({ userId }, JWT_ACCESS_SECRET as string, {
        expiresIn: '1h'
    });
}

export function generateRefreshToken() {
    const token = crypto.randomBytes(16).toString('base64url');

    return token;
}

export function generateTokens(userId: string) {
    return {
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken()
    };
}

export function getUserIdForToken(accessToken: string) {
    const { userId } = jwt.verify(
        accessToken,
        JWT_ACCESS_SECRET as string
    ) as JwtPayload;

    return userId as string;
}
