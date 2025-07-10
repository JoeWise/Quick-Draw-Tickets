import { Router } from 'express';
import { signup, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected route
router.get('/me', authenticate, getMe);

export default router;
