import { Request } from 'express';
import { TokenPayload } from './jswt'

// Extend Express's Request to include a typed `user` field
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}