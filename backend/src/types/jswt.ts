import { JwtPayload } from 'jsonwebtoken';

// Defines what the token contains
export interface TokenPayload extends JwtPayload {
    id: number;
}