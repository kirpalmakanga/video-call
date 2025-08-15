import db from '../db';
import { hashPassword } from '../utils/auth.utils';
import { type User } from '../../generated/prisma';
import { addHours } from '../utils/helpers.utils';

export async function createUser(user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) {
    return await db.user.create({
        data: {
            ...user,
            password: await hashPassword(user.password)
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

export function getUserById(id: string) {
    return db.user.findUnique({
        where: {
            id
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

export function setUserVerificationToken(
    email: string,
    verificationToken: string | null
) {
    return db.user.update({
        where: { email },
        data: {
            verificationToken,
            verificationTokenExpiry: verificationToken
                ? addHours(new Date(), 24)
                : null
        }
    });
}

export function getUserByVerificationToken(verificationToken: string) {
    return db.user.findFirst({
        where: {
            verificationToken,
            verificationTokenExpiry: {
                gt: new Date()
            }
        }
    });
}

export function setUserResetToken(email: string, resetToken: string | null) {
    return db.user.update({
        where: { email },
        data: {
            resetToken,
            resetTokenExpiry: resetToken ? addHours(new Date(), 1) : null
        }
    });
}

export function getUserByResetToken(resetToken: string) {
    return db.user.findFirst({
        where: {
            resetToken,
            resetTokenExpiry: {
                gt: new Date()
            }
        }
    });
}

export async function updateUserPassword(id: string, rawPassword: string) {
    return await db.user.update({
        where: { id },
        data: {
            password: await hashPassword(rawPassword),
            resetToken: null,
            resetTokenExpiry: null
        }
    });
}
