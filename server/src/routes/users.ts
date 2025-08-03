import { Router } from 'express';
import { isAuthenticated } from '../middlewares';
import { omit } from '../utils/helpers';
import { getUserById } from '../controllers/users';

const router = Router();

router.get('/profile', isAuthenticated, async ({ userId }, res, next) => {
    try {
        if (userId) {
            const user = await getUserById(userId);

            res.json(omit(user, 'password'));
        }
    } catch (err) {
        next(err);
    }
});

export default router;
