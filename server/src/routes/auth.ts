import { Router } from 'express';
import { login, register, refreshAccessToken } from '../controllers/auth';
import { validateRequest } from '../middlewares/validation';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema
} from '../validation/auth';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);

router.post('/login', validateRequest({ body: loginSchema }), login);

router.post(
    '/refresh',
    validateRequest({ body: refreshTokenSchema }),
    refreshAccessToken
);

export default router;
