import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { getProfile, updateProfile } from '../controllers/users.controller';

const router = Router();

router.get('/profile', isAuthenticated, getProfile);

router.put('/profile', isAuthenticated, updateProfile);

export default router;
