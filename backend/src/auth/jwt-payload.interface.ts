import { UserRole } from '../users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  banned: boolean;
  /** Issued-at (seconds), set by the JWT library when signing. */
  iat?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  banned: boolean;
}
