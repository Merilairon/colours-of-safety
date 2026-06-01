import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../jwt-payload.interface';
import { UserRole } from '../../users/user.entity';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.REVIEWER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;
    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const hasRole = requiredRoles.some(
      (r: UserRole) => userLevel >= (ROLE_HIERARCHY[r] ?? 0),
    );
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
