import type { NextFunction, Request, Response } from 'express';
import { generateTokens } from '../utils/jwt';
import {
    addRefreshTokenToWhitelist,
    getRefreshToken,
    deleteRefreshTokenById
} from '../services/auth';
import {
    getUserByEmail,
    createUserByEmailAndPassword,
    getUserById,
    updateUserPassword
} from '../services/users';
import { omit } from '../utils/helpers';
import { validatePassword } from '../utils/auth';

interface RegisterRequest extends Request {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
    };
}

export async function register(
    { body }: RegisterRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const existingUser = await getUserByEmail(body.email);

        if (existingUser) {
            res.status(400);

            throw new Error('Email already in use.');
        }

        const user = await createUserByEmailAndPassword(body);

        const { accessToken, refreshToken } = await generateTokens(
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

            throw new Error('Unknown user email.');
        }

        const isValidPassword = await validatePassword(
            password,
            existingUser.password
        );

        if (!isValidPassword) {
            res.status(403);

            throw new Error('Invalid password.');
        }

        const { accessToken, refreshToken } = await generateTokens(
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

interface RefreshTokenRequest extends Request {
    body: { refreshToken: string };
}

export async function refreshAccessToken(
    { body: { refreshToken } }: RefreshTokenRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const savedRefreshToken = await getRefreshToken(refreshToken);

        if (
            !savedRefreshToken ||
            savedRefreshToken.revoked === true ||
            savedRefreshToken.expireAt.getTime() <= Date.now()
        ) {
            res.status(401);

            throw new Error('Unauthorized');
        }

        const user = await getUserById(savedRefreshToken.userId);

        if (user) {
            await deleteRefreshTokenById(savedRefreshToken.id);

            const { accessToken, refreshToken } = await generateTokens(
                omit(user, 'password')
            );

            await addRefreshTokenToWhitelist({
                refreshToken,
                userId: user.id
            });

            res.json({
                accessToken,
                refreshToken
            });
        } else {
            res.status(403);

            throw new Error('Forbidden');
        }
    } catch (err) {
        next(err);
    }
}

interface UpdatePasswordRequest extends AuthenticatedRequest {
    body: { password: string };
}

export async function updatePassword(
    { userId, body }: UpdatePasswordRequest,
    res: Response,
    next: NextFunction
) {
    try {
        await updateUserPassword(userId, body.password);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
