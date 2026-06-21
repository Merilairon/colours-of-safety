import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { BanUserDto } from './dto/ban-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './user.entity';

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

  @Patch(':id/ban')
  @Roles(UserRole.ADMIN)
  async ban(
    @Param('id') id: string,
    @Body() dto: BanUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    if (actor.id === id) {
      throw new BadRequestException('Cannot ban yourself');
    }

    const target = await this.users.findById(id);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    return this.users.setBanStatus(id, true, dto.reason);
  }

  @Patch(':id/unban')
  @Roles(UserRole.ADMIN)
  async unban(@Param('id') id: string) {
    const target = await this.users.findById(id);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    return this.users.setBanStatus(id, false);
  }

  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.users.findProfileById(user.id);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return this.toProfileResponse(profile);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.users.updateProfile(user.id, dto);
    return this.toProfileResponse(updated);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: AuthUser) {
    await this.users.deleteAccount(user.id);
    return { message: 'Account deleted' };
  }

  private toProfileResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      pronouns: user.pronouns,
      emailVerified: user.emailVerified,
      banned: user.banned,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      avatar: user.avatar,
      bio: user.bio,
      notificationPreferences: user.notificationPreferences,
      pendingEmail: user.pendingEmail,
      createdAt: user.createdAt,
    };
  }
}
