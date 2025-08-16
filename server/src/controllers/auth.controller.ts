import { getRouterParams, H3Event, readValidatedBody, redirect } from 'h3';
import { type User } from '../../generated/prisma';
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
import { generateTokens } from '../utils/jwt.utils';
import { createVerificationToken, validatePassword } from '../utils/auth.utils';
import { omit } from '../utils/helpers.utils';
import {
    sendPasswordResetEmail,
    sendVerificationEmail
} from '../utils/mail.utils';
import {
    badRequest,
    forbidden,
    serverError,
    unauthorized
} from '../utils/response.utils';
import { type UpdatePasswordSchema } from '../validation/auth.validation';

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

interface RegisterRequest {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
    };
}

export async function register(event: H3Event<RegisterRequest>) {
    try {
        const body = await event.req.json();

        const existingUser = await getUserByEmail(body.email);

        if (existingUser) {
            return badRequest('Email already in use.');
        }

        await createUser(body);

        await sendNewVerificationToken(body.email);
    } catch (error) {
        serverError(error);
    }
}

interface SendVerificationRequest {
    body: { email: string };
}

export async function requestVerificationEmail(
    event: H3Event<SendVerificationRequest>
) {
    const { email } = await event.req.json();
    const user = await getUserByEmail(email);

    if (!user) {
        return badRequest('This user does not exist.');
    }

    if (user.status === 'PENDING') {
        await sendNewVerificationToken(email);
    } else {
        badRequest('This user has already been verified.');
    }
}

export async function verifyEmail(event: H3Event<VerifyEmailRequest>) {
    const { verificationToken } = getRouterParams(event);

    if (!verificationToken) {
        badRequest('Missing verification token');
    }

    const user = await getUserByVerificationToken(verificationToken);

    if (user) {
        await updateUser(user.id, {
            status: 'ACTIVE',
            verificationToken: null,
            verificationTokenExpiry: null
        });

        redirect(event, `${CLIENT_URI}/register/verified`);
    } else {
        badRequest('Invalid verification token');
    }
}

interface LoginRequest {
    body: { email: string; password: string };
}

export async function login(event: H3Event<LoginRequest>) {
    const { email, password } = await event.req.json();

    const user = await getUserByEmail(email);

    if (!user) {
        return forbidden('Unknown user email.');
    }

    if (user.status !== 'ACTIVE') {
        await sendNewVerificationToken(email);

        return forbidden('Unverified user.');
    }

    const isValidPassword = await validatePassword(password, user.password);

    if (!isValidPassword) {
        return forbidden('Invalid password.');
    }

    return await generateUserTokens(user);
}

interface RefreshTokenRequest {
    body: { refreshToken: string };
}

export async function refreshAccessToken(event: H3Event<RefreshTokenRequest>) {
    const { refreshToken } = await event.req.json();
    const savedRefreshToken = await getRefreshToken(refreshToken);

    if (
        !savedRefreshToken ||
        savedRefreshToken.revoked === true ||
        savedRefreshToken.expireAt.getTime() <= Date.now()
    ) {
        return unauthorized('Invalid refresh token.');
    }

    const user = await getUserById(savedRefreshToken.userId);

    if (user) {
        await deleteRefreshTokenById(savedRefreshToken.id);

        return await generateUserTokens(user);
    } else {
        badRequest('Unknown user.');
    }
}

interface UpdatePasswordRequest {
    body: { password: string };
}

/** TODO: add user id to auth, add confirmPassword to body for validation */
export async function updatePassword(event: H3Event<UpdatePasswordRequest>) {
    const { password } = await event.req.json();

    await updateUserPassword(userId, password);
}

interface PasswordResetRequest {
    body: { email: string };
}

export async function requestPasswordReset(
    event: H3Event<PasswordResetRequest>
) {
    const { email } = await event.req.json();
    const user = await getUserByEmail(email);

    if (user) {
        const resetToken = createVerificationToken();

        await setUserResetToken(email, resetToken);

        await sendPasswordResetEmail(email, resetToken);
    } else {
        badRequest('Unknown user.');
    }
}

interface ResetPasswordRequest {
    body: UpdatePasswordSchema;
}

export async function updatePasswordWithResetToken(
    event: H3Event<ResetPasswordRequest>
) {
    const { resetToken } = await getRouterParams(event);
    const { password } = await event.req.json();

    if (!resetToken) {
        badRequest('Missing reset token');
    }

    const user = await getUserByResetToken(resetToken);

    if (user) {
        await updateUserPassword(user.id, password);
    } else {
        badRequest('Invalid or expired reset token.');
    }
}
