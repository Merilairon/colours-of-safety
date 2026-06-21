import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<
    Pick<
      Repository<User>,
      | 'create'
      | 'save'
      | 'findOne'
      | 'findOneOrFail'
      | 'count'
      | 'find'
      | 'update'
      | 'createQueryBuilder'
    >
  >;

  beforeEach(async () => {
    repo = {
      create: jest.fn((dto: Partial<User>) => dto as User),
      save: jest.fn((user: User) => Promise.resolve({ id: 'user-1', ...user })),
      findOne: jest.fn(() => Promise.resolve(null)),
      findOneOrFail: jest.fn(() => Promise.resolve({ id: 'user-1' } as User)),
      count: jest.fn(() => Promise.resolve(0)),
      find: jest.fn(() => Promise.resolve([])),
      update: jest.fn(() => Promise.resolve({ affected: 1 } as never)),
      createQueryBuilder: jest.fn(() =>
        createMockQueryBuilder({ getOne: () => Promise.resolve(null) }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  function createMockQueryBuilder(overrides: Record<string, jest.Mock> = {}) {
    const mock = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(() => Promise.resolve(null)),
      ...overrides,
    };
    return mock;
  }

  describe('create', () => {
    it('creates and saves a user', async () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: 'hashedpassword',
      };

      await service.create(data);

      expect(repo.create).toHaveBeenCalledWith(data);
      expect(repo.save).toHaveBeenCalled();
    });

    it('creates user with specified role', async () => {
      const data = {
        email: 'admin@example.com',
        displayName: 'Admin User',
        passwordHash: 'hashedpassword',
        role: UserRole.ADMIN,
      };

      await service.create(data);

      expect(repo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('findById', () => {
    it('returns user by id', async () => {
      const user = { id: 'user-1', email: 'test@example.com' } as User;
      repo.findOne.mockResolvedValueOnce(user);

      const result = await service.findById('user-1');

      expect(result).toBe(user);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('returns null when user not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      const user = { id: 'user-1', email: 'test@example.com' } as User;
      repo.findOne.mockResolvedValueOnce(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBe(user);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null when email not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('queries with password hash exposed', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'secret',
      } as User;
      const mockGetOne = jest.fn().mockResolvedValue(user);
      repo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder({ getOne: mockGetOne }),
      );

      const result = await service.findByEmailWithPassword('test@example.com');

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(result).toBe(user);
    });

    it('returns null when email not found with password query', async () => {
      repo.createQueryBuilder.mockReturnValueOnce(createMockQueryBuilder());

      const result = await service.findByEmailWithPassword(
        'nonexistent@example.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('returns total user count', async () => {
      repo.count.mockResolvedValueOnce(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(repo.count).toHaveBeenCalled();
    });
  });

  describe('listAll', () => {
    it('returns all users', async () => {
      const users = [{ id: 'user-1' }, { id: 'user-2' }] as User[];
      repo.find.mockResolvedValueOnce(users);

      const result = await service.listAll();

      expect(result).toBe(users);
      expect(repo.find).toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    it('updates user role and returns updated user', async () => {
      const updatedUser = { id: 'user-1', role: UserRole.REVIEWER } as User;
      repo.findOneOrFail.mockResolvedValueOnce(updatedUser);

      const result = await service.assignRole('user-1', UserRole.REVIEWER);

      expect(repo.update).toHaveBeenCalledWith('user-1', {
        role: UserRole.REVIEWER,
      });
      expect(result).toBe(updatedUser);
    });
  });
});
