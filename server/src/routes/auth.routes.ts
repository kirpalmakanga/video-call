import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    updatePasswordSchema
} from '../validation/auth.validation';
import {
    login,
    register,
    refreshAccessToken,
    updatePassword
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
        handler: updatePassword
    }
]);
