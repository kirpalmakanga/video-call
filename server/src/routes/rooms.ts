import { Router } from 'express';
import { index, show, insert, update } from '../controllers/rooms';
import { isAuthenticated } from '../middlewares/auth';
import { createRoomSchema } from '../validation/rooms';
import { validateBody } from '../middlewares/validation';

const router = Router();

router.get('/', isAuthenticated, index);

router.get('/:roomId', isAuthenticated, show);

router.post('/', isAuthenticated, validateBody(createRoomSchema), insert);

router.put('/:roomId', isAuthenticated, validateBody(createRoomSchema), update);

export default router;
