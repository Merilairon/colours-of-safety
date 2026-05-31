import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'findByEmailWithPassword' | 'create'>
  >;

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(() => Promise.resolve(null)),
      findByEmailWithPassword: jest.fn(() => Promise.resolve(null)),
      create: jest.fn((data) =>
        Promise.resolve({
          id: 'user-1',
          role: UserRole.USER,
          ...data,
        } as User),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: { sign: () => 'signed-token' } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

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
      id: 'user-1',
      email: 'a@b.com',
      displayName: 'Alice',
      role: UserRole.USER,
      passwordHash,
    } as User);

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
});
