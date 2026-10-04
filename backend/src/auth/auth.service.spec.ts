import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { hashToken } from './token.util';

type UsersMock = jest.Mocked<
  Pick<
    UsersService,
    | 'findByEmail'
    | 'findByEmailWithPassword'
    | 'findById'
    | 'findByPasswordResetToken'
    | 'findByVerificationToken'
    | 'create'
    | 'update'
  >
>;

type MailMock = jest.Mocked<
  Pick<
    MailService,
    | 'sendVerificationEmail'
    | 'sendEmailChangeEmail'
    | 'sendPasswordResetEmail'
    | 'sendSecurityNotice'
  >
>;

describe('AuthService', () => {
  let service: AuthService;
  let users: UsersMock;
  let mail: MailMock;
  let logSpies: jest.SpyInstance[];

  const alice = {
    id: 'user-1',
    email: 'a@b.com',
    displayName: 'Alice',
    role: UserRole.USER,
    banned: false,
    emailVerified: false,
  } as User;

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn<Promise<User | null>, [string]>(() =>
        Promise.resolve(null),
      ),
      findByEmailWithPassword: jest.fn<Promise<User | null>, [string]>(() =>
        Promise.resolve(null),
      ),
      findById: jest.fn<Promise<User | null>, [string]>(() =>
        Promise.resolve(null),
      ),
      findByPasswordResetToken: jest.fn<Promise<User | null>, [string]>(() =>
        Promise.resolve(null),
      ),
      findByVerificationToken: jest.fn<Promise<User | null>, [string]>(() =>
        Promise.resolve(null),
      ),
      create: jest.fn((data) =>
        Promise.resolve({ id: 'user-1', role: UserRole.USER, ...data } as User),
      ),
      update: jest.fn(() => Promise.resolve()),
    };
    mail = {
      sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
      sendEmailChangeEmail: jest.fn(() => Promise.resolve(true)),
      sendPasswordResetEmail: jest.fn(() => Promise.resolve(true)),
      sendSecurityNotice: jest.fn(() => Promise.resolve(true)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: MailService, useValue: mail },
        { provide: JwtService, useValue: { sign: () => 'signed-token' } },
      ],
    }).compile();

    service = module.get(AuthService);
    logSpies = (['log', 'info', 'debug', 'warn'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
  });

  afterEach(() => logSpies.forEach((spy) => spy.mockRestore()));

  const expectNothingLogged = () =>
    logSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());

  it('registers a new user and returns a token', async () => {
    const result = await service.register({
      email: 'a@b.com',
      displayName: 'Alice',
      password: 'password123',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('a@b.com');
    expect(users.create).toHaveBeenCalled();
  });

  it('emails the verification token, stores only its hash, and logs nothing', async () => {
    await service.register({
      email: 'a@b.com',
      displayName: 'Alice',
      password: 'password123',
    });

    const [to, name, token] = mail.sendVerificationEmail.mock.calls[0];
    expect(to).toBe('a@b.com');
    expect(name).toBe('Alice');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 256-bit base64url
    const stored = users.create.mock.calls[0][0];
    expect(stored.emailVerificationToken).toBe(hashToken(token));
    expect(stored.emailVerificationToken).not.toBe(token);
    expectNothingLogged();
  });

  it('verifies email by looking up the token hash', async () => {
    users.findByVerificationToken.mockResolvedValueOnce(alice);

    await service.verifyEmail({ token: 'raw-token' });

    expect(users.findByVerificationToken).toHaveBeenCalledWith(
      hashToken('raw-token'),
    );
    expect(users.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ emailVerified: true }),
    );
  });

  it('rejects duplicate registration', async () => {
    users.findByEmail.mockResolvedValueOnce({ id: 'x' } as User);
    await expect(
      service.register({
        email: 'a@b.com',
        displayName: 'Alice',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    users.findByEmailWithPassword.mockResolvedValueOnce({
      ...alice,
      passwordHash,
    });

    const result = await service.login({
      email: 'a@b.com',
      password: 'password123',
    });
    expect(result.accessToken).toBe('signed-token');
  });

  it('rejects invalid credentials', async () => {
    await expect(
      service.login({ email: 'a@b.com', password: 'nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  describe('forgotPassword', () => {
    it('answers identically whether or not the account exists', async () => {
      const unknown = await service.forgotPassword('nobody@b.com');
      users.findByEmail.mockResolvedValueOnce(alice);
      const known = await service.forgotPassword('a@b.com');

      expect(unknown).toEqual(known);
    });

    it('does not email unknown or banned accounts', async () => {
      await service.forgotPassword('nobody@b.com');
      users.findByEmail.mockResolvedValueOnce({ ...alice, banned: true });
      await service.forgotPassword('a@b.com');

      expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(users.update).not.toHaveBeenCalled();
    });

    it('emails a reset token, stores its hash with a 1 hour expiry, and logs nothing', async () => {
      users.findByEmail.mockResolvedValueOnce(alice);
      const before = Date.now();

      await service.forgotPassword('a@b.com');

      const [, , token] = mail.sendPasswordResetEmail.mock.calls[0];
      const update = users.update.mock.calls[0][1];
      expect(update.passwordResetToken).toBe(hashToken(token));
      const expiresIn = update.passwordResetExpires!.getTime() - before;
      expect(expiresIn).toBeGreaterThan(59 * 60 * 1000);
      expect(expiresIn).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
      expectNothingLogged();
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown or expired token', async () => {
      await expect(
        service.resetPassword('bad-token', 'newpassword1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets the new password, consumes the token and revokes sessions', async () => {
      users.findByPasswordResetToken.mockResolvedValueOnce(alice);

      await service.resetPassword('raw-token', 'newpassword1');

      expect(users.findByPasswordResetToken).toHaveBeenCalledWith(
        hashToken('raw-token'),
      );
      const update = users.update.mock.calls[0][1];
      expect(await bcrypt.compare('newpassword1', update.passwordHash!)).toBe(
        true,
      );
      expect(update.passwordResetToken).toBeNull();
      expect(update.passwordResetExpires).toBeNull();
      expect(update.passwordChangedAt).toBeInstanceOf(Date);
      expect(mail.sendSecurityNotice).toHaveBeenCalledWith(
        'a@b.com',
        'Alice',
        expect.any(String),
      );
    });
  });
});
