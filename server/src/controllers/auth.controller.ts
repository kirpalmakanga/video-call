import type { NextFunction, Request, Response } from 'express';
import { generateTokens } from '../utils/jwt.utils';
import {
    addRefreshTokenToWhitelist,
    getRefreshToken,
    deleteRefreshTokenById
} from '../services/auth.service';
import {
    getUserByEmail,
    createUser,
    getUserById,
    updateUserPassword,
    getUserByVerificationToken,
    updateUser,
    updateUserVerificationToken
} from '../services/users.service';
import { createVerificationToken, validatePassword } from '../utils/auth.utils';
import { omit } from '../utils/helpers.utils';
import { sendVerificationEmail } from '../utils/mail.utils';

const { CLIENT_URI } = process.env;

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
        const { email } = body;
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            res.status(400);

            throw new Error('Email already in use.');
        }

        const verificationToken = createVerificationToken();

        await createUser({ ...body, verificationToken });

        await sendVerificationEmail(email, verificationToken);

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

interface SendVerificationRequest extends Request {
    body: { email: string };
}

async function sendNewVerificationToken(email: string) {
    const verificationToken = createVerificationToken();

    await updateUserVerificationToken(email, verificationToken);

    await sendVerificationEmail(email, verificationToken);
}

export async function resendVerificationEmail(
    { body: { email } }: SendVerificationRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            res.status(400);

            throw new Error('This user does not exist.');
        }

        if (user.status === 'PENDING') {
            await sendNewVerificationToken(email);

            res.status(204).send();
        } else {
            res.status(400);

            throw new Error('This user has already been verified.');
        }
    } catch (error) {
        next(error);
    }
}

interface VerifyEmailRequest extends Request {
    params: { token: string };
}

export async function verifyEmail(
    { params: { token } }: VerifyEmailRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserByVerificationToken(token);

        if (user) {
            await updateUser(user.id, {
                status: 'ACTIVE',
                verificationToken: null
            });

            res.redirect(`${CLIENT_URI}/register/verified`);
        } else {
            res.status(400);

            throw new Error('Invalid or expired verification token');
        }
    } catch (error) {
        next(error);
    }
}

export async function login(
    { body }: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { email, password } = body;

        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            res.status(403);

            throw new Error('Unknown user email.');
        }

        if (existingUser.status !== 'ACTIVE') {
            res.status(401);

            /** TODO: Send verification email ? */
            await sendNewVerificationToken(email);

            throw new Error(`Unverified user.`);
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
