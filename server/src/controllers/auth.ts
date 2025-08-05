import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateTokens } from '../utils/jwt';
import {
    addRefreshTokenToWhitelist,
    getRefreshToken,
    deleteRefreshTokenById,
    revokeTokens
} from '../services/auth';
import {
    getUserByEmail,
    createUserByEmailAndPassword,
    getUserById
} from '../services/users';
import { omit } from '../utils/helpers';

interface RegisterRequest {}

export async function register(
    { body }: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { email, password } = body;

        if (!email || !password) {
            res.status(400);

            throw new Error('You must provide an email and a password.');
        }

        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            res.status(400);

            throw new Error('Email already in use.');
        }

        const user = await createUserByEmailAndPassword(body);

        const { accessToken, refreshToken } = generateTokens(
            omit(user, 'password')
        );

        await addRefreshTokenToWhitelist({ refreshToken, userId: user.id });

        res.json({
            accessToken,
            refreshToken
        });
    } catch (err) {
        next(err);
    }
}

export async function login(
    { body }: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { email, password } = body;

        if (!email || !password) {
            res.status(400);

            throw new Error('You must provide an email and a password.');
        }

        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            res.status(403);

            throw new Error('Invalid login credentials.');
        }

        const validPassword = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!validPassword) {
            res.status(403);

            throw new Error('Invalid login credentials.');
        }

        const { accessToken, refreshToken } = generateTokens(
            omit(existingUser, 'password')
        );

        await addRefreshTokenToWhitelist({
            refreshToken,
            userId: existingUser.id
        });

        res.json({
            accessToken,
            refreshToken
        });
    } catch (err) {
        next(err);
    }
}

export async function refreshAccessToken(
    { body }: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { refreshToken } = body;

        const savedRefreshToken = await getRefreshToken(refreshToken);

        if (savedRefreshToken) {
            console.log({
                expireAt: savedRefreshToken.expireAt,
                now: new Date(),
                isExpired: Date.now() >= savedRefreshToken.expireAt.getTime()
            });
        }

        if (
            !savedRefreshToken ||
            savedRefreshToken.revoked === true ||
            Date.now() >= savedRefreshToken.expireAt.getTime()
        ) {
            res.status(401);

            throw new Error('Unauthorized');
        }

        const user = await getUserById(savedRefreshToken.userId);

        if (user) {
            await deleteRefreshTokenById(savedRefreshToken.id);

            const { accessToken, refreshToken } = generateTokens(user);

            await addRefreshTokenToWhitelist({
                refreshToken,
                userId: user.id
            });

            res.json({
                accessToken,
                refreshToken
            });
        } else {
            res.status(401);

            throw new Error('Unauthorized');
        }
    } catch (err) {
        next(err);
    }
}
