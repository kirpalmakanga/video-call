import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

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
