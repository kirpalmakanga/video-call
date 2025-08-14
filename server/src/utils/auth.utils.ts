import type { Request } from 'express';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

export function getAuthToken(req: Request) {
    const {
        headers: { authorization }
    } = req;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new Error('Invalid authorization');
    }

    const token = authorization.split(' ')[1];

    if (!token) {
        throw new Error('Invalide authorization token');
    }

    return token;
}

export function validatePassword(
    targetPassword: string,
    storedPassword: string
) {
    return compare(targetPassword, storedPassword);
}

export function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string) {
    return hash(password, 12);
}

export function createVerificationToken() {
    return randomBytes(32).toString('hex');
}
