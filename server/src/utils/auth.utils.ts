import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

export function validatePassword(
    targetPassword: string,
    storedPassword: string
) {
    return compare(targetPassword, storedPassword);
}

export function hashPassword(password: string) {
    return hash(password, 12);
}

export function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export function createVerificationToken() {
    return randomBytes(32).toString('hex');
}
