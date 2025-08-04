import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { profile } from '../controllers/users';

const router = Router();

router.get('/profile', isAuthenticated, profile);

export default router;
