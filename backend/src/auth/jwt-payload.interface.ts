import { UserRole } from '../users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  banned: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  banned: boolean;
}
