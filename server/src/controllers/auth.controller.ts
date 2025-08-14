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
import {
    badRequest,
    forbidden,
    success,
    unauthorized
} from '../utils/response';
import { type User } from '../../generated/prisma';

const { CLIENT_URI } = process.env;

async function generateUserTokens(user: User) {
    const tokens = await generateTokens(omit(user, 'password'));

    await addRefreshTokenToWhitelist({
        refreshToken: tokens.refreshToken,
        userId: user.id
    });

    return tokens;
}

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
            return badRequest(res, 'Email already in use.');
        }

        const verificationToken = createVerificationToken();

        await createUser({ ...body, verificationToken });

        await sendVerificationEmail(email, verificationToken);

        success(res);
    } catch (error) {
        next(error);
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

            success(res);
        } else {
            badRequest(res, 'This user has already been verified.');
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
            badRequest(res, 'Invalid verification token');
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

        const user = await getUserByEmail(email);

        if (!user) {
            return forbidden(res, 'Unknown user email.');
        }

        if (user.status !== 'ACTIVE') {
            await sendNewVerificationToken(email);

            return forbidden(res, 'Unverified user.');
        }

        const isValidPassword = await validatePassword(password, user.password);

        if (!isValidPassword) {
            return forbidden(res, 'Invalid password.');
        }

        const tokens = await generateUserTokens(user);

        success(res, tokens);
    } catch (error) {
        next(error);
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
            return unauthorized(res, 'Invalid refresh token.');
        }

        const user = await getUserById(savedRefreshToken.userId);

        if (user) {
            await deleteRefreshTokenById(savedRefreshToken.id);

            const tokens = await generateUserTokens(user);

            success(res, tokens);
        } else {
            badRequest(res, 'Unknown user.');
        }
    } catch (error) {
        next(error);
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

        success(res);
    } catch (error) {
        next(error);
    }
}
