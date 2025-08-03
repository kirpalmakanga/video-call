import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const { JWT_ACCESS_SECRET } = process.env;

export function generateAccessToken(user) {
    return jwt.sign({ userId: user.id }, JWT_ACCESS_SECRET as string, {
        expiresIn: '1h'
    });
}

export function generateRefreshToken() {
    const token = crypto.randomBytes(16).toString('base64url');

    return token;
}

export function generateTokens(user) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken()
    };
}
