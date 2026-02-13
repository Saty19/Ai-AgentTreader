import { Router } from 'express';
import { AuthController } from './controllers/AuthController';
import { authMiddleware } from '../../core/auth';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authMiddleware, controller.getMe as any);

export default router;
