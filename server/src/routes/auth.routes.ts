import { Router } from 'express';
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

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);

router.post('/login', validateRequest({ body: loginSchema }), login);

router.post(
    '/refresh',
    validateRequest({ body: refreshTokenSchema }),
    refreshAccessToken
);

router.put(
    '/password',
    isAuthenticated,
    validateRequest({ body: updatePasswordSchema }),
    updatePassword
);

export default router;
