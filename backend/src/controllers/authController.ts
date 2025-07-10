import * as userModel from '../models/userModel';
import { AuthenticatedRequest } from '../types/express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.createUser(email, hash);
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await userModel.findUserById(req.user!.id);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
