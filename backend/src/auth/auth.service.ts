import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthUser, JwtPayload } from './jwt-payload.interface';

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.users.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      pronouns: dto.pronouns,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // TODO: Send verification email
    console.log(`Verification token for ${dto.email}: ${verificationToken}`);

    return this.buildResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.banned) {
      throw new UnauthorizedException('Account suspended');
    }
    return this.buildResult(user);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.users.findByVerificationToken(dto.token);
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new NotFoundException('Verification token has expired');
    }

    await this.users.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.users.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // TODO: Send verification email
    console.log(`New verification token for ${email}: ${verificationToken}`);

    return { message: 'Verification email sent' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.update(userId, { passwordHash });
    return { message: 'Password changed successfully' };
  }

  async requestEmailChange(
    userId: string,
    newEmail: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.email === newEmail) {
      throw new BadRequestException(
        'New email must be different from current email',
      );
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Password is incorrect');
    }
    const existing = await this.users.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email is already registered');
    }
    const token = this.generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.users.update(userId, {
      pendingEmail: newEmail,
      emailChangeToken: token,
      emailChangeExpires: expires,
    });
    // TODO: Send verification email to newEmail
    console.log(`Email change token for ${newEmail}: ${token}`);
    return { message: 'Verification email sent' };
  }

  async confirmEmailChange(token: string): Promise<{ message: string }> {
    const user = await this.users.findByEmailChangeToken(token);
    if (!user || !user.pendingEmail) {
      throw new NotFoundException('Invalid or expired email change token');
    }
    const existing = await this.users.findByEmail(user.pendingEmail);
    if (existing && existing.id !== user.id) {
      throw new ConflictException('Email is already registered');
    }
    await this.users.update(user.id, {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeExpires: null,
    });
    return { message: 'Email updated successfully' };
  }

  private generateVerificationToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private buildResult(user: User): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      banned: user.banned,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: user.banned,
      },
    };
  }
}
