import type { H3 } from 'h3';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    emailSchema,
    updatePasswordSchema,
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
import { bindRoutes } from '../utils/routes.utils';

export default function useAuthRoutes(app: H3) {
    bindRoutes(app, {
        namespace: 'auth',
        routes: [
            {
                method: 'POST',
                path: '/register',
                handler: register,
                options: {
                    middleware: [validateBody(registerSchema)]
                }
            },
            {
                method: 'POST',
                path: '/verify/send',
                handler: requestVerificationEmail,
                options: {
                    middleware: [validateBody(emailSchema)]
                }
            },
            {
                method: 'GET',
                path: '/verify/:verificationToken',
                handler: verifyEmail
            },
            {
                method: 'POST',
                path: '/login',
                handler: login,
                options: {
                    middleware: [validateBody(loginSchema)]
                }
            },
            {
                method: 'POST',
                path: '/refresh',
                handler: refreshAccessToken,
                options: {
                    middleware: [validateBody(refreshTokenSchema)]
                }
            },
            {
                method: 'PUT',
                path: '/password',
                handler: updatePassword,
                options: {
                    middleware: [
                        isAuthenticated,
                        validateBody(updatePasswordSchema)
                    ]
                }
            },
            {
                method: 'POST',
                path: '/forgot-password',
                handler: requestPasswordReset,
                options: {
                    middleware: [validateBody(emailSchema)]
                }
            },
            {
                method: 'POST',
                path: '/reset-password/:resetToken',
                handler: updatePasswordWithResetToken,
                options: {
                    middleware: [validateBody(resetPasswordSchema)]
                }
            }
        ]
    });
}
