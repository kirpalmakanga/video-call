import db from '../db';
import { hashPassword } from '../utils/auth.utils';
import { type User } from '../../generated/prisma';

export async function createUser(user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    verificationToken: string;
}) {
    return await db.user.create({
        data: {
            ...user,
            password: await hashPassword(user.password)
        }
    });
}

export function getUserByEmail(email: string) {
    return db.user.findUnique({
        where: {
            email
        }
    });
}

export function getUserByVerificationToken(verificationToken: string) {
    return db.user.findFirst({ where: { verificationToken } });
}

export function getUserById(id: string) {
    return db.user.findUnique({
        where: {
            id
        }
    });
}

export function updateUser(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password'>>
) {
    return db.user.update({
        where: { id },
        data
    });
}

export function updateUserVerificationToken(
    email: string,
    verificationToken: string
) {
    return db.user.update({
        where: { email },
        data: { verificationToken }
    });
}

export async function updateUserPassword(id: string, password: string) {
    return await db.user.update({
        where: { id },
        data: {
            password: await hashPassword(password)
        }
    });
}
