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
    setUserVerificationToken,
    setUserResetToken,
    getUserByResetToken
} from '../services/users.service';
import { createVerificationToken, validatePassword } from '../utils/auth.utils';
import { omit } from '../utils/helpers.utils';
import {
    sendPasswordResetEmail,
    sendVerificationEmail
} from '../utils/mail.utils';
import {
    badRequest,
    forbidden,
    success,
    unauthorized
} from '../utils/response';
import { type User } from '../../generated/prisma';
import type {
    VerificationTokenSchema,
    ResetTokenSchema,
    UpdatePasswordSchema
} from '../validation/auth.validation';

const { CLIENT_URI } = process.env;

async function generateUserTokens(user: User) {
    const tokens = await generateTokens(omit(user, 'password'));

    await addRefreshTokenToWhitelist({
        refreshToken: tokens.refreshToken,
        userId: user.id
    });

    return tokens;
}

async function sendNewVerificationToken(email: string) {
    const verificationToken = createVerificationToken();

    await setUserVerificationToken(email, verificationToken);

    await sendVerificationEmail(email, verificationToken);
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

        await createUser(body);

        await sendNewVerificationToken(email);

        success(res);
    } catch (error) {
        next(error);
    }
}

interface SendVerificationRequest extends Request {
    body: { email: string };
}

export async function requestVerificationEmail(
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
    params: VerificationTokenSchema;
}

export async function verifyEmail(
    { params: { verificationToken } }: VerifyEmailRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserByVerificationToken(verificationToken);

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

interface PasswordResetRequest extends Request {
    body: { email: string };
}

export async function requestPasswordReset(
    { body: { email } }: PasswordResetRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserByEmail(email);

        if (user) {
            const resetToken = createVerificationToken();

            await setUserResetToken(email, resetToken);

            await sendPasswordResetEmail(email, resetToken);

            success(res);
        } else {
            badRequest(res, 'Unknown user.');
        }
    } catch (error) {
        next(error);
    }
}

interface ResetPasswordRequest extends Request {
    params: ResetTokenSchema;
    body: UpdatePasswordSchema;
}

export async function updatePasswordWithResetToken(
    { params: { resetToken }, body: { password } }: ResetPasswordRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserByResetToken(resetToken);

        if (user) {
            await updateUserPassword(user.id, password);

            success(res);
        } else {
            badRequest(res, 'Invalid or expired reset token.');
        }
    } catch (error) {
        next(error);
    }
}
