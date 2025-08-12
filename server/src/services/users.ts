import db from '../utils/db';
import { hashPassword } from '../utils/hash';

export function getUserByEmail(email: string) {
    return db.user.findUnique({
        where: {
            email
        }
    });
}

export function createUserByEmailAndPassword(user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) {
    return db.user.create({
        data: {
            ...user,
            password: hashPassword(user.password)
        }
    });
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
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>
) {
    return db.user.update({
        where: { id },
        data
    });
}

export function updateUserPassword(id: string, password: string) {
    return db.user.update({
        where: { id },
        data: {
            password: hashPassword(password)
        }
    });
}
