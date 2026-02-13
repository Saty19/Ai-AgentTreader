import { pool } from '../../../core/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../core/auth';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: string;
}

export class AuthService {
  async register(email: string, password: string): Promise<{ token: string; user: any }> {
    // Check if user exists
    const [existing] = await pool.query<User[]>('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Insert user
    const [result]: any = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hash]
    );

    const user = {
      id: result.insertId,
      email,
      role: 'user'
    };

    // Generate token
    const token = generateToken(user);

    return { token, user };
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    // Find user
    const [users] = await pool.query<User[]>('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return { 
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
    };
  }

  async getMe(userId: number) {
      const [users] = await pool.query<User[]>('SELECT id, email, role, created_at FROM users WHERE id = ?', [userId]);
      return users[0];
  }
}
