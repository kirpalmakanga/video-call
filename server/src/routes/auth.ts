import { Router } from 'express';
import bcrypt from 'bcrypt';
import { generateTokens } from '../utils/jwt';
import {
    addRefreshTokenToWhitelist,
    getRefreshToken,
    deleteRefreshTokenById,
    revokeTokens
} from '../controllers/auth';
import {
    getUserByEmail,
    createUserByEmailAndPassword,
    getUserById
} from '../controllers/users';
import { validate } from '../middlewares';
import {
    loginSchema,
    refreshTokenSchema,
    registerSchema
} from '../validation/auth';

const router = Router();

router.post(
    '/register',
    validate(registerSchema),
    async ({ body }, res, next) => {
        try {
            const { email, password } = body;

            if (!email || !password) {
                res.status(400);

                throw new Error('You must provide an email and a password.');
            }

            const existingUser = await getUserByEmail(email);

            if (existingUser) {
                res.status(400);

                throw new Error('Email already in use.');
            }

            const user = await createUserByEmailAndPassword(body);

            const { accessToken, refreshToken } = generateTokens(user);

            await addRefreshTokenToWhitelist({ refreshToken, userId: user.id });

            res.json({
                accessToken,
                refreshToken
            });
        } catch (err) {
            next(err);
        }
    }
);

router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('You must provide an email and a password.');
        }

        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            res.status(403);

            throw new Error('Invalid login credentials.');
        }

        const validPassword = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!validPassword) {
            res.status(403);

            throw new Error('Invalid login credentials.');
        }

        const { accessToken, refreshToken } = generateTokens(existingUser);

        await addRefreshTokenToWhitelist({
            refreshToken,
            userId: existingUser.id
        });

        res.json({
            accessToken,
            refreshToken
        });
    } catch (err) {
        next(err);
    }
});

router.post(
    '/refresh',
    validate(refreshTokenSchema),
    async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            const savedRefreshToken = await getRefreshToken(refreshToken);

            if (savedRefreshToken) {
                console.log({
                    expireAt: savedRefreshToken.expireAt,
                    now: new Date(),
                    isExpired:
                        Date.now() >= savedRefreshToken.expireAt.getTime()
                });
            }

            if (
                !savedRefreshToken ||
                savedRefreshToken.revoked === true ||
                Date.now() >= savedRefreshToken.expireAt.getTime()
            ) {
                res.status(401);

                throw new Error('Unauthorized');
            }

            const user = await getUserById(savedRefreshToken.userId);

            if (user) {
                await deleteRefreshTokenById(savedRefreshToken.id);

                const { accessToken, refreshToken } = generateTokens(user);

                await addRefreshTokenToWhitelist({
                    refreshToken,
                    userId: user.id
                });

                res.json({
                    accessToken,
                    refreshToken
                });
            } else {
                res.status(401);

                throw new Error('Unauthorized');
            }
        } catch (err) {
            next(err);
        }
    }
);

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
