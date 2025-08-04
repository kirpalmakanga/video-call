import { Router } from 'express';
import { login, register, refreshAccessToken } from '../controllers/auth';
import { validate } from '../middlewares/validation';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema
} from '../validation/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

router.post('/refresh', validate(refreshTokenSchema), refreshAccessToken);

// This endpoint is only for demo purpose.
// Move this logic where you need to revoke the tokens( for ex, on password reset)
// router.post('/revokeRefreshTokens', async (req, res, next) => {
//   try {
//     const { userId } = req.body;
//     await revokeTokens(userId);
//     res.json({ message: `Tokens revoked for user with id #${userId}` });
//   } catch (err) {
//     next(err);
//   }
// });

export default router;
