import db from '../utils/db';
import { hashToken } from '../utils/auth';

export function addRefreshTokenToWhitelist({
    refreshToken,
    userId
}: {
    refreshToken: string;
    userId: string;
}) {
    return db.refreshToken.create({
        data: {
            hashedToken: hashToken(refreshToken),
            userId,
            expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
        }
    });
}

export function getRefreshToken(token: string) {
    return db.refreshToken.findUnique({
        where: {
            hashedToken: hashToken(token)
        }
    });
}

export function deleteRefreshTokenById(id: string) {
    return db.refreshToken.update({
        where: {
            id
        },
        data: {
            revoked: true
        }
    });
}

export function revokeTokens(userId: string) {
    return db.refreshToken.updateMany({
        where: {
            userId
        },
        data: {
            revoked: true
        }
    });
}
