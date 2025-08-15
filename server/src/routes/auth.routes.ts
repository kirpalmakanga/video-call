import type { RequestHandler } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    emailSchema,
    updatePasswordSchema,
    verificationTokenSchema,
    resetTokenSchema,
    resetPasswordSchema
} from '../validation/auth.validation';
import {
    login,
    register,
    refreshAccessToken,
    updatePassword,
    verifyEmail,
    requestVerificationEmail,
    requestPasswordReset,
    updatePasswordWithResetToken
} from '../controllers/auth.controller';
import { createRouter } from '../utils/routes.utils';

export default createRouter([
    {
        method: 'post',
        path: '/register',
        middlewares: [validateRequest({ body: registerSchema })],
        handler: register
    },
    {
        method: 'post',
        path: '/verify/send',
        middlewares: [validateRequest({ body: emailSchema })],
        handler: requestVerificationEmail
    },
    {
        method: 'get',
        path: '/verify/:verificationToken',
        middlewares: [validateRequest({ params: verificationTokenSchema })],
        handler: verifyEmail as RequestHandler
    },
    {
        method: 'post',
        path: '/login',
        middlewares: [validateRequest({ body: loginSchema })],
        handler: login
    },
    {
        method: 'post',
        path: '/refresh',
        middlewares: [validateRequest({ body: refreshTokenSchema })],
        handler: refreshAccessToken
    },
    {
        method: 'put',
        path: '/password',
        middlewares: [
            isAuthenticated,
            validateRequest({ body: updatePasswordSchema })
        ],
        handler: updatePassword as RequestHandler
    },
    {
        method: 'post',
        path: '/forgot-password',
        middlewares: [validateRequest({ body: emailSchema })],
        handler: requestPasswordReset
    },
    {
        method: 'post',
        path: '/reset-password/:resetToken',
        middlewares: [
            validateRequest({
                params: resetTokenSchema,
                body: resetPasswordSchema
            })
        ],
        handler: updatePasswordWithResetToken as RequestHandler
    }
]);
