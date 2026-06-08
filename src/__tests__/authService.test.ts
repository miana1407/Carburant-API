import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database', () => ({
  AppDataSource: { getRepository: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('mock.jwt.token') },
}));

import { AppDataSource } from '../config/database';
import { loginUser, registerUser } from '../services/authService';

const mockUser = {
  id: 1,
  email: 'test@test.com',
  role: 'user',
  validatePassword: vi.fn(),
};

const mockRepo = {
  findOneBy: vi.fn(),
  create:    vi.fn(),
  save:      vi.fn(),
};

beforeEach(() => {
  vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as any);
  vi.clearAllMocks();
});

describe('loginUser', () => {
  it('retourne un token si identifiants valides', async () => {
    mockRepo.findOneBy.mockResolvedValue(mockUser);
    mockUser.validatePassword.mockResolvedValue(true);

    const result = await loginUser('test@test.com', 'password123');

    expect(result).toHaveProperty('token', 'mock.jwt.token');
    expect(result.user.email).toBe('test@test.com');
  });

  it('lève une erreur si utilisateur inexistant', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    await expect(loginUser('inconnu@test.com', 'password'))
      .rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('lève une erreur si mot de passe incorrect', async () => {
    mockRepo.findOneBy.mockResolvedValue(mockUser);
    mockUser.validatePassword.mockResolvedValue(false);

    await expect(loginUser('test@test.com', 'mauvais'))
      .rejects.toThrow('INVALID_CREDENTIALS');
  });
});

describe('registerUser', () => {
  it('crée un utilisateur avec un email disponible', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    mockRepo.create.mockReturnValue(mockUser);
    mockRepo.save.mockResolvedValue(mockUser);

    const result = await registerUser('nouveau@test.com', 'password123');

    expect(result).toEqual({ email: 'nouveau@test.com' });
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('lève une erreur si email déjà utilisé', async () => {
    mockRepo.findOneBy.mockResolvedValue(mockUser);

    await expect(registerUser('test@test.com', 'password123'))
      .rejects.toThrow('EMAIL_TAKEN');
  });
});