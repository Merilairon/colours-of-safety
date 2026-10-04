import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthUser, JwtPayload } from './jwt-payload.interface';
import { generateToken, hashToken } from './token.util';

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_RESET_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = generateToken();

    const user = await this.users.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      pronouns: dto.pronouns,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });

    void this.mail.sendVerificationEmail(
      user.email,
      user.displayName,
      verificationToken,
    );

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
    const user = await this.users.findByVerificationToken(hashToken(dto.token));
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

  /** Authenticated, so it cannot be used to probe which emails are registered. */
  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    const verificationToken = generateToken();
    await this.users.update(user.id, {
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });

    void this.mail.sendVerificationEmail(
      user.email,
      user.displayName,
      verificationToken,
    );

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
    // Revokes every other session; the controller issues a fresh cookie.
    await this.users.update(userId, {
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    void this.mail.sendSecurityNotice(
      user.email,
      user.displayName,
      'Your password was changed',
    );
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
    const token = generateToken();
    await this.users.update(userId, {
      pendingEmail: newEmail,
      emailChangeToken: hashToken(token),
      emailChangeExpires: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });
    void this.mail.sendEmailChangeEmail(newEmail, user.displayName, token);
    return { message: 'Verification email sent' };
  }

  async confirmEmailChange(token: string): Promise<{ message: string }> {
    const user = await this.users.findByEmailChangeToken(hashToken(token));
    if (!user || !user.pendingEmail) {
      throw new NotFoundException('Invalid or expired email change token');
    }
    const existing = await this.users.findByEmail(user.pendingEmail);
    if (existing && existing.id !== user.id) {
      throw new ConflictException('Email is already registered');
    }
    const previousEmail = user.email;
    await this.users.update(user.id, {
      email: user.pendingEmail,
      // Following the link proves ownership of the new address.
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeExpires: null,
    });
    void this.mail.sendSecurityNotice(
      previousEmail,
      user.displayName,
      `Your sign-in email was changed to ${user.pendingEmail}`,
    );
    return { message: 'Email updated successfully' };
  }

  /**
   * Always answers with the same message, whether or not the account exists,
   * so the endpoint cannot be used to enumerate registered emails.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.users.findByEmail(email);
    if (user && !user.banned) {
      const token = generateToken();
      await this.users.update(user.id, {
        passwordResetToken: hashToken(token),
        passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      });
      void this.mail.sendPasswordResetEmail(
        user.email,
        user.displayName,
        token,
      );
    }
    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.users.findByPasswordResetToken(hashToken(token));
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset link');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.update(user.id, {
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetToken: null,
      passwordResetExpires: null,
      // Receiving the reset email proves ownership of the address.
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    void this.mail.sendSecurityNotice(
      user.email,
      user.displayName,
      'Your password was reset',
    );
    return { message: 'Password reset. You can now log in.' };
  }

  async sessionFor(userId: string): Promise<AuthResult> {
    const user = await this.users.findById(userId);
    if (!user || user.banned) {
      throw new UnauthorizedException();
    }
    return this.buildResult(user);
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
