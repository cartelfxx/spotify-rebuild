import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const router = Router();


router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;


    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
    }

    const connection = await pool.getConnection();


    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if ((existingUsers as any[]).length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Kullanıcı adı veya email zaten mevcut' });
    }


    const hashedPassword = await bcrypt.hash(password, 12);


    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const cartelcik = (result as any).insertId;


    const token = (jwt as any).sign(
      { id: cartelcik, username, email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    connection.release();

    res.status(201).json({
      message: 'Kullanıcı başarıyla kaydedildi',
      token,
      user: {
        id: cartelcik,
        username,
        email,
      },
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre gereklidir' });
    }

    const connection = await pool.getConnection();


    const [users] = await connection.execute(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );

    const user = (users as any[])[0];

    if (!user) {
      connection.release();
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }


    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      connection.release();
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }


    const token = (jwt as any).sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    connection.release();

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Erişim tokeni gereklidir' });
    }

    const decoded = (jwt as any).verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    const user = (users as any[])[0];

    if (!user) {
      connection.release();
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    connection.release();

    res.json({ user });
  } catch (error) {
    console.error('Kullanıcı getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});

export default router; 