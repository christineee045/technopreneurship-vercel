import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
}

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
}

export {};