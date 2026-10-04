import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { AuthUser, JwtPayload } from './jwt-payload.interface';
import { sessionTokenFromCookie } from './session-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      // Browsers use the HttpOnly session cookie. The bearer header remains
      // for non-browser API clients and tests.
      jwtFromRequest: ExtractJwt.fromExtractors([
        sessionTokenFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me-in-production'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.banned) {
      throw new UnauthorizedException('Account suspended');
    }
    // A password change or reset revokes every session issued before it.
    if (
      user.passwordChangedAt &&
      payload.iat !== undefined &&
      Math.floor(user.passwordChangedAt.getTime() / 1000) > payload.iat
    ) {
      throw new UnauthorizedException('Session expired');
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      emailVerified: user.emailVerified,
      banned: user.banned,
    };
  }
}
