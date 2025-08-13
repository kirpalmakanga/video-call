import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createRoomSchema } from '../validation/rooms.validation';
import { index, show, insert, update } from '../controllers/rooms.controller';

const router = Router();

router.get('/', isAuthenticated, index);

router.get('/:roomId', isAuthenticated, show);

router.post(
    '/',
    isAuthenticated,
    validateRequest({ body: createRoomSchema }),
    insert
);

router.put(
    '/:roomId',
    isAuthenticated,
    validateRequest({ body: createRoomSchema }),
    update
);

export default router;
