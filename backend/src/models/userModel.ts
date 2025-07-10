import db from '../utils/db';
import { QueryResult } from 'pg';
import { User } from '../types/User';

export async function createUser(email: string, passwordHash: string): Promise<Pick<User, 'id' | 'email'>> {
  const result: QueryResult<Pick<User, 'id' | 'email'>> = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const result: QueryResult<User> = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function findUserById(id: number): Promise<Pick<User, 'id' | 'email'> | undefined> {
  const result: QueryResult<Pick<User, 'id' | 'email'>> = await db.query(
    'SELECT id, email FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}
