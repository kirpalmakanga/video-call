import { Router } from 'express';
import { index, show, insert, update } from '../controllers/rooms';
import { isAuthenticated } from '../middlewares/auth';

const router = Router();

router.get('/', isAuthenticated, index);

router.get('/:roomId', isAuthenticated, show);

router.post('/', isAuthenticated, insert);

router.put('/:roomId', isAuthenticated, update);

export default router;
