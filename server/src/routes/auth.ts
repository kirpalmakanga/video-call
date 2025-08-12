import { Router } from 'express';
import {
    login,
    register,
    refreshAccessToken,
    updatePassword
} from '../controllers/auth';
import { validateRequest } from '../middlewares/validation';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    updatePasswordSchema
} from '../validation/auth';
import { isAuthenticated } from '../middlewares/auth';

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
