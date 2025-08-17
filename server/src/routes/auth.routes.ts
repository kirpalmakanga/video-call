import type { H3 } from 'h3';
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
                handler: register
            },
            {
                method: 'POST',
                path: '/verify/send',
                handler: requestVerificationEmail
            },
            {
                method: 'GET',
                path: '/verify/:verificationToken',
                handler: verifyEmail
            },
            {
                method: 'POST',
                path: '/login',
                handler: login
            },
            {
                method: 'POST',
                path: '/refresh',
                handler: refreshAccessToken
            },
            {
                method: 'PUT',
                path: '/password',
                handler: updatePassword,
                options: {
                    meta: { authenticated: true }
                }
            },
            {
                method: 'POST',
                path: '/forgot-password',
                handler: requestPasswordReset
            },
            {
                method: 'POST',
                path: '/reset-password/:resetToken',
                handler: updatePasswordWithResetToken
            }
        ]
    });
}
