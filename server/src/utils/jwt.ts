import { jwtVerify, SignJWT } from 'jose';
import crypto from 'crypto';
import { assertIsDefined } from '../../../utils/assert';

const { JWT_ACCESS_SECRET, JWT_ISSUER, JWT_AUDIENCE } = process.env;

function getSecretKey(secret: string) {
    return new TextEncoder().encode(secret);
}

export async function generateAccessToken(user: User) {
    assertIsDefined(JWT_ACCESS_SECRET);
    assertIsDefined(JWT_ISSUER);
    assertIsDefined(JWT_AUDIENCE);

    const jwt = await new SignJWT({ id: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(getSecretKey(JWT_ACCESS_SECRET));

    return jwt;
}

export function generateRefreshToken() {
    return crypto.randomBytes(16).toString('base64url');
}

export async function generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
}> {
    return {
        accessToken: await generateAccessToken(user),
        refreshToken: generateRefreshToken()
    };
}

export async function authenticate(accessToken: string) {
    assertIsDefined(JWT_ACCESS_SECRET);
    assertIsDefined(JWT_ISSUER);
    assertIsDefined(JWT_AUDIENCE);

    return await jwtVerify(accessToken, getSecretKey(JWT_ACCESS_SECRET), {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
    });
}

export async function getUserIdFromToken(accessToken: string) {
    const { payload } = await authenticate(accessToken);

    return payload.id as string;
}
