import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { UserRole } from './user.entity';
import { UsersService } from './users.service';
import { AssignRoleDto } from './dto/assign-role.dto';

const ASSIGNABLE_BY_ADMIN: UserRole[] = [UserRole.USER, UserRole.REVIEWER];
const ASSIGNABLE_BY_SUPER_ADMIN: UserRole[] = [
  UserRole.USER,
  UserRole.REVIEWER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.users.listAll();
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    if (actor.id === id) {
      throw new BadRequestException('Cannot change your own role');
    }

    const target = await this.users.findById(id);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const allowedRoles =
      actor.role === UserRole.SUPER_ADMIN
        ? ASSIGNABLE_BY_SUPER_ADMIN
        : ASSIGNABLE_BY_ADMIN;

    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException(
        `Role '${dto.role}' cannot be assigned by a ${actor.role}`,
      );
    }

    return this.users.assignRole(id, dto.role);
  }
}
