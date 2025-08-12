import bcrypt from 'bcrypt';
import crypto from 'crypto';

export function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string) {
    return bcrypt.hashSync(password, 12);
}
