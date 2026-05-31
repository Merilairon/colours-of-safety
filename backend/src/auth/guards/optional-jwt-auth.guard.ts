import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../jwt-payload.interface';

/**
 * Populates request.user when a valid JWT is present, but allows the request
 * through (as anonymous) when the token is missing or invalid.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser,
  ): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
