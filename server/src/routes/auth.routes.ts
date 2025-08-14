import type { RequestHandler } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    updatePasswordSchema,
    verifyEmailSchema
} from '../validation/auth.validation';
import {
    login,
    register,
    refreshAccessToken,
    updatePassword,
    verifyEmail
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
        method: 'get',
        path: '/verify/:token',
        middlewares: [validateRequest({ params: verifyEmailSchema })],
        handler: verifyEmail as RequestHandler
    }
]);
