import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from './config';

export interface AuthRequest extends Request {
  user?: any;
}

export const generateToken = (user: { id: number; email: string; role: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret || 'default_secret_change_me',
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret || 'default_secret_change_me');
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
